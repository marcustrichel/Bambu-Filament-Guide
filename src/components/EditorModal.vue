<script setup>
import { ref, computed, watch } from 'vue';
import { profileSchema, filamentSchema } from '@/constants/schemas';

const props = defineProps({
  item: Object,      // The profile or filament object being edited
  type: String,      // 'profile' or 'filament'
  isOwner: Boolean,  // Read-only check
  loading: Boolean   // Saving state
});

const emit = defineEmits(['close', 'save']);

// Create a local copy to avoid mutating props directly
const editingItem = ref(null);
const activeTab = ref('');

// Initialize local state when prop changes
watch(() => props.item, (newItem) => {
  if (newItem) {
    editingItem.value = JSON.parse(JSON.stringify(newItem));
    // Set default tab
    activeTab.value = props.type === 'profile' ? 'quality' : 'basic_settings';
  }
}, { immediate: true });

// Determine which schema to use
const currentSchema = computed(() => props.type === 'profile' ? profileSchema : filamentSchema);

// Generate tabs based on schema keys
const tabs = computed(() => {
  if (props.type === 'profile') {
    return [
      { key: 'quality', label: 'Quality' },
      { key: 'strength', label: 'Strength' },
      { key: 'speed', label: 'Speed' },
      { key: 'support', label: 'Support' },
      { key: 'others', label: 'Others' }
    ];
  } else {
    return [
      { key: 'basic_settings', label: 'Basic' },
      { key: 'temp_settings', label: 'Temps' },
      { key: 'cooling_settings', label: 'Cooling' },
      { key: 'override_settings', label: 'Overrides' }
    ];
  }
});

const activeTabLabel = computed(() => {
  const t = tabs.value.find(tab => tab.key === activeTab.value);
  return t ? t.label : '';
});

const handleSave = () => {
  emit('save', editingItem.value);
};
</script>

<template>
  <div v-if="editingItem" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transform transition-all">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div class="flex-1">
          <label class="block text-xs text-gray-500 uppercase font-bold mb-1">
            {{ type === 'profile' ? 'Profile Name' : 'Filament Name' }}
          </label>
          <div class="flex gap-4 items-center">
            <input 
              v-model="editingItem.name" 
              :disabled="!isOwner"
              class="text-xl font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none flex-1 pb-1"
              placeholder="Enter Name..."
            >
            <!-- Printer Selector (Profile Only) -->
            <div v-if="type === 'profile'" class="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
               <label class="text-xs text-gray-500 font-bold uppercase">Target:</label>
               <select v-model="editingItem.printer_model" :disabled="!isOwner" class="text-sm font-medium bg-transparent outline-none cursor-pointer">
                   <option value="A1 Mini">A1 Mini</option>
                   <option value="X1 Carbon">X1 Carbon</option>
               </select>
            </div>
          </div>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 ml-4 p-2">
          ✕
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 bg-white px-4 overflow-x-auto">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          class="py-3 px-6 text-sm font-medium capitalize whitespace-nowrap focus:outline-none transition-colors border-b-2"
          :class="activeTab === tab.key ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Form Content -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-bold text-gray-800 mb-6 capitalize border-b pb-2 flex items-center gap-2">
            {{ activeTabLabel }} Settings
            <span v-if="!isOwner" class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">Read Only</span>
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div v-for="field in currentSchema[activeTab]" :key="field.key" class="group">
              <label class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-emerald-600 transition-colors">
                {{ field.label }}
              </label>
              
              <div class="relative">
                <!-- Inputs based on type -->
                <input 
                  v-if="field.type === 'number'"
                  type="number"
                  v-model.number="editingItem[activeTab][field.key]"
                  :step="field.step || 1"
                  :disabled="!isOwner"
                  class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                
                <input 
                  v-if="field.type === 'text'"
                  type="text"
                  v-model="editingItem[activeTab][field.key]"
                  :disabled="!isOwner"
                  class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >

                <div v-if="field.type === 'color'" class="flex gap-2">
                   <input 
                      type="color"
                      v-model="editingItem[activeTab][field.key]"
                      :disabled="!isOwner"
                      class="h-9 w-12 rounded border p-0.5 cursor-pointer disabled:cursor-not-allowed"
                   >
                   <input 
                      type="text"
                      v-model="editingItem[activeTab][field.key]"
                      :disabled="!isOwner"
                      class="bambu-input flex-1 p-2 rounded text-gray-900 text-sm uppercase border border-gray-300"
                   >
                </div>
                
                <select 
                  v-else-if="field.type === 'select'"
                  v-model="editingItem[activeTab][field.key]"
                  :disabled="!isOwner"
                  class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 bg-white border border-gray-300"
                >
                  <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                
                <div v-else-if="field.type === 'boolean'" class="flex items-center h-10 bg-gray-50 rounded px-2 border border-gray-200">
                  <input 
                    type="checkbox"
                    v-model="editingItem[activeTab][field.key]"
                    :disabled="!isOwner"
                    class="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                  >
                  <span class="ml-2 text-sm font-medium" :class="editingItem[activeTab][field.key] ? 'text-emerald-600' : 'text-gray-500'">
                    {{ editingItem[activeTab][field.key] ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>

                <div v-if="field.suffix && field.type !== 'boolean'" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span class="text-gray-400 text-xs font-medium">{{ field.suffix }}</span>
                </div>
              </div>
              <p v-if="field.desc" class="mt-1 text-xs text-gray-400">{{ field.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors">
          Cancel
        </button>
        <button 
          v-if="isOwner" 
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