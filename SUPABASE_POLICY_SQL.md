# Supabase Storage 策略配置 - 正确的 SQL 语法

## 方法一：使用快速模板（推荐）

1. 点击 "New policy"
2. 选择 "Get started quickly"
3. 选择 **"Allow public access"**（但这会让 bucket 公开，不推荐）

## 方法二：使用完整自定义（推荐）

### 上传策略

点击 **"New policy"** → **"For full customization"** → **"Create a policy from scratch"**

在策略编辑器中输入：

```sql
CREATE POLICY "Allow upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'file-encrypt');
```

### 下载策略

```sql
CREATE POLICY "Allow download"
ON storage.objects FOR SELECT
USING (bucket_id = 'file-encrypt');
```

### 更新策略

```sql
CREATE POLICY "Allow update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'file-encrypt')
WITH CHECK (bucket_id = 'file-encrypt');
```

### 删除策略

```sql
CREATE POLICY "Allow delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'file-encrypt');
```

## 方法三：使用 Supabase SQL Editor（最简单）

1. 点击左侧菜单的 **SQL Editor**
2. 点击 **"New query"**
3. 粘贴以下完整的 SQL：

```sql
-- 启用 RLS（如果还未启用）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 上传策略
CREATE POLICY "Allow upload to file-encrypt"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'file-encrypt');

-- 下载策略
CREATE POLICY "Allow download from file-encrypt"
ON storage.objects FOR SELECT
USING (bucket_id = 'file-encrypt');

-- 更新策略
CREATE POLICY "Allow update in file-encrypt"
ON storage.objects FOR UPDATE
USING (bucket_id = 'file-encrypt')
WITH CHECK (bucket_id = 'file-encrypt');

-- 删除策略
CREATE POLICY "Allow delete in file-encrypt"
ON storage.objects FOR DELETE
USING (bucket_id = 'file-encrypt');

-- 列表策略
CREATE POLICY "Allow list in file-encrypt"
ON storage.objects FOR SELECT
USING (bucket_id = 'file-encrypt');
```

4. 点击 **"Run"** 执行 SQL

## 验证策略是否生效

1. 回到 **Storage** → `file-encrypt` bucket
2. 点击 **Policies** 标签
3. 应该能看到以下策略：
   - ✅ Allow upload to file-encrypt
   - ✅ Allow download from file-encrypt
   - ✅ Allow update in file-encrypt
   - ✅ Allow delete in file-encrypt

## 常见错误

❌ 错误的写法：
```sql
allow upload on storage.objects for insert
with check ( bucket_id = 'file-encrypt' )
```

✅ 正确的写法：
```sql
CREATE POLICY "Allow upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'file-encrypt');
```

---

## 推荐使用方法三（SQL Editor）

这是最简单的方法，一次性执行所有 SQL，无需逐个创建策略！
