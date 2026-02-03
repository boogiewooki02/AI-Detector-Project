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

    private Boolean isAiGenerated;
    private Double confidenceScore;

    @Enumerated(EnumType.STRING)
    private DetectionStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder
    public DetectionRequest(User user, String originalFileName, String storedFilePath) {
        this.user = user;
        this.originalFileName = originalFileName;
        this.storedFilePath = storedFilePath;
        this.status = DetectionStatus.PROCESSING; // 초기값 설정
    }

    // 분석 완료 후 데이터를 업데이트하는 비즈니스 메서드
    public void completeDetection(boolean isAiGenerated, double confidenceScore) {
        this.isAiGenerated = isAiGenerated;
        this.confidenceScore = confidenceScore;
        this.status = DetectionStatus.COMPLETED;
    }
}
