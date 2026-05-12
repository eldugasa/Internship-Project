import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");

const sanitizeFileName = (value = "file") =>
  value.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildPublicAttachmentPath = (scope, fileName) =>
  `/uploads/${scope}/${fileName}`;

const resolveAttachmentPath = (attachmentUrl) => {
  if (!attachmentUrl?.startsWith("/uploads/")) {
    return null;
  }

  const relativePath = attachmentUrl.replace("/uploads/", "");
  return path.join(uploadsRoot, relativePath);
};

export const saveBase64Attachment = async (attachment, scope) => {
  if (!attachment?.content || !attachment?.name) {
    return null;
  }

  const matches = attachment.content.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid attachment format");
  }

  const [, mimeType, base64Content] = matches;
  const extension = path.extname(attachment.name) || "";
  const safeName = sanitizeFileName(path.basename(attachment.name, extension));
  const fileName = `${Date.now()}-${safeName}${extension}`;
  const targetDir = path.join(uploadsRoot, scope);
  const targetPath = path.join(targetDir, fileName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, Buffer.from(base64Content, "base64"));

  return {
    attachmentMimeType: attachment.type || mimeType,
    attachmentName: attachment.name,
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
