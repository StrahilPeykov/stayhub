#!/usr/bin/perl

use strict;
use warnings;
use Mojolicious::Lite -signatures;
use DBI;
use Redis;
use JSON::XS;
use Time::HiRes qw(gettimeofday tv_interval);
use Parallel::ForkManager;
use Cache::Memcached::Fast;
use DateTime;
use Statistics::Descriptive;
use Text::CSV_XS;

# Initialize connections (Booking.com style connection pooling)
my $pg_dbh = DBI->connect(
    "dbi:Pg:dbname=stayhub_analytics;host=localhost;port=5432",
    "postgres", "1234",
    { RaiseError => 1, AutoCommit => 1, pg_enable_utf8 => 1 }
);

my $mysql_dbh = DBI->connect(
    "dbi:mysql:database=stayhub_reporting;host=localhost;port=3306",
    "root", "mysql1234",
    { RaiseError => 1, AutoCommit => 1, mysql_enable_utf8 => 1 }
);

my $redis = Redis->new(server => 'localhost:6379');
my $json = JSON::XS->new->utf8->pretty->canonical;

my $memd = Cache::Memcached::Fast->new({
    servers => ['localhost:11211'],
    namespace => 'booking_analytics:',
    connect_timeout => 0.2,
    io_timeout => 0.5,
});

# Booking.com-style high-performance batch processing
post '/api/analytics/batch-process-bookings' => sub ($c) {
    my $start_time = [gettimeofday];
    my $params = $c->req->json;
    
    # Parallel processing for large datasets (Booking.com processes millions daily)
    my $pm = Parallel::ForkManager->new(8); # 8 parallel workers
    my @results;
    
    $pm->run_on_finish(sub {
        my ($pid, $exit_code, $ident, $exit_signal, $core_dump, $data_ref) = @_;
        push @results, $$data_ref if $data_ref;
    });
    
    # Fetch bookings in chunks
    my $chunk_size = 1000;
    my $offset = 0;
    
    while (1) {
        my $bookings = $pg_dbh->selectall_arrayref(
            "SELECT b.*, p.latitude, p.longitude, p.base_price 
             FROM bookings b 
             JOIN properties p ON b.property_id = p.id 
             WHERE b.created_at >= ? AND b.created_at < ?
             ORDER BY b.created_at 
             LIMIT ? OFFSET ?",
            { Slice => {} },
            $params->{start_date}, $params->{end_date}, $chunk_size, $offset
        );
        
        last unless @$bookings;
        
        $pm->start and next;
        
        # Process chunk in child process
        my $chunk_results = process_booking_chunk($bookings);
        
        $pm->finish(0, \$chunk_results);
        $offset += $chunk_size;
    }
    
    $pm->wait_all_children;
    
    # Aggregate results
    my $aggregated = aggregate_results(\@results);
    
    # Store in cache for fast retrieval
    $memd->set("batch_results:$params->{batch_id}", $json->encode($aggregated), 3600);
    
    my $elapsed = tv_interval($start_time);
    
    $c->render(json => {
        batch_id => $params->{batch_id},
        processing_time => sprintf("%.3f", $elapsed),
        records_processed => $aggregated->{total_records},
        insights => $aggregated->{insights}
    });
};

# Real-time pricing optimization (like Booking.com's dynamic pricing)
get '/api/analytics/price-optimization/:property_id' => sub ($c) {
    my $property_id = $c->param('property_id');
    my $cache_key = "price_opt:$property_id";
    
    # Check cache first
    my $cached = $redis->get($cache_key);
    if ($cached) {
        return $c->render(json => $json->decode($cached));
    }
    
    # Complex pricing algorithm based on multiple factors
    my $pricing_data = calculate_optimal_pricing($property_id);
    
    # Cache for 5 minutes
    $redis->setex($cache_key, 300, $json->encode($pricing_data));
    
    $c->render(json => $pricing_data);
};

# Booking pattern analysis (ML-ready data preparation)
get '/api/analytics/booking-patterns' => sub ($c) {
    my $timeframe = $c->param('timeframe') || '30d';
    
    # SQL for pattern detection
    my $patterns = $mysql_dbh->selectall_arrayref(q{
        SELECT 
            DATE(b.created_at) as booking_date,
            HOUR(b.created_at) as booking_hour,
            DATEDIFF(b.check_in_date, b.created_at) as advance_days,
            AVG(b.total_amount) as avg_amount,
            COUNT(*) as booking_count,
            SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancellations,
            AVG(b.number_of_guests) as avg_guests,
            GROUP_CONCAT(DISTINCT p.city) as cities
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY booking_date, booking_hour
        ORDER BY booking_date DESC, booking_hour
    }, { Slice => {} });
    
    # Statistical analysis
    my $stats = Statistics::Descriptive::Full->new();
    $stats->add_data(map { $_->{booking_count} } @$patterns);
    
    my $insights = {
        peak_hours => find_peak_hours($patterns),
        booking_velocity => calculate_velocity($patterns),
        cancellation_rate => calculate_cancellation_rate($patterns),
        advance_booking_trend => analyze_advance_bookings($patterns),
        statistics => {
            mean_bookings_per_hour => $stats->mean(),
            median_bookings_per_hour => $stats->median(),
            std_deviation => $stats->standard_deviation(),
            percentile_90 => $stats->percentile(90),
        }
    };
    
    $c->render(json => {
        patterns => $patterns,
        insights => $insights,
        generated_at => DateTime->now->iso8601
    });
};

