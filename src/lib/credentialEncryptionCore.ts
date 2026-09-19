// src/lib/credentialEncryptionCore.ts

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const rawKey =
    process.env.TIKOZAP_CREDENTIAL_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "Missing TIKOZAP_CREDENTIAL_ENCRYPTION_KEY"
    );
  }

  const key = Buffer.from(rawKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TIKOZAP_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }

  return key;
}

export function encryptCredential(
  plaintext: string
): string {
  const value = plaintext.trim();

  if (!value) {
    throw new Error(
      "Cannot encrypt an empty credential"
    );
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptCredential(
  payload: string
): string {
  const [
    version,
    ivBase64,
    tagBase64,
    encryptedBase64,
  ] = payload.split(".");

  if (
    version !== "v1" ||
    !ivBase64 ||
    !tagBase64 ||
    !encryptedBase64
  ) {
    throw new Error(
      "Invalid encrypted credential format"
    );
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(
    tagBase64,
    "base64"
  );
  const encrypted = Buffer.from(
    encryptedBase64,
    "base64"
  );

  if (iv.length !== IV_LENGTH) {
    throw new Error(
      "Invalid encrypted credential IV"
    );
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      "Invalid encrypted credential authentication tag"
    );
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}