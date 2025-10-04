<template>
  <div class="home-container">
    <div class="hero-section">
      <pre class="ascii-art">
  __  __                        _                   _____          _      
 |  \/  |                      | |                 / ____|        | |     
 | \  / | __ _ _ __   __ _  ___| | ___   _  ___   | |     ___   __| | ___ 
 | |\/| |/ _` | '_ \ / _` |/ _ \ |/ / | | |/ _ \  | |    / _ \ / _` |/ _ \
 | |  | | (_| | | | | (_| |  __/   <| |_| | (_) | | |___| (_) | (_| |  __/
 |_|  |_|\__,_|_| |_|\__, |\___|_|\_\\__, |\___/   \_____\___/ \__,_|\___|
                      __/ |           __/ |                               
                     |___/           |___/                                
      </pre>

      <h1 class="main-title">
        Welcome to Mangekyo Code
      </h1>

      <p class="subtitle">
        In the shadows of genjutsu, your mind is the weapon, and code is the path to eternity.
      </p>

      <div class="cta-buttons">
        <router-link v-if="!isAuthenticated" to="/register" class="cta-button primary">
          [Get Started Now]
        </router-link>
        <router-link v-else to="/challenges" class="cta-button primary">
          [View Challenges]
        </router-link>
        <button class="cta-button secondary" @click="downloadFiles()">[Learn more]</button>
      </div>
    </div>

    <div id="features" class="features-section">
      <h2 class="section-title">Features</h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">💻</div>
          <h3>Simulated Linux Terminal</h3>
          <p>Write code in a realistic terminal environment</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Automatic Evaluation</h3>
          <p>Your code is automatically evaluated against test cases.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🏆</div>
          <h3>Scoring System</h3>
          <p>Earn points by solving challenges and climb the rankings.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Multiple Languages</h3>
          <p>Supports Python, JavaScript, and C++.</p>
        </div>

      </div>
    </div>

    <div class="how-it-works">
      <h2 class="section-title">How it works?</h2>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Sign up</h3>
          <p>Create your account in the system</p>
        </div>

        <div class="step-arrow">→</div>

        <div class="step">
          <div class="step-number">2</div>
          <h3>Choose a Challenge</h3>
          <p>Select from the list of available challenges</p>
        </div>

        <div class="step-arrow">→</div>

        <div class="step">
          <div class="step-number">3</div>
          <h3>Code</h3>
          <p>Type your solution into the terminal.</p>
        </div>

        <div class="step-arrow">→</div>

        <div class="step">
          <div class="step-number">4</div>
          <h3>Submit and Win</h3>
          <p>Submit your solution and earn points</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const downloadFiles = () => {
  const files = [
    "../../public/notes.pdf"
  ]

  files.forEach(file => {
    const link = document.createElement("a")
    link.href = file
    link.download = file.split("/").pop() 
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
}

</script>

<style scoped>
.home-container {
  padding: 2rem 0;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 4rem;
}

.ascii-art {
  color: #00cc00;
  font-size: 1rem;
  line-height: 1;
  margin-bottom: 2rem;
  text-shadow: 0 0 5px #00cc00;
  overflow-x: auto;
}

pre {
  overflow: hidden;
}

.main-title {
  color: #00cc00;
  font-size: 2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px #00cc00;
}

.subtitle {
  color: #999999;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  text-decoration: none;
  border: 2px solid;
  transition: all 0.3s;
  display: inline-block;
}

.cta-button.primary {
  background-color: #00cc00;
  color: #0f0f23;
  border-color: #00cc00;
}

.cta-button.primary:hover {
  background-color: #00ff00;
  box-shadow: 0 0 20px #00ff00;
  transform: translateY(-2px);
}

.cta-button.secondary {
  background-color: transparent;
  color: #00cc00;
  border-color: #00cc00;
}

.cta-button.secondary:hover {
  background-color: rgba(0, 204, 0, 0.1);
}

.section-title {
  color: #00cc00;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  text-shadow: 0 0 10px #00cc00;
}

.features-section {
  margin: 4rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: #10101a;
  border: 1px solid #333340;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  border-color: #00cc00;
  box-shadow: 0 0 15px rgba(0, 204, 0, 0.3);
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #00cc00;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #999999;
  line-height: 1.6;
}

.how-it-works {
  margin: 4rem 0;
  padding: 3rem 0;
  background-color: #10101a;
  border-top: 1px solid #333340;
  border-bottom: 1px solid #333340;
}

.steps {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.step {
  text-align: center;
  max-width: 200px;
}

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #00cc00;
  color: #0f0f23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 1rem;
  box-shadow: 0 0 15px rgba(0, 204, 0, 0.5);
}

.step h3 {
  color: #00cc00;
  margin-bottom: 0.5rem;
}

.step p {
  color: #999999;
  font-size: 0.9rem;
}

.step-arrow {
  color: #00cc00;
  font-size: 2rem;
  font-weight: bold;
}

@media (max-width: 768px) {
  .ascii-art {
    font-size: 0.4rem;
  }

  .step-arrow {
    display: none;
  }
}
</style>