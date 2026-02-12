package com.aidetector.domain.detection;

import com.aidetector.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "detection_requests")
public class DetectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String originalFileName;
    private String storedFilePath;

    @Enumerated(EnumType.STRING)
    private DetectionStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // --- FastAPI 분석 결과 상세 필드 ---
    private Integer label;             // 0, 1, 2, 3
    private String labelName;          // 예: Real (원본), Noisy Fake 등
    private String state;              // 예: Real, Mid Risk 등
    private Double confidence;         // 모델의 확신도
    private Double ssim;               // 구조 유사도
    private Double lpips;              // 지각 유사도
    private Double rm;                 // 잔차 평균
    private Double pvr;                // 강한 피크 비율
    private String heatmapUrl;         // 저장된 히트맵 파일명 (hm_...)

    @Builder
    public DetectionRequest(User user, String originalFileName, String storedFilePath) {
        this.user = user;
        this.originalFileName = originalFileName;
        this.storedFilePath = storedFilePath;
        this.status = DetectionStatus.PROCESSING; // 생성 시 초기 상태
    }

    public void completeAnalysis(Integer label, String labelName, String state,
                                 Double confidence, Double ssim, Double lpips,
                                 Double rm, Double pvr, String heatmapUrl) {
        this.label = label;
        this.labelName = labelName;
        this.state = state;
        this.confidence = confidence;
        this.ssim = ssim;
        this.lpips = lpips;
        this.rm = rm;
        this.pvr = pvr;
        this.heatmapUrl = heatmapUrl;
        this.status = DetectionStatus.COMPLETED; // 분석 완료 상태로 변경
    }

    public void failAnalysis() {
        this.status = DetectionStatus.FAILED;
    }
}