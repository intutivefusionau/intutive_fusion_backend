// src/routes/file.routes.js

const express = require('express');
const router = express.Router();
const { FileService } = require('../services/file');

/**
 * Upload file (audio)
 * POST /files
 */
router.post('/', async (req, res) => {
  try {
    const file = await FileService.uploadFile(req.body);
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get files by case ID
 * GET /files/case/:caseId
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const files = await FileService.getFilesByCase(parseInt(req.params.caseId));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;