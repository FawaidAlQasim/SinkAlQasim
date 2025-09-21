<template>
  <div class="flex items-center gap-2">
    <!-- Bulk CSV upload -->
    <input type="file" @change="handleFile" accept=".csv" />
    <button @click="uploadCSV" :disabled="!file" class="px-2 py-1 bg-blue-500 text-white rounded">
      Upload CSV
    </button>

    <!-- Export all links -->
    <button @click="exportCSV" class="px-2 py-1 bg-green-500 text-white rounded">
      Export CSV
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const file = ref(null)

function handleFile(event) {
  file.value = event.target.files[0]
}

async function uploadCSV() {
  if (!file.value) return alert('Select a CSV file first.')

  const text = await file.value.text()
  const lines = text.trim().split('\n')
  const header = lines.shift() // remove header row if present

  const createdLinks = []
  for (const line of lines) {
    const [slug, url, comment] = line.split(',')
    if (!slug || !url) continue

    try {
      const form = new FormData()
      form.append('action', 'add')
      form.append('code', slug.trim())
      form.append('target', url.trim())
      form.append('description', comment?.trim() || '')

      const resp = await fetch('/dashboard', { method: 'POST', body: form })
      const data = await resp.json()
      if (data.success) createdLinks.push(data)
    } catch (err) {
      console.error('Failed to create link', err)
    }
  }

  alert(`Uploaded ${createdLinks.length} links successfully.`)
  file.value = null
  // emit event to parent to refresh the list
  emit('update:link', null, 'bulk')
}

async function exportCSV() {
  try {
    let allLinks = []
    let cursor = ''
    let hasMore = true

    while (hasMore) {
      const form = new FormData()
      form.append('action', 'search')
      form.append('query', '') // fetch all links
      const resp = await fetch('/dashboard', { method: 'POST', body: form })
      const data = await resp.json()
      if (data.success) {
        allLinks = allLinks.concat(data.results)
        hasMore = false // Sink API returns all matches with search('')
      } else {
        hasMore = false
      }
    }

    const rows = ['slug,url,comment']
    allLinks.forEach(l => rows.push(`${l.code},${l.target},${l.description || ''}`))

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'links_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to export CSV', err)
  }
}
</script>
