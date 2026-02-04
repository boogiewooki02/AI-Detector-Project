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
import java.util.List;

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

        String storedFileName = fileStore.storeFile(file); // 원본 이미지 파일 저장

        DetectionRequest detectionRequest = DetectionRequest.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFilePath(storedFileName)
                .build();

        detectionRepository.save(detectionRequest);

        analyzeImage(storedFileName, detectionRequest);

        return DetectionResponseDto.fromEntity(detectionRequest);
    }

    private void analyzeImage(String storedFileName, DetectionRequest request) {
        try {
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
            System.err.println("FastAPI 통신 에러: " + e.getMessage());
            throw new RuntimeException("AI 서버 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public DetectionResponseDto getDetectionDetail(Long requestId) {
        DetectionRequest request = detectionRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("해당 분석 기록을 찾을 수 없습니다. ID: " + requestId));

        return DetectionResponseDto.fromEntity(request);
    }

    @Transactional(readOnly = true)
    public List<DetectionResponseDto> getUserDetectionHistory(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        return detectionRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DetectionResponseDto::fromEntity)
                .toList();
    }
}