<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  printer: Object,   // The printer being edited (or a fresh one for create)
  profiles: Array,   // Available print profiles to pick a default from
  loading: Boolean,
});

const emit = defineEmits(['close', 'save']);

const PRINTER_MODELS = ['A1 Mini', 'A1', 'P1P', 'P1S', 'X1', 'X1 Carbon', 'X1E'];

const editingPrinter = ref(null);
const originalPrinterStr = ref('');

watch(() => props.printer, (newPrinter) => {
  if (newPrinter) {
    const str = JSON.stringify(newPrinter);
    originalPrinterStr.value = str;
    editingPrinter.value = JSON.parse(str);
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', editingPrinter.value);
};

const handleClose = () => {
  if (JSON.stringify(editingPrinter.value) !== originalPrinterStr.value) {
    if (!confirm('You have unsaved changes. Discard them?')) return;
  }
  emit('close');
};
</script>

<template>
  <div v-if="editingPrinter" @click.self="handleClose" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 class="text-lg font-bold text-gray-900">{{ editingPrinter.id ? 'Edit Printer' : 'New Printer' }}</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 p-1">✕</button>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label for="printer-name" class="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
          <input
            id="printer-name"
            v-model="editingPrinter.name"
            type="text"
            class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>

        <div>
          <label for="printer-model" class="block text-xs font-bold text-gray-500 uppercase mb-1">Model</label>
          <select
            id="printer-model"
            v-model="editingPrinter.model"
            class="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option v-for="m in PRINTER_MODELS" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="printer-nozzle" class="block text-xs font-bold text-gray-500 uppercase mb-1">Nozzle</label>
            <input
              id="printer-nozzle"
              v-model.number="editingPrinter.nozzle_diameter"
              type="number" step="0.1" min="0.01"
              class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
          </div>
          <div>
            <label for="printer-bed-x" class="block text-xs font-bold text-gray-500 uppercase mb-1">Bed X</label>
            <input
              id="printer-bed-x"
              v-model.number="editingPrinter.bed_size_x"
              type="number" min="1"
              class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
          </div>
          <div>
            <label for="printer-bed-y" class="block text-xs font-bold text-gray-500 uppercase mb-1">Bed Y</label>
            <input
              id="printer-bed-y"
              v-model.number="editingPrinter.bed_size_y"
              type="number" min="1"
              class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
          </div>
        </div>

        <div>
          <label for="printer-default-profile" class="block text-xs font-bold text-gray-500 uppercase mb-1">Default Print Profile</label>
          <select
            id="printer-default-profile"
            v-model="editingPrinter.default_print_profile_id"
            class="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option :value="null">None</option>
            <option v-for="p in profiles" :key="p.id" :value="p.id">
              {{ p.name }}{{ p.printer_model ? ` (${p.printer_model})` : '' }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-400">Used as the starting point when you print on this machine.</p>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
        <button @click="handleClose" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors">
          Cancel
        </button>
        <button
          @click="handleSave"
          class="px-6 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 shadow-sm flex items-center transition-colors"
          :disabled="loading"
        >
          <span v-if="loading" class="animate-spin mr-2">⟳</span>
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>
