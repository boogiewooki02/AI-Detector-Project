package com.aidetector.domain.detection.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FastApiResponseDto {
    private Integer label;
    private String labelName;
    private String state;
    private Double confidence;
    private Double ssim;
    private Double lpips;
    private Double rm;
    private Double pvr;
    private String heatmapFilename;
}
