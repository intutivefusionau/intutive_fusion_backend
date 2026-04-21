// src/routes/patient.routes.js

const express = require('express');
const router = express.Router();
const { PatientService } = require('../services/patient');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../generated/prisma');

/**
 * Get all patients (for MO, Doctor, Reception)
 * GET /patients
 */
router.get('/', authenticate, authorize('MEDICAL_OFFICER', 'DOCTOR', 'RECEPTION'), async (req, res) => {
  try {
    // Check if it's a search query
    const searchTerm = req.query.search || req.query.q;
    
    if (searchTerm) {
      const patients = await PatientService.searchPatients(searchTerm);
      return res.json({ patients });
    }
    
    // Otherwise, get all patients
    const patients = await PatientService.getAllPatients();
    res.json({ patients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create patient profile
 * POST /patients
 */
// router.post('/', authenticate, async (req, res) => {
//   try {

//     if(!req.body.age || !req.body.gender) {
//       return res.status(400).json({ error: 'Age and gender are required' });
//     }

//     if(!req.user.role || req.user.role.toUpperCase() !== UserRole.PATIENT) {
//       return res.status(403).json({ error: 'Only users with PATIENT role can create patient profiles' });
//     }

//     const checkIfPatientExists = await PatientService.getPatientByUserId(req.user.id);
//     if (checkIfPatientExists) {
//       return res.status(400).json({ error: 'Patient profile already exists for this user' });
//     }

//     const payload = {
//       userId: req.user.id,
//       age: req.body.age,
//       gender: req.body.gender.toLowerCase()
//     };
//     const patient = await PatientService.createPatient(payload);
//     res.json(patient);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

/**
 * Get patient by ID
 * GET /patients/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {

    const patient = await PatientService.getPatientById(parseInt(req.params.id));

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if(req.user.role.toUpperCase() == UserRole.PATIENT && req.user.id !== patient.user.id) {
      return res.status(403).json({ error: 'Patients can only access their own profile' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get patient case history
 * GET /patients/:id/cases
 */
router.get('/:id/cases', authenticate, async (req, res) => {
  try {

    const patient = await PatientService.getPatientById(parseInt(req.params.id));

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if(req.user.role.toUpperCase() == UserRole.PATIENT && req.user.id !== patient.user.id) {
      return res.status(403).json({ error: 'Patients can only access their own profile' });
    }

    const cases = await PatientService.getPatientCases(parseInt(req.params.id))
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get patient medical history (completed cases with diagnoses)
 * GET /patients/:id/medical-history
 */
router.get('/:id/medical-history', authenticate, async (req, res) => {
  try {

    const patient = await PatientService.getPatientById(parseInt(req.params.id));

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Allow MO, Doctor, and Reception to access medical history
    if(req.user.role.toUpperCase() == UserRole.PATIENT && req.user.id !== patient.user.id) {
      return res.status(403).json({ error: 'Patients can only access their own medical history' });
    }

    const medicalHistory = await PatientService.getPatientMedicalHistory(parseInt(req.params.id));
    
    res.json({ medicalHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;