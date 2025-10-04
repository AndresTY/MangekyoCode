import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    tokenExpiry: localStorage.getItem('tokenExpiry') || null
  }),

  getters: {
    isAuthenticated: (state) => {
      if (!state.token || !state.tokenExpiry) return false
      
      const now = new Date().getTime()
      const expiry = parseInt(state.tokenExpiry)
      
      if (now >= expiry) {
        return false
      }
      
      return true
    },
    isAdmin: (state) => state.user?.isAdmin || false,
    timeUntilExpiry: (state) => {
      if (!state.tokenExpiry) return 0
      const now = new Date().getTime()
      const expiry = parseInt(state.tokenExpiry)
      return Math.max(0, expiry - now)
    }
  },

  actions: {
    async register(username, email, password) {
      try {
        const response = await axios.post(`${API_URL}/api/auth/register`, {
          username,
          email,
          password
        })

        this.setAuthData(response.data.token, response.data.user)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Error registering user'
        }
      }
    },

    async login(username, password) {
      try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          username,
          password
        })

        this.setAuthData(response.data.token, response.data.user)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Error logging in'
        }
      }
    },

    setAuthData(token, user) {
      this.token = token
      this.user = user
      
      const expiry = new Date().getTime() + (5 * 60 * 60 * 1000)
      this.tokenExpiry = expiry.toString()
      
      localStorage.setItem('token', token)
      localStorage.setItem('tokenExpiry', expiry.toString())
      localStorage.setItem('user', JSON.stringify(user))

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      this.startExpiryCheck()
    },

    async verifyToken() {
      if (!this.token || !this.isAuthenticated) {
        this.logout()
        return false
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        const response = await axios.get(`${API_URL}/api/auth/verify`)
        this.user = response.data.user

        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          this.user = JSON.parse(storedUser)
        }
        
        this.startExpiryCheck()
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    startExpiryCheck() {
      if (this.expiryInterval) {
        clearInterval(this.expiryInterval)
      }

      this.expiryInterval = setInterval(() => {
        if (!this.isAuthenticated) {
          console.log('Token expired, logging out...')
          this.logout()

          if (window.location.pathname !== '/login') {
            alert('Your session has expired. Please log in again.')
            window.location.href = '/login'
          }
        }
      }, 60000) 
    },

    logout() {
      this.user = null
      this.token = null
      this.tokenExpiry = null

      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('user')

      delete axios.defaults.headers.common['Authorization']

      if (this.expiryInterval) {
        clearInterval(this.expiryInterval)
        this.expiryInterval = null
      }
    }
  }
})

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)