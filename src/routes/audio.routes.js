const express = require('express');
const multer = require('multer');
const { FileService } = require('../services/file/FileService');
const TranscriptionService = require('../services/transcription/TranscriptionService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * POST /api/v1/audio/upload
 * Upload audio file and start transcription
 */
router.post('/upload', authenticate, upload.single('audio'), async (req, res, next) => {
  try {
    const file = req.file;
    const { caseId, jobType } = req.body; // jobType: 'INTAKE' or 'CONSULTATION'

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'caseId is required',
      });
    }

    const validJobTypes = ['INTAKE', 'CONSULTATION'];
    const selectedJobType = jobType || 'INTAKE';

    if (!validJobTypes.includes(selectedJobType)) {
      return res.status(400).json({
        success: false,
        error: 'jobType must be INTAKE or CONSULTATION',
      });
    }

    logger.info(`Uploading audio for case ${caseId}, jobType: ${selectedJobType}`);

    // Determine file type for database
    const fileType = selectedJobType === 'INTAKE' ? 'INTAKE_AUDIO' : 'DOCTOR_AUDIO';

    // Upload file to S3
    const { file: fileRecord, s3Key, s3Uri } = await FileService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      parseInt(caseId),
      fileType
    );

    // Start transcription job
    const transcriptionResult = await TranscriptionService.startTranscriptionJob(
      s3Uri,
      parseInt(caseId),
      selectedJobType
    );

    logger.info(`Transcription job started: ${transcriptionResult.jobName}`);

    res.status(200).json({
      success: true,
      jobName: transcriptionResult.jobName,
      s3Key,
      caseId: transcriptionResult.caseId,
      message: 'Audio uploaded and transcription started',
    });
  } catch (error) {
    logger.error('Error uploading audio:', error);
    next(error);
  }
});

/**
 * GET /api/v1/audio/status/:jobName
 * Get transcription job status
 */
router.get('/status/:jobName', authenticate, async (req, res, next) => {
  try {
    const { jobName } = req.params;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: 'jobName is required',
      });
    }

    logger.info(`Checking transcription status for job: ${jobName}`);

    const result = await TranscriptionService.getTranscriptionStatus(jobName);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error getting transcription status:', error);
    next(error);
  }
});

module.exports = router;
