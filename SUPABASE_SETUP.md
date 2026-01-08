# Supabase 配置指南

本指南将帮助你在 Supabase 上完成项目所需的所有配置。

## 目录

- [前置准备](#前置准备)
- [配置信息汇总](#配置信息汇总)
- [步骤 1：创建 Storage Bucket](#步骤-1创建-storage-bucket)
- [步骤 2：配置 Storage Bucket 权限](#步骤-2配置-storage-bucket-权限)
- [步骤 3：配置 Vercel 环境变量](#步骤-3配置-vercel-环境变量)
- [验证配置](#验证配置)

---

## 前置准备

### 1. 登录 Supabase 控制台

访问：https://supabase.com/dashboard

选择你的项目：`wzvpiyjxlaihcjgdchez`

### 2. 准备工作

确保你有以下权限：
- 项目 Owner 或 Admin 权限
- 可以访问 Storage 和 Database 设置

---

## 配置信息汇总

### Supabase 项目信息

```
项目 URL: https://wzvpiyjxlaihcjgdchez.supabase.co
项目引用: wzvpiyjxlaihcjgdchez
```

### 认证信息

```
Anon Key (匿名访问密钥):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk
```

### 数据库连接信息

```
DATABASE_URL:
postgresql://postgres:8XctZ2JwUUjC0vE9@db.wzvpiyjxlaihcjgdchez.supabase.com:5432/postgres
```

**注意：**
- 主机：`db.wzvpiyjxlaihcjgdchez.supabase.com`
- 端口：`5432`
- 数据库名：`postgres`
- 用户名：`postgres`
- 密码：`8XctZ2JwUUjC0vE9`

---

## 步骤 1：创建 Storage Bucket

### 1.1 进入 Storage 页面

1. 在 Supabase 控制台左侧导航栏
2. 点击 **Storage** 图标（🗄️）
3. 进入 Storage 管理页面

### 1.2 创建新 Bucket

1. 点击页面右上角的 **"New bucket"** 按钮
2. 填写以下信息：

   | 字段 | 值 | 说明 |
   |------|-----|------|
   | **Name** | `file-encrypt` | 存储桶名称，必须完全一致 |
   | **Public bucket** | ❌ 未勾选 | 保持私有，确保数据安全 |
   | **File size limit** | `50 MB` | 可选，50MB 足够存储应用数据 |

3. 点击 **"Create bucket"** 按钮

### 1.3 验证 Bucket 创建成功

创建成功后，你应该能在 Storage 页面看到：
- `file-encrypt` bucket 出现在列表中
- 旁边显示 "Private" 标签

---

## 步骤 2：配置 Storage Bucket 权限

### 选项 A：使用预设策略（推荐，快速）

#### 2.1 访问 Bucket 策略

1. 点击 `file-encrypt` bucket 进入详情页
2. 点击 **"Policies"** 标签

#### 2.2 选择预设模板

Supabase 提供了几个预设策略模板：

| 模板 | 描述 | 适用场景 |
|------|------|---------|
| **Public Access** | 任何人都可以读取和写入 | ❌ 不推荐（不安全） |
| **Authenticated Access** | 认证用户可以读取和写入 | ✅ 推荐（平衡安全性和易用性） |
| **Private Access** | 仅拥有特定权限的用户可以访问 | ⚠️ 高级配置 |

**推荐选择：Authenticated Access**

#### 2.3 应用策略

1. 选择 **"Authenticated Access"** 模板
2. 阅读策略说明
3. 点击 **"Use this template"**
4. Supabase 会自动创建以下策略：
   - **SELECT** - 认证用户可以读取文件
   - **INSERT** - 认证用户可以上传文件
   - **UPDATE** - 认证用户可以更新文件
   - **DELETE** - 认证用户可以删除文件

### 选项 B：自定义策略（更精细控制）

如果需要更精细的权限控制，可以创建自定义策略。

#### 2.1 创建上传策略（INSERT）

1. 点击 **"New policy"** 按钮
2. 选择 **"For full customization"**
3. 配置如下：

   **Policy definition**
   ```
   Using a template: Custom

   Policy name: Allow authenticated users to upload
   Allowed operation: INSERT
   Target roles: authenticated
   ```

   **Policy definition (SQL)**
   ```sql
   CREATE POLICY "Allow authenticated users to upload"
   ON "storage"."objects"
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'file-encrypt'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

4. 点击 **"Save"** 或 **"Review"** 然后 **"Save policy"**

#### 2.2 创建下载策略（SELECT）

1. 点击 **"New policy"** 按钮
2. 配置如下：

   **Policy definition**
   ```
   Using a template: Custom

   Policy name: Allow authenticated users to download
   Allowed operation: SELECT
   Target roles: authenticated
   ```

   **Policy definition (SQL)**
   ```sql
   CREATE POLICY "Allow authenticated users to download"
   ON "storage"."objects"
   FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'file-encrypt'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. 点击 **"Save"**

---

## 步骤 3：配置 Vercel 环境变量

### 3.1 进入 Vercel 项目设置

1. 访问你的 Vercel 项目
2. 点击项目顶部的 **"Settings"** 标签
3. 在左侧导航栏点击 **"Environment Variables"**

### 3.2 添加环境变量

按照以下表格添加所有环境变量：

#### 必需的环境变量

| 变量名 | 值 | 环境 |
|-------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wzvpiyjxlaihcjgdchez.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk` | Production, Preview, Development |

#### 可选的环境变量（启用数据库）

| 变量名 | 值 | 环境 |
|-------|-----|------|
| `USE_DATABASE` | `true` | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://postgres:8XctZ2JwUUjC0vE9@db.wzvpiyjxlaihcjgdchez.supabase.com:5432/postgres` | Production, Preview, Development |

### 3.3 逐个添加变量

对于每个环境变量：

1. 点击 **"Add New"** 按钮
2. 在 **Key** 字段输入变量名（如 `NEXT_PUBLIC_SUPABASE_URL`）
3. 在 **Value** 字段输入对应的值
4. 在 **Environment** 部分选择环境：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. 点击 **"Save"**

**提示**：建议所有环境变量都选择全部三个环境，以保持一致性。

### 3.4 验证环境变量

添加完成后，检查以下内容：
- ✅ 所有必需的变量都已添加
- ✅ 值没有多余的空格或换行
- ✅ 变量名拼写正确（注意大小写）
- ✅ 已选择 Production、Preview、Development 三个环境

---

## 验证配置

### 验证 1：Storage Bucket

1. 在 Supabase 控制台，进入 Storage 页面
2. 确认 `file-encrypt` bucket 存在
3. 确认状态为 "Private"
4. 点击 bucket，检查 Policies 页面是否有策略

### 验证 2：数据库连接

1. 在 Supabase 控制台，进入 **SQL Editor**
2. 运行以下查询测试连接：

   ```sql
   -- 测试数据库连接
   SELECT current_database(), current_user, version();
   ```

3. 应该返回当前数据库、用户和版本信息

### 验证 3：环境变量

1. 在 Vercel 项目设置中，进入 Environment Variables
2. 确认所有变量都已正确配置
3. 确认环境选择正确

### 验证 4：触发重新部署

1. 在 Vercel 项目页面，点击 **"Deployments"**
2. 点击最新的部署
3. 点击右上角的 **"..."** 菜单
4. 选择 **"Redeploy"**
5. 等待部署完成（通常 2-3 分钟）

### 验证 5：测试应用功能

部署完成后，访问你的 Vercel 应用：

1. **注册新用户**
   - 打开应用首页
   - 点击"注册账号"
   - 填写用户名、密码、邮箱
   - 点击"注册"
   - ✅ 注册成功

2. **用户登录**
   - 使用注册的账号登录
   - ✅ 登录成功

3. **加密文件**
   - 选择一个文件
   - 点击"加密"
   - ✅ 加密成功，生成 ticket

4. **查看个人中心**
   - 进入个人中心
   - 检查加密历史记录
   - 检查云端同步状态
   - ✅ 云端数据存在

5. **测试管理员功能**（如果配置了数据库）
   - 使用管理员账号登录（root / BGSN123.321）
   - 进入管理员面板
   - 查看用户列表
   - 新增用户
   - ✅ 管理员功能正常

---

## 常见问题

### Q1: Storage bucket 创建失败

**可能原因**：
- Bucket 名称已存在
- 存储空间不足

**解决方案**：
1. 检查 Bucket 名称是否为 `file-encrypt`（精确匹配）
2. 删除已存在的 bucket（如果不需要）
3. 联系 Supabase 支持检查存储配额

### Q2: 文件上传失败

**可能原因**：
- Storage 权限配置不正确
- 文件大小超过限制

**解决方案**：
1. 检查 Storage Policies 是否正确配置
2. 增加 Bucket 的文件大小限制
3. 检查浏览器控制台的错误信息

### Q3: 数据库连接失败

**可能原因**：
- `DATABASE_URL` 配置错误
- 密码包含特殊字符未转义

**解决方案**：
1. 从 Supabase 控制台重新复制连接字符串
2. 确认密码部分没有多余的字符（如方括号）
3. 在 SQL Editor 中测试连接

### Q4: Vercel 部署失败

**可能原因**：
- 环境变量未配置
- 代码构建错误

**解决方案**：
1. 检查 Vercel Build Logs 查看详细错误
2. 确认所有环境变量都已配置
3. 检查代码是否有 TypeScript 错误

### Q5: 云端同步不工作

**可能原因**：
- Supabase 环境变量未配置
- Storage bucket 不存在
- 浏览器被广告拦截器阻止

**解决方案**：
1. 确认 Supabase URL 和 Anon Key 已配置
2. 确认 `file-encrypt` bucket 已创建
3. 暂时禁用广告拦截器
4. 检查浏览器控制台的错误信息

---

## 安全建议

### 1. 保护密钥

- ✅ 不要将 Anon Key 提交到 Git（已在 `.gitignore` 中）
- ✅ 不要在代码中硬编码密钥
- ⚠️ 如果密钥泄露，立即在 Supabase 控制台重新生成

### 2. 数据库安全

- ✅ 使用强密码（Supabase 自动生成的密码）
- ✅ 启用数据库访问日志
- ⚠️ 不要在生产环境使用默认用户名 `postgres`

### 3. Storage 安全

- ✅ 保持 Storage bucket 为私有（Public bucket 未勾选）
- ✅ 配置访问策略限制访问权限
- ✅ 定期审查访问日志

### 4. HTTPS

- ✅ Vercel 自动提供 HTTPS
- ✅ Supabase 所有连接都使用 HTTPS

---

## 进阶配置

### 1. 启用数据库表

如果需要在数据库中存储用户数据，可以创建以下表：

```sql
-- 在 SQL Editor 中运行

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 创建加密历史表
CREATE TABLE IF NOT EXISTS encryption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  ticket VARCHAR(255) NOT NULL,
  iv VARCHAR(255),
  encrypted_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_encryption_history_user_id ON encryption_history(user_id);
CREATE INDEX idx_encryption_history_created_at ON encryption_history(created_at);
```

### 2. 配置 Row Level Security (RLS)

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_history ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text);

-- 加密历史表策略
CREATE POLICY "Users can view own history"
ON encryption_history FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own history"
ON encryption_history FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own history"
ON encryption_history FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);
```

### 3. 自动备份数据库

在 Supabase 控制台：
1. 进入 **Database** → **Backups**
2. 启用自动备份
3. 设置备份频率（如每天备份）

---

## 支持资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [Supabase Database 文档](https://supabase.com/docs/guides/database)
- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)

---

**配置完成后，你的应用将拥有完整的云端数据同步和数据库支持！** 🎉
