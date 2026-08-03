<template>
  <div v-if="loaded && entry">
    <!-- Hero -->
    <section class="detail-hero" :style="{ background: cfg.gradient }">
      <router-link :to="`/${type}`" class="crumb">← 返回{{ cfg.gallery }}</router-link>
      <div>
        <span v-if="statusCfg" class="badge" :style="{ background: statusCfg.color }">
          {{ statusCfg.label }}
        </span>
      </div>
      <h1 class="serif">{{ entry.title }}</h1>
      <div class="meta-line">
        <span>{{ cfg.cardLine(entry) }}</span>
        <span v-if="entry.added">入库于 {{ entry.added }}</span>
        <span v-if="entry.tags?.length" class="tags">
          <span v-for="t in entry.tags" :key="t" class="tag">{{ t }}</span>
        </span>
      </div>
    </section>

    <!-- Body -->
    <div class="detail-body">
      <aside>
        <table class="meta-table">
          <tr v-for="[key, label] in cfg.fields" :key="key">
            <template v-if="entry[key] !== undefined && entry[key] !== ''">
              <th>{{ label }}</th>
              <td>
                <span v-if="key === 'status' && statusCfg" class="badge" :style="{ background: statusCfg.color }">
                  {{ statusCfg.label }}
                </span>
                <span v-else-if="key === 'rating'" class="stars">
                  {{ '★'.repeat(entry.rating) }}{{ '☆'.repeat(5 - entry.rating) }}
                </span>
                <a v-else-if="key === 'link'" :href="entry[key]" target="_blank" rel="noopener" style="color: var(--accent); word-break: break-all;">
                  {{ entry[key] }}
                </a>
                <span v-else>{{ entry[key] }}</span>
              </td>
            </template>
          </tr>
        </table>
      </aside>
      <article class="prose" v-html="entry.body_html"></article>
    </div>
  </div>
  <div v-else-if="loaded && !entry" class="empty-state">
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { COLLECTIONS } from '../collections.js'
import { useEntries } from '../useEntries.js'

const route = useRoute()
const type = computed(() => route.params.type)
const slug = computed(() => route.params.slug)
const cfg = computed(() => COLLECTIONS[type.value])
const { entries, loaded } = useEntries()

const entry = computed(() =>
  entries.value.find(e => e.type === type.value && e.slug === slug.value)
)

const statusCfg = computed(() =>
  entry.value ? cfg.value?.statuses?.[entry.value.status] : null
)
</script>
