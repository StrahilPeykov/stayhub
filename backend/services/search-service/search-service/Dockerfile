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
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Copy the JAR file
COPY --from=builder /app/target/*.jar app.jar

# Verify the JAR was copied
RUN ls -la /app/ && echo "JAR file size: $(du -h app.jar)"

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown appuser:appuser /app/app.jar
USER appuser

# Set proper port
EXPOSE ${PORT}

# Start the application with detailed logging
CMD echo "=== Starting StayHub Service ===" && \
    echo "PORT: ${PORT}" && \
    echo "DATABASE_URL: ${DATABASE_URL}" && \
    echo "JAVA_OPTS: ${JAVA_OPTS}" && \
    echo "SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}" && \
    echo "Max Memory: $(echo ${JAVA_OPTS} | grep -o 'Xmx[0-9]*[mg]')" && \
    echo "Available Memory: $(free -h | grep Mem)" && \
    echo "Starting application..." && \
    exec java \
         -Dserver.port=${PORT:-8080} \
         -Djava.security.egd=file:/dev/./urandom \
         -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-default} \
         -Dlogging.level.org.springframework.boot.web.embedded.tomcat=INFO \
         -Dlogging.level.org.springframework.boot=INFO \
         -Dlogging.level.org.hibernate=WARN \
         -Dlogging.level.org.springframework.boot.actuate=DEBUG \
         -Dlogging.level.com.stayhub=DEBUG \
         -Dserver.tomcat.accept-count=10 \
         -Dserver.tomcat.max-connections=50 \
         -Dspring.jpa.show-sql=false \
         -Dspring.jpa.hibernate.ddl-auto=update \
         -Dmanagement.endpoint.health.show-details=always \
         ${JAVA_OPTS:--Xmx512m -Xms256m -XX:+UseG1GC} \
         -jar app.jar