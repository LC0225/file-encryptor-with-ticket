import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'file-encrypt';
const FILE_PATH = 'app-data.json';

/**
 * 上传应用数据到 Supabase Storage
 * @param data 应用数据对象
 * @returns 上传成功返回 true
 */
export async function uploadAppData(data: any): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase 未配置');
    }

    const supabase = getSupabaseClient();
    const jsonContent = JSON.stringify(data, null, 2);

    // 上传文件到 Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_PATH, new Blob([jsonContent], { type: 'application/json' }), {
        upsert: true, // 如果文件已存在，则覆盖
      });

    if (error) {
      console.error('上传到 Supabase Storage 失败:', error);
      throw error;
    }

    console.log('✅ 成功上传数据到 Supabase Storage');
    return true;
  } catch (error) {
    console.error('上传应用数据失败:', error);
    throw error;
  }
}

/**
 * 从 Supabase Storage 下载应用数据
 * @returns 应用数据对象，如果文件不存在则返回 null
 */
export async function downloadAppData(): Promise<any | null> {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase 未配置');
    }

    const supabase = getSupabaseClient();

    // 检查文件是否存在
    const { data: existsData } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0,
      });

    if (!existsData || !existsData.some(file => file.name === FILE_PATH)) {
      console.log('⚠️ 云端暂无数据文件');
      return null;
    }

    // 下载文件
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(FILE_PATH);

    if (error) {
      console.error('从 Supabase Storage 下载失败:', error);
      throw error;
    }

    if (!data) {
      console.error('下载的文件为空');
      return null;
    }

    // 将 Blob 转换为文本并解析 JSON
    const text = await data.text();
    const appData = JSON.parse(text);

    console.log('✅ 成功从 Supabase Storage 下载数据');
    return appData;
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
    if (!isSupabaseConfigured()) {
      return false;
    }

    const supabase = getSupabaseClient();

    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0,
      });

    if (!data) {
      return false;
    }

    return data.some(file => file.name === FILE_PATH);
  } catch (error) {
    console.error('检查云端数据失败:', error);
    return false;
  }
}
