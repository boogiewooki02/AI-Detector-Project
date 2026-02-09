package com.aidetector.domain.detection;

import com.aidetector.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetectionRepository extends JpaRepository<DetectionRequest, Long> {

    // 특정 사용자의 탐지 기록을 최신순으로 조회
    List<DetectionRequest> findAllByUserOrderByCreatedAtDesc(User user);

    // PROCESSING인 요청만 조회
    List<DetectionRequest> findAllByStatus(DetectionStatus status);
}
