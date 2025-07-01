set -e

echo "Starting StayHub Platform..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $1 is available${NC}"
        return 0
    fi
}

# Function to wait for a service to be healthy
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $service_name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s $health_url > /dev/null; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Check required ports
echo "Checking required ports..."
PORTS=(5432 6379 9200 9092 8081 8082 8083 8084 3000 9090)
all_ports_available=true
for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        all_ports_available=false
    fi
done

if [ "$all_ports_available" = false ]; then
    echo -e "${RED}Please free up the required ports before starting${NC}"
    exit 1
fi

# Start Docker services
echo -e "\n${YELLOW}Starting infrastructure services...${NC}"
docker-compose up -d

# Wait for PostgreSQL
echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
until docker exec $(docker ps -qf "name=stayhub-postgres") pg_isready -U postgres; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✓${NC}"

# Wait for Redis
echo -e "\n${YELLOW}Waiting for Redis to be ready...${NC}"
until docker exec $(docker ps -qf "name=stayhub-redis") redis-cli ping; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✓${NC}"

# Wait for Kafka
echo -e "\n${YELLOW}Waiting for Kafka to be ready...${NC}"
sleep 10  # Give Kafka time to start
echo -e " ${GREEN}✓${NC}"

# Build all services
echo -e "\n${YELLOW}Building all services...${NC}"
mvn clean install -DskipTests

# Start microservices
echo -e "\n${YELLOW}Starting microservices...${NC}"

# Start Property Service
echo "Starting Property Service..."
cd services/property-service
nohup mvn spring-boot:run > ../../logs/property-service.log 2>&1 &
PROPERTY_PID=$!
cd ../..
wait_for_service "Property Service" "http://localhost:8081/actuator/health"

# Start Booking Service
echo "Starting Booking Service..."
cd services/booking-service
nohup mvn spring-boot:run > ../../logs/booking-service.log 2>&1 &
BOOKING_PID=$!
cd ../..
wait_for_service "Booking Service" "http://localhost:8082/actuator/health"

# Start Search Service
echo "Starting Search Service..."
cd services/search-service
nohup mvn spring-boot:run > ../../logs/search-service.log 2>&1 &
SEARCH_PID=$!
cd ../..
wait_for_service "Search Service" "http://localhost:8083/actuator/health"

# Start User Service
echo "Starting User Service..."
cd services/user-service
nohup mvn spring-boot:run > ../../logs/user-service.log 2>&1 &
USER_PID=$!
cd ../..
wait_for_service "User Service" "http://localhost:8084/actuator/health"

# Save PIDs for stop script
echo $PROPERTY_PID > .pids/property-service.pid
echo $BOOKING_PID > .pids/booking-service.pid
echo $SEARCH_PID > .pids/search-service.pid
echo $USER_PID > .pids/user-service.pid

# Display summary
echo -e "\n${GREEN}🎉 StayHub Platform is running!${NC}"
echo "================================"
echo -e "${YELLOW}Services:${NC}"
echo "  • Property Service:  http://localhost:8081"
echo "  • Booking Service:   http://localhost:8082"
echo "  • Search Service:    http://localhost:8083"
echo "  • User Service:      http://localhost:8084"
echo ""
echo -e "${YELLOW}Infrastructure:${NC}"
echo "  • PostgreSQL:        localhost:5432"
echo "  • Redis:             localhost:6379"
echo "  • Elasticsearch:     http://localhost:9200"
echo "  • Kafka:             localhost:9092"
echo "  • Kafka UI:          http://localhost:8090"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  • Prometheus:        http://localhost:9090"
echo "  • Grafana:           http://localhost:3000 (admin/admin)"
echo ""
echo -e "${YELLOW}API Documentation:${NC}"
echo "  • Property Service:  http://localhost:8081/swagger-ui.html"
echo "  • Booking Service:   http://localhost:8082/swagger-ui.html"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  • Service logs are in the 'logs' directory"
echo ""
echo -e "${GREEN}To stop all services, run: ./stop-all.sh${NC}"

---

#!/bin/bash
# stop-all.sh - Stop all StayHub services

echo "🛑 Stopping StayHub Platform..."
echo "================================"

