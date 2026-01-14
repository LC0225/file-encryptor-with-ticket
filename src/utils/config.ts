/**
 * 环境配置
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 检测是否可以使用数据库
 * 在静态导出模式下，API路由不可用，强制使用localStorage
 * 只有在显式设置环境变量且不是静态导出模式时才使用数据库
 */
export function canUseDatabase(): boolean {
  // 检查是否显式要求使用数据库
  if (process.env.USE_DATABASE === 'true') {
    // 静态导出模式下，API路由不可用，强制使用localStorage
    if (process.env.NEXT_PUBLIC_MODE === 'static') {
      return false;
    }
    return true;
  }

  // 默认使用localStorage（支持静态导出和纯静态部署）
  return false;
}
