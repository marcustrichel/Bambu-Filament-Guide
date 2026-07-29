<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal.vue';
import ResetPasswordModal from '@/components/ResetPasswordModal.vue';
import EditorModal from '@/components/EditorModal.vue';
import PrinterModal from '@/components/PrinterModal.vue';
import UserEditModal from '@/components/UserEditModal.vue';

// --- State ---
const user = ref(null);
const myProfile = ref(null); // this user's own user_profiles row (role, disabled, etc.)
const profiles = ref([]);
const filaments = ref([]);
const printers = ref([]);
const favorites = ref([]);
const printerModels = ref([]);
const modelUsage = ref({}); // { [modelName]: boolean } — whether a model is still referenced anywhere
const users = ref([]); // user_profiles rows, loaded only for elevated/admin
const userSearchQuery = ref('');
const searchQuery = ref('');
const searchScope = ref('both'); // 'profiles' | 'filaments' | 'both'

const currentView = ref('profiles');
const editingItem = ref(null);
const editorType = ref('profile'); // 'profile' or 'filament'
const editingPrinter = ref(null);
const editingUser = ref(null);
const showAuthModal = ref(false);
const showResetPasswordModal = ref(false);
const loading = ref(false);
const newModelName = ref('');

const printerModelNames = computed(() => printerModels.value.map(m => m.name));
const myRole = computed(() => myProfile.value?.role || 'standard');
const canManageUsers = computed(() => ['elevated', 'admin'].includes(myRole.value));
const canWrite = computed(() => !!user.value && !myProfile.value?.disabled);
const filteredUsers = computed(() => {
  const q = userSearchQuery.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter(u =>
    u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q)
  );
});

const isSearching = computed(() => searchQuery.value.trim().length > 0);
const searchResultsProfiles = computed(() => {
  if (searchScope.value === 'filaments') return [];
  const q = searchQuery.value.trim().toLowerCase();
  return profiles.value.filter(p => p.name?.toLowerCase().includes(q));
});
const searchResultsFilaments = computed(() => {
  if (searchScope.value === 'profiles') return [];
  const q = searchQuery.value.trim().toLowerCase();
  return filaments.value.filter(f => f.name?.toLowerCase().includes(q));
});

// --- Lifecycle ---
onMounted(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    user.value = session?.user || null;
    if (user.value) loadUserData();
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      showResetPasswordModal.value = true;
      return;
    }
    user.value = session?.user || null;
    if (user.value) loadUserData();
  });

  loadData();
});

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
  // Load Printer Models + their usage
  const { data: pmData } = await supabase.from('printer_models').select('*').order('name');
  printerModels.value = pmData || [];
  await loadModelUsage();

  if (user.value) loadUserData();
  loading.value = false;
};

const loadModelUsage = async () => {
  const { data } = await supabase.rpc('printer_model_usage');
  modelUsage.value = Object.fromEntries((data || []).map(row => [row.name, row.in_use]));
};

const loadUserData = async () => {
  const { data } = await supabase.from('favorites').select('print_profile_id, filament_id').eq('user_id', user.value.id);
  if (data) favorites.value = data;

  const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.value.id).single();
  myProfile.value = profileData || null;

  if (canManageUsers.value) await loadUsers();
};

const loadUsers = async () => {
  const { data } = await supabase.from('user_profiles').select('*').order('email');
  users.value = data || [];
};

// --- Auth ---
const handleAuth = async ({ mode, email, password }) => {
  if (!email || !password) return;
  let error;
  if (mode === 'signin') {
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    error = err;
  } else {
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    error = err;
    if (!error) {
      if (data && !data.session) {
        alert('Registration successful! Please check your email to confirm your account.');
      }
    }
  }
  
  if (error) alert(error.message);
  else showAuthModal.value = false;
};

const handleForgotPassword = async ({ email }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) alert(error.message);
  else {
    alert('Password reset email sent! Check your inbox for a link.');
    showAuthModal.value = false;
  }
};

const handleResetPassword = async ({ password }) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) alert(error.message);
  else {
    alert('Password updated successfully.');
    showResetPasswordModal.value = false;
  }
};

