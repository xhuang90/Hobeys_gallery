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
            <option value="lego">🧱 乐高</option>
            <option value="vinyl">💿 唱片</option>
            <option value="books">📚 书籍</option>
            <option value="movies">🎬 电影</option>
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

        <div class="form-row">
          <div class="form-group">
            <label>入库日期</label>
            <input v-model="form.added" type="date" class="form-input">
          </div>
          <div class="form-group">
            <label>封面图路径</label>
            <input v-model="form.cover" type="text" class="form-input" placeholder="images/xxx.jpg">
          </div>
        </div>

        <!-- ====== 乐高 ====== -->
        <template v-if="form.type === 'lego'">
          <div class="form-section">🧱 乐高专属字段</div>
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
            <label>价格</label>
            <input v-model="form.price" type="text" class="form-input" placeholder="¥6999">
          </div>
          <div class="form-group">
            <label>购买渠道</label>
            <input v-model="form.purchase_place" type="text" class="form-input" placeholder="乐高官方旗舰店">
          </div>
        </template>

        <!-- ====== 唱片 ====== -->
        <template v-if="form.type === 'vinyl'">
          <div class="form-section">💿 唱片专属字段</div>
          <div class="form-group">
            <label>艺术家 *</label>
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
              <label>版本</label>
              <input v-model="form.pressing" type="text" class="form-input" placeholder="日版首压">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>唱片公司</label>
              <input v-model="form.label" type="text" class="form-input" placeholder="索尼音乐">
            </div>
            <div class="form-group">
              <label>发行日期</label>
              <input v-model="form.release_date" type="text" class="form-input" placeholder="2017-03-29">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>价格</label>
              <input v-model="form.price" type="text" class="form-input" placeholder="¥380">
            </div>
            <div class="form-group">
              <label>购买渠道</label>
              <input v-model="form.purchase_place" type="text" class="form-input" placeholder="日本亚马逊">
            </div>
          </div>
          <div class="form-group">
            <label>专辑简介</label>
            <textarea v-model="form.description" class="form-textarea" rows="3" placeholder="这张专辑..."></textarea>
          </div>
          <div class="form-group">
            <label>曲目列表（每行一首，如 "01. 歌名"）</label>
            <textarea v-model="form.tracklist" class="form-textarea" rows="8" placeholder="01. 第一首歌&#10;02. 第二首歌"></textarea>
          </div>
        </template>

        <!-- ====== 书籍 ====== -->
        <template v-if="form.type === 'books'">
          <div class="form-section">📚 书籍专属字段</div>
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
                <option value="unread">未读</option>
                <option value="wishlist">想读</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>ISBN</label>
            <input v-model="form.isbn" type="text" class="form-input" placeholder="978-7-5063-4730-5">
          </div>
        </template>

        <!-- ====== 电影 ====== -->
        <template v-if="form.type === 'movies'">
          <div class="form-section">🎬 电影专属字段</div>
          <div class="form-row">
            <div class="form-group">
              <label>导演</label>
              <input v-model="form.director" type="text" class="form-input" placeholder="克里斯托弗·诺兰">
            </div>
            <div class="form-group">
              <label>英文片名</label>
              <input v-model="form.en_title" type="text" class="form-input" placeholder="Interstellar">
            </div>
          </div>
          <div class="form-group">
            <label>编剧</label>
            <input v-model="form.writers" type="text" class="form-input" placeholder="编剧1 / 编剧2">
          </div>
          <div class="form-group">
            <label>主演</label>
            <input v-model="form.cast" type="text" class="form-input" placeholder="主演1 / 主演2 / 主演3">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>类型</label>
              <input v-model="form.genre" type="text" class="form-input" placeholder="动作 / 科幻 / 冒险">
            </div>
            <div class="form-group">
              <label>地区</label>
              <input v-model="form.region" type="text" class="form-input" placeholder="美国">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>片长</label>
              <input v-model="form.duration" type="text" class="form-input" placeholder="150分钟">
            </div>
            <div class="form-group">
              <label>IMDb ID</label>
              <input v-model="form.imdb" type="text" class="form-input" placeholder="tt0816692">
            </div>
          </div>
          <div class="form-group">
            <label>上映日期</label>
            <input v-model="form.release_date" type="text" class="form-input" placeholder="2014-11-12(中国大陆) / 2014-11-07(美国)">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-select">
                <option value="watched">已看</option>
                <option value="wishlist">想看</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>封面占位</label>
            <p class="form-hint">图片命名格式：<code>images/movie-{slug}.png</code>，放 <code>collections/images/</code> 下</p>
          </div>
        </template>

        <!-- hoho碎碎念 -->
        <div class="form-group">
          <label>{{ form.type === 'movies' ? '💭 hoho碎碎念' : '📝 笔记' }}</label>
          <textarea v-model="form.notes" class="form-textarea" rows="8" placeholder="写下你的感受、体验、评价..."></textarea>
        </div>

        <!-- 提交 -->
        <button type="submit" class="submit-btn">
          📥 生成并下载 Markdown 文件
        </button>

        <!-- 提示 -->
        <div v-if="showHint" class="hint-box">
          <h3>✅ 文件已下载！</h3>
          <p>请将文件移动到：</p>
          <code>collections/{{ form.type }}/{{ hintFilename }}</code>
          <p style="margin-top: 12px;">如果文件名有冲突，改一下前缀即可。</p>
          <p style="margin-top: 8px;">放入后运行：</p>
          <code>node scripts/build.js</code>
          <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">
            构建完成后刷新浏览器即可看到新增的藏品。
          </p>
        </div>
      </form>

      <!-- 预览 -->
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
  cover: '',
  status: '',
  notes: '',
  // LEGO
  set_id: '', theme: '', pieces: '', price: '', purchase_place: '',
  // Vinyl
  artist: '', format: 'CD', pressing: '', label: '', release_date: '',
  description: '', tracklist: '',
  // Books
  author: '', publisher: '', isbn: '',
  // Movies
  director: '', en_title: '', writers: '', cast: '',
  genre: '', region: '美国', duration: '', imdb: '',
})

