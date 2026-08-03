<template>
  <NavBar @open-search="searchOpen = true" />
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
</script>
