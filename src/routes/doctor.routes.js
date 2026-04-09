// src/routes/doctor.routes.js

const express = require('express');
const router = express.Router();
const { DoctorService } = require('../services/doctor');
const { authenticate } = require('../middleware/auth');

/**
 * Create doctor profile
 * POST /doctors
 */
router.post('/', authenticate, async (req, res) => {
  try {
    
    if(req.user.role.toUpperCase() !== "DOCTOR") {
      return res.status(403).json({ error: 'Only users with DOCTOR role can create doctor profiles' });
    }

    if(!req.body.specialization) {
      return res.status(400).json({ error: 'Specialization is required' });
    }
    
    const payload = {
      userId: req.user.id,
      specialization: req.body.specialization
    };

    const checkIfDoctorExists = await DoctorService.getDoctorByUserId(req.user.id);

    if (checkIfDoctorExists) {
      return res.status(400).json({ error: 'Doctor profile already exists for this user' });
    }


    const doctor = await DoctorService.createDoctor(payload);
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor by ID
 * GET /doctors/:id
 */
router.get('/getProfile', authenticate, async (req, res) => {
  try {
    if(req.user.role.toUpperCase() !== "DOCTOR") {
      return res.status(403).json({ error: 'Only users with DOCTOR role can access doctor profiles' });
    }
    const doctor = await DoctorService.getDoctorByUserId(parseInt(req.user.id));
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor queue
 * GET /doctors/:id/queue
 */
router.get('/queue', authenticate, async (req, res) => {
  try {
    if(req.user.role.toUpperCase() !== "DOCTOR") {
      return res.status(403).json({ error: 'Only users with DOCTOR role can access doctor queues' });
    }

    const doctor = await DoctorService.getDoctorByUserId(parseInt(req.user.id));

    if(!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found for this user' });
    }

    console.log(doctor)

    const cases = await DoctorService.getDoctorQueue(parseInt(doctor.id));
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;