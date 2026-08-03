# 🏛 我的收藏馆 (Hobey's Gallery)

乐高 / 唱片 / 书籍 / 电影 —— 个人收藏库 + Vue 3 SPA。

**核心哲学：数据即主权。** `collections/**/*.md` 是唯一事实来源，
网页只是数据的一次投影。

## 技术栈

- **数据层**：Markdown + YAML frontmatter（纯文本，Git 版本控制）
- **前端**：Vue 3 + Vue Router + Vite
- **部署**：Cloudflare Pages（自动构建）

## 目录结构

```
myvault/
├── collections/          # ★ 数据层（真正重要的只有这里）
│   ├── lego/*.md         #   乐高，一件套装一个文件
│   ├── vinyl/*.md        #   唱片
│   ├── books/*.md        #   书籍
│   ├── movies/*.md       #   电影
│   └── images/           #   封面图片
├── src/                  # Vue 3 SPA
│   ├── views/            #   页面组件（Home / Collection / Detail）
│   ├── components/       #   可复用组件（NavBar / EntryCard / FilterBar）
│   ├── App.vue           #   根组件（含 Cmd+K 搜索）
│   ├── router.js         #   路由配置
│   ├── collections.js    #   收藏类型配置
│   └── useEntries.js     #   数据加载 composable
├── scripts/
│   └── build.js          # 数据构建器（Markdown → data.json）
├── public/               # 构建产物（data.json + images，gitignored）
└── vite.config.js        # Vite 配置
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（自动构建数据 + 启动 Vite）
npm run dev

# 构建生产版本
npm run build
```

## 日常流程

```bash
# 1. 建档（生成 frontmatter 骨架）
node scripts/new-entry.js lego 10305-lion-knights-castle "雄狮骑士城堡"

# 2. 编辑生成的 .md，填写字段和笔记

# 3. 发布（推送到 GitHub，Cloudflare Pages 自动部署）
git add -A && git commit -m "入藏: 雄狮骑士城堡" && git push
```

## 交互功能

- **Cmd+K / Ctrl+K**：全局搜索（Notion 同款）
- **筛选器**：按状态、标签过滤
- **排序**：按日期、评分、标题
- **视图切换**：网格 / 列表
- **页面过渡**：平滑动画
- **卡片悬停**：上浮 + 阴影 + 图片缩放

## 部署（Vercel）

由于 Vercel 构建环境 npm 兼容性问题，采用本地构建 + 上传的方式部署。

```bash
# 一键部署（构建 + 上传）
bash deploy.sh
```

部署后访问：https://hobeys-gallery.vercel.app

## Excel 导出

```bash
npm run export
```

生成 `馆藏导出.xlsx`，包含乐高/唱片/书籍/电影/全部 5 个 Sheet。

## 数据 Schema

通用字段：`title` `status` `rating`(1-5) `tags` `added`(入库日期) `cover`(封面图URL) `private`(true 则不发布)

| 类型 | 专有字段 | status 取值 |
|------|----------|-------------|
| lego | `set_id` `theme` `year` `pieces` | built / unbuilt / wishlist |
| vinyl | `artist` `year` `label` `format` `pressing` | owned / wishlist |
| books | `author` `publisher` `year` `isbn` | read / reading / unread / wishlist |
| movies | `director` `year` `region` | watched / wishlist |

## 路线图

- [ ] 元数据自动富化管线（Rebrickable / Discogs / TMDB / 豆瓣 API）
- [ ] 封面图本地化脚本
- [ ] 统计页（年度入库、评分分布、消费分析）
- [ ] CSV 导出（Excel 自由透视）
