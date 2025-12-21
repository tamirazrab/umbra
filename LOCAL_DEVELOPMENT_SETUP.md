# Local Development Setup Guide

This guide will help you set up all the required services for local development using Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Start all services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

4. **View logs (optional):**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

## Services Overview

The Docker Compose setup includes the following services:

### Databases

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **PostgreSQL** | 5432 | `postgresql://postgres:postgres@localhost:5432/nestjs-microservice` | `postgres/postgres` |
| **PgAdmin** | 5050 | http://localhost:5050 | `admin@umbra.local/admin` |
| **MongoDB** | 27017 | `mongodb://admin:admin@localhost:27017/nestjs-microservice?authSource=admin` | `admin/admin` |
| **Mongo Express** | 8081 | http://localhost:8081 | `admin/admin` |
| **Redis** | 6379 | `redis://:redis@localhost:6379` | Password: `redis` |

### Observability Stack

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Zipkin** | 9411 | http://localhost:9411 | No authentication |
| **Prometheus** | 9090 | http://localhost:9090 | No authentication |
| **Grafana** | 3001 | http://localhost:3001 | `admin/admin` |
| **Alertmanager** | 9093 | http://localhost:9093 | No authentication |
| **Loki** | 3100 | http://localhost:3100 | No authentication |
| **OTEL Collector** | 4317/4318 | gRPC: `localhost:4317`, HTTP: `localhost:4318` | No authentication |

## Environment Variables

All environment variables are configured in the `.env` file. Key variables include:

### Application
- `NODE_ENV=local` - Environment mode
- `PORT=3000` - Backend API port
- `HOST=http://localhost` - Base URL

### Database URLs
- `POSTGRES_URL` - PostgreSQL connection string
- `MONGO_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string

### Observability URLs
- `ZIPKIN_URL=http://localhost:9411` - Distributed tracing
- `PROMETHUES_URL=http://localhost:9090` - Metrics collection
- `GRAFANA_URL=http://localhost:3001` - Visualization dashboards

### Security
- `JWT_SECRET_KEY` - JWT signing key (change in production!)
- `TOKEN_EXPIRATION=1h` - Access token expiration
- `REFRESH_TOKEN_EXPIRATION=7d` - Refresh token expiration

## Service Details

### PostgreSQL & PgAdmin

PostgreSQL is the primary relational database. PgAdmin provides a web-based administration interface.

**Access PgAdmin:**
1. Navigate to http://localhost:5050
2. Login with email: `admin@umbra.local` and password: `admin`
3. Add a new server:
   - Host: `postgres`
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `nestjs-microservice`

### MongoDB & Mongo Express

MongoDB is used for document storage. Mongo Express provides a web-based administration interface.

**Access Mongo Express:**
1. Navigate to http://localhost:8081
2. Login with username: `admin` and password: `admin`

### Redis

Redis is used for caching and session storage.

**Test Redis connection:**
```bash
docker exec -it umbra-redis redis-cli -a redis ping
```

### Zipkin - Distributed Tracing

Zipkin collects and visualizes distributed traces from your application.

**Access Zipkin:**
- Navigate to http://localhost:9411
- Traces are automatically collected via OpenTelemetry Collector

### Prometheus - Metrics Collection

Prometheus scrapes and stores metrics from your application.

**Access Prometheus:**
- Navigate to http://localhost:9090
- Query metrics using PromQL
- View targets at http://localhost:9090/targets

### Grafana - Visualization

Grafana provides dashboards for metrics and logs visualization.

**Access Grafana:**
1. Navigate to http://localhost:3001
2. Login with username: `admin` and password: `admin`
3. Pre-configured datasources:
   - Prometheus (default)
   - Loki (logs)
   - PostgreSQL

**Create Dashboards:**
- Go to Dashboards → New Dashboard
- Add panels using Prometheus queries
- Example query: `rate(http_server_requests_count_total[5m])`

### Alertmanager

Alertmanager handles alerts from Prometheus.

**Access Alertmanager:**
- Navigate to http://localhost:9093
- View active alerts and silences

### Loki & Promtail - Log Aggregation

Loki aggregates logs, and Promtail ships logs to Loki.

**Query logs in Grafana:**
- Use LogQL queries in Grafana
- Example: `{job="varlogs"}`

## Common Operations

### Start Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.dev.yml down
```

### Stop and Remove Volumes (⚠️ This deletes all data!)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f grafana
```

### Restart a Service
```bash
docker-compose -f docker-compose.dev.yml restart postgres
```

### Check Service Health
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Access Service Shell
```bash
# PostgreSQL
docker exec -it umbra-postgres psql -U postgres -d nestjs-microservice

# MongoDB
docker exec -it umbra-mongodb mongosh -u admin -p admin

# Redis
docker exec -it umbra-redis redis-cli -a redis
```

## Troubleshooting

### Port Already in Use

If you get port conflicts, you can change ports in `.env`:

```env
POSTGRES_PORT=5433
MONGO_PORT=27018
REDIS_PORT=6380
```

Then update the corresponding URLs in `.env` to match.

### Services Not Starting

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check logs for errors:
   ```bash
   docker-compose -f docker-compose.dev.yml logs
   ```

3. Verify ports are not in use:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :5432
   
   # Linux/Mac
   lsof -i :5432
   ```

### Database Connection Issues

1. Ensure services are healthy:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

2. Check database logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   docker-compose -f docker-compose.dev.yml logs mongodb
   ```

3. Verify connection strings in `.env` match the service configuration

### Grafana Not Loading Dashboards

1. Check Grafana logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs grafana
   ```

2. Verify datasources are configured:
   - Navigate to Configuration → Data Sources in Grafana
   - Ensure Prometheus and Loki are listed

### Tracing Not Appearing in Zipkin

1. Verify OpenTelemetry Collector is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps otel-collector
   ```

2. Check collector logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs otel-collector
   ```

3. Ensure `OTEL_EXPORTER_OTLP_ENDPOINT` is set correctly in your application

## Data Persistence

All data is persisted in Docker volumes:

- `postgres-data` - PostgreSQL data
- `mongo-data` - MongoDB data
- `redis-data` - Redis data
- `prometheus-data` - Prometheus metrics
- `grafana-data` - Grafana dashboards and settings
- `alertmanager-data` - Alertmanager state
- `loki-data` - Loki logs

To remove all data:
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Production Considerations

⚠️ **This setup is for LOCAL DEVELOPMENT ONLY!**

For production:
- Use managed database services (RDS, MongoDB Atlas, etc.)
- Set strong passwords and secrets
- Enable authentication for all services
- Use proper networking and security groups
- Configure backups and monitoring
- Use environment-specific configurations

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Zipkin Documentation](https://zipkin.io/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs
3. Verify environment variables are set correctly
4. Ensure Docker has sufficient resources allocated

