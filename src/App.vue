<script setup>
import { ref, reactive, onMounted } from 'vue';
import { initSupabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal.vue';
import EditorModal from '@/components/EditorModal.vue';

// --- State ---
const config = reactive({ url: '', key: '' });
const tempConfig = reactive({ url: '', key: '' });
const user = ref(null);
const profiles = ref([]);
const filaments = ref([]);
const printers = ref([]);
const favorites = ref([]);

const currentView = ref('profiles');
const editingItem = ref(null);
const editorType = ref('profile'); // 'profile' or 'filament'
const showAuthModal = ref(false);
const loading = ref(false);

let supabase = null;

// --- Lifecycle ---
onMounted(() => {
  const savedUrl = localStorage.getItem('bambu_sb_url');
  const savedKey = localStorage.getItem('bambu_sb_key');
  if (savedUrl && savedKey) {
    config.url = savedUrl;
    config.key = savedKey;
    initializeSupabase();
  }
});

// --- Config & Init ---
const saveConfig = () => {
  if (!tempConfig.url || !tempConfig.key) return alert('Please enter both.');
  config.url = tempConfig.url;
  config.key = tempConfig.key;
  localStorage.setItem('bambu_sb_url', tempConfig.url);
  localStorage.setItem('bambu_sb_key', tempConfig.key);
  initializeSupabase();
};

const initializeSupabase = async () => {
  try {
    supabase = initSupabase(config.url, config.key);
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    user.value = session?.user || null;

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
      if (user.value) loadUserData();
    });

    loadData();
  } catch (e) {
    console.error("Init Error:", e);
  }
};

// --- Data Loading ---
const loadData = async () => {
  loading.value = true;
  // Load Profiles
  const { data: pData } = await supabase.from('print_profiles').select('*').order('created_at', { ascending: false });
  profiles.value = pData || [];
  // Load Filaments
  const { data: fData } = await supabase.from('filaments').select('*').order('created_at', { ascending: false });
  filaments.value = fData || [];
  // Load Printers
  const { data: prData } = await supabase.from('printers').select('*');
  printers.value = prData || [];

  if (user.value) loadUserData();
  loading.value = false;
};

const loadUserData = async () => {
  const { data } = await supabase.from('favorites').select('print_profile_id, filament_id').eq('user_id', user.value.id);
  if (data) favorites.value = data;
};

// --- Auth ---
const handleAuth = async ({ mode, email, password }) => {
  if (!email || !password) return;
  let error;
  if (mode === 'signin') {
    const res = await supabase.auth.signInWithPassword({ email, password });
    error = res.error;
  } else {
    const res = await supabase.auth.signUp({ email, password });
    error = res.error;
  }
  
  if (error) alert(error.message);
  else showAuthModal.value = false;
};

const signOut = async () => {
  await supabase.auth.signOut();
  favorites.value = [];
};

// --- Helpers ---
const isOwner = (item) => user.value && item.user_id === user.value.id;

const isFavorite = (id, type) => {
  if (type === 'profile') return favorites.value.some(f => f.print_profile_id === id);
  return false;
};

const toggleFavorite = async (id, type) => {
  if (!user.value) return showAuthModal.value = true;
  if (isFavorite(id, type)) {
    await supabase.from('favorites').delete().eq('user_id', user.value.id).eq('print_profile_id', id);
    favorites.value = favorites.value.filter(f => f.print_profile_id !== id);
  } else {
    await supabase.from('favorites').insert({ user_id: user.value.id, print_profile_id: id });
    favorites.value.push({ user_id: user.value.id, print_profile_id: id });
  }
};

// --- CRUD Actions ---
const openEditor = (item, type) => {
  editingItem.value = item;
  editorType.value = type;
};

const createNewProfile = () => {
  const newP = {
    user_id: user.value.id,
    name: 'New Profile',
    printer_model: 'A1 Mini',
    quality: { layer_height: 0.2, seam_position: 'aligned', wall_generator: 'arachne', precision_walls: true },
    strength: { wall_loops: 2, top_shell_layers: 3, bottom_shell_layers: 3, sparse_infill_density: 15, sparse_infill_pattern: 'grid' },
    speed: { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 5000 },
    support: { enable: false, type: 'tree', style: 'tree_slim', threshold_angle: 30 },
    others: { brim_type: 'auto', brim_width: 5, skirt_loops: 0 }
  };
  openEditor(newP, 'profile');
};

