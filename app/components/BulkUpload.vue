<template>
  <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Bulk Link Upload</h2>
      <p class="text-gray-600">Upload multiple links at once using CSV format.</p>
    </div>

    <!-- General Error Display -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 text-red-800 hover:text-red-900">×</button>
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
        <button @click="showPreview = false" class="hover:text-gray-700">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="max-h-60 overflow-y-auto border rounded-md">
        <table class="w-full text-sm table-auto border-collapse">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-3 py-2 text-left font-medium">URL</th>
              <th class="px-3 py-2 text-left font-medium">Slug</th>
              <th class="px-3 py-2 text-left font-medium">Title</th>
              <th class="px-3 py-2 text-left font-medium">Expires</th>
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
        <button @click="showPreview = false" class="px-4 py-2 hover:text-gray-800">Back</button>
        <button @click="processBulkUpload" class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Upload {{ parsedData.length }} Links
        </button>
      </div>
    </div>

    <!-- Upload Progress/Results -->
    <div v-if="uploadState === 'uploading' || uploadState === 'completed'" class="space-y-4">
        <h3 class="text-lg font-semibold">{{ uploadState === 'completed' ? 'Upload Complete' : 'Uploading Links...' }}</h3>

        <!-- Progress Bar -->
        <div v-if="uploadState === 'uploading'" class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="`width: ${progressPercentage}%`"></div>
        </div>

       <!-- Summary Cards -->
        <div v-if="uploadState === 'completed'" class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ successCount }}</div>
                <div class="text-sm text-green-700">Successful</div>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ errorCount }}</div>
                <div class="text-sm text-red-700">Failed</div>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ results.length }}</div>
                <div class="text-sm text-blue-700">Total</div>
            </div>
        </div>

        <!-- Results Table -->
        <div class="max-h-60 overflow-y-auto border rounded-md">
            <table class="w-full text-sm table-auto border-collapse">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-3 py-2 text-left font-medium w-8"></th>
                        <th class="px-3 py-2 text-left font-medium">URL</th>
                        <th class="px-3 py-2 text-left font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(result, index) in results" :key="index" class="border-t">
                        <td class="px-3 py-2 text-center">
                            <svg v-if="result.status === 'success'" class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <svg v-else-if="result.status === 'error'" class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <svg v-else class="h-5 w-5 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </td>
                        <td class="px-3 py-2 truncate max-w-xs" :title="result.url">{{ result.url }}</td>
                        <td class="px-3 py-2 text-xs" :class="{'text-red-600': result.status === 'error', 'text-gray-500': result.status === 'success', 'text-yellow-600': result.status === 'pending'}">{{ result.message }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div v-if="uploadState === 'completed'" class="flex justify-between items-center gap-4">
             <button @click="exportResults" class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export Results
            </button>
            <button @click="resetForm" class="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Upload More Links
            </button>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// --- STATE MANAGEMENT ---
const csvData = ref('');
const showPreview = ref(false);
const uploadState = ref('idle'); // idle, uploading, completed
const results = ref([]);
const parsedData = ref([]);
const fileInput = ref(null);
const errorMessage = ref('');
const currentUploadIndex = ref(0);

// --- COMPUTED PROPERTIES ---
const successCount = computed(() => results.value.filter(r => r.status === 'success').length);
const errorCount = computed(() => results.value.filter(r => r.status === 'error').length);
const progressPercentage = computed(() => {
  if (parsedData.value.length === 0) return 0;
  return Math.round((currentUploadIndex.value / parsedData.value.length) * 100);
});

// --- HELPER FUNCTIONS ---

/**
 * More robust CSV parser that handles quoted values and various delimiters.
 * @param {string} csvText The full text of the CSV file.
 * @returns {Array<Object>} An array of parsed row objects.
 */
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    errorMessage.value = 'CSV must have at least a header row and one data row.';
    return [];
  }

  // Parse headers - handle quoted headers and normalize
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  // Find required columns with flexible matching
  const urlIndex = headers.findIndex(h => 
    h.includes('url') || h === 'link' || h === 'website' || h === 'address'
  );
  const slugIndex = headers.findIndex(h => 
    h.includes('slug') || h === 'short' || h === 'alias' || h === 'custom'
  );
  const titleIndex = headers.findIndex(h => 
    h.includes('title') || h === 'name' || h === 'description'
  );
  const expiresIndex = headers.findIndex(h => 
    h.includes('expire') || h === 'expiration' || h.includes('date')
  );

  if (urlIndex === -1) {
    errorMessage.value = 'CSV parsing error: A "url" column is required. Available columns: ' + headers.join(', ');
    return [];
  }

  const validRows = [];
  let skippedRows = 0;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    
    const url = values[urlIndex]?.trim() || '';
    
    // Validate URL
    if (!url) {
      skippedRows++;
      continue;
    }

    // Add protocol if missing
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = 'https://' + url;
    }

    // Basic URL validation
    try {
      new URL(processedUrl);
    } catch {
      console.warn(`Skipping invalid URL: ${url}`);
      skippedRows++;
      continue;
    }

    validRows.push({
      id: validRows.length,
      url: processedUrl,
      slug: values[slugIndex]?.trim() || '',
      title: values[titleIndex]?.trim() || '',
      expires: values[expiresIndex]?.trim() || '',
      status: 'pending'
    });
  }

  if (skippedRows > 0) {
    console.log(`Skipped ${skippedRows} invalid rows`);
  }

  return validRows;
};

