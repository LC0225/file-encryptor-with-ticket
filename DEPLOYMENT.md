# 🚀 Vercel 部署指南

本指南将帮助您在 5 分钟内将应用部署到 Vercel，获得永久免费的访问地址。

## 📋 前置要求

- ✅ 代码已推送到 GitHub（已完成）
- ✅ Supabase 项目已创建（已完成）
- ✅ Supabase Storage Bucket 已创建（**需要手动完成**）

## 🔧 第一步：创建 Supabase Storage Bucket（必需）

在部署到 Vercel 之前，**必须**先在 Supabase 中创建 Storage Bucket。

### 方式 A：通过 Supabase 控制台创建（推荐）

1. 访问：https://supabase.com/dashboard/project/wzvpiyjxlaihcjgdchez/storage
2. 点击 **"New bucket"** 按钮
3. 填写以下信息：
   - **Name**: `file-encrypt`（必须完全一致，区分大小写）
   - **Public bucket**: ❌ 不勾选
   - **File size limit**: `50 MB`（可根据需要调整）
4. 点击 **"Create bucket"**

### 方式 B：通过 SQL 创建

在 Supabase SQL Editor 中运行：

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('file-encrypt', 'file-encrypt', false, 52428800); -- 50 MB
```

### 配置 Bucket 权限（推荐）

1. 进入刚创建的 `file-encrypt` bucket
2. 点击 **"Policies"** 标签页
3. 选择 **"Authenticated Access"** 模板
4. 点击 **"Use this template"**

## 🚀 第二步：部署到 Vercel

### 1. 登录 Vercel

访问：https://vercel.com/login

- 使用 GitHub 账号登录
- 授权 Vercel 访问您的 GitHub 仓库

### 2. 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 找到并选择 `file-encryptor-with-ticket` 仓库
3. 点击 **"Import"**

### 3. 配置项目

Vercel 会自动检测到 Next.js 项目，您需要配置以下内容：

#### 框架预设（自动检测）

- **Framework Preset**: Next.js
- **Root Directory**: `./`（默认）
- **Build Command**: `yarn build`（默认）
- **Output Directory**: `.next`（默认）

#### 环境变量（必需配置）

点击 **"Environment Variables"** 部分，添加以下变量：

| 变量名 | 值 | 环境 |
|-------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wzvpiyjxlaihcjgdchez.supabase.co` | ✅ Production ✅ Preview ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk` | ✅ Production ✅ Preview ✅ Development |

**添加步骤**：
1. 在 **Name** 字段输入变量名（如：`NEXT_PUBLIC_SUPABASE_URL`）
2. 在 **Value** 字段输入对应的值
3. 在 **Environment** 列勾选所有三个环境（Production、Preview、Development）
4. 点击 **"Add"** 按钮
5. 重复以上步骤，添加第二个变量

### 4. 部署设置（可选）

在 **"Build & Development Settings"** 中：

- **Build Command**: `yarn build`（已自动设置）
- **Output Directory**: `.next`（已自动设置）
- **Install Command**: `yarn install`（已自动设置）
- **Development Command**: `yarn dev`（已自动设置）

点击 **"Advanced"** 可以看到更多配置，通常不需要修改。

### 5. 开始部署

1. 检查所有配置是否正确
2. 点击右下角的 **"Deploy"** 按钮
3. 等待部署完成（通常 2-3 分钟）

### 6. 部署成功

部署成功后，您会看到：
- 🎉 **"Congratulations!"** 页面
- 🌐 **Production URL**: `https://file-encryptor-with-ticket-xxxx.vercel.app`
- 📦 自动分配的域名

**记下这个 URL，这就是您的永久访问地址！**

## ✅ 部署后验证

### 1. 测试基本功能

1. 访问您的 Vercel 应用 URL
2. 点击"注册账号"创建新用户
3. 登录并测试加密/解密功能
4. 检查个人中心的云端同步是否正常

