#!/usr/bin/env node
/**
 * 批量从 LEGO 官网提取套装封面图 URL
 * 通过 CDP 协议操作浏览器
 */
import WebSocket from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const CDP_HTTP = 'http://127.0.0.1:18800';

async function cdp(method, params = {}) {
  const tabs = await fetch(`${CDP_HTTP}/json`).then(r => r.json());
  const tab = tabs.find(t => t.type === 'page');
  if (!tab) throw new Error('No tab found');
  
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  
  await new Promise(resolve => ws.on('open', resolve));
  
  async function send(method, params = {}) {
    const myId = id++;
    return new Promise((resolve, reject) => {
      pending.set(myId, resolve);
      ws.send(JSON.stringify({ id: myId, method, params }));
      setTimeout(() => reject(new Error('timeout')), 15000);
    });
  }
  
  try {
    const result = await fn(send);
    ws.close();
    return result;
  } catch (e) {
    ws.close();
    throw e;
  }
}

// 不需要 ws 模块，直接用 fetch 模拟
async function navigateAndExtract(setId) {
  const tabs = await fetch(`${CDP_HTTP}/json`).then(r => r.json());
  const tab = tabs.find(t => t.type === 'page');
  
  // Navigate
  await fetch(`${CDP_HTTP}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: tab.id, url: `https://www.lego.com/en-us/search?q=${setId}` })
  }).catch(() => {});
  
  // Wait for page load
  await new Promise(r => setTimeout(r, 3000));
  
  // Get fresh tabs
  const tabs2 = await fetch(`${CDP_HTTP}/json`).then(r => r.json());
  const tab2 = tabs2.find(t => t.type === 'page');
  
  console.log(`  ${setId}: navigated to ${tab2?.url}`);
  return tab2?.url;
}

const sets = JSON.parse(readFileSync('/tmp/lego-sets.json', 'utf8'));
console.log(`Processing ${sets.length} sets...`);

for (const s of sets.slice(0, 3)) {
  const url = await navigateAndExtract(s.set_id);
  console.log(`  -> ${url}`);
}
