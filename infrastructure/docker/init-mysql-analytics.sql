-- Create analytics database structure
CREATE DATABASE IF NOT EXISTS stayhub_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stayhub_analytics;

-- Create analytics fact table for bookings
CREATE TABLE booking_facts (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booking_date DATE NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    length_of_stay INT NOT NULL,
    number_of_rooms INT NOT NULL,
    number_of_guests INT NOT NULL,
    guests_per_room DECIMAL(5,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_per_night DECIMAL(10,2) NOT NULL,
    amount_per_guest DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    booking_source VARCHAR(50) DEFAULT 'DIRECT',
    is_weekend_booking BOOLEAN DEFAULT FALSE,
    days_in_advance INT NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_days_advance INT,
    created_at TIMESTAMP NOT NULL,
    INDEX idx_property_booking_date (property_id, booking_date),
    INDEX idx_check_in_date (check_in_date),
    INDEX idx_length_of_stay (length_of_stay),
    INDEX idx_total_amount (total_amount),
    INDEX idx_status (status),
    INDEX idx_is_weekend (is_weekend_booking),
    INDEX idx_days_advance (days_in_advance)
) ENGINE=InnoDB;

-- Create property dimensions table
CREATE TABLE property_dimensions (
    property_id VARCHAR(36) PRIMARY KEY,
    property_name VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    total_rooms INT,
    base_price DECIMAL(10,2),
    price_tier VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_price_tier (price_tier)
) ENGINE=InnoDB;

-- Create time dimensions table
CREATE TABLE time_dimensions (
    date_key DATE PRIMARY KEY,
    year INT NOT NULL,
    quarter INT NOT NULL,
    month INT NOT NULL,
    week INT NOT NULL,
    day_of_month INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(10) NOT NULL,
    month_name VARCHAR(10) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    season VARCHAR(10) NOT NULL,
    INDEX idx_year_month (year, month),
    INDEX idx_quarter (quarter),
    INDEX idx_is_weekend (is_weekend),
    INDEX idx_season (season)
) ENGINE=InnoDB;

-- Create revenue aggregations table
CREATE TABLE revenue_aggregations (
    agg_date DATE NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly', 'quarterly') NOT NULL,
    total_bookings INT NOT NULL DEFAULT 0,
    confirmed_bookings INT NOT NULL DEFAULT 0,
    cancelled_bookings INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    confirmed_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_booking_value DECIMAL(10,2),
    avg_length_of_stay DECIMAL(5,2),
    avg_guests_per_booking DECIMAL(5,2),
    total_room_nights INT NOT NULL DEFAULT 0,
    avg_daily_rate DECIMAL(10,2),
    revenue_per_available_room DECIMAL(10,2),
    occupancy_rate DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (agg_date, property_id, period_type),
    INDEX idx_property_period (property_id, period_type),
    INDEX idx_agg_date (agg_date),
    INDEX idx_total_revenue (total_revenue)
) ENGINE=InnoDB;

-- Create user behavior analytics table
CREATE TABLE user_behavior_analytics (
    analysis_date DATE NOT NULL,
    user_segment VARCHAR(50) NOT NULL,
    total_users INT NOT NULL,
    active_users INT NOT NULL,
    new_users INT NOT NULL,
    returning_users INT NOT NULL,
    avg_bookings_per_user DECIMAL(5,2),
    avg_booking_value DECIMAL(10,2),
    avg_advance_booking_days DECIMAL(5,2),
    cancellation_rate DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (analysis_date, user_segment),
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_user_segment (user_segment)
) ENGINE=InnoDB;

-- Create market analysis table
CREATE TABLE market_analysis (
    analysis_date DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    total_properties INT NOT NULL,
    total_bookings INT NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    avg_occupancy_rate DECIMAL(5,4),
    avg_daily_rate DECIMAL(10,2),
    market_share DECIMAL(5,4),
    competitor_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (analysis_date, city, country),
    INDEX idx_city (city),
    INDEX idx_country (country),
    INDEX idx_total_revenue (total_revenue)
) ENGINE=InnoDB;

-- Populate time dimensions for next 5 years
DELIMITER //
CREATE PROCEDURE populate_time_dimensions()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_date DATE DEFAULT CURDATE();
    DECLARE end_date DATE DEFAULT DATE_ADD(CURDATE(), INTERVAL 5 YEAR);
    
    WHILE current_date <= end_date DO
        INSERT IGNORE INTO time_dimensions (
            date_key, year, quarter, month, week, day_of_month, 
            day_of_week, day_name, month_name, is_weekend, season
        ) VALUES (
            current_date,
            YEAR(current_date),
            QUARTER(current_date),
            MONTH(current_date),
            WEEK(current_date),
            DAY(current_date),
            DAYOFWEEK(current_date),
            DAYNAME(current_date),
            MONTHNAME(current_date),
            DAYOFWEEK(current_date) IN (1, 7),
            CASE 
                WHEN MONTH(current_date) IN (12, 1, 2) THEN 'Winter'
                WHEN MONTH(current_date) IN (3, 4, 5) THEN 'Spring'
                WHEN MONTH(current_date) IN (6, 7, 8) THEN 'Summer'
                ELSE 'Fall'
            END
        );
        
        SET current_date = DATE_ADD(current_date, INTERVAL 1 DAY);
    END WHILE;
END//
DELIMITER ;

-- Call the procedure to populate time dimensions
CALL populate_time_dimensions();

-- Create stored procedures for analytics

-- Revenue analysis procedure
DELIMITER //
CREATE PROCEDURE analyze_revenue_trends(
    IN start_date DATE,
    IN end_date DATE,
    IN property_id_filter VARCHAR(36)
)
BEGIN
    SELECT 
        DATE_FORMAT(bf.booking_date, '%Y-%m') as month,
        pd.city,
        COUNT(bf.id) as total_bookings,
        SUM(bf.total_amount) as total_revenue,
        AVG(bf.total_amount) as avg_booking_value,
        AVG(bf.length_of_stay) as avg_length_of_stay,
        AVG(bf.amount_per_night) as avg_daily_rate,
        SUM(bf.number_of_rooms * bf.length_of_stay) as total_room_nights
    FROM booking_facts bf
    JOIN property_dimensions pd ON bf.property_id = pd.property_id
    WHERE bf.booking_date BETWEEN start_date AND end_date
    AND (property_id_filter IS NULL OR bf.property_id = property_id_filter)
    AND bf.status = 'CONFIRMED'
    GROUP BY DATE_FORMAT(bf.booking_date, '%Y-%m'), pd.city
    ORDER BY month DESC, total_revenue DESC;
END//
DELIMITER ;

-- Occupancy analysis procedure
DELIMITER //
CREATE PROCEDURE analyze_occupancy_patterns(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    SELECT 
        pd.property_name,
        pd.city,
        td.day_name,
        td.is_weekend,
        COUNT(bf.id) as bookings,
        SUM(bf.number_of_rooms * bf.length_of_stay) as room_nights,
        AVG(bf.length_of_stay) as avg_stay_length,
        SUM(bf.total_amount) as revenue
    FROM booking_facts bf
    JOIN property_dimensions pd ON bf.property_id = pd.property_id
    JOIN time_dimensions td ON bf.check_in_date = td.date_key
    WHERE bf.check_in_date BETWEEN start_date AND end_date
    AND bf.status = 'CONFIRMED'
    GROUP BY pd.property_id, td.day_of_week, td.is_weekend
    ORDER BY pd.property_name, td.day_of_week;
END//
DELIMITER ;

-- Booking advance analysis
DELIMITER //
CREATE PROCEDURE analyze_booking_advance_patterns()
BEGIN
    SELECT 
        CASE 
            WHEN days_in_advance <= 7 THEN '0-7 days'
            WHEN days_in_advance <= 14 THEN '8-14 days'
            WHEN days_in_advance <= 30 THEN '15-30 days'
            WHEN days_in_advance <= 60 THEN '31-60 days'
            ELSE '60+ days'
        END as advance_booking_range,
        COUNT(*) as booking_count,
        AVG(total_amount) as avg_booking_value,
        AVG(length_of_stay) as avg_length_of_stay,
        SUM(CASE WHEN is_cancelled THEN 1 ELSE 0 END) as cancellations,
        (SUM(CASE WHEN is_cancelled THEN 1 ELSE 0 END) / COUNT(*)) * 100 as cancellation_rate
    FROM booking_facts
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    GROUP BY advance_booking_range
    ORDER BY 
        CASE advance_booking_range
            WHEN '0-7 days' THEN 1
            WHEN '8-14 days' THEN 2
            WHEN '15-30 days' THEN 3
            WHEN '31-60 days' THEN 4
            ELSE 5
        END;
END//
DELIMITER ;

-- Seasonal analysis procedure
DELIMITER //
CREATE PROCEDURE analyze_seasonal_trends(IN analysis_year INT)
BEGIN
    SELECT 
        td.season,
        td.month_name,
        COUNT(bf.id) as total_bookings,
        SUM(bf.total_amount) as total_revenue,
        AVG(bf.total_amount) as avg_booking_value,
        AVG(bf.length_of_stay) as avg_length_of_stay,
        SUM(bf.is_weekend_booking) as weekend_bookings,
        (SUM(bf.is_weekend_booking) / COUNT(bf.id)) * 100 as weekend_booking_percentage
    FROM booking_facts bf
    JOIN time_dimensions td ON bf.booking_date = td.date_key
    WHERE td.year = analysis_year
    AND bf.status = 'CONFIRMED'
    GROUP BY td.season, td.month, td.month_name
    ORDER BY td.month;
END//
DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_booking_facts_compound ON booking_facts(property_id, status, booking_date);
CREATE INDEX idx_booking_facts_amount_date ON booking_facts(total_amount, booking_date);
CREATE INDEX idx_booking_facts_advance ON booking_facts(days_in_advance, is_cancelled);

-- Create a view for real-time analytics dashboard
CREATE VIEW dashboard_metrics AS
SELECT 
    'today' as period,
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as confirmed_revenue,
    AVG(CASE WHEN status = 'CONFIRMED' THEN total_amount END) as avg_booking_value,
    AVG(CASE WHEN status = 'CONFIRMED' THEN length_of_stay END) as avg_length_of_stay
FROM booking_facts
WHERE booking_date = CURDATE()

UNION ALL

SELECT 
    'week' as period,
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as confirmed_revenue,
    AVG(CASE WHEN status = 'CONFIRMED' THEN total_amount END) as avg_booking_value,
    AVG(CASE WHEN status = 'CONFIRMED' THEN length_of_stay END) as avg_length_of_stay
FROM booking_facts
WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)

UNION ALL

SELECT 
    'month' as period,
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_bookings,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as confirmed_revenue,
    AVG(CASE WHEN status = 'CONFIRMED' THEN total_amount END) as avg_booking_value,
    AVG(CASE WHEN status = 'CONFIRMED' THEN length_of_stay END) as avg_length_of_stay
FROM booking_facts
WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);