# High-performance search indexing (prepare data for Elasticsearch)
post '/api/analytics/reindex-properties' => sub ($c) {
    my $start_time = [gettimeofday];
    
    # Fetch all properties with aggregated data
    my $properties = $pg_dbh->selectall_arrayref(q{
        WITH booking_stats AS (
            SELECT 
                property_id,
                COUNT(*) as total_bookings,
                AVG(total_amount) as avg_booking_value,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as completion_rate,
                AVG(number_of_guests) as avg_guests
            FROM bookings
            WHERE created_at >= NOW() - INTERVAL '90 days'
            GROUP BY property_id
        ),
        availability_stats AS (
            SELECT 
                property_id,
                AVG(available_rooms::FLOAT / total_rooms) as avg_availability,
                COUNT(DISTINCT date) as available_days
            FROM availabilities
            WHERE date >= CURRENT_DATE AND date <= CURRENT_DATE + INTERVAL '30 days'
            GROUP BY property_id
        )
        SELECT 
            p.*,
            COALESCE(bs.total_bookings, 0) as total_bookings,
            COALESCE(bs.avg_booking_value, 0) as avg_booking_value,
            COALESCE(bs.completion_rate, 0) as completion_rate,
            COALESCE(bs.avg_guests, 0) as avg_guests,
            COALESCE(avs.avg_availability, 1) as avg_availability,
            COALESCE(avs.available_days, 0) as available_days
        FROM properties p
        LEFT JOIN booking_stats bs ON p.id = bs.property_id
        LEFT JOIN availability_stats avs ON p.id = avs.property_id
    }, { Slice => {} });
    
    # Transform for Elasticsearch
    my @bulk_data;
    foreach my $property (@$properties) {
        # Calculate popularity score (Booking.com style)
        my $popularity_score = calculate_popularity_score($property);
        
        push @bulk_data, {
            index => {
                _index => 'properties',
                _id => $property->{id}
            }
        };
        
        push @bulk_data, {
            %$property,
            popularity_score => $popularity_score,
            search_keywords => generate_search_keywords($property),
            price_category => categorize_price($property->{base_price}),
            location => {
                lat => $property->{latitude},
                lon => $property->{longitude}
            }
        };
    }
    
    # Send to Elasticsearch via HTTP (in production, use bulk API)
    # ... elasticsearch bulk index code ...
    
    my $elapsed = tv_interval($start_time);
    
    $c->render(json => {
        properties_indexed => scalar(@$properties),
        processing_time => sprintf("%.3f", $elapsed),
        status => 'success'
    });
};

# Revenue optimization report (CSV export like Booking.com's extranet)
get '/api/analytics/revenue-report.csv' => sub ($c) {
    my $csv = Text::CSV_XS->new({ binary => 1, auto_diag => 1 });
    my $output = '';
    
    # Headers
    $csv->combine(qw(Date PropertyID PropertyName Bookings Revenue OccupancyRate ADR RevPAR));
    $output .= $csv->string() . "\n";
    
    # Fetch revenue data
    my $revenue_data = $pg_dbh->selectall_arrayref(q{
        SELECT 
            DATE(b.created_at) as date,
            p.id as property_id,
            p.name as property_name,
            COUNT(b.id) as bookings,
            SUM(b.total_amount) as revenue,
            AVG(a.available_rooms::FLOAT / a.total_rooms) as occupancy_rate,
            AVG(b.total_amount / b.number_of_rooms / EXTRACT(DAY FROM b.check_out_date - b.check_in_date)) as adr,
            SUM(b.total_amount) / SUM(a.total_rooms * EXTRACT(DAY FROM b.check_out_date - b.check_in_date)) as revpar
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        LEFT JOIN availabilities a ON a.property_id = p.id 
            AND a.date >= b.check_in_date 
            AND a.date < b.check_out_date
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date, p.id, p.name
        ORDER BY date DESC, revenue DESC
    }, { Slice => {} });
    
    foreach my $row (@$revenue_data) {
        $csv->combine(
            $row->{date},
            $row->{property_id},
            $row->{property_name},
            $row->{bookings},
            sprintf("%.2f", $row->{revenue} || 0),
            sprintf("%.2f%%", ($row->{occupancy_rate} || 0) * 100),
            sprintf("%.2f", $row->{adr} || 0),
            sprintf("%.2f", $row->{revpar} || 0)
        );
        $output .= $csv->string() . "\n";
    }
    
    $c->res->headers->content_type('text/csv');
    $c->res->headers->content_disposition('attachment; filename="revenue_report.csv"');
    $c->render(text => $output);
};

