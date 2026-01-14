import { EncryptionResult } from './crypto';
import { syncToCloud } from './dataSync';
import { EncryptionHistory } from '@/types';
import { getCurrentUser } from './auth';

/**
 * 获取用户特定的存储键
 */
function getUserStorageKey(userId: string): string {
  return `encryption_history_${userId}`;
}

/**
 * 获取当前用户的存储键
 * 如果没有用户，使用默认键（用于兼容）
 */
async function getCurrentUserStorageKey(): Promise<string> {
  if (typeof window === 'undefined') return 'encryption_history';

  const user = await getCurrentUser();
  if (user && user.id) {
    return getUserStorageKey(user.id);
  }

  // 回退到旧版键名（兼容性）
  return 'encryption_history';
}

/**
 * 获取所有加密历史
 */
export async function getEncryptionHistory(): Promise<EncryptionHistory[]> {
  if (typeof window === 'undefined') return [];

  try {
    const storageKey = await getCurrentUserStorageKey();
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取加密历史失败:', error);
    return [];
  }
}

/**
 * 同步版本的获取加密历史（用于兼容性）
 */
export function getEncryptionHistorySync(): EncryptionHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    // 尝试从 localStorage 获取用户信息
    const userStr = localStorage.getItem('crypto_auth_token');
    let storageKey = 'encryption_history';

    if (userStr) {
      try {
        const user = JSON.parse(atob(userStr));
        if (user.id) {
          storageKey = getUserStorageKey(user.id);
        }
      } catch (error) {
        // 解析失败，使用默认键
      }
    }

    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取加密历史失败:', error);
    return [];
  }
}

/**
 * 添加加密记录（只存储元数据）
 */
export async function addEncryptionHistory(
  record: EncryptionResult,
  ticket: string,
  fileSize: number
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = await getCurrentUserStorageKey();
    const history = await getEncryptionHistory();
    const newRecord: EncryptionHistory = {
      fileName: record.fileName,
      fileType: record.fileType,
      ticket,
      algorithm: record.algorithm,
      createdAt: new Date().toISOString(),
      fileSize,
      id: Date.now().toString(),
    };
    history.unshift(newRecord);
    localStorage.setItem(storageKey, JSON.stringify(history));

    // 触发云同步
    syncToCloud().catch(error => console.error('添加加密历史后云同步失败:', error));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // localStorage 配额超出，尝试删除最旧的记录
      console.warn('localStorage 配额超出，尝试清理旧记录');
      try {
        const storageKey = await getCurrentUserStorageKey();
        const history = await getEncryptionHistory();
        if (history.length > 0) {
          // 删除最旧的记录（列表末尾）
          history.pop();
          const newRecord: EncryptionHistory = {
            fileName: record.fileName,
            fileType: record.fileType,
            ticket,
            algorithm: record.algorithm,
            createdAt: new Date().toISOString(),
            fileSize,
            id: Date.now().toString(),
          };
          history.unshift(newRecord);
          localStorage.setItem(storageKey, JSON.stringify(history));
          // 触发云同步
          syncToCloud().catch(err => console.error('添加加密历史后云同步失败:', err));
        }
      } catch (retryError) {
        console.error('清理旧记录后仍然无法保存:', retryError);
      }
    } else {
      console.error('保存加密历史失败:', error);
    }
  }
}

/**
 * 删除加密记录
 */
export async function deleteEncryptionHistory(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = await getCurrentUserStorageKey();
    const history = await getEncryptionHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));

    // 触发云同步
    syncToCloud().catch(error => console.error('删除加密历史后云同步失败:', error));
  } catch (error) {
    console.error('删除加密历史失败:', error);
  }
}

/**
 * 清空所有加密历史
 */
export async function clearEncryptionHistory(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = await getCurrentUserStorageKey();
    localStorage.removeItem(storageKey);

    // 触发云同步
    syncToCloud().catch(error => console.error('清空加密历史后云同步失败:', error));
  } catch (error) {
    console.error('清空加密历史失败:', error);
  }
}
