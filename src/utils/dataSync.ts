import { User } from './authLocalStorage';
import { getCurrentUser } from './auth';
import { EncryptionHistory } from '@/types';
import type { AppData, SyncResult, SyncStatus } from '@/types';

// 同步状态（存储在 localStorage）
const SYNC_STATUS_KEY = 'crypto_sync_status';

/**
 * 获取用户特定的存储键
 */
function getUserStorageKey(userId: string): string {
  return `encryption_history_${userId}`;
}

/**
 * 获取当前用户的加密历史键
 */
async function getCurrentUserHistoryKey(): Promise<string> {
  if (typeof window === 'undefined') return 'encryption_history';

  const user = await getCurrentUser();
  if (user && user.id) {
    return getUserStorageKey(user.id);
  }

  return 'encryption_history';
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): SyncStatus {
  if (typeof window === 'undefined') {
    return { enabled: true, lastSyncTime: null, syncing: false, cloudExists: false };
  }

  try {
    const data = localStorage.getItem(SYNC_STATUS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取同步状态失败:', error);
  }

  return { enabled: true, lastSyncTime: null, syncing: false, cloudExists: false };
}

/**
 * 更新同步状态
 */
function updateSyncStatus(updates: Partial<SyncStatus>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getSyncStatus();
    const updated = { ...current, ...updates };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('更新同步状态失败:', error);
  }
}

/**
 * 从 localStorage 获取本地数据
 */
async function getLocalData(): Promise<AppData> {
  const version = Date.now();

  // 获取用户数据
  let users: User[] = [];
  try {
    const usersData = localStorage.getItem('crypto_users');
    users = usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('读取本地用户数据失败:', error);
  }

  // 获取加密历史（用户特定的）
  let history: EncryptionHistory[] = [];
  try {
    const historyKey = await getCurrentUserHistoryKey();
    const historyData = localStorage.getItem(historyKey);
    history = historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('读取本地加密历史失败:', error);
  }

  return { version, users, history };
}

/**
 * 将云端数据应用到 localStorage
 */
async function applyCloudDataToLocal(data: AppData): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 保存用户数据
    localStorage.setItem('crypto_users', JSON.stringify(data.users));

    // 保存加密历史（用户特定的）
    const historyKey = await getCurrentUserHistoryKey();
    localStorage.setItem(historyKey, JSON.stringify(data.history));
  } catch (error) {
    console.error('应用云端数据失败:', error);
    throw error;
  }
}

/**
 * 从云端下载同步（下拉同步）
 * @returns 同步结果
 */
export async function syncFromCloud(): Promise<SyncResult> {
  try {
    updateSyncStatus({ syncing: true });

    // 通过 API 下载云端数据
    const response = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'download' }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || '下载云端数据失败',
      };
    }

    const result: SyncResult = await response.json();

    if (!result.success) {
      return result;
    }

    // 检查云端数据是否存在
    updateSyncStatus({ cloudExists: result.cloudExists || false });

    if (!result.downloaded || !result.cloudData) {
      return {
        success: true,
        message: result.message || '云端暂无数据，将使用本地数据',
      };
    }

    // 获取本地数据版本（从同步状态中）
    const syncStatus = getSyncStatus();
    const localVersion = syncStatus.lastSyncTime || 0;

    // 比较版本，云端更新则使用云端数据
    if (result.cloudData.version > localVersion) {
      await applyCloudDataToLocal(result.cloudData);
      updateSyncStatus({ lastSyncTime: result.cloudData.version });

      return {
        success: true,
        message: result.message || '从云端同步成功',
        downloaded: true,
      };
    } else {
      return {
        success: true,
        message: '本地数据已是最新',
        downloaded: false,
      };
    }
  } catch (error) {
    console.error('云同步失败:', error);
    return {
      success: false,
      message: `云同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  } finally {
    updateSyncStatus({ syncing: false });
  }
}

/**
 * 上传到云端同步（上传同步）
 * @returns 同步结果
 */
export async function syncToCloud(): Promise<SyncResult> {
  try {
    updateSyncStatus({ syncing: true });

    // 获取本地数据
    const localData = await getLocalData();

    // 通过 API 上传到云端
    const response = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'upload', localData }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || '上传云端失败',
      };
    }

    const result: SyncResult = await response.json();

    if (result.success) {
      // 更新同步状态
      updateSyncStatus({
        lastSyncTime: localData.version,
        cloudExists: true,
      });
    }

    return result;
  } catch (error) {
    console.error('上传云端失败:', error);
    return {
      success: false,
      message: `上传云端失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  } finally {
    updateSyncStatus({ syncing: false });
  }
}

/**
 * 完整同步（先下载后上传）
 * 策略：
 * 1. 下载云端数据
 * 2. 如果云端数据更新，合并到本地
 * 3. 将本地数据上传到云端
 * @returns 同步结果
 */
export async function fullSync(): Promise<SyncResult> {
  try {
    updateSyncStatus({ syncing: true });

    // 1. 尝试下载云端数据
    const downloadResult = await syncFromCloud();

    if (!downloadResult.success && !downloadResult.downloaded) {
      // 如果下载失败且云端无数据，直接上传本地数据
      const uploadResult = await syncToCloud();
      return uploadResult;
    }

    // 2. 上传本地数据
    const uploadResult = await syncToCloud();

    if (!uploadResult.success) {
      return uploadResult;
    }

    return {
      success: true,
      message: '数据同步完成',
      uploaded: true,
    };
  } catch (error) {
    console.error('完整同步失败:', error);
    return {
      success: false,
      message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 检查云端数据状态（非阻塞）
 */
export async function checkCloudStatus(): Promise<void> {
  try {
    // 通过 API 检查云端数据状态
    const response = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check' }),
    });

    if (response.ok) {
      const result: SyncResult = await response.json();
      if (result.success && result.cloudExists !== undefined) {
        updateSyncStatus({ cloudExists: result.cloudExists });
      }
    }
  } catch (error) {
    console.error('检查云端状态失败:', error);
  }
}

/**
 * 初始化同步状态检查
 */
export async function initSyncStatus(): Promise<void> {
  await checkCloudStatus();
}

/**
 * 启用/禁用云同步
 */
export function setSyncEnabled(enabled: boolean): void {
  updateSyncStatus({ enabled });
}

/**
 * 格式化同步时间
 */
export function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return '从未同步';

  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
