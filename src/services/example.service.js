const { PrismaClient } = require('../generated/prisma');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Example Service
 * This is a template showing best practices for service classes
 */
class ExampleService {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get all items with pagination
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        order = 'desc',
        filters = {},
      } = options;

      const skip = (page - 1) * limit;

      // Example: Fetch from database
      // const items = await this.prisma.yourModel.findMany({
      //   where: filters,
      //   skip,
      //   take: limit,
      //   orderBy: { [sortBy]: order },
      // });

      const items = []; // Placeholder

      logger.info('Items retrieved', { count: items.length, page, limit });
      return items;
    } catch (error) {
      logger.error('Error getting all items:', error);
      throw error;
    }
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      // Example: Fetch from database
      // const item = await this.prisma.yourModel.findUnique({
      //   where: { id },
      // });

      // if (!item) {
      //   throw new ApiError(404, 'Item not found');
      // }

      const item = { id }; // Placeholder

      logger.info('Item retrieved', { id });
      return item;
    } catch (error) {
      logger.error('Error getting item by ID:', error);
      throw error;
    }
  }

  /**
   * Create new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      // Validate input
      this.validateCreateData(data);

      // Example: Create in database
      // const item = await this.prisma.yourModel.create({
      //   data,
      // });

      const item = { id: '1', ...data }; // Placeholder

      logger.info('Item created', { id: item.id });
      return item;
    } catch (error) {
      logger.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update item
   * @param {string} id - Item ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      // Check if exists
      await this.getById(id);

      // Example: Update in database
      // const item = await this.prisma.yourModel.update({
      //   where: { id },
      //   data,
      // });

      const item = { id, ...data }; // Placeholder

      logger.info('Item updated', { id });
      return item;
    } catch (error) {
      logger.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Delete item
   * @param {string} id - Item ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      // Check if exists
      await this.getById(id);

      // Example: Delete from database
      // await this.prisma.yourModel.delete({
      //   where: { id },
      // });

      logger.info('Item deleted', { id });
    } catch (error) {
      logger.error('Error deleting item:', error);
      throw error;
    }
  }

  /**
   * Validate create data
   * @param {Object} data - Data to validate
   * @throws {ApiError} If validation fails
   */
  validateCreateData(data) {
    if (!data) {
      throw new ApiError(400, 'Data is required');
    }

    // Add your validation logic here
  }
}

module.exports = new ExampleService();
