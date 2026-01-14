/**
 * 加密Worker - 用于在后台线程处理文件加密
 * 支持分块加密，避免大文件阻塞主线程
 */

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB每块

/**
 * 将Uint8Array转换为base64字符串
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

      // 发送完成消息
      self.postMessage({
        type: 'COMPLETE',
        data: {
          encryptedData: arrayBufferToBase64(result.encryptedData.buffer),
          iv: arrayBufferToBase64(result.iv.buffer)
        }
      });
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
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { message: error.message }
    });
  }
});
