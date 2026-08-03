#!/usr/bin/env node
/**
 * myvault data builder
 *
 * 读取 collections/**\/*.md → 生成 public/data.json + 复制图片到 public/images/
 * Vue 3 SPA 消费 data.json 渲染页面。
 *
 * 用法：node scripts/build.js
 */
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'collections');
const PUBLIC = path.join(ROOT, 'public');

/* ================= 解析层 ================= */

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (/^-?\d+$/.test(val)) {
      data[key] = Number(val);
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

/* 极简 Markdown → HTML（标题/列表/引用/粗斜体/链接/行内代码） */
function md(text) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  let html = '';
  let inList = false;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(t.slice(2))}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (!t) continue;
    if (t.startsWith('### ')) html += `<h3>${inline(t.slice(4))}</h3>`;
    else if (t.startsWith('## ')) html += `<h2>${inline(t.slice(3))}</h2>`;
    else if (t.startsWith('# ')) html += `<h1>${inline(t.slice(2))}</h1>`;
    else if (t.startsWith('> ')) html += `<blockquote>${inline(t.slice(2))}</blockquote>`;
    else html += `<p>${inline(t)}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

/* ================= 数据加载 ================= */

const TYPES = ['lego', 'vinyl', 'books', 'movies'];

function loadAll() {
  const all = [];
  for (const type of TYPES) {
    const dir = path.join(SRC, type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = parseFrontmatter(raw);
      if (String(data.private) === 'true') continue;
      all.push({
        type,
        slug: file.replace(/\.md$/, ''),
        ...data,
        body_html: md(body),
      });
    }
  }
  all.sort((a, b) => String(b.added || '').localeCompare(String(a.added || '')));
  return all;
}

/* ================= 构建 ================= */

function main() {
  const started = Date.now();
  const entries = loadAll();

  // 确保 public 目录存在
  fs.mkdirSync(PUBLIC, { recursive: true });

  // 写入 data.json
  fs.writeFileSync(path.join(PUBLIC, 'data.json'), JSON.stringify(entries, null, 2));

  // 复制图片
  const imgSrc = path.join(SRC, 'images');
  if (fs.existsSync(imgSrc)) {
    const imgDst = path.join(PUBLIC, 'images');
    fs.mkdirSync(imgDst, { recursive: true });
    for (const f of fs.readdirSync(imgSrc)) {
      fs.copyFileSync(path.join(imgSrc, f), path.join(imgDst, f));
    }
  }

  console.log(`✅ 数据构建完成：${entries.length} 件馆藏，耗时 ${Date.now() - started}ms`);
  console.log(`   输出：public/data.json`);
}

main();
