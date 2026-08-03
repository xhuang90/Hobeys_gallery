#!/bin/bash
# Hobey's Gallery 一键部署脚本
# 用法：bash deploy.sh

set -e

cd "$(dirname "$0")"

echo "🔨 1/3 本地构建..."
export PATH="$HOME/.workbuddy/binaries/node/versions/20.18.0/bin:$PATH"
npm run build

echo "📦 2/3 生成 Vercel 构建产物..."
npx vercel build --prod

echo "🚀 3/3 部署上线..."
npx vercel --prod --prebuilt

echo ""
echo "✅ 部署完成！"
echo "🌐 https://hobeys-gallery.vercel.app"
