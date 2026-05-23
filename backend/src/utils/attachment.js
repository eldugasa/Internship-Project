import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MIME_EXTENSION_MAP = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "text/plain": ".txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

const sanitizeFileName = (value = "file") =>
  value
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80) || "file";

const buildPublicAttachmentPath = (scope, fileName) =>
  `/uploads/${scope}/${fileName}`;

const resolveAttachmentPath = (attachmentUrl) => {
  if (!attachmentUrl?.startsWith("/uploads/")) {
    return null;
  }

  const relativePath = attachmentUrl.replace("/uploads/", "");
  const candidatePath = path.resolve(uploadsRoot, relativePath);

  if (!candidatePath.startsWith(uploadsRoot)) {
    return null;
  }

  return candidatePath;
};

const normalizeExtension = (fileName = "", mimeType = "") => {
  const providedExtension = path.extname(fileName || "").toLowerCase();
  const expectedExtension = MIME_EXTENSION_MAP[mimeType] || "";

  if (!providedExtension) {
    return expectedExtension;
  }

  return providedExtension === expectedExtension || !expectedExtension
    ? providedExtension
    : expectedExtension;
};

const decodeBase64Attachment = (content = "") => {
  const matches = content.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid attachment format");
  }

  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
};

export const saveBase64Attachment = async (attachment, scope) => {
  if (!attachment?.content || !attachment?.name) {
    return null;
  }

  const { mimeType, buffer } = decodeBase64Attachment(attachment.content);
  const normalizedMimeType = (attachment.type || mimeType || "").toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error("Unsupported attachment type");
  }

  if (!buffer.length || buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Attachment exceeds the 5 MB size limit");
  }

  const extension = normalizeExtension(attachment.name, normalizedMimeType);
  const safeName = sanitizeFileName(path.basename(attachment.name, path.extname(attachment.name)));
  const randomSuffix = crypto.randomUUID();
  const fileName = `${Date.now()}-${randomSuffix}-${safeName}${extension}`;
  const targetDir = path.join(uploadsRoot, scope);
  const targetPath = path.join(targetDir, fileName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, buffer, { flag: "wx" });

  return {
    attachmentMimeType: normalizedMimeType,
    attachmentName: `${safeName}${extension}`,
    attachmentUrl: buildPublicAttachmentPath(scope, fileName),
  };
};

export const deleteStoredAttachment = async (attachmentUrl) => {
  const filePath = resolveAttachmentPath(attachmentUrl);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};
