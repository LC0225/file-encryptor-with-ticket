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
    ['encrypt', 'decrypt']
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
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密单个数据块
 */
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

      // 分块加密以支持进度显示
      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
      const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);
      const encryptedChunks = [];
      const ivs = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileData.byteLength);
        const chunk = fileData.slice(start, end);

        // 加密当前块
        const result = await encryptChunk(chunk, algorithm, ticket);
        encryptedChunks.push(result.encryptedData);
        ivs.push(result.iv);

        // 发送进度更新
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
      const combinedData = new Uint8Array(totalEncryptedLength);
      let offset = 0;
      for (const chunk of encryptedChunks) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }

      // 使用第一个块的IV作为整个文件的IV（简化方案）
      const finalIV = ivs[0];

      // 发送完成消息 - 直接发送Uint8Array
      self.postMessage({
        type: 'COMPLETE',
        data: {
          encryptedData: combinedData,
          iv: finalIV,
          chunkCount: totalChunks
        }
      }, [combinedData.buffer, finalIV.buffer]); // Transferable Objects
    } else if (type === 'DECRYPT') {
      // 解密功能（分块处理以支持进度显示）
      const { encryptedData, iv, ticket, algorithm } = data;

      // 更健壮的 base64 解码函数
      function base64ToArrayBuffer(base64) {
        // 检查输入
        if (typeof base64 !== 'string') {
          throw new Error('Base64 input is not a string');
        }

        // 清理字符串：移除空格、换行符等
        const cleanBase64 = base64.replace(/[\s\r\n]/g, '');

        // 检查 base64 格式
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
          throw new Error('Base64 string contains invalid characters');
        }

        if (cleanBase64.length === 0) {
          throw new Error('Base64 string is empty');
        }

        try {
          const binaryString = atob(cleanBase64);
          const length = binaryString.length;

          // 检查长度是否合理
          if (length <= 0 || length > 2 * 1024 * 1024 * 1024) { // 最大2GB
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

      // 分块解密以支持进度显示
      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
      const totalChunks = Math.ceil(encryptedBuffer.byteLength / CHUNK_SIZE);
      const decryptedChunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, encryptedBuffer.byteLength);
        const chunk = encryptedBuffer.slice(start, end);

        // 解密当前块（注意：这里使用相同的IV简化处理，生产环境可能需要为每块生成不同的IV）
        const decryptedData = await crypto.subtle.decrypt(
          {
            name: algorithm,
            iv: ivBuffer,
          },
          key,
          chunk
        );

        decryptedChunks.push(new Uint8Array(decryptedData));

        // 发送进度更新
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
      const combinedData = new Uint8Array(totalDecryptedLength);
      let offset = 0;
      for (const chunk of decryptedChunks) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }

      self.postMessage({
        type: 'COMPLETE',
        data: {
          decryptedData: combinedData
        }
      }, [combinedData.buffer]);
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
