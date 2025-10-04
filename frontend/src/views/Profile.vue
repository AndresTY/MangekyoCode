<template>
  <div class="profile-container">
    <h1 class="page-title">My Profile</h1>

    <div class="profile-info">
      <div class="info-card">
        <h2>User Information</h2>
        <div class="info-row">
          <span class="label">User:</span>
          <span class="value">{{ user?.username }}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{ user?.email }}</span>
        </div>
        <div class="info-row">
          <span class="label">Rol:</span>
          <span class="value badge" :class="{ admin: user?.isAdmin }">
            {{ user?.isAdmin ? 'Administrator' : 'User' }}
          </span>
        </div>
      </div>

      <div class="stats-card">
        <h2>Statistics</h2>
        <div class="stat-item">
          <span class="stat-label">Challenges Solved:</span>
          <span class="stat-value">{{ stats.solved }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total attempts:</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Score:</span>
          <span class="stat-value highlight">{{ stats.points }}</span>
        </div>
      </div>
    </div>

    <div class="submissions-section">
      <h2>My latest attempts</h2>
      
      <div v-if="loadingSubmissions" class="loading">Loading...</div>
      
      <div v-else-if="submissions.length === 0" class="no-data">
      You don't have any attempts yet. Start solving challenges!
      </div>

      <div v-else class="submissions-list">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          class="submission-item"
          :class="submission.status"
        >
          <div class="submission-header">
            <span class="submission-title">{{ submission.challenge_title }}</span>
            <span class="submission-status" :class="submission.status">
              {{ getStatusLabel(submission.status) }}
            </span>
          </div>
          <div class="submission-details">
            <span>{{ submission.language }}</span>
            <span>{{ formatDate(submission.submitted_at) }}</span>
            <span v-if="submission.score > 0" class="score">{{ submission.score }} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const submissions = ref([])
const loadingSubmissions = ref(true)
const stats = ref({
  solved: 0,
  total: 0,
  points: 0
})

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

onMounted(async () => {
  try {
    const response = await axios.get(`${API_URL}/api/submissions/user/me`)
    submissions.value = response.data

    // Calcular estadísticas
    stats.value.total = submissions.value.length
    stats.value.solved = submissions.value.filter(s => s.status === 'accepted').length
    stats.value.points = submissions.value.reduce((sum, s) => sum + (s.score || 0), 0)
  } catch (error) {
    console.error('Error loading attempts:', error)
  } finally {
    loadingSubmissions.value = false
  }
})

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    running: 'Running',
    accepted: 'Accepted',
    wrong_answer: 'Incorrect',
    time_limit: 'Time Limit',
    runtime_error: 'Error',
    compile_error: 'Compilation Error'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.profile-container {
  padding: 2rem 0;
}

.page-title {
  color: #00cc00;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px #00cc00;
}

.profile-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.info-card, .stats-card {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 2rem;
}

.info-card h2, .stats-card h2 {
  color: #00cc00;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #333340;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #999999;
}

.value {
  color: #cccccc;
  font-weight: bold;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
  font-size: 0.9rem;
}

.badge.admin {
  background-color: rgba(255, 255, 102, 0.2);
  color: #ffff66;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #333340;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #999999;
}

.stat-value {
  color: #00cc00;
  font-size: 1.3rem;
  font-weight: bold;
}

.stat-value.highlight {
  color: #ffff66;
}

.submissions-section {
  margin-top: 3rem;
}

.submissions-section h2 {
  color: #00cc00;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.loading, .no-data {
  text-align: center;
  padding: 2rem;
  color: #999999;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submission-item {
  background-color: #10101a;
  border: 1px solid #333340;
  border-left: 4px solid #333340;
  padding: 1.5rem;
  transition: all 0.3s;
}

.submission-item:hover {
  border-left-color: #00cc00;
  box-shadow: 0 0 10px rgba(0, 204, 0, 0.2);
}

.submission-item.accepted {
  border-left-color: #00cc00;
}

.submission-item.wrong_answer,
.submission-item.runtime_error,
.submission-item.compile_error {
  border-left-color: #ff6666;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.submission-title {
  color: #00cc00;
  font-size: 1.1rem;
  font-weight: bold;
}

.submission-status {
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  font-size: 0.9rem;
}

.submission-status.accepted {
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
}

.submission-status.wrong_answer,
.submission-status.runtime_error,
.submission-status.compile_error {
  background-color: rgba(255, 102, 102, 0.2);
  color: #ff6666;
}

.submission-status.pending,
.submission-status.running {
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
}

.submission-details {
  display: flex;
  gap: 1.5rem;
  color: #999999;
  font-size: 0.9rem;
}

.score {
  color: #ffff66;
  font-weight: bold;
}
</style>