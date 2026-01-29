# 登录/注册失败 - 完整解决方案

## ❌ 问题描述

点击登录或注册按钮后，失败并提示：
```
config.ts:30 数据库未配置，将使用 localStorage 模式。如需使用数据库，请设置 DATABASE_URL 环境变量。
```

---

## 🔍 根本原因

### 问题分析

尽管我们已经修复了代码并配置了 `.env.local`，但问题仍然存在。这是因为：

1. **环境变量可能未正确加载**
2. **Next.js 可能缓存了旧代码**
3. **`.env.local` 文件可能不在正确位置**

### 关键问题

`canUseDatabase()` 函数仍然返回 `true`，导致尝试访问数据库。

---

## ✅ 解决方案

### 方案 1：完全清除缓存并重启（推荐）⭐

#### 步骤 1：停止服务器

在命令行窗口中按 `Ctrl + C`

---

#### 步骤 2：删除 Next.js 缓存

```bash
rmdir /s /q .next
```

如果提示文件正在使用，先关闭所有浏览器标签页，然后再次尝试。

---

#### 步骤 3：确认 `.env.local` 文件位置

确保 `.env.local` 文件在项目根目录：

```
D:\file-encryptor-with-ticket-main\.env.local
```

检查文件内容是否包含：
```env
USE_DATABASE=false
```

---

#### 步骤 4：重新启动应用

```bash
npm run dev
```

或双击：
```
start-simple.bat
```

---

#### 步骤 5：清除浏览器缓存

1. 按 `Ctrl + Shift + Delete`
2. 选择"缓存的图片和文件"
3. 点击"清除数据"

---

### 方案 2：检查环境变量是否加载

#### 步骤 1：创建测试文件

在项目根目录创建一个测试文件 `test-env.js`：

```javascript
console.log('USE_DATABASE:', process.env.USE_DATABASE);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PGDATABASE_URL:', process.env.PGDATABASE_URL);
console.log('NEXT_PUBLIC_DATABASE_URL:', process.env.NEXT_PUBLIC_DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

---

#### 步骤 2：运行测试

```bash
node test-env.js
```

**预期输出**：
```
USE_DATABASE: false
DATABASE_URL: undefined
PGDATABASE_URL: undefined
NEXT_PUBLIC_DATABASE_URL: undefined
NODE_ENV: development
```

如果 `USE_DATABASE` 不是 `false`，说明 `.env.local` 文件有问题。

---

### 方案 3：强制使用 localStorage 模式

如果上述方法都不行，可以修改代码强制使用 localStorage。

#### 修改文件：`src/utils/config.ts`

**找到这个函数**：
```typescript
export function canUseDatabase(): boolean {
  // 如果显式设置了环境变量，则使用数据库
  if (process.env.USE_DATABASE === 'true') {
    return true;
  }

  // 如果显式禁用了数据库，则不使用
  if (process.env.USE_DATABASE === 'false') {
    return false;
  }

  // 检查是否配置了数据库 URL
  const hasDatabaseConfig = !!(
    process.env.DATABASE_URL ||
    process.env.PGDATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL
  );

  // 如果没有配置数据库 URL，强制使用 localStorage 模式
  if (!hasDatabaseConfig) {
    console.warn('数据库未配置，将使用 localStorage 模式。如需使用数据库，请设置 DATABASE_URL 环境变量。');
    return false;
  }

  // 默认在开发环境使用数据库，生产环境使用localStorage
  return isDevelopment;
}
```

**替换为**（强制返回 false）：
```typescript
export function canUseDatabase(): boolean {
  // 强制使用 localStorage 模式
  console.log('🔒 强制使用 localStorage 模式（数据库已禁用）');
  return false;
}
```

---

## 📋 验证修复

### 步骤 1：重启应用

清除缓存后重新启动。

---

### 步骤 2：检查控制台

打开浏览器开发者工具（F12），查看 Console。

**应该看到**：
```
🔒 强制使用 localStorage 模式（数据库已禁用）
```

**不应该看到**：
```
数据库未配置，将使用 localStorage 模式。如需使用数据库，请设置 DATABASE_URL 环境变量。
```

---

### 步骤 3：测试注册

1. 打开注册页面
2. 输入用户名：`testuser`
3. 输入密码：`Test123`
4. 确认密码：`Test123`
5. 点击 **"注册"** 按钮

**预期结果**：✅ 注册成功

---

### 步骤 4：测试登录

1. 使用刚注册的账号登录
2. 输入用户名和密码
3. 点击 **"登录"** 按钮

**预期结果**：✅ 登录成功

---

## 🔧 快速修复步骤

### 立即执行（推荐）

```bash
# 1. 停止服务器（Ctrl + C）

# 2. 删除缓存
rmdir /s /q .next

# 3. 重启服务器
npm run dev
```

### 如果还不行

编辑 `src/utils/config.ts`，强制返回 false：
```typescript
export function canUseDatabase(): boolean {
  console.log('🔒 强制使用 localStorage 模式（数据库已禁用）');
  return false;
}
```

---

## 💡 为什么会出现这个问题？

### 原因 1：Next.js 缓存

Next.js 会缓存环境变量和编译后的代码，即使修改了 `.env.local`，缓存可能不会立即更新。

### 原因 2：环境变量加载顺序

环境变量需要在应用启动时加载，如果加载顺序有问题，可能导致变量未生效。

### 原因 3：`.env.local` 文件位置

如果 `.env.local` 不在正确的位置，Next.js 无法读取它。

---

## ✨ 总结

### 推荐解决顺序

1. ✅ 删除 `.next` 缓存文件夹
2. ✅ 确认 `.env.local` 包含 `USE_DATABASE=false`
3. ✅ 重启应用
4. ✅ 清除浏览器缓存
5. ✅ 测试注册和登录

### 如果还不行

6. ✅ 修改 `src/utils/config.ts`，强制返回 `false`
7. ✅ 重启应用
8. ✅ 测试注册和登录

---

## 🚀 立即操作

```bash
# 停止服务器（Ctrl + C）

# 删除缓存
rmdir /s /q .next

# 重启服务器
npm run dev
```

**如果还不行，修改 `src/utils/config.ts` 强制返回 false！**

---

**按照这些步骤操作，问题一定可以解决！** 🎉
