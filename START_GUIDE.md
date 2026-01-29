# 启动脚本使用说明

## 📁 项目路径

```
D:\file-encryptor-with-ticket-main
```

## 🚀 启动脚本列表

### 1. start-simple.bat（最简单推荐）⭐

**特点**：
- ✅ 只有 3 行代码，最简单
- ✅ 不会闪退（有 pause）
- ✅ 直接启动服务

**使用方法**：
```
双击 start-simple.bat
```

**内容**：
```batch
@echo off
cd /d D:\file-encryptor-with-ticket-main
npm run dev
pause
```

---

### 2. start.bat（标准版）

**特点**：
- ✅ 显示目录路径
- ✅ 显示启动信息
- ✅ 服务停止后保持窗口打开

**使用方法**：
```
双击 start.bat
```

---

### 3. start-full.bat（完整版）

**特点**：
- ✅ 检查项目目录是否存在
- ✅ 检查 package.json 是否存在
- ✅ 检查依赖是否安装，未安装则自动安装
- ✅ 显示详细信息
- ✅ 错误处理

**使用方法**：
```
双击 start-full.bat
```

---

## 📋 推荐使用流程

### 首次使用（推荐 start-full.bat）

1. **双击** `start-full.bat`
2. **等待** 依赖安装（如果是首次）
3. **看到** `✓ Ready in X.Xs`
4. **访问** http://localhost:5000

---

### 日常使用（推荐 start-simple.bat）

1. **双击** `start-simple.bat`
2. **等待** 2-5 秒
3. **看到** `✓ Ready in X.Xs`
4. **访问** http://localhost:5000

---

## 🎯 快速开始

### 立即执行：

1. **找到脚本位置**：
   - 路径：`D:\file-encryptor-with-ticket-main`
   - 应该能看到三个启动脚本

2. **双击运行**：
   - 首次使用：双击 `start-full.bat`
   - 日常使用：双击 `start-simple.bat`

3. **等待启动**：
   - 看到输出：`✓ Ready in X.Xs`

4. **打开浏览器**：
   - 访问：`http://localhost:5000`

---

## ✅ 成功启动的标志

运行脚本后，你应该看到：

```
▲ Next.js 16.0.0
- Local:        http://localhost:5000
- Network:      http://192.168.1.100:5000
- Environments: .env.local
✓ Ready in 2.5s
```

**关键点**：
- ✅ 显示 Next.js 版本
- ✅ 显示访问地址
- ✅ 显示 `✓ Ready in X.Xs`

---

## ❌ 如果遇到问题

### 问题 1：脚本闪退

**原因**：路径不正确

**解决**：
1. 确认项目在 `D:\file-encryptor-with-ticket-main`
2. 确认脚本和项目在同一目录
3. 或者手动修改脚本中的路径

---

### 问题 2：找不到 npm

**错误信息**：
```
'npm' is not recognized as an internal or external command
```

**解决**：
1. 确认 Node.js 已安装
2. 重启命令行
3. 运行 `node --version` 验证

---

### 问题 3：端口占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::5000
```

**解决**：
1. 打开新的命令行
2. 运行：
   ```bash
   netstat -ano | findstr :5000
   ```
3. 结束占用进程：
   ```bash
   taskkill /PID <进程ID> /F
   ```
4. 重新运行启动脚本

---

### 问题 4：依赖未安装

**错误信息**：
```
Error: Cannot find module 'next'
```

**解决**：
1. 双击 `start-full.bat`（会自动安装依赖）
2. 或手动运行：
   ```bash
   npm install
   ```

---

## 💡 提示

### 关于窗口关闭

**重要**：
- ✅ 脚本运行后，窗口会保持打开（因为有 `pause`）
- ✅ 不要手动关闭窗口，否则服务会停止
- ✅ 可以最小化窗口，但不关闭
- ✅ 如果关闭了，重新运行脚本即可

### 关于依赖安装

**首次使用**：
- 使用 `start-full.bat` 会自动检查并安装依赖
- 只需要安装一次
- 之后可以使用 `start-simple.bat` 快速启动

### 关于访问地址

**服务启动后**：
- 本机访问：`http://localhost:5000`
- 局域网访问：`http://你的IP:5000`

---

## 📊 脚本对比

| 特性 | start-simple.bat | start.bat | start-full.bat |
|------|------------------|-----------|----------------|
| **代码行数** | 3 行 | ~20 行 | ~40 行 |
| **依赖检查** | ❌ | ❌ | ✅ |
| **目录检查** | ❌ | ❌ | ✅ |
| **错误处理** | ❌ | ❌ | ✅ |
| **显示信息** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **推荐场景** | 日常快速启动 | 标准启动 | 首次或完整启动 |

---

## 🎯 建议使用策略

### 场景 1：首次安装

使用：`start-full.bat`
- 会检查所有依赖
- 自动安装缺失的依赖
- 显示完整信息

---

### 场景 2：日常开发

使用：`start-simple.bat`
- 快速启动
- 最简单
- 重复使用

---

### 场景 3：遇到问题

使用：`start-full.bat`
- 显示详细信息
- 错误提示
- 便于诊断

---

## 🚀 立即开始

### 现在就试试：

1. **打开文件夹**
   ```
   D:\file-encryptor-with-ticket-main
   ```

2. **双击脚本**
   ```
   start-simple.bat
   ```

3. **等待启动**
   ```
   看到 ✓ Ready in X.Xs
   ```

4. **打开浏览器**
   ```
   http://localhost:5000
   ```

---

## ✨ 总结

### 已创建的脚本

1. ✅ **start-simple.bat** - 最简单，推荐日常使用
2. ✅ **start.bat** - 标准版
3. ✅ **start-full.bat** - 完整版，推荐首次使用

### 推荐使用

- **首次**：`start-full.bat`
- **日常**：`start-simple.bat`

### 启动后

- ✅ 不要关闭窗口
- ✅ 访问 `http://localhost:5000`
- ✅ 开始使用文件加密器

---

**现在就去双击 `start-simple.bat` 吧！** 🚀

**几秒钟后，你就能看到登录页面了！** 🎉
