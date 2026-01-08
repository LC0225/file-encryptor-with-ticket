/**
 * 加密结果
 */
export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
}

/**
 * 加密历史记录
 */
export interface EncryptionHistory extends EncryptionResult {
  id: string;
  ticket: string;
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
  passwordHash: string;
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
}

/**
 * 解密文件结果
 */
export interface DecryptedFile {
  data: Blob;
  fileName: string;
  fileType: string;
}
