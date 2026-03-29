// src/routes/doctor.routes.js

const express = require('express');
const router = express.Router();
const { DoctorService } = require('../services/doctor');

/**
 * Create doctor profile
 * POST /doctors
 */
router.post('/', async (req, res) => {
  try {
    const doctor = await DoctorService.createDoctor(req.body);
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor by ID
 * GET /doctors/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const doctor = await DoctorService.getDoctorById(parseInt(req.params.id));
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get doctor queue
 * GET /doctors/:id/queue
 */
router.get('/:id/queue', async (req, res) => {
  try {
    const cases = await DoctorService.getDoctorQueue(parseInt(req.params.id));
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;