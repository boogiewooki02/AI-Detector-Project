package com.aidetector.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdatePasswordRequestDto {
    private String currentPassword;
    private String newPassword;
}
