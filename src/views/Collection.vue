<template>
  <div v-if="loaded && cfg">
    <!-- Hero -->
    <section class="hero" :style="{ background: cfg.gradient }">
      <div class="kicker">{{ cfg.name }} Gallery</div>
      <h1 class="serif">{{ cfg.icon }} {{ cfg.gallery }}</h1>
      <div class="count">
        <div class="n">{{ filtered.length }}</div>
        <div class="l">件馆藏</div>
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
      <EntryCard
        v-for="entry in filtered"
        :key="entry.slug"
        :entry="entry"
      />
    </div>

    <!-- List View -->
    <div v-else class="list">
      <div
        v-for="entry in filtered"
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

    <div v-if="filtered.length === 0" class="empty-state">
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
import EntryCard from '../components/EntryCard.vue'
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

const filtered = computed(() => {
  let list = myEntries.value

  if (activeStatus.value) {
    list = list.filter(e => e.status === activeStatus.value)
  }
  if (activeTags.value.length) {
    list = list.filter(e => activeTags.value.some(t => (e.tags || []).includes(t)))
  }

  const [key, dir] = sort.value.split('-')
  list = [...list].sort((a, b) => {
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
</script>
