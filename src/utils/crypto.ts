export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
  algorithm: 'AES-GCM' | 'AES-CBC';
}

export interface DecryptionResult {
  decryptedData: Blob;
  fileName: string;
  fileType: string;
}

/**
 * 将Uint8Array转换为base64字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将base64字符串转换为Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  // 检查输入
  if (typeof base64 !== 'string') {
    throw new Error('base64 input is not a string');
  }

  // 清理字符串：移除空格、换行符等
  const cleanBase64 = base64.replace(/[\s\r\n]/g, '');

  // 检查 base64 格式
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
    throw new Error('base64 string contains invalid characters');
  }

  if (cleanBase64.length === 0) {
    throw new Error('base64 string is empty');
  }

  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
 * 从ticket生成AES-GCM加密密钥
 */
async function deriveKeyGCM(ticket: string): Promise<CryptoKey> {
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
      salt: encoder.encode('file-encryption-gcm-salt'),
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
 * 从ticket生成AES-CBC加密密钥
 */
async function deriveKeyCBC(ticket: string): Promise<CryptoKey> {
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
      salt: encoder.encode('file-encryption-cbc-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用AES-GCM加密文件
 */
export async function encryptFileGCM(file: File, ticket: string): Promise<EncryptionResult> {
  const fileData = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyGCM(ticket);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileData
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer),
    fileName: file.name,
    fileType: file.type,
    algorithm: 'AES-GCM',
  };
}

/**
 * 使用AES-CBC加密文件
 */
export async function encryptFileCBC(file: File, ticket: string): Promise<EncryptionResult> {
  const fileData = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyCBC(ticket);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: iv,
    },
    key,
    fileData
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer),
    fileName: file.name,
    fileType: file.type,
    algorithm: 'AES-CBC',
  };
}

/**
 * 解密文件（自动检测算法）
 */
export async function decryptFile(
  encryptedData: string,
  iv: string,
  ticket: string,
  originalFileName: string,
  originalFileType: string,
  algorithm: 'AES-GCM' | 'AES-CBC' = 'AES-GCM'
): Promise<DecryptionResult> {
  const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);
  const encryptedBuffer = base64ToArrayBuffer(encryptedData) as BufferSource;
  const ivBuffer = base64ToArrayBuffer(iv) as BufferSource;

  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: algorithm,
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
 * 向后兼容的加密函数（默认使用AES-GCM）
 * @deprecated 请使用 encryptFileGCM 或 encryptFileCBC
 */
export async function encryptFile(file: File, ticket: string): Promise<EncryptionResult> {
  return encryptFileGCM(file, ticket);
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