const signOut = async () => {
  await supabase.auth.signOut();
  favorites.value = [];
  myProfile.value = null;
  users.value = [];
};

// --- Helpers ---
// A disabled account is treated as read-only even for its own data — RLS
// rejects the writes regardless, this just keeps the UI honest about it.
const isOwner = (item) => user.value && item.user_id === user.value.id && !myProfile.value?.disabled;

const isFavorite = (id, type) => {
  if (type === 'profile') return favorites.value.some(f => f.print_profile_id === id);
  return false;
};

const toggleFavorite = async (id, type) => {
  if (!user.value) return showAuthModal.value = true;
  if (myProfile.value?.disabled) return alert('Your account is disabled.');
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
    quality: { layer_height: 0.2, first_layer_height: 0.2, outer_wall_line_width: 0.42, seam_position: 'aligned', wall_generator: 'arachne', ironing_type: 'no_ironing', precision_walls: true },
    strength: { wall_loops: 2, top_shell_layers: 3, bottom_shell_layers: 3, sparse_infill_density: 15, sparse_infill_pattern: 'grid', top_surface_pattern: 'monotonic', bottom_surface_pattern: 'monotonic', detect_overhang_wall: true },
    speed: { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 5000 },
    support: { enable: false, type: 'tree', style: 'tree_slim', threshold_angle: 30 },
    others: { brim_type: 'auto', brim_width: 5, skirt_loops: 0, elephant_foot_compensation: 0.0 }
  };
  openEditor(newP, 'profile');
};

const createNewFilament = () => {
  const newF = {
    user_id: user.value.id,
    name: 'New Generic PLA',
    print_profile_id: profiles.value[0]?.id ?? null,
    basic_settings: {
      filament_type: 'PLA',
      vendor: 'Overture',
      color: '#000000',
      diameter: 1.75,
      flow_ratio: 0.98,
      density: 1.22,
      shrinkage: 100,
      velocity_adaptation: 1,
      price: 24.52,
      softening_temp: 45,
      prime_vol_filament_change: 45,
      prime_vol_hotend_change: 45,
      ramming_len_extruder_change: 4.5,
      ramming_len_hotend_change: 4.5,
      travel_time_ramming_extruder: 250,
      travel_time_ramming_hotend: 250,
      precool_temp_extruder: 140,
      precool_temp_hotend: 140,
      idle_temp: 0,
    },
    temp_settings: {
      nozzle_temp_min: 190,
      nozzle_temp_max: 230,
      cool_plate_super_initial: 35,
      cool_plate_super_other: 35,
      cool_plate_initial: 35,
      cool_plate_other: 35,
      eng_plate_initial: 55,
      eng_plate_other: 55,
      smooth_pei_initial: 55,
      smooth_pei_other: 55,
      textured_pei_initial: 55,
      textured_pei_other: 55,
      first_layer_nozzle: 220,
      other_layers_nozzle: 220,
      vitrification_temp: 60,
    },
    cooling_settings: {
      close_fan_first_x_layers: 1,
      initial_fan_speed: 0,
      full_fan_speed_layer: 0,
      min_fan_speed: 60,
      min_fan_speed_layer_time: 80,
      max_fan_speed: 80,
      max_fan_speed_layer_time: 6,
      fan_always_on: true,
      slow_down_for_cooling: true,
      dont_slow_down_outer_walls: false,
      slow_print_speed: 20,
      force_cooling_for_overhangs: true,
      overhang_cooling_threshold: 50,
      overhang_participating_threshold: 100,
      overhang_fan_speed: 100,
      pre_start_fan_time: 2,
      ironing_fan_speed: -1,
      aux_close_fan_first_x_layers: 1,
      aux_initial_fan_speed: 0,
      aux_full_fan_speed_layer: 0,
      aux_fan_speed: 70,
    },
    override_settings: {
      adaptive_volumetric_speed: true,
      max_volumetric_speed: 12,
      ramming_vol_extruder_change: 12,
      ramming_vol_hotend_change: 12,
      retraction_length: 0.8,
      z_hop: 0.4,
      z_hop_type: 'Normal Lift',
      retraction_speed: 30,
      deretraction_speed: 30,
      retract_restart_extra: 0,
      retract_before_travel: 2,
      retract_on_layer_change: false,
      wipe_while_retracting: false,
      wipe_distance: 1.0,
      retract_before_wipe: 100,
      long_retraction_when_cut: true,
      retraction_distance_when_cut: 18,
      override_overhang_speed: false,
      pressure_advance: 0.02,
    },
    scarf_seam: {
      scarf_seam_type: 'none',
      scarf_start_height: 0,
      scarf_slope_gap: 10,
      scarf_length: 5
    },
    notes: '',
    start_gcode: '',
    end_gcode: '',
  };
  openEditor(newF, 'filament');
};

