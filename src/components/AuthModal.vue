<script setup>
import { ref, reactive } from 'vue';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'authenticate', 'forgot-password']);

const authMode = ref('signin');
const form = reactive({ email: '', password: '' });

const titles = {
  signin: 'Welcome Back',
  signup: 'Create Account',
  forgot: 'Reset Password',
};

const handleSubmit = () => {
  if (authMode.value === 'forgot') {
    if (!form.email) return;
    emit('forgot-password', { email: form.email });
    return;
  }
  if (!form.email || !form.password) return;
  emit('authenticate', { mode: authMode.value, ...form });
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg p-8 w-full max-w-sm shadow-xl">
      <h2 class="text-xl font-bold mb-6 text-center text-gray-800">
        {{ titles[authMode] }}
      </h2>

      <div class="space-y-4">
        <div>
          <label for="auth-email" class="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
          <input
            id="auth-email"
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>
        <div v-if="authMode !== 'forgot'">
          <label for="auth-password" class="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
          <input
            id="auth-password"
            v-model="form.password"
            type="password"
            class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
        </div>

        <button
          @click="handleSubmit"
          class="w-full bg-emerald-600 text-white py-2.5 rounded font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          {{ authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Link' }}
        </button>

        <div v-if="authMode === 'signin'" class="text-center text-sm">
          <span
            class="cursor-pointer text-gray-500 hover:text-emerald-600 underline"
            @click="authMode = 'forgot'"
          >
            Forgot password?
          </span>
        </div>

        <div class="text-center text-sm text-gray-600 mt-4">
          <span
            v-if="authMode !== 'forgot'"
            class="cursor-pointer hover:text-emerald-600 underline"
            @click="authMode = authMode === 'signin' ? 'signup' : 'signin'"
          >
            {{ authMode === 'signin' ? 'Need an account? Sign Up' : 'Have an account? Sign In' }}
          </span>
          <span
            v-else
            class="cursor-pointer hover:text-emerald-600 underline"
            @click="authMode = 'signin'"
          >
            Back to Sign In
          </span>
        </div>
        <button
          @click="$emit('close')"
          class="text-xs text-gray-400 w-full text-center mt-4 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>