<template>
  <div class="admin-container">
    <h1 class="page-title">Administration Panel</h1>

    <div class="tabs">
      <button
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        Stats
      </button>
      <button
        :class="{ active: activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        Users
      </button>
      <button
        :class="{ active: activeTab === 'challenges' }"
        @click="activeTab = 'challenges'"
      >
        Challenges
      </button>
    </div>

    <div v-if="activeTab === 'stats'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ adminStats.totalUsers }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminStats.totalChallenges }}</div>
          <div class="stat-label">Active Challenges</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ adminStats.totalSubmissions }}</div>
          <div class="stat-label">Total Submits</div>
        </div>
      </div>

      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div
            v-for="(activity, index) in adminStats.recentActivity"
            :key="index"
            class="activity-item"
          >
            <span class="activity-user">{{ activity.username }}</span>
            <span class="activity-action">sent solution for</span>
            <span class="activity-challenge">{{ activity.challenge_title }}</span>
            <span class="activity-status" :class="activity.status">
              {{ activity.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Usuarios -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <h3>User list</h3>
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Challenges Solved</th>
              <th>Total Score</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.challenges_solved }}</td>
              <td class="points">{{ user.total_score }}</td>
              <td>
                <span class="role-badge" :class="{ admin: user.is_admin }">
                  {{ user.is_admin ? 'Admin' : 'User' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'challenges'" class="tab-content">
      <div class="challenges-header">
        <h3>Challenge Management</h3>
        <router-link to="/admin/create-challenge" class="create-btn">
          + Create New Challenge
        </router-link>
      </div>

      <div class="challenges-list">
        <div v-if="loadingChallenges" class="loading">Loading Challenges...</div>
        
        <div v-else-if="challenges.length === 0" class="no-data">
          No challenges have been created yet.
        </div>

        <div v-else class="challenges-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Points</th>
                <th>Languages</th>
                <th>Attempts</th>
                <th>Solved</th>
                <th>Status</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="challenge in challenges" :key="challenge.id">
                <td class="challenge-title">{{ challenge.title }}</td>
                <td>
                  <span class="difficulty-badge" :class="challenge.difficulty">
                    {{ getDifficultyLabel(challenge.difficulty) }}
                  </span>
                </td>
                <td class="points">{{ challenge.points }}</td>
                <td class="languages">
                  {{ challenge.allowed_languages ? challenge.allowed_languages.join(', ') : '-' }}
                </td>
                <td class="stats-cell">{{ challenge.total_submissions || 0 }}</td>
                <td class="stats-cell">{{ challenge.solved_by || 0 }}</td>
                <td>
                  <span :class="challenge.is_active ? 'status-active' : 'status-inactive'">
                    {{ challenge.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="toggleChallenge(challenge.id, challenge.is_active)" class="btn-toggle">
                      {{ challenge.is_active ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button @click="deleteChallenge(challenge.id)" class="btn-delete">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const activeTab = ref('stats')
const adminStats = ref({
  totalUsers: 0,
  totalChallenges: 0,
  totalSubmissions: 0,
  recentActivity: []
})
const users = ref([])
const challenges = ref([])
const loadingChallenges = ref(false)
const showCreateModal = ref(false)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

onMounted(async () => {
  await loadStats()
  await loadUsers()
  await loadChallenges()
})

const loadStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/stats`)
    adminStats.value = response.data
  } catch (error) {
    console.error('Error loading statistics:', error)
  }
}

const loadUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/users`)
    users.value = response.data
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const loadChallenges = async () => {
  loadingChallenges.value = true
  try {
    const response = await axios.get(`${API_URL}/api/admin/challenges`)
    challenges.value = response.data
  } catch (error) {
    console.error('Error loading challenges:', error)
    try {
      const response = await axios.get(`${API_URL}/api/challenges`)
      challenges.value = response.data
    } catch (err2) {
      console.error('Error loading challenges (fallback):', err2)
    }
  } finally {
    loadingChallenges.value = false
  }
}

const toggleChallenge = async (id, currentStatus) => {
  if (!confirm(`¿${currentStatus ? 'Deactivate' : 'Activate'} this challenge?`)) {
    return
  }

  try {
    await axios.put(`${API_URL}/api/admin/challenges/${id}`, {
      isActive: !currentStatus
    })
    await loadChallenges()
  } catch (error) {
    alert('Error updating the challenge')
    console.error(error)
  }
}

const deleteChallenge = async (id) => {
  const confirmMsg = 'WARNING: If the challenge has submissions, it will only be deactivated. If it has no submissions, it will be permanently deleted.\n\nContinue?'
  
  if (!confirm(confirmMsg)) {
    return
  }

  try {
    const response = await axios.delete(`${API_URL}/api/admin/challenges/${id}`)
    
    if (response.data.deleted) {
      alert('Challenge completely eliminated')
    } else if (response.data.deactivated) {
      alert('Challenge disabled (has associated submissions, cannot be deleted)')
    }
    
    await loadChallenges()
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Unknown error'
    alert('Error deleting challenge: ' + errorMsg)
    console.error(error)
  }
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  }
  return labels[difficulty] || difficulty
}
</script>

<style scoped>
.admin-container {
  padding: 2rem 0;
}

.page-title {
  color: #ffff66;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px #ffff66;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #333340;
}

.tabs button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 1rem 2rem;
  color: #999999;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tabs button:hover {
  color: #ffff66;
}

.tabs button.active {
  color: #ffff66;
  border-bottom-color: #ffff66;
}

.tab-content {
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background-color: #10101a;
  border: 2px solid #ffff66;
  padding: 2rem;
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  color: #ffff66;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #999999;
  font-size: 0.9rem;
}

.recent-activity h3 {
  color: #ffff66;
  margin-bottom: 1.5rem;
}

.activity-list {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 1.5rem;
}

.activity-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #333340;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-user {
  color: #00cc00;
  font-weight: bold;
}

.activity-action {
  color: #999999;
}

.activity-challenge {
  color: #cccccc;
}

.activity-status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
}

.activity-status.accepted {
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
}

.users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  background-color: #10101a;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #333340;
}

