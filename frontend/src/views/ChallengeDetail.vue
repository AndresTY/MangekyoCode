<template>
  <div class="challenge-detail">
    <div v-if="loading" class="loading">Loading challenge...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <div v-if="challenge.isCompleted" class="completed-banner">
        <div class="completed-content">
          <div class="completed-icon">✓</div>
          <div class="completed-text">
            <h2>Challenge Completed!</h2>
            <p>You have successfully completed this challenge. You cannot submit any more solutions.</p>
          </div>
        </div>
      </div>

      <div class="challenge-info">
        <div class="challenge-header-detail">
          <h1 class="challenge-title-large">{{ challenge.title }}</h1>
          <div class="challenge-meta">
            <span class="difficulty-badge" :class="challenge.difficulty">
              {{ getDifficultyLabel(challenge.difficulty) }}
            </span>
            <span class="points-badge">{{ challenge.points }} points</span>
          </div>
        </div>

        <div class="challenge-description-box">
          <pre class="description-text">{{ challenge.description }}</pre>
        </div>

        <div class="test-cases-section">
          <h3>Test case (Input):</h3>
          <div v-for="(testCase, index) in challenge.test_cases" :key="index" class="test-case">
            <strong>Case {{ index + 1 }}:</strong>
            <code>{{ testCase.input }}</code>
          </div>
        </div>

        <div class="language-selector">
          <label for="language">Language:</label>
          <select id="language" v-model="selectedLanguage">
            <option v-for="lang in challenge.allowed_languages" :key="lang" :value="lang">
              {{ getLanguageLabel(lang) }}
            </option>
          </select>
        </div>
      </div>

      <div class="code-section">
        <h3 class="section-title">Code editor</h3>
        
        <div v-if="challenge.isCompleted" class="editor-disabled-message">
          <p>The editor is disabled because you have already completed this challenge.</p>
        </div>

        <CodeTerminal
          v-else
          v-model="code"
          :language="selectedLanguage"
          @save="submitSolution"
        />

        <div class="actions" v-if="!challenge.isCompleted">
          <button @click="submitSolution" :disabled="submitting" class="submit-button">
            {{ submitting ? 'Sending...' : 'Submit Solution' }}
          </button>
        </div>
      </div>

      <div v-if="submissionResult" class="result-section">
        <h3>Evaluation Results</h3>
        <div class="result-box" :class="submissionResult.status">
          <div class="result-status">
            <strong>Status:</strong> {{ getStatusLabel(submissionResult.status) }}
          </div>
          <div v-if="submissionResult.execution_time" class="result-time">
            <strong>Time:</strong> {{ submissionResult.execution_time }}ms
          </div>
          <div v-if="submissionResult.score > 0" class="result-score">
            <strong>Score:</strong> {{ submissionResult.score }} / {{ challenge.points }}
          </div>

          <div v-if="submissionResult.test_results" class="test-results">
            <h4>Test Results:</h4>
            <div
              v-for="(test, index) in submissionResult.test_results"
              :key="index"
              class="test-result"
              :class="{ passed: test.passed, failed: !test.passed }"
            >
              <span class="test-icon">{{ test.passed ? '✓' : '✗' }}</span>
              <span>Test {{ index + 1 }}: {{ test.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import CodeTerminal from '@/components/CodeTerminal.vue'

const route = useRoute()
const challenge = ref(null)
const loading = ref(true)
const error = ref('')
const selectedLanguage = ref('python')
const code = ref('')
const submitting = ref(false)
const submissionResult = ref(null)
const submissionId = ref(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const codeTemplates = {
  python: `def solve():
    # Code
    pass

if __name__ == "__main__":
    solve()
`,
  javascript: `
function solve() {
    // Code
}

solve();
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Code
    return 0;
}
`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Code
    }
}
`
}

onMounted(async () => {
  try {
    const response = await axios.get(`${API_URL}/api/challenges/${route.params.id}`)
    challenge.value = response.data
    
    if (challenge.value.allowed_languages.length > 0) {
      selectedLanguage.value = challenge.value.allowed_languages[0]
      code.value = codeTemplates[selectedLanguage.value] || ''
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Error loading challenge'
  } finally {
    loading.value = false
  }
})

watch(selectedLanguage, (newLang) => {
  if (!code.value || code.value === codeTemplates[selectedLanguage.value]) {
    code.value = codeTemplates[newLang] || ''
  }
})

const submitSolution = async () => {
  if (challenge.value.isCompleted) {
    alert('You have already completed this challenge. You cannot submit any more solutions.')
    return
  }

  if (!code.value.trim()) {
    alert('Please write code before submitting.')
    return
  }

  submitting.value = true
  submissionResult.value = null

  try {
    const response = await axios.post(`${API_URL}/api/submissions`, {
      challengeId: challenge.value.id,
      code: code.value,
      language: selectedLanguage.value
    })

    submissionId.value = response.data.submissionId

    checkSubmissionStatus()
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Unknown error'
    alert('Error sending solution: ' + errorMsg)
    submitting.value = false
  }
}

const checkSubmissionStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/submissions/${submissionId.value}`)
    const submission = response.data

    if (submission.status === 'pending' || submission.status === 'running') {
      setTimeout(checkSubmissionStatus, 2000)
    } else {
      submissionResult.value = submission
      submitting.value = false
    }
  } catch (err) {
    console.error('Error verifying status:', err)
    submitting.value = false
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

const getLanguageLabel = (lang) => {
  const labels = {
    python: 'Python',
    javascript: 'JavaScript',
    cpp: 'C++'
  }
  return labels[lang] || lang
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    running: 'Running',
    accepted: 'Accepted',
    wrong_answer: 'Wrong answer',
    time_limit: 'Time Limit Exceeded',
    runtime_error: 'Runtime Error',
    compile_error: 'Compile Error'
  }
  return labels[status] || status
}
</script>