const createNewFilament = () => {
  const newF = {
    user_id: user.value.id,
    name: 'New Filament',
    basic_settings: { brand: 'Generic', material: 'PLA', color: '#000000', density: 1.24, price: 20 },
    temp_settings: { nozzle_min: 190, nozzle_max: 230, first_layer_nozzle: 220, other_layers_nozzle: 220, first_layer_bed: 65, other_layers_bed: 65, vitrification_temp: 55 },
    cooling_settings: { min_fan_speed: 100, max_fan_speed: 100, min_layer_time: 8, fan_always_on: true, aux_fan_speed: 0 },
    override_settings: { max_volumetric_speed: 15, retraction_length: 0.8, z_hop: 0.4 }
  };
  openEditor(newF, 'filament');
};

const cloneProfile = async (original) => {
  if (!confirm(`Clone "${original.name}" to your library?`)) return;
  const { id, created_at, user_id, ...data } = original;
  data.user_id = user.value.id;
  data.name = `${original.name} (Copy)`;
  
  const { data: inserted, error } = await supabase.from('print_profiles').insert(data).select().single();
  if (!error) {
    profiles.value.unshift(inserted);
    openEditor(inserted, 'profile');
  }
};

const handleSaveItem = async (itemToSave) => {
  loading.value = true;
  const table = editorType.value === 'profile' ? 'print_profiles' : 'filaments';
  
  // Construct payload
  let payload = { name: itemToSave.name };
  if (editorType.value === 'profile') {
    payload = { 
      ...payload, 
      printer_model: itemToSave.printer_model,
      quality: itemToSave.quality, 
      strength: itemToSave.strength, 
      speed: itemToSave.speed, 
      support: itemToSave.support,
      others: itemToSave.others
    };
  } else {
    payload = { 
      ...payload, 
      basic_settings: itemToSave.basic_settings, 
      temp_settings: itemToSave.temp_settings, 
      cooling_settings: itemToSave.cooling_settings, 
      override_settings: itemToSave.override_settings 
    };
  }

  let res;
  if (itemToSave.id) {
    res = await supabase.from(table).update(payload).eq('id', itemToSave.id).select().single();
  } else {
    // For new items, we include the full object (which has user_id) + payload
    res = await supabase.from(table).insert({ ...itemToSave, ...payload }).select().single();
  }

  if (res.error) {
    alert('Error saving: ' + res.error.message);
  } else {
    const targetList = editorType.value === 'profile' ? profiles : filaments;
    const idx = targetList.value.findIndex(p => p.id === res.data.id);
    if (idx >= 0) targetList.value[idx] = res.data;
    else targetList.value.unshift(res.data);
    editingItem.value = null; // Close Modal
  }
  loading.value = false;
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
    
    <!-- Config Screen -->
    <div v-if="!config.url || !config.key" class="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Connect to Supabase</h2>
        <div class="space-y-4">
          <input v-model="tempConfig.url" type="text" placeholder="Project URL" class="w-full p-2 border rounded">
          <input v-model="tempConfig.key" type="password" placeholder="Anon Public Key" class="w-full p-2 border rounded">
          <button @click="saveConfig" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded">Connect</button>
        </div>
      </div>
    </div>

    <!-- Main UI -->
    <div v-else class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col z-10 hidden md:flex">
        <div class="p-6 border-b border-gray-100">
          <h1 class="text-xl font-bold text-emerald-600 flex items-center gap-2">BambuDB</h1>
        </div>
        <nav class="flex-1 p-4 space-y-1">
          <button @click="currentView='profiles'" :class="currentView==='profiles' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'" class="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span class="mr-3">📄</span> Print Profiles
          </button>
          <button @click="currentView='filaments'" :class="currentView==='filaments' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'" class="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span class="mr-3">🧶</span> Filaments
          </button>
          <button @click="currentView='printers'" :class="currentView==='printers' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'" class="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span class="mr-3">🖨️</span> Printers
          </button>
        </nav>
        <div class="p-4 border-t border-gray-200">
          <div v-if="user" class="flex flex-col gap-2">
            <div class="text-sm font-medium text-gray-800 truncate" :title="user.email">{{ user.email }}</div>
            <button @click="signOut" class="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-600 hover:bg-gray-100">Sign Out</button>
          </div>
          <div v-else>
            <button @click="showAuthModal = true" class="w-full bg-emerald-600 text-white text-sm py-2 rounded hover:bg-emerald-700">Sign In / Up</button>
          </div>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
        
        <!-- PROFILES -->
        <div v-if="currentView === 'profiles'">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Print Profiles</h2>
            <button v-if="user" @click="createNewProfile" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"><span>+</span> New Profile</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="profile in profiles" :key="profile.id" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div class="p-5 flex-1">
                <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg text-gray-900 mb-1 truncate">{{ profile.name }}</h3>
                  <button @click="toggleFavorite(profile.id, 'profile')" :class="isFavorite(profile.id, 'profile') ? 'text-yellow-400' : 'text-gray-300'" class="hover:text-yellow-500 text-xl">★</button>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{{ isOwner(profile) ? 'My Profile' : 'Community' }}</span>
                  <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">{{ profile.printer_model }}</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div class="flex justify-between"><span>Layer Height:</span> <span class="font-medium text-gray-900">{{ profile.quality?.layer_height || '0.2' }}mm</span></div>
                  <div class="flex justify-between"><span>Accel:</span> <span class="font-medium text-gray-900">{{ profile.speed?.acceleration || '5000' }}</span></div>
                </div>
              </div>
              <div class="bg-gray-50 p-3 px-5 border-t border-gray-100 flex justify-between items-center">
                <button @click="openEditor(profile, 'profile')" class="text-emerald-600 font-medium text-sm hover:underline">{{ isOwner(profile) ? 'Edit' : 'View' }} Settings</button>
                <button v-if="user && !isOwner(profile)" @click="cloneProfile(profile)" class="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">Fork</button>
              </div>
            </div>
          </div>
        </div>

        <!-- FILAMENTS -->
        <div v-if="currentView === 'filaments'">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Filaments</h2>
            <button v-if="user" @click="createNewFilament" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"><span>+</span> New Filament</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="fil in filaments" :key="fil.id" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="h-3 w-full border-b border-gray-100" :style="{ backgroundColor: fil.basic_settings?.color || '#ccc' }"></div>
              <div class="p-5">
                <h3 class="font-bold text-lg text-gray-900 truncate">{{ fil.name }}</h3>
                <div class="text-sm text-gray-500 mb-4">{{ fil.basic_settings?.brand || 'Generic' }}</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="bg-orange-50 p-2 rounded text-center border border-orange-100">
                    <div class="text-xs text-orange-600 font-bold mb-1">Nozzle</div>
                    <div class="font-mono text-gray-800 font-bold">{{ fil.temp_settings?.first_layer_nozzle }}°C</div>
                  </div>
                  <div class="bg-blue-50 p-2 rounded text-center border border-blue-100">
                    <div class="text-xs text-blue-600 font-bold mb-1">Fan</div>
                    <div class="font-mono text-gray-800 font-bold">{{ fil.cooling_settings?.max_fan_speed }}%</div>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                   <button @click="openEditor(fil, 'filament')" class="text-emerald-600 font-medium text-sm hover:underline">{{ isOwner(fil) ? 'Edit' : 'View' }} Parameters</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PRINTERS -->
        <div v-if="currentView === 'printers'">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Printers</h2>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table class="w-full text-left text-sm text-gray-600">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="p-4 font-semibold text-gray-900">Name</th>
                  <th class="p-4 font-semibold text-gray-900">Model</th>
                  <th class="p-4 font-semibold text-gray-900">Bed Size</th>
                  <th class="p-4 font-semibold text-gray-900">Nozzle</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="printer in printers" :key="printer.id" class="hover:bg-gray-50">
                  <td class="p-4 font-medium text-gray-900">{{ printer.name }}</td>
                  <td class="p-4"><span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">{{ printer.model }}</span></td>
                  <td class="p-4">{{ printer.bed_size_x }} x {{ printer.bed_size_y }} mm</td>
                  <td class="p-4">{{ printer.nozzle_diameter }} mm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>

    <!-- Modals -->
    <AuthModal 
      :isOpen="showAuthModal" 
      @close="showAuthModal = false" 
      @authenticate="handleAuth" 
    />

    <EditorModal 
      v-if="editingItem"
      :item="editingItem" 
      :type="editorType"
      :isOwner="isOwner(editingItem)"
      :loading="loading"
      @close="editingItem = null"
      @save="handleSaveItem"
    />

  </div>
</template>