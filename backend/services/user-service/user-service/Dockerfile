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

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

COPY --from=builder /app/target/*.jar app.jar

# Change ownership to spring user
RUN chown spring:spring app.jar

USER spring

# Expose the port that Railway will assign
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Use exec form to ensure proper signal handling
CMD ["java", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-Dserver.port=${PORT:-8080}", \
     "-Xmx400m", \
     "-Xms200m", \
     "-XX:+UseG1GC", \
     "-XX:MaxRAMPercentage=75", \
     "-jar", \
     "app.jar"]