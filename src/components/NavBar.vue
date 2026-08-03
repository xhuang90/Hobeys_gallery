<template>
  <header class="navbar">
    <div class="wrap">
      <router-link to="/" class="brand">🏛 我的收藏馆</router-link>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link
          v-for="(cfg, type) in collections"
          :key="type"
          :to="`/${type}`"
        >
          {{ cfg.icon }} {{ cfg.name }}
        </router-link>
      </nav>
      <router-link to="/add" class="add-trigger">
        ➕ 新增
      </router-link>
      <button class="search-trigger" @click="$emit('open-search')">
        🔍 搜索 <kbd>⌘K</kbd>
      </button>
    </div>
  </header>
</template>

<style scoped>
.add-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--accent);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  margin-right: 12px;
}
.add-trigger:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
}
</style>

<script setup>
import { COLLECTIONS } from '../collections.js'
defineEmits(['open-search'])
const collections = COLLECTIONS
</script>
