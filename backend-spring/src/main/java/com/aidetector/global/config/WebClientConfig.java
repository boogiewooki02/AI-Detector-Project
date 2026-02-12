package com.aidetector.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${AI_SERVER_URL:http://localhost:8000}") // 환경 변수 읽기 (기본값 localhost)
    private String aiServerUrl;

    @Bean
    public WebClient fastapiClient() {
        return WebClient.builder()
                .baseUrl(aiServerUrl) // 변수 사용
                .build();
    }
}
