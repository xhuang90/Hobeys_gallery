<template>
  <div v-if="loaded && items.length">
    <!-- Hero -->
    <section class="detail-hero" :style="{ background: cfg.gradient }">
      <router-link :to="`/${type}`" class="crumb">← 返回{{ cfg.gallery }}</router-link>
      <div>
        <span v-if="primaryStatus" class="badge" :style="{ background: primaryStatus.color }">
          {{ primaryStatus.label }}
        </span>
        <span v-if="items.length > 1" class="badge" style="background: rgba(255,255,255,0.2); margin-left: 6px;">
          {{ items.length }} 个版本
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
    </section>

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

watch(items, () => { selectedIndex.value = 0 })
</script>

<style scoped>
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
