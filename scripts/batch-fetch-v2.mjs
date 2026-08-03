#!/usr/bin/env node
/**
 * 批量获取 LEGO 封面图 v2 - 使用产品直链 + 验证
 */
import WebSocket from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const CDP_HTTP = 'http://127.0.0.1:18800';
const IMG_DIR = '/root/.openclaw/workspace/agent:main:uuid-qaimxjh8j5bmsclut55/myvault/collections/images';

const sets = JSON.parse(readFileSync('/tmp/lego-refetch.json', 'utf8'));
console.log(`需要获取 ${sets.length} 个套装封面`);

async function getTab() {
  const tabs = await fetch(`${CDP_HTTP}/json`).then(r => r.json());
  return tabs.find(t => t.type === 'page');
}

let msgId = 0;
async function cdpSend(ws, method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 15000);
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

async function extractImageUrl(ws, setId) {
  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .map(i => i.src)
        .filter(s => s.includes('cdn/cs/set/assets') && s.includes('/${setId}'))
        .slice(0, 1);
    })()`,
    returnByValue: true,
  });
  const urls = result?.result?.value || [];
  return urls.length > 0 ? urls[0] : null;
}

async function tryUrls(ws, setId, urls) {
  for (const url of urls) {
    try {
      await cdpSend(ws, 'Page.navigate', { url });
      await new Promise(r => setTimeout(r, 3000));

      // Check if we're on a valid product page (URL contains set number)
      const tab = await getTab();
      if (!tab.url.includes(setId)) continue;

      const imgUrl = await extractImageUrl(ws, setId);
      if (imgUrl) return imgUrl;
    } catch (e) { /* continue */ }
  }
  return null;
}

async function downloadImage(url, setId) {
  const ext = url.includes('.png') && !url.includes('.jpg') ? 'png' : 'jpg';
  const filepath = `${IMG_DIR}/lego-${setId}.${ext}`;
  try {
    execSync(`curl -sL "${url}" -o "${filepath}"`, { timeout: 10000 });
    return filepath;
  } catch { return null; }
}

async function main() {
  const tab = await getTab();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  await cdpSend(ws, 'Page.enable', {});

  let success = 0, failed = 0;
  const results = {};

  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    console.log(`[${i + 1}/${sets.length}] ${s.set_id}: ${s.title}`);

    const urls = [
      `https://www.lego.com/en-us/product/${s.slug}-${s.set_id}`,
      `https://www.lego.com/en-us/product/${s.set_id}`,
      `https://www.lego.com/en-us/search?q=${s.set_id}`,
    ];

    const imgUrl = await tryUrls(ws, s.set_id, urls);

    if (imgUrl) {
      console.log(`  ✓ ${imgUrl.substring(0, 70)}...`);
      const filepath = await downloadImage(imgUrl, s.set_id);
      if (filepath) {
        results[s.set_id] = filepath;
        success++;
      } else {
        failed++;
      }
    } else {
      console.log(`  ✗ 未找到图片`);
      failed++;
    }

    if (i < sets.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  ws.close();
  writeFileSync('/tmp/lego-refetch-results.json', JSON.stringify(results, null, 2));
  console.log(`\n完成: ${success} 成功, ${failed} 失败`);
}

main().catch(console.error);
