# 🔐 文件加密工具 - File Encryptor

> 基于 Next.js 的现代化文件加密网页应用，支持双加密模式、大文件分块处理、用户数据隔离、云端数据同步和管理员功能。

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 功能特性

### 🚀 核心加密功能
- ✅ **双加密模式** - 支持 AES-GCM 和 AES-CBC 两种算法
- ✅ **智能模式选择** - AES-GCM 适用于小文件（<500MB），AES-CBC 适用于大文件（≥500MB）
- ✅ **大文件分块处理** - 使用 Web Worker 分块加密/解密（每块 10MB），支持 GB 级文件
- ✅ **单文件加密** - 选择单个文件进行加密/解密
- ✅ **批量文件加密** - 一次选择多个文件，自动逐个处理
- ✅ **Ticket 密钥系统** - 每个文件独立 ticket，安全性更高
- ✅ **性能监控** - 实时显示处理速度、已处理数据量、剩余时间和内存使用情况
- ✅ **进度条** - 实时显示加密/解密进度

### 🔒 加密算法详情

#### AES-GCM (Galois/Counter Mode)
- **适用场景**: 小文件（< 500MB）
- **特点**: 
  - 认证加密，提供完整性和机密性
  - 自动验证数据完整性
  - 直接加密/解密整个文件，不分块
- **优点**: 性能好，安全性高，数据完整性校验
- **缺点**: 不支持分块，大文件内存占用高

#### AES-CBC (Cipher Block Chaining)
- **适用场景**: 大文件（≥ 500MB）
- **特点**:
  - 链式加密模式，前一块密文影响后一块
  - 分块加密/解密（每块 10MB）
  - 只保存初始 IV，后续块使用前一块密文最后 16 字节作为 IV
- **优点**: 支持超大文件，内存占用低，可中断恢复
- **缺点**: 不支持完整性校验

### 👤 用户系统
- ✅ **用户认证** - 完整的注册、登录、登出功能
- ✅ **密码强度验证** - 至少 8 位，包含大小写字母和数字
- ✅ **密码加密存储** - 使用 SHA-256 加密存储用户密码
- ✅ **用户数据隔离** - 每个用户的加密历史记录独立存储
- ✅ **双模式认证** - 开发环境使用 PostgreSQL，生产环境回退到 localStorage

### ☁️ 云端同步
- ✅ **自动云同步** - 每次操作后自动上传到 Supabase Storage
- ✅ **手动同步** - 支持手动从云端拉取最新数据
- ✅ **多设备访问** - 登录不同设备自动同步数据
- ✅ **智能回退** - Supabase 未配置时自动降级到本地存储
- ✅ **冲突检测** - 基于时间戳的版本冲突检测

### 📊 加密历史
- ✅ **完整记录** - 记录文件名、文件类型、算法、时间、文件大小
- ✅ **元数据存储** - 仅存储元数据，避免 localStorage 配额超出
- ✅ **用户隔离** - 每个用户独立的加密历史记录
- ✅ **算法标识** - 高亮显示使用的加密算法
- ✅ **自动清理** - localStorage 配额超出时自动清理旧记录
- ✅ **删除管理** - 支持单条删除和全部清空

### 👨‍💼 管理功能
- ✅ **管理员面板** - 完整的用户管理系统
- ✅ **新增用户** - 管理员可以创建新用户
- ✅ **修改密码** - 管理员可以重置用户密码
- ✅ **删除用户** - 管理员可以删除用户（保护管理员账号）
- ✅ **用户搜索** - 实时搜索和筛选用户
- ✅ **自动云同步** - 所有管理操作自动同步到云端

### 💾 数据存储架构
- ✅ **双模式存储** - 开发环境使用 PostgreSQL，生产环境使用 localStorage
- ✅ **用户数据隔离** - 使用 `encryption_history_${userId}` 作为存储键
- ✅ **云端同步** - 支持 Supabase Storage 云端同步
- ✅ **灵活配置** - 根据需求选择存储方案
- ✅ **自动降级** - 数据库/存储未配置时自动回退

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **状态管理**: React Hooks + Context API
- **组件库**: shadcn/ui

### 后端技术
- **API 路由**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **包管理器**: Yarn