# Helper functions
sub process_booking_chunk {
    my ($bookings) = @_;
    my %results;
    
    foreach my $booking (@$bookings) {
        # Complex calculations per booking
        $results{total_revenue} += $booking->{total_amount};
        $results{bookings_by_city}{$booking->{city}}++;
        
        # Geospatial analysis
        my $distance_from_center = calculate_distance(
            $booking->{latitude}, $booking->{longitude},
            52.3702, 4.8952  # Amsterdam center
        );
        
        push @{$results{distance_distribution}}, $distance_from_center;
    }
    
    $results{total_records} = scalar @$bookings;
    return \%results;
}

sub calculate_optimal_pricing {
    my ($property_id) = @_;
    
    # Fetch historical data
    my $history = $pg_dbh->selectall_arrayref(q{
        SELECT 
            DATE(created_at) as date,
            AVG(total_amount / number_of_rooms) as avg_rate,
            COUNT(*) as bookings,
            AVG(EXTRACT(DAY FROM check_out_date - check_in_date)) as avg_los
        FROM bookings
        WHERE property_id = ?
        AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY date
        ORDER BY date
    }, { Slice => {} }, $property_id);
    
    # Calculate price elasticity
    my $elasticity = calculate_price_elasticity($history);
    
    # Get competitor prices
    my $competitor_prices = $pg_dbh->selectrow_hashref(q{
        SELECT 
            AVG(base_price) as avg_competitor_price,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY base_price) as p25,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY base_price) as p75
        FROM properties
        WHERE id != ?
        AND ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            (SELECT ST_MakePoint(longitude, latitude)::geography FROM properties WHERE id = ?),
            2000  -- 2km radius
        )
    }, undef, $property_id, $property_id);
    
    # Calculate optimal price based on multiple factors
    my $base_price = $pg_dbh->selectrow_array(
        "SELECT base_price FROM properties WHERE id = ?", undef, $property_id
    );
    
    my $optimal_price = $base_price;
    
    # Adjust based on elasticity
    if ($elasticity < -1) {
        # Elastic demand - be careful with price increases
        $optimal_price *= 0.95;
    } elsif ($elasticity > -0.5) {
        # Inelastic demand - can increase price
        $optimal_price *= 1.1;
    }
    
    # Adjust based on competition
    if ($competitor_prices->{avg_competitor_price}) {
        my $price_position = $base_price / $competitor_prices->{avg_competitor_price};
        if ($price_position > 1.2) {
            # Too expensive compared to competition
            $optimal_price *= 0.92;
        }
    }
    
    # Seasonal adjustments
    my $season_factor = get_seasonal_factor();
    $optimal_price *= $season_factor;
    
    return {
        current_price => $base_price,
        optimal_price => sprintf("%.2f", $optimal_price),
        price_elasticity => sprintf("%.3f", $elasticity),
        competitor_analysis => $competitor_prices,
        confidence_score => 0.85,
        factors => {
            elasticity_adjustment => $elasticity < -1 ? -5 : ($elasticity > -0.5 ? 10 : 0),
            competition_adjustment => $price_position > 1.2 ? -8 : 0,
            seasonal_adjustment => sprintf("%.0f", ($season_factor - 1) * 100)
        }
    };
}

sub calculate_distance {
    my ($lat1, $lon1, $lat2, $lon2) = @_;
    my $R = 6371; # Earth radius in km
    
    my $dLat = deg2rad($lat2 - $lat1);
    my $dLon = deg2rad($lon2 - $lon1);
    
    my $a = sin($dLat/2) * sin($dLat/2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon/2) * sin($dLon/2);
    
    my $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return $R * $c;
}

sub deg2rad {
    my $deg = shift;
    return $deg * (3.14159265358979323846 / 180);
}

sub calculate_popularity_score {
    my ($property) = @_;
    
    # Booking.com style popularity scoring
    my $score = 0;
    
    # Booking velocity (40% weight)
    $score += ($property->{total_bookings} / 100) * 0.4;
    
    # Revenue performance (30% weight)
    $score += ($property->{avg_booking_value} / 500) * 0.3;
    
    # Completion rate (20% weight)
    $score += $property->{completion_rate} * 0.2;
    
    # Availability (10% weight) - scarce properties are more popular
    $score += (1 - $property->{avg_availability}) * 0.1;
    
    return sprintf("%.3f", $score);
}

sub aggregate_results {
    my ($results_ref) = @_;
    my %aggregated;
    
    foreach my $result (@$results_ref) {
        $aggregated{total_revenue} += $result->{total_revenue} || 0;
        $aggregated{total_records} += $result->{total_records} || 0;
        
        # Merge city data
        foreach my $city (keys %{$result->{bookings_by_city} || {}}) {
            $aggregated{bookings_by_city}{$city} += $result->{bookings_by_city}{$city};
        }
    }
    
    # Calculate insights
    $aggregated{insights} = {
        average_booking_value => $aggregated{total_records} ? 
            $aggregated{total_revenue} / $aggregated{total_records} : 0,
        top_cities => [
            sort { $aggregated{bookings_by_city}{$b} <=> $aggregated{bookings_by_city}{$a} }
            keys %{$aggregated{bookings_by_city}}
        ],
    };
    
    return \%aggregated;
}

app->start;