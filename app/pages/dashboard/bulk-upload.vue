<template>
  <div class="bulk-upload-page">
    <BulkUpload />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>
