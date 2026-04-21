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

  /**
   * Get patient's medical history with diagnoses (for follow-up visits)
   * Returns only completed cases with diagnosis information
   */
  static async getPatientMedicalHistory(patientId) {
    return prisma.case.findMany({
      where: { 
        patientId,
        status: { in: ['CONSULTATION_DONE', 'COMPLETED'] },
        caseRecord: {
          aiDiagnosisJson: { not: null }
        }
      },
      include: {
        doctor: { 
          include: { 
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          } 
        },
        caseRecord: {
          select: {
            aiDiagnosisJson: true,
            doctorNotes: true,
            caseSummary: true,
            symptomsJson: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Search patients by name or phone
   */
  static async searchPatients(searchTerm) {
    return prisma.patient.findMany({
      where: {
        user: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } }
          ]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true
          }
        },
        cases: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  /**
   * Get all patients (for MO/Doctor/Reception)
   */
  static async getAllPatients() {
    return prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = { PatientService };