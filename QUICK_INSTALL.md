# 🚀 一键本地部署指南

## ⚡ 快速开始（3 种方式）

### 方式 1：双击运行脚本（最简单）⭐⭐⭐

#### Windows 用户：
```
1. 双击 install.bat 文件
2. 等待自动安装和启动
3. 浏览器访问 http://localhost:5000
```

#### Linux/Mac 用户：
```bash
1. 双击 install.sh 文件（或右键 → 打开方式 → 终端）
2. 等待自动安装和启动
3. 浏览器访问 http://localhost:5000
```

---

### 方式 2：使用命令行（推荐）⭐⭐

#### Windows:
```bash
# 打开命令提示符（CMD）或 PowerShell
# 进入项目目录
cd file-encryptor-with-ticket

# 运行一键部署脚本
install.bat
```

#### Linux/Mac:
```bash
# 打开终端
# 进入项目目录
cd file-encryptor-with-ticket

# 运行一键部署脚本
./install.sh
```

---

### 方式 3：使用 Yarn 命令（最灵活）⭐

```bash
# 克隆项目
git clone https://github.com/LC0225/file-encryptor-with-ticket.git
cd file-encryptor-with-ticket

# 一键部署（安装 + 启动）
yarn deploy
```

---

## 📋 安装过程说明

### 自动执行的操作：

1. ✅ **检查环境**
   - 检查 Node.js 是否安装
   - 检查 Yarn 是否安装（自动安装）

2. ✅ **安装依赖**
   - 自动运行 `yarn install`
   - 安装所有必需的依赖包

3. ✅ **配置环境**
   - 自动创建 `.env.local` 文件
   - 复制示例配置

4. ✅ **启动服务**
   - 自动运行 `yarn dev`
   - 在 http://localhost:5000 启动

---

## 🎯 部署成功标志

看到以下信息说明部署成功：

```
========================================
  🚀 部署完成！
========================================

📱 访问地址：http://localhost:5000

💡 提示：
   - 按 Ctrl+C 可以停止服务器
   - 修改代码后会自动热更新

正在启动服务器...

▲ Next.js 16.0.10 (Turbopack)

- Local:        http://localhost:5000
- Environments: .env.local

✓ Ready in 2.3s
```

---

## 🛠️ 常见问题

### Q1: 双击脚本没反应

**解决方案**：
- **Windows**: 右键点击 `install.bat` → 以管理员身份运行
- **Linux/Mac**: 在终端中运行 `chmod +x install.sh && ./install.sh`

### Q2: 提示"未安装 Node.js"

**解决方案**：
1. 访问 https://nodejs.org
2. 下载 LTS 版本
3. 安装后重新运行脚本

### Q3: 端口 5000 被占用

**解决方案**：
```bash
# 方法 1：使用其他端口
yarn dev -p 3000

# 方法 2：停止占用端口的进程
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Q4: 依赖安装失败

**解决方案**：
```bash
# 清理缓存后重试
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

### Q5: 脚本运行后立即关闭

**解决方案**：
- **Windows**: 使用命令提示符（CMD）而不是 PowerShell
- **Linux/Mac**: 在终端中运行，不要直接双击

---

## 🔧 自定义配置

### 配置云端同步

1. 编辑 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. 重启服务器：
```bash
# 按 Ctrl+C 停止
# 重新运行
yarn dev
```

---

## 📊 部署方式对比

| 方式 | 优点 | 缺点 | 适合人群 |
|-----|------|------|---------|
| **双击脚本** | 最简单，无技术门槛 | 灵活性低 | 完全不懂技术的用户 |
| **命令行** | 可查看详细过程 | 需要基本命令行知识 | 稍懂技术的用户 |
| **Yarn 命令** | 最灵活，可自定义 | 需要 Yarn 环境 | 开发者 |

---

## 🎓 第一次使用？看这里

### 完整新手指南

1. **下载项目**
   - 访问 GitHub：https://github.com/LC0225/file-encryptor-with-ticket
   - 点击 "Code" → "Download ZIP"
   - 解压到任意文件夹

2. **打开文件夹**
   - 双击打开解压的文件夹

3. **运行安装**
   - Windows: 双击 `install.bat`
   - Linux/Mac: 双击 `install.sh`

4. **等待安装**
   - 看到"🚀 部署完成！"说明成功

5. **打开浏览器**
   - 访问 http://localhost:5000

6. **开始使用**
   - 注册账号
   - 加密/解密文件

---

## 📱 启动和停止

### 启动服务器

```bash
# 方式 1：使用脚本
install.bat  # Windows
./install.sh # Linux/Mac

# 方式 2：使用 Yarn
yarn dev

# 方式 3：使用 npm
npm run dev
```

### 停止服务器

```bash
# 在运行脚本的窗口中按 Ctrl+C
```

### 后台运行（可选）

```bash
# Linux/Mac - 后台运行
nohup yarn dev > logs/app.log 2>&1 &

# 查看日志
tail -f logs/app.log

# 停止
pkill -f "yarn dev"
```

---

## 💡 提示

### 开发模式
- 支持热更新（HMR）
- 修改代码自动刷新
- 适合开发和测试

### 生产模式
```bash
# 构建
yarn build

# 启动生产服务器
yarn start
```
- 性能更好
- 适合正式使用

---

## 🎉 总结

### 最简单的方式（推荐）

```
1. 下载项目
2. 双击 install.bat（Windows）或 install.sh（Mac）
3. 等待完成
4. 访问 http://localhost:5000
```

**就这么简单！** 🚀
