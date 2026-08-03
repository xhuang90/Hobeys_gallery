<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <button class="sidebar-toggle" @click="collapsed = !collapsed">
      <span v-if="collapsed">☰</span>
      <span v-else>✕</span>
    </button>

    <div v-if="!collapsed" class="sidebar-content">
      <!-- ===== 状态筛选 ===== -->
      <div class="sidebar-section">
        <h4 class="sidebar-title">状态</h4>
        <ul class="sidebar-list">
          <li
            class="sidebar-item"
            :class="{ active: !activeStatus }"
            @click="$emit('update:activeStatus', '')"
          >
            <span class="sidebar-label">全部</span>
            <span class="sidebar-count">{{ entries.length }}</span>
          </li>
          <li
            v-for="(s, key) in statuses"
            :key="key"
            class="sidebar-item"
            :class="{ active: activeStatus === key }"
            @click="$emit('update:activeStatus', activeStatus === key ? '' : key)"
          >
            <span class="sidebar-label">
              <span class="status-dot" :style="{ background: s.color }"></span>
              {{ s.label }}
            </span>
            <span class="sidebar-count">{{ statusCounts[key] || 0 }}</span>
          </li>
        </ul>
      </div>

      <!-- ===== 分类导航 ===== -->
      <!-- LEGO: by series (theme) -->
      <template v-if="type === 'lego'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">系列</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: sidebarSelection === 'all' }"
              @click="$emit('update:sidebarSelection', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ entries.length }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: sidebarSelection === group.key }"
              @click="$emit('update:sidebarSelection', group.key)"
            >
              <span class="sidebar-label">{{ group.key }}</span>
              <span class="sidebar-count">{{ group.count }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Vinyl: by format → artist (nested tree) -->
      <template v-if="type === 'vinyl'">
        <div class="sidebar-section">
          <h4 class="sidebar-title">格式</h4>
          <ul class="sidebar-list">
            <li
              class="sidebar-item"
              :class="{ active: sidebarSelection === 'all' }"
              @click="$emit('update:sidebarSelection', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ entries.length }}</span>
            </li>
            <li v-for="fmt in formatGroups" :key="fmt.key" class="sidebar-tree-item">
              <div
                class="sidebar-item sidebar-parent"
                :class="{ active: sidebarSelection === fmt.key || sidebarSelection?.startsWith(fmt.key + ':::'), expanded: expandedFormats.includes(fmt.key) }"
                @click="toggleFormat(fmt.key)"
              >
                <span class="sidebar-label">
                  <span class="expand-icon">{{ expandedFormats.includes(fmt.key) ? '▾' : '▸' }}</span>
                  {{ fmt.label }}
                </span>
                <span class="sidebar-count">{{ fmt.count }}</span>
              </div>
              <transition name="slide-tree">
                <div v-if="expandedFormats.includes(fmt.key)" class="sidebar-subtree">
                  <div
                    class="sidebar-item sidebar-child"
                    :class="{ active: sidebarSelection === fmt.key }"
                    @click.stop="$emit('update:sidebarSelection', fmt.key)"
                  >
                    <span class="sidebar-label">全部{{ fmt.label }}</span>
                    <span class="sidebar-count">{{ fmt.count }}</span>
                  </div>
                  <div
                    v-for="artist in getArtistsForFormat(fmt.key)"
                    :key="artist.key"
                    class="sidebar-item sidebar-child"
                    :class="{ active: sidebarSelection === artist.fullKey }"
                    @click.stop="$emit('update:sidebarSelection', artist.fullKey)"
                  >
                    <span class="sidebar-label">{{ artist.key }}</span>
                    <span class="sidebar-count">{{ artist.count }}</span>
                  </div>
                </div>
              </transition>
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
              :class="{ active: sidebarSelection === 'all' }"
              @click="$emit('update:sidebarSelection', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ entries.length }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: sidebarSelection === group.key }"
              @click="$emit('update:sidebarSelection', group.key)"
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
              :class="{ active: sidebarSelection === 'all' }"
              @click="$emit('update:sidebarSelection', 'all')"
            >
              <span class="sidebar-label">全部</span>
              <span class="sidebar-count">{{ entries.length }}</span>
            </li>
            <li
              v-for="group in groups"
              :key="group.key"
              class="sidebar-item"
              :class="{ active: sidebarSelection === group.key }"
              @click="$emit('update:sidebarSelection', group.key)"
            >
              <span class="sidebar-label">{{ group.key }}</span>
              <span class="sidebar-count">{{ group.count }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- ===== 排序 ===== -->
      <div class="sidebar-section">
        <h4 class="sidebar-title">排序</h4>
        <ul class="sidebar-list">
          <li
            v-for="opt in sortOptions"
            :key="opt.value"
            class="sidebar-item"
            :class="{ active: sort === opt.value }"
            @click="$emit('update:sort', opt.value)"
          >
            <span class="sidebar-label">{{ opt.icon }} {{ opt.label }}</span>
          </li>
        </ul>
      </div>

      <!-- ===== 视图切换 ===== -->
      <div class="sidebar-section sidebar-view">
        <h4 class="sidebar-title">视图</h4>
        <div class="view-toggle">
          <button :class="{ active: view === 'grid' }" @click="$emit('update:view', 'grid')" title="网格">▦</button>
          <button :class="{ active: view === 'list' }" @click="$emit('update:view', 'list')" title="列表">☰</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  type: String,
  entries: Array,
  statuses: Object,
  sidebarSelection: String,
  activeStatus: String,
  sort: String,
  view: String,
})

