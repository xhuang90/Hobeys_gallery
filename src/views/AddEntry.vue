<template>
  <div class="add-entry-page">
    <section class="detail-hero" style="background: var(--accent)">
      <router-link to="/" class="crumb">← 返回首页</router-link>
      <h1 class="serif">新增藏品</h1>
      <p style="opacity: 0.9; margin-top: 8px;">
        填写表单后下载 Markdown 文件，放入 collections/ 对应目录即可
      </p>
    </section>

    <div class="form-container">
      <form @submit.prevent="generateAndDownload" class="add-form">
        <!-- 类型选择 -->
        <div class="form-group">
          <label>藏品类型 *</label>
          <select v-model="form.type" required class="form-select">
            <option value="">请选择</option>
            <option value="lego">乐高</option>
            <option value="vinyl">唱片</option>
            <option value="books">书籍</option>
            <option value="movies">电影</option>
          </select>
        </div>

        <!-- 通用字段 -->
        <div class="form-group">
          <label>标题 *</label>
          <input v-model="form.title" type="text" required class="form-input" placeholder="藏品名称">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>年份</label>
            <input v-model="form.year" type="number" class="form-input" placeholder="2024">
          </div>
          <div class="form-group">
            <label>评分 (1-5)</label>
            <input v-model.number="form.rating" type="number" min="1" max="5" class="form-input" placeholder="5">
          </div>
        </div>

        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input v-model="form.tags" type="text" class="form-input" placeholder="经典, 收藏, 限量版">
        </div>

        <div class="form-group">
          <label>入库日期</label>
          <input v-model="form.added" type="date" class="form-input">
        </div>

        <!-- 乐高专用字段 -->
        <template v-if="form.type === 'lego'">
          <div class="form-section">乐高专属字段</div>
          
          <div class="form-row">
            <div class="form-group">
              <label>套装编号</label>
              <input v-model="form.set_id" type="text" class="form-input" placeholder="75313">
            </div>
            <div class="form-group">
              <label>系列</label>
              <input v-model="form.theme" type="text" class="form-input" placeholder="星球大战 UCS">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>零件数</label>
              <input v-model="form.pieces" type="number" class="form-input" placeholder="6785">
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-select">
                <option value="built">已拼</option>
                <option value="unbuilt">未拼</option>
                <option value="wishlist">想要</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>完成日期</label>
            <input v-model="form.built_date" type="date" class="form-input">
          </div>
        </template>

        <!-- 唱片专用字段 -->
        <template v-if="form.type === 'vinyl'">
          <div class="form-section">唱片专属字段</div>
          
          <div class="form-group">
            <label>艺术家</label>
            <input v-model="form.artist" type="text" class="form-input" placeholder="Pink Floyd">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>格式</label>
              <select v-model="form.format" class="form-select">
                <option value="CD">CD</option>
                <option value="LP">黑胶 LP</option>
                <option value="Cassette">磁带</option>
                <option value="Digital">数字</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-select">
                <option value="owned">已拥有</option>
                <option value="wishlist">想要</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>版本信息</label>
            <input v-model="form.pressing" type="text" class="form-input" placeholder="日版首压">
          </div>
        </template>

        <!-- 书籍专用字段 -->
        <template v-if="form.type === 'books'">
          <div class="form-section">书籍专属字段</div>
          
          <div class="form-group">
            <label>作者</label>
            <input v-model="form.author" type="text" class="form-input" placeholder="余华">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>出版社</label>
              <input v-model="form.publisher" type="text" class="form-input" placeholder="作家出版社">
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-select">
                <option value="read">已读</option>
                <option value="reading">在读</option>
                <option value="wishlist">想读</option>
              </select>
            </div>
          </div>
        </template>

        <!-- 电影专用字段 -->
        <template v-if="form.type === 'movies'">
          <div class="form-section">电影专属字段</div>
          
          <div class="form-group">
            <label>导演</label>
            <input v-model="form.director" type="text" class="form-input" placeholder="克里斯托弗·诺兰">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>国家</label>
              <input v-model="form.country" type="text" class="form-input" placeholder="美国">
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-select">
                <option value="watched">已看</option>
                <option value="wishlist">想看</option>
              </select>
            </div>
          </div>
        </template>

        <!-- 笔记 -->
        <div class="form-group">
          <label>笔记</label>
          <textarea v-model="form.notes" class="form-textarea" rows="6" placeholder="写下你的感受、体验、评价..."></textarea>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="submit-btn">
          📥 生成并下载 Markdown 文件
        </button>

        <!-- 提示信息 -->
        <div v-if="showHint" class="hint-box">
          <h3>✅ 文件已下载！</h3>
          <p>请将文件移动到以下目录：</p>
          <code>collections/{{ form.type }}/</code>
          <p style="margin-top: 12px;">然后运行：</p>
          <code>npm run build</code>
        </div>
      </form>

      <!-- 预览区域 -->
      <div class="preview-panel">
        <h3>📄 Markdown 预览</h3>
        <pre class="preview-content">{{ generatedMarkdown }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const form = ref({
  type: '',
  title: '',
  year: '',
  rating: '',
  tags: '',
  added: new Date().toISOString().split('T')[0],
  status: '',
  notes: '',
  // LEGO
  set_id: '',
  theme: '',
  pieces: '',
  built_date: '',
  // Vinyl
  artist: '',
  format: 'CD',
  pressing: '',
  // Books
  author: '',
  publisher: '',
  // Movies
  director: '',
  country: '',
})

const showHint = ref(false)

const generatedMarkdown = computed(() => {
  if (!form.value.type || !form.value.title) {
    return '请先选择类型并填写标题...'
  }

  const lines = ['---']
  
  // 通用字段
  lines.push(`title: ${form.value.title}`)
  if (form.value.year) lines.push(`year: ${form.value.year}`)
  if (form.value.rating) lines.push(`rating: ${form.value.rating}`)
  
  // 标签
  if (form.value.tags) {
    const tagList = form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagList.length > 0) {
      lines.push(`tags: [${tagList.join(', ')}]`)
    }
  }
  
  if (form.value.added) lines.push(`added: ${form.value.added}`)
  if (form.value.status) lines.push(`status: ${form.value.status}`)

  // 类型专属字段
  if (form.value.type === 'lego') {
    if (form.value.set_id) lines.push(`set_id: ${form.value.set_id}`)
    if (form.value.theme) lines.push(`theme: ${form.value.theme}`)
    if (form.value.pieces) lines.push(`pieces: ${form.value.pieces}`)
    if (form.value.built_date) lines.push(`built_date: ${form.value.built_date}`)
  } else if (form.value.type === 'vinyl') {
    if (form.value.artist) lines.push(`artist: ${form.value.artist}`)
    if (form.value.format) lines.push(`format: ${form.value.format}`)
    if (form.value.pressing) lines.push(`pressing: ${form.value.pressing}`)
  } else if (form.value.type === 'books') {
    if (form.value.author) lines.push(`author: ${form.value.author}`)
    if (form.value.publisher) lines.push(`publisher: ${form.value.publisher}`)
  } else if (form.value.type === 'movies') {
    if (form.value.director) lines.push(`director: ${form.value.director}`)
    if (form.value.country) lines.push(`country: ${form.value.country}`)
  }

  lines.push('---')
  lines.push('')

  // 笔记
  if (form.value.notes) {
    lines.push('## 笔记')
    lines.push('')
    lines.push(form.value.notes)
  }

  return lines.join('\n')
})

