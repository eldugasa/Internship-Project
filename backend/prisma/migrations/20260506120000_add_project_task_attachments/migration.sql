ALTER TABLE "Project"
ADD COLUMN "attachmentName" TEXT,
ADD COLUMN "attachmentUrl" TEXT,
ADD COLUMN "attachmentMimeType" TEXT;

ALTER TABLE "Task"
ADD COLUMN "attachmentName" TEXT,
ADD COLUMN "attachmentUrl" TEXT,
ADD COLUMN "attachmentMimeType" TEXT;
