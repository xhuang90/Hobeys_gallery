<template>
  <div v-if="loaded && items.length">
    <!-- Hero -->
    <section class="detail-hero" :style="{ background: cfg.gradient }">
      <router-link :to="`/${type}`" class="crumb">← 返回{{ cfg.gallery }}</router-link>
      <template v-if="type === 'vinyl'">
        <h1 class="serif">{{ primary.title }}</h1>
        <div class="meta-line">
          <span>{{ primary.artist }}</span>
          <span v-if="allTags.length" class="tags">
            <span v-for="t in allTags" :key="t" class="tag">{{ t }}</span>
          </span>
        </div>
      </template>
      <template v-else>
        <div>
          <span v-if="primaryStatus" class="badge" :style="{ background: primaryStatus.color }">
            {{ primaryStatus.label }}
          </span>
        </div>
        <h1 class="serif">{{ primary.title }}</h1>
        <div class="meta-line">
          <span>{{ cardLine }}</span>
          <span v-if="primary.added">入库于 {{ primary.added }}</span>
          <span v-if="allTags.length" class="tags">
            <span v-for="t in allTags" :key="t" class="tag">{{ t }}</span>
          </span>
        </div>
      </template>
    </section>

    <!-- ====== Vinyl Detail: 唱片专用布局 ====== -->
    <div v-if="type === 'vinyl'" class="vinyl-detail-wrap">
      <!-- 封面 + 专辑信息 -->
      <div class="vinyl-cover-row">
        <div class="vinyl-cover-col">
          <div class="vinyl-cover-card">
            <img v-if="primary.cover" :src="primaryCoverUrl" :alt="primary.title" />
            <div v-else class="vinyl-cover-placeholder">
              <span>🎵</span>
            </div>
          </div>
          <div v-if="primary.rating" class="vinyl-rating">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= primary.rating }">★</span>
          </div>
          <!-- 曲目列表 -->
          <div v-if="selected.tracklist" class="vinyl-tracklist-side">
            <h3 class="section-title">🎵 曲目列表</h3>
            <div class="tracklist-body">
              <template v-if="tracklistDiscs.length > 1">
                <div v-for="(disc, di) in tracklistDiscs" :key="di" class="disc-group">
                  <div class="disc-label">💿 {{ disc.label }}</div>
                  <ol class="track-ol" :start="disc.tracks[0]?.num || 1">
                    <li v-for="(t, ti) in disc.tracks" :key="ti" class="track-item">
                      <span class="track-name">{{ t.title }}</span>
                      <span v-if="t.duration" class="track-duration">{{ t.duration }}</span>
                    </li>
                  </ol>
                </div>
              </template>
              <ol v-else class="track-ol" start="1">
                <li v-for="(t, ti) in flatTracks" :key="ti" class="track-item">
                  <span class="track-name">{{ t.title }}</span>
                  <span v-if="t.duration" class="track-duration">{{ t.duration }}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div class="vinyl-info-col">
          <!-- 专辑信息 + 简介 -->
          <div class="vinyl-info-card">
            <h2 class="vinyl-album-title">{{ primary.title }}</h2>
            <p v-if="primary.artist" class="vinyl-artist-name">{{ primary.artist }}</p>
            <div class="vinyl-info-grid">
              <div v-if="primary.label" class="info-item">
                <span class="info-label">唱片公司</span>
                <span class="info-value">{{ primary.label }}</span>
              </div>
              <div v-if="primary.release_date" class="info-item">
                <span class="info-label">发行日期</span>
                <span class="info-value">{{ primary.release_date }}</span>
              </div>
              <div v-if="primary.format || primary.pressing" class="info-item">
                <span class="info-label">介质</span>
                <span class="info-value">{{ [primary.format, primary.pressing].filter(Boolean).join(' · ') }}</span>
              </div>
            </div>
            <!-- 专辑简介 -->
            <div v-if="primary.description" class="vinyl-description-inline">
              <p>{{ primary.description }}</p>
            </div>
          </div>

          <!-- 版本收藏列表 -->
          <div v-if="items.length > 1" class="version-collection-card">
            <h3 class="version-collection-title">版本收藏 <span class="count-badge">{{ groupedVersions.length }}</span></h3>
            <div class="version-table">
              <div class="version-table-header">
                <span>版本</span>
                <span>价格</span>
                <span>渠道 / 时间</span>
              </div>
              <template v-for="group in groupedVersions" :key="group.key">
                <!-- 单张：直接显示 -->
                <div
                  v-if="group.count === 1"
                  class="version-table-row"
                  :class="{ selected: selectedIndex === group.firstIdx }"
                  @click="selectedIndex = group.firstIdx"
                >
                  <span class="col-version">{{ group.pressing }}</span>
                  <span class="col-price">{{ group.records[0].price || '-' }}<span v-if="group.records[0].rmb_price" class="rmb-ref"> / ¥{{ group.records[0].rmb_price }}</span></span>
                  <span class="col-meta">{{ [group.records[0].purchase_place, group.records[0].added].filter(Boolean).join(' · ') || '-' }}</span>
                </div>
                <!-- 多张：平铺展开每条记录 -->
                <template v-else>
                  <div class="version-table-row group-header" @click="selectedIndex = group.firstIdx">
                    <span class="col-version">{{ group.pressing }} <span class="multi-badge">×{{ group.count }}</span></span>
                    <span class="col-price"></span>
                    <span class="col-meta"></span>
                  </div>
                  <div
                    v-for="(rec, ri) in group.records"
                    :key="ri"
                    class="version-table-row sub-row"
                    :class="{ selected: items.findIndex(e => e.slug === rec.slug) === selectedIndex }"
                    @click="selectedIndex = items.findIndex(e => e.slug === rec.slug)"
                  >
                    <span class="col-version sub-label">└ 第{{ ri + 1 }}张</span>
                    <span class="col-price">{{ rec.price || '-' }}<span v-if="rec.rmb_price" class="rmb-ref"> / ¥{{ rec.rmb_price }}</span></span>
                    <span class="col-meta">{{ [rec.purchase_place, rec.added].filter(Boolean).join(' · ') || '-' }}</span>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Non-Vinyl: 其他类型保持原布局 ====== -->
    <template v-else>
      <!-- Multi-version view -->
      <div v-if="items.length > 1" class="detail-body">
        <aside>
          <div class="version-list">
            <h4 class="version-list-title">所有版本</h4>
            <div
              v-for="(item, i) in items"
              :key="i"
              class="version-item"
              :class="{ active: selectedIndex === i }"
              @click="selectedIndex = i"
            >
              <div class="version-item-head">
                <span v-if="item.pressing || item.format" class="version-name">{{ item.pressing || item.format }}</span>
                <span v-if="cfg.statuses[item.status]" class="badge badge-sm" :style="{ background: cfg.statuses[item.status].color }">
                  {{ cfg.statuses[item.status].label }}
                </span>
              </div>
              <div class="version-item-meta">
                <span v-if="item.price">{{ item.price }}</span>
                <span v-if="item.added">· {{ item.added }}</span>
              </div>
            </div>
          </div>
        </aside>
        <article class="prose">
          <div v-if="selected.cover" class="selected-cover">
            <img :src="selected.cover" :alt="selected.title" />
          </div>
          <table class="meta-table" style="margin-bottom: 24px;">
            <tr v-for="[key, label] in cfg.fields" :key="key">
              <template v-if="selected[key] !== undefined && selected[key] !== ''">
                <th>{{ label }}</th>
                <td>
                  <span v-if="key === 'status' && cfg.statuses[selected.status]" class="badge" :style="{ background: cfg.statuses[selected.status].color }">
                    {{ cfg.statuses[selected.status].label }}
                  </span>
                  <span v-else-if="key === 'rating'" class="stars">
                    {{ '★'.repeat(selected.rating) }}{{ '☆'.repeat(5 - selected.rating) }}
                  </span>
                  <a v-else-if="key === 'link'" :href="selected[key]" target="_blank" rel="noopener" style="color: var(--accent); word-break: break-all;">
                    {{ selected[key] }}
                  </a>
                  <span v-else>{{ selected[key] }}</span>
                </td>
              </template>
            </tr>
          </table>
          <div v-if="selected.body_html" v-html="selected.body_html"></div>
        </article>
      </div>

      <!-- Single entry view -->
      <div v-else class="detail-body">
        <aside>
          <table class="meta-table">
            <tr v-for="[key, label] in cfg.fields" :key="key">
              <template v-if="primary[key] !== undefined && primary[key] !== ''">
                <th>{{ label }}</th>
                <td>
                  <span v-if="key === 'status' && primaryStatus" class="badge" :style="{ background: primaryStatus.color }">
                    {{ primaryStatus.label }}
                  </span>
                  <span v-else-if="key === 'rating'" class="stars">
                    {{ '★'.repeat(primary.rating) }}{{ '☆'.repeat(5 - primary.rating) }}
                  </span>
                  <a v-else-if="key === 'link'" :href="primary[key]" target="_blank" rel="noopener" style="color: var(--accent); word-break: break-all;">
                    {{ primary[key] }}
                  </a>
                  <span v-else>{{ primary[key] }}</span>
                </td>
              </template>
            </tr>
          </table>
        </aside>
        <article class="prose" v-html="primary.body_html"></article>
      </div>
    </template>
  </div>
  <div v-else-if="loaded && !items.length" class="empty-state">
    <div class="icon">🤷</div>
    <p>找不到这件馆藏</p>
    <router-link to="/" style="color: var(--accent); margin-top: 12px; display: inline-block;">← 返回首页</router-link>
  </div>
  <div v-else class="empty-state">
    <div class="icon">⏳</div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { COLLECTIONS } from '../collections.js'
