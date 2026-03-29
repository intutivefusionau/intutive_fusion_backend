const prisma = require('../../prisma/client');

/**
 * Handles file uploads (audio files)
 */
class FileService {
  /**
   * Save file record
   */
  static async uploadFile(payload) {
    return prisma.file.create({
      data: {
        caseId: payload.caseId,
        fileType: payload.fileType,
        fileUrl: payload.fileUrl
      }
    });
  }

  /**
   * Get files by case
   */
  static async getFilesByCase(caseId) {
    return prisma.file.findMany({
      where: { caseId }
    });
  }
}

module.exports = { FileService };