const emit = defineEmits([
  'update:sidebarSelection',
  'update:activeStatus',
  'update:sort',
  'update:view',
])

const collapsed = ref(false)
const expandedFormats = ref([])

const sortOptions = [
  { value: 'date-desc', label: '最新入库', icon: '📅' },
  { value: 'date-asc', label: '最早入库', icon: '📆' },
  { value: 'rating-desc', label: '评分最高', icon: '⭐' },
  { value: 'title-asc', label: '标题 A→Z', icon: '🔤' },
]

// Status counts
const statusCounts = computed(() => {
  const map = {}
  for (const e of props.entries) {
    if (!map[e.status]) map[e.status] = 0
    map[e.status]++
  }
  return map
})

// Group by field (lego=theme, books=author, movies=director)
const groups = computed(() => {
  const fieldMap = { lego: 'theme', books: 'author', movies: 'director' }
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

// Vinyl: format groups
const formatGroups = computed(() => {
  if (props.type !== 'vinyl') return []
  const map = {}
  for (const e of props.entries) {
    const fmt = e.format || 'CD'
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

function getArtistsForFormat(formatKey) {
  const fmt = formatGroups.value.find(f => f.key === formatKey)
  if (!fmt) return []
  const map = {}
  for (const e of fmt.entries) {
    const key = e.artist || '未知'
    if (!map[key]) map[key] = 0
    map[key]++
  }
  return Object.entries(map)
    .map(([key, count]) => ({ key, count, fullKey: `${formatKey}:::${key}` }))
    .sort((a, b) => b.count - a.count)
}

function toggleFormat(key) {
  const idx = expandedFormats.value.indexOf(key)
  if (idx >= 0) {
    expandedFormats.value.splice(idx, 1)
    const sel = props.sidebarSelection
    if (sel === key || sel?.startsWith(key + ':::')) {
      emit('update:sidebarSelection', 'all')
    }
  } else {
    expandedFormats.value = [key]
    emit('update:sidebarSelection', key)
  }
}

watch(() => props.sidebarSelection, (val) => {
  if (val && val.includes(':::')) {
    expandedFormats.value = [val.split(':::')[0]]
  } else if (val && val !== 'all' && props.type === 'vinyl') {
    if (formatGroups.value.find(f => f.key === val)) {
      expandedFormats.value = [val]
    }
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
.sidebar-item.active .status-dot {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Nested tree */
.sidebar-tree-item {
  list-style: none;
}

.sidebar-subtree {
  padding-left: 16px;
  margin-left: 20px;
  border-left: 2px solid var(--line);
  padding-top: 2px;
  padding-bottom: 2px;
}

.sidebar-child {
  padding-left: 10px !important;
  font-size: 12.5px;
}

.sidebar-parent {
  font-weight: 500;
}

.sidebar-parent.expanded {
  background: var(--hover-bg);
  color: var(--ink);
  border-radius: 6px 6px 0 0;
}

.expand-icon {
  font-size: 10px;
  width: 12px;
  display: inline-block;
  text-align: center;
}

/* Slide transition */
.slide-tree-enter-active { transition: all 0.2s ease-out; }
.slide-tree-leave-active { transition: all 0.15s ease-in; }
.slide-tree-enter-from,
.slide-tree-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.slide-tree-enter-to,
.slide-tree-leave-from {
  opacity: 1;
  max-height: 500px;
  overflow: hidden;
}

/* View toggle */
.sidebar-view {
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.view-toggle {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  margin: 0 12px;
}
.view-toggle button {
  flex: 1;
  padding: 6px 10px;
  border: none;
  background: var(--card);
  color: var(--faint);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.view-toggle button.active {
  background: var(--ink);
  color: #fff;
}
.view-toggle button:hover:not(.active) { background: var(--hover-bg); }

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
