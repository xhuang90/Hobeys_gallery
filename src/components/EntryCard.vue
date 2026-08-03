<template>
  <div class="card" @click="$router.push(`/${entry.type}/${entry.slug}`)">
    <div class="cover" :style="coverStyle">
      <img v-if="entry.cover" :src="entry.cover" :alt="entry.title" loading="lazy" />
      <span v-else>{{ cfg.icon }}</span>
      <!-- Set number overlay for LEGO -->
      <div v-if="entry.set_id" class="set-number-badge">#{{ entry.set_id }}</div>
    </div>
    <div class="bd">
      <h3>{{ entry.title }}</h3>
      <div class="sub">{{ cfg.cardLine(entry) }}</div>

      <!-- LEGO extra info strip -->
      <div v-if="entry.type === 'lego'" class="info-strip">
        <div v-if="entry.pieces" class="info-item">
          <span class="info-icon">🧩</span>
          <span class="info-val">{{ Number(entry.pieces).toLocaleString() }} pcs</span>
        </div>
        <div v-if="entry.built_date" class="info-item">
          <span class="info-icon">✅</span>
          <span class="info-val">{{ formatDate(entry.built_date) }}</span>
        </div>
        <div v-else-if="entry.added && entry.status !== 'built'" class="info-item">
          <span class="info-icon">📅</span>
          <span class="info-val">{{ formatDate(entry.added) }}</span>
        </div>
        <div v-if="entry.dimensions" class="info-item">
          <span class="info-icon">📐</span>
          <span class="info-val">{{ entry.dimensions }}</span>
        </div>
        <div v-if="entry.price" class="info-item">
          <span class="info-icon">💰</span>
          <span class="info-val">{{ entry.price }}</span>
        </div>
      </div>

      <!-- Vinyl extra info -->
      <div v-else-if="entry.type === 'vinyl'" class="info-strip">
        <div v-if="entry.pressing" class="info-item">
          <span class="info-icon">💿</span>
          <span class="info-val">{{ entry.pressing }}</span>
        </div>
        <div v-if="entry.price" class="info-item">
          <span class="info-icon">💰</span>
          <span class="info-val">{{ entry.price }}</span>
        </div>
      </div>

      <!-- Books extra info -->
      <div v-else-if="entry.type === 'books'" class="info-strip">
        <div v-if="entry.author" class="info-item">
          <span class="info-icon">✍️</span>
          <span class="info-val">{{ entry.author }}</span>
        </div>
        <div v-if="entry.publisher" class="info-item">
          <span class="info-icon">🏢</span>
          <span class="info-val">{{ entry.publisher }}</span>
        </div>
      </div>

      <!-- Movies extra info -->
      <div v-else-if="entry.type === 'movies'" class="info-strip">
        <div v-if="entry.director" class="info-item">
          <span class="info-icon">🎬</span>
          <span class="info-val">{{ entry.director }}</span>
        </div>
        <div v-if="entry.country" class="info-item">
          <span class="info-icon">🌍</span>
          <span class="info-val">{{ entry.country }}</span>
        </div>
      </div>

      <!-- Bottom row: status + rating -->
      <div class="row">
        <span v-if="statusCfg" class="badge" :style="{ background: statusCfg.color }">
          {{ statusCfg.label }}
        </span>
        <span v-if="entry.rating" class="stars">
          {{ '★'.repeat(entry.rating) }}{{ '☆'.repeat(5 - entry.rating) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { COLLECTIONS } from '../collections.js'

const props = defineProps({ entry: Object })
const cfg = computed(() => COLLECTIONS[props.entry.type])
const statusCfg = computed(() => cfg.value?.statuses?.[props.entry.status])

const coverStyle = computed(() => {
  return { background: cfg.value.gradient }
})

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return d
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}
</script>

<style scoped>
.set-number-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 8px;
  backdrop-filter: blur(4px);
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  letter-spacing: 0.5px;
}

.info-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: var(--dim);
  white-space: nowrap;
}

.info-icon {
  font-size: 11px;
  line-height: 1;
}

.info-val {
  line-height: 1;
}
</style>
