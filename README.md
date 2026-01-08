# 文件加密工具 - 纯静态版本

基于原生JavaScript和Tailwind CSS的文件加密网页应用，支持单文件加密/解密，使用ticket作为密钥，包含个人中心和管理员功能。

## 功能特性

- 🔐 文件加密/解密（AES-GCM算法）
- 🎫 Ticket密钥管理（每个文件独立ticket）
- 👤 用户注册/登录系统
- 📊 个人中心（加密历史记录）
- 🛡️ 管理员面板（用户管理）
- 🌙 深色模式支持
- ⚡ 秒级加载（纯静态，无服务器）

## 技术栈

- 原生 JavaScript (ES6+)
- Web Crypto API (AES-GCM)
- Tailwind CSS (CDN)
- LocalStorage (数据持久化)

## 本地预览

由于是纯静态HTML文件，你可以直接在浏览器中打开：

```bash
# 方法1：直接在浏览器中打开
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux

# 方法2：使用Python的HTTP服务器
python3 -m http.server 5000

# 方法3：使用Node.js的http-server
npx http-server -p 5000
```

然后在浏览器中访问 `http://localhost:5000`

## 部署到GitHub Pages

### 自动部署（推荐）

1. 推送代码到GitHub仓库
2. 在GitHub仓库中：
   - 进入 **Settings** → **Pages**
   - Source 选择：**Deploy from a branch**
   - Branch 选择：**main** (或master)
   - Folder 选择：**/(root)**
   - 点击 **Save**

3. 等待几分钟后，访问 `https://你的用户名.github.io/仓库名/`

### 手动部署到gh-pages分支

```bash
# 初始化git仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 创建并切换到gh-pages分支
git checkout --orphan gh-pages
git rm -rf .
git checkout main -- index.html
git add index.html
git commit -m "Deploy to GitHub Pages"

# 推送到GitHub
git remote add origin https://github.com/你的用户名/仓库名.git
git push origin gh-pages
```

然后在GitHub仓库的 **Settings** → **Pages** 中：
- Source 选择：**Deploy from a branch**
- Branch 选择：**gh-pages**
- Folder 选择：**/(root)**

## 默认账号

### 管理员账号
- 用户名：`root`
- 密码：`BGSN123.321`

**注意**：
- 管理员账号无法被删除
- 首次访问时会自动创建管理员账号

## 密码要求

- 至少8位
- 包含大写字母
- 包含小写字母
- 包含数字

## 使用说明

### 加密文件
1. 登录或注册账号
2. 点击"加密文件"模式
3. 选择要加密的文件
4. 点击"生成Ticket"或手动输入ticket
5. 点击"加密文件"按钮
6. 下载加密文件并保存ticket

### 解密文件
1. 登录账号
2. 点击"解密文件"模式
3. 选择之前加密的文件（.encrypted格式）
4. 输入对应的ticket
5. 点击"解密文件"按钮
6. 下载解密后的原文件

### 个人中心
- 查看所有加密历史记录
- 复制已使用的ticket

### 管理员面板
- 查看所有用户
- 删除普通用户（无法删除管理员）

## 安全说明

- 所有加密操作在浏览器端完成，文件不会上传到服务器
- 使用AES-GCM加密算法，安全性高
- Ticket丢失后无法恢复文件，请妥善保存
- 数据存储在localStorage中，清除浏览器数据会丢失所有用户记录

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

需要支持Web Crypto API的现代浏览器。

## 性能优势

相比之前的Next.js版本：
- ⚡ 页面加载时间从30+秒降至<1秒
- 📦 无需构建过程
- 🌐 无需服务器，支持CDN加速
- 💰 零成本部署

## 许可证

MIT
