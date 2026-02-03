package com.aidetector.domain.detection;

import com.aidetector.domain.user.User;
import com.aidetector.domain.user.UserRepository;
import com.aidetector.global.util.FileStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional
public class DetectionService {

    private final DetectionRepository detectionRepository;
    private final UserRepository userRepository;
    private final FileStore fileStore;

    /**
     * AI 탐지 요청 생성
     * @param file 클라이언트가 업로드한 이미지 파일
     * @param userId 요청한 사용자 고유 ID
     * @return 생성된 탐지 요청의 ID
     */
    public Long requestDetection(MultipartFile file, Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. ID: " + userId));

        String storedFileName = fileStore.storeFile(file);

        DetectionRequest detectionRequest = DetectionRequest.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFilePath(storedFileName)
                .build();

        DetectionRequest savedRequest = detectionRepository.save(detectionRequest);

        return savedRequest.getId();
    }
}
