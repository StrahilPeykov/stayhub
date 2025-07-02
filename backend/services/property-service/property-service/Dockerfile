FROM maven:3.9-openjdk-17-slim AS builder

WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -T 1C --batch-mode --no-transfer-progress

FROM openjdk:17-jre-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8081

CMD ["java", "-Xmx400m", "-Xms200m", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]