# 云端同步配置 - 快速入门

## 5分钟快速配置指南

### 方案A：使用 Supabase Storage（强烈推荐）

Supabase 是一个开源的 Firebase 替代品，提供免费存储和简单的配置。

1. **注册 Supabase**
   - 访问 https://supabase.com
   - 使用 GitHub 或邮箱注册

2. **创建项目**
   - 点击 "Start your project"
   - 填写项目名称（例如：`file-encrypt`）
   - 设置数据库密码
   - 选择离你最近的区域
   - 点击 "Create new project"，等待创建完成（约2分钟）

3. **创建 Storage Bucket**
   - 进入项目控制台
   - 点击左侧菜单的 **Storage**
   - 点击 "New bucket"
   - 填写 Bucket 名称：`file-encrypt`（必须与此名称一致）
   - 取消勾选 "Public bucket"
   - 点击 "Create bucket"

4. **配置访问策略**
   - 点击刚创建的 `file-encrypt` bucket
   - 点击 "Policies" 标签页
   - 添加以下策略（允许上传、下载、更新、列表）：
     ```sql
     allow upload on storage.objects for insert
     with check ( bucket_id = 'file-encrypt' )

     allow download on storage.objects for select
     using ( bucket_id = 'file-encrypt' )
     ```

5. **获取配置信息**
   - 点击左侧菜单的 **Settings** → **API**
   - 复制 **Project URL** 和 **anon public** key

6. **配置环境变量**

   在项目根目录创建 `.env.local` 文件：

   ```bash
   # 复制示例文件
   cp .env.local.example .env.local
   ```

   编辑 `.env.local` 文件：

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

7. **重启开发服务器**

   ```bash
   npm run dev
   ```

8. **测试功能**

   - 登录应用
   - 进入个人中心
   - 点击"立即同步"按钮

**优势**：
- ✅ 完全免费（500MB存储 + 2GB带宽）
- ✅ 配置简单，无需复杂的权限设置
- ✅ 开源透明，可自托管
- ✅ 与 Next.js 完美集成

