#!/bin/bash
# Hobey's Gallery 一键部署脚本
# 用法：bash deploy.sh [vercel|github]

set -e
cd "$(dirname "$0")"

export PATH="$HOME/.workbuddy/binaries/node/versions/20.18.0/bin:$PATH"

PLATFORM="${1:-vercel}"

echo "🔨 1/3 本地构建..."
node scripts/build.js
npx vite build

if [ "$PLATFORM" = "github" ]; then
  echo "📦 2/3 推送到 GitHub Pages..."
  git checkout --orphan gh-pages-tmp 2>/dev/null || git checkout gh-pages-tmp
  git rm -rf . 2>/dev/null
  cp -r dist/* .
  git add -A
  git commit -m "deploy: GitHub Pages $(date +%Y-%m-%d)" || true
  git push origin gh-pages-tmp:gh-pages --force
  git checkout main
  git branch -D gh-pages-tmp 2>/dev/null
  echo ""
  echo "✅ 已推送到 GitHub Pages！"
  echo "🌐 https://xhuang90.github.io/Hobeys_gallery/"
else
  echo "📦 2/3 生成 Vercel 构建产物..."
  npx vercel build --prod

  echo "🚀 3/3 部署到 Vercel..."
  npx vercel --prod --prebuilt

  echo ""
  echo "✅ 已部署到 Vercel！"
  echo "🌐 https://hobeys-gallery.vercel.app"
fi
