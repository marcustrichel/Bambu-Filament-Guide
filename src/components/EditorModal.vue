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
const originalItemStr = ref('');

// Initialize local state when prop changes

watch(() => props.item, (newItem) => {

  if (newItem) {

    const str = JSON.stringify(newItem);

    originalItemStr.value = str;

    editingItem.value = JSON.parse(str);

    // Set default tab

    activeTab.value = props.type === 'profile' ? 'quality' : 'settings';

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

          { key: 'settings', label: 'Filament' },

          { key: 'cooling_settings', label: 'Cooling' },

          { key: 'override_settings', label: 'Overrides' },

          { key: 'scarf_seam', label: 'Scarf' }

        ];

  }

});



const activeTabLabel = computed(() => {

  const t = tabs.value.find(tab => tab.key === activeTab.value);

  return t ? t.label : '';

});



const activeFields = computed(() => {

  if (!currentSchema.value || !activeTab.value) return [];



  if (props.type === 'filament' && activeTab.value === 'settings') {

    return [

      ...(currentSchema.value.basic_settings || []).map(f => ({ ...f, scope: 'basic_settings' })),

      ...(currentSchema.value.temp_settings || []).map(f => ({ ...f, scope: 'temp_settings' }))

    ];

  }

  

  if (currentSchema.value[activeTab.value]) {

    return currentSchema.value[activeTab.value].map(f => ({ ...f, scope: activeTab.value }));

  }

  

  return [];

});





const handleSave = () => {

  emit('save', editingItem.value);

};



const copyStatus = ref(false);



const handleCopy = () => {

  if (copyStatus.value) return;



  const dataToCopy = JSON.stringify(editingItem.value, null, 2);

  navigator.clipboard.writeText(dataToCopy).then(() => {

    copyStatus.value = true;

    setTimeout(() => {

      copyStatus.value = false;

    }, 2000);

  }).catch(err => {

    console.error('Failed to copy text: ', err);

    // You could add user-facing error feedback here

  });

};



const handleClose = () => {

  if (props.isOwner && JSON.stringify(editingItem.value) !== originalItemStr.value) {

    if (!confirm('You have unsaved changes. Discard them?')) return;

  }

  emit('close');

};

</script>



<template>

  <div v-if="editingItem" @click.self="handleClose" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">

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

               <span class="text-sm font-bold text-gray-800">{{ editingItem.printer_model }}</span>

            </div>

          </div>

        </div>

        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 ml-4 p-2">

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
            <template v-for="field in activeFields" :key="field.key || field.label">
              <div v-if="field.type === 'heading'" class="col-span-1 md:col-span-2 lg:col-span-3 pt-4">
                <h4 class="text-md font-bold text-gray-600 border-b pb-1">{{ field.label }}</h4>
              </div>
              <div v-else class="group">
                <label class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span>{{ field.label }}</span>
                  <div v-if="field.desc" class="relative group flex items-center">
                    <svg class="w-4 h-4 text-gray-400 cursor-help" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-.532 0-1.036-.1-1.5-.29M12 21a9 9 0 110-18 9 9 0 010 18z"></path></svg>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                      {{ field.desc }}
                    </div>
                  </div>
                </label>
                
                <div class="relative">
                  <!-- Inputs based on type -->
                  <input 
                    v-if="field.type === 'number'"
                    type="number"
                    v-model.number="editingItem[field.scope][field.key]"
                    :step="field.step || 1"
                    :disabled="!isOwner"
                    class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                  
                  <input 
                    v-if="field.type === 'text'"
                    type="text"
                    v-model="editingItem[field.scope][field.key]"
                    :disabled="!isOwner"
                    class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >

                  <div v-if="field.type === 'color'" class="flex gap-2">
                    <input 
                        type="color"
                        v-model="editingItem[field.scope][field.key]"
                        :disabled="!isOwner"
                        class="h-9 w-12 rounded border p-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                    <input 
                        type="text"
                        v-model="editingItem[field.scope][field.key]"
                        :disabled="!isOwner"
                        class="bambu-input flex-1 p-2 rounded text-gray-900 text-sm uppercase border border-gray-300"
                    >
                  </div>
                  
                  <select 
                    v-else-if="field.type === 'select'"
                    v-model="editingItem[field.scope][field.key]"
                    :disabled="!isOwner"
                    class="bambu-input w-full p-2 rounded text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500 bg-white border border-gray-300"
                  >
                    <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  
                  <div v-else-if="field.type === 'boolean'" class="flex items-center h-10 bg-gray-50 rounded px-2 border border-gray-200">
                    <input 
                      type="checkbox"
                      v-model="editingItem[field.scope][field.key]"
                      :disabled="!isOwner"
                      class="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                    >
                    <span class="ml-2 text-sm font-medium" :class="editingItem[field.scope][field.key] ? 'text-emerald-600' : 'text-gray-500'">
                      {{ editingItem[field.scope][field.key] ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>

                  <div v-if="field.suffix && field.type !== 'boolean'" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span class="text-gray-400 text-xs font-medium">{{ field.suffix }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

        </div>

      </div>



      <!-- Footer -->

      <div class="p-4 border-t border-gray-200 bg-white flex justify-between items-center">

        <div>

          <button 

            @click="handleCopy"

            :disabled="copyStatus"

            class="px-4 py-2 border rounded font-medium transition-colors text-sm"

            :class="{ 

              'bg-gray-100 text-gray-400 cursor-not-allowed': copyStatus,

              'border-gray-300 text-gray-700 hover:bg-gray-50': !copyStatus

            }"

          >

            {{ copyStatus ? 'Copied!' : 'Copy JSON' }}

          </button>

        </div>

        <div class="flex gap-3">

          <button @click="handleClose" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors">

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

  </div>

</template>