**详细配置指南**：请查看 [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

### 方案B：使用阿里云OSS

1. **注册阿里云**
   - 访问 https://www.aliyun.com/product/oss
   - 注册/登录账号

2. **创建存储桶**
   - 进入OSS控制台
   - 点击"创建Bucket"
   - 填写Bucket名称（例如：`my-encrypt-data-2024`）
   - 选择地域（推荐：华东1-杭州）
   - 访问权限：私有

3. **获取配置信息**
   - 进入存储桶详情页
   - 复制Bucket域名（端点URL）
   - 记录Bucket名称

4. **配置环境变量**

   在项目根目录创建 `.env.local` 文件：

   ```bash
   # 复制示例文件
   cp .env.local.example .env.local
   ```

   编辑 `.env.local` 文件：

   ```env
   COZE_BUCKET_ENDPOINT_URL=https://oss-cn-hangzhou.aliyuncs.com
   COZE_BUCKET_NAME=my-encrypt-data-2024
   ```

5. **重启开发服务器**

   ```bash
   npm run dev
   ```

6. **测试功能**

   - 登录应用
   - 进入个人中心
   - 点击"立即同步"按钮

---

### 方案C：使用腾讯云COS

1. **注册腾讯云**
   - 访问 https://cloud.tencent.com/product/cos
   - 注册/登录账号

2. **创建存储桶**
   - 进入COS控制台
   - 点击"创建存储桶"
   - 填写存储桶名称（例如：`my-encrypt-data-2024`）
   - 选择地域（推荐：北京）
   - 访问权限：私有读/私有写

3. **获取配置信息**
   - 进入存储桶详情页
   - 在"基础配置"中找到访问域名
   - 记录存储桶名称

4. **配置环境变量**

   在项目根目录创建 `.env.local` 文件：

   ```bash
   # 复制示例文件
   cp .env.local.example .env.local
   ```

   编辑 `.env.local` 文件：

   ```env
   COZE_BUCKET_ENDPOINT_URL=https://cos.ap-beijing.myqcloud.com
   COZE_BUCKET_NAME=my-encrypt-data-2024
   ```

5. **重启开发服务器**

   ```bash
   npm run dev
   ```

6. **测试功能**

   - 登录应用
   - 进入个人中心
   - 点击"立即同步"按钮

---

### 方案D：不配置云存储（本地存储）

如果你不需要多设备同步功能：

1. **直接使用**
   - 无需配置任何环境变量
   - 直接启动应用即可
   - 所有数据保存在浏览器本地

2. **功能限制**
   - 无法跨设备访问数据
   - 清除浏览器缓存会丢失数据
   - 核心功能（加密、解密）完全正常

---

## 常见问题

### Q1: 我可以使用免费存储吗？

**A: 可以！** 所有推荐方案都提供免费额度：

- **Supabase Storage**：
  - 永久免费（500MB存储 + 2GB带宽）
  - 配置最简单，强烈推荐
  - 开源透明

- **阿里云OSS**：
  - 前3个月免费（5GB存储 + 5GB流量）
  - 足够个人使用

- **腾讯云COS**：
  - 6个月免费（50GB存储 + 10GB流量）
  - 非常 generous

- **Cloudflare R2**：
  - 永久免费（每月10GB存储）
  - 适合长期使用

### Q2: 配置错误会影响使用吗？

**A: 不会！** 应用实现了智能回退机制：

- ✅ 配置正确：启用云端同步
- ✅ 配置错误：自动使用本地存储
- ✅ 未配置：使用本地存储
- ✅ 所有核心功能正常工作

### Q3: 如何验证配置是否成功？

**A: 有3种方法：**

1. **查看控制台**
   ```bash
   # 如果配置成功，不会看到警告信息
   # 如果配置失败，会看到警告
   ```

2. **测试API**
   ```bash
   curl -X POST http://localhost:5000/api/cloud-sync \
     -H "Content-Type: application/json" \
     -d '{"action":"check"}'
   ```

3. **在应用中测试**
   - 登录 → 个人中心 → 点击"立即同步"
   - 查看同步结果提示

### Q4: 数据安全吗？

**A: 非常安全！**

- ✅ 使用HTTPS加密传输
- ✅ 加密数据本身已加密
- ✅ Ticket是解密密钥，不在云端存储
- ✅ 建议定期导出重要数据

### Q5: 可以更换存储服务吗？

**A: 可以！** 非常简单：

1. 修改 `.env.local` 中的环境变量
2. 重启开发服务器
3. 在新服务中点击"立即同步"
4. 数据会自动上传到新存储

---

## 费用参考

### Supabase Storage（2024年价格）

- **存储费用**：免费 500MB
- **带宽费用**：免费 2GB/月
- **API请求**：免费 50,000次/月
- **超额费用**：$0.021/GB/月（存储），$0.06/GB（带宽）

**估算成本**（个人使用）：
- 10个加密文件（共100MB）：完全免费
- 年成本：$0

### 阿里云OSS（2024年价格）

- **存储费用**：¥0.12/GB/月
- **下行流量**：¥0.5/GB
- **免费额度**：前3个月免费（5GB存储 + 5GB流量）

**估算成本**（个人使用）：
- 10个加密文件（共100MB）：约 ¥0.012/月
- 年成本：约 ¥0.15

### 腾讯云COS（2024年价格）

- **存储费用**：¥0.118/GB/月
- **下行流量**：¥0.5/GB
- **免费额度**：前6个月免费（50GB存储 + 10GB流量）

**估算成本**（个人使用）：
- 10个加密文件（共100MB）：约 ¥0.012/月
- 年成本：约 ¥0.15

---

## 下一步

- 📖 阅读详细配置指南：`CLOUD_SYNC_CONFIG.md`
- 🔧 查看环境变量示例：`.env.local.example`
- 🚀 开始使用应用！

---

## 技术支持

如果遇到问题：

1. 查看 `CLOUD_SYNC_CONFIG.md` 详细文档
2. 检查浏览器控制台错误信息
3. 参考云服务提供商的文档
4. 提交 Issue 到项目仓库

**祝你使用愉快！** 🎉