### 2. 测试云端同步

1. 在个人中心点击"从云端同步"
2. 如果是第一次，会显示"云端暂无数据"
3. 加密一个文件后，数据会自动上传到云端
4. 刷新页面或在不同设备登录，数据会自动同步

### 3. 检查 Supabase 数据

1. 访问 Supabase 控制台：https://supabase.com/dashboard/project/wzvpiyjxlaihcjgdchez/storage
2. 进入 `file-encrypt` bucket
3. 查看是否生成了 `app-data/users.json` 和 `app-data/user-{userId}-history.json` 文件

## 🔄 自动部署

配置完成后，每次您推送新代码到 GitHub main 分支时，Vercel 会自动重新部署。

### 触发自动部署的步骤：

1. 在本地修改代码
2. 提交更改：`git add . && git commit -m "your message"`
3. 推送到 GitHub：`git push origin main`
4. Vercel 自动检测到更新并重新部署（2-3 分钟）

## 🛡️ 安全建议

### 1. 保护环境变量

- ✅ 环境变量只在服务器端可用
- ✅ 前端无法读取敏感信息
- ✅ 不要在代码中硬编码密钥

### 2. 定期更新

- 保持依赖包最新：`yarn upgrade`
- 检查安全漏洞：`yarn audit`

### 3. 监控使用情况

在 Vercel Dashboard 中可以查看：
- 访问量统计
- 性能指标
- 错误日志

## 📊 Vercel 免费额度

Vercel 免费计划包含：

- ✅ 无限项目
- ✅ 每月 100GB 带宽
- ✅ 每月 6,000 分钟构建时间
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署

对于个人项目和小型应用，完全免费！

## 🆚 本地开发 vs 生产环境

| 特性 | 本地开发 | Vercel 生产 |
|-----|---------|------------|
| 访问地址 | http://localhost:5000 | https://your-app.vercel.app |
| 数据同步 | 需要手动启动 | 永久在线 |
| HTTPS | ❌ 不支持 | ✅ 自动支持 |
| 全球访问 | ❌ 仅本地 | ✅ 全球可访问 |
| 自动部署 | ❌ 手动 | ✅ 自动 |
| 监控 | ❌ 无 | ✅ 完整监控 |

## 🐛 常见问题

### Q1: 部署失败，提示"Build Error"

**原因**：依赖安装失败或构建错误

**解决方案**：
1. 检查 Vercel 构建日志
2. 确保 `package.json` 中的依赖正确
3. 本地运行 `yarn build` 测试

### Q2: 云端同步不工作

**原因**：Supabase Bucket 未创建或环境变量配置错误

**解决方案**：
1. 检查是否创建了 `file-encrypt` bucket
2. 检查 Vercel 环境变量是否正确配置
3. 检查 Bucket 权限设置

### Q3: 部署成功但访问报错

**原因**：环境变量未生效

**解决方案**：
1. 在 Vercel Dashboard 进入项目设置
2. 重新输入环境变量
3. 触发重新部署

### Q4: 如何自定义域名？

**解决方案**：
1. 在 Vercel Dashboard 进入项目
2. 点击 **Settings** → **Domains**
3. 添加您的域名并配置 DNS

## 📞 获取帮助

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **Supabase 文档**: https://supabase.com/docs
- **GitHub Issues**: https://github.com/LC0225/file-encryptor-with-ticket/issues

## 🎉 完成！

恭喜您成功部署到 Vercel！现在您拥有一个永久在线的文件加密应用，可以随时随地访问使用。

**保存好以下信息**：
- 🌐 应用地址：`https://file-encryptor-with-ticket-xxxx.vercel.app`
- 🔑 Supabase 项目：https://supabase.com/dashboard/project/wzvpiyjxlaihcjgdchez
- 📦 Storage Bucket：`file-encrypt`

祝您使用愉快！🚀
