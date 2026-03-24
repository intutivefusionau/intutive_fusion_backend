# Docker Deployment Guide

Complete guide for deploying the Intutive Fusion Backend using Docker and Docker Compose.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Service Management](#service-management)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Production Best Practices](#production-best-practices)

---

## 📦 Prerequisites

### Required Software
- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Git** (for cloning repository)

### System Requirements
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Disk Space**: Minimum 10GB free
- **Ports**: 5000, 5432, 6379, 8080 (ensure they're available)

### Verify Installation
```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Verify Docker is running
docker ps
```

---

## 🚀 Quick Start

### One-Command Deployment

```bash
# 1. Clone repository
git clone <your-repo-url>
cd intutive_fusion_backend

# 2. Setup environment
cp .env.example .env

# 3. Deploy all services
docker-compose up -d --build

# 4. Check status
docker-compose ps
```

Your application will be available at:
- **Backend API**: http://localhost:5000
- **Adminer DB Manager**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 📝 Detailed Deployment Steps

### Step 1: Get the Code

```bash
# Clone from repository
git clone <your-repo-url>
cd intutive_fusion_backend

# Or if you have the code as archive
unzip intutive_fusion_backend.zip
cd intutive_fusion_backend
```

### Step 2: Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env
```

Edit `.env` file with your configuration:

```bash
# On Windows
notepad .env

# On Linux/Mac
nano .env
# or
vim .env
```

**Required Variables** (see [Environment Configuration](#environment-configuration) section):
- `JWT_SECRET` - Secret key for JWT tokens
- `SYSTEM_API_KEY` - API key for system operations
- `REDIS_PASSWORD` - Redis authentication password

### Step 3: Build and Start Services

```bash
# Build images and start all services in detached mode
docker-compose up -d --build

# This command will:
# 1. Pull base images (postgres, redis, adminer)
# 2. Build backend and worker images
# 3. Create Docker networks and volumes
# 4. Start all containers with health checks
```

Expected output:
```
[+] Building 30.5s
[+] Running 7/7
 ✔ Network intutive_fusion_backend_intutive_fusion_network  Created
 ✔ Volume intutive_fusion_backend_postgres_data             Created
 ✔ Volume intutive_fusion_backend_redis_data                Created
 ✔ Container intutive_fusion_postgres                       Healthy
 ✔ Container intutive_fusion_redis                          Healthy
 ✔ Container intutive_fusion_backend                        Started
 ✔ Container intutive_fusion_worker                         Started
 ✔ Container intutive_fusion_adminer                        Started
```

### Step 4: Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Test the health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","services":{"database":"healthy","redis":"healthy"}}
```

### Step 5: Run Database Migrations (If Needed)

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database (optional)
docker-compose exec backend npx prisma db seed
```

---

## ⚙️ Environment Configuration

### Critical Variables (Must Set for Production)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-192-bit-key` | ✅ Yes |
| `SYSTEM_API_KEY` | API key for system operations | `sys_live_abc123xyz` | ✅ Yes |
| `REDIS_PASSWORD` | Redis authentication password | `redis123` | ✅ Yes |

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres123` |
| `POSTGRES_DB` | Database name | `intutive_fusion_db` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |

### Application Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend API port | `5000` |
| `LOG_LEVEL` | Logging level | `info` |
| `FRONTEND_URL` | Frontend CORS URL | `http://localhost:3000` |

### Optional Services

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | ❌ Optional |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | ❌ Optional |
| `AWS_REGION` | AWS region | ❌ Optional |
| `OPENAI_API_KEY` | OpenAI API key | ❌ Optional |

### Example Production .env

```bash
# Environment
NODE_ENV=production

# Server
PORT=5000

# Database
POSTGRES_USER=produser
POSTGRES_PASSWORD=StrongPassword123!@#
POSTGRES_DB=intutive_fusion_prod
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=SecureRedisPass456!@#

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-256-bits-recommended
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Keys
SYSTEM_API_KEY=sys_live_secure_api_key_here

# Frontend
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=warn

# File Upload
MAX_FILE_SIZE=10485760

# Adminer (optional)
ADMINER_PORT=8080
```

---

## 🗄️ Database Setup

### Access Database via Adminer

1. Open browser: http://localhost:8080
2. Login with credentials:
   - **System**: PostgreSQL
   - **Server**: `postgres`
   - **Username**: Value from `POSTGRES_USER` (default: `postgres`)
   - **Password**: Value from `POSTGRES_PASSWORD` (default: `postgres123`)
   - **Database**: Value from `POSTGRES_DB` (default: `intutive_fusion_db`)

### Run Migrations

```bash
# Deploy migrations to database
docker-compose exec backend npx prisma migrate deploy

# Create a new migration (development)
docker-compose exec backend npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
docker-compose exec backend npx prisma migrate reset
```

### Seed Database

```bash
# Run seed script
docker-compose exec backend npx prisma db seed

# Or run custom seed file
docker-compose exec backend node src/prisma/seed.js
```

### Direct Database Access

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U postgres -d intutive_fusion_db

# Run SQL query from host
docker-compose exec postgres psql -U postgres -d intutive_fusion_db -c "SELECT * FROM users;"

# Export database dump
docker-compose exec postgres pg_dump -U postgres intutive_fusion_db > backup.sql

# Import database dump
docker-compose exec -T postgres psql -U postgres intutive_fusion_db < backup.sql
```

---

## 🔧 Service Management

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start without detached mode (see logs in real-time)
docker-compose up

# Rebuild and start
docker-compose up -d --build

# Force recreate containers
docker-compose up -d --force-recreate
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes (WARNING: Deletes data)
docker-compose down -v

# Stop and remove everything including images
docker-compose down --rmi all -v
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Restart with new environment variables
docker-compose up -d --force-recreate backend
```

### Scaling Services

```bash
# Scale worker instances
docker-compose up -d --scale worker=3

# Scale back down
docker-compose up -d --scale worker=1
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# View all service logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs -f backend

# View last N lines
docker-compose logs --tail=50 backend

# View logs with timestamps
docker-compose logs -f --timestamps backend

# View logs from specific time
docker-compose logs --since 30m backend
docker-compose logs --since 2024-03-25T10:00:00 backend
```

### Container Status

```bash
# List all containers with status
docker-compose ps

# Show detailed container information
docker-compose ps -a

# View resource usage
docker stats

# Inspect specific container
docker inspect intutive_fusion_backend
```

### Access Container Shell

```bash
# Open shell in backend container
docker-compose exec backend sh

# Run command in container
docker-compose exec backend node --version

# Access as root
docker-compose exec --user root backend sh
```

### Health Checks

```bash
# Check application health
curl http://localhost:5000/health

# Pretty print JSON response
curl -s http://localhost:5000/health | json_pp

# Check specific service health
docker-compose exec backend wget -q -O - http://localhost:5000/health
```

---

## 💾 Backup & Restore

### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup database
docker-compose exec postgres pg_dump -U postgres intutive_fusion_db > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker-compose exec postgres pg_dump -U postgres intutive_fusion_db | gzip > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
docker-compose exec postgres pg_dump -U postgres -t users -t sessions intutive_fusion_db > backups/tables_backup.sql
```

### Database Restore

```bash
# Restore from backup
cat backups/db_backup.sql | docker-compose exec -T postgres psql -U postgres intutive_fusion_db

# Restore from compressed backup
gunzip < backups/db_backup.sql.gz | docker-compose exec -T postgres psql -U postgres intutive_fusion_db

# Restore with dropping existing database
cat backups/db_backup.sql | docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS intutive_fusion_db; CREATE DATABASE intutive_fusion_db;"
```

### Volume Backup

```bash
# Backup PostgreSQL volume
docker run --rm -v intutive_fusion_backend_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_volume.tar.gz -C /data .

# Backup Redis volume
docker run --rm -v intutive_fusion_backend_redis_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis_volume.tar.gz -C /data .
```

### Volume Restore

```bash
# Restore PostgreSQL volume
docker run --rm -v intutive_fusion_backend_postgres_data:/data -v $(pwd)/backups:/backup alpine sh -c "cd /data && tar xzf /backup/postgres_volume.tar.gz"

# Restore Redis volume
docker run --rm -v intutive_fusion_backend_redis_data:/data -v $(pwd)/backups:/backup alpine sh -c "cd /data && tar xzf /backup/redis_volume.tar.gz"
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Containers Won't Start

```bash
# Check logs for errors
docker-compose logs

# Check specific service
docker-compose logs backend

# Remove and rebuild
docker-compose down
docker-compose up -d --build
```

#### 2. Port Already in Use

```bash
# Check what's using the port (Linux/Mac)
lsof -i :5000

# Windows
netstat -ano | findstr :5000

# Change port in .env
PORT=5001

# Restart with new configuration
docker-compose down
docker-compose up -d
```

#### 3. Database Connection Failed

```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### 4. Redis Authentication Error

```bash
# Verify REDIS_PASSWORD is set in .env
cat .env | grep REDIS_PASSWORD

# Ensure it's passed to containers
docker-compose config | grep REDIS_PASSWORD

# Restart services
docker-compose restart backend worker redis
```

#### 5. Prisma Client Error

```bash
# Regenerate Prisma client
docker-compose exec backend npx prisma generate

# Rebuild backend
docker-compose up -d --build backend
```

#### 6. Permission Denied Errors

```bash
# Fix volume permissions
docker-compose exec --user root backend chown -R nodejs:nodejs /app/logs /app/uploads

# Or fix on host
sudo chown -R $USER:$USER ./logs ./uploads
```

### Reset Everything

```bash
# Nuclear option - complete reset
docker-compose down -v --rmi all
rm -rf logs/* uploads/*
docker-compose up -d --build
```

### View System Resources

```bash
# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes

# Monitor container resources
docker stats
```

---

## 🏭 Production Best Practices

### Security

1. **Change All Default Passwords**
   ```bash
   # Generate strong passwords
   openssl rand -base64 32
   ```

2. **Use Environment Variables, Not .env File**
   - Use Docker secrets or external secret management
   - Never commit `.env` to version control

3. **Enable TLS/SSL**
   - Use reverse proxy (Nginx/Traefik)
   - Configure HTTPS certificates

4. **Limit Resource Usage**
   ```yaml
   # Add to docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
           reservations:
             cpus: '0.5'
             memory: 512M
   ```

5. **Network Isolation**
   - Don't expose database ports externally
   - Use internal Docker networks

### Performance

1. **Database Connection Pooling**
   - Already configured in `DATABASE_URL`
   - Adjust `connection_limit` if needed

2. **Redis Persistence**
   - Configure RDB or AOF based on needs
   - Monitor memory usage

3. **Log Rotation**
   ```yaml
   # Add to docker-compose.yml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

### Monitoring

1. **Health Checks**
   - Already configured in docker-compose.yml
   - Monitor `/health` endpoint

2. **Log Aggregation**
   - Use ELK stack or equivalent
   - Centralize logs from all services

3. **Metrics**
   - Add Prometheus/Grafana
   - Monitor CPU, memory, requests

### Deployment Strategy

1. **Zero-Downtime Deployment**
   ```bash
   # Build new images
   docker-compose build
   
   # Rolling update
   docker-compose up -d --no-deps --scale backend=2 backend
   docker-compose up -d --no-deps --scale backend=1 backend
   ```

2. **Database Migrations**
   ```bash
   # Run migrations before deploying new code
   docker-compose exec backend npx prisma migrate deploy
   docker-compose restart backend
   ```

3. **Rollback Plan**
   ```bash
   # Tag images before deployment
   docker tag intutive_fusion_backend-backend:latest intutive_fusion_backend-backend:v1.0.0
   
   # Rollback if needed
   docker-compose down
   docker tag intutive_fusion_backend-backend:v1.0.0 intutive_fusion_backend-backend:latest
   docker-compose up -d
   ```

### Backups

1. **Automated Backups**
   ```bash
   # Add to cron
   0 2 * * * /path/to/backup-script.sh
   ```

2. **Backup Script Example**
   ```bash
   #!/bin/bash
   BACKUP_DIR="/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   docker-compose exec -T postgres pg_dump -U postgres intutive_fusion_db | \
     gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
   
   # Keep only last 7 days
   find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
   ```

3. **Test Restores**
   - Regularly test backup restoration
   - Verify data integrity

---

## 📚 Additional Resources

### Useful Commands Reference

```bash
# View all Docker Compose options
docker-compose --help

# Validate docker-compose.yml
docker-compose config

# Pull latest images
docker-compose pull

# View image details
docker-compose images

# Execute database query
docker-compose exec postgres psql -U postgres -d intutive_fusion_db -c "SELECT COUNT(*) FROM users;"

# Copy files to/from container
docker cp ./local-file.txt intutive_fusion_backend:/app/
docker cp intutive_fusion_backend:/app/logs/app.log ./
```

### Environment-Specific Compose Files

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

### Docker Compose Override

Create `docker-compose.override.yml` for local customization (not committed to git):
```yaml
version: '3.9'
services:
  backend:
    ports:
      - '3000:5000'
    environment:
      LOG_LEVEL: debug
```

---

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Check health: `curl http://localhost:5000/health`
4. Review this guide's [Troubleshooting](#troubleshooting) section
5. Contact support team

---

## 📄 License

[Your License Here]

---

**Last Updated**: March 2026
