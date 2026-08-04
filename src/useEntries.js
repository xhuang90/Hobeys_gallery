import { ref } from 'vue'

const entries = ref([])
const loaded = ref(false)
let loading = null

export function useEntries() {
  if (!loading) {
    loading = fetch(import.meta.env.BASE_URL + 'data.json')
      .then(r => r.json())
      .then(data => {
        entries.value = data
        loaded.value = true
      })
  }
  return { entries, loaded }
}
