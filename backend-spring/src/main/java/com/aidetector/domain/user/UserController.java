package com.aidetector.domain.user;

import com.aidetector.domain.user.dto.LoginRequestDto;
import com.aidetector.domain.user.dto.SignupRequestDto;
import com.aidetector.domain.user.dto.TokenResponseDto;
import com.aidetector.domain.user.dto.UpdatePasswordRequestDto;
import com.aidetector.domain.user.dto.UpdateUserRequestDto;
import com.aidetector.domain.user.dto.UpdateUserResponseDto;
import com.aidetector.domain.user.dto.UserMeResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<Long> signup(@RequestBody SignupRequestDto requestDto) {
        return ResponseEntity.ok(userService.signup(requestDto));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto requestDto) {
        return ResponseEntity.ok(userService.login(requestDto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserMeResponseDto> getMyInfo(
            @AuthenticationPrincipal String email
    ) {
        return ResponseEntity.ok(userService.getMyInfo(email));
    }

    @PatchMapping("/me")
    public ResponseEntity<UpdateUserResponseDto> updateMyInfo(
            @AuthenticationPrincipal String email,
            @RequestBody UpdateUserRequestDto requestDto
    ) {
        return ResponseEntity.ok(userService.updateMyInfo(email, requestDto));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> updateMyPassword(
            @AuthenticationPrincipal String email,
            @RequestBody UpdatePasswordRequestDto requestDto
    ) {
        userService.updateMyPassword(email, requestDto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal String email
    ) {
        userService.withdraw(email);
        return ResponseEntity.noContent().build();
    }
}