th {
  color: #ffff66;
  font-weight: bold;
  background-color: #0a0a0f;
}

td {
  color: #cccccc;
}

.points {
  color: #ffff66;
  font-weight: bold;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
  font-size: 0.85rem;
}

.role-badge.admin {
  background-color: rgba(255, 255, 102, 0.2);
  color: #ffff66;
}

.challenges-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.challenges-header h3 {
  color: #ffff66;
}

.create-btn {
  background-color: #ffff66;
  color: #0f0f23;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
}

.create-btn:hover {
  box-shadow: 0 0 15px #ffff66;
}

.create-btn {
  background-color: #ffff66;
  color: #0f0f23;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.create-btn:hover {
  box-shadow: 0 0 15px #ffff66;
  transform: translateY(-2px);
}

.challenges-list {
  margin-top: 2rem;
}

.loading,
.no-data {
  text-align: center;
  padding: 3rem;
  color: #999999;
  font-size: 1.1rem;
}

.challenges-table {
  overflow-x: auto;
}

.challenge-title {
  font-weight: bold;
  color: #00cc00;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  font-size: 0.85rem;
  display: inline-block;
}

.difficulty-badge.easy {
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
}

.difficulty-badge.medium {
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
}

.difficulty-badge.hard {
  background-color: rgba(255, 0, 0, 0.2);
  color: #ff6666;
}

.languages {
  font-size: 0.85rem;
  color: #999999;
}

.status-active {
  color: #00cc00;
}

.status-inactive {
  color: #ff6666;
}

.btn-toggle {
  background-color: transparent;
  color: #ffff66;
  border: 1px solid #ffff66;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background-color: rgba(255, 255, 102, 0.2);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-delete {
  background-color: transparent;
  color: #ff6666;
  border: 1px solid #ff6666;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background-color: rgba(255, 102, 102, 0.2);
}

.info-text {
  color: #999999;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #10101a;
  border: 2px solid #ffff66;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
}

.modal-content h3 {
  color: #ffff66;
  margin-bottom: 1rem;
}
</style>