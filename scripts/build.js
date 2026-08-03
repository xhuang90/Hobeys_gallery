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
  unbuilt:  { label: '未拼搭', color: '#9b9b9b' },
  owned:    { label: '已收藏', color: '#2f7d4f' },
  read:     { label: '已读',   color: '#2f7d4f' },
  reading:  { label: '在读',   color: '#2b6cb0' },
  unread:   { label: '未读',   color: '#9b9b9b' },
  watched:  { label: '已看',   color: '#2f7d4f' },
  wishlist: { label: '想要',   color: '#d9730d' },
};

const COLLECTIONS = {
  lego: {
    name: '乐高', icon: '🧱', dir: 'lego',
    gallery: '乐高馆',
    gradient: 'linear-gradient(135deg, #e8a33d 0%, #cf6f2e 100%)',
    fields: [
      ['set_id', '套装编号'], ['theme', '系列'], ['year', '年份'],
      ['pieces', '零件数'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.set_id && `#${d.set_id}`, d.theme, d.pieces && `${d.pieces} pcs`].filter(Boolean).join(' · '),
  },
  vinyl: {
    name: '唱片', icon: '🎵', dir: 'vinyl',
    gallery: '唱片馆',
    gradient: 'linear-gradient(135deg, #5b4a6e 0%, #322a40 100%)',
    fields: [
      ['artist', '艺术家'], ['year', '发行年份'], ['label', '厂牌'],
      ['format', '格式'], ['pressing', '版本'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.artist, d.year].filter(Boolean).join(' · '),
  },
  books: {
    name: '书籍', icon: '📚', dir: 'books',
    gallery: '书籍馆',
    gradient: 'linear-gradient(135deg, #4a7c59 0%, #2f5d3f 100%)',
    fields: [
      ['author', '作者'], ['publisher', '出版社'], ['year', '出版年份'],
      ['isbn', 'ISBN'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.author, d.year].filter(Boolean).join(' · '),
  },
  movies: {
    name: '电影', icon: '🎬', dir: 'movies',
    gallery: '电影馆',
    gradient: 'linear-gradient(135deg, #3d5a80 0%, #263d5c 100%)',
    fields: [
      ['director', '导演'], ['year', '年份'], ['region', '地区'],
      ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.director, d.year].filter(Boolean).join(' · '),
  },
};

const HOME_GRADIENT = 'linear-gradient(120deg, #c23068 0%, #e0568b 55%, #ef8354 100%)';

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
    --bg: #fbfbfa; --card: #ffffff; --ink: #37352f; --dim: #787774; --faint: #9b9b9b;
    --accent: #c23068; --line: #e9e9e7; --radius: 8px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg); color: var(--ink);
    font-family: -apple-system, Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.65; -webkit-font-smoothing: antialiased;
  }
  .serif { font-family: Georgia, "Songti SC", "SimSun", serif; }
  a { color: inherit; text-decoration: none; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 32px; }

  header.site {
    border-bottom: 1px solid var(--line); background: rgba(251,251,250,.88);
    position: sticky; top: 0; backdrop-filter: blur(10px); z-index: 10;
  }
  header.site .wrap { display: flex; align-items: center; gap: 32px; height: 56px; }
  .brand { font-weight: 600; font-size: 15px; letter-spacing: .5px; color: var(--ink); white-space: nowrap; }
  nav { display: flex; gap: 4px; overflow-x: auto; }
  nav a { color: var(--dim); font-size: 13.5px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; }
  nav a:hover { background: #f1f1ef; color: var(--ink); }
  nav a.on { color: var(--accent); font-weight: 500; }

  /* ---------- 展馆封面（展厅门头） ---------- */
  .hero { margin: 28px 0 0; border-radius: 12px; padding: 56px 48px; color: #fff; position: relative; overflow: hidden; }
  .hero::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,.18), transparent 55%);
  }
  .hero .kicker { font-size: 13px; letter-spacing: 3px; opacity: .85; text-transform: uppercase; }
  .hero h1 { font-size: 44px; margin: 10px 0 12px; letter-spacing: -0.01em; position: relative; }
  .hero p { opacity: .92; max-width: 520px; font-size: 15px; }
  .hero .count { position: absolute; right: 48px; bottom: 40px; text-align: right; opacity: .9; }
  .hero .count .n { font-size: 40px; font-weight: 700; line-height: 1; }
  .hero .count .l { font-size: 12px; letter-spacing: 2px; }
  @media (max-width: 640px) { .hero { padding: 40px 28px; } .hero h1 { font-size: 32px; } .hero .count { display: none; } }

  /* ---------- 分馆入口 ---------- */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 28px 0 4px; }
  .stat {
    border-radius: 10px; padding: 22px 24px; color: #fff; display: flex; align-items: center; gap: 16px;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .stat:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(55,53,47,.16); }
  .stat .ic { font-size: 34px; filter: drop-shadow(0 2px 4px rgba(0,0,0,.15)); }
  .stat .n { font-size: 28px; font-weight: 700; line-height: 1.1; }
  .stat .l { font-size: 13px; opacity: .88; }

  /* ---------- 展区标题 ---------- */
  .sect { padding: 40px 0 4px; }
  .sect > h2 { font-size: 22px; margin-bottom: 4px; display: flex; align-items: baseline; gap: 12px; }
  .sect > .sub { color: var(--faint); font-size: 13px; margin-bottom: 18px; }

  /* ---------- 方块展品卡 ---------- */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(55,53,47,.10); }
  .cover {
    aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center;
    font-size: 56px; color: #fff; background-size: cover; background-position: center;
    text-shadow: 0 2px 8px rgba(0,0,0,.2);
  }
  .card .bd { padding: 14px 16px 16px; }
  .card h3 { font-size: 15px; font-weight: 600; margin-bottom: 3px; line-height: 1.45; }
  .card .sub { font-size: 12.5px; color: var(--dim); margin-bottom: 10px; }
  .card .row { display: flex; justify-content: space-between; align-items: center; }

  .badge { display: inline-block; font-size: 11.5px; border-radius: 4px; padding: 1px 8px; color: #fff; font-weight: 500; }
  .stars { color: #e8a33d; letter-spacing: 1.5px; font-size: 13px; }

  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { font-size: 11px; color: var(--dim); background: #f7f7f5; border: 1px solid var(--line); border-radius: 4px; padding: 1px 8px; }

  /* ---------- 详情页 ---------- */
  .detail-hero { margin: 28px 0 0; border-radius: 12px; padding: 40px 48px; color: #fff; position: relative; overflow: hidden; }
  .detail-hero::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,.15), transparent 55%);
  }
  .detail-hero .crumb { display: inline-block; font-size: 13px; color: #fff; margin-bottom: 14px; position: relative; z-index: 1; opacity: .9; }
  .detail-hero .crumb:hover { color: #fff; text-decoration: underline; }
  .detail-hero h1 { font-size: 36px; margin: 8px 0 10px; letter-spacing: -0.01em; }
  .detail-hero .meta-line { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13.5px; opacity: .92; }
  .detail-hero .tags .tag { color: rgba(255,255,255,.92); background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.25); }
  @media (max-width: 640px) { .detail-hero { padding: 28px; } .detail-hero h1 { font-size: 26px; } }

  .detail-body { display: grid; grid-template-columns: 280px 1fr; gap: 36px; padding: 32px 0 60px; }
  @media (max-width: 760px) { .detail-body { grid-template-columns: 1fr; } }
  table.meta { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; font-size: 13.5px; }
  table.meta th, table.meta td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--line); }
  table.meta tr:last-child th, table.meta tr:last-child td { border-bottom: none; }
  table.meta th { color: var(--faint); font-weight: 400; width: 42%; }
  .prose h2 { font-size: 18px; margin: 26px 0 10px; }
  .prose h3 { font-size: 15px; margin: 20px 0 8px; }
  .prose p { margin: 10px 0; font-size: 14.5px; }
  .prose ul { padding-left: 22px; margin: 10px 0; font-size: 14.5px; }
  .prose blockquote { border-left: 3px solid var(--accent); padding: 4px 16px; color: var(--dim); margin: 14px 0; background: var(--card); border-radius: 0 6px 6px 0; }
  .prose code { background: #f1f1ef; border-radius: 4px; padding: 1px 6px; font-size: 13px; }

  footer.site { border-top: 1px solid var(--line); margin-top: 48px; padding: 28px 0 40px; color: var(--faint); font-size: 12.5px; text-align: center; }
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
  <a class="brand" href="${root}index.html">🏛 我的收藏馆</a>
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
  /* cover 是相对于站点根的路径，需要根据卡片所在深度加 ../ 前缀 */
  const coverStyle = d.cover
    ? `background-image:url('${esc('../'.repeat(depth) + d.cover)}')`
    : `background:${cfg.gradient}`;
  const coverInner = d.cover ? '' : cfg.icon;
  return `<a class="card" href="${'../'.repeat(depth)}${cfg.dir}/${entry.slug}.html">
    <div class="cover" style="${coverStyle}">${coverInner}</div>
    <div class="bd">
      <h3>${esc(d.title || entry.slug)}</h3>
      <div class="sub">${esc(cfg.cardLine(d))}</div>
      <div class="row">${badge(d.status)}${stars(d.rating)}</div>
    </div>
  </a>`;
}

