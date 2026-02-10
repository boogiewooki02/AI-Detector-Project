package com.aidetector.domain.detection;

import com.aidetector.domain.detection.dto.DetectionResponseDto;
import com.aidetector.domain.detection.dto.FastApiResponseDto;
import com.aidetector.domain.user.User;
import com.aidetector.domain.user.UserRepository;
import com.aidetector.global.util.FileStore;
import com.aidetector.global.util.S3Service;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class DetectionService {

    private final DetectionRepository detectionRepository;
    private final UserRepository userRepository;
    private final WebClient fastapiClient;
    private final S3Service s3Service;
//    private final FileStore fileStore;

    public DetectionResponseDto requestDetection(MultipartFile file, String email) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 원본 이미지 저장
        String s3Url = s3Service.upload(file);

        DetectionRequest detectionRequest = DetectionRequest.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFilePath(s3Url)
                .build();

        detectionRepository.save(detectionRequest);

        analyzeImage(s3Url, detectionRequest);

        return DetectionResponseDto.fromEntity(detectionRequest);
    }

    private void analyzeImage(String s3Url, DetectionRequest request) {
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_url", s3Url);

            // FastAPI 호출
            FastApiResponseDto response = fastapiClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
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
    public List<DetectionResponseDto> getUserDetectionHistory(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<DetectionRequest> history = detectionRepository.findAllByUserOrderByCreatedAtDesc(user);

        return history.stream()
                .map(DetectionResponseDto::fromEntity)
                .toList();
    }
}