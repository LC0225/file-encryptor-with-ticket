# 🔐 文件加密工具 - File Encryptor

> 基于 Next.js 的现代化文件加密网页应用，支持用户认证、文件加密/解密、云端数据同步和管理员功能。

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 功能特性

### 🚀 核心功能
- ✅ **文件加密/解密** - 使用 AES-GCM 算法，支持单文件和批量加密
- ✅ **Ticket 密钥系统** - 每个文件独立 ticket，安全性更高
- ✅ **用户认证系统** - 完整的注册、登录、登出功能
- ✅ **密码强度验证** - 至少8位，包含大小写字母和数字

### ☁️ 云端功能
- ✅ **云端数据同步** - 基于 Supabase Storage 的自动同步
- ✅ **多设备访问** - 登录不同设备自动同步数据
- ✅ **加密历史记录** - 完整记录所有加密/解密操作
- ✅ **自动备份** - 所有数据自动备份到云端

### 👥 管理功能
- ✅ **管理员面板** - 完整的用户管理系统
- ✅ **新增用户** - 管理员可以创建新用户
- ✅ **修改密码** - 管理员可以重置用户密码
- ✅ **删除用户** - 管理员可以删除用户（保护管理员账号）
- ✅ **用户搜索** - 实时搜索和筛选用户

### 💾 数据存储
- ✅ **双模式存储** - 开发环境使用 PostgreSQL，生产环境使用 localStorage
- ✅ **云端同步** - 支持 Supabase Storage 云端同步
- ✅ **灵活配置** - 根据需求选择存储方案

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **状态管理**: React Hooks + Context API

### 后端技术
- **API 路由**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM

### 安全与加密
- **加密算法**: Web Crypto API (AES-GCM)
- **密钥派生**: PBKDF2 (SHA-256)
- **数据存储**: Supabase Storage

### 部署与运维
- **部署平台**: Vercel
- **CI/CD**: GitHub Actions (自动部署)
- **监控**: Vercel Analytics

## 📦 快速开始

### 前置要求

- Node.js 18+
- pnpm 或 npm
- Git

### 方式 1：直接使用（推荐）

最简单的方式是直接访问已部署的应用：

