package com.aidetector.domain.user;

import com.aidetector.domain.detection.DetectionRepository;
import com.aidetector.domain.detection.DetectionRequest;
import com.aidetector.domain.user.dto.LoginRequestDto;
import com.aidetector.domain.user.dto.SignupRequestDto;
import com.aidetector.domain.user.dto.TokenResponseDto;
import com.aidetector.domain.user.dto.UpdatePasswordRequestDto;
import com.aidetector.domain.user.dto.UpdateUserRequestDto;
import com.aidetector.domain.user.dto.UpdateUserResponseDto;
import com.aidetector.domain.user.dto.UserMeResponseDto;
import com.aidetector.global.security.JwtTokenProvider;
import com.aidetector.global.util.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final DetectionRepository detectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final S3Service s3Service;

    // 회원가입
    public Long signup(SignupRequestDto requestDto) {
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(requestDto.getEmail())
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .name(requestDto.getName())
                .build();

        return userRepository.save(user).getId();
    }

    // 로그인
    @Transactional(readOnly = true)
    public TokenResponseDto login(LoginRequestDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtTokenProvider.createToken(user.getEmail());

        return new TokenResponseDto(token);
    }

    @Transactional(readOnly = true)
    public UserMeResponseDto getMyInfo(String email) {
        User user = getUserByEmail(email);
        return UserMeResponseDto.from(user);
    }

    public UpdateUserResponseDto updateMyInfo(String email, UpdateUserRequestDto requestDto) {
        User user = getUserByEmail(email);

        if (requestDto.getName() == null || requestDto.getName().isBlank()) {
            throw new IllegalArgumentException("이름은 비어 있을 수 없습니다.");
        }

        user.updateProfile(requestDto.getName().trim());

        return new UpdateUserResponseDto(user.getEmail(), user.getName());
    }

    public void updateMyPassword(String email, UpdatePasswordRequestDto requestDto) {
        User user = getUserByEmail(email);

        if (!passwordEncoder.matches(requestDto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (requestDto.getNewPassword() == null || requestDto.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("새 비밀번호는 비어 있을 수 없습니다.");
        }

        if (passwordEncoder.matches(requestDto.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        user.updatePassword(passwordEncoder.encode(requestDto.getNewPassword()));
    }

    public void withdraw(String email) {
        User user = getUserByEmail(email);

        List<DetectionRequest> userHistory = detectionRepository.findAllByUserOrderByCreatedAtDesc(user);
        for (DetectionRequest history : userHistory) {
            s3Service.delete(history.getStoredFilePath());
            s3Service.delete(history.getHeatmapUrl());
        }

        detectionRepository.deleteAll(userHistory);
        userRepository.delete(user);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
