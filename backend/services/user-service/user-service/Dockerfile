FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true -T 1C --batch-mode --no-transfer-progress

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8084

CMD ["java", "-Xmx400m", "-Xms200m", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]