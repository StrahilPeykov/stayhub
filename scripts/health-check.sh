#!/bin/bash
# Health check script for blue-green deployments

set -e

# Configuration
ENVIRONMENT=${1:-green}
NAMESPACE=${NAMESPACE:-stayhub-prod}
MAX_RETRIES=30
RETRY_INTERVAL=10
REQUIRED_REPLICAS=2

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services to check
SERVICES=(
    "booking-service"
    "property-service"
    "analytics-engine"
    "search-service"
    "user-service"
)

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✓ ${message}${NC}"
            ;;
        "error")
            echo -e "${RED}✗ ${message}${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠ ${message}${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Function to check deployment status
check_deployment() {
    local service=$1
    local deployment_name="${service}-${ENVIRONMENT}"
    
    echo "Checking deployment: $deployment_name"
    
    # Check if deployment exists
    if ! kubectl get deployment "$deployment_name" -n "$NAMESPACE" &>/dev/null; then
        print_status "error" "Deployment $deployment_name not found"
        return 1
    fi
    
    # Get deployment status
    local desired_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    local ready_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    
    if [[ "$ready_replicas" -eq "$desired_replicas" ]] && [[ "$ready_replicas" -ge "$REQUIRED_REPLICAS" ]]; then
        print_status "success" "Deployment $deployment_name is ready ($ready_replicas/$desired_replicas replicas)"
        return 0
    else
        print_status "warning" "Deployment $deployment_name not ready ($ready_replicas/$desired_replicas replicas)"
        return 1
    fi
}

# Function to check pod health
check_pod_health() {
    local service=$1
    local deployment_name="${service}-${ENVIRONMENT}"
    
    # Get pods for deployment
    local pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$service,version=$ENVIRONMENT" -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -z "$pods" ]]; then
        print_status "error" "No pods found for $deployment_name"
        return 1
    fi
    
    # Check each pod
    for pod in $pods; do
        # Check pod status
        local pod_status=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
        if [[ "$pod_status" != "Running" ]]; then
            print_status "error" "Pod $pod is not running (status: $pod_status)"
            return 1
        fi
        
        # Check container readiness
        local ready=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
        if [[ "$ready" != "True" ]]; then
            print_status "error" "Pod $pod is not ready"
            return 1
        fi
        
        print_status "success" "Pod $pod is healthy"
    done
    
    return 0
}

# Function to check service endpoints
check_service_endpoints() {
    local service=$1
    
    # Check if service has endpoints
    local endpoints=$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}')
    
    if [[ -z "$endpoints" ]]; then
        print_status "error" "No endpoints found for service $service"
        return 1
    fi
    
    local endpoint_count=$(echo "$endpoints" | wc -w)
    print_status "success" "Service $service has $endpoint_count endpoints"
    return 0
}

