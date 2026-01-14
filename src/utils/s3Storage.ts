import { S3Storage } from "coze-coding-dev-sdk";

// 对象存储实例（仅在服务器端使用）
let storageInstance: S3Storage | null = null;

/**
 * 获取对象存储实例（单例模式，仅服务器端使用）
 */
export function getS3Storage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });
  }
  return storageInstance;
}

/**
 * 上传应用数据到对象存储
 * @param data 应用数据对象
 * @returns 存储的文件 key
 */
export async function uploadAppData(data: any): Promise<string> {
  const storage = getS3Storage();
  const jsonContent = JSON.stringify(data, null, 2);

  // 在服务器端环境，使用 Buffer
  const buffer = Buffer.from(jsonContent, 'utf-8');

  const fileKey = await storage.uploadFile({
    fileContent: buffer,
    fileName: `file-encrypt/app-data.json`,
    contentType: 'application/json',
  });

  return fileKey;
}

/**
 * 从对象存储下载应用数据
 * @returns 应用数据对象，如果文件不存在则返回 null
 */
export async function downloadAppData(): Promise<any | null> {
  try {
    const storage = getS3Storage();
    const fileKey = `file-encrypt/app-data.json`;

    // 检查文件是否存在
    const exists = await storage.fileExists({ fileKey });
    if (!exists) {
      return null;
    }

    // 读取文件内容
    const buffer = await storage.readFile({ fileKey });

    // 使用 TextDecoder 解码（浏览器兼容）
    const decoder = new TextDecoder();
    const jsonContent = decoder.decode(buffer);
    const data = JSON.parse(jsonContent);

    return data;
  } catch (error) {
    console.error('下载应用数据失败:', error);
    return null;
  }
}

/**
 * 检查云端数据是否存在
 */
export async function checkCloudDataExists(): Promise<boolean> {
  try {
    const storage = getS3Storage();
    return await storage.fileExists({ fileKey: `file-encrypt/app-data.json` });
  } catch (error) {
    console.error('检查云端数据失败:', error);
    return false;
  }
}
