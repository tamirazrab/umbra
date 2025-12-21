# Quick Reference - Local Development Services

## 🚀 Quick Start

```bash
# 1. Copy environment file
cp env.example .env

# 2. Start all services
yarn infra
# or
docker-compose -f docker-compose.dev.yml up -d

# 3. Check status
docker-compose -f docker-compose.dev.yml ps
```

## 📊 Service URLs & Credentials

### Databases
| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | `postgresql://postgres:postgres@localhost:5432/nestjs-microservice` | postgres/postgres |
| **PgAdmin** | http://localhost:5050 | admin@umbra.local / admin |
| **MongoDB** | `mongodb://admin:admin@localhost:27017/nestjs-microservice?authSource=admin` | admin/admin |
| **Mongo Express** | http://localhost:8081 | admin/admin |
| **Redis** | `redis://:redis@localhost:6379` | Password: redis |

### Observability
| Service | URL | Credentials |
|---------|-----|-------------|
| **Zipkin** | http://localhost:9411 | No auth |
| **Prometheus** | http://localhost:9090 | No auth |
| **Grafana** | http://localhost:3001 | admin/admin |
| **Alertmanager** | http://localhost:9093 | No auth |
| **Loki** | http://localhost:3100 | No auth |

## 🛠️ Common Commands

```bash
# Start services
yarn infra

# Stop services
yarn infra:down

# View logs
yarn infra:logs

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f grafana

# Restart a service
docker-compose -f docker-compose.dev.yml restart postgres

# Access service shell
docker exec -it umbra-postgres psql -U postgres -d nestjs-microservice
docker exec -it umbra-mongodb mongosh -u admin -p admin
docker exec -it umbra-redis redis-cli -a redis
```

## 🔧 Environment Variables

Key variables in `.env`:

```env
# Databases
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/nestjs-microservice
MONGO_URL=mongodb://admin:admin@localhost:27017/nestjs-microservice?authSource=admin
REDIS_URL=redis://:redis@localhost:6379

# Observability
ZIPKIN_URL=http://localhost:9411
PROMETHUES_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001
```

## 📖 Full Documentation

See [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) for complete setup guide.

