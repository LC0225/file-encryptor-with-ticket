# 文件加密工具

基于 Next.js 的文件加密网页应用，支持用户认证、文件加密/解密、个人中心和管理员功能。

## 功能特性

- ✅ 文件加密/解密（支持批量加密）
- ✅ 用户认证系统（登录、注册）
- ✅ 个人中心（加密历史记录）
- ✅ 管理员面板（用户管理）
- ✅ 跨设备支持（本地开发使用数据库，云端部署使用localStorage）
- ✅ 密码强度验证（至少8位，包含大小写字母和数字）

## 技术栈

- **前端框架**: Next.js 16
- **UI组件**: React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **加密**: Web Crypto API (AES-GCM)
- **数据库**: PostgreSQL (开发环境) + localStorage (生产环境)

## 本地开发

### 环境要求

- Node.js 18+
- pnpm 或 npm

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:5000 启动。

### 数据库（本地开发）

本地开发环境会自动使用PostgreSQL数据库（通过 `coze-coding-dev-sdk`），支持跨设备同步。

### 管理员账号

- 用户名: `root`
- 密码: `BGSN123.321`

## 部署

### 推荐部署平台：Vercel

Vercel 对 Next.js 支持最好，推荐用于生产环境部署：

1. Fork 本仓库到你的 GitHub
2. 在 Vercel 导入项目
3. Vercel 会自动构建和部署

### Netlify 部署

由于 Next.js 16 对 Netlify 支持有限，当前配置可能在 Netlify 上遇到问题。

Netlify 部署时，应用会自动使用 localStorage 方案，无需数据库配置。

### 静态导出（备用方案）

如果需要完全静态的部署方案，可以使用以下命令：

```bash
pnpm run build
```

然后将 `out` 目录部署到任何静态托管服务。

## 数据存储说明

### 开发环境（本地）
- 使用 PostgreSQL 数据库
- 支持跨设备、跨浏览器数据同步
- 需要数据库连接（自动配置）

### 生产环境（云端部署）
- 自动回退到 localStorage
- 数据存储在浏览器本地
- 不需要数据库配置
- 适合个人使用和小型应用

## 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关 API
│   │   │   └── admin/         # 管理员 API
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── profile/           # 个人中心
│   │   └── admin/             # 管理员面板
│   ├── storage/
│   │   └── database/          # 数据库相关
│   │       ├── shared/
│   │       │   └── schema.ts  # 数据库表结构
│   │       └── userManager.ts # 用户管理 Manager
│   └── utils/
│       ├── auth.ts            # 认证工具（双模式）
│       ├── authLocalStorage.ts # localStorage 认证实现
│       ├── config.ts          # 环境配置
│       ├── crypto.ts          # 加密工具
│       └── storage.ts         # 本地存储工具
├── public/                    # 静态资源
└── package.json               # 项目依赖
```

## 许可证

MIT