<style scoped>
.challenge-detail {
  padding: 1rem 0;
}

.completed-banner {
  background: linear-gradient(135deg, rgba(0, 204, 0, 0.2), rgba(0, 255, 0, 0.1));
  border: 2px solid #00cc00;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 0 20px rgba(0, 204, 0, 0.3);
}

.completed-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.completed-icon {
  font-size: 4rem;
  color: #00ff00;
  text-shadow: 0 0 15px #00ff00;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.completed-text h2 {
  color: #00ff00;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.completed-text p {
  color: #cccccc;
  font-size: 1.1rem;
}

.editor-disabled-message {
  background-color: rgba(102, 102, 102, 0.2);
  border: 1px solid #666666;
  padding: 2rem;
  text-align: center;
  color: #999999;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #ff6666;
}

.challenge-info {
  margin-bottom: 2rem;
}

.challenge-header-detail {
  margin-bottom: 1.5rem;
}

.challenge-title-large {
  color: #00cc00;
  font-size: 2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px #00cc00;
}

.challenge-meta {
  display: flex;
  gap: 1rem;
}

.difficulty-badge, .points-badge {
  padding: 0.5rem 1rem;
  border-radius: 3px;
  font-size: 0.9rem;
}

.difficulty-badge.easy {
  background-color: rgba(0, 204, 0, 0.2);
  color: #00cc00;
  border: 1px solid #00cc00;
}

.difficulty-badge.medium {
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
  border: 1px solid #ffcc00;
}

.difficulty-badge.hard {
  background-color: rgba(255, 0, 0, 0.2);
  color: #ff6666;
  border: 1px solid #ff6666;
}

.points-badge {
  background-color: rgba(255, 255, 102, 0.2);
  color: #ffff66;
  border: 1px solid #ffff66;
}

.challenge-description-box {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.description-text {
  color: #cccccc;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.6;
}

.test-cases-section {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.test-cases-section h3 {
  color: #00cc00;
  margin-bottom: 1rem;
}

.test-case {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background-color: #0f0f23;
  border-left: 3px solid #00cc00;
}

.test-case code {
  display: block;
  margin-top: 0.5rem;
  color: #ffff66;
  font-family: 'Courier New', monospace;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.language-selector label {
  color: #00cc00;
  font-weight: bold;
}

.language-selector select {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.code-section {
  margin: 2rem 0;
}

.section-title {
  color: #00cc00;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.submit-button {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  background-color: #00cc00;
  color: #0f0f23;
  border: 2px solid #00cc00;
  font-weight: bold;
}

.submit-button:hover:not(:disabled) {
  background-color: #00ff00;
  box-shadow: 0 0 20px #00ff00;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 2px solid #333340;
  background-color: #10101a;
}

.result-section h3 {
  color: #00cc00;
  margin-bottom: 1rem;
}

.result-box {
  padding: 1.5rem;
  border-radius: 5px;
}

.result-box.accepted {
  background-color: rgba(0, 204, 0, 0.1);
  border: 2px solid #00cc00;
}

.result-box.wrong_answer,
.result-box.runtime_error,
.result-box.compile_error {
  background-color: rgba(255, 102, 102, 0.1);
  border: 2px solid #ff6666;
}

.result-box.time_limit {
  background-color: rgba(255, 204, 0, 0.1);
  border: 2px solid #ffcc00;
}

.result-status,
.result-time,
.result-score {
  margin: 0.75rem 0;
  font-size: 1.1rem;
}

.result-status {
  font-size: 1.3rem;
  color: #ffff66;
}

.test-results {
  margin-top: 1.5rem;
}

.test-results h4 {
  color: #00cc00;
  margin-bottom: 1rem;
}

.test-result {
  padding: 0.5rem 1rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.test-result.passed {
  background-color: rgba(0, 204, 0, 0.1);
  border-left: 3px solid #00cc00;
}

.test-result.failed {
  background-color: rgba(255, 102, 102, 0.1);
  border-left: 3px solid #ff6666;
}

.test-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.test-result.passed .test-icon {
  color: #00cc00;
}

.test-result.failed .test-icon {
  color: #ff6666;
}
</style>