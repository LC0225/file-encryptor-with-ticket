# Supabase Storage 配置指南

本文档介绍如何将文件加密应用与 Supabase Storage 集成，实现云端数据同步。

## 什么是 Supabase？

Supabase 是一个开源的 Firebase 替代品，提供：
- **PostgreSQL 数据库**（托管）
- **身份认证**（Auth）
- **对象存储**（Storage）
- **实时订阅**

## 为什么选择 Supabase Storage？

1. **免费套餐**：500MB 存储 + 2GB 带宽（个人使用足够）
2. **简单易用**：无需复杂的权限配置
3. **开源透明**：完全开源，可自托管
4. **开发友好**：提供完整的 SDK 和 API
5. **与 Next.js 兼容**：完美支持 Next.js App Router

## 快速开始

### 步骤 1：创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 或邮箱注册/登录
4. 点击 "New Project"
5. 填写项目信息：
   - **Name**: file-encrypt（或任意名称）
   - **Database Password**: 设置强密码
   - **Region**: 选择离你最近的区域（推荐）
6. 点击 "Create new project"，等待项目创建完成（约 2 分钟）

### 步骤 2：获取项目凭证

1. 进入项目控制台
2. 点击左侧菜单的 **Settings** → **API**
3. 复制以下信息：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤 3：创建 Storage Bucket

1. 点击左侧菜单的 **Storage**
2. 点击 "New bucket"
3. 填写 Bucket 信息：
   - **Name**: `file-encrypt`（必须与代码中的 BUCKET_NAME 一致）
   - **Public bucket**: 取消勾选（私有存储）
   - **File size limit**: 5MB（足够存储应用数据）
4. 点击 "Create bucket"

### 步骤 4：配置 Bucket 访问策略

1. 点击刚创建的 `file-encrypt` bucket
2. 点击 "Policies" 标签页
3. 点击 "New policy" → "Get started quickly"
4. 选择 "For full customization" → "Create a policy from scratch"
5. 配置策略：

   **上传策略**:
   ```sql
   allow upload
   on storage.objects
   for insert
   with check ( bucket_id = 'file-encrypt' )
   ```

   **下载策略**:
   ```sql
   allow download
   on storage.objects
   for select
   using ( bucket_id = 'file-encrypt' )
   ```

   **更新策略**:
   ```sql
   allow update
   on storage.objects
   for update
   with check ( bucket_id = 'file-encrypt' )
   ```

   **列表策略**:
   ```sql
   allow list
   on storage.objects
   for select
   using ( bucket_id = 'file-encrypt' )
   ```

### 步骤 5：配置环境变量

1. 复制项目根目录的 `.env.local.example` 文件：
   ```bash
   cp .env.local.example .env.local
   ```

2. 编辑 `.env.local` 文件，填写 Supabase 配置：
   ```bash
   # Supabase 项目 URL
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

   # Supabase Anon Key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. 保存文件并重启开发服务器：
   ```bash
   npm run dev
   ```

## 测试云端同步

1. 打开应用并登录
2. 进入"个人中心"
3. 点击"立即同步"按钮
4. 观察同步结果：
   - ✅ 上传成功：显示"已上传 X 个用户和 Y 条加密记录到云端"
   - ✅ 下载成功：显示"已从云端同步 X 个用户和 Y 条加密记录"

## 常见问题

### Q1: 提示"Supabase 未配置"

**原因**: 环境变量未设置或设置错误

**解决方案**:
1. 检查 `.env.local` 文件是否存在
2. 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已正确填写
3. 重启开发服务器

### Q2: 提示"Bucket not found"

**原因**: Storage Bucket 未创建或名称不匹配

**解决方案**:
1. 登录 Supabase 控制台
2. 检查 Storage 中是否存在 `file-encrypt` bucket
3. 如果不存在，重新创建（注意名称必须为 `file-encrypt`）

### Q3: 提示"Permission denied"

**原因**: Bucket 访问策略未配置或配置错误

**解决方案**:
1. 进入 Supabase Storage 控制台
2. 检查 `file-encrypt` bucket 的 Policies
3. 确保已配置上传、下载、更新、列表策略（参考步骤 4）

### Q4: 上传成功但下载失败

**原因**: 文件可能损坏或网络问题

**解决方案**:
1. 检查 Supabase Storage 控制台，确认文件已上传
2. 尝试删除文件重新上传
3. 检查网络连接

## 安全建议

1. **保护密钥**:
   - 不要将 `.env.local` 提交到版本控制
   - 已在 `.gitignore` 中排除此文件
   - 生产环境使用 `service_role` 密钥时，确保存储在服务器端

2. **访问控制**:
   - 使用 Anon Key 时，确保配置了适当的 RLS 策略
   - 生产环境建议使用 Service Role Key，并通过 API 路由代理访问

3. **数据备份**:
   - 定期备份 Supabase 数据库
   - 使用 Supabase 的自动备份功能（Pro 版本）

## 迁移指南

### 从对象存储迁移到 Supabase Storage

如果你已经使用了其他对象存储（如阿里云 OSS、腾讯云 COS），可以按以下步骤迁移：

1. **配置 Supabase**（参考快速开始）
2. **测试新配置**：
   - 在 `.env.local` 中添加 Supabase 配置
   - 系统会自动使用 Supabase Storage
3. **数据迁移**（可选）：
   - 从旧存储下载应用数据
   - 通过个人中心上传到 Supabase Storage
4. **移除旧配置**（确认迁移成功后）：
   - 删除 `.env.local` 中的旧存储配置

## 费用说明

Supabase 免费套餐包含：
- 500MB 数据库存储
- 1GB 文件存储
- 2GB 带宽/月
- 50,000 API 请求/月

**文件加密应用数据量很小**（通常 < 1MB），免费套餐完全够用。

如需更多资源，参考 [Supabase 定价](https://supabase.com/pricing)。

## 参考资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Storage 指南](https://supabase.com/docs/guides/storage)
- [Next.js 与 Supabase 集成](https://supabase.com/docs/guides/getting-started/nextjs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript)

## 支持

如有问题，请：
1. 查看本文档的"常见问题"部分
2. 访问 [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
3. 查看 [CLOUD_SYNC_CONFIG.md](CLOUD_SYNC_CONFIG.md) 了解其他同步方案
