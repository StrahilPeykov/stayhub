CREATE DATABASE stayhub_properties;
CREATE DATABASE stayhub_bookings;
CREATE DATABASE stayhub_users;

-- Enable PostGIS extension for geo queries
\c stayhub_properties;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;