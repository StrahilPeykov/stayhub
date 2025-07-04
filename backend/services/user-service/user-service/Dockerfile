FROM maven:3.9.8-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true -T 1C --batch-mode --no-transfer-progress

# List files to verify build
RUN ls -la /app/target/

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y curl dnsutils iputils-ping && \
    rm -rf /var/lib/apt/lists/*

# Copy the JAR file
COPY --from=builder /app/target/*.jar app.jar

# Verify the JAR was copied
RUN ls -la /app/ && echo "JAR file size: $(du -h app.jar)"

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown appuser:appuser /app/app.jar
USER appuser

# Set proper port (Railway will set this automatically)
EXPOSE ${PORT}

# Railway-optimized startup
CMD echo "=== STARTING STAYHUB SERVICE ===" && \
    echo "PORT: ${PORT}" && \
    echo "PGHOST: ${PGHOST}" && \
    echo "JAVA_OPTS: ${JAVA_OPTS}" && \
    echo "SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}" && \
    echo "Max Memory: $(echo ${JAVA_OPTS} | grep -o 'Xmx[0-9]*[mg]')" && \
    echo "Starting application on 0.0.0.0:${PORT}..." && \
    exec java \
         -Dserver.port=${PORT:-8080} \
         -Dserver.address=0.0.0.0 \
         -Djava.security.egd=file:/dev/./urandom \
         -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-railway} \
         -Dlogging.level.org.springframework.boot=INFO \
         -Dlogging.level.org.springframework.web.cors=DEBUG \
         -Dserver.tomcat.max-connections=20 \
         -Dspring.jpa.show-sql=false \
         -Dspring.web.cors.allowed-origins=* \
         -Dspring.web.cors.allowed-methods=* \
         -Dspring.web.cors.allowed-headers=* \
         -XX:+UseG1GC \
         -XX:+UseStringDeduplication \
         -XX:MaxRAMPercentage=75.0 \
         ${JAVA_OPTS:--Xmx400m -Xms200m} \
         -jar app.jar