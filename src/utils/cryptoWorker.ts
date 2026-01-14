/**
 * 基于Worker的加密工具 - 支持大文件分块加密和进度显示
 */

export interface EncryptionProgress {
  progress: number;
  currentChunk: number;
  totalChunks: number;
}

export interface WorkerEncryptionResult {
  encryptedData: string;
  iv: string;
}

export type ProgressCallback = (progress: EncryptionProgress) => void;

/**
 * 使用Worker加密文件
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

        // 创建Worker
        const workerBlob = new Blob(
          [`importScripts('/encryption-worker.js');`],
          { type: 'application/javascript' }
        );
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
        });
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
 * 使用Worker解密文件
 */
export async function decryptFileWithWorker(
  encryptedData: string,
  iv: string,
  ticket: string,
  algorithm: 'AES-GCM' | 'AES-CBC'
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // 创建Worker
    const workerBlob = new Blob(
      [`importScripts('/encryption-worker.js');`],
      { type: 'application/javascript' }
    );
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