import { useEntries } from '../useEntries.js'

const route = useRoute()
const type = computed(() => route.params.type)
const slug = computed(() => decodeURIComponent(route.params.slug))
const cfg = computed(() => COLLECTIONS[type.value])
const { entries, loaded } = useEntries()

const selectedIndex = ref(0)

// Find matching entries: try exact slug first, then group match (vinyl)
const items = computed(() => {
  const all = entries.value.filter(e => e.type === type.value)

  // Exact slug match
  const exact = all.filter(e => e.slug === slug.value)
  if (exact.length) return exact

  // Group match: decode "title|||artist" key
  if (slug.value.includes('|||')) {
    const [title, artist] = slug.value.split('|||')
    return all.filter(e => e.title === title && (e.artist || '') === artist)
  }

  return []
})

const primary = computed(() => items.value[0] || {})
const selected = computed(() => items.value[selectedIndex.value] || primary.value)

const primaryStatus = computed(() =>
  cfg.value?.statuses?.[primary.value.status]
)

const cardLine = computed(() => {
  if (type.value === 'vinyl') return primary.value.artist || ''
  return cfg.value?.cardLine ? cfg.value.cardLine(primary.value) : ''
})

const allTags = computed(() => {
  const tags = new Set()
  items.value.forEach(e => (e.tags || []).forEach(t => tags.add(t)))
  return [...tags]
})

