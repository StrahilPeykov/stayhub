FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true -T 1C --batch-mode --no-transfer-progress

# Verify JAR was built
RUN ls -la /app/target/ && \
    if [ ! -f /app/target/*.jar ]; then echo "ERROR: No JAR file found!" && exit 1; fi

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install curl and netcat for health checks and debugging
RUN apt-get update && \
    apt-get install -y curl netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Copy the JAR file
COPY --from=builder /app/target/*.jar app.jar

# Verify the JAR was copied and is valid
RUN ls -la /app/ && \
    echo "JAR file size: $(du -h app.jar)" && \
    file app.jar && \
    jar tf app.jar > /dev/null || (echo "ERROR: Invalid JAR file!" && exit 1)

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown appuser:appuser /app/app.jar
USER appuser

# Set proper port
EXPOSE ${PORT}

# Health check script
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Enhanced startup with better error handling and logging
CMD echo "=== Starting StayHub Service ===" && \
    echo "PORT: ${PORT}" && \
    echo "JAVA_OPTS: ${JAVA_OPTS}" && \
    echo "DATABASE_URL: ${DATABASE_URL:-(not set)}" && \
    echo "SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}" && \
    echo "Available memory: $(free -h)" && \
    echo "Java version: $(java -version 2>&1 | head -1)" && \
    echo "Starting application..." && \
    exec java \
         -Dserver.port=${PORT:-8080} \
         -Djava.security.egd=file:/dev/./urandom \
         -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-default} \
         ${JAVA_OPTS:--Xmx300m -Xms150m -XX:+UseG1GC} \
         -jar app.jar