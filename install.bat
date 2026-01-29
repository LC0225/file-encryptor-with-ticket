@echo off
chcp 65001 > nul
echo ========================================
echo   文件加密工具 - 一键本地部署
echo ========================================
echo.

REM 检查 Node.js
echo [1/5] 检查 Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未安装 Node.js
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)
echo ✅ Node.js 已安装
node --version

REM 检查 Yarn
echo.
echo [2/5] 检查 Yarn...
where yarn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Yarn 未安装，正在安装...
    npm install -g yarn
)
echo ✅ Yarn 已就绪

REM 安装依赖
echo.
echo [3/5] 安装项目依赖...
yarn install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

REM 创建环境变量文件
echo.
echo [4/5] 配置环境变量...
if not exist .env.local (
    echo 创建 .env.local 文件...
    copy .env.example .env.local >nul
    echo ✅ 环境变量文件已创建
    echo 📝 请根据需要编辑 .env.local 配置 Supabase
) else (
    echo ✅ 环境变量文件已存在
)

REM 启动开发服务器
echo.
echo [5/5] 启动开发服务器...
echo.
echo ========================================
echo   🚀 部署完成！
echo ========================================
echo.
echo 📱 访问地址：http://localhost:5000
echo.
echo 💡 提示：
echo    - 按 Ctrl+C 可以停止服务器
echo    - 修改代码后会自动热更新
echo.
echo 正在启动服务器...
echo.

yarn dev

pause
