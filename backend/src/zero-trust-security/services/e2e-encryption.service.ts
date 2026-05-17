import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encryptedContent: string;
  encryptedKey: string;
  algorithm: string;
  keyAlgorithm: string;
  iv: string;
  authTag?: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
}

@Injectable()
export class E2EEncryptionService {
  private readonly logger = new Logger(E2EEncryptionService.name);
  private readonly symmetricAlgorithm = 'aes-256-gcm';
  private readonly asymmetricAlgorithm = 'rsa';
  private readonly keySize = 4096;

  constructor(private config: ConfigService) {}

  /**
   * Generate RSA key pair for a user
   */
  generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey,
      privateKey,
      algorithm: this.asymmetricAlgorithm,
    };
  }

  /**
   * Encrypt medical data with end-to-end encryption
   * Data is encrypted with AES symmetric key, then key is encrypted with recipient's public key
   */
  async encryptMedicalData(data: any, recipientPublicKey: string): Promise<EncryptedData> {
    try {
      // Step 1: Generate random symmetric key
      const symmetricKey = crypto.randomBytes(32); // 256 bits for AES-256

      // Step 2: Generate initialization vector
      const iv = crypto.randomBytes(16);

      // Step 3: Encrypt data with symmetric key (AES-256-GCM)
      const cipher = crypto.createCipheriv(this.symmetricAlgorithm, symmetricKey, iv);

      const dataString = JSON.stringify(data);
      let encryptedContent = cipher.update(dataString, 'utf8', 'base64');
      encryptedContent += cipher.final('base64');

      // Get authentication tag for GCM mode
      const authTag = cipher.getAuthTag();

      // Step 4: Encrypt symmetric key with recipient's public key (RSA)
      const encryptedKey = crypto.publicEncrypt(
        {
          key: recipientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        symmetricKey
      );

      return {
        encryptedContent,
        encryptedKey: encryptedKey.toString('base64'),
        algorithm: this.symmetricAlgorithm,
        keyAlgorithm: `${this.asymmetricAlgorithm}-oaep`,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      };
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt medical data with private key
   * Only the holder of the private key can decrypt
   */
  async decryptMedicalData(encrypted: EncryptedData, privateKey: string): Promise<any> {
    try {
      // Step 1: Decrypt symmetric key with private key
      const encryptedKeyBuffer = Buffer.from(encrypted.encryptedKey, 'base64');

      const symmetricKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedKeyBuffer
      );

      // Step 2: Decrypt data with symmetric key
      const iv = Buffer.from(encrypted.iv, 'base64');
      const authTag = encrypted.authTag ? Buffer.from(encrypted.authTag, 'base64') : undefined;

      const decipher = crypto.createDecipheriv(this.symmetricAlgorithm, symmetricKey, iv);

      if (authTag) {
        decipher.setAuthTag(authTag);
      }

      let decryptedData = decipher.update(encrypted.encryptedContent, 'base64', 'utf8');
      decryptedData += decipher.final('utf8');

      return JSON.parse(decryptedData);
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`, error.stack);
      throw new Error('Failed to decrypt data - invalid private key or corrupted data');
    }
  }

  /**
   * Encrypt data for multiple recipients (e.g., doctor + family member)
   */
  async encryptForMultipleRecipients(
    data: any,
    recipientPublicKeys: string[]
  ): Promise<{ encryptedContent: string; recipientKeys: Array<{ index: number; encryptedKey: string }> }> {
    try {
      // Generate single symmetric key
      const symmetricKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt data once
      const cipher = crypto.createCipheriv(this.symmetricAlgorithm, symmetricKey, iv);

      const dataString = JSON.stringify(data);
      let encryptedContent = cipher.update(dataString, 'utf8', 'base64');
      encryptedContent += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Encrypt symmetric key for each recipient
      const recipientKeys = recipientPublicKeys.map((publicKey, index) => {
        const encryptedKey = crypto.publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          symmetricKey
        );

        return {
          index,
          encryptedKey: encryptedKey.toString('base64'),
        };
      });

      return {
        encryptedContent: JSON.stringify({
          content: encryptedContent,
          iv: iv.toString('base64'),
          authTag: authTag.toString('base64'),
        }),
        recipientKeys,
      };
    } catch (error) {
      this.logger.error(`Multi-recipient encryption error: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt for multiple recipients');
    }
  }

  /**
   * Sign data to verify integrity and authenticity
   */
  signData(data: any, privateKey: string): string {
    try {
      const dataString = JSON.stringify(data);

      const sign = crypto.createSign('SHA256');
      sign.update(dataString);
      sign.end();

      const signature = sign.sign(privateKey, 'base64');
      return signature;
    } catch (error) {
      this.logger.error(`Signing error: ${error.message}`, error.stack);
      throw new Error('Failed to sign data');
    }
  }

  /**
   * Verify data signature
   */
  verifySignature(data: any, signature: string, publicKey: string): boolean {
    try {
      const dataString = JSON.stringify(data);

      const verify = crypto.createVerify('SHA256');
      verify.update(dataString);
      verify.end();

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(`Verification error: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hashData(data: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');

    const hash = crypto.pbkdf2Sync(
      data,
      useSalt,
      100000, // iterations
      64, // key length
      'sha512'
    ).toString('hex');

    return { hash, salt: useSalt };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computedHash = crypto.pbkdf2Sync(
      data,
      salt,
      100000,
      64,
      'sha512'
    ).toString('hex');

    return computedHash === hash;
  }

  /**
   * Encrypt at rest (for database storage)
   */
  encryptAtRest(data: any): { encrypted: string; iv: string; authTag: string } {
    try {
      // Use application-level encryption key
      const masterKey = this.getMasterKey();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      };
    } catch (error) {
      this.logger.error(`At-rest encryption error: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt data at rest');
    }
  }

  /**
   * Decrypt at rest (from database storage)
   */
  decryptAtRest(encrypted: string, iv: string, authTag: string): any {
    try {
      const masterKey = this.getMasterKey();
      const ivBuffer = Buffer.from(iv, 'base64');
      const authTagBuffer = Buffer.from(authTag, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(`At-rest decryption error: ${error.message}`, error.stack);
      throw new Error('Failed to decrypt data at rest');
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Derive key from password (for user-based encryption)
   */
  deriveKeyFromPassword(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      100000,
      32, // 256 bits
      'sha512'
    );
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getMasterKey(): Buffer {
    // Get master encryption key from environment or key management service
    const masterKeyHex = this.config.get<string>('MASTER_ENCRYPTION_KEY');

    if (!masterKeyHex) {
      this.logger.warn('Master encryption key not configured, using default (INSECURE)');
      // In production, this should fail - never use default keys
      return crypto.scryptSync('default-key-change-me', 'salt', 32);
    }

    return Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Rotate encryption keys (for compliance)
   */
  async rotateKeys(oldPrivateKey: string, newKeyPair: KeyPair, encryptedData: EncryptedData[]): Promise<EncryptedData[]> {
    this.logger.log('Starting key rotation');

    const reEncryptedData: EncryptedData[] = [];

    for (const encrypted of encryptedData) {
      try {
        // Decrypt with old key
        const decrypted = await this.decryptMedicalData(encrypted, oldPrivateKey);

        // Re-encrypt with new key
        const reEncrypted = await this.encryptMedicalData(decrypted, newKeyPair.publicKey);

        reEncryptedData.push(reEncrypted);
      } catch (error) {
        this.logger.error(`Failed to rotate key for data: ${error.message}`);
      }
    }

    this.logger.log(`Key rotation complete: ${reEncryptedData.length}/${encryptedData.length} successful`);

    return reEncryptedData;
  }
}
