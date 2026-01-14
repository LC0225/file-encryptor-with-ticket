/**
 * 加密结果
 */
export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
  algorithm: 'AES-GCM' | 'AES-CBC';
}

/**
 * 加密历史记录（只存储元数据，不存储加密数据）
 */
export interface EncryptionHistory {
  id: string;
  fileName: string;
  fileType: string;
  ticket: string;
  algorithm: 'AES-GCM' | 'AES-CBC';
  createdAt: string;
  fileSize: number;
}

/**
 * 加密文件结果（包含ticket）
 */
export interface EncryptedFileResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
  ticket: string;
}

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  passwordHash?: string; // 可选，返回用户信息时不包含密码哈希
  email?: string;
  createdAt: string;
  role: 'admin' | 'user';
}

/**
 * 用户会话
 */
export interface Session {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  loginTime: string;
}

/**
 * 应用数据（云端存储格式）
 */
export interface AppData {
  version: number;
  users: User[];
  history: EncryptionHistory[];
}

/**
 * 同步状态
 */
export interface SyncStatus {
  enabled: boolean;
  lastSyncTime: number | null;
  syncing: boolean;
  cloudExists: boolean;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  message: string;
  downloaded?: boolean;
  uploaded?: boolean;
  conflict?: boolean;
  cloudData?: AppData;
  cloudExists?: boolean;
}

/**
 * 解密文件结果
 */
export interface DecryptedFile {
  data: Blob;
  fileName: string;
  fileType: string;
}
