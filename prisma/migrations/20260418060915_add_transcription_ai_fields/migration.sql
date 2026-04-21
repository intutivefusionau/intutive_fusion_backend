-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'RECEPTION';

-- AlterTable
ALTER TABLE "CaseRecord" ADD COLUMN     "caseSummary" JSONB,
ADD COLUMN     "consultationJobName" TEXT,
ADD COLUMN     "consultationTranscriptStatus" TEXT,
ADD COLUMN     "followUpQuestions" JSONB,
ADD COLUMN     "intakeJobName" TEXT,
ADD COLUMN     "intakeTranscriptStatus" TEXT;
