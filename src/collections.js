// 收藏类型配置 — 与 scripts/build.js 保持同步
export const COLLECTIONS = {
  lego: {
    name: '乐高',
    icon: '🧱',
    gallery: '乐高馆',
    gradient: 'linear-gradient(135deg, #e8a33d 0%, #cf6f2e 100%)',
    fields: [
      ['set_id', '套装编号'], ['theme', '系列'], ['year', '年份'],
      ['pieces', '零件数'], ['status', '状态'], ['rating', '喜爱度'],
      ['price', '价格'], ['purchase_place', '购买地点'],
      ['built_date', '拼搭日期'], ['dimensions', '尺寸'],
    ],
    cardLine: d => [d.set_id && `#${d.set_id}`, d.theme, d.pieces && `${d.pieces} pcs`].filter(Boolean).join(' · '),
    statuses: {
      built:    { label: '已拼搭', color: '#2f7d4f' },
      unbuilt:  { label: '未拼搭', color: '#9b9b9b' },
      wishlist: { label: '想要',   color: '#d9730d' },
    },
  },
  vinyl: {
    name: '唱片',
    icon: '🎵',
    gallery: '唱片馆',
    gradient: 'linear-gradient(135deg, #5b4a6e 0%, #322a40 100%)',
    fields: [
      ['artist', '艺术家'], ['year', '发行年份'], ['release_date', '发行日期'],
      ['label', '唱片公司'], ['format', '格式'], ['pressing', '版本'],
      ['status', '状态'], ['rating', '喜爱度'],
      ['price', '价格'], ['rmb_price', '人民币价格'], ['purchase_place', '购买渠道'],
      ['link', '链接'], ['note', '备注'],
    ],
    cardLine: d => [d.artist, d.pressing || d.format, d.year].filter(Boolean).join(' · '),
    statuses: {
      owned:    { label: '已收藏', color: '#2f7d4f' },
      wishlist: { label: '在路上', color: '#d9730d' },
    },
  },
  books: {
    name: '书籍',
    icon: '📚',
    gallery: '书籍馆',
    gradient: 'linear-gradient(135deg, #4a7c59 0%, #2f5d3f 100%)',
    fields: [
      ['author', '作者'], ['publisher', '出版社'], ['year', '出版年份'],
      ['isbn', 'ISBN'], ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.author, d.year].filter(Boolean).join(' · '),
    statuses: {
      read:     { label: '已读',   color: '#2f7d4f' },
      reading:  { label: '在读',   color: '#2b6cb0' },
      unread:   { label: '未读',   color: '#9b9b9b' },
      wishlist: { label: '想读',   color: '#d9730d' },
    },
  },
  movies: {
    name: '电影',
    icon: '🎬',
    gallery: '电影馆',
    gradient: 'linear-gradient(135deg, #3d5a80 0%, #263d5c 100%)',
    fields: [
      ['director', '导演'], ['year', '年份'], ['region', '地区'],
      ['status', '状态'], ['rating', '喜爱度'],
    ],
    cardLine: d => [d.director, d.year].filter(Boolean).join(' · '),
    statuses: {
      watched:  { label: '已看',   color: '#2f7d4f' },
      wishlist: { label: '想看',   color: '#d9730d' },
    },
  },
}

export const HOME_GRADIENT = 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)'

// 获取所有状态（用于全局筛选）
export function getAllStatuses() {
  const map = {}
  for (const [type, cfg] of Object.entries(COLLECTIONS)) {
    for (const [key, val] of Object.entries(cfg.statuses)) {
      if (!map[key]) map[key] = { ...val, types: [] }
      map[key].types.push(type)
    }
  }
  return map
}

// 获取指定类型的所有标签
export function getTags(entries, type) {
  const tags = new Set()
  entries.filter(e => e.type === type).forEach(e => {
    (e.tags || []).forEach(t => tags.add(t))
  })
  return [...tags].sort()
}