function generateAndDownload() {
  if (!form.value.type || !form.value.title) {
    alert('请填写类型和标题')
    return
  }

  const content = generatedMarkdown.value
  
  // 生成文件名
  const slug = form.value.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const prefix = form.value.type === 'lego' && form.value.set_id 
    ? `${form.value.set_id}-` 
    : ''
  
  const filename = `${prefix}${slug}.md`

  // 下载文件
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)

  // 显示提示
  showHint.value = true
  
  // 5秒后隐藏提示
  setTimeout(() => {
    showHint.value = false
  }, 10000)
}
</script>

<style scoped>
.add-entry-page {
  min-height: 100vh;
}

.form-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 768px) {
  .form-container {
    grid-template-columns: 1fr;
  }
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-section {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.submit-btn {
  padding: 14px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: var(--accent-dark);
  transform: translateY(-2px);
}

.submit-btn:active {
  transform: translateY(0);
}

.hint-box {
  padding: 20px;
  background: var(--success-bg, #d4edda);
  border: 1px solid var(--success-border, #c3e6cb);
  border-radius: 8px;
  color: var(--success-text, #155724);
}

.hint-box h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.hint-box p {
  margin: 8px 0;
  font-size: 14px;
}

.hint-box code {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.preview-panel {
  position: sticky;
  top: 100px;
  align-self: start;
}

.preview-panel h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

.preview-content {
  background: var(--code-bg, #f5f5f5);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 600px;
  overflow-y: auto;
}
</style>
