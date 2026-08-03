<template>
  <div class="filter-bar">
    <!-- Status filters -->
    <span
      v-for="(s, key) in statuses"
      :key="key"
      class="filter-chip"
      :class="{ active: activeStatus === key }"
      @click="toggleStatus(key)"
    >
      {{ s.label }}
    </span>

    <span class="filter-sep" />

    <!-- Tag filters -->
    <span
      v-for="tag in tags"
      :key="tag"
      class="filter-chip"
      :class="{ active: activeTags.includes(tag) }"
      @click="toggleTag(tag)"
    >
      {{ tag }}
    </span>

    <span class="filter-sep" v-if="tags.length" />

    <!-- Sort -->
    <select class="sort-select" :value="sort" @change="$emit('update:sort', $event.target.value)">
      <option value="date-desc">最新入库</option>
      <option value="date-asc">最早入库</option>
      <option value="rating-desc">评分最高</option>
      <option value="title-asc">标题 A→Z</option>
    </select>

    <!-- View toggle -->
    <div class="view-toggle">
      <button :class="{ active: view === 'grid' }" @click="$emit('update:view', 'grid')" title="网格">▦</button>
      <button :class="{ active: view === 'list' }" @click="$emit('update:view', 'list')" title="列表">☰</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  statuses: Object,
  tags: Array,
  activeStatus: String,
  activeTags: Array,
  sort: String,
  view: String,
})
const emit = defineEmits(['update:activeStatus', 'update:activeTags', 'update:sort', 'update:view'])

function toggleStatus(key) {
  emit('update:activeStatus', props.activeStatus === key ? '' : key)
}

function toggleTag(tag) {
  const tags = [...props.activeTags]
  const i = tags.indexOf(tag)
  if (i >= 0) tags.splice(i, 1)
  else tags.push(tag)
  emit('update:activeTags', tags)
}
</script>
