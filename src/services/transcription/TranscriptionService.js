const {
  TranscribeClient,
  StartMedicalTranscriptionJobCommand,
  GetMedicalTranscriptionJobCommand,
} = require('@aws-sdk/client-transcribe');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../utils/logger');
const prisma = require('../../prisma/client');

// Initialize AWS clients
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Start a medical transcription job for audio file
 * @param {string} s3Uri - S3 URI of the audio file (s3://bucket/key)
 * @param {number} caseId - Case ID to associate with transcript
 * @param {string} jobType - 'INTAKE' or 'CONSULTATION'
 * @returns {Promise<{jobName: string, status: string}>}
 */
async function startTranscriptionJob(s3Uri, caseId, jobType = 'INTAKE') {
  try {
    const timestamp = Date.now();
    const jobName = `medical-${jobType.toLowerCase()}-${caseId}-${timestamp}`;

    logger.info(`Starting transcription job: ${jobName}`);

    const command = new StartMedicalTranscriptionJobCommand({
      MedicalTranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      Media: {
        MediaFileUri: s3Uri,
      },
      OutputBucketName: process.env.AWS_S3_BUCKET_NAME,
      OutputKey: `transcripts/${jobName}.json`,
      Specialty: 'PRIMARYCARE',
      Type: 'CONVERSATION',
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 4, // Support up to 4 speakers
      },
    });

    await transcribeClient.send(command);

    // Update CaseRecord with job name and status
    const caseRecord = await prisma.caseRecord.upsert({
      where: { caseId },
      update:
        jobType === 'INTAKE'
          ? {
              intakeJobName: jobName,
              intakeTranscriptStatus: 'PROCESSING',
            }
          : {
              consultationJobName: jobName,
              consultationTranscriptStatus: 'PROCESSING',
            },
      create: {
        caseId,
        ...(jobType === 'INTAKE'
          ? {
              intakeJobName: jobName,
              intakeTranscriptStatus: 'PROCESSING',
            }
          : {
              consultationJobName: jobName,
              consultationTranscriptStatus: 'PROCESSING',
            }),
      },
    });

    logger.info(`Transcription job started successfully: ${jobName}`);

    return {
      jobName,
      status: 'PROCESSING',
      caseId,
    };
  } catch (error) {
    logger.error('Error starting transcription job:', error);
    throw new Error(`Failed to start transcription job: ${error.message}`);
  }
}

/**
 * Get transcription job status and results
 * @param {string} jobName - Transcription job name
 * @returns {Promise<{status: string, transcript?: string, formattedTranscript?: Array, error?: string}>}
 */
async function getTranscriptionStatus(jobName) {
  try {
    const command = new GetMedicalTranscriptionJobCommand({
      MedicalTranscriptionJobName: jobName,
    });

    const response = await transcribeClient.send(command);
    const job = response.MedicalTranscriptionJob;

    const status = job.TranscriptionJobStatus;

    // If completed, fetch and parse transcript
    if (status === 'COMPLETED') {
      const transcriptUri = job.Transcript.TranscriptFileUri;

      // Extract S3 key from URI
      const s3Key = transcriptUri.split(`${process.env.AWS_S3_BUCKET_NAME}/`)[1];

      // Fetch transcript from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      });

      const s3Response = await s3Client.send(getObjectCommand);
      const transcriptData = await streamToString(s3Response.Body);
      const transcriptJson = JSON.parse(transcriptData);

      // Parse speaker-labeled transcript
      const formattedTranscript = formatTranscript(transcriptJson);
      const plainTranscript = transcriptJson.results.transcripts[0].transcript;

      return {
        status: 'COMPLETED',
        transcript: plainTranscript,
        formattedTranscript,
        completionTime: job.CompletionTime,
      };
    }

    // If failed
    if (status === 'FAILED') {
      return {
        status: 'FAILED',
        error: job.FailureReason || 'Transcription job failed',
      };
    }

    // Still processing
    return {
      status: 'PROCESSING',
      creationTime: job.CreationTime,
    };
  } catch (error) {
    logger.error('Error getting transcription status:', error);
    throw new Error(`Failed to get transcription status: ${error.message}`);
  }
}