### 安全与加密
- **加密算法**: Web Crypto API (AES-GCM, AES-CBC)
- **密钥派生**: PBKDF2 (SHA-256, 100000 次迭代)
- **数据存储**: Supabase Storage
- **文件格式**: JSON（小文件）+ 自定义二进制格式（大文件）

### 性能优化
- **Web Worker**: 后台处理加密/解密，不阻塞主线程
- **分块处理**: 每块 10MB，支持超大文件
- **Transferable Objects**: 减少内存复制和占用
- **按需 base64 转换**: 仅在下载时生成，降低内存压力
- **实时进度**: 增量更新进度条，避免从 0 跳到 100

### 部署与运维
- **部署平台**: Vercel
- **包管理器**: Yarn（解决 Vercel 部署依赖兼容性问题）
- **监控**: Vercel Analytics

## 📦 快速开始

### 前置要求

- Node.js 18+
- Yarn（推荐）或 pnpm
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
yarn install
```

#### 配置环境变量

复制 `.env.example` 到 `.env.local`（可选，用于开发环境）：

```bash
cp .env.example .env.local
```

#### 启动开发服务器

```bash
yarn dev
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
yarn install

# 构建生产版本
yarn run build

# 启动生产服务器
yarn start
```

## 💾 数据存储架构

### 存储层次

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                            │
│              (React 组件 + Hooks)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  业务逻辑层 (API Routes)                  │
│   - /api/auth/* - 用户认证                              │
│   - /api/cloud-sync/* - 云端同步                        │
│   - /api/admin/* - 管理员功能                            │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ↓                         ↓
┌──────────────────┐      ┌──────────────────┐
│   Local Storage  │      │   Supabase       │
│   (浏览器本地)   │      │   (云端)         │
│                  │      │                  │
│ - crypto_users   │      │ - Storage Bucket │
│ - encryption_    │      │   file-encrypt/  │
│   history_{id}   │      │   app-data.json  │
│ - crypto_sync_   │      │                  │
│   status         │      │                  │
└──────────────────┘      └──────────────────┘
         │                         │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ↓                         ↓
┌──────────────────┐      ┌──────────────────┐
│  PostgreSQL      │      │   SQLite         │
│  (开发环境)      │      │   (降级方案)     │
│                  │      │                  │
│ - users 表       │      │                  │
│ - encryption_    │      │                  │
│   history 表     │      │                  │
└──────────────────┘      └──────────────────┘
```

### 数据存储流程

1. **用户认证**
   - 注册/登录时，优先连接 PostgreSQL
   - 失败则降级到 localStorage

2. **加密历史**
   - 本地存储：`encryption_history_{userId}`（用户隔离）
   - 云端同步：自动上传到 Supabase Storage
   - 手动同步：点击"从云端同步"按钮

3. **用户管理**
   - 管理员操作通过 API 路由处理
   - 自动同步到云端（包括用户列表和历史记录）

4. **降级策略**
   - Supabase 未配置 → 仅使用 localStorage
   - 数据库未配置 → 仅使用 localStorage
   - 网络错误 → 本地操作，稍后自动重试

## 🔒 加密机制详解

### 加密流程

```
用户输入密码 + Ticket
    ↓
PBKDF2 密钥派生 (SHA-256, 100000 次迭代)
    ↓
生成加密密钥
    ↓
文件大小判断
    ↓
┌──────────────┬──────────────┐
│  < 500MB     │  ≥ 500MB     │
│  AES-GCM     │  AES-CBC     │
│  直接加密    │  分块加密    │
└──────────────┴──────────────┘
    ↓
生成加密文件 (包含 IV, 算法标识等)
    ↓
添加到加密历史
    ↓
自动云同步
```

### 解密流程

```
选择加密文件
    ↓
读取文件元数据 (检测算法标识)
    ↓
根据算法选择解密方式
    ↓
┌──────────────┬──────────────┐
│  AES-GCM     │  AES-CBC     │
│  直接解密    │  分块解密    │
└──────────────┴──────────────┘
    ↓
验证完整性 (AES-GCM)
    ↓
生成原始文件
    ↓
添加到加密历史
    ↓
自动云同步
```

### 分块加密机制 (AES-CBC)

