-- Create databases for each microservice
-- PostgreSQL syntax

-- Create databases
CREATE DATABASE stayhub_properties;
CREATE DATABASE stayhub_bookings;
CREATE DATABASE stayhub_users;
CREATE DATABASE stayhub_search;

-- Connect to each database and enable UUID extension
\c stayhub_properties;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

\c stayhub_bookings;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c stayhub_users;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c stayhub_search;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";