// 封面图路径处理
const primaryCoverUrl = computed(() => {
  const cover = primary.value.cover
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return cover.startsWith('/') ? cover : '/' + cover
})

watch(items, () => { selectedIndex.value = 0 })

// ---- Vinyl tracklist parsing ----

// Parse tracklist string into structured data
// Format: each line is "01. 曲名" or "01. 曲名 04:32"
// Disc separator: "=== CD 1 ===" or "# CD1" or just blank line separates discs
function parseTracklist(raw) {
  if (!raw) return []
  const discs = []
  let currentDisc = { label: 'CD 1', tracks: [] }
  const lines = raw.split('\n').filter(l => l.trim())

  for (const line of lines) {
    // Disc separator detection
    const discMatch = line.match(/^[=#\s]*(?:CD|DVD|Disc|碟)\s*(\d+|[A-Za-z]+)[=#\s]*/i)
    if (discMatch) {
      if (currentDisc.tracks.length > 0) discs.push(currentDisc)
      const discNum = discMatch[1]
      currentDisc = { label: isNaN(discNum) ? discNum : `CD ${discNum}`, tracks: [] }
      continue
    }

    // Track line: "01. 曲名" or "01. 曲名 04:32" or "01 曲名"
    const trackMatch = line.match(/^(\d+)[.\s、]\s*(.+?)(?:\s+(\d{1,2}:\d{2}(?:\.\d+)?))?\s*$/)
    if (trackMatch) {
      currentDisc.tracks.push({
        num: parseInt(trackMatch[1]),
        title: trackMatch[2].trim(),
        duration: trackMatch[3] || null,
      })
    }
  }
  if (currentDisc.tracks.length > 0) discs.push(currentDisc)
  return discs
}

const tracklistDiscs = computed(() => parseTracklist(selected.value.tracklist))
const flatTracks = computed(() => {
  const discs = tracklistDiscs.value
  if (discs.length === 0) return []
  return discs[0].tracks
})

// 版本合并：相同 pressing 的合并为一条，显示数量和各自的购买记录
const groupedVersions = computed(() => {
  const map = new Map()
  items.value.forEach((item, idx) => {
    const key = item.pressing || item.format || 'unknown'
    if (!map.has(key)) {
      map.set(key, { key, pressing: key, count: 0, records: [], firstIdx: idx })
    }
    const group = map.get(key)
    group.count++
    group.records.push(item)
  })
  return [...map.values()]
})
</script>

<style scoped>
/* ====== Vinyl Detail Layout ====== */
.vinyl-detail-wrap {
  padding: 32px 0 60px;
}

/* Cover + Info row */
.vinyl-cover-row {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
}
@media (max-width: 760px) {
  .vinyl-cover-row { flex-direction: column; align-items: center; }
}
.vinyl-cover-col {
  flex-shrink: 0;
  width: 300px;
}
@media (max-width: 760px) {
  .vinyl-cover-col { width: 240px; }
}
.vinyl-cover-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  background: #fff;
  aspect-ratio: 1;
}
.vinyl-cover-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.vinyl-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  background: linear-gradient(135deg, #5b4a6e, #322a40);
  opacity: 0.5;
}
.vinyl-rating {
  margin-top: 16px;
  text-align: center;
}
.vinyl-rating .star {
  font-size: 22px;
  color: #e0e0e0;
  letter-spacing: 4px;
}
.vinyl-rating .star.filled { color: #ffc107; }

/* Info col */
.vinyl-info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Album info card */
.vinyl-info-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 28px;
}
.vinyl-album-title {
  font-family: Georgia, "Songti SC", serif;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}
.vinyl-artist-name {
  font-size: 16px;
  color: var(--dim);
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}
.vinyl-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 640px) {
  .vinyl-info-grid { grid-template-columns: 1fr; }
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 11px;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

/* Version collection table */
.version-collection-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}
.version-collection-title {
  font-size: 14px;
  font-weight: 600;
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count-badge {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.version-table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr;
  gap: 12px;
  padding: 8px 20px;
  font-size: 11px;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--line);
  background: var(--hover-bg);
}
.version-table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr;
  gap: 12px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f5f5f5;
}
.version-table-row:last-child { border-bottom: none; }
.version-table-row:hover { background: var(--hover-bg); }
.version-table-row.selected {
  background: rgba(37, 99, 235, 0.05);
}
.col-version {
  font-weight: 500;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 6px;
}
.multi-badge {
  font-size: 10px;
  background: var(--accent);
  color: #fff;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
  line-height: 1.4;
}
.group-header {
  background: var(--hover-bg);
  font-weight: 500;
  border-bottom: none;
}
.col-price {
  color: #e8a33d;
  font-weight: 500;
}
.rmb-ref {
  color: var(--faint);
  font-weight: 400;
  font-size: 11px;
}
.col-meta {
  color: var(--dim);
  font-size: 12px;
}
.sub-row {
  background: rgba(37, 99, 235, 0.03);
}
.sub-label {
  padding-left: 12px;
  font-size: 12px;
  color: var(--faint);
  font-weight: 400;
}

