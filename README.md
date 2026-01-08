# 文件加密工具

基于 Next.js 的文件加密网页应用，支持用户认证、文件加密/解密、个人中心、管理员功能和云端数据同步。

## 功能特性

- ✅ 文件加密/解密（支持批量加密）
- ✅ 用户认证系统（登录、注册）
- ✅ 个人中心（加密历史记录）
- ✅ 管理员面板（用户管理）
- ✅ **云端数据同步**（多设备访问，自动备份）
- ✅ 跨设备支持（本地开发使用数据库，云端部署使用localStorage）
- ✅ 密码强度验证（至少8位，包含大小写字母和数字）

## 技术栈

- **前端框架**: Next.js 16
- **UI组件**: React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **加密**: Web Crypto API (AES-GCM)
- **数据存储**: PostgreSQL (开发环境) + localStorage (生产环境) + **对象存储（云端同步）**

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

### 管理员账号

- 用户名: `root`
- 密码: `BGSN123.321`

## 部署

### 推荐部署平台：Vercel

Vercel 对 Next.js 支持最好，推荐用于生产环境部署：

#### 方式 1：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

#### 方式 2：通过 GitHub 集成（推荐）

1. 访问 [vercel.com](https://vercel.com) 并注册账号
2. 点击 "New Project" 按钮
3. 导入你的 GitHub 仓库（已推送：`https://github.com/LC0225/file-encryptor-with-ticket.git`）
4. 配置环境变量（见下方）
5. 点击 "Deploy" 按钮

**优势**：
- ✅ 完全免费（个人版）
- ✅ 自动 HTTPS
- ✅ 自动构建和部署
- ✅ 对 Next.js 16 完美支持
- ✅ 全球 CDN 加速（香港区域 hkg1）
- ✅ 推送代码自动部署

### 环境变量配置

在 Vercel 项目设置 → Environment Variables 中添加以下环境变量：

#### 必需配置（Supabase）

```
NEXT_PUBLIC_SUPABASE_URL=https://wzvpiyjxlaihcjgdchez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk
```

#### 可选配置（数据库）

```
# 如果想在生产环境使用 PostgreSQL 数据库（默认使用 localStorage）
USE_DATABASE=true
DATABASE_URL=postgresql://postgres.8XctZ2JwUUjC0vE9@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**说明**：
- Supabase 配置用于云端数据同步（加密历史、用户数据）
- 如果不配置数据库，应用将使用 localStorage 模式（适合个人使用）
- 配置数据库后，数据将存储在 PostgreSQL 中（适合团队使用）

### 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 导入了 GitHub 仓库
- [ ] 配置了 Supabase 环境变量
- [ ] （可选）配置了数据库环境变量
- [ ] 首次部署成功，访问应用正常
- [ ] 测试用户注册/登录功能
- [ ] 测试文件加密/解密功能
- [ ] 测试个人中心数据同步

### 本地构建

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build

# 启动生产服务器
pnpm start
```

## 数据存储说明

### 开发环境（本地）
- 使用 PostgreSQL 数据库
- 支持跨设备、跨浏览器数据同步
- 需要数据库连接（自动配置）

### 生产环境（云端部署）
- 自动回退到 localStorage
- **云端数据同步功能**（使用对象存储）
  - 数据自动备份到云端
  - 支持多设备访问
  - 登录时自动同步
  - 加密/解密操作后自动同步
  - 支持手动同步
- 本地 localStorage 作为快速缓存
- 不需要数据库配置
- 适合个人使用和小型应用

### 云端同步功能详情

#### 自动同步时机
1. **用户登录时**：自动从云端拉取最新数据
2. **用户注册后**：自动上传新用户数据到云端
3. **加密/解密操作后**：自动更新加密历史到云端
4. **用户管理操作后**：自动同步用户列表变更

#### 手动同步
在个人中心页面可以手动触发同步：
- 点击"立即同步"按钮
- 同步进度实时显示
- 同步结果消息提示

#### 数据冲突解决
- 使用时间戳版本控制
- 自动选择最新的数据版本
- 确保数据一致性

#### 数据安全
- 数据加密存储在对象存储中
- 仅用户本人可访问
- 签名 URL 有效期控制

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
│   ├── components/            # React 组件
│   │   ├── Toast.tsx          # Toast 提示组件
│   │   └── ToastContext.tsx   # Toast Context
│   ├── storage/
│   │   └── database/          # 数据库相关
│   │       ├── shared/
│   │       │   └── schema.ts  # 数据库表结构
│   │       └── userManager.ts # 用户管理 Manager
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/
│       ├── auth.ts            # 认证工具（双模式）
│       ├── authLocalStorage.ts # localStorage 认证实现（含云同步）
│       ├── config.ts          # 环境配置
│       ├── crypto.ts          # 加密工具
│       ├── storage.ts         # 本地存储工具（含云同步）
│       ├── dataSync.ts        # 数据同步服务
│       ├── s3Storage.ts       # 对象存储工具
│       └── fileHelper.ts      # 文件处理工具
├── public/                    # 静态资源
├── .env.example               # 环境变量示例
├── vercel.json                # Vercel 配置
└── package.json               # 项目依赖
```

## 使用指南

### 首次使用

1. 访问应用首页
2. 点击"注册账号"创建新账户
3. 注册后自动登录并进入主页
4. 选择文件进行加密/解密操作
5. 加密完成后，文件会保存到加密历史中

### 云端同步使用

1. **自动同步**：所有操作（登录、注册、加密、解密）都会自动同步到云端
2. **查看同步状态**：进入个人中心，查看"云端同步"区域
   - 云端数据状态（已存在/暂无数据）
   - 最后同步时间
   - 同步功能启用状态
3. **手动同步**：点击"立即同步"按钮手动触发同步
   - 适用于网络异常后重新同步
   - 多设备切换后同步数据

### 多设备使用场景

1. 在设备 A 上注册账号并进行加密操作
2. 在设备 B 上使用相同账号登录
3. 登录时自动从云端同步数据
4. 两台设备上的加密历史保持一致

### 管理员功能

管理员账号（root）可以：
- 查看所有注册用户
- 删除普通用户账号
- 管理员账号无法被删除

## 许可证

MIT
