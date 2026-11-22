import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for GCM

export function getEncryptionKey(): Buffer {
  const secret =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Email is disabled: SETTINGS_ENCRYPTION_KEY is not set on the server.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts plain text using AES-256-GCM authenticated encryption.
 * Output format: iv_hex:authTag_hex:cipherText_hex
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a cipher text formatted as iv_hex:authTag_hex:cipherText_hex.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText || typeof cipherText !== "string") return "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) return "";
  const [ivHex, tagHex, encryptedHex] = parts;
  if (!ivHex || !tagHex || !encryptedHex) return "";

  const key = getEncryptionKey();
  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err: any) {
    console.error("[decryptSecret Error]: Decryption failed:", err?.message || err);
    return "";
  }
}