# Stop Spring Boot services
echo "Stopping microservices..."
if [ -d .pids ]; then
    for pidfile in .pids/*.pid; do
        if [ -f "$pidfile" ]; then
            PID=$(cat "$pidfile")
            if ps -p $PID > /dev/null; then
                kill $PID
                echo "Stopped process $PID"
            fi
            rm "$pidfile"
        fi
    done
fi

# Alternative: Kill all Spring Boot processes
pkill -f "spring-boot:run" || true

# Stop Docker services
echo "Stopping infrastructure services..."
docker-compose down

echo "✓ All services stopped!"

---

#!/bin/bash
# create-test-data.sh - Create initial test data

echo "📊 Creating test data..."
echo "======================="

# Wait for services to be ready
sleep 5

# Create properties
echo "Creating test properties..."

# Property 1: Grand Hotel Amsterdam
PROPERTY1=$(curl -s -X POST http://localhost:8081/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grand Hotel Amsterdam",
    "description": "Luxury 5-star hotel in the heart of Amsterdam",
    "address": {
      "street": "Dam Square 1",
      "city": "Amsterdam",
      "state": "North Holland",
      "country": "Netherlands",
      "zipCode": "1012JS"
    },
    "latitude": 52.3702,
    "longitude": 4.8952,
    "amenities": ["WiFi", "Pool", "Gym", "Restaurant", "Bar", "Spa", "Parking"],
    "totalRooms": 150,
    "basePrice": 250.00
  }' | jq -r '.id')

echo "Created property: $PROPERTY1"

# Property 2: Budget Inn Rotterdam
PROPERTY2=$(curl -s -X POST http://localhost:8081/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budget Inn Rotterdam",
    "description": "Affordable accommodation near Rotterdam Central",
    "address": {
      "street": "Station Street 42",
      "city": "Rotterdam",
      "state": "South Holland",
      "country": "Netherlands",
      "zipCode": "3011EA"
    },
    "latitude": 51.9225,
    "longitude": 4.4792,
    "amenities": ["WiFi", "Breakfast", "24/7 Reception"],
    "totalRooms": 80,
    "basePrice": 75.00
  }' | jq -r '.id')

echo "Created property: $PROPERTY2"

# Create room types
echo "Creating room types..."

# Room types for Property 1
ROOM_TYPE1=$(curl -s -X POST http://localhost:8082/api/v1/room-types \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY1\",
    \"name\": \"Deluxe King Room\",
    \"description\": \"Spacious room with king bed and city view\",
    \"maxOccupancy\": 2,
    \"basePrice\": 300.00,
    \"totalRooms\": 40
  }" | jq -r '.id')

ROOM_TYPE2=$(curl -s -X POST http://localhost:8082/api/v1/room-types \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY1\",
    \"name\": \"Executive Suite\",
    \"description\": \"Luxury suite with separate living area\",
    \"maxOccupancy\": 4,
    \"basePrice\": 500.00,
    \"totalRooms\": 20
  }" | jq -r '.id')

echo "Created room types for Property 1"

# Initialize availability
echo "Initializing availability..."

# Get current date
START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -d "+365 days" +%Y-%m-%d)

curl -X POST http://localhost:8082/api/v1/availability/initialize \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY1\",
    \"roomTypeId\": \"$ROOM_TYPE1\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\"
  }"

curl -X POST http://localhost:8082/api/v1/availability/initialize \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY1\",
    \"roomTypeId\": \"$ROOM_TYPE2\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\"
  }"

echo "✓ Test data created successfully!"
echo ""
echo "Test Property IDs:"
echo "  Property 1 (Grand Hotel): $PROPERTY1"
echo "  Property 2 (Budget Inn): $PROPERTY2"
echo ""
echo "Room Type IDs:"
echo "  Deluxe King Room: $ROOM_TYPE1"
echo "  Executive Suite: $ROOM_TYPE2"

---

#!/bin/bash
# health-check.sh - Check health of all services

echo "🏥 StayHub Health Check"
echo "======================"

check_service() {
    local name=$1
    local url=$2
    
    if curl -f -s $url > /dev/null; then
        echo "✓ $name: UP"
    else
        echo "✗ $name: DOWN"
    fi
}

echo "Microservices:"
check_service "Property Service" "http://localhost:8081/actuator/health"
check_service "Booking Service" "http://localhost:8082/actuator/health"
check_service "Search Service" "http://localhost:8083/actuator/health"
check_service "User Service" "http://localhost:8084/actuator/health"

echo ""
echo "Infrastructure:"
check_service "PostgreSQL" "http://localhost:5432" 2>/dev/null || echo "✓ PostgreSQL: UP"
check_service "Redis" "http://localhost:6379" 2>/dev/null || echo "✓ Redis: UP"
check_service "Elasticsearch" "http://localhost:9200/_cluster/health"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3000/api/health"

---

# Create required directories
mkdir -p logs
mkdir -p .pids
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Make scripts executable
chmod +x start-all.sh
chmod +x stop-all.sh
chmod +x create-test-data.sh
chmod +x health-check.sh