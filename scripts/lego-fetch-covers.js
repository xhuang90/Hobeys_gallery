#!/usr/bin/env node
/**
 * 批量从 LEGO 官网搜索页抓取套装封面图
 * 通过浏览器 CDP 协议操作
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = '/root/.openclaw/workspace/agent:main:uuid-qaimxjh8j5bmsclut55/myvault';
const LEGO_DIR = join(ROOT, 'collections/lego');
const IMG_DIR = join(ROOT, 'collections/images');
const CDP_URL = 'http://127.0.0.1:18800';

mkdirSync(IMG_DIR, { recursive: true });

// 收集所有 set_id
const sets = [];
for (const f of readdirSync(LEGO_DIR).filter(f => f.endsWith('.md'))) {
  const content = readFileSync(join(LEGO_DIR, f), 'utf8');
  const m = content.match(/^set_id:\s*(\d+)/m);
  if (m) sets.push({ file: f, setId: m[1] });
}

console.log(`找到 ${sets.length} 个套装需要处理`);

// 检查哪些已有 cover
const needsCover = sets.filter(s => {
  const content = readFileSync(join(LEGO_DIR, s.file), 'utf8');
  return !content.match(/^cover:/m);
});

console.log(`其中 ${needsCover.length} 个缺少封面图`);

// 通过 CDP 获取当前 tab
async function cdpFetch(url) {
  const resp = await fetch(url);
  return resp.json();
}

async function getTabs() {
  return cdpFetch(`${CDP_URL}/json`);
}

async function navigateAndExtract(tabWs, setIds) {
  // Use the browser to navigate and extract
}

// 输出需要处理的 set_ids
console.log('\n需要封面图的套装:');
for (const s of needsCover) {
  console.log(`  ${s.setId} -> ${s.file}`);
}

// Write set IDs to a file for the browser script
writeFileSync('/tmp/lego-sets.json', JSON.stringify(needsCover, null, 2));
console.log(`\n已保存到 /tmp/lego-sets.json`);
