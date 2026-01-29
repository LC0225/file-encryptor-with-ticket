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

  // 如果显式禁用了数据库，则不使用
  if (process.env.USE_DATABASE === 'false') {
    return false;
  }

  // 检查是否配置了数据库 URL
  const hasDatabaseConfig = !!(
    process.env.DATABASE_URL ||
    process.env.PGDATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL
  );

  // 如果没有配置数据库 URL，强制使用 localStorage 模式
  if (!hasDatabaseConfig) {
    console.warn('数据库未配置，将使用 localStorage 模式。如需使用数据库，请设置 DATABASE_URL 环境变量。');
    return false;
  }

  // 默认在开发环境使用数据库，生产环境使用localStorage
  return isDevelopment;
}
