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
      <button class="search-trigger" @click="$emit('open-search')">
        🔍 搜索 <kbd>⌘K</kbd>
      </button>
    </div>
  </header>
</template>

<script setup>
import { COLLECTIONS } from '../collections.js'
defineEmits(['open-search'])
const collections = COLLECTIONS
</script>
