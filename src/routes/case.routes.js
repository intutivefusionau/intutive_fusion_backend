const express = require('express');
const router = express.Router();

const { CaseService } = require('../services/case');
const { VisitType } = require('../generated/prisma');
const { authenticate } = require('../middleware/auth');
const { UserRole } = require('../generated/prisma');
const { DoctorService } = require('../services/doctor');
const { CaseStatus } = require('../generated/prisma');


/**
 * Create case
 */
// router.post('/', authenticate, async (req, res) => {
//   try {

//     if (!req.body.patientId || !req.body.department || !req.body.visitType || !req.body.reasonForVisit) {
//       return res.status(400).json({ error: 'patientId, department, visitType, and reasonForVisit are required' });
//     }

//     const checkIfPatientExists = await CaseService.checkIfPatientExists(req.body.patientId);

//     if (!checkIfPatientExists) {
//       return res.status(400).json({ error: 'Patient does not exist' });
//     }

//     if(!VisitType.hasOwnProperty(req.body.visitType.toUpperCase())) {
//       const validVisitTypes = Object.keys(VisitType).join(', ');
//       return res.status(400).json({ error: `Visit type must be one of: ${validVisitTypes}` });
//     }

//     if(!req.user.role || req.user.role.toUpperCase() !== "MEDICAL_OFFICER") {
//       return res.status(403).json({ error: 'Only users with MEDICAL_OFFICER role can create cases' });
//     }

//     const payload = {
//       patientId: req.body.patientId,
//       department: req.body.department,
//       visitType: req.body.visitType,
//       reasonForVisit: req.body.reasonForVisit,
//       medicalOfficerId: req.user.id
//     };

//     const data = await CaseService.createCase(payload);
//     res.json(data);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

/**
 * Get all cases 
 */