```
原始文件 (10MB × N + 余数)
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│  Block 1 │  Block 2 │  Block 3 │  ...     │
│  10MB    │  10MB    │  10MB    │          │
└──────────┴──────────┴──────────┴──────────┘
    ↓          ↓          ↓
使用 IV    使用前一块   使用前一块
加密       密文的最后   密文的最后
           16 字节     16 字节
    ↓          ↓          ↓
密文块1    密文块2    密文块3
```

**特点**:
- 只保存初始 IV
- 后续块的 IV 来自前一块密文
- 支持大文件处理（GB 级）
- 内存占用低

### 文件格式

#### JSON 格式（小文件）
```json
{
  "algorithm": "AES-GCM",
  "iv": "base64编码的IV",
  "encryptedData": "base64编码的密文",
  "originalSize": 1024
}
```

#### 二进制格式（大文件）
```
[8字节] 原始文件大小
[1字节] 算法标识 (1=AES-GCM, 2=AES-CBC)
[16字节] IV
[N字节] 密文数据
```

## 🎯 使用指南

### 加密文件

1. 登录账号
2. 在主页选择加密方式：
   - **AES-GCM 加密**: 适用于小文件（< 500MB）
   - **AES-CBC 加密**: 适用于大文件（≥ 500MB）
3. 选择要加密的文件（支持多选）
4. 点击"选择文件"按钮
5. 等待加密完成（底部会显示进度和性能信息）
6. 加密完成后会自动下载加密文件
7. 复制保存的 Ticket 密钥（必须保存，否则无法解密）

### 解密文件

1. 登录账号
2. 选择解密方式：
   - **AES-GCM 解密**: 用于 AES-GCM 加密的文件
   - **AES-CBC 解密**: 用于 AES-CBC 加密的文件
3. 选择要解密的文件
4. 输入加密时的 Ticket 密钥
5. 点击"解密文件"按钮
6. 等待解密完成
7. 解密完成后会自动下载原始文件

### 管理加密历史

1. 点击"个人中心"
2. 查看所有加密历史记录
3. 每条记录显示：
   - 文件名
   - 文件大小
   - 加密算法（高亮标签）
   - 加密时间
   - Ticket（点击复制）
4. 支持操作：
   - 单条删除
   - 全部清空
   - 从云端同步

### 云端同步

1. 在个人中心点击"从云端同步"按钮
2. 等待同步完成
3. 查看同步状态（右上角）

**同步策略**:
- 自动上传：每次操作后自动上传
- 手动下载：点击"从云端同步"按钮
- 冲突检测：基于时间戳，云端优先

### 管理员功能

1. 使用管理员账号登录（root / BGSN123.321）
2. 进入"管理员面板"
3. 支持的操作：
   - 新增用户
   - 修改密码
   - 删除用户（管理员账号除外）
   - 搜索用户
4. 所有操作自动同步到云端

## 🐛 故障排除

### 问题：加密失败

**可能原因**:
1. 浏览器不支持 Web Crypto API
2. 文件太大，内存不足
3. 浏览器崩溃或意外关闭

**解决方案**:
1. 使用现代浏览器（Chrome, Firefox, Safari, Edge 最新版）
2. 使用 AES-CBC 加密大文件（≥ 500MB）
3. 分批处理大文件

### 问题：解密失败

**可能原因**:
1. Ticket 输入错误
2. 文件损坏
3. 加密和解密算法不匹配

**解决方案**:
1. 检查 Ticket 是否正确（区分大小写）
2. 确认文件未损坏
3. 确认使用了正确的解密按钮（AES-GCM 或 AES-CBC）

### 问题：云同步失败

**可能原因**:
1. Supabase 未配置
2. 网络连接问题
3. 存储桶权限错误

**解决方案**:
1. 检查环境变量配置
2. 检查网络连接
3. 检查 Supabase Storage Bucket 是否创建
4. 检查存储桶权限策略

### 问题：用户数据混合

**可能原因**:
1. 旧版本数据残留
2. localStorage 键冲突

**解决方案**:
1. 清除浏览器 localStorage
2. 重新登录账号
3. 从云端同步最新数据

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目主页: [https://github.com/LC0225/file-encryptor-with-ticket](https://github.com/LC0225/file-encryptor-with-ticket)
- 问题反馈: [GitHub Issues](https://github.com/LC0225/file-encryptor-with-ticket/issues)

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 后端服务
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
