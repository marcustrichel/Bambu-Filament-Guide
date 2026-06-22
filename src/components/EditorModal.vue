<script setup>
import { ref, computed, watch } from 'vue';
import { profileSchema, filamentSchema } from '@/constants/schemas';

const props = defineProps({
  item: Object,      // The profile or filament object being edited
  type: String,      // 'profile' or 'filament'
  isOwner: Boolean,  // Read-only check
  loading: Boolean,  // Saving state
  profiles: Array    // Available profiles for linking
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
    activeTab.value = props.type === 'profile' ? 'quality' : 'filament_tab';
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
      { key: 'filament_tab', label: 'Filament' },
      { key: 'cooling_settings', label: 'Cooling' },
      { key: 'override_settings', label: 'Setting Overrides' },
      { key: 'advanced', label: 'Advanced' },
      { key: 'notes', label: 'Notes' },
      { key: 'multi_filament', label: 'Multi Filament' }
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

const handleClose = () => {
  if (props.isOwner && JSON.stringify(editingItem.value) !== originalItemStr.value) {
    if (!confirm('You have unsaved changes. Discard them?')) return;
  }
  emit('close');
};
</script>

<template>
  <div v-if="editingItem && type === 'profile'" @click.self="handleClose" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
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

            <!-- Profile Selector (Filament Only) -->
            <div v-if="type === 'filament'" class="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
               <label class="text-xs text-gray-500 font-bold uppercase">Profile:</label>
               <select v-model="editingItem.print_profile_id" :disabled="!isOwner" class="text-sm font-medium bg-transparent outline-none cursor-pointer max-w-[150px]">
                   <option :value="null">None</option>
                   <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
               </select>
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

  <!-- FILAMENT EDITOR (Custom Layout) -->
  <div v-else-if="editingItem && type === 'filament'" @click.self="handleClose" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 filament-wrapper">
    <div class="window">
        <!-- Header Area -->
        <div class="title-bar">
            <span class="title-text">Filament settings</span>
            <div class="window-controls">
                <div class="control-dot dot-min"></div>
                <div class="control-dot dot-max"></div>
                <div class="control-dot dot-close" @click="handleClose"></div>
            </div>
        </div>

        <div class="toolbar">
            <div class="dropdown-container">
                <!-- Using an input that looks like the dropdown for name editing -->
                <input v-model="editingItem.name" :disabled="!isOwner" type="text" style="border:none; width:100%; outline:none; background:transparent; font-size:13px;">
            </div>
            <span class="toolbar-icon" @click="handleSave" title="Save">💾</span>
            <span class="toolbar-icon">🔍</span>
            <div class="advanced-toggle">
                <span>Advanced</span>
                <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <div class="tabs">
            <div 
                v-for="tab in tabs" 
                :key="tab.key"
                class="tab" 
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
            >
                {{ tab.label }}
            </div>
        </div>

        <div class="wiki-row">
            <span>📖 Wiki</span>
        </div>

        <!-- Main Content -->
        <div class="scroll-container">
            
            <!-- TAB: FILAMENT (Aggregated View based on HTML provided) -->
            <div v-if="activeTab === 'filament_tab'">
                <!-- Basic Information -->
                <section>
                    <div class="section-header">
                        <span class="icon">⊞</span> Basic information
                    </div>
                    <div class="row">
                        <div class="label">Type</div>
                        <select v-model="editingItem.basic_settings.filament_type" :disabled="!isOwner || (editingItem.id && editingItem.basic_settings.filament_type)" class="content-select">
                            <option v-for="opt in ['PLA', 'PETG', 'ABS', 'ASA', 'PA', 'PC', 'TPU', 'PET', 'PVA', 'HIPS', 'PPS', 'PPA', 'PEI', 'PEEK', 'PEKK']" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                    </div>
                    <div class="row">
                        <div class="label">Vendor</div>
                        <input type="text" v-model="editingItem.basic_settings.vendor" :disabled="!isOwner">
                    </div>
                    <div class="row">
                        <div class="label">Default color</div>
                        <div class="color-preview" :style="{ backgroundColor: editingItem.basic_settings.color }">
                            <input type="color" v-model="editingItem.basic_settings.color" :disabled="!isOwner" class="opacity-0 w-full h-full cursor-pointer">
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">Diameter</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.basic_settings.diameter" :disabled="!isOwner" step="0.01">
                            <span class="unit">mm</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">Flow ratio</div>
                        <input type="number" v-model.number="editingItem.basic_settings.flow_ratio" :disabled="!isOwner" step="0.01">
                    </div>
                    <div class="row">
                        <div class="label">Density</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.basic_settings.density" :disabled="!isOwner" step="0.01">
                            <span class="unit">g/cm³</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">Shrinkage</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.basic_settings.shrinkage" :disabled="!isOwner">
                            <span class="unit">%</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="label">Softening temperature</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.basic_settings.softening_temp" :disabled="!isOwner" class="small-num">
                            <span class="unit">°C</span>
                        </div>
                    </div>

                    <!-- Complex Dual Rows -->
                    <div class="row" style="height: auto; align-items: flex-start; margin-top: 10px;">
                        <div class="label">Filament prime volume</div>
                        <div class="dual-inputs">
                            <div class="sub-group">
                                <div class="sub-label">Filament change<br>Extruder change</div>
                                <input type="number" v-model.number="editingItem.basic_settings.prime_vol_filament_change" :disabled="!isOwner" class="small-num">
                                <span class="unit">mm³</span>
                            </div>
                            <div class="sub-group">
                                <div class="sub-label">Hotend change<br>Hotend change</div>
                                <input type="number" v-model.number="editingItem.basic_settings.prime_vol_hotend_change" :disabled="!isOwner" class="small-num">
                                <span class="unit">mm³</span>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="label">Recommended nozzle temperature</div>
                        <div class="temp-pair">
                            <div class="pair-item">
                                <span class="pair-label" style="width: 30px">Min</span>
                                <input type="number" v-model.number="editingItem.temp_settings.nozzle_temp_min" :disabled="!isOwner" class="small-num">
                                <span class="unit">°C</span>
                            </div>
                            <div class="pair-item">
                                <span class="pair-label" style="width: 30px">Max</span>
                                <input type="number" v-model.number="editingItem.temp_settings.nozzle_temp_max" :disabled="!isOwner" class="small-num">
                                <span class="unit">°C</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Print Temperature -->
                <section>
                    <div class="section-header">
                        <span class="icon">🌡️</span> Print temperature
                    </div>
                    
                    <div class="row">
                        <div class="label">Cool Plate SuperTack</div>
                        <div class="temp-pair">
                            <div class="pair-item"><span class="pair-label">Initial layer</span> <input type="number" v-model.number="editingItem.temp_settings.cool_plate_super_initial" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                            <div class="pair-item"><span class="pair-label">Other layers</span> <input type="number" v-model.number="editingItem.temp_settings.cool_plate_super_other" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="label">Textured PEI Plate</div>
                        <div class="temp-pair">
                            <div class="pair-item"><span class="pair-label">Initial layer</span> <input type="number" v-model.number="editingItem.temp_settings.textured_pei_initial" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                            <div class="pair-item"><span class="pair-label">Other layers</span> <input type="number" v-model.number="editingItem.temp_settings.textured_pei_other" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="label">Nozzle</div>
                        <div class="temp-pair">
                            <div class="pair-item"><span class="pair-label">Initial layer</span> <input type="number" v-model.number="editingItem.temp_settings.first_layer_nozzle" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                            <div class="pair-item"><span class="pair-label">Other layers</span> <input type="number" v-model.number="editingItem.temp_settings.other_layers_nozzle" :disabled="!isOwner" class="small-num"> <span class="unit">°C</span></div>
                        </div>
                    </div>
                </section>

                <!-- Volumetric speed -->
                <section>
                    <div class="section-header">
                        <span class="icon">📊</span> Volumetric speed limitation
                    </div>
                    <div class="row">
                        <div class="label">Adaptive volumetric speed</div>
                        <input type="checkbox" v-model="editingItem.override_settings.adaptive_volumetric_speed" :disabled="!isOwner">
                    </div>
                    <div class="row">
                        <div class="label">Max volumetric speed</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.override_settings.max_volumetric_speed" :disabled="!isOwner">
                            <span class="unit">mm³/s</span>
                        </div>
                    </div>
                </section>

                <!-- Scarf Seam -->
                <section>
                    <div class="section-header">
                        <span class="icon">📋</span> Filament scarf seam settings
                    </div>
                    <div class="row">
                        <div class="label">Scarf seam type</div>
                        <select v-model="editingItem.scarf_seam.scarf_seam_type" :disabled="!isOwner" class="content-select">
                            <option v-for="opt in ['none', 'outer', 'inner', 'both']" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                    </div>
                    <div class="row">
                        <div class="label">Scarf length</div>
                        <div class="input-group">
                            <input type="number" v-model.number="editingItem.scarf_seam.scarf_length" :disabled="!isOwner">
                            <span class="unit">mm</span>
                        </div>
                    </div>
                </section>
            </div>

            <!-- COOLING SETTINGS TAB -->
            <div v-else-if="activeTab === 'cooling_settings'">
                <section>
                    <div class="section-header"><span class="icon">🌬️</span> Part Cooling Fan</div>
                    <template v-for="field in currentSchema.cooling_settings" :key="field.key || field.label">
                        <div v-if="field.type !== 'heading' && field.type !== 'group'" class="row">
                            <div class="label">{{ field.label }}</div>
                            <div v-if="field.type === 'number'" class="input-group">
                                <input type="number" v-model.number="editingItem.cooling_settings[field.key]" :disabled="!isOwner" :step="field.step || 1" class="small-num">
                                <span class="unit">{{ field.suffix || '' }}</span>
                            </div>
                            <input v-else-if="field.type === 'boolean'" type="checkbox" v-model="editingItem.cooling_settings[field.key]" :disabled="!isOwner">
                        </div>
                        <p v-if="field.desc && field.type !== 'heading'" class="desc-text">{{ field.desc }}</p>
                    </template>
                </section>
            </div>

            <!-- SETTING OVERRIDES TAB -->
            <div v-else-if="activeTab === 'override_settings'">
                <section>
                    <div class="section-header"><span class="icon">⚙️</span> Volumetric Speed</div>
                    <template v-for="field in currentSchema.override_settings.filter(f => ['adaptive_volumetric_speed','max_volumetric_speed','ramming_vol_extruder_change','ramming_vol_hotend_change'].includes(f.key))" :key="field.key">
                        <div class="row">
                            <div class="label">{{ field.label }}</div>
                            <div v-if="field.type === 'number'" class="input-group">
                                <input type="number" v-model.number="editingItem.override_settings[field.key]" :disabled="!isOwner" :step="field.step || 1" class="small-num">
                                <span class="unit">{{ field.suffix || '' }}</span>
                            </div>
                            <input v-else-if="field.type === 'boolean'" type="checkbox" v-model="editingItem.override_settings[field.key]" :disabled="!isOwner">
                        </div>
                        <p v-if="field.desc" class="desc-text">{{ field.desc }}</p>
                    </template>
                </section>
                <section>
                    <div class="section-header"><span class="icon">🔄</span> Retraction &amp; Travel</div>
                    <template v-for="field in currentSchema.override_settings.filter(f => ['retraction_length','z_hop','wipe_distance'].includes(f.key))" :key="field.key">
                        <div class="row">
                            <div class="label">{{ field.label }}</div>
                            <div class="input-group">
                                <input type="number" v-model.number="editingItem.override_settings[field.key]" :disabled="!isOwner" :step="field.step || 0.1" class="small-num">
                                <span class="unit">{{ field.suffix || '' }}</span>
                            </div>
                        </div>
                        <p v-if="field.desc" class="desc-text">{{ field.desc }}</p>
                    </template>
                </section>
                <section>
                    <div class="section-header"><span class="icon">📈</span> Flow Dynamics</div>
                    <template v-for="field in currentSchema.override_settings.filter(f => ['pressure_advance'].includes(f.key))" :key="field.key">
                        <div class="row">
                            <div class="label">{{ field.label }}</div>
                            <div class="input-group">
                                <input type="number" v-model.number="editingItem.override_settings[field.key]" :disabled="!isOwner" :step="field.step || 0.001" class="small-num">
                            </div>
                        </div>
                        <p v-if="field.desc" class="desc-text">{{ field.desc }}</p>
                    </template>
                </section>
            </div>

            <!-- NOTES TAB -->
            <div v-else-if="activeTab === 'notes'">
                <section>
                    <div class="section-header"><span class="icon">📝</span> Notes</div>
                    <textarea
                        v-model="editingItem.notes"
                        :disabled="!isOwner"
                        placeholder="Add notes about this filament — print tips, calibration values, ideal use cases, quirks, etc."
                        class="notes-area"
                    ></textarea>
                </section>
            </div>

            <!-- OTHER TABS (Placeholder) -->
            <div v-else class="p-4 text-gray-500 text-center">
                <p>Settings for {{ activeTabLabel }} are not yet implemented in this view.</p>
            </div>

        </div>
    </div>
  </div>
</template>

<style scoped>
    .filament-wrapper {
        --text-color: #333;
        --border-color: #d8d8d8;
        --bg-color: #fcfcfc;
        --input-bg: #fff;
        --input-border: #ccc;
        --accent-green: #1a7f37;
        --accent-blue: #0969da;
        --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        
        /* New variables from provided CSS */
        --bg-main: #fcfcfc;
        --bg-header: #f3f3f3;
        --text-main: #333333;
        --text-muted: #666666;
        --accent-green: #2d8a45;
        --accent-blue: #0066cc;
        --input-bg: #ffffff;
        --input-border: #cccccc;
        --font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

        font-family: var(--font-stack);
        font-size: 13px;
        color: var(--text-main);
    }

    .window {
        width: 100%;
        max-width: 900px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 90vh; /* Keep this to ensure it fits in modal */
    }

    /* Title Bar */
    .title-bar {
        height: 32px;
        background: var(--bg-header);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        padding: 0 12px;
        justify-content: space-between;
    }

    .title-text {
        font-size: 12px;
        color: var(--text-muted);
    }

    .window-controls {
        display: flex;
        gap: 8px;
    }

    .control-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    .dot-close { background: #ff5f56; cursor: pointer; }
    .dot-min { background: #ffbd2e; }
    .dot-max { background: #27c93f; }

    /* Navigation / Toolbar */
    .toolbar {
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .dropdown-container {
        flex-grow: 1;
        display: flex;
        align-items: center;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        padding: 4px 8px;
        background: var(--input-bg);
    }

    .toolbar-icon {
        cursor: pointer;
        opacity: 0.7;
        font-size: 16px;
    }

    .advanced-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 32px;
        height: 18px;
    }

    .toggle-switch input { opacity: 0; width: 0; height: 0; }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #ccc;
        transition: .2s;
        border-radius: 18px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 14px; width: 14px;
        left: 2px; bottom: 2px;
        background-color: white;
        transition: .2s;
        border-radius: 50%;
    }

    input:checked + .slider { background-color: var(--accent-green); }
    input:checked + .slider:before { transform: translateX(14px); }

    /* Tabs */
    .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        padding: 0 16px;
    }

    .tab {
        padding: 10px 16px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        color: var(--text-muted);
        font-weight: 500;
    }

    .tab.active {
        color: var(--accent-green);
        border-bottom-color: var(--accent-green);
    }

    .wiki-row {
        padding: 8px 16px;
        font-size: 12px;
        color: var(--accent-blue);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* Scrollable Content */
    .scroll-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 16px;
        background: white;
    }

    section {
        margin-bottom: 24px;
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 16px;
        font-weight: 600;
    }

    .row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        min-height: 28px;
    }

    .label {
        width: 200px;
        color: var(--text-muted);
        flex-shrink: 0;
    }

    .input-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-grow: 1;
    }

    input[type="text"], input[type="number"], select.content-select {
        border: 1px solid var(--input-border);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 13px;
        width: 140px;
        height: 28px;
    }

    select.content-select {
        background-color: #f8f8f8;
    }

    .unit {
        color: #999;
        width: 60px;
        font-size: 11px;
    }

    .color-preview {
        width: 140px;
        height: 28px;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        background: linear-gradient(to top right, transparent calc(50% - 1px), #d26464, transparent calc(50% + 1px));
        cursor: pointer;
    }

    /* Grid / Dual Input Styling */
    .dual-inputs {
        display: flex;
        gap: 40px;
        width: 100%;
    }

    .sub-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .sub-label {
        font-size: 11px;
        color: #777;
        width: 100px;
        line-height: 1.2;
    }

    .temp-pair {
        display: flex;
        gap: 20px;
    }

    .pair-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .pair-label {
        font-size: 11px;
        color: #888;
        width: 70px;
    }

    input.small-num {
        width: 60px;
        text-align: center;
    }

    .disabled-input {
        background-color: #f0f0f0;
        color: #aaa;
    }

    .desc-text {
        font-size: 11px;
        color: #999;
        margin: 0 0 8px 200px;
        line-height: 1.4;
    }

    .notes-area {
        width: 100%;
        min-height: 220px;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        padding: 10px;
        font-size: 13px;
        font-family: var(--font-stack);
        resize: vertical;
        color: var(--text-main);
    }

    .notes-area:disabled { background: #f8f8f8; color: #aaa; }

    /* Icons (Simplified SVG/Unicode) */
    .icon { width: 16px; text-align: center; }
</style>