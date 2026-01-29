# 数据库配置问题解决方案

## ❌ 问题描述

启动时出现以下错误：

```
初始化管理员账号失败: Error: Database URL not configured. Set PGDATABASE_URL environment variable.
```

**原因**：项目默认在开发环境下使用数据库，但用户未配置数据库 URL。

---

## ✅ 解决方案

### 方案 A：使用 localStorage 模式（推荐）⭐

这是最简单的方案，**无需配置数据库**，所有数据存储在浏览器中。

#### 步骤 1：修改 .env.local 文件

在项目根目录的 `.env.local` 文件中，添加以下行：

```env
USE_DATABASE=false
```

或者，确保文件内容如下：

```env
USE_DATABASE=false

# Supabase 配置（云端同步功能）
NEXT_PUBLIC_SUPABASE_URL=https://wzvpiyjxlaihcjgdchez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnBpeWp4bGFpaGNqZ2RjaGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA1NDQsImV4cCI6MjA4MzQzNjU0NH0.BiDs5jYdHz6gAzIQCKNldden7OsAmQ3PXK-HYyvt4kk
```

#### 步骤 2：重启开发服务器

1. 在命令行窗口中按 `Ctrl + C` 停止服务器
2. 重新运行启动脚本：
   ```bash
   start-simple.bat
   ```
   或
   ```bash
   npm run dev
   ```

#### 步骤 3：验证启动成功

你应该看到：

```
数据库未配置，将使用 localStorage 模式。如需使用数据库，请设置 DATABASE_URL 环境变量。

▲ Next.js 16.0.0
- Local:        http://localhost:5000
- Network:      http://192.168.1.100:5000
✓ Ready in 2.5s
```

看到 `✓ Ready in X.Xs` 表示启动成功！

---

### 方案 B：配置 PostgreSQL 数据库

如果你需要使用数据库进行数据管理，可以配置 PostgreSQL 数据库。

#### 步骤 1：安装 PostgreSQL

1. 下载并安装 PostgreSQL：https://www.postgresql.org/download/windows/
2. 安装过程中设置密码（记住这个密码）

#### 步骤 2：创建数据库

1. 打开 pgAdmin（PostgreSQL 管理工具）
2. 连接到服务器
3. 右键点击"Databases" → "Create" → "Database"
4. 输入数据库名称，例如：`file-encryptor`
5. 点击"Save"

#### 步骤 3：配置环境变量

在 `.env.local` 文件中添加：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/file-encryptor
```

或者：

```env
USE_DATABASE=true
PGDATABASE_URL=postgresql://postgres:你的密码@localhost:5432/file-encryptor
```

#### 步骤 4：重启开发服务器

```bash
npm run dev
```

---

### 方案 C：使用 Coze Coding 平台数据库（需要访问权限）

如果你在 Coze Coding 平台上开发，可以使用平台提供的数据库服务。

#### 步骤 1：创建数据库

1. 在 Coze Coding 平台上创建一个数据库
2. 获取数据库连接字符串

#### 步骤 2：配置环境变量

在 `.env.local` 文件中添加：

```env
USE_DATABASE=true
DATABASE_URL=你的数据库连接字符串
```

---

## 📊 方案对比

| 特性 | localStorage 模式 | PostgreSQL 数据库 |
|------|------------------|------------------|
| **配置难度** | ⭐ 极简单 | ⭐⭐⭐⭐⭐ 复杂 |
| **启动速度** | ⭐⭐⭐⭐⭐ 极快 | ⭐⭐⭐ 需要连接 |
| **数据持久化** | ⭐⭐ 浏览器本地 | ⭐⭐⭐⭐⭐ 服务器持久 |
| **多用户支持** | ⭐⭐⭐ 支持（同一浏览器） | ⭐⭐⭐⭐⭐ 完整支持 |
| **备份恢复** | ⭐⭐ 手动导出 | ⭐⭐⭐⭐⭐ 标准备份 |
| **推荐场景** | 个人使用、测试 | 生产环境、多用户 |

---

## 🎯 推荐：使用 localStorage 模式

**对于大多数用户，推荐使用 localStorage 模式**：

✅ **无需安装数据库**
✅ **无需配置环境变量**
✅ **启动更快**
✅ **完全满足个人使用需求**
✅ **支持云端同步（通过 Supabase）**

**功能支持**：
- ✅ 用户注册和登录
- ✅ 文件加密和解密
- ✅ 个人中心
- ✅ 加密历史记录
- ✅ 云端同步（需要配置 Supabase）
- ✅ 管理员功能（root/BGSN123.321）

---

## 🚀 立即解决

### 快速修复（推荐）

1. **编辑** `.env.local` 文件

2. **添加或确保有以下行**：
   ```env
   USE_DATABASE=false
   ```

3. **保存文件**

4. **重启服务器**：
   - 按 `Ctrl + C` 停止当前服务器
   - 运行：`start-simple.bat`
   - 或运行：`npm run dev`

5. **等待启动成功**：
   - 看到警告信息（正常）
   - 看到 `✓ Ready in X.Xs`

6. **访问浏览器**：
   ```
   http://localhost:5000
   ```

---

## 💡 提示

### 关于 localStorage 模式

**数据存储**：
- 用户信息存储在浏览器 localStorage
- 加密历史存储在浏览器 localStorage
- 数据在同一浏览器中可以跨标签页访问

**数据安全**：
- 所有密码经过 SHA-256 加密
- 加密文件使用 AES 加密算法
- Ticket 不会存储在浏览器中

**云端同步**：
- 如果配置了 Supabase，可以同步数据到云端
- 支持跨设备访问
- 支持跨浏览器访问

### 关于 Source Map 警告

你看到的这些警告：
```
Invalid source map. Only conformant source maps can be used to find the original code.
```

**可以忽略！** 这些是 Next.js 的源码映射警告，不影响功能。

---

## ❓ 常见问题

### Q: localStorage 模式数据会丢失吗？

**A**：
- ✅ 清除浏览器数据会丢失
- ✅ 换浏览器访问不了
- ✅ 换设备访问不了
- ✅ 配置 Supabase 云端同步后，数据不会丢失

### Q: 如何切换到数据库模式？

**A**：
1. 配置数据库 URL
2. 在 `.env.local` 中设置 `USE_DATABASE=true`
3. 重启服务器

### Q: 为什么推荐 localStorage 模式？

**A**：
- 配置简单（无需数据库）
- 启动快速
- 功能完整
- 配合 Supabase 云端同步，功能与数据库模式相同

---

## ✨ 总结

### 问题原因

❌ 项目默认使用数据库，但未配置数据库 URL

### 解决方案

✅ **推荐**：在 `.env.local` 中添加 `USE_DATABASE=false`

### 操作步骤

1. 编辑 `.env.local`
2. 添加 `USE_DATABASE=false`
3. 重启服务器（`Ctrl + C` → `npm run dev`）
4. 等待 `✓ Ready in X.Xs`
5. 访问 `http://localhost:5000`

---

**现在就去修改 `.env.local` 文件，添加 `USE_DATABASE=false` 吧！** 🚀

**几分钟后，你就能正常使用文件加密器了！** 🎉
