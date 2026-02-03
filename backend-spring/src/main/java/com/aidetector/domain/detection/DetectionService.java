package com.aidetector.domain.detection;

import com.aidetector.domain.user.User;
import com.aidetector.domain.user.UserRepository;
import com.aidetector.global.util.FileStore;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
@Transactional
public class DetectionService {

    private final DetectionRepository detectionRepository;
    private final UserRepository userRepository;
    private final WebClient fastapiClient;
    private final FileStore fileStore;

    public DetectionResponseDto requestDetection(MultipartFile file, Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. ID: " + userId));

        // 1. 파일을 서버 스토리지에 먼저 저장 (이후 MultipartFile 임시파일은 사라져도 무관)
        String storedFileName = fileStore.storeFile(file);

        DetectionRequest detectionRequest = DetectionRequest.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFilePath(storedFileName)
                .build();

        detectionRepository.save(detectionRequest);

        // 2. [수정] 파일 객체 대신, 저장된 파일의 이름을 넘김
        analyzeImage(storedFileName, detectionRequest);

        return DetectionResponseDto.fromEntity(detectionRequest);
    }

    private void analyzeImage(String storedFileName, DetectionRequest request) {
        try {
            // 3. [수정] 저장된 물리 파일을 직접 읽어서 바이트 배열로 로드
            // fileStore.getFullPath() 메서드가 있다면 그것을 사용하고, 없다면 직접 경로를 설정하세요.
            Path path = Paths.get("uploads", storedFileName);
            byte[] fileBytes = Files.readAllBytes(path);

            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return storedFileName;
                }
            };

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", resource, MediaType.IMAGE_JPEG);

            // FastAPI 호출
            FastApiResponseDto response = fastapiClient.post()
                    .uri("/predict")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(FastApiResponseDto.class)
                    .block();

            if (response != null) {
                request.completeAnalysis(
                        response.getLabel(),
                        response.getLabelName(),
                        response.getState(),
                        response.getConfidence(),
                        response.getSsim(),
                        response.getLpips(),
                        response.getRm(),
                        response.getPvr(),
                        response.getHeatmapFilename()
                );
            }
        } catch (Exception e) {
            request.failAnalysis();
            // 로그를 남겨 실제 에러 원인 파악
            System.err.println("FastAPI 통신 에러: " + e.getMessage());
            throw new RuntimeException("AI 서버 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}