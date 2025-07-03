FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true -T 1C --batch-mode --no-transfer-progress

# List files to debug
RUN ls -la /app/target/

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# CRITICAL FIX: Make sure we copy the JAR file correctly
COPY --from=builder /app/target/*.jar app.jar

# Verify the JAR was copied
RUN ls -la /app/ && echo "JAR file size: $(du -h app.jar)"

# Set proper port
EXPOSE ${PORT}

# Add startup debugging and proper error handling
CMD echo "=== Starting application ===" && \
    echo "PORT: ${PORT}" && \
    echo "Files in /app:" && ls -la /app/ && \
    echo "Starting Java application..." && \
    java -Dserver.port=${PORT:-8083} \
         -Djava.security.egd=file:/dev/./urandom \
         -Xmx300m \
         -Xms100m \
         -XX:+UseG1GC \
         -jar app.jar