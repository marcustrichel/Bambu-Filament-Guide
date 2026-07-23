<script setup>
import { reactive } from 'vue';

const props = defineProps(['isOpen']);
const emit = defineEmits(['submit']);

const form = reactive({ password: '', confirmPassword: '' });

const handleSubmit = () => {
  if (!form.password || form.password.length < 6) return;
  if (form.password !== form.confirmPassword) return;
  emit('submit', { password: form.password });
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg p-8 w-full max-w-sm shadow-xl">
      <h2 class="text-xl font-bold mb-2 text-center text-gray-800">Set a New Password</h2>
      <p class="text-sm text-gray-500 text-center mb-6">Choose a new password for your account.</p>

      <div class="space-y-4">
        <div>
          <label for="reset-password" class="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
          <input
            id="reset-password"
            v-model="form.password"
            type="password"
            class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>
        <div>
          <label for="reset-confirm-password" class="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
          <input
            id="reset-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>
        <p v-if="form.confirmPassword && form.password !== form.confirmPassword" class="text-xs text-red-500">
          Passwords do not match.
        </p>

        <button
          @click="handleSubmit"
          class="w-full bg-emerald-600 text-white py-2.5 rounded font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Update Password
        </button>
      </div>
    </div>
  </div>
</template>
