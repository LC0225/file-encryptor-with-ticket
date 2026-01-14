import { EncryptionResult } from './crypto';
import { syncToCloud } from './dataSync';
import { EncryptionHistory } from '@/types';

const STORAGE_KEY = 'encryption_history';

/**
 * 获取所有加密历史
 */
export function getEncryptionHistory(): EncryptionHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取加密历史失败:', error);
    return [];
  }
}

/**
 * 添加加密记录（只存储元数据）
 */
export function addEncryptionHistory(
  record: EncryptionResult,
  ticket: string,
  fileSize: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getEncryptionHistory();
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // 触发云同步
    syncToCloud().catch(error => console.error('添加加密历史后云同步失败:', error));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // localStorage 配额超出，尝试删除最旧的记录
      console.warn('localStorage 配额超出，尝试清理旧记录');
      try {
        const history = getEncryptionHistory();
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
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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
export function deleteEncryptionHistory(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getEncryptionHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // 触发云同步
    syncToCloud().catch(error => console.error('删除加密历史后云同步失败:', error));
  } catch (error) {
    console.error('删除加密历史失败:', error);
  }
}

/**
 * 清空所有加密历史
 */
export function clearEncryptionHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);

    // 触发云同步
    syncToCloud().catch(error => console.error('清空加密历史后云同步失败:', error));
  } catch (error) {
    console.error('清空加密历史失败:', error);
  }
}
