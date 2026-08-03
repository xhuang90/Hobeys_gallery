<template>
  <NavBar @open-search="searchOpen = true" @export="handleExport" />
  <main class="wrap">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </transition>
    </router-view>
  </main>
  <footer class="site-footer">
    <div class="wrap">数据存于 Git · Vue 3 SPA · © {{ new Date().getFullYear() }}</div>
  </footer>

  <!-- Cmd+K Search Overlay -->
  <transition name="fade">
    <div v-if="searchOpen" class="search-overlay" @click.self="searchOpen = false">
      <div class="search-panel">
        <div class="search-input-wrap">
          <span class="icon">🔍</span>
          <input
            ref="searchInput"
            v-model="searchQuery"
            placeholder="搜索所有馆藏..."
            @keydown.escape="searchOpen = false"
            @keydown.enter="goToResult"
            @keydown.arrow-down.prevent="moveResult(1)"
            @keydown.arrow-up.prevent="moveResult(-1)"
          />
          <kbd @click="searchOpen = false">ESC</kbd>
        </div>
        <div class="search-results">
          <div v-if="!searchQuery" class="search-empty">输入关键词搜索所有馆藏</div>
          <div v-else-if="searchResults.length === 0" class="search-empty">
            没有找到「{{ searchQuery }}」相关的馆藏
          </div>
          <div
            v-for="(item, i) in searchResults"
            :key="item.type + item.slug"
            class="search-result-item"
            :class="{ active: i === activeResult }"
            @click="navigateTo(item)"
            @mouseenter="activeResult = i"
          >
            <span class="icon">{{ collections[item.type]?.icon }}</span>
            <div class="info">
              <div class="title">{{ item.title }}</div>
              <div class="sub">{{ collections[item.type]?.name }} · {{ cardLine(item) }}</div>
            </div>
          </div>
        </div>
        <div class="search-hint">
          <span><kbd>↑</kbd> <kbd>↓</kbd> 导航</span>
          <span><kbd>↵</kbd> 打开</span>
          <span><kbd>esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { COLLECTIONS } from './collections.js'
import { useEntries } from './useEntries.js'

const router = useRouter()
const collections = COLLECTIONS

const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)
const activeResult = ref(0)

const { entries } = useEntries()

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return entries.value
    .filter(e => {
      const haystack = [
        e.title, e.type, e.artist, e.author, e.director,
        e.theme, e.label, e.region, e.set_id,
        ...(e.tags || []),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, 8)
})

watch(searchQuery, () => { activeResult.value = 0 })
watch(searchOpen, (v) => {
  if (v) {
    searchQuery.value = ''
    activeResult.value = 0
    setTimeout(() => searchInput.value?.focus(), 50)
  }
})

function cardLine(entry) {
  const cfg = collections[entry.type]
  return cfg?.cardLine ? cfg.cardLine(entry) : ''
}

function moveResult(dir) {
  const len = searchResults.value.length
  if (len === 0) return
  activeResult.value = (activeResult.value + dir + len) % len
}

function goToResult() {
  const item = searchResults.value[activeResult.value]
  if (item) navigateTo(item)
}

function navigateTo(item) {
  searchOpen.value = false
  router.push(`/${item.type}/${item.slug}`)
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ====== Excel 导出 ======

const exporting = ref(false)

const TYPE_LABELS = { lego: '乐高', vinyl: '唱片', books: '书籍', movies: '电影' }
const STATUS_LABELS = {
  built: '已拼搭', unbuilt: '未拼搭', wishlist: '想要',
  owned: '已收藏',
  read: '已读', reading: '在读', unread: '未读',
  watched: '已看',
}

function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^- /gm, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractRow(entry) {
  return {
    id: entry.type + '-' + entry.slug,
    pic: entry.cover || '',
    album: entry.title || '',
    artist: entry.artist || entry.author || entry.director || '',
    version: entry.pressing || entry.format || entry.theme || '',
    release_date: entry.release_date || entry.year || '',
    status: STATUS_LABELS[entry.status] || entry.status || '',
    purchase_date: entry.added || '',
    purchase_from: entry.purchase_place || '',
    price: entry.price || '',
    rmb_price: entry.rmb_price || '',
    link: entry.link || '',
    content: stripMarkdown(entry.body_html || entry.body_plain || ''),
  }
}

const COLUMNS = [
  { key: 'id', label: 'id' },
  { key: 'pic', label: 'pic' },
  { key: 'album', label: 'album' },
  { key: 'artist', label: 'artist' },
  { key: 'version', label: 'version' },
  { key: 'release_date', label: 'release date' },
  { key: 'status', label: 'status' },
  { key: 'purchase_date', label: 'purchase date' },
  { key: 'purchase_from', label: 'purchase from' },
  { key: 'price', label: 'price' },
  { key: 'rmb_price', label: 'rmb_price' },
  { key: 'link', label: 'link' },
  { key: 'content', label: 'content' },
]

async function handleExport() {
  if (exporting.value) return
  exporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // 按类型分 Sheet
    for (const type of ['lego', 'vinyl', 'books', 'movies']) {
      const items = entries.value.filter(e => e.type === type)
      if (items.length === 0) continue

      const rows = items.map(extractRow)
      const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map(c => c.key) })
      XLSX.utils.sheet_add_aoa(ws, [COLUMNS.map(c => c.label)], { origin: 'A1' })

      ws['!cols'] = [
        { wch: 32 }, { wch: 20 }, { wch: 28 }, { wch: 18 },
        { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
        { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 36 }, { wch: 60 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, TYPE_LABELS[type] || type)
    }

    // 全部汇总 Sheet
    const allRows = entries.value.map(e => {
      const row = extractRow(e)
      row.type = TYPE_LABELS[e.type] || e.type
      return row
    })
    const allCols = [{ key: 'type', label: '类型' }, ...COLUMNS]
    const wsAll = XLSX.utils.json_to_sheet(allRows, { header: allCols.map(c => c.key) })
    XLSX.utils.sheet_add_aoa(wsAll, [allCols.map(c => c.label)], { origin: 'A1' })
    wsAll['!cols'] = [
      { wch: 8 }, { wch: 32 }, { wch: 20 }, { wch: 28 }, { wch: 18 },
      { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 36 }, { wch: 60 },
    ]
    XLSX.utils.book_append_sheet(wb, wsAll, '全部')

    XLSX.writeFile(wb, '馆藏导出.xlsx')
  } finally {
    exporting.value = false
  }
}
</script>
