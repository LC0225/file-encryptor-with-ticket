# Supabase 快速配置卡片

直接复制以下内容到对应平台配置即可。

---

## 🗄️ Supabase Storage 配置

### 方式 A：在控制台手动创建（推荐）

1. 访问：https://supabase.com/dashboard/project/wzvpiyjxlaihcjgdchez/storage
2. 点击 **"New bucket"**
3. 填写：
   - **Name**: `file-encrypt`
   - **Public bucket**: ❌ 不勾选
   - **File size limit**: `50 MB`
4. 点击 **"Create bucket"**
5. 进入 `file-encrypt` → **Policies**，选择 **"Authenticated Access"** 模板

### 方式 B：使用 SQL 创建（高级）

在 Supabase SQL Editor 中运行：

```sql
-- 创建 Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'file-encrypt',
  'file-encrypt',
  false,
  52428800,
  ARRAY['application/json']
);

-- 允许认证用户上传
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'file-encrypt');

-- 允许认证用户下载
CREATE POLICY "Allow authenticated download"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'file-encrypt');

-- 允许认证用户更新
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'file-encrypt');

-- 允许认证用户删除
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'file-encrypt');
```

---

## 🔧 Vercel 环境变量配置

### 必需配置（Supabase - 云端同步）

在 Vercel 项目设置 → Environment Variables 中添加以下变量：

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://wzvpiyjxlaihcjgdchez.supabase.co
```
环境：✅ Production, ✅ Preview, ✅ Development

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk
```
环境：✅ Production, ✅ Preview, ✅ Development

---

### 可选配置（PostgreSQL - 后端数据库）

如果你想启用完整的后端数据库功能（管理员面板等）：

#### 3. USE_DATABASE
```
true
```
环境：✅ Production, ✅ Preview, ✅ Development

#### 4. DATABASE_URL
```
postgresql://postgres:8XctZ2JwUUjC0vE9@db.wzvpiyjxlaihcjgdchez.supabase.com:5432/postgres
```
环境：✅ Production, ✅ Preview, ✅ Development

**注意**：数据库密码是 `8XctZ2JwUUjC0vE9`（已去掉方括号）

---

## 🚀 快速部署步骤

1. **配置 Supabase Storage**
   - 按照上面"Supabase Storage 配置"部分创建 `file-encrypt` bucket
   - 预计时间：2-3 分钟

2. **配置 Vercel 环境变量**
   - 访问你的 Vercel 项目
   - 进入 Settings → Environment Variables
   - 逐个添加上面的环境变量（推荐先添加必需的 2 个）
   - 预计时间：3-5 分钟

3. **触发重新部署**
   - 在 Vercel 点击 **"Deployments"** → 选择最新部署 → **"..."** → **"Redeploy"**
   - 预计时间：2-3 分钟

4. **测试应用**
   - 访问你的 Vercel 应用
   - 注册新用户 → 登录 → 加密文件 → 查看个人中心
   - 预计时间：3-5 分钟

---

## 📋 配置检查清单

- [ ] Supabase Storage bucket `file-encrypt` 已创建
- [ ] Storage bucket 状态为 Private
- [ ] Storage Policies 已配置（Authenticated Access）
- [ ] Vercel 环境变量 `NEXT_PUBLIC_SUPABASE_URL` 已添加
- [ ] Vercel 环境变量 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已添加
- [ ] Vercel 环境变量 `USE_DATABASE` 已添加（可选）
- [ ] Vercel 环境变量 `DATABASE_URL` 已添加（可选）
- [ ] 所有环境变量都选择了 Production、Preview、Development
- [ ] 已触发重新部署
- [ ] 部署成功完成
- [ ] 应用访问正常
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] 文件加密功能正常
- [ ] 云端同步功能正常

---

## 🆘 遇到问题？

### Supabase Storage 创建失败
- 检查 bucket 名称是否为 `file-encrypt`（精确匹配）
- 检查是否有足够的存储配额
- 尝试使用 SQL 脚本创建

### Vercel 部署失败
- 检查 Build Logs 查看详细错误
- 确认环境变量已正确配置
- 确认代码没有 TypeScript 错误

### 云端同步不工作
- 检查 Supabase 环境变量是否正确
- 检查 Storage bucket 是否存在
- 检查浏览器控制台错误信息
- 暂时禁用广告拦截器

---

详细配置步骤请查看：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
