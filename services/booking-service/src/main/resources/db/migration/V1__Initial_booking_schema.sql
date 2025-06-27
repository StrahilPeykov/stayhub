-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create booking status enum
CREATE TYPE booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'PAYMENT_FAILED',
    'FAILED',
    'EXPIRED'
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL,
    user_id UUID NOT NULL,
    room_type_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_rooms INTEGER NOT NULL CHECK (number_of_rooms > 0),
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status booking_status NOT NULL DEFAULT 'PENDING',
    payment_id VARCHAR(255),
    special_requests TEXT,
    confirmation_code VARCHAR(50) UNIQUE NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_type_id ON bookings(room_type_id);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_bookings_check_out_date ON bookings(check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_confirmation_code ON bookings(confirmation_code);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);

-- Partial index for active bookings
CREATE INDEX idx_active_bookings ON bookings(property_id, check_in_date, check_out_date) 
WHERE status IN ('CONFIRMED', 'PENDING');

-- Create room_types table
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    total_rooms INTEGER NOT NULL CHECK (total_rooms >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_types_property_id ON room_types(property_id);

-- Create availabilities table
CREATE TABLE availabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL,
    room_type_id UUID NOT NULL,
    date DATE NOT NULL,
    total_rooms INTEGER NOT NULL CHECK (total_rooms >= 0),
    available_rooms INTEGER NOT NULL CHECK (available_rooms >= 0),
    booked_rooms INTEGER NOT NULL DEFAULT 0 CHECK (booked_rooms >= 0),
    version BIGINT DEFAULT 0,
    CONSTRAINT uk_availability_property_room_date UNIQUE (property_id, room_type_id, date),
    CONSTRAINT chk_room_consistency CHECK (available_rooms + booked_rooms = total_rooms)
);

-- Create indexes for availability queries
CREATE INDEX idx_availability_property_date ON availabilities(property_id, date);
CREATE INDEX idx_availability_room_type_date ON availabilities(room_type_id, date);
CREATE INDEX idx_availability_available_rooms ON availabilities(available_rooms) WHERE available_rooms > 0;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR AS $$
DECLARE
    code VARCHAR;
BEGIN
    -- Generate a unique confirmation code
    LOOP
        code := 'BK' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE confirmation_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Set default for confirmation code
ALTER TABLE bookings ALTER COLUMN confirmation_code SET DEFAULT generate_confirmation_code();

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Stores all booking information';
COMMENT ON COLUMN bookings.idempotency_key IS 'Used to prevent duplicate bookings';
COMMENT ON COLUMN bookings.version IS 'Used for optimistic locking';

-- services/booking-service/src/main/resources/db/migration/V2__Add_booking_analytics_views.sql

-- Create materialized view for booking statistics
CREATE MATERIALIZED VIEW booking_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as booking_date,
    property_id,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_bookings,
    AVG(total_amount) as avg_booking_value,
    SUM(total_amount) FILTER (WHERE status = 'CONFIRMED') as total_revenue,
    AVG(EXTRACT(DAY FROM check_out_date - check_in_date)) as avg_length_of_stay,
    AVG(number_of_guests::FLOAT / number_of_rooms) as avg_guests_per_room
FROM bookings
GROUP BY booking_date, property_id;

-- Create index on materialized view
CREATE INDEX idx_booking_statistics_date ON booking_statistics(booking_date);
CREATE INDEX idx_booking_statistics_property ON booking_statistics(property_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_booking_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY booking_statistics;
END;
$$ LANGUAGE plpgsql;

-- services/booking-service/src/main/resources/db/migration/V3__Add_audit_tables.sql

-- Create audit table for bookings
CREATE TABLE booking_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_audit_booking_id ON booking_audit(booking_id);
CREATE INDEX idx_booking_audit_user_id ON booking_audit(user_id);
CREATE INDEX idx_booking_audit_created_at ON booking_audit(created_at);

-- Create trigger for booking audit
CREATE OR REPLACE FUNCTION audit_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    changed_fields TEXT[];
BEGIN
    IF TG_OP = 'UPDATE' THEN
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
        
        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each(old_values) o
        JOIN jsonb_each(new_values) n ON o.key = n.key
        WHERE o.value IS DISTINCT FROM n.value;
        
        INSERT INTO booking_audit (
            booking_id, user_id, action, old_values, 
            new_values, changed_fields
        ) VALUES (
            NEW.id, NEW.user_id, TG_OP, old_values, 
            new_values, changed_fields
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO booking_audit (
            booking_id, user_id, action, new_values
        ) VALUES (
            NEW.id, NEW.user_id, TG_OP, to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO booking_audit (
            booking_id, user_id, action, old_values
        ) VALUES (
            OLD.id, OLD.user_id, TG_OP, to_jsonb(OLD)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_booking_changes();

-- services/booking-service/src/main/resources/db/migration/V4__MySQL_replica_schema.sql
-- This would be run on MySQL database for read replicas

/*
CREATE DATABASE IF NOT EXISTS stayhub_reporting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stayhub_reporting;

-- Create bookings replica table
CREATE TABLE bookings_replica (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    room_type_id VARCHAR(36) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_rooms INT NOT NULL,
    number_of_guests INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    confirmation_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    INDEX idx_user_id (user_id),
    INDEX idx_check_in_date (check_in_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_property_dates (property_id, check_in_date, check_out_date)
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED;

-- Create summary table for fast analytics
CREATE TABLE daily_booking_summary (
    summary_date DATE NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    total_bookings INT NOT NULL DEFAULT 0,
    confirmed_bookings INT NOT NULL DEFAULT 0,
    cancelled_bookings INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_booking_value DECIMAL(10,2),
    avg_length_of_stay DECIMAL(5,2),
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_date, property_id),
    INDEX idx_property_id (property_id),
    INDEX idx_summary_date (summary_date)
) ENGINE=InnoDB;

-- Create stored procedure for updating summary
DELIMITER //
CREATE PROCEDURE update_daily_summary(IN p_date DATE)
BEGIN
    REPLACE INTO daily_booking_summary (
        summary_date, property_id, total_bookings, confirmed_bookings,
        cancelled_bookings, total_revenue, avg_booking_value, avg_length_of_stay
    )
    SELECT 
        p_date,
        property_id,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(total_amount) as avg_booking_value,
        AVG(DATEDIFF(check_out_date, check_in_date)) as avg_length_of_stay
    FROM bookings_replica
    WHERE DATE(created_at) = p_date
    GROUP BY property_id;
END//
DELIMITER ;

-- Create event to update summary daily
CREATE EVENT IF NOT EXISTS update_booking_summary_daily
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO CALL update_daily_summary(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));
*/