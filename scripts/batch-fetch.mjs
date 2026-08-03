#!/usr/bin/env node
/**
 * 批量从 LEGO 官网提取套装封面图 URL 并下载
 * 使用 CDP 协议直接控制浏览器
 */
import WebSocket from 'ws';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const CDP_HTTP = 'http://127.0.0.1:18800';
const ROOT = '/root/.openclaw/workspace/agent:main:uuid-qaimxjh8j5bmsclut55/myvault';
const LEGO_DIR = join(ROOT, 'collections/lego');
const IMG_DIR = join(ROOT, 'collections/images');

mkdirSync(IMG_DIR, { recursive: true });

// 收集所有 set_id
const sets = [];
for (const f of readdirSync(LEGO_DIR).filter(f => f.endsWith('.md'))) {
  const content = readFileSync(join(LEGO_DIR, f), 'utf8');
  const m = content.match(/^set_id:\s*(\d+)/m);
  if (m) sets.push({ file: f, setId: m[1] });
}

// 过滤出需要封面的
const needsCover = sets.filter(s => {
  const content = readFileSync(join(LEGO_DIR, s.file), 'utf8');
  return !content.match(/^cover:/m);
});

console.log(`总计 ${sets.length} 个套装，${needsCover.length} 个需要封面图`);

// CDP helper
async function getTab() {
  const tabs = await fetch(`${CDP_HTTP}/json`).then(r => r.json());
  return tabs.find(t => t.type === 'page');
}

let msgId = 0;
async function cdpSend(ws, method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 20000);
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        clearTimeout(timeout);
        ws.removeListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function processSet(ws, setId) {
  // Navigate to search page (will redirect to product page if exists)
  await cdpSend(ws, 'Page.navigate', { url: `https://www.lego.com/en-us/search?q=${setId}` });
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 3500));
  
  // Extract image URLs
  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .map(i => i.src)
        .filter(s => s.includes('cdn/cs/set/assets') && s.match(/\\/\\d+[^/]*\\.(jpg|png)/))
        .slice(0, 3);
    })()`,
    returnByValue: true,
  });
  
  const urls = result.result.value || [];
  if (urls.length > 0) {
    return urls[0]; // Return first (main) image URL
  }
  return null;
}

async function downloadImage(url, setId) {
  const ext = url.includes('.png') ? 'png' : 'jpg';
  const filename = `lego-${setId}.${ext}`;
  const filepath = join(IMG_DIR, filename);
  
  if (existsSync(filepath)) {
    console.log(`  ✓ ${setId}: already exists`);
    return filename;
  }
  
  try {
    execSync(`curl -sL "${url}" -o "${filepath}"`, { timeout: 10000 });
    console.log(`  ✓ ${setId}: downloaded ${filename}`);
    return filename;
  } catch (e) {
    console.log(`  ✗ ${setId}: download failed`);
    return null;
  }
}

async function main() {
  const tab = await getTab();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  
  // Enable Page events
  await cdpSend(ws, 'Page.enable', {});
  
  const results = {};
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < needsCover.length; i++) {
    const s = needsCover[i];
    console.log(`[${i + 1}/${needsCover.length}] Processing ${s.setId}...`);
    
    try {
      const imgUrl = await processSet(ws, s.setId);
      
      if (imgUrl) {
        console.log(`  Found: ${imgUrl.substring(0, 80)}...`);
        const filename = await downloadImage(imgUrl, s.setId);
        if (filename) {
          results[s.setId] = filename;
          success++;
        } else {
          failed++;
        }
      } else {
        console.log(`  ✗ ${s.setId}: no image found`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ ${s.setId}: error - ${e.message}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    if (i < needsCover.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  ws.close();
  
  // Save results
  writeFileSync('/tmp/lego-covers.json', JSON.stringify(results, null, 2));
  
  console.log(`\n完成: ${success} 成功, ${failed} 失败`);
  console.log(`结果已保存到 /tmp/lego-covers.json`);
}

main().catch(console.error);
