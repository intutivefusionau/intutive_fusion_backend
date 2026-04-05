const prisma = require('../../prisma/client');

class ReceptionService {
  /**
   * Create case using patient phone
   * This handles:
   * - Find or create user
   * - Find or create patient
   * - Generate visit number
   * - Create case
   */
  static async createCaseByPhone(payload) {
    const {
      name,
      phone,
      age,
      gender,
      department,
      reasonForVisit,
      medicalOfficerId,
      createdById
    } = payload;

    // 1. Find or create user
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          phone,
          password: "temp123", // patient can change later
          role: "PATIENT"
        }
      });
    }

    // 2. Find or create patient profile
    let patient = await prisma.patient.findUnique({
      where: { userId: user.id }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          patientCode: "P-" + Date.now(),
          age,
          gender,
          phone
        }
      });
    }

    // 3. Calculate visit number
    const visitCount = await prisma.case.count({
      where: { patientId: patient.id }
    });

    const visitNumber = visitCount + 1;

    // 4. Create case
    const newCase = await prisma.case.create({
      data: {
        patientId: patient.id,
        visitNumber,
        department,
        reasonForVisit,
        medicalOfficerId,
        createdById,
        status: "NEW"
      }
    });

    return {
      caseId: newCase.id,
      patientId: patient.id,
      visitNumber
    };
  }
}

module.exports = { ReceptionService };