<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import guideMarkdown from '../../USER_GUIDE.md?raw';

// USER_GUIDE.md is a static file authored and reviewed as part of this
// codebase (not user-supplied content), so rendering it via v-html here
// carries no XSS risk beyond what any other hardcoded template markup would.
const guideHtml = computed(() => marked.parse(guideMarkdown));
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-800 mb-6">User Guide</h2>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div class="prose prose-emerald max-w-none" v-html="guideHtml"></div>
    </div>
  </div>
</template>
