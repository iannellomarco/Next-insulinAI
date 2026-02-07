import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Returns format: iv:authTag:encrypted (all base64)
 */
export function encryptField(plaintext: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        console.warn('[Crypto] ENCRYPTION_KEY not set, storing plaintext');
        return plaintext;
    }

    try {
        const keyBuffer = Buffer.from(key, 'base64').slice(0, 32);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();

        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
        console.error('[Crypto] Encryption failed:', error);
        return plaintext;
    }
}

/**
 * Decrypts a ciphertext string encrypted with encryptField
 * Expects format: iv:authTag:encrypted (all base64)
 */
export function decryptField(ciphertext: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        // If no key, assume plaintext (backwards compatibility)
        return ciphertext;
    }

    // Check if it's encrypted format (contains colons)
    if (!ciphertext.includes(':')) {
        // Not encrypted, return as-is (legacy data)
        return ciphertext;
    }

    try {
        const [ivB64, authTagB64, encrypted] = ciphertext.split(':');
        const keyBuffer = Buffer.from(key, 'base64').slice(0, 32);
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[Crypto] Decryption failed:', error);
        // Return original if decryption fails (might be legacy plaintext)
        return ciphertext;
    }
}

/**
 * Check if a field appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 24; // Base64 IV is 24 chars
}
