<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <button class="sidebar-toggle" @click="collapsed = !collapsed">
      <span v-if="collapsed">☰</span>
      <span v-else>✕</span>
    </button>

    <div v-if="!collapsed" class="sidebar-content">
      <!-- LEGO: by series (theme) -->
      <template v-if="type === 'lego'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">系列</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: selected === 'all' }"
              @click="$emit('select', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ total }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: selected === group.key }"
              @click="$emit('select', group.key)"
            >
              <span class="sidebar-label">{{ group.key }}</span>
              <span class="sidebar-count">{{ group.count }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Vinyl: by format → artist -->
      <template v-if="type === 'vinyl'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">格式</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: selected === 'all' }"
              @click="$emit('select', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ total }}</span>
            </li>
            <li
              v-for="fmt in formatGroups"
              :key="fmt.key"
              class="sidebar-item sidebar-parent"
              :class="{ active: selected === fmt.key, expanded: expandedFormats.includes(fmt.key) }"
              @click="toggleFormat(fmt.key)"
            >
              <span class="sidebar-label">
                <span class="expand-icon">{{ expandedFormats.includes(fmt.key) ? '▾' : '▸' }}</span>
                {{ fmt.label }}
              </span>
              <span class="sidebar-count">{{ fmt.count }}</span>
            </li>
          </ul>
        </div>

        <!-- Second level: artist (when a format is selected) -->
        <div v-if="selectedFormat" class="sidebar-section sidebar-sub">
          <h4 class="sidebar-title">{{ formatGroups.find(f => f.key === selectedFormat)?.label }} · 歌手</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: selected === selectedFormat }"
              @click="$emit('select', selectedFormat)"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ currentArtistTotal }}</span>
            </li>
            <li
              v-for="artist in currentArtists"
              :key="artist.key"
              class="sidebar-item sidebar-child"
              :class="{ active: selected === artist.fullKey }"
              @click="$emit('select', artist.fullKey)"
            >
              <span class="sidebar-label">{{ artist.key }}</span>
              <span class="sidebar-count">{{ artist.count }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Books: by author -->
      <template v-if="type === 'books'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">作者</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: selected === 'all' }"
              @click="$emit('select', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ total }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: selected === group.key }"
              @click="$emit('select', group.key)"
            >
              <span class="sidebar-label">{{ group.key }}</span>
              <span class="sidebar-count">{{ group.count }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Movies: by director -->
      <template v-if="type === 'movies'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">导演</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: selected === 'all' }"
              @click="$emit('select', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ total }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: selected === group.key }"
              @click="$emit('select', group.key)"
            >
              <span class="sidebar-label">{{ group.key }}</span>
              <span class="sidebar-count">{{ group.count }}</span>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  type: String,
  entries: Array,
  selected: String,
})

const emit = defineEmits(['select'])
const collapsed = ref(false)
const expandedFormats = ref([])

const total = computed(() => props.entries.length)

// LEGO: group by theme
// Books: group by author
// Movies: group by director
const groups = computed(() => {
  const fieldMap = {
    lego: 'theme',
    books: 'author',
    movies: 'director',
  }
  const field = fieldMap[props.type]
  if (!field) return []

  const map = {}
  for (const e of props.entries) {
    const key = e[field] || '未知'
    if (!map[key]) map[key] = 0
    map[key]++
  }
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
})

// Vinyl: group by format
const formatGroups = computed(() => {
  if (props.type !== 'vinyl') return []
  const map = {}
  for (const e of props.entries) {
    const fmt = e.format || 'CD'
    // Normalize format
    let label = fmt
    if (fmt.includes('彩胶') || fmt.includes('LP') || fmt.includes('Vinyl')) label = '黑胶'
    else if (fmt.includes('Blu')) label = 'Blu-ray'
    else if (fmt.includes('DVD')) label = 'DVD'
    else if (fmt.includes('写真') || fmt.includes('寫真')) label = '写真'
    else label = 'CD'
    if (!map[label]) map[label] = { key: label, label, count: 0, entries: [] }
    map[label].count++
    map[label].entries.push(e)
  }
  return Object.values(map).sort((a, b) => {
    const order = { '黑胶': 0, 'CD': 1, 'DVD': 2, 'Blu-ray': 3, '写真': 4 }
    return (order[a.label] ?? 99) - (order[b.label] ?? 99)
  })
})

const selectedFormat = computed(() => {
  if (!props.selected || props.selected === 'all') return null
  // Check if it's a format key or format:::artist key
  if (props.selected.includes(':::')) return props.selected.split(':::')[0]
  // Check if it matches a format group
  if (formatGroups.value.find(f => f.key === props.selected)) return props.selected
  return null
})

const currentArtists = computed(() => {
  if (!selectedFormat.value) return []
  const fmt = formatGroups.value.find(f => f.key === selectedFormat.value)
  if (!fmt) return []
  const map = {}
  for (const e of fmt.entries) {
    const key = e.artist || '未知'
    if (!map[key]) map[key] = 0
    map[key]++
  }
  return Object.entries(map)
    .map(([key, count]) => ({ key, count, fullKey: `${selectedFormat.value}:::${key}` }))
    .sort((a, b) => b.count - a.count)
})

const currentArtistTotal = computed(() => {
  if (!selectedFormat.value) return 0
  const fmt = formatGroups.value.find(f => f.key === selectedFormat.value)
  return fmt ? fmt.count : 0
})

function toggleFormat(key) {
  const idx = expandedFormats.value.indexOf(key)
  if (idx >= 0) {
    expandedFormats.value.splice(idx, 1)
    // If this format was selected, deselect
    if (selectedFormat.value === key) {
      emit('select', 'all')
    }
  } else {
    expandedFormats.value = [key] // Only one expanded at a time
    emit('select', key)
  }
}

// Auto-expand the selected format
watch(() => props.selected, (val) => {
  if (val && val.includes(':::')) {
    expandedFormats.value = [val.split(':::')[0]]
  } else if (val && val !== 'all' && props.type === 'vinyl') {
    expandedFormats.value = [val]
  }
}, { immediate: true })
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid var(--line);
  padding: 16px 0;
  position: relative;
  transition: width 0.2s, min-width 0.2s;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
  position: sticky;
  top: 80px;
}

.sidebar.collapsed {
  width: 0;
  min-width: 0;
  padding: 0;
  border-right: none;
  overflow: hidden;
}

.sidebar-toggle {
  position: absolute;
  top: 0;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--faint);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.15s;
}
.sidebar-toggle:hover {
  background: var(--hover-bg);
  color: var(--ink);
}
.sidebar.collapsed .sidebar-toggle {
  right: -36px;
}

.sidebar-content {
  padding: 0 8px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-title {
  font-size: 11px;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 0 12px 8px;
  font-weight: 600;
}

.sidebar-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--dim);
  transition: all 0.12s;
  user-select: none;
}

.sidebar-item:hover {
  background: var(--hover-bg);
  color: var(--ink);
}

.sidebar-item.active {
  background: var(--ink);
  color: #fff;
}
.sidebar-item.active .sidebar-count {
  color: rgba(255,255,255,0.7);
}

.sidebar-label {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.sidebar-count {
  font-size: 12px;
  color: var(--faint);
  flex-shrink: 0;
  margin-left: 8px;
}

.expand-icon {
  font-size: 10px;
  width: 12px;
  display: inline-block;
  text-align: center;
}

.sidebar-sub {
  padding-left: 16px;
  border-left: 2px solid var(--line);
  margin-left: 12px;
}

.sidebar-child {
  padding-left: 20px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
