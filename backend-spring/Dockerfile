FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY ./build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}", "app.jar"]