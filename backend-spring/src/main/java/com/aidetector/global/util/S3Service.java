package com.aidetector.global.util;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String upload(MultipartFile multipartFile) throws IOException {
        // 파일 이름 설정
        String fileName = UUID.randomUUID() + "_" + multipartFile.getOriginalFilename();

        // 메타 데이터 설정 (파일 크기 등)
        ObjectMetadata objMeta = new ObjectMetadata();
        objMeta.setContentLength(multipartFile.getSize());
        objMeta.setContentType(multipartFile.getContentType());

        // S3로 업로드
        amazonS3.putObject(new PutObjectRequest(bucket, fileName, multipartFile.getInputStream(), objMeta));

        // 업로드된 파일의 public url 반환
        return amazonS3.getUrl(bucket, fileName).toString();
    }

    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        try {
            // URL에서 파일명(Key) 추출
            // 예: https://bucket.s3.region.amazonaws.com/filename.png -> filename.png
            String key = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

            String decodeKey = URLDecoder.decode(key, StandardCharsets.UTF_8);

            amazonS3.deleteObject(bucket, decodeKey);
            log.info("S3 파일 삭제 성공: {}", decodeKey);
        } catch (Exception e) {
            log.error("S3 파일 삭제 실패: {}", e.getMessage());
        }
    }
}
