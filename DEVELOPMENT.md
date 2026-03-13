# Intutive Fusion Backend - Development Notes

## Quick Start Commands

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Docker Commands

```bash
# Start services (development)
npm run docker:dev

# Stop services
npm run docker:dev:down

# View logs
npm run docker:logs

# Execute commands in container
docker exec -it intutive_fusion_backend_dev bash
```

## Adding New Features

### 1. Add a New Route

1. Create route file: `src/routes/yourRoute.js`
2. Create service file: `src/services/yourService.js`
3. Register route in `src/app.js`
4. Add tests in `__tests__/routes/yourRoute.test.js`

### 2. Add Database Model

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update seed file if needed

### 3. Add Middleware

1. Create file in `src/middleware/`
2. Add to `src/app.js` or specific routes

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npm test -- myTest.test.js
```

## Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set strong `JWT_SECRET`
- [ ] Configure database credentials
- [ ] Set up Redis connection
- [ ] Configure AWS credentials (if using S3)
- [ ] Review rate limiting settings
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Review security headers
