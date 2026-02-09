package com.aidetector.domain.detection;

import com.aidetector.domain.detection.dto.DetectionResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/detection")
@RequiredArgsConstructor
public class DetectionController {

    private final DetectionService detectionService;
    private final DetectionRepository detectionRepository;

    @PostMapping("/upload")
    public ResponseEntity<DetectionResponseDto> uploadImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email
    ) throws IOException {

        DetectionResponseDto response = detectionService.requestDetection(file, email);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<DetectionResponseDto> getDetectionDetail(
            @PathVariable Long requestId
    ) {
        return ResponseEntity.ok(detectionService.getDetectionDetail(requestId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DetectionResponseDto>> getUserDetectionHistory(
            @AuthenticationPrincipal String email
    ) {
        return ResponseEntity.ok(detectionService.getUserDetectionHistory(email));
    }
}
