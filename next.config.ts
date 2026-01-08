import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置图片优化
  images: {
    unoptimized: true,
  },
  // 静态导出：不需要服务器，加载更快
  output: 'export',
  // 禁用服务器端功能，因为我们使用localStorage
  trailingSlash: true,
};

export default nextConfig;
