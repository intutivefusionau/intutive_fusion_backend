require('dotenv').config();
const Queue = require('bull');
const logger = require('./src/utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create queues
const emailQueue = new Queue('email', { redis: redisConfig });
const notificationQueue = new Queue('notification', { redis: redisConfig });
const dataProcessingQueue = new Queue('data-processing', { redis: redisConfig });

// Email queue processor
emailQueue.process(async (job) => {
  logger.info(`Processing email job ${job.id}`, { data: job.data });
  
  try {
    const { to, subject, body, type } = job.data;
    
    // Add your email sending logic here
    // Example: await sendEmail(to, subject, body);
    
    logger.info(`Email sent successfully to ${to}`);
    return { success: true, recipient: to };
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
});

// Notification queue processor
notificationQueue.process(async (job) => {
  logger.info(`Processing notification job ${job.id}`, { data: job.data });
  
  try {
    const { userId, message, type } = job.data;
    
    // Add your notification logic here
    // Example: await sendPushNotification(userId, message);
    
    logger.info(`Notification sent successfully to user ${userId}`);
    return { success: true, userId };
  } catch (error) {
    logger.error(`Notification job ${job.id} failed:`, error);
    throw error;
  }
});

// Data processing queue processor
dataProcessingQueue.process(async (job) => {
  logger.info(`Processing data job ${job.id}`, { data: job.data });
  
  try {
    const { type, payload } = job.data;
    
    // Add your data processing logic here
    
    logger.info(`Data processing job ${job.id} completed`);
    return { success: true, type };
  } catch (error) {
    logger.error(`Data processing job ${job.id} failed:`, error);
    throw error;
  }
});

// Queue event handlers
const setupQueueEvents = (queue, name) => {
  queue.on('completed', (job, result) => {
    logger.info(`${name} job ${job.id} completed`, { result });
  });

  queue.on('failed', (job, err) => {
    logger.error(`${name} job ${job.id} failed`, { error: err.message });
  });

  queue.on('stalled', (job) => {
    logger.warn(`${name} job ${job.id} stalled`);
  });

  queue.on('error', (error) => {
    logger.error(`${name} queue error:`, error);
  });
};

setupQueueEvents(emailQueue, 'Email');
setupQueueEvents(notificationQueue, 'Notification');
setupQueueEvents(dataProcessingQueue, 'Data Processing');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully');
  await emailQueue.close();
  await notificationQueue.close();
  await dataProcessingQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully');
  await emailQueue.close();
  await notificationQueue.close();
  await dataProcessingQueue.close();
  process.exit(0);
});

logger.info('Worker started successfully');
logger.info('Listening for jobs on queues: email, notification, data-processing');
