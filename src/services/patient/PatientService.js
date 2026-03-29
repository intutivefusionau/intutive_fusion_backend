const prisma = require('../../prisma/client');

/**
 * Handles patient profile operations
 */
class PatientService {
  /**
   * Create patient profile linked to a user
   */
  static async createPatient(payload) {
    return prisma.patient.create({
      data: {
        userId: payload.userId,
        patientCode: "P-" + Date.now(),
        age: payload.age,
        gender: payload.gender
      }
    });
  }

  /**
   * Get patient by ID with user info
   */
  static async getPatientById(patientId) {
    return prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
            select: {
                id: true,
                name: true,
                phone: true,
                role: true
            }
        }
      }
    });
  }

  static async getPatientByUserId(userId) {
    return prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
            select: {
                id: true,
                name: true,
                phone: true,
                role: true
            }
        }
      }
    });
  }

  /**
   * Get all cases for a patient (patient history)
   */
  static async getPatientCases(patientId) {
    return prisma.case.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true } },
        caseRecord: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = { PatientService };