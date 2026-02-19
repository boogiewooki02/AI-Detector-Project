package com.aidetector.domain.user.dto;

import com.aidetector.domain.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserMeResponseDto {
    private String email;
    private String name;

    public static UserMeResponseDto from(User user) {
        return new UserMeResponseDto(user.getEmail(), user.getName());
    }
}
