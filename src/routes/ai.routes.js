const express = require('express');
const AiService = require('../services/ai/AiService');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/v1/ai/suggest-forms
 * AI suggests medical forms based on MO-patient transcript
 */
router.post('/suggest-forms', authenticate, async (req, res, next) => {
  try {
    const { caseId, transcript } = req.body;

    if (!caseId || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'caseId and transcript are required',
      });
    }

    logger.info(`Suggesting forms for case ${caseId}`);

    const result = await AiService.suggestForms(parseInt(caseId), transcript);

    res.status(200).json({
      success: true,
      caseId: parseInt(caseId),
      ...result,
    });
  } catch (error) {
    logger.error('Error suggesting forms:', error);

    if (error.message.includes('not configured')) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * POST /api/v1/ai/case-summary
 * AI generates case summary for doctor consultation
 */
router.post('/case-summary', authenticate, async (req, res, next) => {
  try {
    const { caseId, transcript, formResponses, patientInfo, medicalHistory } = req.body;

    // Require either transcript or form responses
    if (!caseId || (!transcript && (!formResponses || Object.keys(formResponses).length === 0))) {
      return res.status(400).json({
        success: false,
        error: 'caseId and either transcript or formResponses are required',
      });
    }

    logger.info(`Generating case summary for case ${caseId}`);

    const result = await AiService.generateCaseSummary(
      parseInt(caseId),
      transcript,
      formResponses,
      patientInfo,
      medicalHistory // Pass medical history to AI service
    );

    res.status(200).json({
      success: true,
      caseId: parseInt(caseId),
      ...result,
    });
  } catch (error) {
    logger.error('Error generating case summary:', error);

    if (error.message.includes('not configured')) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * POST /api/v1/ai/suggest-followup
 * AI suggests follow-up questions for doctor
 */
router.post('/suggest-followup', authenticate, authorize('DOCTOR'), async (req, res, next) => {
  try {
    const { caseId, initialTranscript, formResponses, patientInfo, caseSummary, medicalHistory } = req.body;

    if (!caseId || !initialTranscript) {
      return res.status(400).json({
        success: false,
        error: 'caseId and initialTranscript are required',
      });
    }

    logger.info(`Suggesting follow-up questions for case ${caseId}`);

    const result = await AiService.suggestFollowUpQuestions(
      parseInt(caseId),
      initialTranscript,
      formResponses,
      patientInfo,
      caseSummary,
      medicalHistory // Pass medical history to AI service
    );

    res.status(200).json({
      success: true,
      caseId: parseInt(caseId),
      ...result,
    });
  } catch (error) {
    logger.error('Error suggesting follow-up questions:', error);

    if (error.message.includes('not configured')) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * POST /api/v1/ai/format-consultation
 * AI formats consultation data for diagnosis API
 */
router.post('/format-consultation', authenticate, authorize('DOCTOR'), async (req, res, next) => {
  try {
    const {
      caseId,
      patientId,
      patientCode,
      patientInfo,
      formResponses,
      initialTranscript,
      followUpTranscript,
      caseSummary,
      medicalHistory,
    } = req.body;

    if (!caseId || !patientId || !initialTranscript) {
      return res.status(400).json({
        success: false,
        error: 'caseId, patientId, and initialTranscript are required',
      });
    }

    logger.info(`Formatting consultation for case ${caseId}`);

    const result = await AiService.formatConsultation(
      parseInt(caseId),
      parseInt(patientId),
      patientCode,
      patientInfo,
      formResponses,
      initialTranscript,
      followUpTranscript,
      caseSummary,
      medicalHistory
    );

    res.status(200).json({
      success: true,
      caseId: parseInt(caseId),
      ...result,
    });
  } catch (error) {
    logger.error('Error formatting consultation:', error);

    if (error.message.includes('not configured')) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: error.message,
      });
    }

    next(error);
  }
});

module.exports = router;
