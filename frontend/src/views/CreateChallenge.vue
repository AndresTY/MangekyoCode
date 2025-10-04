<template>
  <div class="create-challenge-container">
    <h1 class="page-title">Create New Challenge</h1>

    <form @submit.prevent="submitChallenge" class="challenge-form">
      <div class="form-section">
        <h2 class="section-title">Basic Information</h2>
        
        <div class="form-group">
          <label for="title">Challenge Title *</label>
          <input
            id="title"
            v-model="challenge.title"
            type="text"
            required
            placeholder="Ej: Suma de Dos Números"
          />
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea
            id="description"
            v-model="challenge.description"
            required
            rows="8"
            placeholder="Describe el problema, formato de entrada y salida esperada..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="difficulty">Difficulty *</label>
            <select id="difficulty" v-model="challenge.difficulty" required>
              <option value="">Selecciona...</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div class="form-group">
            <label for="points">Points *</label>
            <input
              id="points"
              v-model.number="challenge.points"
              type="number"
              required
              min="0"
              max="1000"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">Execution Limits</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="timeLimit">Time limit (ms) *</label>
            <input
              id="timeLimit"
              v-model.number="challenge.timeLimit"
              type="number"
              required
              min="1000"
              max="30000"
              placeholder="5000"
            />
            <small>1000 ms = 1 seconds</small>
          </div>

          <div class="form-group">
            <label for="memoryLimit">Memory Limit (MB) *</label>
            <input
              id="memoryLimit"
              v-model.number="challenge.memoryLimit"
              type="number"
              required
              min="64"
              max="1024"
              placeholder="256"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">Permitted Languages *</h2>
        
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" value="python" v-model="challenge.allowedLanguages" />
            <span>Python</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="javascript" v-model="challenge.allowedLanguages" />
            <span>JavaScript</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="cpp" v-model="challenge.allowedLanguages" />
            <span>C++</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="java" v-model="challenge.allowedLanguages" />
            <span>Java</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">Test Cases *</h2>
        <p class="help-text">Define test cases with expected input and output</p>
        
        <div
          v-for="(testCase, index) in challenge.testCases"
          :key="index"
          class="test-case-item"
        >
          <div class="test-case-header">
            <h3>Test Case {{ index + 1 }}</h3>
            <button
              v-if="challenge.testCases.length > 1"
              type="button"
              @click="removeTestCase(index)"
              class="btn-remove"
            >
              Delete
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Input *</label>
              <textarea
                v-model="testCase.input"
                required
                rows="3"
                placeholder="Ej: 5 3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Expected output *</label>
              <textarea
                v-model="testCase.output"
                required
                rows="3"
                placeholder="Ej: 8"
              ></textarea>
            </div>
          </div>
        </div>

        <button type="button" @click="addTestCase" class="btn-add">
          + Add Test Case
        </button>
      </div>

      <div v-if="error" class="error-message">
        <strong>Error:</strong> {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="submitting" class="btn-submit">
          {{ submitting ? 'Creating...' : 'Create Challenge' }}
        </button>
        <button type="button" @click="goBack" class="btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const challenge = ref({
  title: '',
  description: '',
  difficulty: '',
  points: 100,
  timeLimit: 5000,
  memoryLimit: 256,
  allowedLanguages: ['python'],
  testCases: [
    { input: '', output: '' }
  ]
})

const submitting = ref(false)
const error = ref('')

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const addTestCase = () => {
  challenge.value.testCases.push({ input: '', output: '' })
}

const removeTestCase = (index) => {
  challenge.value.testCases.splice(index, 1)
}

const submitChallenge = async () => {
  error.value = ''

  if (challenge.value.allowedLanguages.length === 0) {
    error.value = 'Select at least one allowed language'
    return
  }

  if (challenge.value.testCases.some(tc => !tc.input || !tc.output)) {
    error.value = 'All test cases must have input and output.'
    return
  }

  submitting.value = true

  try {
    await axios.post(`${API_URL}/api/admin/challenges`, {
      title: challenge.value.title,
      description: challenge.value.description,
      difficulty: challenge.value.difficulty,
      points: challenge.value.points,
      testCases: challenge.value.testCases,
      timeLimit: challenge.value.timeLimit,
      memoryLimit: challenge.value.memoryLimit,
      allowedLanguages: challenge.value.allowedLanguages
    })

    alert('Challenge successfully created')
    
    await router.push('/admin')
    
    setTimeout(() => {
      window.location.reload()
    }, 100)
  } catch (err) {
    error.value = err.response?.data?.error || 'Error creating challenge'
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  if (confirm('Discard changes and go back?')) {
    router.push('/admin')
  }
}
</script>

<style scoped>
.create-challenge-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;
}

.page-title {
  color: #ffff66;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px #ffff66;
}

.challenge-form {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #333340;
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  color: #00cc00;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.help-text {
  color: #999999;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #00cc00;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group small {
  display: block;
  color: #666666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background-color: #0f0f23;
  color: #cccccc;
  border: 1px solid #333340;
  font-family: inherit;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #00cc00;
  box-shadow: 0 0 5px rgba(0, 204, 0, 0.3);
}

.form-group textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #cccccc;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.checkbox-label:hover {
  color: #00cc00;
}

.test-case-item {
  background-color: #0f0f23;
  border: 1px solid #333340;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.test-case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.test-case-header h3 {
  color: #ffff66;
  font-size: 1.1rem;
}

.btn-remove {
  background-color: #ff6666;
  color: #000000;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-remove:hover {
  background-color: #ff0000;
  box-shadow: 0 0 10px rgba(255, 102, 102, 0.5);
}

.btn-add {
  background-color: transparent;
  color: #00cc00;
  border: 2px dashed #00cc00;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  transition: all 0.2s;
}

.btn-add:hover {
  background-color: rgba(0, 204, 0, 0.1);
  border-style: solid;
}

.error-message {
  background-color: rgba(255, 102, 102, 0.1);
  border: 1px solid #ff6666;
  color: #ff6666;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 3px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-submit {
  background-color: #00cc00;
  color: #0f0f23;
  border: 2px solid #00cc00;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #00ff00;
  box-shadow: 0 0 20px rgba(0, 204, 0, 0.5);
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: transparent;
  color: #999999;
  border: 2px solid #666666;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  color: #cccccc;
  border-color: #999999;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-submit,
  .btn-cancel {
    width: 100%;
  }
}
</style>