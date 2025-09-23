<template>
  <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Bulk Link Upload</h2>
      <p class="text-gray-600">Upload multiple links at once using CSV format</p>
    </div>

    <!-- Upload Methods -->
    <div v-if="!showPreview" class="space-y-6">
      <!-- File Upload -->
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept=".csv"
          @change="handleFileUpload"
          class="hidden"
          id="csv-upload"
          ref="fileInput"
        />
        <label for="csv-upload" class="cursor-pointer">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="text-lg font-medium text-gray-900 mb-2">Upload CSV File</p>
          <p class="text-gray-500">Click to select a CSV file from your computer</p>
        </label>
      </div>

      <!-- Manual Input -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700">Or paste CSV data:</label>
        <textarea
          v-model="csvData"
          class="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="url,slug,title,expires
https://example.com,example,Example Site,2024-12-31
https://google.com,search,Google Search,"
        />
        <button
          v-if="csvData"
          @click="previewData"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Preview Data
        </button>
      </div>

      <!-- Template Download -->
      <div class="flex justify-center">
        <button
          @click="downloadTemplate"
          class="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Download CSV Template
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="showPreview && uploadState === 'idle'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Preview ({{ parsedData.length }} links)</h3>
        <button
          @click="showPreview = false"
          class="text-gray-500 hover:text-gray-700"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="max-h-60 overflow-y-auto border rounded-md">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">URL</th>
              <th class="px-3 py-2 text-left">Slug</th>
              <th class="px-3 py-2 text-left">Title</th>
              <th class="px-3 py-2 text-left">Expires</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in parsedData" :key="item.id" class="border-t">
              <td class="px-3 py-2 truncate max-w-xs" :title="item.url">{{ item.url }}</td>
              <td class="px-3 py-2">{{ item.slug }}</td>
              <td class="px-3 py-2">{{ item.title }}</td>
              <td class="px-3 py-2">{{ item.expires }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="showPreview = false"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          @click=""
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:green-700"
        >
          Upload {{ parsedData.length }} Links
        </button>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadState === 'uploading'" class="space-y-4">
      <h3 class="text-lg font-semibold">Uploading Links...</h3>
      <div class="space-y-2">
        <div v-for="(result, index) in results" :key="index" class="flex items-center gap-3 p-2 border rounded">
          <svg v-if="result.status === 'success'" class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg v-if="result.status === 'error'" class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="flex-1 truncate">{{ result.url }}</span>
          <span class="text-sm text-gray-500">{{ result.message }}</span>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="uploadState === 'completed'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Upload Complete</h3>
        <button
          @click="exportResults"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export Results
        </button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {{ results.filter(r => r.status === 'success').length }}
          </div>
          <div class="text-sm text-green-700">Successful</div>
        </div>
        <div class="text-center p-3 bg-red-50 rounded-lg">
          <div class="text-2xl font-bold text-red-600">
            {{ results.filter(r => r.status === 'error').length }}
          </div>
          <div class="text-sm text-red-700">Failed</div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ results.length }}</div>
          <div class="text-sm text-blue-700">Total</div>
        </div>
      </div>

      <button
        @click="resetForm"
        class="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Upload More Links
      </button>
    </div>
  </div>
</template>

<script setup>

// State management
const csvData = ref('')
const showPreview = ref(false)
const uploadState = ref('idle') // idle, uploading, completed
const results = ref([])
const parsedData = ref([])
const fileInput = ref(null)

// Parse CSV with native JavaScript (more reliable for build)
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) return []
  
  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  
  // Find column indices
  const urlIndex = headers.findIndex(h => h.includes('url') || h === 'link')
  const slugIndex = headers.findIndex(h => h.includes('slug') || h === 'short' || h === 'alias')
  const titleIndex = headers.findIndex(h => h.includes('title') || h === 'name')
  const expiresIndex = headers.findIndex(h => h.includes('expire') || h === 'expiration')
  
  if (urlIndex === -1) {
    console.warn('No URL column found in CSV')
    return []
  }
  
  // Parse data rows
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return {
      id: index,
      url: values[urlIndex] || '',
      slug: values[slugIndex] || '',
      title: values[titleIndex] || '',
      expires: values[expiresIndex] || '',
      status: 'pending'
    }
  }).filter(item => item.url && item.url.startsWith('http'))
}

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'text/csv') {
    const reader = new FileReader()
    reader.onload = (e) => {
      csvData.value = e.target.result
      previewData()
    }
    reader.readAsText(file)
  }
}

// Preview data
const previewData = () => {
  if (csvData.value.trim()) {
    parsedData.value = parseCSV(csvData.value)
    showPreview.value = true
  }
}

// Process bulk upload
const processBulkUpload = async () => {
  uploadState.value = 'uploading'
  results.value = []
  
  const links = parsedData.value
  const processedResults = []
  
  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    try {
      const response = await $fetch('/api/link/create', {
        method: 'POST',
          credentials: 'include', // <-- send cookies/session
        body: {
          url: link.url,
          slug: link.slug || undefined,
          title: link.title || undefined,
          expires: link.expires || undefined
        }
      })
      
      processedResults.push({
        ...link,
        status: 'success',
        shortUrl: response.shortUrl || `https://sink.cool/${response.slug}`,
        message: 'Created successfully'
      })
    } catch (error) {
      processedResults.push({
        ...link,
        status: 'error',
        message: error.message || 'Failed to create'
      })
    }
    
    results.value = [...processedResults]
    
    // Small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  uploadState.value = 'completed'
}

// Download template
const downloadTemplate = () => {
  const template = 'url,slug,title,expires\nhttps://example.com,example-slug,Example Title,2024-12-31\nhttps://google.com,google,Google Search,\nhttps://github.com,gh,GitHub,2024-06-30'
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bulk-upload-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Export results
const exportResults = () => {
  const csv = 'Original URL,Short URL,Status,Message\n' + 
               results.value.map(r => `"${r.url}","${r.shortUrl || ''}","${r.status}","${r.message}"`).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bulk-upload-results.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Reset form
const resetForm = () => {
  uploadState.value = 'idle'
  showPreview.value = false
  csvData.value = ''
  results.value = []
  parsedData.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
