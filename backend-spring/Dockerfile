# 1. Base 이미지 설정 (Java 21)
FROM eclipse-temurin:21-jre-alpine

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 빌드된 JAR 파일을 컨테이너 내부로 복사
# 빌드 시 생성된 plain.jar를 제외한 실제 실행 가능한 jar만 복사
COPY ./build/libs/*.jar app.jar

# 4. 실행 명령어 (운영 profile 적용 준비)
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}", "app.jar"]