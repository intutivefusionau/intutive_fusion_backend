const prisma = require('../../prisma/client');

/**
 * Handles doctor profile operations
 */
class DoctorService {
  /**
   * Create doctor profile linked to user
   */
  static async createDoctor(payload) {
    return prisma.doctor.create({
      data: {
        userId: payload.userId,
        specialization: payload.specialization
      }
    });
  }

  /**
   * Get doctor by ID with user details
   */
  static async getDoctorById(doctorId) {
    return prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true }
    });
  }

  /**
   * Get doctor by UserId with user details
   */
  static async getDoctorByUserId(userId) {
    return prisma.doctor.findUnique({
      where: { userId },
    });
  }

  /**
   * Get doctor queue (cases waiting for doctor)
   */
  static async getDoctorQueue(doctorId) {
    return prisma.case.findMany({
      where: {
        doctorId,
        status: "WAITING_DOCTOR"
      },
      include: {
        patient: { 
          include: { 
            user:  {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          } 
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

module.exports = { DoctorService };