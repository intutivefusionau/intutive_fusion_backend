const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { ApiResponse, formatValidationErrors } = require('../utils/helpers');
const { USER_ROLES } = require('../utils/constants');

/**
 * Example service class (move this to src/services/ in real implementation)
 */
class ExampleService {
  async getAll() {
    // Your business logic here
    return [];
  }

  async getById(id) {
    // Your business logic here
    return { id };
  }

  async create(data) {
    // Your business logic here
    return { id: '1', ...data };
  }

  async update(id, data) {
    // Your business logic here
    return { id, ...data };
  }

  async delete(id) {
    // Your business logic here
    return { id };
  }
}

const exampleService = new ExampleService();

/**
 * @route   GET /api/example
 * @desc    Get all items
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const items = await exampleService.getAll();
    return ApiResponse.success(res, items, 'Items retrieved successfully');
  })
);

/**
 * @route   GET /api/example/:id
 * @desc    Get item by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const item = await exampleService.getById(req.params.id);
    return ApiResponse.success(res, item, 'Item retrieved successfully');
  })
);

/**
 * @route   POST /api/example
 * @desc    Create new item
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(
        res,
        'Validation failed',
        400,
        formatValidationErrors(errors)
      );
    }

    const item = await exampleService.create(req.body);
    return ApiResponse.success(res, item, 'Item created successfully', 201);
  })
);

/**
 * @route   PUT /api/example/:id
 * @desc    Update item
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const item = await exampleService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Item updated successfully');
  })
);

/**
 * @route   DELETE /api/example/:id
 * @desc    Delete item
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await exampleService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Item deleted successfully', 204);
  })
);

module.exports = router;
