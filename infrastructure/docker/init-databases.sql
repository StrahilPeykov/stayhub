CREATE DATABASE IF NOT EXISTS stayhub_properties;
CREATE DATABASE IF NOT EXISTS stayhub_bookings;
CREATE DATABASE IF NOT EXISTS stayhub_users;
CREATE DATABASE IF NOT EXISTS stayhub_search;

-- Enable UUID extension for all databases
\c stayhub_properties;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c stayhub_bookings;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c stayhub_users;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c stayhub_search;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";