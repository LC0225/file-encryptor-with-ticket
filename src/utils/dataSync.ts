import { User } from './authLocalStorage';
import { EncryptionHistory } from './storage';
import { uploadAppData, downloadAppData, checkCloudDataExists } from './s3Storage';

/**
 * 应用数据结构（云端存储格式）
 */
export interface AppData {
  version: number;        // 时间戳版本
  users: User[];
  history: EncryptionHistory[];
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  message: string;
  downloaded?: boolean;   // 是否从云端下载了数据
  uploaded?: boolean;     // 是否上传了数据到云端
  conflict?: boolean;     // 是否发生了冲突
}

/**
 * 同步状态
 */
export interface SyncStatus {
  enabled: boolean;      // 是否启用云同步
  lastSyncTime: number | null;  // 最后同步时间
  syncing: boolean;      // 是否正在同步
  cloudExists: boolean;  // 云端数据是否存在
}

// 同步状态（存储在 localStorage）
const SYNC_STATUS_KEY = 'crypto_sync_status';

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
function getLocalData(): AppData {
  const version = Date.now();

  // 获取用户数据
  let users: User[] = [];
  try {
    const usersData = localStorage.getItem('crypto_users');
    users = usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('读取本地用户数据失败:', error);
  }

  // 获取加密历史
  let history: EncryptionHistory[] = [];
  try {
    const historyData = localStorage.getItem('encryption_history');
    history = historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('读取本地加密历史失败:', error);
  }

  return { version, users, history };
}

/**
 * 将云端数据应用到 localStorage
 */
function applyCloudDataToLocal(data: AppData): void {
  if (typeof window === 'undefined') return;

  try {
    // 保存用户数据
    localStorage.setItem('crypto_users', JSON.stringify(data.users));

    // 保存加密历史
    localStorage.setItem('encryption_history', JSON.stringify(data.history));
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

    // 检查云端数据是否存在
    const cloudExists = await checkCloudDataExists();
    updateSyncStatus({ cloudExists });

    if (!cloudExists) {
      return {
        success: true,
        message: '云端暂无数据，将使用本地数据',
      };
    }

    // 下载云端数据
    const cloudData = await downloadAppData();

    if (!cloudData) {
      return {
        success: false,
        message: '下载云端数据失败',
      };
    }

    // 获取本地数据版本（从同步状态中）
    const syncStatus = getSyncStatus();
    const localVersion = syncStatus.lastSyncTime || 0;

    // 比较版本，云端更新则使用云端数据
    if (cloudData.version > localVersion) {
      applyCloudDataToLocal(cloudData);
      updateSyncStatus({ lastSyncTime: cloudData.version });

      return {
        success: true,
        message: `已从云端同步 ${cloudData.users.length} 个用户和 ${cloudData.history.length} 条加密记录`,
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
    const localData = getLocalData();

    // 上传到云端
    await uploadAppData(localData);

    // 更新同步状态
    updateSyncStatus({
      lastSyncTime: localData.version,
      cloudExists: true,
    });

    return {
      success: true,
      message: `已上传 ${localData.users.length} 个用户和 ${localData.history.length} 条加密记录到云端`,
      uploaded: true,
    };
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
    const cloudExists = await checkCloudDataExists();
    updateSyncStatus({ cloudExists });
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
