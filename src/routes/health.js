const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const Redis = require('ioredis');

const prisma = new PrismaClient();

// Redis client (optional - only if Redis is configured)
let redis = null;
if (process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    },
  });
}

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'DEGRADED';
    }

    // Check Redis connection (if configured)
    // if (redis) {
    //   try {
    //     await redis.ping();
    //     health.services.redis = 'healthy';
    //   } catch (error) {
    //     health.services.redis = 'unhealthy';
    //     health.status = 'DEGRADED';
    //   }
    // } else {
    //   health.services.redis = 'not-configured';
    // }

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

module.exports = router;
