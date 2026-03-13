const { body, param, query, validationResult } = require('express-validator');
const { PATTERNS } = require('./constants');

/**
 * Common validation rules
 */
const validationRules = {
  // Email validation
  email: () =>
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),

  // Password validation
  password: () =>
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),

  // UUID validation
  uuid: (field = 'id') =>
    param(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .matches(PATTERNS.UUID)
      .withMessage(`Invalid ${field} format`),

  // String validation
  string: (field, options = {}) => {
    const { min = 1, max = 255, required = true } = options;
    let rule = body(field).trim();

    if (required) {
      rule = rule.notEmpty().withMessage(`${field} is required`);
    }

    if (min) {
      rule = rule.isLength({ min }).withMessage(`${field} must be at least ${min} characters`);
    }

    if (max) {
      rule = rule.isLength({ max }).withMessage(`${field} must not exceed ${max} characters`);
    }

    return rule;
  },

  // Number validation
  number: (field, options = {}) => {
    const { min, max, required = true } = options;
    let rule = body(field);

    if (required) {
      rule = rule.notEmpty().withMessage(`${field} is required`);
    }

    rule = rule.isNumeric().withMessage(`${field} must be a number`);

    if (min !== undefined) {
      rule = rule.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
    }

    if (max !== undefined) {
      rule = rule.isFloat({ max }).withMessage(`${field} must not exceed ${max}`);
    }

    return rule;
  },

  // Boolean validation
  boolean: (field, required = true) => {
    let rule = body(field);

    if (required) {
      rule = rule.notEmpty().withMessage(`${field} is required`);
    }

    return rule.isBoolean().withMessage(`${field} must be a boolean`);
  },

  // Date validation
  date: (field, required = true) => {
    let rule = body(field);

    if (required) {
      rule = rule.notEmpty().withMessage(`${field} is required`);
    }

    return rule.isISO8601().withMessage(`${field} must be a valid date`);
  },

  // Array validation
  array: (field, options = {}) => {
    const { min, max, required = true } = options;
    let rule = body(field);

    if (required) {
      rule = rule.notEmpty().withMessage(`${field} is required`);
    }

    rule = rule.isArray().withMessage(`${field} must be an array`);

    if (min !== undefined) {
      rule = rule.isLength({ min }).withMessage(`${field} must contain at least ${min} items`);
    }

    if (max !== undefined) {
      rule = rule.isLength({ max }).withMessage(`${field} must not exceed ${max} items`);
    }

    return rule;
  },

  // Phone validation
  phone: () =>
    body('phone')
      .optional()
      .trim()
      .matches(PATTERNS.PHONE)
      .withMessage('Invalid phone number format'),

  // URL validation
  url: (field = 'url') =>
    body(field)
      .optional()
      .trim()
      .matches(PATTERNS.URL)
      .withMessage(`Invalid ${field} format`),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Sort validation
  sort: (allowedFields = []) => [
    query('sortBy')
      .optional()
      .isIn(allowedFields)
      .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc'),
  ],
};

/**
 * Validation middleware
 */
const validate = (rules) => {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((error) => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value,
          })),
        });
      }
      next();
    },
  ];
};

/**
 * Sanitize input
 */
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim();
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
};

module.exports = {
  validationRules,
  validate,
  sanitizeInput,
};
