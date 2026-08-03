<template>
  <div class="card" @click="$router.push(`/${entry.type}/${entry.slug}`)">
    <div class="card-image">
      <img v-if="entry.cover" :src="entry.cover" :alt="entry.title" />
      <div v-else class="placeholder">
        <span>{{ cfg.icon }}</span>
      </div>
      <div v-if="statusCfg" class="status-badge" :style="{ background: statusCfg.color }">
        {{ statusCfg.label }}
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ entry.title }}</h3>
      <div class="card-meta">
        <span v-if="entry.set_id" class="set-id">#{{ entry.set_id }}</span>
        <span v-if="entry.pieces" class="pieces">{{ formatNumber(entry.pieces) }} 片</span>
        <span v-if="entry.year" class="year">{{ entry.year }}</span>
      </div>
      <div class="card-footer">
        <div v-if="entry.rating" class="rating">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= entry.rating }">★</span>
        </div>
        <span v-if="entry.theme" class="theme">{{ entry.theme }}</span>
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

function formatNumber(num) {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<style scoped>
.card {
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-image {
  position: relative;
  aspect-ratio: 1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 24px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .card-image img {
  transform: scale(1.15);
}

.placeholder {
  font-size: 64px;
  opacity: 0.3;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}

.card-body {
  padding: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 12px;
}

.set-id {
  font-weight: 600;
  color: var(--accent);
}

.pieces::before {
  content: "•";
  margin-right: 8px;
  color: var(--text-light);
}

.year::before {
  content: "•";
  margin-right: 8px;
  color: var(--text-light);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  color: #e0e0e0;
  transition: color 0.2s;
}

.star.filled {
  color: #ffc107;
}

.theme {
  font-size: 12px;
  color: var(--text-light);
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
