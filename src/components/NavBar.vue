<template>
  <header class="navbar">
    <div class="wrap">
      <router-link to="/" class="brand">🏛 Hobey's Gallery</router-link>
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
      <button class="export-trigger" @click="$emit('export')" title="导出 Excel">
        📥 导出
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
.export-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  cursor: pointer;
  background: rgba(255,255,255,0.1);
  transition: all 0.15s;
  white-space: nowrap;
  margin-left: 8px;
}
.export-trigger:hover {
  border-color: rgba(255,255,255,0.4);
  color: #fff;
  background: rgba(255,255,255,0.18);
}
</style>

<script setup>
import { COLLECTIONS } from '../collections.js'
defineEmits(['open-search', 'export'])
const collections = COLLECTIONS
</script>
