<template>
  <div v-if="loaded && cfg" class="collection-layout">
    <!-- Hero -->
    <section class="hero" :style="{ background: cfg.gradient }">
      <div class="kicker">{{ cfg.name }} Gallery</div>
      <h1 class="serif">{{ cfg.icon }} {{ cfg.gallery }}</h1>
      <div class="count">
        <div class="n">{{ displayItems.length }}</div>
        <div class="l">件馆藏</div>
      </div>
    </section>

    <div class="collection-body">
      <!-- Sidebar: all filters + navigation -->
      <Sidebar
        :type="type"
        :entries="myEntries"
        :statuses="cfg.statuses"
        v-model:sidebar-selection="sidebarSelection"
        v-model:active-status="activeStatus"
        v-model:sort="sort"
        v-model:view="view"
      />

      <!-- Main content -->
      <div class="collection-main">
        <!-- Active filter indicator -->
        <div v-if="hasActiveFilter" class="active-filter">
          <span class="filter-label">当前筛选：</span>
          <span class="filter-value">{{ filterDisplayLabel }}</span>
          <button class="filter-clear" @click="clearAllFilters">✕ 清除全部</button>
        </div>

        <!-- Vinyl: grouped view (by album) -->
        <template v-if="type === 'vinyl'">
          <div class="grid">
            <div
              v-for="group in vinylGrouped"
              :key="group.key"
              class="vinyl-card"
              @click="$router.push(`/${type}/${encodeURIComponent(group.key)}`)"
            >
              <div class="vinyl-card-image">
                <img v-if="group.cover" :src="coverPath(group.cover)" :alt="group.title" loading="lazy" />
                <div v-else class="vinyl-placeholder">
                  <span>{{ cfg.icon }}</span>
                </div>
                <div v-if="group.items.length > 1" class="vinyl-count-badge">{{ group.items.length }} 版</div>
              </div>
              <div class="vinyl-card-body">
                <h3 class="vinyl-title">{{ group.title }}</h3>
                <div class="vinyl-artist">{{ group.artist }}</div>
                <div class="vinyl-footer">
                  <div class="version-tags">
                    <span
                      v-for="v in group.versions.slice(0, 2)"
                      :key="v"
                      class="version-tag"
                    >{{ v }}</span>
                    <span v-if="group.versions.length > 2" class="version-tag version-tag-more">+{{ group.versions.length - 2 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Other types: standard grid / list -->
        <template v-else>
          <div v-if="view === 'grid'" class="grid">
            <EntryCard
              v-for="entry in sortedEntries"
              :key="entry.slug"
              :entry="entry"
            />
          </div>
          <div v-else class="list">
            <div
              v-for="entry in sortedEntries"
              :key="entry.slug"
              class="list-item"
              @click="$router.push(`/${type}/${entry.slug}`)"
            >
              <div class="list-thumb">
                <img v-if="entry.cover" :src="coverPath(entry.cover)" :alt="entry.title" />
                <span v-else>{{ cfg.icon }}</span>
              </div>
              <div>
                <div class="list-title">{{ entry.title }}</div>
                <div class="list-sub">{{ cfg.cardLine(entry) }}</div>
              </div>
              <div class="list-meta">
                <span v-if="cfg.statuses[entry.status]" class="badge" :style="{ background: cfg.statuses[entry.status].color }">
                  {{ cfg.statuses[entry.status].label }}
                </span>
              </div>
              <div class="list-meta">
                <span v-if="entry.rating" class="stars">
                  {{ '★'.repeat(entry.rating) }}
                </span>
              </div>
              <div class="list-meta">{{ entry.added || '' }}</div>
            </div>
          </div>
        </template>

        <div v-if="displayItems.length === 0" class="empty-state">
          <div class="icon">🔍</div>
          <p>没有匹配的馆藏，试试调整筛选条件</p>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="icon">⏳</div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import EntryCard from '../components/EntryCard.vue'
import Sidebar from '../components/Sidebar.vue'
import { COLLECTIONS } from '../collections.js'
import { useEntries } from '../useEntries.js'

const route = useRoute()
const type = computed(() => route.params.type)
const cfg = computed(() => COLLECTIONS[type.value])
const { entries, loaded } = useEntries()

const activeStatus = ref('')
const sort = ref('date-desc')
const view = ref('grid')
const sidebarSelection = ref('all')

const myEntries = computed(() => entries.value.filter(e => e.type === type.value))

// 封面图路径处理：加上 BASE_URL 前缀
function coverPath(cover) {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return import.meta.env.BASE_URL + cover.replace(/^\//, '')
}

// Sidebar category filtering
const sidebarFiltered = computed(() => {
  const sel = sidebarSelection.value
  if (sel === 'all') return myEntries.value

  if (type.value === 'lego') {
    return myEntries.value.filter(e => (e.theme || '未知') === sel)
  }
  if (type.value === 'vinyl') {
    if (sel.includes(':::')) {
      const [format, artist] = sel.split(':::')
      return myEntries.value.filter(e => {
        const fmt = normalizeFormat(e.format || 'CD')
        return fmt === format && (e.artist || '未知') === artist
      })
    }
    return myEntries.value.filter(e => normalizeFormat(e.format || 'CD') === sel)
  }
  if (type.value === 'books') {
    return myEntries.value.filter(e => (e.author || '未知') === sel)
  }
  if (type.value === 'movies') {
    return myEntries.value.filter(e => (e.director || '未知') === sel)
  }
  return myEntries.value
})

function normalizeFormat(fmt) {
  if (fmt.includes('彩胶') || fmt.includes('LP') || fmt.includes('Vinyl')) return '黑胶'
  if (fmt.includes('Blu')) return 'Blu-ray'
  if (fmt.includes('DVD')) return 'DVD'
  if (fmt.includes('写真') || fmt.includes('寫真')) return '写真'
  return 'CD'
}

// Combine sidebar + status filters
const displayItems = computed(() => {
  let list = sidebarFiltered.value
  if (activeStatus.value) {
    list = list.filter(e => e.status === activeStatus.value)
  }
  return list
})

// Sort
const sortedEntries = computed(() => {
  let list = [...displayItems.value]
  const [key, dir] = sort.value.split('-')
  list.sort((a, b) => {
    let va, vb
    if (key === 'date') { va = a.added || ''; vb = b.added || '' }
    else if (key === 'rating') { va = a.rating || 0; vb = b.rating || 0 }
    else if (key === 'title') { va = a.title || ''; vb = b.title || '' }
    if (va < vb) return dir === 'asc' ? -1 : 1
    if (va > vb) return dir === 'asc' ? 1 : -1
    return 0
  })
  return list
})

// Vinyl grouped view
const vinylGrouped = computed(() => {
  const map = new Map()
  for (const entry of sortedEntries.value) {
    const key = `${entry.title}|||${entry.artist || ''}`
    if (!map.has(key)) {
      map.set(key, {
        key, type: entry.type, title: entry.title, artist: entry.artist,
        slug: entry.slug, cover: entry.cover, items: [], versions: [],
      })
    }
    const group = map.get(key)
    group.items.push(entry)
    if (!group.cover && entry.cover) group.cover = entry.cover
    const ver = entry.pressing || entry.format || entry.version
    if (ver && !group.versions.includes(ver)) group.versions.push(ver)
  }
  return [...map.values()]
})

// Filter display label
const hasActiveFilter = computed(() => {
  return activeStatus.value !== '' || sidebarSelection.value !== 'all'
})

const filterDisplayLabel = computed(() => {
  const parts = []
  if (activeStatus.value) {
    parts.push(cfg.value?.statuses?.[activeStatus.value]?.label || activeStatus.value)
  }
  if (sidebarSelection.value !== 'all') {
    if (sidebarSelection.value.includes(':::')) {
      const [format, artist] = sidebarSelection.value.split(':::')
      parts.push(`${format} · ${artist}`)
    } else {
      parts.push(sidebarSelection.value)
    }
  }
  return parts.join(' + ')
})

function clearAllFilters() {
  activeStatus.value = ''
  sidebarSelection.value = 'all'
}
</script>

<style scoped>
.collection-layout {
  width: 100%;
}

.collection-body {
  display: flex;
  gap: 24px;
  padding-top: 24px;
}

.collection-main {
  flex: 1;
  min-width: 0;
}

.active-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--hover-bg);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13.5px;
}

.filter-label {
  color: var(--faint);
}

.filter-value {
  font-weight: 500;
  color: var(--ink);
}

.filter-clear {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--faint);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
}
.filter-clear:hover {
  background: var(--line);
  color: var(--ink);
}

/* Vinyl card - borderless, clean style */
.vinyl-card {
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.vinyl-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.vinyl-card-image {
  position: relative;
  aspect-ratio: 1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
}

.vinyl-card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 16px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.vinyl-card:hover .vinyl-card-image img {
  transform: scale(1.15);
}

.vinyl-placeholder {
  font-size: 64px;
  opacity: 0.3;
}

.vinyl-count-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--accent);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}

.vinyl-card-body {
  padding: 16px;
}

.vinyl-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.vinyl-artist {
  font-size: 13px;
  color: var(--dim);
  margin-bottom: 12px;
}

.vinyl-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.version-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.version-tag {
  font-size: 11px;
  color: var(--dim);
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 4px;
}

.version-tag-more {
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  opacity: 0.7;
  font-weight: 500;
}
</style>
