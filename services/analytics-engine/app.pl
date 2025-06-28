#!/usr/bin/perl

use strict;
use warnings;
use Mojolicious::Lite -signatures;
use DBI;
use JSON::XS;
use Time::HiRes qw(gettimeofday tv_interval);

# Initialize database connections with error handling
my $pg_dbh;
my $mysql_dbh;
my $redis;
my $json = JSON::XS->new->utf8->pretty->canonical;

# Try to connect to databases
eval {
    $pg_dbh = DBI->connect(
        "dbi:Pg:dbname=stayhub_bookings;host=localhost;port=5432",
        "postgres", "1234",
        { RaiseError => 0, AutoCommit => 1, PrintError => 0 }
    );
};
if ($@) {
    app->log->warn("PostgreSQL connection failed: $@");
}

eval {
    $mysql_dbh = DBI->connect(
        "dbi:mysql:database=stayhub_reporting;host=localhost;port=3306",
        "root", "1234",
        { RaiseError => 0, AutoCommit => 1, PrintError => 0 }
    );
};
if ($@) {
    app->log->warn("MySQL connection failed: $@");
}

# Health check endpoint
get '/health' => sub ($c) {
    my $health = {
        status => 'UP',
        service => 'analytics-engine',
        timestamp => time(),
        databases => {
            postgresql => $pg_dbh && $pg_dbh->ping ? 'Connected' : 'Disconnected',
            mysql => $mysql_dbh && $mysql_dbh->ping ? 'Connected' : 'Disconnected'
        }
    };
    
    $c->render(json => $health);
};

# Simple analytics endpoint
get '/api/analytics/summary' => sub ($c) {
    my $summary = {
        service => 'analytics-engine',
        message => 'Analytics service is running',
        features => [
            'Booking analytics',
            'Revenue reporting',
            'Performance metrics'
        ]
    };
    
    # Try to get some basic stats if database is connected
    if ($pg_dbh && $pg_dbh->ping) {
        eval {
            my $booking_count = $pg_dbh->selectrow_array(
                "SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED'"
            );
            $summary->{total_bookings} = $booking_count || 0;
        };
    }
    
    $c->render(json => $summary);
};

# Booking statistics endpoint
get '/api/analytics/bookings/stats' => sub ($c) {
    unless ($pg_dbh && $pg_dbh->ping) {
        return $c->render(
            status => 503,
            json => { error => 'Database connection unavailable' }
        );
    }
    
    my $stats = {};
    
    eval {
        # Total bookings
        my $total = $pg_dbh->selectrow_hashref(
            "SELECT COUNT(*) as total, 
                    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
                    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
             FROM bookings"
        );
        $stats->{bookings} = $total;
        
        # Revenue stats
        my $revenue = $pg_dbh->selectrow_hashref(
            "SELECT SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_booking_value
             FROM bookings 
             WHERE status = 'CONFIRMED'"
        );
        $stats->{revenue} = $revenue;
        
        # Recent bookings (last 7 days)
        my $recent = $pg_dbh->selectrow_hashref(
            "SELECT COUNT(*) as recent_bookings
             FROM bookings 
             WHERE created_at >= NOW() - INTERVAL '7 days'"
        );
        $stats->{recent} = $recent;
    };
    
    if ($@) {
        return $c->render(
            status => 500,
            json => { error => "Query failed: $@" }
        );
    }
    
    $c->render(json => $stats);
};

# Property performance endpoint
get '/api/analytics/properties/:property_id/performance' => sub ($c) {
    my $property_id = $c->param('property_id');
    
    unless ($pg_dbh && $pg_dbh->ping) {
        return $c->render(
            status => 503,
            json => { error => 'Database connection unavailable' }
        );
    }
    
    my $performance = {};
    
    eval {
        # Basic property stats
        my $stats = $pg_dbh->selectrow_hashref(
            "SELECT COUNT(*) as total_bookings,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_booking_value,
                    AVG(number_of_guests) as avg_guests
             FROM bookings 
             WHERE property_id = ? AND status = 'CONFIRMED'",
            undef, $property_id
        );
        
        $performance = $stats || {};
        $performance->{property_id} = $property_id;
    };
    
    if ($@) {
        return $c->render(
            status => 500,
            json => { error => "Query failed: $@" }
        );
    }
    
    $c->render(json => $performance);
};

# Revenue trend endpoint
get '/api/analytics/revenue/trend' => sub ($c) {
    my $days = $c->param('days') || 30;
    
    unless ($pg_dbh && $pg_dbh->ping) {
        return $c->render(
            status => 503,
            json => { error => 'Database connection unavailable' }
        );
    }
    
    my $trend = [];
    
    eval {
        my $sth = $pg_dbh->prepare(
            "SELECT DATE(created_at) as date,
                    COUNT(*) as bookings,
                    SUM(total_amount) as revenue
             FROM bookings 
             WHERE status = 'CONFIRMED' 
               AND created_at >= CURRENT_DATE - INTERVAL '? days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC"
        );
        
        $sth->execute($days);
        while (my $row = $sth->fetchrow_hashref) {
            push @$trend, $row;
        }
    };
    
    if ($@) {
        return $c->render(
            status => 500,
            json => { error => "Query failed: $@" }
        );
    }
    
    $c->render(json => { days => $days, trend => $trend });
};

# Simple root endpoint
get '/' => sub ($c) {
    $c->render(json => {
        service => 'StayHub Analytics Engine',
        version => '1.0.0',
        endpoints => [
            '/health',
            '/api/analytics/summary',
            '/api/analytics/bookings/stats',
            '/api/analytics/properties/:property_id/performance',
            '/api/analytics/revenue/trend'
        ]
    });
};

# Start the application
app->log->info("Analytics Engine starting on port 3000...");
app->start;