/**
 * 环境配置
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 检测是否可以使用数据库
 * 在本地开发环境可以使用数据库，但在云端部署（如Netlify）可能不支持
 */
export function canUseDatabase(): boolean {
  // 如果显式设置了环境变量，则使用数据库
  if (process.env.USE_DATABASE === 'true') {
    return true;
  }
  
  // 默认在开发环境使用数据库，生产环境使用localStorage
  return isDevelopment;
}
