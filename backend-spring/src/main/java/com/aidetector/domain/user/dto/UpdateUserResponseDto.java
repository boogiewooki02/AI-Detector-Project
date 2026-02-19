package com.aidetector.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UpdateUserResponseDto {
    private String email;
    private String name;
}
