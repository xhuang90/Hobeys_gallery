# 🏛 我的收藏馆 (myvault)

乐高 / 唱片 / 书籍 / 电影 —— 个人收藏库 + 静态博客网站。

**核心哲学：数据即主权。** `collections/**/*.md` 是唯一事实来源，
`dist/` 网页只是数据的一次投影，随时可以删除重建、换皮、换平台。

## 目录结构

```
myvault/
├── collections/          # ★ 数据层（真正重要的只有这里）
│   ├── lego/*.md         #   乐高，一件套装一个文件
│   ├── vinyl/*.md        #   唱片
│   ├── books/*.md        #   书籍
│   └── movies/*.md       #   电影
├── scripts/
│   ├── build.js          # 静态站点生成器（零依赖，~400 行，完全透明）
│   └── new-entry.js      # 快速建档脚手架
├── dist/                 # 生成的网站（投影，可随时重建）
└── docs/                 # 设计文档
```

## 日常流程

```bash
# 1. 建档（生成 frontmatter 骨架）
node scripts/new-entry.js lego 10305-lion-knights-castle "雄狮骑士城堡"

# 2. 编辑生成的 .md，填写字段和笔记

# 3. 构建网站
npm run build          # 或者 node scripts/build.js

# 4. 本地预览
cd dist && python3 -m http.server 8899

# 5. 发布（接入 Cloudflare Pages 后，这一步就是全部）
git add -A && git commit -m "入藏: 雄狮骑士城堡" && git push
```

也可以直接把藏品信息发给我的 AI 管家，让它建档 + 构建 + 推送。

## 数据 Schema（frontmatter）

通用字段：`title` `status` `rating`(1-5) `tags` `added`(入库日期) `cover`(封面图URL，可选) `private`(true 则不发布)

| 类型 | 专有字段 | status 取值 |
|------|----------|-------------|
| lego | `set_id` `theme` `year` `pieces` | built / unbuilt / wishlist |
| vinyl | `artist` `year` `label` `format` `pressing` | owned / wishlist |
| books | `author` `publisher` `year` `isbn` | read / reading / unread / wishlist |
| movies | `director` `year` `region` | watched / wishlist |

字段可以自由扩展——构建器只渲染 `COLLECTIONS` 配置里声明的字段，
多写的字段会原样进入 `dist/data.json`（全量数据导出）。

## 部署（一次性 10 分钟）

1. 在 GitHub 创建仓库并 push
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com) → 连接该仓库
3. 构建设置：Build command = `node scripts/build.js`，Output = `dist`
4. 完成。以后每次 `git push`，一分钟后网站自动更新

## 路线图

- [ ] 元数据自动富化管线（Rebrickable / Discogs / TMDB / 豆瓣，报编号自动补全）
- [ ] 封面图本地化（cover 字段已支持，加下载脚本）
- [ ] 统计页（年度入库、评分分布、消费分析）
- [ ] 搜索（构建期生成索引，纯前端检索）
- [ ] CSV 导出（Excel 自由透视）
- [ ] 小程序（复用 data.json 作为 API）
