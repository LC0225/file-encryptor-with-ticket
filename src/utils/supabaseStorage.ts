import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type { User, EncryptionHistory } from '@/types';

const BUCKET_NAME = 'file-encrypt';
const USERS_FILE_PATH = 'app-data/users.json';

/**
 * 获取用户加密历史文件的路径
 * @param userId 用户ID
 */
function getUserHistoryPath(userId: string): string {
  return `app-data/user-${userId}-history.json`;
}

// ============ 用户列表管理 ============

/**
 * 上传用户列表到 Supabase Storage
 * @param users 用户列表
 * @returns 上传成功返回 true
 */
export async function uploadUsers(users: User[]): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase 未配置，跳过上传用户列表');
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase 客户端未初始化，跳过上传用户列表');
      return false;
    }

    const jsonContent = JSON.stringify(users, null, 2);

    // 上传文件到 Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(USERS_FILE_PATH, new Blob([jsonContent], { type: 'application/json' }), {
        upsert: true,
      });

    if (error) {
      console.error('上传用户列表到 Supabase Storage 失败:', error);
      throw error;
    }

    console.log('✅ 成功上传用户列表到 Supabase Storage');
    return true;
  } catch (error) {
    console.error('上传用户列表失败:', error);
    throw error;
  }
}

/**
 * 从 Supabase Storage 下载用户列表
 * @returns 用户列表，如果文件不存在则返回 null
 */
export async function downloadUsers(): Promise<User[] | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase 未配置，跳过下载用户列表');
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase 客户端未初始化，跳过下载用户列表');
      return null;
    }

    // 下载文件
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(USERS_FILE_PATH);

    if (error) {
      // 文件不存在，返回空数组
      if (error.message.includes('not found') || error.message.includes('Object not found')) {
        return [];
      }
      console.error('从 Supabase Storage 下载用户列表失败:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // 将 Blob 转换为文本并解析 JSON
    const text = await data.text();
    const users = JSON.parse(text);

    console.log('✅ 成功从 Supabase Storage 下载用户列表');
    return users;
  } catch (error) {
    console.error('下载用户列表失败:', error);
    return null;
  }
}

// ============ 用户加密历史管理 ============

/**
 * 上传用户的加密历史到 Supabase Storage
 * @param userId 用户ID
 * @param history 加密历史记录
 * @returns 上传成功返回 true
 */
export async function uploadUserHistory(userId: string, history: EncryptionHistory[]): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase 未配置，跳过上传加密历史');
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase 客户端未初始化，跳过上传加密历史');
      return false;
    }

    const historyPath = getUserHistoryPath(userId);
    const jsonContent = JSON.stringify(history, null, 2);

    // 上传文件到 Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(historyPath, new Blob([jsonContent], { type: 'application/json' }), {
        upsert: true,
      });

    if (error) {
      console.error('上传加密历史到 Supabase Storage 失败:', error);
      throw error;
    }

    console.log(`✅ 成功上传用户 ${userId} 的加密历史到 Supabase Storage`);
    return true;
  } catch (error) {
    console.error('上传加密历史失败:', error);
    throw error;
  }
}

/**
 * 从 Supabase Storage 下载用户的加密历史
 * @param userId 用户ID
 * @returns 加密历史记录，如果文件不存在则返回 null
 */
export async function downloadUserHistory(userId: string): Promise<EncryptionHistory[] | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase 未配置，跳过下载加密历史');
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase 客户端未初始化，跳过下载加密历史');
      return null;
    }

    const historyPath = getUserHistoryPath(userId);

    // 下载文件
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(historyPath);

    if (error) {
      // 文件不存在，返回空数组
      if (error.message.includes('not found') || error.message.includes('Object not found')) {
        return [];
      }
      console.error('从 Supabase Storage 下载加密历史失败:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // 将 Blob 转换为文本并解析 JSON
    const text = await data.text();
    const history = JSON.parse(text);

    console.log(`✅ 成功从 Supabase Storage 下载用户 ${userId} 的加密历史`);
    return history;
  } catch (error) {
    console.error('下载加密历史失败:', error);
    return null;
  }
}

/**
 * 检查用户的加密历史是否在云端存在
 * @param userId 用户ID
 */
export async function checkUserHistoryExists(userId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return false;
    }

    const historyPath = getUserHistoryPath(userId);

    // 检查文件是否存在
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(historyPath);

    if (error) {
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('检查用户加密历史失败:', error);
    return false;
  }
}

// ============ 兼容性函数（保持向后兼容）============

/**
 * 上传应用数据到 Supabase Storage（兼容旧版接口）
 * @deprecated 请使用 uploadUsers 和 uploadUserHistory
 * @param data 应用数据对象
 * @returns 上传成功返回 true
 */
export async function uploadAppData(data: any): Promise<boolean> {
  try {
    const success1 = await uploadUsers(data.users || []);
    const success2 = await uploadUserHistory(data.currentUserId || 'unknown', data.history || []);

    return success1 && success2;
  } catch (error) {
    console.error('上传应用数据失败:', error);
    return false;
  }
}

/**
 * 从 Supabase Storage 下载应用数据（兼容旧版接口）
 * @deprecated 请使用 downloadUsers 和 downloadUserHistory
 * @param userId 当前用户ID（可选）
 * @returns 应用数据对象，如果文件不存在则返回 null
 */
export async function downloadAppData(userId?: string): Promise<any | null> {
  try {
    const users = await downloadUsers();
    const history = userId ? await downloadUserHistory(userId) : [];

    if (users === null && history === null) {
      return null;
    }

    return {
      version: Date.now(),
      users: users || [],
      history: history || [],
    };
  } catch (error) {
    console.error('下载应用数据失败:', error);
    return null;
  }
}

/**
 * 检查云端数据是否存在（兼容旧版接口）
 * @deprecated 建议使用 checkUserHistoryExists
 */
export async function checkCloudDataExists(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return false;
    }

    // 检查用户列表文件是否存在
    const { data: usersData } = await supabase.storage
      .from(BUCKET_NAME)
      .download(USERS_FILE_PATH);

    return usersData !== null;
  } catch (error) {
    console.error('检查云端数据失败:', error);
    return false;
  }
}
