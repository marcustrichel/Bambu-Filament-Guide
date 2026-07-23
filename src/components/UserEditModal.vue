<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  targetUser: Object,  // the user_profiles row being edited (or null to hide)
  myRole: String,      // caller's own role: 'standard' | 'elevated' | 'admin'
  loading: Boolean,
});

const emit = defineEmits(['close', 'save', 'change-email', 'send-password-reset']);

const ROLES = ['standard', 'elevated', 'admin'];

const editingUser = ref(null);
const originalUserStr = ref('');
const showEmailField = ref(false);
const newEmail = ref('');

watch(() => props.targetUser, (newTarget) => {
  showEmailField.value = false;
  newEmail.value = '';
  if (newTarget) {
    const str = JSON.stringify(newTarget);
    originalUserStr.value = str;
    editingUser.value = JSON.parse(str);
  } else {
    editingUser.value = null;
  }
}, { immediate: true });

const canChangeRole = () => props.myRole === 'admin';

const handleSave = () => {
  emit('save', {
    id: editingUser.value.id,
    full_name: editingUser.value.full_name,
    phone: editingUser.value.phone,
    role: editingUser.value.role,
    disabled: editingUser.value.disabled,
  });
};

const handleClose = () => {
  if (JSON.stringify(editingUser.value) !== originalUserStr.value) {
    if (!confirm('You have unsaved changes. Discard them?')) return;
  }
  emit('close');
};

const handleChangeEmail = () => {
  const email = newEmail.value.trim();
  if (!email) return;
  emit('change-email', { targetUserId: editingUser.value.id, newEmail: email });
  showEmailField.value = false;
  newEmail.value = '';
};

const handleSendPasswordReset = () => {
  emit('send-password-reset', { email: editingUser.value.email });
};
</script>

<template>
  <div v-if="editingUser" @click.self="handleClose" class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
        <h3 class="text-lg font-bold text-gray-900">Edit User</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 p-1">✕</button>
      </div>

      <div class="p-6 space-y-4 flex-1 overflow-y-auto">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
          <div v-if="!showEmailField" class="flex items-center gap-2">
            <span class="text-sm text-gray-800 flex-1 truncate">{{ editingUser.email }}</span>
            <button @click="showEmailField = true" class="text-xs text-emerald-600 hover:text-emerald-700 underline">Change Email</button>
          </div>
          <div v-else class="flex gap-2">
            <input
              v-model="newEmail"
              type="email"
              placeholder="new@example.com"
              class="flex-1 border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
            <button @click="handleChangeEmail" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm">Update</button>
            <button @click="showEmailField = false" class="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
          </div>
        </div>

        <div>
          <label for="user-full-name" class="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
          <input
            id="user-full-name"
            v-model="editingUser.full_name"
            type="text"
            class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>

        <div>
          <label for="user-phone" class="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
          <input
            id="user-phone"
            v-model="editingUser.phone"
            type="text"
            class="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>

        <div>
          <label for="user-role" class="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
          <select
            id="user-role"
            v-model="editingUser.role"
            :disabled="!canChangeRole()"
            class="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
          </select>
          <p v-if="!canChangeRole()" class="mt-1 text-xs text-gray-400">Only admins can change a user's role.</p>
        </div>

        <div class="flex items-center gap-2 bg-gray-50 rounded px-3 py-2 border border-gray-200">
          <input
            id="user-disabled"
            v-model="editingUser.disabled"
            type="checkbox"
            class="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
          >
          <label for="user-disabled" class="text-sm font-medium" :class="editingUser.disabled ? 'text-red-600' : 'text-gray-700'">
            Account Disabled
          </label>
        </div>

        <button
          @click="handleSendPasswordReset"
          class="w-full text-sm border border-gray-300 rounded px-3 py-2 text-gray-600 hover:bg-gray-50"
        >
          Send Password Reset Email
        </button>
      </div>

      <div class="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 flex-shrink-0">
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
