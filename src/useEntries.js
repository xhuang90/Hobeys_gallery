import { ref } from 'vue'

const entries = ref([])
const loaded = ref(false)
let loading = null

export function useEntries() {
  if (!loading) {
    loading = fetch('/data.json')
      .then(r => r.json())
      .then(data => {
        entries.value = data
        loaded.value = true
      })
  }
  return { entries, loaded }
}