const createNewPrinter = () => {
  editingPrinter.value = {
    user_id: user.value.id,
    name: 'New Printer',
    model: 'A1 Mini',
    nozzle_diameter: 0.4,
    bed_size_x: 180,
    bed_size_y: 180,
    default_print_profile_id: null,
  };
};

const createPrinterModel = async () => {
  const name = newModelName.value.trim();
  if (!name) return;
  if (printerModels.value.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    alert(`"${name}" is already in the list.`);
    return;
  }
  const { data, error } = await supabase.from('printer_models').insert({ name }).select().single();
  if (error) {
    alert('Error adding model: ' + error.message);
  } else {
    printerModels.value.push(data);
    printerModels.value.sort((a, b) => a.name.localeCompare(b.name));
    modelUsage.value[data.name] = false;
    newModelName.value = '';
  }
};

const deletePrinterModel = async (model) => {
  if (modelUsage.value[model.name]) return; // guarded in the UI too, but never act on a stale read
  if (!confirm(`Remove "${model.name}" from the printer models list?`)) return;
  const { error } = await supabase.from('printer_models').delete().eq('id', model.id);
  if (error) {
    // 23503 = foreign_key_violation — it became in-use after this page loaded
    const message = error.code === '23503'
      ? `"${model.name}" is now in use by a printer or print profile and can't be removed.`
      : 'Error removing model: ' + error.message;
    alert(message);
    await loadModelUsage(); // refresh so the UI reflects that
  } else {
    printerModels.value = printerModels.value.filter(m => m.id !== model.id);
  }
};

const cloneProfile = async (original) => {
  if (!confirm(`Clone "${original.name}" to your library?`)) return;
  const { id, created_at, updated_at, user_id, ...data } = original;
  data.user_id = user.value.id;
  data.name = `${original.name} (Copy)`;

  const { data: inserted, error } = await supabase.from('print_profiles').insert(data).select().single();
  if (error) {
    alert('Error cloning: ' + error.message);
  } else {
    profiles.value.unshift(inserted);
    openEditor(inserted, 'profile');
  }
};

const cloneFilament = async (original) => {
  if (!confirm(`Clone "${original.name}" to your library?`)) return;
  const { id, created_at, updated_at, user_id, ...data } = original;
  data.user_id = user.value.id;
  data.name = `${original.name} (Copy)`;

  const { data: inserted, error } = await supabase.from('filaments').insert(data).select().single();
  if (error) {
    alert('Error cloning: ' + error.message);
  } else {
    filaments.value.unshift(inserted);
    openEditor(inserted, 'filament');
  }
};

