const prisma = require('../../prisma/client');

/**
 * Handles case workflow
 */
class CaseService {
  /**
   * Create new case
   */
  static async createCase(payload) {
    return prisma.case.create({
      data: {
        patientId: payload.patientId,
        department: payload.department,
        visitType: payload.visitType.toUpperCase(),
        reasonForVisit: payload.reasonForVisit,
        medicalOfficerId: payload.medicalOfficerId,
        status: "NEW"
      }
    });
  }

  /**
   * Assign doctor to case
   */
  static async assignDoctor(caseId, doctorId) {
    return prisma.case.update({
      where: { id: caseId },
      data: {
        doctorId,
        status: "WAITING_DOCTOR"
      }
    });
  }

  /**
   * Save MO intake details
   */
  static async saveIntake(caseId, payload) {
    const record = await prisma.caseRecord.upsert({
      where: { caseId },
      update: {
        intakeTranscript: payload.intakeTranscript,
        symptomsJson: payload.symptomsJson,
        formsJson: payload.formsJson
      },
      create: {
        caseId,
        intakeTranscript: payload.intakeTranscript,
        symptomsJson: payload.symptomsJson,
        formsJson: payload.formsJson
      }
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "INTAKE_DONE" }
    });

    return record;
  }

  /**
   * Save doctor consultation
   */
  static async saveConsultation(caseId, payload) {
    const record = await prisma.caseRecord.upsert({
      where: { caseId },
      update: {
        doctorTranscript: payload.doctorTranscript,
        aiDiagnosisJson: payload.aiDiagnosisJson,
        doctorNotes: payload.doctorNotes
      },
      create: {
        caseId,
        doctorTranscript: payload.doctorTranscript,
        aiDiagnosisJson: payload.aiDiagnosisJson,
        doctorNotes: payload.doctorNotes
      }
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "CONSULTATION_DONE" }
    });

    return record;
  }

  /**
   * Get full case details
   */
  static async getCaseDetails(caseId) {
    return prisma.case.findUnique({
      where: { id: caseId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        medicalOfficer: true,
        caseRecord: true,
        files: true
      }
    });
  }

  /**
   * Get MO queue
   */
  static async getMOQueue(moId) {
    return prisma.case.findMany({
      where: {
        medicalOfficerId: moId,
        status: {
          in: ["NEW", "INTAKE_STARTED"]
        }
      },
      include: {
        patient: { include: { user: true } }
      }
    });
  }
  
  /**
   * 
   * @param {*} patientId 
   * @returns 
   */

    static async checkIfPatientExists(patientId) {
        return prisma.patient.findUnique({
            where: { id: patientId }
        });
    }
}

module.exports = { CaseService };