router.get('/', authenticate, async (req, res) => {
  try {

    if(!(req.user.role.toUpperCase() == UserRole.MEDICAL_OFFICER || req.user.role.toUpperCase() == UserRole.DOCTOR)) {
      return res.status(403).json({ error: 'Only medical officers and doctors can assign doctors to cases' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const data = await CaseService.getAllCases(offset, limit);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Save intake (transcript, symptoms, forms)
 * Can be called multiple times as case progresses
 */
router.post('/:id/intake', authenticate, async (req, res) => {
  try {

    // Allow MO, Doctor, and Patient roles to update intake data
    if(!(req.user.role.toUpperCase() == UserRole.MEDICAL_OFFICER || 
         req.user.role.toUpperCase() == UserRole.DOCTOR ||
         req.user.role.toUpperCase() == UserRole.PATIENT)) {
      return res.status(403).json({ error: 'Only medical officers, doctors, and patients can save intake information' });
    }

    const payload = {
      intakeTranscript: req.body.intakeTranscript ? req.body.intakeTranscript : null,
      symptomsJson: req.body.symptomsJson ? req.body.symptomsJson : null,
      formsJson: req.body.formsJson ? req.body.formsJson : null
    };

    const checkIfCaseExists = await CaseService.getCaseDetails(parseInt(req.params.id));
    if (!checkIfCaseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Allow saving intake data during appropriate statuses
    const allowedStatuses = [CaseStatus.NEW, CaseStatus.INTAKE_STARTED, CaseStatus.INTAKE_DONE];
    if(!allowedStatuses.includes(checkIfCaseExists.status)) {
      return res.status(400).json({ error: `Intake information can only be saved when case is in ${allowedStatuses.join(', ')} status` });
    }

    const data = await CaseService.saveIntake(
      parseInt(req.params.id),
      payload
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




/**
 * Assign suggested forms to case
 */
router.post('/:id/assign-forms', authenticate, async (req, res) => {
  try {

    if(!(req.user.role.toUpperCase() == UserRole.MEDICAL_OFFICER)) {
      return res.status(403).json({ error: 'Only medical officers can assign forms to cases' });
    }

    const { suggestedForms, aiFormReasoning } = req.body;

    if(!suggestedForms || !Array.isArray(suggestedForms) || suggestedForms.length === 0) {
      return res.status(400).json({ error: 'suggestedForms array is required' });
    }

    const checkIfCaseExists = await CaseService.getCaseDetails(parseInt(req.params.id));
    if (!checkIfCaseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const data = await CaseService.assignForms(
      parseInt(req.params.id),
      { suggestedForms, aiFormReasoning }
    );
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Assign doctor
 */
router.put('/:id/assign-doctor', authenticate, async (req, res) => {
  try {

    if(!(req.user.role.toUpperCase() == UserRole.MEDICAL_OFFICER)) {
      return res.status(403).json({ error: 'Only medical officers can assign doctors to cases' });
    }

    if(!req.body.doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    const user = await DoctorService.getDoctorById(req.body.doctorId);
    if (!user) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const checkIfCaseExists = await CaseService.getCaseDetails(parseInt(req.params.id));
    if (!checkIfCaseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if(checkIfCaseExists.status != CaseStatus.INTAKE_DONE) {
      return res.status(400).json({ error: 'Doctor can only be assigned after intake is done' });
    }

    if(checkIfCaseExists.doctor){
      return res.status(400).json({ error: 'Doctor already assigned to this case' });
    }
    
    const data = await CaseService.assignDoctor(
      parseInt(req.params.id),
      req.body.doctorId
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Save consultation
 */
router.post('/:id/consultation', authenticate, async (req, res) => {
  try {

    if(!(req.user.role.toUpperCase() == UserRole.DOCTOR)) {
      return res.status(403).json({ error: 'Only doctors can save consultation information' });
    }

    const checkIfCaseExists = await CaseService.getCaseDetails(parseInt(req.params.id));
    if (!checkIfCaseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if(checkIfCaseExists.status != CaseStatus.INTAKE_DONE) {
      return res.status(400).json({ error: 'Consultation can only be saved after doctor is assigned and intake is done' });
    }
    
     const payload = {
      doctorTranscript: req.body.doctorTranscript ? req.body.doctorTranscript : null,
      aiDiagnosisJson: req.body.aiDiagnosisJson ? req.body.aiDiagnosisJson : null,
      doctorNotes: req.body.doctorNotes ? req.body.doctorNotes : null
    };

    if(!payload.doctorTranscript && !payload.aiDiagnosisJson && !payload.doctorNotes) {
      return res.status(400).json({ error: 'At least one of doctorTranscript, aiDiagnosisJson or doctorNotes is required' });
    }  

    // Get doctor ID from logged-in user
    const doctor = await DoctorService.getDoctorByUserId(req.user.id);
    const doctorId = doctor ? doctor.id : null;

    const data = await CaseService.saveConsultation(
      parseInt(req.params.id),
      req.body,
      doctorId
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get case details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {

    if(!(req.user.role.toUpperCase() == UserRole.MEDICAL_OFFICER || 
         req.user.role.toUpperCase() == UserRole.DOCTOR || 
         req.user.role.toUpperCase() == UserRole.PATIENT)) {
      return res.status(403).json({ error: 'Only medical officers, doctors, and patients can access case details' });
    }

    const data = await CaseService.getCaseDetails(
      parseInt(req.params.id)
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get case details for patient forms (unauthenticated)
 */
router.get('/:id/patient-forms', async (req, res) => {
  try {
    const data = await CaseService.getCaseDetails(
      parseInt(req.params.id)
    );
    
    if (!data) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Return only necessary data for patient forms
    res.json({
      id: data.id,
      patientId: data.patientId,
      patient: data.patient,
      caseRecord: {
        suggestedFormsJson: data.caseRecord?.suggestedFormsJson,
        formsJson: data.caseRecord?.formsJson,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Submit patient form responses (unauthenticated)
 */
router.post('/:id/patient-forms', async (req, res) => {
  try {
    const { formsJson } = req.body;

    if (!formsJson) {
      return res.status(400).json({ error: 'formsJson is required' });
    }

    const checkIfCaseExists = await CaseService.getCaseDetails(parseInt(req.params.id));
    if (!checkIfCaseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Allow form submission when forms are assigned
    const allowedStatuses = [CaseStatus.INTAKE_STARTED, CaseStatus.INTAKE_DONE];
    if(!allowedStatuses.includes(checkIfCaseExists.status)) {
      return res.status(400).json({ error: 'Forms can only be submitted when they are assigned' });
    }

    const data = await CaseService.saveIntake(
      parseInt(req.params.id),
      { formsJson }
    );
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get prescription details (unauthenticated - public access for patients)
 */
router.get('/:id/prescription', async (req, res) => {
  try {
    const caseDetails = await CaseService.getCaseDetails(
      parseInt(req.params.id)
    );
    
    if (!caseDetails) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if consultation data exists
    if (!caseDetails.caseRecord?.aiDiagnosisJson) {
      return res.status(404).json({ error: 'Prescription not yet generated' });
    }

    // Return prescription data
    res.json({
      id: caseDetails.id,
      patientId: caseDetails.patientId,
      department: caseDetails.department,
      visitType: caseDetails.visitType,
      status: caseDetails.status,
      visitTimestamp: caseDetails.createdAt,
      patient: caseDetails.patient,
      doctor: caseDetails.doctor,
      caseRecord: {
        doctorTranscript: caseDetails.caseRecord?.doctorTranscript,
        aiDiagnosisJson: caseDetails.caseRecord?.aiDiagnosisJson,
        doctorNotes: caseDetails.caseRecord?.doctorNotes,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;