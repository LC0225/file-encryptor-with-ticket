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
 * 添加加密记录
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
      ...record,
      id: Date.now().toString(),
      ticket,
      createdAt: new Date().toISOString(),
      fileSize,
    };
    history.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // 触发云同步
    syncToCloud().catch(error => console.error('添加加密历史后云同步失败:', error));
  } catch (error) {
    console.error('保存加密历史失败:', error);
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
