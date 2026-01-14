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
  chunkCount: number; // 块的数量
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
    ['encrypt', 'decrypt']
  );
}

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
    ['encrypt', 'decrypt']
  );
}

async function encryptChunk(chunkData, algorithm, ticket) {
  const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);
  const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: algorithm,
      iv: iv,
    },
    key,
    chunkData
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    iv: iv
  };
}

self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  try {
    if (type === 'ENCRYPT') {
      const { fileData, algorithm, ticket } = data;

      self.postMessage({
        type: 'START',
        data: { totalSize: fileData.byteLength }
      });

      let encryptedData;
      let iv;
      let chunkCount = 1; // 默认为1，用于AES-GCM

      if (algorithm === 'AES-GCM') {
        // AES-GCM：直接加密整个文件，不分块
        // 因为AES-GCM每个块需要不同的IV，分块解密会很复杂
        // 对于小于64GB的文件，直接加密是安全的
        const key = await deriveKeyGCM(ticket);
        iv = crypto.getRandomValues(new Uint8Array(12)); // GCM使用12字节IV
        encryptedData = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          fileData
        );
        encryptedData = new Uint8Array(encryptedData);
        chunkCount = 1; // AES-GCM不分块

        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 100, currentChunk: 1, totalChunks: 1 }
        });
      } else {
        // AES-CBC：分块加密，使用CBC链式特性
        // 每块使用前一块密文的最后16字节作为IV，第一个块使用随机IV
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
        const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);
        const encryptedChunks = [];

        // 生成初始IV并保存
        const initialIV = crypto.getRandomValues(new Uint8Array(16));
        let currentIV = new Uint8Array(initialIV);
        const key = await deriveKeyCBC(ticket);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, fileData.byteLength);
          const chunk = fileData.slice(start, end);

          // 加密当前块
          const encryptedChunk = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: currentIV },
            key,
            chunk
          );

          encryptedChunks.push(new Uint8Array(encryptedChunk));

          // 下一个块的IV是当前块密文的最后16字节
          const encryptedChunkUint8 = new Uint8Array(encryptedChunk);
          const last16Bytes = encryptedChunkUint8.slice(-16);
          currentIV = last16Bytes;

          self.postMessage({
            type: 'PROGRESS',
            data: {
              progress: ((i + 1) / totalChunks) * 100,
              currentChunk: i + 1,
              totalChunks: totalChunks
            }
          });
        }

        // 合并所有加密块
        const totalEncryptedLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        encryptedData = new Uint8Array(totalEncryptedLength);
        let offset = 0;
        const chunkCount = encryptedChunks.length; // 保存块数量
        for (const chunk of encryptedChunks) {
          encryptedData.set(chunk, offset);
          offset += chunk.length;
        }

        // 保存初始IV
        iv = initialIV;
      }

      self.postMessage({
        type: 'COMPLETE',
        data: {
          encryptedData: encryptedData,
          iv: iv,
          chunkCount: chunkCount
        }
      }, [encryptedData.buffer, iv.buffer]);
    } else if (type === 'DECRYPT') {
      const { encryptedData, iv, ticket, algorithm } = data;

      function base64ToArrayBuffer(base64) {
        if (typeof base64 !== 'string') {
          throw new Error('Base64 input is not a string');
        }

        const cleanBase64 = base64.replace(new RegExp('[\\s\\r\\n]', 'g'), '');

        if (!new RegExp('^[A-Za-z0-9+/]*={0,2}$').test(cleanBase64)) {
          throw new Error('Base64 string contains invalid characters');
        }

        if (cleanBase64.length === 0) {
          throw new Error('Base64 string is empty');
        }

        try {
          const binaryString = atob(cleanBase64);
          const length = binaryString.length;

          if (length <= 0 || length > 2 * 1024 * 1024 * 1024) {
            throw new Error('Invalid binary string length: ' + length);
          }

          const bytes = new Uint8Array(length);
          for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        } catch (error) {
          throw new Error('Base64 decode failed: ' + error.message);
        }
      }

      const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);
      const encryptedBuffer = base64ToArrayBuffer(encryptedData);
      const ivBuffer = base64ToArrayBuffer(iv);

      let decryptedData;

      if (algorithm === 'AES-GCM') {
        // AES-GCM：直接解密整个文件
        decryptedData = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBuffer,
          },
          key,
          encryptedBuffer
        );

        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 100, currentChunk: 1, totalChunks: 1 }
        });
      } else {
        // AES-CBC：直接解密整个文件，不分块
        // 与AES-GCM保持一致，与加密逻辑对应
        decryptedData = await crypto.subtle.decrypt(
          {
            name: 'AES-CBC',
            iv: ivBuffer,
          },
          key,
          encryptedBuffer
        );
        decryptedData = new Uint8Array(decryptedData);

        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 100, currentChunk: 1, totalChunks: 1 }
        });
      }

      self.postMessage({
        type: 'COMPLETE',
        data: {
          decryptedData: new Uint8Array(decryptedData)
        }
      }, [new Uint8Array(decryptedData).buffer]);
    } else if (type === 'DECRYPT_RAW') {
      // 直接处理 Uint8Array，避免 base64 转换
      const { encryptedData, iv, ticket, algorithm, originalFileSize } = data;

      const key = algorithm === 'AES-GCM' ? await deriveKeyGCM(ticket) : await deriveKeyCBC(ticket);

      self.postMessage({
        type: 'START',
        data: { totalSize: encryptedData.byteLength }
      });

      let decryptedData;

      if (algorithm === 'AES-GCM') {
        // AES-GCM：直接解密整个文件，不分块
        decryptedData = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          key,
          encryptedData
        );

        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 100, currentChunk: 1, totalChunks: 1 }
        });
      } else {
        // AES-CBC：分块解密，使用CBC链式特性
        // 根据原始文件大小计算每个加密块的边界
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
        const decryptedChunks = [];
        let currentIV = iv; // 初始IV

        // 如果没有提供原始文件大小，回退到直接解密整个文件
        if (!originalFileSize) {
          decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: currentIV },
            key,
            encryptedData
          );
          decryptedData = new Uint8Array(decryptedData);

          self.postMessage({
            type: 'PROGRESS',
            data: { progress: 100, currentChunk: 1, totalChunks: 1 }
          });
        } else {
          // 计算总块数
          const totalChunks = Math.ceil(originalFileSize / CHUNK_SIZE);
          let encryptedOffset = 0;

          for (let i = 0; i < totalChunks; i++) {
            // 计算当前明文块的大小
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, originalFileSize);
            const plainChunkSize = end - start;

            // 计算当前密文块的大小（向上取整到16字节的倍数）
            const cipherChunkSize = Math.ceil(plainChunkSize / 16) * 16;

            // 提取当前密文块
            const cipherChunk = encryptedData.slice(encryptedOffset, encryptedOffset + cipherChunkSize);
            encryptedOffset += cipherChunkSize;

            // 解密当前块
            const decryptedChunk = await crypto.subtle.decrypt(
              { name: 'AES-CBC', iv: currentIV },
              key,
              cipherChunk
            );

            decryptedChunks.push(new Uint8Array(decryptedChunk));

            // 下一个块的IV是当前密文块的最后16字节
            const last16Bytes = cipherChunk.slice(-16);
            currentIV = last16Bytes;

            self.postMessage({
              type: 'PROGRESS',
              data: {
                progress: ((i + 1) / totalChunks) * 100,
                currentChunk: i + 1,
                totalChunks: totalChunks
              }
            });
          }

          // 合并所有解密块
          const totalDecryptedLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
          decryptedData = new Uint8Array(totalDecryptedLength);
          let offset = 0;
          for (const chunk of decryptedChunks) {
            decryptedData.set(chunk, offset);
            offset += chunk.length;
          }
        }
      }

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
  algorithm: 'AES-GCM' | 'AES-CBC',
  onProgress?: ProgressCallback
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
        case 'PROGRESS':
          // 更新进度
          if (onProgress) {
            onProgress(data as EncryptionProgress);
          }
          break;
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

/**
 * 使用Worker解密文件（直接处理Uint8Array，避免base64转换）
 */
export async function decryptFileWithWorkerRaw(
  encryptedData: Uint8Array,
  iv: Uint8Array,
  ticket: string,
  algorithm: 'AES-GCM' | 'AES-CBC',
  originalFileSize?: number,
  onProgress?: ProgressCallback
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
        case 'START':
          // 解密开始
          break;
        case 'PROGRESS':
          // 更新进度
          if (onProgress) {
            onProgress(data as EncryptionProgress);
          }
          break;
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

    // 发送解密任务（只转移大的 encryptedData，IV 很小不需要转移）
    // 注意：不能同时转移多个可能共享同一底层buffer的ArrayBuffer
    worker.postMessage({
      type: 'DECRYPT_RAW',
      data: {
        encryptedData,
        iv,
        ticket,
        algorithm,
        originalFileSize
      }
    }, [encryptedData.buffer]);
  });
}
