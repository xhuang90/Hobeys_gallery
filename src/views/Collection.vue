<template>
  <div v-if="loaded && cfg">
    <!-- Hero -->
    <section class="hero" :style="{ background: cfg.gradient }">
      <div class="kicker">{{ cfg.name }} Gallery</div>
      <h1 class="serif">{{ cfg.icon }} {{ cfg.gallery }}</h1>
      <div class="count">
        <div class="n">{{ grouped.length }}</div>
        <div class="l">张专辑 · {{ filtered.length }} 件</div>
      </div>
    </section>

    <!-- Filters -->
    <FilterBar
      :statuses="cfg.statuses"
      :tags="allTags"
      v-model:active-status="activeStatus"
      v-model:active-tags="activeTags"
      v-model:sort="sort"
      v-model:view="view"
    />

    <!-- Grid View -->
    <div v-if="view === 'grid'" class="grid">
      <div
        v-for="group in grouped"
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
          <div class="sub">{{ cardLine(group) }}</div>
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

    <!-- List View -->
    <div v-else class="list">
      <div
        v-for="group in grouped"
        :key="group.key"
        class="list-item"
        @click="$router.push(`/${type}/${encodeURIComponent(group.key)}`)"
      >
        <div class="list-thumb">
          <img v-if="group.cover" :src="group.cover" :alt="group.title" />
          <span v-else>{{ cfg.icon }}</span>
        </div>
        <div>
          <div class="list-title">
            {{ group.title }}
            <span v-if="group.items.length > 1" class="count-badge">{{ group.items.length }} 版</span>
          </div>
          <div class="list-sub">{{ cardLine(group) }}</div>
        </div>
        <div class="list-meta">
          <div class="version-tags">
            <span v-for="v in group.versions.slice(0, 2)" :key="v" class="tag">{{ v }}</span>
            <span v-if="group.versions.length > 2" class="tag tag-more">+{{ group.versions.length - 2 }}</span>
          </div>
        </div>
        <div class="list-meta">
          <span v-if="group.bestRating" class="stars">
            {{ '★'.repeat(group.bestRating) }}
          </span>
        </div>
        <div class="list-meta">{{ group.latestAdded || '' }}</div>
      </div>
    </div>

    <div v-if="grouped.length === 0" class="empty-state">
      <div class="icon">🔍</div>
      <p>没有匹配的馆藏，试试调整筛选条件</p>
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

const myEntries = computed(() => entries.value.filter(e => e.type === type.value))
const allTags = computed(() => getTags(entries.value, type.value))

function cardLine(group) {
  // For vinyl: show artist
  if (type.value === 'vinyl') return group.artist || ''
  return cfg.value?.cardLine ? cfg.value.cardLine(group) : ''
}

const filtered = computed(() => {
  let list = myEntries.value

  if (activeStatus.value) {
    list = list.filter(e => e.status === activeStatus.value)
  }
  if (activeTags.value.length) {
    list = list.filter(e => activeTags.value.some(t => (e.tags || []).includes(t)))
  }

  return list
})

const grouped = computed(() => {
  const isVinyl = type.value === 'vinyl'
  const map = new Map()

  for (const entry of filtered.value) {
    // Group key: for vinyl, group by title+artist; for others, each entry is its own group
    const key = isVinyl
      ? `${entry.title}|||${entry.artist || ''}`
      : entry.slug

    if (!map.has(key)) {
      map.set(key, {
        key,
        type: entry.type,
        title: entry.title,
        artist: entry.artist,
        slug: entry.slug,
        cover: entry.cover,
        status: entry.status,
        rating: entry.rating,
        year: entry.year,
        added: entry.added,
        tags: entry.tags || [],
        items: [],
        versions: [],
        bestRating: 0,
        latestAdded: '',
      })
    }

    const group = map.get(key)
    group.items.push(entry)

    // Pick best cover (prefer entries with cover)
    if (!group.cover && entry.cover) group.cover = entry.cover

    // Collect versions (for vinyl: pressing field)
    const ver = entry.pressing || entry.format || entry.version
    if (ver && !group.versions.includes(ver)) group.versions.push(ver)

    // Track best rating
    if ((entry.rating || 0) > group.bestRating) group.bestRating = entry.rating

    // Track latest added
    if (!group.latestAdded || (entry.added || '') > group.latestAdded) {
      group.latestAdded = entry.added || ''
    }
  }

  let list = [...map.values()]

  // Sort
  const [key, dir] = sort.value.split('-')
  list.sort((a, b) => {
    let va, vb
    if (key === 'date') { va = a.latestAdded || ''; vb = b.latestAdded || '' }
    else if (key === 'rating') { va = a.bestRating || 0; vb = b.bestRating || 0 }
    else if (key === 'title') { va = a.title || ''; vb = b.title || '' }
    if (va < vb) return dir === 'asc' ? -1 : 1
    if (va > vb) return dir === 'asc' ? 1 : -1
    return 0
  })

  return list
})
</script>

<style scoped>
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
.count-badge {
  display: inline-block;
  font-size: 11px;
  background: var(--accent);
  color: #fff;
  border-radius: 4px;
  padding: 0 6px;
  margin-left: 6px;
  font-weight: 500;
  vertical-align: middle;
}
</style>
