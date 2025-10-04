<template>
  <div class="challenges-container">
    <h1 class="page-title">
      <span class="star">*</span> Programming Challenges <span class="star">*</span>
    </h1>

    <div v-if="loading" class="loading">
      <p>Loading challenges...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>

    <div v-else class="challenges-grid">
      <div
        v-for="challenge in challenges"
        :key="challenge.id"
        class="challenge-card"
        :class="{ solved: challenge.solved > 0 }"
        @click="goToChallenge(challenge.id)"
      >
        <div class="challenge-header">
          <span class="challenge-number">Problem {{ challenge.id }}</span>
          <span class="difficulty" :class="challenge.difficulty">
            {{ getDifficultyLabel(challenge.difficulty) }}
          </span>
        </div>

        <h3 class="challenge-title">{{ challenge.title }}</h3>

        <p class="challenge-description">
          {{ truncate(challenge.description, 100) }}
        </p>

        <div class="challenge-footer">
          <span class="points">{{ challenge.points }} pts</span>
          <span v-if="challenge.solved > 0" class="solved-badge">
            Resolved
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const challenges = ref([])
const loading = ref(true)
const error = ref('')

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const loadChallenges = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get(`${API_URL}/api/challenges`)
    challenges.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Error loading challenges'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadChallenges()
})

const goToChallenge = (id) => {
  router.push(`/challenge/${id}`)
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  }
  return labels[difficulty] || difficulty
}

const truncate = (text, length) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.challenges-container {
  padding: 2rem 0;
}

.page-title {
  text-align: center;
  color: #00cc00;
  font-size: 2rem;
  margin-bottom: 3rem;
  text-shadow: 0 0 10px #00cc00;
}

.star {
  color: #ffff66;
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #ff6666;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.challenge-card {
  border: 1px solid #333340;
  padding: 1.5rem;
  background-color: #10101a;
  cursor: pointer;
  transition: all 0.3s;
}

.challenge-card:hover {
  border-color: #00cc00;
  box-shadow: 0 0 15px rgba(0, 204, 0, 0.3);
  transform: translateY(-2px);
}

.challenge-card.solved {
  border-color: #ffff66;
}

.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.challenge-number {
  color: #666666;
  font-size: 0.9rem;
}

.difficulty {
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  font-size: 0.85rem;
}

.difficulty.easy {
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
}

.difficulty.medium {
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
}

.difficulty.hard {
  background-color: rgba(255, 0, 0, 0.2);
  color: #ff6666;
}

.challenge-title {
  color: #00cc00;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.challenge-description {
  color: #999999;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  min-height: 3rem;
}

.challenge-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #333340;
}

.points {
  color: #ffff66;
  font-weight: bold;
}

.solved-badge {
  color: #ffff66;
  font-size: 0.9rem;
}
</style>