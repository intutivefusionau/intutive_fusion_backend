const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const healthRoutes = require('./routes/health');
// Add more routes here as needed
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const caseRoutes = require('./routes/case.routes');
const doctorRoutes = require('./routes/doctor.routes');
const receptionRoutes = require('./routes/reception.routes');
const fileRoutes = require('./routes/file.routes');
const audioRoutes = require('./routes/audio.routes');
const aiRoutes = require('./routes/ai.routes');
// const authRoutes = require('./routes/auth');

const app = express();

// Trust proxy - important for rate limiting and getting correct IPs
app.set('trust proxy', 1);


// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.url === '/health', // Skip health check logs
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// API routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Add more API routes here
// app.use('/api/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/ai', aiRoutes);
// app.use('/api/v1/files', fileRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      // Add more endpoints documentation here
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Intutive Fusion Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
