<template>
  <div id="app" class="aoc-theme">
    <header class="main-header">
      <div class="header-content">
        <h1 class="title">
          <span class="bracket">{</span>
          <router-link to="/" class="title-link">Mangekyo Code</router-link>
          <span class="bracket">}</span>
        </h1>
        <nav class="nav-menu">
          <template v-if="isAuthenticated">
            <router-link to="/challenges" class="nav-link">[Challenge]</router-link>
            <router-link to="/profile" class="nav-link">[Profile]</router-link>
            <router-link v-if="isAdmin" to="/admin" class="nav-link admin">[Admin]</router-link>
            <span v-if="timeRemaining" class="session-time">{{ timeRemaining }}</span>
            <a href="#" @click.prevent="logout" class="nav-link">[Log out]</a>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">[Sign in]</router-link>
            <router-link to="/register" class="nav-link">[Sign up]</router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="main-footer">
      <p>Created by Andres Ducuara</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.user?.isAdmin || false)
const timeRemaining = ref('')

const logout = () => {
  authStore.logout()
  router.push('/login')
}

let timeInterval = null

const updateTimeRemaining = () => {
  if (!authStore.isAuthenticated) {
    timeRemaining.value = ''
    return
  }

  const ms = authStore.timeUntilExpiry
  if (ms <= 0) {
    timeRemaining.value = 'Expired'
    return
  }

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  
  timeRemaining.value = `${hours}h ${minutes}m`
}

onMounted(() => {
  updateTimeRemaining()
  timeInterval = setInterval(updateTimeRemaining, 60000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Source Code Pro', 'Courier New', monospace;
  background-color: #0f0f23;
  color: #cccccc;
  line-height: 1.6;
}

.aoc-theme {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  background-color: #10101a;
  border-bottom: 1px solid #333340;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 1.5rem;
  font-weight: normal;
}

.title-link {
  color: #00cc00;
  text-decoration: none;
  text-shadow: 0 0 2px #00cc00, 0 0 5px #00cc00;
}

.title-link:hover {
  color: #00ff00;
  text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00;
}

.bracket {
  color: #666666;
}

.nav-menu {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #009900;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #00ff00;
  text-shadow: 0 0 5px #00ff00;
}

.nav-link.admin {
  color: #ffff66;
}

.nav-link.admin:hover {
  color: #ffff00;
  text-shadow: 0 0 5px #ffff00;
}

.session-time {
  color: #ffff66;
  font-size: 0.9rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(255, 255, 102, 0.1);
  border-radius: 3px;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.main-footer {
  background-color: #10101a;
  border-top: 1px solid #333340;
  padding: 1rem;
  text-align: center;
  color: #666666;
  font-size: 0.9rem;
}

a {
  color: #009900;
  text-decoration: none;
}

a:hover {
  color: #00ff00;
  text-decoration: underline;
}

button {
  background-color: #10101a;
  color: #00cc00;
  border: 1px solid #00cc00;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background-color: #00cc00;
  color: #0f0f23;
  box-shadow: 0 0 10px #00cc00;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input, textarea, select {
  background-color: #10101a;
  color: #cccccc;
  border: 1px solid #333340;
  padding: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #00cc00;
  box-shadow: 0 0 5px rgba(0, 204, 0, 0.3);
}
</style>