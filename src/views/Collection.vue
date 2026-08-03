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
      <!-- Sidebar -->
      <Sidebar
        :type="type"
        :entries="myEntries"
        :selected="sidebarSelection"
        @select="onSidebarSelect"
      />

      <!-- Main content -->
      <div class="collection-main">
        <!-- Current filter indicator -->
        <div v-if="sidebarSelection !== 'all'" class="active-filter">
          <span class="filter-label">筛选：</span>
          <span class="filter-value">{{ filterDisplayLabel }}</span>
          <button class="filter-clear" @click="onSidebarSelect('all')">✕ 清除</button>
        </div>

        <!-- Filters -->
        <FilterBar
          :statuses="cfg.statuses"
          :tags="allTags"
          v-model:active-status="activeStatus"
          v-model:active-tags="activeTags"
          v-model:sort="sort"
          v-model:view="view"
        />

        <!-- Vinyl: grouped view (by album) -->
        <template v-if="type === 'vinyl'">
          <div class="grid">
            <div
              v-for="group in vinylGrouped"
              :key="group.key"
              class="card"
              @click="$router.push(`/${type}/${encodeURIComponent(group.key)}`)"
            >
              <div class="cover" :style="{ background: cfg.gradient }">
                <img v-if="group.cover" :src="group.cover" :alt="group.title" loading="lazy" />
                <span v-else>{{ cfg.icon }}</span>
                <div v-if="group.items.length > 1" class="card-count-badge">{{ group.items.length }}</div>
              </div>
              <div class="bd">
                <h3>{{ group.title }}</h3>
                <div class="sub">{{ group.artist }}</div>
                <div class="row">
                  <div class="version-tags">
                    <span
                      v-for="v in group.versions.slice(0, 3)"
                      :key="v"
                      class="tag"
                    >{{ v }}</span>
                    <span v-if="group.versions.length > 3" class="tag tag-more">+{{ group.versions.length - 3 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Other types: standard grid -->
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
                <img v-if="entry.cover" :src="entry.cover" :alt="entry.title" />
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
import FilterBar from '../components/FilterBar.vue'
import EntryCard from '../components/EntryCard.vue'
import Sidebar from '../components/Sidebar.vue'
import { COLLECTIONS, getTags } from '../collections.js'
import { useEntries } from '../useEntries.js'

const route = useRoute()
const type = computed(() => route.params.type)
const cfg = computed(() => COLLECTIONS[type.value])
const { entries, loaded } = useEntries()

const activeStatus = ref('')
const activeTags = ref([])
const sort = ref('date-desc')
const view = ref('grid')
const sidebarSelection = ref('all')

const myEntries = computed(() => entries.value.filter(e => e.type === type.value))
const allTags = computed(() => getTags(entries.value, type.value))

// Sidebar filtering
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
    // Format-level selection
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

const filterDisplayLabel = computed(() => {
  const sel = sidebarSelection.value
  if (sel === 'all') return ''
  if (sel.includes(':::')) {
    const [format, artist] = sel.split(':::')
    return `${format} · ${artist}`
  }
  return sel
})

// Apply status + tag filters on top of sidebar
const displayItems = computed(() => {
  let list = sidebarFiltered.value
  if (activeStatus.value) {
    list = list.filter(e => e.status === activeStatus.value)
  }
  if (activeTags.value.length) {
    list = list.filter(e => activeTags.value.some(t => (e.tags || []).includes(t)))
  }
  return list
})

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
        key,
        type: entry.type,
        title: entry.title,
        artist: entry.artist,
        slug: entry.slug,
        cover: entry.cover,
        items: [],
        versions: [],
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

function onSidebarSelect(key) {
  sidebarSelection.value = key
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
  margin-bottom: 12px;
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

.card-count-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  backdrop-filter: blur(4px);
}

.version-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-more {
  color: var(--accent) !important;
  border-color: var(--accent) !important;
  font-weight: 500;
}
</style>
