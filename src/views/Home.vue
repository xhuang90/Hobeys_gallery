<template>
  <div v-if="loaded" class="home-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg" :style="{ backgroundImage: `url(${bgUrl})` }"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title serif">Welcome to Hobey's Gallery</h1>
        <p class="hero-sub">乐高、唱片、书籍、电影——那些构成我的物件们</p>
      </div>
    </section>

    <!-- 四馆入口 -->
    <section class="gateways">
      <div class="gateways-inner">
        <div
          v-for="(cfg, type) in collections"
          :key="type"
          class="gw-card"
          :style="{ background: cfg.gradient }"
          @click="$router.push(`/${type}`)"
        >
          <span class="gw-ic">{{ cfg.icon }}</span>
          <span class="gw-n">{{ countByType(type) }}</span>
          <span class="gw-l">{{ cfg.gallery }}</span>
        </div>
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
import { COLLECTIONS } from '../collections.js'
import { useEntries } from '../useEntries.js'

const collections = COLLECTIONS
const { entries, loaded } = useEntries()

const bgUrl = computed(() => import.meta.env.BASE_URL + 'cover/505W.jpg')

function countByType(type) {
  return entries.value.filter(e => e.type === type).length
}
</script>

<style scoped>
/* 覆盖全局 wrap 的 padding/max-width，首页全宽 */
.home-page {
  margin: -24px -32px 0;
}
@media (max-width: 768px) {
  .home-page { margin: -24px -16px 0; }
}

/* ===== Hero ===== */
.hero {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: white;
  background: #0a192f;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.8s ease;
}
.hero:hover .hero-bg { transform: scale(1.02); }

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 25, 47, 0.3) 0%,
    rgba(10, 25, 47, 0.45) 50%,
    rgba(10, 25, 47, 0.7) 100%
  );
}

.hero-content {
  position: relative;
  text-align: center;
  padding: 0 24px;
  max-width: 800px;
}

.hero-title {
  font-size: clamp(42px, 6vw, 80px);
  font-weight: 400;
  letter-spacing: 3px;
  margin: 0;
  text-shadow: 0 2px 30px rgba(0,0,0,0.35);
}

.hero-sub {
  margin-top: 24px;
  font-size: clamp(14px, 1.6vw, 18px);
  font-weight: 300;
  opacity: 0.9;
  text-shadow: 0 1px 10px rgba(0,0,0,0.5);
  letter-spacing: 2px;
}

/* ===== Gateways ===== */
.gateways {
  background: var(--bg);
  padding: 60px 24px 80px;
}
.gateways-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
}
@media (max-width: 640px) {
  .gateways-inner { flex-wrap: wrap; gap: 12px; }
}

.gw-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px 28px;
  border-radius: 14px;
  color: white;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  min-width: 140px;
}
.gw-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(0,0,0,0.16);
}

.gw-ic {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}

.gw-n {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 1px;
}

.gw-l {
  font-size: 13px;
  opacity: 0.9;
  letter-spacing: 1.5px;
}
</style>