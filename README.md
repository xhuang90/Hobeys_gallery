# 🏛 Hobey's Gallery

乐高 / 唱片 / 书籍 / 电影 —— 个人收藏库 + Vue 3 SPA。

**核心哲学：数据即主权。** `collections/**/*.md` 是唯一事实来源，
网页只是数据的一次投影。

## 技术栈

- **数据层**：Markdown + YAML frontmatter（纯文本，Git 版本控制）
- **前端**：Vue 3 + Vue Router + Vite
- **部署**：GitHub Pages（国内可访问）+ Vercel（备用）

## 目录结构

```
Hobeys_gallery/
├── collections/          # ★ 数据层（真正重要的只有这里）
│   ├── lego/*.md         #   乐高，一件套装一个文件
│   ├── vinyl/*.md        #   唱片
│   ├── books/*.md        #   书籍
│   ├── movies/*.md       #   电影
│   └── images/           #   封面图片
├── src/                  # Vue 3 SPA
│   ├── views/            #   页面组件（Home / Collection / Detail / AddEntry）
│   ├── components/       #   可复用组件（NavBar / EntryCard / Sidebar）
│   ├── App.vue           #   根组件（含 Cmd+K 搜索）
│   ├── router.js         #   路由配置
│   ├── collections.js    #   收藏类型配置
│   └── useEntries.js     #   数据加载 composable
├── scripts/
│   ├── build.js          # 数据构建器（Markdown → data.json）
│   └── export-excel.js   # Excel 导出
├── docs/                 # 文档
│   ├── 使用指南.md
│   └── 部署指南.md
├── deploy.sh             # 一键部署脚本
├── public/               # 构建产物（data.json + images）
└── vite.config.js        # Vite 配置
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（自动构建数据 + 启动 Vite）
npm run dev
# 访问 http://127.0.0.1:3000

# 3. 构建生产版本
npm run build
```

## 新增藏品

### 方式一：网页表单（推荐）

打开网站 → 点击导航栏 **「➕ 新增」** → 填写表单 → 点击「生成并下载 Markdown 文件」

下载后把文件放到 `collections/对应类型/` 目录下，然后运行 `node scripts/build.js` 重新构建数据。

### 方式二：手动创建 Markdown 文件

直接在 `collections/` 对应目录下创建 `.md` 文件。

#### 文件命名规范

```
collections/lego/75313-ucs-at-at.md     # 乐高：编号-英文名.md
collections/vinyl/摩天动物园-台版.md     # 唱片：专辑名-版本.md
collections/books/活着.md                # 书籍：书名.md
collections/movies/interstellar.md       # 电影：英文片名.md（推荐英文 slug）
```

#### 乐高模板

```markdown
---
title: "UCS AT-AT 全地形装甲步行机"
set_id: "75313"
theme: "星球大战 UCS"
year: 2021
pieces: 6785
status: built
rating: 5
cover: images/lego-75313.jpg
tags: [星战, UCS, 镇宅]
added: 2026-03-15
price: "¥6999"
purchase_place: "乐高官方旗舰店"
---

## 拼搭笔记

在这里写你的拼搭体验...
```

#### 唱片模板

```markdown
---
title: "摩天动物园"
artist: "G.E.M 邓紫棋"
year: 2019
label: "索尼音乐"
format: "CD"
pressing: "台版正式版"
release_date: "2019-12-27"
status: owned
rating: 5
cover: images/album-mtian-dwy.jpg
tags: [流行, 创作]
added: 2020-01-04
price: "125"
rmb_price: 125.0
purchase_place: "Taobao-75"
description: "邓紫棋全创作专辑，以动物为隐喻..."
tracklist: |
  01. 摩天动物园
  02. Fly Away
  03. 透明
  04. 很久以后
  05. Walk on Water
  06. 萤火
  07. 灰狼
  08. 差不多姑娘
  09. 好想好想你
  10. 别勉强 (feat. 周兴哲)
  11. 多美丽
  12. 句号
  13. 依然睡公主
---

## 收藏笔记

台版正式版，封面质感很好...
```

> **注意**：同一个专辑的不同版本（台版/内地版、CD/LP 等）用相同的 `title` 和 `artist`，网页会自动分组展示。

#### 电影模板

```markdown
---
title: "星际穿越"
en_title: "Interstellar"
director: "克里斯托弗·诺兰"
writers: "乔纳森·诺兰 / 克里斯托弗·诺兰"
cast: "马修·麦康纳 / 安妮·海瑟薇 / 杰西卡·查斯坦"
genre: "剧情 / 科幻 / 冒险"
region: "美国"
year: 2014
release_date: "2014-11-12(中国大陆) / 2014-11-07(美国)"
duration: "169分钟"
imdb: "tt0816692"
status: watched
rating: 5
cover: images/movie-interstellar.png
tags: [科幻, 诺兰, 经典]
added: 2025-12-07
---

## hoho碎碎念

Do not go gentle into that good night.

库珀在五维空间里拨动书架的瞬间，是电影史上最美的物理学诗篇。

爱不是人类发明的，爱是宇宙的基本力。
```

> **封面图**：放在 `collections/images/` 下，命名格式 `movie-{slug}.png`

## 日常流程

```bash
# 1. 新增藏品（网页表单或手动创建 .md 文件）

# 2. 把 .md 文件放到 collections/ 对应目录

# 3. 重新构建数据
node scripts/build.js

# 4. 刷新浏览器即可看到

# 5. 提交代码
git add -A && git commit -m "入藏: xxx" && git push origin develop
```

## 部署

### GitHub Pages（推荐，国内可访问）

```bash
bash deploy.sh github
```

部署后访问：**https://xhuang90.github.io/Hobeys_gallery/**

### Vercel（备用）

```bash
bash deploy.sh vercel
```

## Excel 导出

```bash
npm run export
```

生成 `馆藏导出.xlsx`，包含乐高/唱片/书籍/电影/全部 5 个 Sheet。

## 交互功能

- **Cmd+K / Ctrl+K**：全局搜索
- **侧栏筛选**：乐高按系列/状态，唱片按格式/艺术家，电影按年份/类型
- **视图切换**：网格 / 列表
- **唱片多版本**：同专辑不同版本自动分组，版本收藏表可展开

## 数据 Schema 速查

### 通用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 标题（必填） |
| status | string | 状态（必填） |
| rating | number | 1-5 星 |
| cover | string | 封面图路径（相对于 collections/images/） |
| tags | array | 标签列表 |
| added | date | 入库日期 |
| year | number | 年份 |

### 类型专属字段

| 类型 | 字段 | status 取值 |
|------|------|-------------|
| lego | set_id, theme, pieces, price, purchase_place | built / unbuilt / wishlist |
| vinyl | artist, label, format, pressing, release_date, price, rmb_price, purchase_place, description, tracklist | owned / wishlist |
| books | author, publisher, isbn | read / reading / unread / wishlist |
| movies | en_title, director, writers, cast, genre, region, duration, imdb, release_date | watched / wishlist |

## 路线图

- [ ] 元数据自动富化管线（Rebrickable / Discogs / TMDB / 豆瓣 API）
- [ ] 统计页（年度入库、评分分布、消费分析）