**应用地址**：[https://file-encryptor-with-ticket-51sp.vercel.app](https://file-encryptor-with-ticket-51sp.vercel.app)

1. 打开应用
2. 点击"注册账号"创建新账户
3. 登录并开始加密文件

### 方式 2：本地开发

#### 克隆仓库

```bash
git clone https://github.com/LC0225/file-encryptor-with-ticket.git
cd file-encryptor-with-ticket
```

#### 安装依赖

```bash
pnpm install
```

#### 配置环境变量

复制 `.env.example` 到 `.env.local`（可选，用于开发环境）：

```bash
cp .env.example .env.local
```

#### 启动开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:5000](http://localhost:5000) 启动。

### 管理员账号

- **用户名**: `root`
- **密码**: `BGSN123.321`

> ⚠️ **注意**: 管理员账号需要初始化。首次登录时会自动初始化，或访问 `/api/auth/init-admin` 手动初始化。

## 🚀 部署到 Vercel

本应用已配置好 Vercel 部署，只需几步即可上线。

### 快速部署（5 分钟）

#### 1. 创建 Supabase Storage Bucket

**重要**：必须先创建 Storage Bucket 才能启用云端同步。

**方式 A：在 Supabase 控制台创建（推荐）**
1. 访问：https://supabase.com/dashboard/project/wzvpiyjxlaihcjgdchez/storage
2. 点击 **"New bucket"**
3. 填写：
   - **Name**: `file-encrypt`
   - **Public bucket**: ❌ 不勾选
   - **File size limit**: `50 MB`
4. 点击 **"Create bucket"**
5. 进入 `file-encrypt` → **Policies**，选择 **"Authenticated Access"** 模板

**方式 B：使用 SQL 创建**
```sql
-- 在 Supabase SQL Editor 中运行
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('file-encrypt', 'file-encrypt', false, 52428800);
```

#### 2. 在 Vercel 配置环境变量

1. 访问你的 Vercel 项目
2. 进入 **Settings** → **Environment Variables**
3. 添加以下环境变量：

**必需配置（启用云端同步）：**

| 变量名 | 值 |
|-------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wzvpiyjxlaihcjgdchez.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk` |

**可选配置（启用数据库和管理员功能）：**

| 变量名 | 值 |
|-------|-----|
| `USE_DATABASE` | `true` |
| `DATABASE_URL` | `postgresql://postgres:8XctZ2JwUUjC0vE9@db.wzvpiyjxlaihcjgdchez.supabase.com:5432/postgres` |

**注意**：所有环境变量都选择 **Production**、**Preview** 和 **Development** 三个环境。

#### 3. 触发重新部署

1. 在 Vercel 项目页面，点击 **"Deployments"**
2. 选择最新的部署
3. 点击右上角的 **"..."** → **"Redeploy"**
4. 等待部署完成（2-3 分钟）

#### 4. 测试应用

1. 访问你的 Vercel 应用
2. 注册新用户
3. 登录并测试加密功能
4. 检查个人中心的云端同步状态

### 详细部署文档

完整的部署指南请查看：
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel 部署详细指南
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 完整配置指南
- [SUPABASE_QUICK_SETUP.md](./SUPABASE_QUICK_SETUP.md) - Supabase 快速配置卡片

### 本地构建

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build

# 启动生产服务器
pnpm start
```

## 💾 数据存储架构

### 双模式存储系统

应用采用智能双模式存储，根据环境自动选择最佳方案：

#### 开发环境（本地）
- **主存储**: PostgreSQL 数据库
- **功能**:
  - ✅ 完整的用户认证
  - ✅ 管理员功能
  - ✅ 数据持久化
  - ✅ 跨会话数据保留
- **适用**: 本地开发和测试

#### 生产环境（云端部署）
- **主存储**: 浏览器 localStorage
- **辅助存储**: Supabase Storage（云端同步）
- **功能**:
  - ✅ 快速本地访问
  - ✅ 云端自动备份
  - ✅ 多设备数据同步
  - ✅ 离线可用（本地缓存）
- **适用**: 生产环境和个人使用

### 云端同步功能

#### 自动同步时机
1. **用户登录时** - 自动从云端拉取最新数据
2. **用户注册后** - 自动上传新用户数据
3. **加密/解密操作后** - 自动更新加密历史
4. **用户管理操作后** - 自动同步用户列表

#### 手动同步
在个人中心可以手动触发：
- 点击"立即同步"按钮
- 实时显示同步进度
- 同步结果消息提示

#### 数据冲突处理
- 使用时间戳版本控制
- 自动选择最新数据版本
- 确保数据一致性

#### 数据安全
- 数据加密存储
- 仅用户本人可访问
- 签名 URL 有效期控制

### 存储方案对比

| 存储方案 | 开发环境 | 生产环境 | 云端同步 | 管理员功能 |
|---------|---------|---------|---------|----------|
| **PostgreSQL + localStorage** | ✅ | ❌ | ❌ | ✅ |
| **localStorage + Supabase** | ❌ | ✅ | ✅ | ⚠️ |
| **PostgreSQL + Supabase** | ✅ | ✅ | ✅ | ✅ |

> **推荐**:
> - 个人使用：localStorage + Supabase（快速部署）
> - 团队使用：PostgreSQL + Supabase（完整功能）

## 📂 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关 API
│   │   │   │   ├── login/     # 用户登录
│   │   │   │   ├── register/  # 用户注册
│   │   │   │   ├── logout/    # 用户登出
│   │   │   │   └── init-admin/# 初始化管理员
│   │   │   ├── admin/         # 管理员 API
│   │   │   │   └── users/     # 用户管理
│   │   │   └── cloud-sync/    # 云端同步 API
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
│       ├── supabase.ts        # Supabase 客户端
│       ├── supabaseStorage.ts # Supabase Storage 操作
│       └── fileHelper.ts      # 文件处理工具
├── public/                    # 静态资源
├── .coze                      # Coze 配置（沙箱环境）
├── .env.local                 # 本地环境变量（不提交）
├── .gitignore                 # Git 忽略文件
├── package.json               # 项目依赖
├── pnpm-lock.yaml             # pnpm 锁定文件
├── tsconfig.json              # TypeScript 配置
├── next.config.ts             # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
├── vercel.json                # Vercel 部署配置
├── DEPLOYMENT.md              # 部署指南
├── SUPABASE_SETUP.md          # Supabase 配置指南
├── SUPABASE_QUICK_SETUP.md    # Supabase 快速配置
└── README.md                  # 项目文档（本文件）
```

## 📖 使用指南

### 首次使用

#### 1. 注册账号

1. 访问应用首页
2. 点击"注册账号"
3. 填写用户名、密码、邮箱（可选）
4. 点击"注册"
5. 注册成功后自动登录

#### 2. 加密文件

1. 选择要加密的文件（支持多选）
2. 输入 ticket（加密密钥）或留空自动生成
3. 点击"加密"
4. 下载加密文件或保存 ticket
5. 加密历史自动保存

#### 3. 解密文件

1. 切换到"解密"模式
2. 选择加密的文件
3. 输入正确的 ticket
4. 点击"解密"
5. 下载解密后的原文件

### 云端同步使用

#### 自动同步
- ✅ **登录时** - 自动拉取云端最新数据
- ✅ **注册后** - 自动上传新用户数据
- ✅ **加密后** - 自动更新加密历史
- ✅ **解密后** - 自动更新加密历史

#### 手动同步
1. 进入个人中心
2. 查看"云端同步"区域
3. 点击"立即同步"按钮
4. 等待同步完成

#### 多设备使用
1. **设备 A**: 注册账号并加密文件
2. **设备 B**: 使用相同账号登录
3. **自动同步**: 加密历史自动同步到设备 B
4. **无缝切换**: 在任何设备上访问加密历史

### 管理员功能使用

#### 登录管理员面板
1. 使用管理员账号登录（`root` / `BGSN123.321`）
2. 进入管理员面板
3. 查看用户列表

#### 管理用户
- **新增用户** - 点击"新增用户"，填写信息
- **修改密码** - 点击"修改密码"，重置用户密码
- **删除用户** - 点击"删除"，移除用户（管理员账号无法删除）
- **搜索用户** - 在搜索框输入用户名实时筛选

## ❓ 常见问题

### Q1: 应用无法访问或白屏？

**可能原因**：
- 环境变量未配置
- Supabase Storage 未创建

**解决方案**：
1. 检查 Vercel 环境变量是否正确配置
2. 确认 Supabase Storage bucket `file-encrypt` 已创建
3. 查看 Vercel Build Logs
4. 检查浏览器控制台错误

### Q2: 云端同步不工作？

**可能原因**：
- Supabase 环境变量未配置
- Storage bucket 不存在
- 浏览器被广告拦截器阻止

**解决方案**：
1. 检查 Supabase URL 和 Anon Key
2. 确认 `file-encrypt` bucket 已创建
3. 暂时禁用广告拦截器
4. 检查浏览器控制台错误

### Q3: 管理员账号无法登录？

**可能原因**：
- 生产环境未配置数据库
- 管理员未初始化

**解决方案**：
1. 配置 `USE_DATABASE=true` 和 `DATABASE_URL`
2. 访问 `/api/auth/init-admin` 初始化管理员
3. 或在本地环境初始化后部署

### Q4: 加密文件无法解密？

**可能原因**：
- ticket 不正确
- 文件已损坏

**解决方案**：
1. 确认 ticket 输入正确（区分大小写）
2. 重新下载加密文件
3. 检查文件是否完整

### Q5: 如何备份我的数据？

**解决方案**：
1. **自动备份**: 数据自动备份到 Supabase Storage
2. **手动导出**: 在个人中心导出加密历史
3. **Supabase 备份**: 在 Supabase 控制台启用数据库备份

### Q6: 如何自定义域名？

**步骤**：
1. 在 Vercel 项目设置 → Domains
2. 点击 "Add Domain"
3. 输入你的域名（如 `encrypt.yourdomain.com`）
4. 按照 Vercel 提示配置 DNS 记录
5. 等待 SSL 证书自动生成

更多问题请查看：
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署相关问题
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 配置问题
- [ADMIN_USER_MANAGEMENT.md](./ADMIN_USER_MANAGEMENT.md) - 管理员功能问题

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出改进建议！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 报告问题

- 使用 GitHub Issues 报告 bug
- 提供详细的错误信息和复现步骤
- 标记问题类型（bug、enhancement、question）

### 开发规范

- 遵循 ESLint 规则
- 使用 TypeScript 编写代码
- 添加适当的注释
- 保持代码简洁和可维护

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- **在线演示**: https://file-encryptor-with-ticket-51sp.vercel.app
- **部署指南**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Supabase 配置指南**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Supabase 快速配置**: [SUPABASE_QUICK_SETUP.md](./SUPABASE_QUICK_SETUP.md)
- **管理员功能文档**: [ADMIN_USER_MANAGEMENT.md](./ADMIN_USER_MANAGEMENT.md)
- **GitHub 仓库**: https://github.com/LC0225/file-encryptor-with-ticket

## 📧 联系方式

- 作者: LC0225
- 项目链接: https://github.com/LC0225/file-encryptor-with-ticket

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by LC0225

</div>
