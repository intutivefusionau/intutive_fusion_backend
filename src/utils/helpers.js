const { PAGINATION } = require('./constants');
const jwt = require('jsonwebtoken');

/**
 * Standardized API response format
 */
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, message = 'Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    });
  }
}

/**
 * Parse pagination parameters from request
 */
const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Parse sort parameters from request
 */
const parseSort = (req, defaultSort = { createdAt: 'desc' }) => {
  const sortBy = req.query.sortBy;
  const order = req.query.order === 'asc' ? 'asc' : 'desc';

  if (!sortBy) return defaultSort;

  return { [sortBy]: order };
};

/**
 * Parse filter parameters from request
 */
const parseFilters = (req, allowedFields = []) => {
  const filters = {};

  allowedFields.forEach((field) => {
    if (req.query[field]) {
      filters[field] = req.query[field];
    }
  });

  return filters;
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sanitize object by removing undefined/null values
 */
const sanitizeObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
};

/**
 * Convert bytes to human-readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Mask sensitive data (email, phone, etc.)
 */
const maskString = (str, visibleChars = 4) => {
  if (!str || str.length <= visibleChars) return str;
  const masked = '*'.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
};

/**
 * Generate JWT token
 */
const generateJwtToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn });
}

module.exports = {
  ApiResponse,
  parsePagination,
  parseSort,
  parseFilters,
  generateRandomString,
  sleep,
  sanitizeObject,
  formatBytes,
  isValidEmail,
  maskString,
  generateJwtToken
};
