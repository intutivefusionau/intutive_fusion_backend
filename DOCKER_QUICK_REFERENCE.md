# Docker Quick Reference

Essential Docker commands for Intutive Fusion Backend.

## 🚀 Deployment

```bash
# First time setup
cp .env.example .env                    # Create environment file
docker-compose up -d --build            # Build and start all services

# Deploy to new machine
git clone <repo-url>                    # Get code
cd intutive_fusion_backend              # Enter directory
cp .env.example .env                    # Setup environment
# Edit .env with production credentials
docker-compose up -d --build            # Deploy
```

## 🔄 Daily Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Update and redeploy
git pull
docker-compose up -d --build
```

## 📊 Monitoring

```bash
# Check status
docker-compose ps

# View logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend

# Check health
curl http://localhost:5000/health

# Monitor resources
docker stats
```

## 🗄️ Database

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access Adminer
open http://localhost:8080

# Connect to database
docker-compose exec postgres psql -U postgres -d intutive_fusion_db

# Backup database
docker-compose exec postgres pg_dump -U postgres intutive_fusion_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres intutive_fusion_db
```

## 🔧 Troubleshooting

```bash
# View all logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker-compose up -d --build

# Complete reset (deletes data)
docker-compose down -v
docker-compose up -d --build

# Access container shell
docker-compose exec backend sh

# Check container resource usage
docker stats
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove everything including volumes (WARNING: deletes data)
docker-compose down -v

# Clean up Docker system
docker system prune -a --volumes
```

## 📝 Common Tasks

```bash
# Scale workers
docker-compose up -d --scale worker=3

# Run command in container
docker-compose exec backend npm run db:seed

# Copy file to container
docker cp ./file.txt intutive_fusion_backend:/app/

# Copy file from container
docker cp intutive_fusion_backend:/app/logs/app.log ./

# View environment variables
docker-compose exec backend env
```

## 🌐 Access Points

- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Adminer**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📦 Services

| Service | Container Name | Image | Port |
|---------|---------------|-------|------|
| Backend | intutive_fusion_backend | custom | 5000 |
| Worker | intutive_fusion_worker | custom | - |
| PostgreSQL | intutive_fusion_postgres | postgres:15-alpine | 5432 |
| Redis | intutive_fusion_redis | redis:7-alpine | 6379 |
| Adminer | intutive_fusion_adminer | adminer:latest | 8080 |

## 🔐 Adminer Login

- **System**: PostgreSQL
- **Server**: postgres
- **Username**: postgres (or your POSTGRES_USER)
- **Password**: postgres123 (or your POSTGRES_PASSWORD)
- **Database**: intutive_fusion_db (or your POSTGRES_DB)

---

**See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete guide**
