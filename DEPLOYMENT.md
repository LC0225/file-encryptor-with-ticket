# Vercel 部署指南

本指南将帮助你将文件加密工具部署到 Vercel 平台。

## 目录

- [前置准备](#前置准备)
- [部署方式](#部署方式)
- [环境变量配置](#环境变量配置)
- [部署后验证](#部署后验证)
- [常见问题](#常见问题)

---

## 前置准备

### 1. GitHub 仓库
你的代码已经推送到 GitHub：
```
https://github.com/LC0225/file-encryptor-with-ticket.git
```

### 2. Vercel 账号
- 访问 [vercel.com](https://vercel.com)
- 使用 GitHub、GitLab 或邮箱注册账号

### 3. 项目配置文件
你的项目已包含以下配置文件：
- ✅ `vercel.json` - Vercel 部署配置
- ✅ `package.json` - 依赖和脚本配置
- ✅ `next.config.ts` - Next.js 配置

---

## 部署方式

### 方式 1：通过 Vercel CLI（适合开发者）

#### 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 登录 Vercel
```bash
vercel login
```
按照提示选择认证方式（推荐使用 GitHub 登录）

#### 部署到预览环境
```bash
vercel
```
首次运行时，Vercel 会引导你配置项目：
1. 是否链接到现有项目（选择 No）
2. 设置项目名称和范围
3. 配置环境变量

#### 部署到生产环境
```bash
vercel --prod
```

---

### 方式 2：通过 GitHub 集成（推荐）

#### 步骤 1：导入仓库
1. 登录 Vercel 控制台
2. 点击 "Add New Project"
3. 选择 "Import Git Repository"
4. 选择 `LC0225/file-encryptor-with-ticket` 仓库
5. 点击 "Import"

#### 步骤 2：配置项目
Vercel 会自动检测 Next.js 项目：
- **Framework Preset**: Next.js
- **Root Directory**: `./`（保持默认）
- **Build Command**: `npm run build`（自动检测）
- **Output Directory**: `.next`（自动检测）

#### 步骤 3：配置环境变量
在 "Environment Variables" 部分添加环境变量（见下方）

#### 步骤 4：部署
点击 "Deploy" 按钮，Vercel 会自动：
1. 安装依赖（`npm install`）
2. 构建项目（`npm run build`）
3. 部署到全球 CDN

---

## 环境变量配置

### 在 Vercel 项目设置中添加环境变量

#### 路径
项目设置 → Environment Variables

#### 必需配置

```
NEXT_PUBLIC_SUPABASE_URL=https://wzvpiyjxlaihcjgdchez.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk
```

#### 可选配置（启用数据库）

```
USE_DATABASE=true
```

```
DATABASE_URL=postgresql://postgres.8XctZ2JwUUjC0vE9@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 环境变量说明

| 变量名 | 用途 | 必需 | 说明 |
|-------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API 地址 | 是 | 用于云端数据同步 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名访问密钥 | 是 | 用于云端数据访问 |
| `USE_DATABASE` | 是否使用数据库 | 否 | `true`=使用数据库，`false`=使用localStorage |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 否 | `USE_DATABASE=true` 时必需 |

### 环境变量范围选择

- **Production**: 生产环境（部署到主域名）
- **Preview**: 预览环境（每次 PR/提交）
- **Development**: 开发环境（本地开发）

**建议**：所有环境变量都选择 `Production`、`Preview` 和 `Development` 三个环境。

---

## 部署后验证

### 1. 访问应用
部署成功后，Vercel 会提供一个域名，例如：
```
https://file-encryptor-with-ticket.vercel.app
```

### 2. 功能测试清单

#### 基础功能
- [ ] 访问首页正常
- [ ] 注册新用户成功
- [ ] 用户登录成功
- [ ] 退出登录正常

#### 文件加密/解密
- [ ] 单文件加密成功
- [ ] 单文件解密成功
- [ ] 批量加密成功
- [ ] 批量解密成功
- [ ] 下载加密文件正常

#### 个人中心
- [ ] 个人中心访问正常
- [ ] 加密历史显示正常
- [ ] 云端同步功能正常
- [ ] 删除加密历史正常

#### 管理员功能
- [ ] 管理员登录成功（账号：root / BGSN123.321）
- [ ] 用户列表显示正常
- [ ] 新增用户功能正常
- [ ] 修改密码功能正常
- [ ] 删除用户功能正常
- [ ] 搜索用户功能正常

### 3. 检查日志
如果遇到问题，可以在 Vercel 控制台查看：
- **Logs** - 应用运行日志
- **Build Logs** - 构建日志
- **Analytics** - 访问分析

---

## 常见问题

### Q1: 部署失败，提示构建错误

**可能原因**：
- 依赖安装失败
- 环境变量未配置

**解决方案**：
1. 检查 `Build Logs` 查看详细错误
2. 确保环境变量已正确配置
3. 尝试重新部署：点击 "Redeploy" 按钮

### Q2: 云端同步功能不工作

**可能原因**：
- Supabase 环境变量未配置
- Supabase 配置错误

**解决方案**：
1. 检查环境变量是否正确配置
2. 确认 Supabase 服务正常
3. 检查浏览器控制台是否有错误

### Q3: 数据库连接失败

**可能原因**：
- `DATABASE_URL` 配置错误
- Supabase 数据库未启动

**解决方案**：
1. 检查 `DATABASE_URL` 格式是否正确
2. 如果不需要数据库，可以不配置 `USE_DATABASE=true`
3. 应用会自动回退到 localStorage 模式

### Q4: 管理员账号无法登录

**可能原因**：
- 生产环境未初始化管理员账号
- 数据库状态不一致

**解决方案**：
1. 访问 `/api/auth/init-admin` 初始化管理员账号
2. 或者在本地环境中先注册管理员账号

### Q5: 如何自定义域名？

**步骤**：
1. 在项目设置 → Domains
2. 点击 "Add Domain"
3. 输入你的域名（如 `encrypt.yourdomain.com`）
4. 按照提示配置 DNS 记录
5. 等待 SSL 证书生成（自动）

### Q6: 如何更新应用？

**方式 1：自动部署**
- 推送代码到 GitHub
- Vercel 自动检测并部署

**方式 2：手动部署**
- 在 Vercel 控制台点击 "Redeploy"
- 或使用 CLI：`vercel --prod`

---

## 性能优化建议

### 1. 启用图片优化
`next.config.ts` 已配置 `images.unoptimized: true`，如需优化可调整。

### 2. 启用 CDN
Vercel 默认使用全球 CDN，无需额外配置。

### 3. 缓存策略
应用已使用 Next.js 静态生成和缓存策略，无需额外配置。

---

## 安全建议

### 1. 保护环境变量
- 不要将 `.env.local` 提交到 Git（已在 `.gitignore` 中）
- 不要在代码中硬编码敏感信息

### 2. HTTPS
Vercel 默认启用 HTTPS，无需额外配置。

### 3. Supabase 安全
- 使用匿名访问密钥（anon key）而非服务密钥（service key）
- 定期更换 Supabase API 密钥

---

## 技术支持

### Vercel 文档
- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://vercel.com/docs/frameworks/nextjs)

### 项目文档
- [README.md](./README.md) - 项目总览
- [ADMIN_USER_MANAGEMENT.md](./ADMIN_USER_MANAGEMENT.md) - 管理员功能文档

---

## 部署完成后

1. **分享应用**：将 Vercel 提供的域名分享给用户
2. **监控性能**：在 Vercel 控制台查看访问统计和性能指标
3. **定期更新**：保持依赖和 Next.js 版本最新

---

祝你部署顺利！🚀
