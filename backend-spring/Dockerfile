# 1. 빌드 단계 (Build Stage)
FROM gradle:8-jdk21 AS build
WORKDIR /app

# 라이브러리 캐싱을 위해 설정 파일만 먼저 복사
COPY build.gradle settings.gradle ./
# 라이브러리 미리 다운로드 (빌드 속도 향상의 핵심)
RUN gradle build -x test --parallel --continue > /dev/null 2>&1 || true

# 전체 소스 코드 복사 후 실제 빌드
COPY . .
RUN gradle bootJar -x test

# 2. 실행 단계 (Run Stage)
FROM openjdk:21-slim
WORKDIR /app

# 빌드 단계에서 생성된 jar 파일만 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 배포 환경 설정 및 시간대 설정
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Duser.timezone=Asia/Seoul", "app.jar"]