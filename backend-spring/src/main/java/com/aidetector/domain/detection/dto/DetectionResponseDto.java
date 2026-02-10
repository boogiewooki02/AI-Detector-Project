package com.aidetector.domain.detection.dto;

import com.aidetector.domain.detection.DetectionRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DetectionResponseDto {
    private Long id;
    private String labelName;
    private String state;
    private Double confidence;
    private Double ssim;
    private Double lpips;
    private Double rm;
    private Double pvr;
    private String originalImageUrl;
    private String heatmapImageUrl;

    public static DetectionResponseDto fromEntity(DetectionRequest entity) {
        return DetectionResponseDto.builder()
                .id(entity.getId())
                .labelName(entity.getLabelName())
                .state(entity.getState())
                .confidence(entity.getConfidence())
                .ssim(entity.getSsim())
                .lpips(entity.getLpips())
                .rm(entity.getRm())
                .pvr(entity.getPvr())
                .originalImageUrl(entity.getStoredFilePath())
                .heatmapImageUrl(entity.getHeatmapUrl())
                .build();
    }
}