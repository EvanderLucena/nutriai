FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY gradle/ gradle/
COPY gradlew gradlew
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

COPY src/ src/

RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]