/* ================= 页面生成 ================= */

function pageHome(entries) {
  const stats = Object.entries(COLLECTIONS).map(([type, cfg]) => {
    const n = entries.filter(e => e.type === type).length;
    return `<a class="stat" href="${cfg.dir}/index.html" style="background:${cfg.gradient}">
      <span class="ic">${cfg.icon}</span>
      <span><span class="n">${n}</span><br><span class="l">${cfg.gallery}</span></span>
    </a>`;
  }).join('');

  const recent = entries.slice(0, 8).map(e => card(e, 0)).join('');

  return layout({
    title: '首页', active: 'home', depth: 0,
    content: `
      <section class="hero" style="background:${HOME_GRADIENT}">
        <div class="kicker">My Vault</div>
        <h1 class="serif">我的收藏馆</h1>
        <p>乐高、唱片、书籍、电影——那些构成我的物件们。每一件都有它的来历和故事。</p>
        <div class="count"><div class="n">${entries.length}</div><div class="l">件馆藏</div></div>
      </section>
      <section class="stats">${stats}</section>
      <section class="sect">
        <h2 class="serif">最近入库</h2>
        <div class="sub">最新收入囊中的 ${Math.min(8, entries.length)} 件</div>
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
      <section class="hero" style="background:${cfg.gradient}">
        <div class="kicker">${cfg.name} Gallery</div>
        <h1 class="serif">${cfg.icon} ${cfg.gallery}</h1>
        <div class="count"><div class="n">${mine.length}</div><div class="l">件馆藏</div></div>
      </section>
      <section class="sect" style="padding-top:28px">
        <div class="grid">${cards}</div>
      </section>`,
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
      <section class="detail-hero" style="background:${cfg.gradient}">
        <a class="crumb" href="index.html">← 返回${cfg.gallery}</a>
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

  /* 复制本地图片到 dist */
  const imgSrc = path.join(SRC, 'images');
  if (fs.existsSync(imgSrc)) {
    const imgDst = path.join(OUT, 'images');
    fs.mkdirSync(imgDst, { recursive: true });
    for (const f of fs.readdirSync(imgSrc)) {
      fs.copyFileSync(path.join(imgSrc, f), path.join(imgDst, f));
    }
  }

  /* 物理化中间态：全量数据 JSON，供未来小程序/Excel/任意投影复用 */
  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(
    entries.map(({ type, slug, data }) => ({ type, slug, ...data })), null, 2));

  console.log(`✅ 构建完成：${entries.length} 件馆藏，${pages} 个页面，耗时 ${Date.now() - started}ms`);
  console.log(`   输出目录：${OUT}`);
}

main();
