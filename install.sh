#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo "  文件加密工具 - 一键本地部署"
echo "========================================"
echo ""

# 检查 Node.js
echo "[1/5] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误：未安装 Node.js${NC}"
    echo "请访问 https://nodejs.org 下载安装"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 已安装${NC}"
node --version

# 检查 Yarn
echo ""
echo "[2/5] 检查 Yarn..."
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}⚠️  Yarn 未安装，正在安装...${NC}"
    npm install -g yarn
fi
echo -e "${GREEN}✅ Yarn 已就绪${NC}"
yarn --version

# 安装依赖
echo ""
echo "[3/5] 安装项目依赖..."
yarn install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 创建环境变量文件
echo ""
echo "[4/5] 配置环境变量..."
if [ ! -f .env.local ]; then
    echo "创建 .env.local 文件..."
    cp .env.example .env.local
    echo -e "${GREEN}✅ 环境变量文件已创建${NC}"
    echo "📝 请根据需要编辑 .env.local 配置 Supabase"
else
    echo -e "${GREEN}✅ 环境变量文件已存在${NC}"
fi

# 启动开发服务器
echo ""
echo "[5/5] 启动开发服务器..."
echo ""
echo "========================================"
echo "  🚀 部署完成！"
echo "========================================"
echo ""
echo "📱 访问地址：http://localhost:5000"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 可以停止服务器"
echo "   - 修改代码后会自动热更新"
echo ""
echo "正在启动服务器..."
echo ""

yarn dev
