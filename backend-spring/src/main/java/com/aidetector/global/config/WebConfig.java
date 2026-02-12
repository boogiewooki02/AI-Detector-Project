package com.aidetector.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // 프론트 서버의 접근을 허용
                .allowedOrigins(
                        "http://localhost:3000",
                        "https://is-it-ai.site",
                        "https://www.is-it-ai.site",
                        "https://ai-detector-project.vercel.app"
                )
                // 모든 HTTP 메서드 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 모든 헤더 허용
                .allowedHeaders("*")
                // 쿠키 등 인증 정보 포함 허용
                .allowCredentials(true);
    }
}
