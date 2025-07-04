# Database Documentation

## Quick Start
StayHub uses PostgreSQL for transactional data and MySQL for analytics across a microservices architecture.

## Database Overview

```
StayHub Databases
├── PostgreSQL (Primary OLTP)
│   ├── stayhub_properties - Property catalog
│   ├── stayhub_bookings - Reservations & availability  
│   ├── stayhub_users - User accounts
│   └── stayhub_search - Search optimization
├── MySQL (Analytics OLAP)
│   ├── stayhub_reporting - Real-time dashboards
│   └── stayhub_analytics - Business intelligence
└── Redis (Cache)
    └── Session & query caching
```

## Quick Setup

### Local Development
```bash
# Start databases
docker-compose up postgres mysql redis

# Run migrations
./scripts/migrate-all.sh

# Verify setup
curl http://localhost:8081/debug/db
```

### Production (Railway)
- **Host**: `postgres.railway.internal:5432`
- **Database**: `railway` 
- **Connection pooling**: HikariCP (max 5 connections)

## Core Tables

| Service | Key Tables | Purpose |
|---------|------------|---------|
| **Property** | `properties`, `property_amenities` | Property catalog |
| **Booking** | `bookings`, `room_types`, `availabilities` | Reservations |
| **User** | `users` | Authentication |
| **Analytics** | `booking_facts`, `revenue_aggregations` | Reporting |

## Common Queries

```sql
-- Check recent bookings
SELECT * FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Property availability
SELECT * FROM availabilities 
WHERE property_id = ? AND date BETWEEN ? AND ?;

-- Database health
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

## Detailed Documentation

- **[Complete Schema Reference](./schema.md)** - All tables, indexes, constraints
- **[Migration Guide](./migrations.md)** - Database versioning with Flyway
- **[Analytics Setup](./analytics.md)** - MySQL reporting configuration  
- **[Performance Tuning](./performance.md)** - Optimization guidelines
- **[Troubleshooting](./troubleshooting.md)** - Common issues & solutions

## Need Help?

| Issue | Resource |
|-------|----------|
| Schema questions | [schema.md](./schema.md) |
| Performance problems | [performance.md](./performance.md) |
| Migration issues | [migrations.md](./migrations.md) |
| Production problems | [troubleshooting.md](./troubleshooting.md) |

## Quick Links
- [Railway Database Dashboard](https://railway.app/project/your-project)
- [Database Monitoring](http://localhost:3000/admin/database)
- [API Documentation](../api/README.md)