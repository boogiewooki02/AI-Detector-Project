package com.aidetector.domain.detection;

import com.aidetector.domain.detection.dto.DetectionResponseDto;
import com.aidetector.domain.detection.dto.FastApiResponseDto;
import com.aidetector.domain.user.User;
import com.aidetector.domain.user.UserRepository;
import com.aidetector.global.util.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DetectionService {

    private final DetectionRepository detectionRepository;
    private final UserRepository userRepository;
    private final WebClient fastapiClient;
    private final S3Service s3Service;
//    private final FileStore fileStore;

    public DetectionResponseDto requestDetection(MultipartFile file, String email) throws IOException {
        User user = null;

        if (email != null) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        // 원본 이미지 저장
        String s3Url = s3Service.upload(file);

        DetectionRequest detectionRequest = DetectionRequest.builder()
                .user(user) // 비회원이면 null
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
                        response.getHeatmapUrl()
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

    public void deleteDetectionHistory(Long id, String email) {
        log.info("[이력 삭제 시도] User: {}, HistoryId: {}", email, id);

        DetectionRequest request = detectionRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[이력 삭제 실패] 존재하지 않는 ID: {}", id);
                    return new IllegalArgumentException("존재하지 않는 이력입니다.");
                });

        if (!request.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("본인의 이력만 삭제할 수 있습니다.");
        }

        String originalUrl = request.getStoredFilePath();
        String heatmapUrl = request.getHeatmapUrl();

        s3Service.delete(originalUrl);
        s3Service.delete(heatmapUrl);

        detectionRepository.delete(request);
        log.info("[이력 삭제 완료] User: {}, HistoryId: {}", email, id);
    }
}