/**
 * Poll transcription job until completion or failure
 * @param {string} jobName - Transcription job name
 * @param {number} caseId - Case ID to update
 * @param {string} jobType - 'INTAKE' or 'CONSULTATION'
 * @param {number} maxAttempts - Maximum polling attempts (default: 60)
 * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
 * @returns {Promise<{status: string, transcript?: string, formattedTranscript?: Array}>}
 */
async function pollTranscriptionJob(
  jobName,
  caseId,
  jobType = 'INTAKE',
  maxAttempts = 60,
  intervalMs = 5000
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getTranscriptionStatus(jobName);

    if (result.status === 'COMPLETED') {
      // Update CaseRecord with transcript
      const updateData =
        jobType === 'INTAKE'
          ? {
              intakeTranscript: result.transcript,
              intakeTranscriptStatus: 'COMPLETED',
            }
          : {
              doctorTranscript: result.transcript,
              consultationTranscriptStatus: 'COMPLETED',
            };

      await prisma.caseRecord.update({
        where: { caseId },
        data: updateData,
      });

      logger.info(`Transcription completed for case ${caseId}`);
      return result;
    }

    if (result.status === 'FAILED') {
      // Update CaseRecord with failed status
      const updateData =
        jobType === 'INTAKE'
          ? { intakeTranscriptStatus: 'FAILED' }
          : { consultationTranscriptStatus: 'FAILED' };

      await prisma.caseRecord.update({
        where: { caseId },
        data: updateData,
      });

      logger.error(`Transcription failed for case ${caseId}: ${result.error}`);
      return result;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  // Timeout reached
  logger.warn(`Transcription polling timeout for job ${jobName}`);
  return {
    status: 'TIMEOUT',
    error: 'Transcription polling timeout - job still processing',
  };
}

/**
 * Helper: Convert stream to string
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Helper: Format transcript with speaker labels
 */
function formatTranscript(transcriptJson) {
  const segments = transcriptJson.results.speaker_labels?.segments || [];
  const items = transcriptJson.results.items || [];

  const formatted = [];
  let currentSpeaker = null;
  let currentText = '';

  segments.forEach((segment) => {
    const speaker = segment.speaker_label;
    const startTime = parseFloat(segment.start_time);
    const endTime = parseFloat(segment.end_time);

    // Get all items in this segment
    const segmentItems = items.filter((item) => {
      if (!item.start_time) return false;
      const itemTime = parseFloat(item.start_time);
      return itemTime >= startTime && itemTime <= endTime;
    });

    const text = segmentItems
      .map((item) => item.alternatives[0].content)
      .join(' ')
      .trim();

    if (speaker !== currentSpeaker) {
      if (currentText) {
        formatted.push({
          speakerLabel: formatSpeakerLabel(currentSpeaker),
          text: currentText.trim(),
        });
      }
      currentSpeaker = speaker;
      currentText = text;
    } else {
      currentText += ' ' + text;
    }
  });

  // Push last segment
  if (currentText) {
    formatted.push({
      speakerLabel: formatSpeakerLabel(currentSpeaker),
      text: currentText.trim(),
    });
  }

  return formatted;
}

/**
 * Helper: Convert AWS speaker labels (spk_0, spk_1) to readable format (Speaker 1, Speaker 2)
 */
function formatSpeakerLabel(awsLabel) {
  if (!awsLabel) return 'Unknown Speaker';
  
  // Extract number from spk_0, spk_1, etc.
  const match = awsLabel.match(/spk_(\d+)/);
  if (match) {
    const speakerNumber = parseInt(match[1]) + 1; // Convert 0-indexed to 1-indexed
    return `Speaker ${speakerNumber}`;
  }
  
  return awsLabel;
}

module.exports = {
  startTranscriptionJob,
  getTranscriptionStatus,
  pollTranscriptionJob,
};
