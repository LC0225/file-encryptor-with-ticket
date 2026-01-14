import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置图片优化
  images: {
    unoptimized: true,
  },
  // URL末尾添加斜杠，确保路由一致性
  trailingSlash: true,
};

export default nextConfig;
