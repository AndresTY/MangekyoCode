<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2 class="auth-title">--- Registration ---</h2>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username">&gt; User:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            minlength="3"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="email">&gt; Email:</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">&gt; Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">&gt; Confirm Password:</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <div v-if="error" class="error-message">
          [ERROR] {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Processing...' : '[Sign up]' }}
        </button>
      </form>

      <p class="auth-link">
        Do you already have an account? <router-link to="/login">Log in here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true

  const result = await authStore.register(username.value, email.value, password.value)

  if (result.success) {
    router.push('/challenges')
  } else {
    error.value = result.error
  }

  loading.value = false
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-box {
  width: 100%;
  max-width: 500px;
  border: 1px solid #333340;
  padding: 2rem;
  background-color: #10101a;
}

.auth-title {
  color: #00cc00;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.3rem;
  text-shadow: 0 0 5px #00cc00;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #009900;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.error-message {
  color: #ff6666;
  padding: 0.75rem;
  border: 1px solid #ff6666;
  background-color: rgba(255, 102, 102, 0.1);
  font-size: 0.9rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #999999;
}
</style>