/* Inline description inside info card */
.vinyl-description-inline {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}
.vinyl-description-inline p {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--dim);
}

/* Tracklist under cover (side column) */
.vinyl-tracklist-side {
  margin-top: 24px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
}
.section-title {
  font-family: Georgia, "Songti SC", serif;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--line);
}
.tracklist-body {
  max-height: 480px;
  overflow-y: auto;
}
.disc-group { margin-bottom: 20px; }
.disc-group:last-child { margin-bottom: 0; }
.disc-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 10px;
  padding: 6px 12px;
  background: rgba(37, 99, 235, 0.06);
  border-radius: 6px;
  display: inline-block;
}
.track-ol {
  list-style: none;
  counter-reset: track;
  padding: 0;
  margin: 0;
}
.track-item {
  display: flex;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13.5px;
}
.track-item:last-child { border-bottom: none; }
.track-item::before {
  counter-increment: track;
  content: counter(track, decimal-leading-zero);
  color: var(--faint);
  font-size: 12px;
  width: 32px;
  flex-shrink: 0;
  font-family: monospace;
}
.track-name { flex: 1; color: var(--ink); }
.track-duration {
  color: var(--faint);
  font-size: 12px;
  font-family: monospace;
  margin-left: 12px;
  flex-shrink: 0;
}

/* ---- Keep existing styles ---- */
.version-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.version-list-title {
  font-size: 13px;
  color: var(--faint);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.version-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.version-item:hover {
  background: var(--hover-bg);
}
.version-item.active {
  background: var(--card);
  border-color: var(--line);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.version-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.version-name {
  font-size: 13.5px;
  font-weight: 500;
}
.badge-sm {
  font-size: 10px;
  padding: 0 6px;
}
.version-item-meta {
  font-size: 12px;
  color: var(--faint);
  margin-top: 3px;
}
.selected-cover {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
}
.selected-cover img {
  width: 100%;
  display: block;
}
</style>