# Function to perform HTTP health check
http_health_check() {
    local service=$1
    local port=$2
    local health_path="/actuator/health"
    
    # Get service IP
    local service_ip=$(kubectl get service "$service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if [[ -z "$service_ip" ]]; then
        print_status "error" "Cannot get IP for service $service"
        return 1
    fi
    
    # Create a temporary pod for health check
    local test_pod="health-check-${service}-$(date +%s)"
    
    # Run health check from within cluster
    kubectl run "$test_pod" \
        --image=curlimages/curl:latest \
        --rm \
        -i \
        --restart=Never \
        -n "$NAMESPACE" \
        -- curl -s -f -m 10 "http://${service_ip}:${port}${health_path}" &>/dev/null
    
    if [[ $? -eq 0 ]]; then
        print_status "success" "HTTP health check passed for $service"
        return 0
    else
        print_status "error" "HTTP health check failed for $service"
        return 1
    fi
}

# Function to check database connectivity
check_database_connectivity() {
    echo "Checking database connectivity..."
    
    # Check PostgreSQL
    local pg_pod=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=postgresql" -o jsonpath='{.items[0].metadata.name}')
    if [[ -n "$pg_pod" ]]; then
        kubectl exec "$pg_pod" -n "$NAMESPACE" -- pg_isready &>/dev/null
        if [[ $? -eq 0 ]]; then
            print_status "success" "PostgreSQL is ready"
        else
            print_status "error" "PostgreSQL is not ready"
            return 1
        fi
    fi
    
    # Check Redis
    local redis_pod=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=redis" -o jsonpath='{.items[0].metadata.name}')
    if [[ -n "$redis_pod" ]]; then
        kubectl exec "$redis_pod" -n "$NAMESPACE" -- redis-cli ping &>/dev/null
        if [[ $? -eq 0 ]]; then
            print_status "success" "Redis is ready"
        else
            print_status "error" "Redis is not ready"
            return 1
        fi
    fi
    
    return 0
}

# Function to run smoke tests
run_smoke_tests() {
    echo "Running smoke tests..."
    
    # Test booking service API
    local booking_service_ip=$(kubectl get service "booking-service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    # Create test pod
    kubectl run smoke-test-$(date +%s) \
        --image=curlimages/curl:latest \
        --rm \
        -i \
        --restart=Never \
        -n "$NAMESPACE" \
        -- sh -c "
            # Test health endpoint
            curl -f http://${booking_service_ip}/actuator/health || exit 1
            
            # Test API endpoint
            curl -f http://${booking_service_ip}/api/v1/bookings/health || exit 1
            
            echo 'Smoke tests passed'
        " &>/dev/null
    
    if [[ $? -eq 0 ]]; then
        print_status "success" "Smoke tests passed"
        return 0
    else
        print_status "error" "Smoke tests failed"
        return 1
    fi
}

# Main health check logic
main() {
    echo "======================================"
    echo "Health Check for $ENVIRONMENT environment"
    echo "Namespace: $NAMESPACE"
    echo "======================================"
    echo
    
    local all_healthy=true
    
    # Check each service
    for service in "${SERVICES[@]}"; do
        echo "Checking $service..."
        echo "--------------------------------------"
        
        # Retry logic
        local retries=0
        local service_healthy=false
        
        while [[ $retries -lt $MAX_RETRIES ]]; do
            local check_passed=true
            
            # Run checks
            check_deployment "$service" || check_passed=false
            check_pod_health "$service" || check_passed=false
            check_service_endpoints "$service" || check_passed=false
            
            # HTTP health check for Java services
            if [[ "$service" != "analytics-engine" ]]; then
                http_health_check "$service" "80" || check_passed=false
            fi
            
            if [[ "$check_passed" == true ]]; then
                service_healthy=true
                break
            fi
            
            retries=$((retries + 1))
            if [[ $retries -lt $MAX_RETRIES ]]; then
                print_status "warning" "Retry $retries/$MAX_RETRIES in $RETRY_INTERVAL seconds..."
                sleep $RETRY_INTERVAL
            fi
        done
        
        if [[ "$service_healthy" == false ]]; then
            print_status "error" "$service is not healthy after $MAX_RETRIES retries"
            all_healthy=false
        else
            print_status "success" "$service is healthy"
        fi
        
        echo
    done
    
    # Check supporting services
    echo "Checking supporting services..."
    echo "--------------------------------------"
    check_database_connectivity || all_healthy=false
    echo
    
    # Run smoke tests
    if [[ "$all_healthy" == true ]]; then
        echo "Running smoke tests..."
        echo "--------------------------------------"
        run_smoke_tests || all_healthy=false
        echo
    fi
    
    # Final result
    echo "======================================"
    if [[ "$all_healthy" == true ]]; then
        print_status "success" "All health checks passed for $ENVIRONMENT environment"
        echo "======================================"
        exit 0
    else
        print_status "error" "Health checks failed for $ENVIRONMENT environment"
        echo "======================================"
        exit 1
    fi
}

# Run main function
main