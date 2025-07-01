-- Create reporting database structure
CREATE DATABASE IF NOT EXISTS stayhub_reporting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stayhub_reporting;

-- Create bookings replica table for read queries
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
    special_requests TEXT,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    INDEX idx_property_id (property_id),
    INDEX idx_user_id (user_id),
    INDEX idx_check_in_date (check_in_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_property_dates (property_id, check_in_date, check_out_date)
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED;

-- Create room types replica table
CREATE TABLE room_types_replica (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_occupancy INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    total_rooms INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id)
) ENGINE=InnoDB;

-- Create summary table for fast analytics
CREATE TABLE daily_booking_summary (
    summary_date DATE NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    total_bookings INT NOT NULL DEFAULT 0,
    confirmed_bookings INT NOT NULL DEFAULT 0,
    cancelled_bookings INT NOT NULL DEFAULT 0,
    pending_bookings INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    confirmed_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_booking_value DECIMAL(10,2),
    avg_length_of_stay DECIMAL(5,2),
    avg_guests_per_booking DECIMAL(5,2),
    occupancy_rate DECIMAL(5,4),
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_date, property_id),
    INDEX idx_property_id (property_id),
    INDEX idx_summary_date (summary_date),
    INDEX idx_total_revenue (total_revenue),
    INDEX idx_occupancy_rate (occupancy_rate)
) ENGINE=InnoDB;

-- Create monthly summary table
CREATE TABLE monthly_booking_summary (
    summary_month DATE NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    total_bookings INT NOT NULL DEFAULT 0,
    confirmed_bookings INT NOT NULL DEFAULT 0,
    cancelled_bookings INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_booking_value DECIMAL(10,2),
    avg_length_of_stay DECIMAL(5,2),
    avg_occupancy_rate DECIMAL(5,4),
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_month, property_id),
    INDEX idx_property_id (property_id),
    INDEX idx_summary_month (summary_month)
) ENGINE=InnoDB;

-- Create stored procedure for updating daily summary
DELIMITER //
CREATE PROCEDURE update_daily_summary(IN p_date DATE)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    REPLACE INTO daily_booking_summary (
        summary_date, property_id, total_bookings, confirmed_bookings,
        cancelled_bookings, pending_bookings, total_revenue, confirmed_revenue,
        avg_booking_value, avg_length_of_stay, avg_guests_per_booking
    )
    SELECT 
        p_date,
        property_id,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as confirmed_revenue,
        AVG(total_amount) as avg_booking_value,
        AVG(DATEDIFF(check_out_date, check_in_date)) as avg_length_of_stay,
        AVG(number_of_guests) as avg_guests_per_booking
    FROM bookings_replica
    WHERE DATE(created_at) = p_date
    GROUP BY property_id;
    
    COMMIT;
END//
DELIMITER ;

-- Create stored procedure for updating monthly summary
DELIMITER //
CREATE PROCEDURE update_monthly_summary(IN p_month DATE)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    REPLACE INTO monthly_booking_summary (
        summary_month, property_id, total_bookings, confirmed_bookings,
        cancelled_bookings, total_revenue, avg_booking_value, avg_length_of_stay
    )
    SELECT 
        DATE_FORMAT(p_month, '%Y-%m-01'),
        property_id,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(total_amount) as avg_booking_value,
        AVG(DATEDIFF(check_out_date, check_in_date)) as avg_length_of_stay
    FROM bookings_replica
    WHERE YEAR(created_at) = YEAR(p_month) AND MONTH(created_at) = MONTH(p_month)
    GROUP BY property_id;
    
    COMMIT;
END//
DELIMITER ;

-- Create event to update summary daily (runs at 2 AM)
CREATE EVENT IF NOT EXISTS update_booking_summary_daily
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO CALL update_daily_summary(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));

-- Create event to update monthly summary (runs on 1st of month at 3 AM)
CREATE EVENT IF NOT EXISTS update_booking_summary_monthly
ON SCHEDULE EVERY 1 MONTH
STARTS (DATE_FORMAT(NOW() + INTERVAL 1 MONTH, '%Y-%m-01') + INTERVAL 3 HOUR)
DO CALL update_monthly_summary(LAST_DAY(NOW() - INTERVAL 1 MONTH) + INTERVAL 1 DAY);

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Create views for common queries
CREATE VIEW booking_stats_today AS
SELECT 
    property_id,
    COUNT(*) as bookings_today,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_today,
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as revenue_today
FROM bookings_replica
WHERE DATE(created_at) = CURDATE()
GROUP BY property_id;

CREATE VIEW booking_stats_week AS
SELECT 
    property_id,
    COUNT(*) as bookings_week,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_week,
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as revenue_week,
    AVG(total_amount) as avg_booking_value_week
FROM bookings_replica
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY property_id;

-- Create indexes for performance
CREATE INDEX idx_bookings_replica_compound ON bookings_replica(property_id, status, created_at);
CREATE INDEX idx_bookings_replica_revenue ON bookings_replica(status, total_amount);

-- Initial data setup (run summary for last 30 days)
DELIMITER //
CREATE PROCEDURE setup_initial_summaries()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE summary_date DATE;
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT DATE(created_at) 
        FROM bookings_replica 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO summary_date;
        IF done THEN
            LEAVE read_loop;
        END IF;
        CALL update_daily_summary(summary_date);
    END LOOP;
    CLOSE cur;
END//
DELIMITER ;