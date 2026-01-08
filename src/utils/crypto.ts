import { Buffer } from 'buffer';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
}

export interface DecryptionResult {
  decryptedData: Blob;
  fileName: string;
  fileType: string;
}

/**
 * 生成一个随机ticket（密钥）
 */
export function generateTicket(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 从ticket生成加密密钥
 */
async function deriveKey(ticket: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ticket),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('file-encryption-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密文件
 */
export async function encryptFile(file: File, ticket: string): Promise<EncryptionResult> {
  const fileData = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(ticket);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileData
  );

  return {
    encryptedData: Buffer.from(encryptedData).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    fileName: file.name,
    fileType: file.type,
  };
}

/**
 * 解密文件
 */
export async function decryptFile(
  encryptedData: string,
  iv: string,
  ticket: string,
  originalFileName: string,
  originalFileType: string
): Promise<DecryptionResult> {
  const key = await deriveKey(ticket);
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');

  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encryptedBuffer
    );

    return {
      decryptedData: new Blob([decryptedData], { type: originalFileType }),
      fileName: originalFileName,
      fileType: originalFileType,
    };
  } catch (error) {
    throw new Error('解密失败：ticket不正确或数据已损坏');
  }
}

/**
 * 批量加密文件（每个文件独立ticket）
 */
export async function encryptFiles(files: File[]): Promise<Array<EncryptionResult & { ticket: string }>> {
  const results: Array<EncryptionResult & { ticket: string }> = [];
  for (const file of files) {
    const ticket = generateTicket();
    const result = await encryptFile(file, ticket);
    results.push({
      ...result,
      ticket,
    });
  }
  return results;
}
