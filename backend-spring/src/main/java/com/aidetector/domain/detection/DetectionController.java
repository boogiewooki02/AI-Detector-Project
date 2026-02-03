package com.aidetector.domain.detection;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/detection")
@RequiredArgsConstructor
public class DetectionController {

    private final DetectionService detectionService;
    private final DetectionRepository detectionRepository;

    @PostMapping("/upload")
    public ResponseEntity<DetectionResponseDto> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId
    ) throws IOException {

        DetectionResponseDto response = detectionService.requestDetection(file, userId);

        return ResponseEntity.ok(response);
    }
}
