console.log("App mounting..");
import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css'; // Ensure your Tailwind CSS is imported here

createApp(App).mount('#app');