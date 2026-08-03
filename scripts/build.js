#!/usr/bin/env node
/**
 * myvault build — 零依赖静态站点生成器
 *
 * 设计原则：
 *   1. collections/**\/*.md 是唯一事实来源（source of truth）
 *   2. dist/ 只是数据的一次"投影"，可随时删除重建
 *   3. 零 npm 依赖，整个构建器不到 400 行，完全透明可读
 *   4. private: true 的条目不进入任何输出
 *
 * 用法：node scripts/build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'collections');
const OUT = path.join(ROOT, 'dist');

/* ================= 收藏类型配置 ================= */

const STATUS = {
  built:    { label: '已拼搭', color: '#2f7d4f' },
  unbuilt:  { label: '未拼搭', color: '#8a8577' },
  owned:    { label: '已收藏', color: '#2f7d4f' },
  read:     { label: '已读',   color: '#2f7d4f' },
  reading:  { label: '在读',   color: '#2b6cb0' },
  unread:   { label: '未读',   color: '#8a8577' },
  watched:  { label: '已看',   color: '#2f7d4f' },
  wishlist: { label: '想要',   color: '#c05621' },
};

const COLLECTIONS = {
  lego: {
    name: '乐高', icon: '🧱', dir: 'lego',
    fields: [
      ['set_id', '套装编号'], ['theme', '系列'], ['year', '年份'],
      ['pieces', '零件数'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.set_id && `#${d.set_id}`, d.theme, d.pieces && `${d.pieces} pcs`].filter(Boolean).join(' · '),
  },
  vinyl: {
    name: '唱片', icon: '🎵', dir: 'vinyl',
    fields: [
      ['artist', '艺术家'], ['year', '发行年份'], ['label', '厂牌'],
      ['format', '格式'], ['pressing', '版本'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.artist, d.year].filter(Boolean).join(' · '),
  },
  books: {
    name: '书籍', icon: '📚', dir: 'books',
    fields: [
      ['author', '作者'], ['publisher', '出版社'], ['year', '出版年份'],
      ['isbn', 'ISBN'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.author, d.year].filter(Boolean).join(' · '),
  },
  movies: {
    name: '电影', icon: '🎬', dir: 'movies',
    fields: [
      ['director', '导演'], ['year', '年份'], ['region', '地区'],
      ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.director, d.year].filter(Boolean).join(' · '),
  },
};

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

/* 极简 Markdown 渲染（标题/列表/引用/粗斜体/链接/行内代码） */
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

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ================= 数据加载 ================= */

function loadAll() {
  const all = [];
  for (const [type, cfg] of Object.entries(COLLECTIONS)) {
    const dir = path.join(SRC, cfg.dir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = parseFrontmatter(raw);
      if (String(data.private) === 'true') continue;
      all.push({ type, slug: file.replace(/\.md$/, ''), data, body });
    }
  }
  all.sort((a, b) => String(b.data.added || '').localeCompare(String(a.data.added || '')));
  return all;
}

/* ================= 模板层 ================= */

const CSS = `
  :root {
    --bg: #faf7f2; --card: #ffffff; --ink: #2b2622; --dim: #8a8577;
    --accent: #b4552d; --line: #e8e2d8; --radius: 14px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg); color: var(--ink);
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.7; -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, .serif { font-family: Georgia, "Songti SC", "SimSun", serif; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

  header.site {
    border-bottom: 1px solid var(--line); background: rgba(250,247,242,.92);
    position: sticky; top: 0; backdrop-filter: blur(8px); z-index: 10;
  }
  header.site .wrap { display: flex; align-items: center; gap: 28px; height: 60px; }
  .brand { font-weight: 700; font-size: 18px; letter-spacing: 1px; color: var(--ink); }
  .brand:hover { text-decoration: none; }
  nav { display: flex; gap: 20px; }
  nav a { color: var(--dim); font-size: 14px; }
  nav a.on, nav a:hover { color: var(--accent); text-decoration: none; }

  .hero { padding: 72px 0 40px; }
  .hero h1 { font-size: 42px; margin-bottom: 12px; }
  .hero p { color: var(--dim); max-width: 560px; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 24px 0 8px; }
  .stat {
    background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
    padding: 20px 22px; display: flex; align-items: center; gap: 14px;
    transition: transform .15s, box-shadow .15s;
  }
  .stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(43,38,34,.08); text-decoration: none; }
  .stat .ic { font-size: 30px; }
  .stat .n { font-size: 26px; font-weight: 700; line-height: 1.1; }
  .stat .l { color: var(--dim); font-size: 13px; }

  .sect { padding: 40px 0 8px; }
  .sect > h2 { font-size: 24px; margin-bottom: 18px; display: flex; align-items: baseline; gap: 10px; }
  .sect > h2 .more { font-size: 13px; color: var(--dim); font-family: -apple-system, "PingFang SC", sans-serif; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column; color: var(--ink);
    transition: transform .15s, box-shadow .15s;
  }
  .card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(43,38,34,.10); text-decoration: none; }
  .cover {
    height: 120px; display: flex; align-items: center; justify-content: center;
    font-size: 44px; background: linear-gradient(135deg, #efe7da, #e3d5bf);
  }
  .card .bd { padding: 14px 16px 16px; }
  .card h3 { font-size: 16px; margin-bottom: 4px; line-height: 1.4; }
  .card .sub { font-size: 12.5px; color: var(--dim); margin-bottom: 8px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { font-size: 11px; color: var(--dim); background: var(--bg); border: 1px solid var(--line); border-radius: 999px; padding: 1px 9px; }

  .badge { display: inline-block; font-size: 12px; border-radius: 999px; padding: 2px 10px; color: #fff; }
  .stars { color: #d97706; letter-spacing: 2px; }

  .detail-head { padding: 48px 0 24px; border-bottom: 1px solid var(--line); }
  .crumb { font-size: 13px; color: var(--dim); margin-bottom: 16px; display: inline-block; }
  .detail-head h1 { font-size: 34px; margin: 6px 0 10px; }
  .meta-line { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; color: var(--dim); font-size: 14px; }

  .detail-body { display: grid; grid-template-columns: 280px 1fr; gap: 36px; padding: 32px 0 60px; }
  @media (max-width: 760px) { .detail-body { grid-template-columns: 1fr; } }
  table.meta { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; font-size: 14px; }
  table.meta th, table.meta td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--line); }
  table.meta tr:last-child th, table.meta tr:last-child td { border-bottom: none; }
  table.meta th { color: var(--dim); font-weight: 400; width: 42%; }
  .prose h2 { font-size: 20px; margin: 26px 0 10px; }
  .prose h3 { font-size: 16px; margin: 20px 0 8px; }
  .prose p { margin: 10px 0; }
  .prose ul { padding-left: 22px; margin: 10px 0; }
  .prose blockquote { border-left: 3px solid var(--accent); padding: 4px 16px; color: var(--dim); margin: 14px 0; background: var(--card); border-radius: 0 8px 8px 0; }
  .prose code { background: #f0ebe1; border-radius: 5px; padding: 1px 6px; font-size: 13px; }

  footer.site { border-top: 1px solid var(--line); margin-top: 40px; padding: 28px 0 40px; color: var(--dim); font-size: 13px; text-align: center; }
`;

function nav(active) {
  const items = [['index.html', '首页', 'home']];
  for (const [type, cfg] of Object.entries(COLLECTIONS)) {
    items.push([`${cfg.dir}/index.html`, `${cfg.icon} ${cfg.name}`, type]);
  }
  return items.map(([href, label, key]) => {
    const prefix = active === 'home' || COLLECTIONS[active] ? (COLLECTIONS[active] ? '../' : '') : '';
    return `<a href="${prefix}${href}"${key === active ? ' class="on"' : ''}>${label}</a>`;
  }).join('');
}

function layout({ title, active, depth, content }) {
  const root = depth > 0 ? '../'.repeat(depth) : '';
  const navItems = [['index.html', '首页', 'home'],
    ...Object.entries(COLLECTIONS).map(([t, c]) => [`${c.dir}/index.html`, `${c.icon} ${c.name}`, t])];
  const navHtml = navItems.map(([href, label, key]) =>
    `<a href="${root}${href}"${key === active ? ' class="on"' : ''}>${label}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} · 我的收藏馆</title>
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand serif" href="${root}index.html">🏛 我的收藏馆</a>
  <nav>${navHtml}</nav>
</div></header>
<main class="wrap">${content}</main>
<footer class="site"><div class="wrap">
  数据存于 Git · 由 400 行零依赖 Node.js 脚本生成 · © ${new Date().getFullYear()}
</div></footer>
</body>
</html>`;
}

function badge(status) {
  const s = STATUS[status];
  return s ? `<span class="badge" style="background:${s.color}">${s.label}</span>` : '';
}

function stars(r) {
  const n = Number(r) || 0;
  return n > 0 ? `<span class="stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '';
}

function card(entry, depth) {
  const cfg = COLLECTIONS[entry.type];
  const d = entry.data;
  const cover = d.cover
    ? `<div class="cover" style="background-image:url('${esc(d.cover)}');background-size:cover;background-position:center"></div>`
    : `<div class="cover">${cfg.icon}</div>`;
  const tags = (d.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  return `<a class="card" href="${'../'.repeat(depth)}${cfg.dir}/${entry.slug}.html">
    ${cover}
    <div class="bd">
      <h3 class="serif">${esc(d.title || entry.slug)}</h3>
      <div class="sub">${esc(cfg.cardLine(d))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        ${badge(d.status)}${stars(d.rating)}
      </div>
      ${tags ? `<div class="tags">${tags}</div>` : ''}
    </div>
  </a>`;
}

/* ================= 页面生成 ================= */

function pageHome(entries) {
  const stats = Object.entries(COLLECTIONS).map(([type, cfg]) => {
    const n = entries.filter(e => e.type === type).length;
    return `<a class="stat" href="${cfg.dir}/index.html">
      <span class="ic">${cfg.icon}</span>
      <span><span class="n">${n}</span><br><span class="l">${cfg.name}馆藏</span></span>
    </a>`;
  }).join('');

  const recent = entries.slice(0, 8).map(e => card(e, 0)).join('');

  return layout({
    title: '首页', active: 'home', depth: 0,
    content: `
      <section class="hero">
        <h1 class="serif">我的收藏馆</h1>
        <p>乐高、唱片、书籍、电影——那些构成我的物件们。每一件都有它的来历和故事。</p>
      </section>
      <section class="stats">${stats}</section>
      <section class="sect">
        <h2 class="serif">最近入库</h2>
        <div class="grid">${recent}</div>
      </section>`,
  });
}

function pageCollection(type, entries) {
  const cfg = COLLECTIONS[type];
  const mine = entries.filter(e => e.type === type);
  const cards = mine.map(e => card(e, 1)).join('');
  return layout({
    title: cfg.name, active: type, depth: 1,
    content: `
      <section class="hero" style="padding-bottom:24px">
        <h1 class="serif">${cfg.icon} ${cfg.name}</h1>
        <p>共 ${mine.length} 件馆藏</p>
      </section>
      <div class="grid">${cards}</div>`,
  });
}

function pageDetail(entry) {
  const cfg = COLLECTIONS[entry.type];
  const d = entry.data;
  const rows = cfg.fields
    .filter(([k]) => d[k] !== undefined && d[k] !== '')
    .map(([k, label]) => {
      let v;
      if (k === 'status') v = badge(d.status);
      else if (k === 'rating') v = stars(d.rating);
      else v = esc(d[k]);
      return `<tr><th>${label}</th><td>${v}</td></tr>`;
    }).join('');
  const tags = (d.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

  return layout({
    title: d.title || entry.slug, active: entry.type, depth: 2,
    content: `
      <section class="detail-head">
        <a class="crumb" href="index.html">← 返回${cfg.name}</a>
        <div>${badge(d.status)}</div>
        <h1 class="serif">${esc(d.title || entry.slug)}</h1>
        <div class="meta-line">
          <span>${esc(cfg.cardLine(d))}</span>
          ${d.added ? `<span>入库于 ${esc(d.added)}</span>` : ''}
          ${tags ? `<span class="tags">${tags}</span>` : ''}
        </div>
      </section>
      <div class="detail-body">
        <aside><table class="meta">${rows}</table></aside>
        <article class="prose">${md(entry.body)}</article>
      </div>`,
  });
}

/* ================= 构建 ================= */

function main() {
  const started = Date.now();
  const entries = loadAll();

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const write = (rel, html) => {
    const p = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, html);
  };

  write('index.html', pageHome(entries));

  let pages = 1;
  for (const type of Object.keys(COLLECTIONS)) {
    write(`${COLLECTIONS[type].dir}/index.html`, pageCollection(type, entries));
    pages++;
    for (const e of entries.filter(x => x.type === type)) {
      write(`${COLLECTIONS[type].dir}/${e.slug}.html`, pageDetail(e));
      pages++;
    }
  }

  /* 物理化中间态：全量数据 JSON，供未来小程序/Excel/任意投影复用 */
  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(
    entries.map(({ type, slug, data }) => ({ type, slug, ...data })), null, 2));

  console.log(`✅ 构建完成：${entries.length} 件馆藏，${pages} 个页面，耗时 ${Date.now() - started}ms`);
  console.log(`   输出目录：${OUT}`);
}

main();
