/**
 * 基于Worker的加密工具 - 支持大文件分块加密和进度显示
 */

export interface EncryptionProgress {
  progress: number;
  currentChunk: number;
  totalChunks: number;
}

export interface WorkerEncryptionResult {
  encryptedData: Uint8Array;
  iv: Uint8Array;
}

export interface WorkerEncryptionResultBase64 {
  encryptedData: string;
  iv: string;
}

export type ProgressCallback = (progress: EncryptionProgress) => void;

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
 * 将Uint8Array转换为base64字符串（分块处理，避免大文件内存溢出）
 */
function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192; // 8KB chunks
  for (let i = 0; i < array.byteLength; i += chunkSize) {
    const chunk = array.subarray(i, Math.min(i + chunkSize, array.byteLength));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Worker代码（内联）
const workerCode = `
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB每块

/**
 * 从ticket生成AES-GCM加密密钥
 */
async function deriveKeyGCM(ticket) {
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
    ['encrypt']
  );
}

/**
 * 从ticket生成AES-CBC加密密钥
 */
async function deriveKeyCBC(ticket) {
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
    ['encrypt']
  );
}

/**
 * 加密文件数据
 */
async function encryptFile(fileData, algorithm, ticket) {
  const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);
  const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: algorithm,
      iv: iv,
    },
    key,
    fileData
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    iv: iv
  };
}

/**
 * 分块加密文件
 */
async function encryptFileChunked(fileData, algorithm, ticket, onProgress) {
  const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);
  let encryptedChunks = [];
  let iv;

  // 分块加密
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileData.byteLength);
    const chunk = fileData.slice(start, end);

    const result = await encryptFile(chunk, algorithm, ticket);
    encryptedChunks.push(result.encryptedData);

    // 保存第一块的IV（用于解密）
    if (i === 0) {
      iv = result.iv;
    }

    // 报告进度
    if (onProgress) {
      onProgress({
        progress: ((i + 1) / totalChunks) * 100,
        currentChunk: i + 1,
        totalChunks
      });
    }
  }

  // 合并所有加密块
  const totalEncryptedLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combinedData = new Uint8Array(totalEncryptedLength);
  let offset = 0;
  for (const chunk of encryptedChunks) {
    combinedData.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    encryptedData: combinedData,
    iv: iv
  };
}

// 监听主线程消息
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  try {
    if (type === 'ENCRYPT') {
      const { fileData, algorithm, ticket } = data;

      // 发送开始消息
      self.postMessage({
        type: 'START',
        data: { totalSize: fileData.byteLength }
      });

      // 执行分块加密
      const result = await encryptFileChunked(fileData, algorithm, ticket, (progress) => {
        self.postMessage({
          type: 'PROGRESS',
          data: progress
        });
      });

      // 发送完成消息 - 直接发送Uint8Array，不转base64
      self.postMessage({
        type: 'COMPLETE',
        data: {
          encryptedData: result.encryptedData,
          iv: result.iv
        }
      }, [result.encryptedData.buffer, result.iv.buffer]); // Transferable Objects
    } else if (type === 'DECRYPT') {
      // 解密功能（如果需要）
      const { encryptedData, iv, ticket, algorithm } = data;

      const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);
      const encryptedBuffer = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const ivBuffer = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: algorithm,
          iv: ivBuffer,
        },
        key,
        encryptedBuffer
      );

      self.postMessage({
        type: 'COMPLETE',
        data: {
          decryptedData: new Uint8Array(decryptedData)
        }
      }, [new Uint8Array(decryptedData).buffer]);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { message: error.message }
    });
  }
});
`;

/**
 * 使用Worker加密文件（返回Uint8Array）
 */
export async function encryptFileWithWorker(
  file: File,
  ticket: string,
  algorithm: 'AES-GCM' | 'AES-CBC',
  onProgress?: ProgressCallback
): Promise<WorkerEncryptionResult> {
  return new Promise((resolve, reject) => {
    // 读取文件数据
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as ArrayBuffer;

        // 创建Worker（直接内联代码）
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);

        // 监听消息
        worker.onmessage = (e) => {
          const { type, data } = e.data;

          switch (type) {
            case 'START':
              // 加密开始
              break;
            case 'PROGRESS':
              // 更新进度
              if (onProgress) {
                onProgress(data as EncryptionProgress);
              }
              break;
            case 'COMPLETE':
              // 加密完成
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              resolve(data as WorkerEncryptionResult);
              break;
            case 'ERROR':
              // 加密错误
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              reject(new Error(data.message));
              break;
          }
        };

        worker.onerror = (error) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error(`Worker错误: ${error.message}`));
        };

        // 发送加密任务
        worker.postMessage({
          type: 'ENCRYPT',
          data: {
            fileData,
            algorithm,
            ticket
          }
        }, [fileData]); // Transferable Object
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 将Worker结果转换为base64（仅在需要时调用）
 */
export function convertToBase64(result: WorkerEncryptionResult): WorkerEncryptionResultBase64 {
  return {
    encryptedData: uint8ArrayToBase64(result.encryptedData),
    iv: uint8ArrayToBase64(result.iv)
  };
}

/**
 * 使用Worker解密文件
 */
export async function decryptFileWithWorker(
  encryptedData: string,
  iv: string,
  ticket: string,
  algorithm: 'AES-GCM' | 'AES-CBC'
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // 创建Worker（直接内联代码）
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    // 监听消息
    worker.onmessage = (e) => {
      const { type, data } = e.data;

      switch (type) {
        case 'COMPLETE':
          // 解密完成
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(data.decryptedData as Uint8Array);
          break;
        case 'ERROR':
          // 解密错误
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error(data.message));
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Worker错误: ${error.message}`));
    };

    // 发送解密任务
    worker.postMessage({
      type: 'DECRYPT',
      data: {
        encryptedData,
        iv,
        ticket,
        algorithm
      }
    });
  });
}
