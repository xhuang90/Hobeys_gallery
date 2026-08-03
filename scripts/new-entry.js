#!/usr/bin/env node
/**
 * 快速建档：node scripts/new-entry.js <类型> <slug> [标题]
 *
 * 示例：
 *   node scripts/new-entry.js lego 10305-lion-knights-castle "雄狮骑士城堡"
 *   node scripts/new-entry.js vinyl ok-computer "OK Computer"
 *
 * 生成一份带 frontmatter 骨架的 Markdown，填完字段后重新 build 即可。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TEMPLATES = {
  lego:   ['title: ', 'set_id: ', 'theme: ', 'year: ', 'pieces: ', 'status: built', 'rating: ', 'tags: []'],
  vinyl:  ['title: ', 'artist: ', 'year: ', 'label: ', 'format: LP 12寸', 'pressing: ', 'status: owned', 'rating: ', 'tags: []'],
  books:  ['title: ', 'author: ', 'publisher: ', 'year: ', 'isbn: ', 'status: unread', 'rating: ', 'tags: []'],
  movies: ['title: ', 'director: ', 'year: ', 'region: ', 'status: watched', 'rating: ', 'tags: []'],
};

const [,, type, slug, ...rest] = process.argv;

if (!type || !slug || !TEMPLATES[type]) {
  console.error('用法: node scripts/new-entry.js <lego|vinyl|books|movies> <slug> [标题]');
  process.exit(1);
}

const title = rest.join(' ') || slug;
const today = new Date().toISOString().slice(0, 10);
const lines = TEMPLATES[type].map(l => (l === 'title: ' ? `title: ${title}` : l));
lines.push(`added: ${today}`);

const file = path.join(ROOT, 'collections', type, `${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`❌ 已存在: ${file}`);
  process.exit(1);
}

fs.writeFileSync(file, `---\n${lines.join('\n')}\n---\n\n## 笔记\n\n（在这里记录它的故事）\n`);
console.log(`✅ 已建档: ${file}`);
console.log('   编辑字段后运行 npm run build 更新网站');
