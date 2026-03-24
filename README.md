# Intutive Fusion Backend

A production-ready Node.js backend API built with Express, Prisma, PostgreSQL, and Redis.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **Prisma ORM** - Next-generation ORM for Node.js and TypeScript
- **PostgreSQL** - Powerful, open-source relational database
- **Redis** - In-memory data structure store for caching and queues
- **Bull** - Premium queue package for handling distributed jobs
- **JWT Authentication** - Secure token-based authentication
- **Docker Support** - Full containerization for development and production
- **Winston Logger** - Professional logging with daily rotation
- **Jest Testing** - Comprehensive testing framework
- **ESLint & Prettier** - Code quality and formatting
- **Security** - Helmet, CORS, Rate limiting built-in

## � Documentation

- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Complete guide for production deployment
- **[Development Guide](DEVELOPMENT.md)** - Local development setup and workflows

## �📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   cd intutive_fusion_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

### Docker Deployment

**Quick Start:**
```bash
# Copy environment file
cp .env.example .env

# Deploy all services (backend, PostgreSQL, Redis, Adminer)
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Services Available:**
- Backend API: http://localhost:5000
- Adminer (DB Manager): http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

📘 **For complete deployment guide, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)**

## 📁 Project Structure

```
intutive_fusion_backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling middleware
│   ├── routes/               # API routes
│   │   └── health.js         # Health check routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   │   ├── constants.js      # Constants and enums
│   │   ├── helpers.js        # Helper functions
│   │   └── logger.js         # Winston logger configuration
│   ├── generated/            # Prisma generated client
│   └── prisma/               # Database seeds
├── prisma/
│   └── schema.prisma         # Prisma schema
├── __tests__/                # Test files
│   ├── setup.test.js         # Test setup
│   └── routes/               # Route tests
├── logs/                     # Application logs
├── uploads/                  # Uploaded files
├── docker-compose.yml        # Production Docker config
├── docker-compose.dev.yml    # Development Docker config
├── Dockerfile                # Docker image definition
├── server.js                 # Entry point
├── worker.js                 # Background worker
└── package.json              # Dependencies and scripts
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run worker` | Start background worker |
| `npm test` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the database |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |

## 🔐 Environment Variables

See `.env.example` for all available environment variables. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `JWT_SECRET` | JWT secret key | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- health.test.js
```

## 🐳 Docker Deployment

### Production

```bash
# Build and start all services
npm run docker:prod

# View logs
npm run docker:logs

# Stop services
npm run docker:prod:down
```

## 📚 API Documentation

### Health Endpoints

- `GET /health` - Comprehensive health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Adding New Routes

1. Create a route file in `src/routes/`:
   ```javascript
   const express = require('express');
   const router = express.Router();
   const { authenticate } = require('../middleware/auth');

   router.get('/', authenticate, async (req, res) => {
     // Your logic here
   });

   module.exports = router;
   ```

2. Register the route in `src/app.js`:
   ```javascript
   const myRoutes = require('./routes/myRoutes');
   app.use('/api/myroute', myRoutes);
   ```

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting on API routes
- JWT authentication
- Request ID tracking
- Input validation with express-validator

## 📝 Logging

Logs are stored in the `logs/` directory with daily rotation:
- `error-YYYY-MM-DD.log` - Error logs only
- `combined-YYYY-MM-DD.log` - All logs

## 🤝 Contributing

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Write tests for new features
4. Update documentation as needed

## 📄 License

ISC

## 👥 Support

For support, email your-email@example.com or open an issue.
