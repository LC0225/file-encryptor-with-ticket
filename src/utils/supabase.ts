import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端配置
 *
 * 使用方法:
 * 1. 在 Supabase 控制台创建项目
 * 2. 获取项目 URL 和 Anon Key（或 Service Role Key）
 * 3. 在 .env.local 中设置环境变量
 * 4. 在 Supabase Storage 中创建名为 'file-encrypt' 的 bucket
 */

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 验证配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，云端同步功能将不可用');
  console.warn('请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * 获取 Supabase 客户端实例（单例模式）
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 未配置：请在 .env.local 中设置环境变量');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // 不在服务器端持久化会话
    },
  });
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
