const express = require('express');
const router = express.Router();

const { CaseService } = require('../services/case');
const { VisitType } = require('../generated/prisma');
const { authenticate } = require('../middleware/auth');

/**
 * Create case
 */
router.post('/', authenticate, async (req, res) => {
  try {

    if (!req.body.patientId || !req.body.department || !req.body.visitType || !req.body.reasonForVisit) {
      return res.status(400).json({ error: 'patientId, department, visitType, and reasonForVisit are required' });
    }

    const checkIfPatientExists = await CaseService.checkIfPatientExists(req.body.patientId);

    if (!checkIfPatientExists) {
      return res.status(400).json({ error: 'Patient does not exist' });
    }

    if(!VisitType.hasOwnProperty(req.body.visitType.toUpperCase())) {
      const validVisitTypes = Object.keys(VisitType).join(', ');
      return res.status(400).json({ error: `Visit type must be one of: ${validVisitTypes}` });
    }

    if(!req.user.role || req.user.role.toUpperCase() !== "MEDICAL_OFFICER") {
      return res.status(403).json({ error: 'Only users with MEDICAL_OFFICER role can create cases' });
    }

    const payload = {
      patientId: req.body.patientId,
      department: req.body.department,
      visitType: req.body.visitType,
      reasonForVisit: req.body.reasonForVisit,
      medicalOfficerId: req.user.id
    };

    const data = await CaseService.createCase(payload);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Assign doctor
 */
router.put('/:id/assign-doctor', async (req, res) => {
  try {
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
 * Save intake
 */
router.post('/:id/intake', async (req, res) => {
  try {
    const data = await CaseService.saveIntake(
      parseInt(req.params.id),
      req.body
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Save consultation
 */
router.post('/:id/consultation', async (req, res) => {
  try {
    const data = await CaseService.saveConsultation(
      parseInt(req.params.id),
      req.body
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get case details
 */
router.get('/:id', async (req, res) => {
  try {
    const data = await CaseService.getCaseDetails(
      parseInt(req.params.id)
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;