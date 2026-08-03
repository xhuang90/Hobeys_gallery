<template>
  <div class="card" @click="$router.push(`/${entry.type}/${entry.slug}`)">
    <div class="cover" :style="coverStyle">
      <img v-if="entry.cover" :src="entry.cover" :alt="entry.title" loading="lazy" />
      <span v-else>{{ cfg.icon }}</span>
    </div>
    <div class="bd">
      <h3>{{ entry.title }}</h3>
      <div class="sub">{{ cfg.cardLine(entry) }}</div>
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
  if (props.entry.cover) return { background: cfg.value.gradient }
  return { background: cfg.value.gradient }
})
</script>
