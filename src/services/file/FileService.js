const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const prisma = require('../../prisma/client');
const logger = require('../../utils/logger');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Handles file uploads (audio files)
 */
class FileService {
  /**
   * Upload file to S3 and save record
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @param {number} caseId - Case ID
   * @param {string} fileType - File type (INTAKE_AUDIO or DOCTOR_AUDIO)
   * @returns {Promise<{file, s3Key, s3Uri}>}
   */
  static async uploadFile(fileBuffer, fileName, contentType, caseId, fileType) {
    try {
      // Generate unique S3 key
      const timestamp = Date.now();
      const s3Key = `audio/${fileType.toLowerCase()}-${caseId}-${timestamp}-${fileName}`;

      logger.info(`Uploading file to S3: ${s3Key}`);

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType || 'audio/wav',
      });

      await s3Client.send(uploadCommand);

      const s3Uri = `s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      // Save file record in database
      const file = await prisma.file.create({
        data: {
          caseId,
          fileType,
          fileUrl,
        },
      });

      logger.info(`File uploaded successfully: ${s3Key}`);

      return {
        file,
        s3Key,
        s3Uri,
      };
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get files by case
   */
  static async getFilesByCase(caseId) {
    return prisma.file.findMany({
      where: { caseId },
    });
  }
}

module.exports = { FileService };