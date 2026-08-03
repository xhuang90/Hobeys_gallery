<template>
  <div v-if="loaded">
    <!-- Hero -->
    <section class="hero" :style="{ background: HOME_GRADIENT }">
      <div class="kicker">My Vault</div>
      <h1 class="serif">我的收藏馆</h1>
      <p>乐高、唱片、书籍、电影——那些构成我的物件们。每一件都有它的来历和故事。</p>
      <div class="count">
        <div class="n">{{ entries.length }}</div>
        <div class="l">件馆藏</div>
      </div>
    </section>

    <!-- 分馆入口 -->
    <div class="stats">
      <div
        v-for="(cfg, type) in collections"
        :key="type"
        class="stat-card"
        :style="{ background: cfg.gradient }"
        @click="$router.push(`/${type}`)"
      >
        <span class="ic">{{ cfg.icon }}</span>
        <span>
          <span class="n">{{ countByType(type) }}</span><br>
          <span class="l">{{ cfg.gallery }}</span>
        </span>
      </div>
    </div>

    <!-- 最近入库 -->
    <section class="sect">
      <div class="sect-header">
        <h2 class="serif">最近入库</h2>
        <span class="sub">最新收入囊中的 {{ Math.min(8, entries.length) }} 件</span>
      </div>
      <div class="grid">
        <EntryCard v-for="entry in recent" :key="entry.type + entry.slug" :entry="entry" />
      </div>
    </section>
  </div>
  <div v-else class="empty-state">
    <div class="icon">⏳</div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EntryCard from '../components/EntryCard.vue'
import { COLLECTIONS, HOME_GRADIENT } from '../collections.js'
import { useEntries } from '../useEntries.js'

const collections = COLLECTIONS
const { entries, loaded } = useEntries()

function countByType(type) {
  return entries.value.filter(e => e.type === type).length
}

const recent = computed(() =>
  [...entries.value]
    .sort((a, b) => String(b.added || '').localeCompare(String(a.added || '')))
    .slice(0, 8)
)
</script>