const showHint = ref(false)
const hintFilename = ref('')

const generatedMarkdown = computed(() => {
  if (!form.value.type || !form.value.title) return '请先选择类型并填写标题...'

  const lines = ['---']
  const add = (k, v) => { if (v) lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`) }

  // 通用
  add('title', form.value.title)
  if (form.value.type === 'movies' && form.value.en_title) add('en_title', form.value.en_title)
  if (form.value.year) add('year', form.value.year)
  if (form.value.rating) add('rating', form.value.rating)

  if (form.value.tags) {
    const tagList = form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagList.length > 0) lines.push(`tags: [${tagList.join(', ')}]`)
  }

  if (form.value.added) add('added', form.value.added)
  if (form.value.status) add('status', form.value.status)
  if (form.value.cover) add('cover', form.value.cover)

  // 类型专属
  if (form.value.type === 'lego') {
    add('set_id', form.value.set_id); add('theme', form.value.theme)
    add('pieces', form.value.pieces); add('price', form.value.price)
    add('purchase_place', form.value.purchase_place)
  } else if (form.value.type === 'vinyl') {
    add('artist', form.value.artist); add('format', form.value.format)
    add('pressing', form.value.pressing); add('label', form.value.label)
    add('release_date', form.value.release_date)
    add('price', form.value.price); add('purchase_place', form.value.purchase_place)
    if (form.value.description) lines.push(`description: "${form.value.description.replace(/"/g, '\\"')}"`)
    if (form.value.tracklist) {
      lines.push('tracklist: |')
      form.value.tracklist.split('\n').forEach(l => lines.push('  ' + l))
    }
  } else if (form.value.type === 'books') {
    add('author', form.value.author); add('publisher', form.value.publisher)
    add('isbn', form.value.isbn)
  } else if (form.value.type === 'movies') {
    add('director', form.value.director); add('writers', form.value.writers)
    add('cast', form.value.cast); add('genre', form.value.genre)
    add('region', form.value.region); add('duration', form.value.duration)
    add('imdb', form.value.imdb)
    if (form.value.release_date) add('release_date', form.value.release_date)
  }

  lines.push('---\n')

  if (form.value.notes) {
    lines.push(form.value.notes)
  }

  return lines.join('\n')
})

function slugify(title) {
  // 保留中文和英文
  return title
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function generateAndDownload() {
  if (!form.value.type || !form.value.title) { alert('请填写类型和标题'); return }

  const content = generatedMarkdown.value
  const slug = slugify(form.value.title) || 'untitled'

  const prefix = form.value.type === 'lego' && form.value.set_id ? `${form.value.set_id}-` : ''
  const filename = `${prefix}${slug}.md`
  hintFilename.value = filename

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)

  showHint.value = true
  setTimeout(() => { showHint.value = false }, 15000)
}
</script>

<style scoped>
.add-entry-page { min-height: 100vh; }
.form-container {
  max-width: 1200px; margin: 0 auto; padding: 40px 24px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
}
@media (max-width: 768px) { .form-container { grid-template-columns: 1fr; } }
.add-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
label { font-size: 14px; font-weight: 500; color: var(--text); }
.form-hint { font-size: 12px; color: var(--faint); margin-top: 4px; }
.form-hint code { font-size: 12px; background: var(--hover-bg); padding: 1px 5px; border-radius: 3px; }
.form-input, .form-select, .form-textarea {
  padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 14px; font-family: inherit; background: var(--bg); color: var(--text);
  transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--accent); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-section {
  font-size: 16px; font-weight: 600; color: var(--text);
  padding-top: 16px; border-top: 1px solid var(--border); margin-top: 8px;
}
.submit-btn {
  padding: 14px 24px; background: var(--accent); color: white;
  border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.submit-btn:hover { background: var(--accent-dark); transform: translateY(-2px); }
.submit-btn:active { transform: translateY(0); }
.hint-box {
  padding: 20px; background: var(--success-bg, #d4edda);
  border: 1px solid var(--success-border, #c3e6cb); border-radius: 8px;
  color: var(--success-text, #155724);
}
.hint-box h3 { margin: 0 0 12px 0; font-size: 18px; }
.hint-box p { margin: 6px 0; font-size: 14px; }
.hint-box code {
  display: inline-block; padding: 4px 8px;
  background: rgba(0,0,0,0.1); border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace; font-size: 13px;
}
.preview-panel { position: sticky; top: 100px; align-self: start; }
.preview-panel h3 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--text); }
.preview-content {
  background: var(--code-bg, #f5f5f5); border: 1px solid var(--border);
  border-radius: 8px; padding: 20px;
  font-family: 'Monaco', 'Courier New', monospace; font-size: 13px;
  line-height: 1.6; overflow-x: auto; white-space: pre-wrap;
  word-break: break-word; max-height: 600px; overflow-y: auto;
}
</style>
