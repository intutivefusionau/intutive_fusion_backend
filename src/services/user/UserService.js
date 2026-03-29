const prisma = require('../../prisma/client');
const { UserRole } = require('../../generated/prisma');


/**
 * Service responsible for User related DB operations
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} payload
   * @param {string} payload.name
   * @param {string} payload.phone
   * @param {string} payload.role
   */
  static async createUser(payload) {
    payload.role = UserRole[payload.role.toUpperCase()];
    return prisma.user.create({
      data: payload
    });
  }

  /**
   * Get user by ID
   * @param {number} userId
   */
  static async getUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Get user by phone (used for login)
   * @param {string} phone
   */
  static async getUserByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  /**
   * Get users by role
   * Example: DOCTOR, PATIENT, MEDICAL_OFFICER
   */
  static async getUsersByRole(role) {

    // validate role input

    if(!UserRole.hasOwnProperty(role.toUpperCase())) {
      console.error(`Invalid role: ${role}`);
      return []; // or throw an error depending on your preference
    }

    return prisma.user.findMany({
      where: { role }
    });
  }
}

module.exports = { UserService };