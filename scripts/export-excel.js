#!/usr/bin/env node
/**
 * myvault Excel 导出
 *
 * 读取 collections/**\/*.md → 生成 馆藏导出.xlsx
 * 每个类型一个 Sheet，字段按你的模板排列。
 *
 * 用法：node scripts/export-excel.js
 */
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'collections');

/* ========== 复刻 build.js 的 frontmatter 解析 ========== */

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  const lines = m[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const pipeMatch = line.match(/^([A-Za-z_][\w-]*):\s*\|\s*$/);
    if (pipeMatch) {
      const key = pipeMatch[1];
      const blockLines = [];
      i++;
      while (i < lines.length && /^\s{2,}/.test(lines[i])) {
        blockLines.push(lines[i].replace(/^\s{2}/, ''));
        i++;
      }
      data[key] = blockLines.join('\n');
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (/^-?\d+$/.test(val)) {
      data[key] = Number(val);
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
    i++;
  }
  return { data, body: m[2] };
}

/* 提取正文纯文本（去掉 Markdown 标记，用于 content 列） */
function stripMarkdown(text) {
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^- /gm, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ========== 字段映射 ========== */

// 通用字段提取
function extractCommon(entry) {
  return {
    id: entry.type + '-' + entry.slug,
    pic: entry.cover || '',
    album: entry.title || '',
    artist: entry.artist || entry.author || entry.director || '',
    version: entry.pressing || entry.format || entry.theme || '',
    release_date: entry.release_date || entry.year || '',
    status: entry.status || '',
    purchase_date: entry.added || '',
    purchase_from: entry.purchase_place || '',
    price: entry.price || '',
    rmb_price: entry.rmb_price || '',
    link: entry.link || '',
    content: entry.body_plain || '',
  };
}

/* ========== 类型中文名 ========== */

const TYPE_LABELS = {
  lego: '乐高',
  vinyl: '唱片',
  books: '书籍',
  movies: '电影',
};

const STATUS_LABELS = {
  // lego
  built: '已拼搭', unbuilt: '未拼搭', wishlist: '想要',
  // vinyl
  owned: '已收藏',
  // books
  read: '已读', reading: '在读', unread: '未读',
  // movies
  watched: '已看',
};

/* ========== 加载数据 ========== */

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
      const entry = {
        type,
        slug: file.replace(/\.md$/, ''),
        ...data,
        body_plain: stripMarkdown(body),
      };
      all.push(entry);
    }
  }
  return all;
}

/* ========== 生成 Excel ========== */

// 列定义
const COLUMNS = [
  { key: 'id',            label: 'id' },
  { key: 'pic',           label: 'pic' },
  { key: 'album',         label: 'album' },
  { key: 'artist',        label: 'artist' },
  { key: 'version',       label: 'version' },
  { key: 'release_date',  label: 'release date' },
  { key: 'status',        label: 'status' },
  { key: 'purchase_date', label: 'purchase date' },
  { key: 'purchase_from', label: 'purchase from' },
  { key: 'price',         label: 'price' },
  { key: 'rmb_price',     label: 'rmb_price' },
  { key: 'link',          label: 'link' },
  { key: 'content',       label: 'content' },
];

function main() {
  const started = Date.now();
  const entries = loadAll();

  const wb = XLSX.utils.book_new();

  // 1) 按类型分 Sheet
  for (const type of TYPES) {
    const items = entries.filter(e => e.type === type);
    if (items.length === 0) continue;

    const rows = items.map(entry => {
      const row = extractCommon(entry);
      // 状态转中文
      if (entry.status && STATUS_LABELS[entry.status]) {
        row.status = STATUS_LABELS[entry.status];
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map(c => c.key) });
    // 设置表头为中文标题
    XLSX.utils.sheet_add_aoa(ws, [COLUMNS.map(c => c.label)], { origin: 'A1' });

    // 列宽
    ws['!cols'] = [
      { wch: 32 }, // id
      { wch: 20 }, // pic
      { wch: 28 }, // album
      { wch: 18 }, // artist
      { wch: 24 }, // version
      { wch: 14 }, // release date
      { wch: 10 }, // status
      { wch: 14 }, // purchase date
      { wch: 18 }, // purchase from
      { wch: 12 }, // price
      { wch: 12 }, // rmb_price
      { wch: 36 }, // link
      { wch: 60 }, // content
    ];

    XLSX.utils.book_append_sheet(wb, ws, TYPE_LABELS[type] || type);
  }

  // 2) 全部汇总 Sheet
  const allRows = entries.map(entry => {
    const row = extractCommon(entry);
    row.type = TYPE_LABELS[entry.type] || entry.type;
    if (entry.status && STATUS_LABELS[entry.status]) {
      row.status = STATUS_LABELS[entry.status];
    }
    return row;
  });

  const allCols = [
    { key: 'type', label: '类型' },
    ...COLUMNS,
  ];

  const wsAll = XLSX.utils.json_to_sheet(allRows, { header: allCols.map(c => c.key) });
  XLSX.utils.sheet_add_aoa(wsAll, [allCols.map(c => c.label)], { origin: 'A1' });
  wsAll['!cols'] = [
    { wch: 8 },
    ...wsAll['!cols'] || [],
  ];
  // re-apply widths for all sheet
  wsAll['!cols'] = [
    { wch: 8 },   // type
    { wch: 32 },  // id
    { wch: 20 },  // pic
    { wch: 28 },  // album
    { wch: 18 },  // artist
    { wch: 24 },  // version
    { wch: 14 },  // release date
    { wch: 10 },  // status
    { wch: 14 },  // purchase date
    { wch: 18 },  // purchase from
    { wch: 12 },  // price
    { wch: 12 },  // rmb_price
    { wch: 36 },  // link
    { wch: 60 },  // content
  ];

  XLSX.utils.book_append_sheet(wb, wsAll, '全部');

  // 写入文件
  const outPath = path.join(ROOT, '馆藏导出.xlsx');
  XLSX.writeFile(wb, outPath);

  const elapsed = Date.now() - started;
  console.log(`✅ Excel 导出完成：${entries.length} 件馆藏，${wb.SheetNames.length} 个 Sheet，耗时 ${elapsed}ms`);
  console.log(`   输出：${outPath}`);
}

main();