/**
 * Parse a single CSV line handling quotes and commas properly
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current); // Add the last field
  return result;
};

// --- CORE LOGIC ---

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
    errorMessage.value = "Please select a valid .csv file.";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    csvData.value = e.target.result;
    previewData();
  };
  reader.onerror = () => {
    errorMessage.value = "Error reading file. Please try again.";
  };
  reader.readAsText(file);
};

const previewData = () => {
  errorMessage.value = '';
  if (!csvData.value.trim()) {
    errorMessage.value = "Please provide CSV data.";
    return;
  }

  try {
    parsedData.value = parseCSV(csvData.value);
    if (parsedData.value.length > 0) {
      showPreview.value = true;
    } else if (!errorMessage.value) {
      errorMessage.value = "No valid links found in the data. Please check the format.";
    }
  } catch (error) {
    errorMessage.value = "Error parsing CSV data: " + error.message;
  }
};

const processBulkUpload = async () => {
  errorMessage.value = '';

  if (parsedData.value.length === 0) {
    errorMessage.value = 'No links to upload. Please select or paste a CSV first.';
    return;
  }

  uploadState.value = 'uploading';
  currentUploadIndex.value = 0;
  results.value = [];

  // Initialize results with pending status for immediate UI feedback
  results.value = parsedData.value.map(link => ({ 
    ...link, 
    status: 'pending', 
    message: 'Waiting...' 
  }));

  // Test authentication first with a simple request
  try {
    const testResponse = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (testResponse.status === 401 || testResponse.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
  } catch (authError) {
    uploadState.value = 'idle';
    errorMessage.value = 'Authentication error: ' + authError.message;
    return;
  }

  // Process uploads with better error handling and rate limiting
  for (let i = 0; i < parsedData.value.length; i++) {
    const link = parsedData.value[i];
    currentUploadIndex.value = i + 1;

    // Update UI to show current item being processed
    results.value[i] = {
      ...link,
      status: 'pending',
      message: 'Processing...'
    };

    try {
      const requestBody = {
        url: link.url,
        ...(link.slug && { slug: link.slug }),
        ...(link.title && { title: link.title }),
        ...(link.expires && { expires_at: link.expires })
      };

      const response = await fetch('/api/link/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add CSRF token if available
          ...(window.csrf_token && { 'X-CSRF-TOKEN': window.csrf_token })
        },
        body: JSON.stringify(requestBody)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        let errorMessage = responseData.message || `HTTP ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Authentication expired';
        } else if (response.status === 403) {
          errorMessage = 'Access denied';
        } else if (response.status === 422) {
          errorMessage = 'Validation error: ' + (responseData.errors ? Object.values(responseData.errors).flat().join(', ') : responseData.message);
        } else if (response.status === 409) {
          errorMessage = 'Slug already exists';
        }
        
        throw new Error(errorMessage);
      }

      // Success case
      results.value[i] = {
        ...link,
        status: 'success',
        shortUrl: responseData.shortUrl || responseData.short_url || `https://go.alqasim.com/${responseData.slug}`,
        message: 'Created successfully'
      };

    } catch (error) {
      console.error('Upload error for', link.url, ':', error);
      
      results.value[i] = {
        ...link,
        status: 'error',
        message: error.message || 'Failed to create'
      };
    }
    
    // Rate limiting - small delay between requests
    if (i < parsedData.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  uploadState.value = 'completed';
};

// --- UTILITY METHODS ---

const downloadTemplate = () => {
  const template = [
    'url,slug,title,expires',
    'https://example.com,example-slug,Example Title,2024-12-31',
    'https://google.com,google,Google Search,',
    'https://github.com,gh,GitHub,2025-06-30'
  ].join('\n');
  
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bulk-upload-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportResults = () => {
  const headers = 'Original URL,Short URL,Status,Message\n';
  const csvContent = results.value.map(r => 
    `"${r.url}","${r.shortUrl || ''}","${r.status}","${r.message}"`
  ).join('\n');
  const csv = headers + csvContent;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bulk-upload-results-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const resetForm = () => {
  uploadState.value = 'idle';
  showPreview.value = false;
  csvData.value = '';
  results.value = [];
  parsedData.value = [];
  errorMessage.value = '';
  currentUploadIndex.value = 0;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>