const handleClone = (item) => {
  if (editorType.value === 'profile') cloneProfile(item);
  else cloneFilament(item);
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
      print_profile_id: itemToSave.print_profile_id,
      basic_settings: itemToSave.basic_settings, 
      temp_settings: itemToSave.temp_settings, 
      cooling_settings: itemToSave.cooling_settings, 
      override_settings: itemToSave.override_settings,
      scarf_seam: itemToSave.scarf_seam,
      notes: itemToSave.notes ?? '',
      start_gcode: itemToSave.start_gcode ?? '',
      end_gcode: itemToSave.end_gcode ?? ''
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

const handleSavePrinter = async (printerToSave) => {
  loading.value = true;
  const payload = {
    name: printerToSave.name,
    model: printerToSave.model,
    nozzle_diameter: printerToSave.nozzle_diameter,
    bed_size_x: printerToSave.bed_size_x,
    bed_size_y: printerToSave.bed_size_y,
    default_print_profile_id: printerToSave.default_print_profile_id,
  };

  let res;
  if (printerToSave.id) {
    res = await supabase.from('printers').update(payload).eq('id', printerToSave.id).select().single();
  } else {
    res = await supabase.from('printers').insert({ user_id: printerToSave.user_id, ...payload }).select().single();
  }

  if (res.error) {
    alert('Error saving: ' + res.error.message);
  } else {
    const idx = printers.value.findIndex(p => p.id === res.data.id);
    if (idx >= 0) printers.value[idx] = res.data;
    else printers.value.unshift(res.data);
    editingPrinter.value = null;
  }
  loading.value = false;
};

// --- Users (elevated/admin only) ---
const handleSaveUser = async (updatedUser) => {
  loading.value = true;
  const payload = {
    full_name: updatedUser.full_name,
    phone: updatedUser.phone,
    role: updatedUser.role,
    disabled: updatedUser.disabled,
  };
  const { data, error } = await supabase.from('user_profiles').update(payload).eq('id', updatedUser.id).select().single();
  if (error) {
    alert('Error saving user: ' + error.message);
  } else {
    const idx = users.value.findIndex(u => u.id === data.id);
    if (idx >= 0) users.value[idx] = data;
    editingUser.value = null;
  }
  loading.value = false;
};

const handleChangeUserEmail = async ({ targetUserId, newEmail }) => {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('update-user-email', {
    body: { targetUserId, newEmail },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (error || data?.error) {
    alert('Error changing email: ' + (data?.error || error.message));
  } else {
    const idx = users.value.findIndex(u => u.id === targetUserId);
    if (idx >= 0) users.value[idx].email = newEmail;
    if (editingUser.value?.id === targetUserId) editingUser.value.email = newEmail;
    alert('Email updated successfully.');
  }
};

const handleSendUserPasswordReset = async ({ email }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) alert(error.message);
  else alert(`Password reset email sent to ${email}.`);
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
    
    <!-- Main UI -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col z-10 hidden md:flex">
        <div class="p-6 border-b border-gray-100">
          <h1 class="text-xl font-bold text-emerald-600 flex items-center gap-2">BambuDB</h1>
        </div>
        <div class="p-4 border-b border-gray-100 space-y-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search profiles & filaments..."
            class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
          <div class="flex gap-1 text-xs">
            <button
              v-for="scope in ['profiles', 'filaments', 'both']"
              :key="scope"
              @click="searchScope = scope"
              :class="searchScope === scope ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              class="flex-1 py-1 rounded capitalize font-medium transition-colors"
            >{{ scope }}</button>
          </div>
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
          <button @click="currentView='printer_models'" :class="currentView==='printer_models' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'" class="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span class="mr-3">🔧</span> Printer Models
          </button>
          <button v-if="canManageUsers" @click="currentView='users'" :class="currentView==='users' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'" class="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span class="mr-3">👥</span> Users
          </button>
        </nav>
        <div class="p-4 border-t border-gray-200">
          <div v-if="user" class="flex flex-col gap-2">
            <div class="text-sm font-medium text-gray-800 truncate" :title="user.email">{{ user.email }}</div>
            <div v-if="myProfile && myRole !== 'standard'" class="text-xs text-gray-400 uppercase font-bold">{{ myRole }}</div>
            <div v-if="myProfile?.disabled" class="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded px-2 py-1">
              Account disabled
            </div>
            <button @click="signOut" class="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-600 hover:bg-gray-100">Sign Out</button>
          </div>
          <div v-else>
            <button @click="showAuthModal = true" class="w-full bg-emerald-600 text-white text-sm py-2 rounded hover:bg-emerald-700">Sign In / Up</button>
          </div>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">

        <!-- SEARCH RESULTS (takes over from the tab views while searching) -->
        <div v-if="isSearching">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            Search results for "{{ searchQuery }}"
          </h2>

          <div v-if="searchScope !== 'filaments'" class="mb-8">
            <h3 class="text-sm font-bold text-gray-500 uppercase mb-3">Print Profiles</h3>
            <div v-if="searchResultsProfiles.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="profile in searchResultsProfiles" :key="profile.id" @click="openEditor(profile, 'profile')" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-5">
                <h3 class="font-bold text-lg text-gray-900 truncate">{{ profile.name }}</h3>
                <div class="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{{ isOwner(profile) ? 'My Profile' : 'Community' }}</span>
                  <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">{{ profile.printer_model }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No matching print profiles.</p>
          </div>

          <div v-if="searchScope !== 'profiles'">
            <h3 class="text-sm font-bold text-gray-500 uppercase mb-3">Filaments</h3>
            <div v-if="searchResultsFilaments.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="fil in searchResultsFilaments" :key="fil.id" @click="openEditor(fil, 'filament')" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <div class="h-3 w-full border-b border-gray-100" :style="{ backgroundColor: fil.basic_settings?.color || '#ccc' }"></div>
                <div class="p-5">
                  <h3 class="font-bold text-lg text-gray-900 truncate">{{ fil.name }}</h3>
                  <div class="text-sm text-gray-500">{{ fil.basic_settings?.vendor || 'Generic' }}</div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No matching filaments.</p>
          </div>
        </div>

        <!-- PROFILES -->
        <div v-if="currentView === 'profiles' && !isSearching">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Print Profiles</h2>
            <button v-if="canWrite" @click="createNewProfile" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"><span>+</span> New Profile</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="profile in profiles" :key="profile.id" @click="openEditor(profile, 'profile')" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow">
              <div class="p-5 flex-1">
                <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg text-gray-900 mb-1 truncate">{{ profile.name }}</h3>
                  <button @click.stop="toggleFavorite(profile.id, 'profile')" :class="isFavorite(profile.id, 'profile') ? 'text-yellow-400' : 'text-gray-300'" class="hover:text-yellow-500 text-xl">★</button>
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
              <div v-if="user && !isOwner(profile)" class="bg-gray-50 p-3 px-5 border-t border-gray-100 flex justify-end items-center">
                <button @click.stop="cloneProfile(profile)" class="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">Fork</button>
              </div>
            </div>
          </div>
        </div>

        <!-- FILAMENTS -->
        <div v-if="currentView === 'filaments' && !isSearching">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Filaments</h2>
            <button v-if="canWrite" @click="createNewFilament" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"><span>+</span> New Filament</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="fil in filaments" :key="fil.id" @click="openEditor(fil, 'filament')" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div class="h-3 w-full border-b border-gray-100" :style="{ backgroundColor: fil.basic_settings?.color || '#ccc' }"></div>
              <div class="p-5">
                <h3 class="font-bold text-lg text-gray-900 truncate">{{ fil.name }}</h3>
                <div class="text-sm text-gray-500 mb-4">{{ fil.basic_settings?.vendor || 'Generic' }}</div>
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
              </div>
            </div>
          </div>
        </div>

        <!-- PRINTERS -->
        <div v-if="currentView === 'printers' && !isSearching">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Printers</h2>
            <button v-if="canWrite" @click="createNewPrinter" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"><span>+</span> New Printer</button>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table class="w-full text-left text-sm text-gray-600">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="p-4 font-semibold text-gray-900">Name</th>
                  <th class="p-4 font-semibold text-gray-900">Model</th>
                  <th class="p-4 font-semibold text-gray-900">Bed Size</th>
                  <th class="p-4 font-semibold text-gray-900">Nozzle</th>
                  <th class="p-4 font-semibold text-gray-900">Default Profile</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="printer in printers" :key="printer.id" @click="editingPrinter = printer" class="hover:bg-gray-50 cursor-pointer">
                  <td class="p-4 font-medium text-gray-900">{{ printer.name }}</td>
                  <td class="p-4"><span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">{{ printer.model }}</span></td>
                  <td class="p-4">{{ printer.bed_size_x }} x {{ printer.bed_size_y }} mm</td>
                  <td class="p-4">{{ printer.nozzle_diameter }} mm</td>
                  <td class="p-4">
                    {{ profiles.find(p => p.id === printer.default_print_profile_id)?.name || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="printers.length === 0" class="p-8 text-center text-gray-400 text-sm">
              {{ user ? 'No printers yet — add one to get started.' : 'Sign in to manage your printers.' }}
            </div>
          </div>
        </div>

        <!-- PRINTER MODELS -->
        <div v-if="currentView === 'printer_models' && !isSearching">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Printer Models</h2>
          <p class="text-sm text-gray-500 mb-4">Shared list of target printer models available across Print Profiles and Printers.</p>

          <div v-if="canWrite" class="flex gap-2 mb-6 max-w-md">
            <input
              v-model="newModelName"
              @keyup.enter="createPrinterModel"
              type="text"
              placeholder="e.g. H2D"
              class="flex-1 border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
            <button @click="createPrinterModel" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm">Add</button>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-md">
            <ul class="divide-y divide-gray-100">
              <li v-for="model in printerModels" :key="model.id" class="flex justify-between items-center p-4">
                <span class="font-medium text-gray-900">{{ model.name }}</span>
                <template v-if="canWrite">
                  <button
                    v-if="!modelUsage[model.name]"
                    @click="deletePrinterModel(model)"
                    class="text-gray-400 hover:text-red-600"
                    title="Remove this model"
                  >🗑</button>
                  <span v-else class="text-amber-500" title="In use by one or more printers or print profiles">⚠️</span>
                </template>
              </li>
            </ul>
            <div v-if="printerModels.length === 0" class="p-8 text-center text-gray-400 text-sm">
              No printer models yet.
            </div>
          </div>
        </div>

        <!-- USERS (elevated/admin only) -->
        <div v-if="currentView === 'users' && canManageUsers && !isSearching">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Users</h2>
          <input
            v-model="userSearchQuery"
            type="text"
            placeholder="Search by email or name..."
            class="mb-4 w-full max-w-md border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table class="w-full text-left text-sm text-gray-600">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="p-4 font-semibold text-gray-900">Email</th>
                  <th class="p-4 font-semibold text-gray-900">Name</th>
                  <th class="p-4 font-semibold text-gray-900">Phone</th>
                  <th class="p-4 font-semibold text-gray-900">Role</th>
                  <th class="p-4 font-semibold text-gray-900">Status</th>
                  <th class="p-4 font-semibold text-gray-900"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-gray-50">
                  <td class="p-4 font-medium text-gray-900">{{ u.email }}</td>
                  <td class="p-4">{{ u.full_name || '—' }}</td>
                  <td class="p-4">{{ u.phone || '—' }}</td>
                  <td class="p-4"><span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">{{ u.role }}</span></td>
                  <td class="p-4">
                    <span v-if="u.disabled" class="text-red-600 font-medium">Disabled</span>
                    <span v-else class="text-emerald-600 font-medium">Active</span>
                  </td>
                  <td class="p-4 text-right">
                    <button
                      v-if="myRole === 'admin' || u.role === 'standard'"
                      @click="editingUser = u"
                      class="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredUsers.length === 0" class="p-8 text-center text-gray-400 text-sm">
              No users found.
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- Modals -->
    <AuthModal
      :isOpen="showAuthModal"
      @close="showAuthModal = false"
      @authenticate="handleAuth"
      @forgot-password="handleForgotPassword"
    />

    <ResetPasswordModal
      :isOpen="showResetPasswordModal"
      @submit="handleResetPassword"
    />

    <EditorModal
      v-if="editingItem"
      :item="editingItem"
      :type="editorType"
      :isOwner="isOwner(editingItem)"
      :canClone="!!user"
      :loading="loading"
      :profiles="profiles"
      :printerModels="printerModelNames"
      @close="editingItem = null"
      @save="handleSaveItem"
      @clone="handleClone"
    />

    <PrinterModal
      :printer="editingPrinter"
      :profiles="profiles"
      :printerModels="printerModelNames"
      :loading="loading"
      @close="editingPrinter = null"
      @save="handleSavePrinter"
    />

    <UserEditModal
      :targetUser="editingUser"
      :myRole="myRole"
      :loading="loading"
      @close="editingUser = null"
      @save="handleSaveUser"
      @change-email="handleChangeUserEmail"
      @send-password-reset="handleSendUserPasswordReset"
    />

  </div>
</template>