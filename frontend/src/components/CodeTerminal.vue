<template>
  <div class="terminal-container" @click="focusEditor">
    <div class="terminal-header">
      <span class="terminal-title">{{ filename }}</span>
    </div>

    <div class="terminal-editor">
      <div class="line-numbers" ref="lineNumbers">
      .
      </div>

      <textarea
        ref="codeArea"
        v-model="localCode"
        class="code-textarea"
        spellcheck="false"
        @input="updateLineCount"
        @scroll="syncScroll"
        @paste.prevent="handleDisabledAction('Paste')"
        @copy.prevent="handleDisabledAction('Copy')"
        @cut.prevent="handleDisabledAction('Cut')"
        @keydown="handleKeyDown"
        @contextmenu.prevent
        @select="updateCursorPosition"
        @click="updateCursorPosition"
        @keyup="updateCursorPosition"
      ></textarea>
    </div>

    <div class="terminal-status">
      <span>Line: {{ cursorLine }} | Column: {{ cursorColumn }}</span>
      <span>characters: {{ localCode.length }}</span>
      <span class="warning"> Copy/Paste/Cut DISABLED</span>
    </div>

    <div v-if="showBlockNotification" class="block-notification">
      {{ blockedAction }} action blocked
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'python'
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const codeArea = ref(null)
const localCode = ref(props.modelValue)
const cursorLine = ref(1)
const cursorColumn = ref(0)
const showBlockNotification = ref(false)
const blockedAction = ref('')

const filename = computed(() => {
  const extensions = {
    python: 'solution.py',
    javascript: 'solution.js',
    cpp: 'solution.cpp',
    java: 'Solution.java'
  }
  return extensions[props.language] || 'solution.txt'
})

const lineCount = computed(() => {
  return localCode.value.split('\n').length
})

onMounted(() => {
  const textarea = codeArea.value
  if (!textarea) return
  
  textarea.addEventListener('copy', preventClipboard)
  textarea.addEventListener('cut', preventClipboard)
  textarea.addEventListener('paste', preventClipboard)
  textarea.addEventListener('contextmenu', preventClipboard)
  
  textarea.focus()

  updateCursorPosition()
})

const preventClipboard = (e) => {
  e.preventDefault()
  e.stopPropagation()
  return false
}

const focusEditor = () => {
  if (codeArea.value) {
    codeArea.value.focus()
  }
}

const updateCursorPosition = () => {
  if (!codeArea.value) return
  
  const position = codeArea.value.selectionStart
  const textBeforeCursor = localCode.value.substring(0, position)
  const lines = textBeforeCursor.split('\n')
  
  cursorLine.value = lines.length
  cursorColumn.value = lines[lines.length - 1].length + 1
}

const handleDisabledAction = (action) => {
  blockedAction.value = action
  showBlockNotification.value = true
  
  setTimeout(() => {
    showBlockNotification.value = false
  }, 2000)
}

const handleKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase()
    
    // Bloquear copiar, pegar, cortar
    if (['c', 'v', 'x'].includes(key)) {
      e.preventDefault()
      handleDisabledAction(key === 'c' ? 'Copy' : key === 'v' ? 'Paste' : 'Cut')
      return
    }
    
    if (key === 'a') {
      return
    }
    
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    insertTab()
    return
  }

  if (e.altKey) {
    return
  }

  nextTick(() => {
    updateCursorPosition()
  })
}

const insertTab = () => {
  const textarea = codeArea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const spaces = '    '

  localCode.value = 
    localCode.value.substring(0, start) +
    spaces +
    localCode.value.substring(end)

  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + spaces.length
    updateCursorPosition()
  })
}

const syncScroll = () => {
  const textarea = codeArea.value
  const lines = document.querySelector('.line-numbers')
  if (textarea && lines) {
    lines.scrollTop = textarea.scrollTop
  }
}

const saveCode = () => {
  emit('save', localCode.value)
  
  const notification = document.createElement('div')
  notification.textContent = 'Saved code'
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #00cc00;
    color: #000;
    padding: 1rem 2rem;
    border-radius: 5px;
    font-weight: bold;
    z-index: 9999;
  `
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.remove()
  }, 2000)
}

watch(localCode, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localCode.value) {
    localCode.value = newValue
  }
})
</script>

<style scoped>
.terminal-container {
  border: 2px solid #00cc00;
  background-color: #000000;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 20px rgba(0, 204, 0, 0.3);
  position: relative;
  cursor: text;
}

.terminal-header {
  background-color: #003300;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #00cc00;
}

.terminal-title {
  color: #00ff00;
  font-weight: bold;
  text-shadow: 0 0 5px #00ff00;
}

.terminal-editor {
  display: flex;
  height: 450px; 
  background-color: #000000;
  overflow: hidden;
}

.line-numbers {
  background-color: #001a00;
  color: #006600;
  padding: 0rem;
  text-align: right;
  user-select: none;
  border-right: 1px solid #003300;
  min-width: 1rem;
  font-size: 1.2rem;
  overflow-y: auto;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.line-numbers::-webkit-scrollbar {
  display: none;
}
.line-number {
  line-height: 1.5;
  font-size: 1rem;
}

.code-textarea {
  flex: 1;
  background-color: #000000;
  color: #00ff00;
  border: none;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  outline: none;
  overflow-y: auto;
  height: 100%;
  caret-color: #00ff00;
}

.code-textarea::selection {
  background-color: #004400;
  color: #00ff00;
}

.code-textarea::-webkit-scrollbar {
  width: 1px;
}

.code-textarea::-webkit-scrollbar-track {
  background: #001a00;
}

.code-textarea::-webkit-scrollbar-thumb {
  background: #00cc00;
  border-radius: 5px;
}

.terminal-status {
  background-color: #000000;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #00cc00;
  flex-wrap: wrap;
  gap: 1rem;
}

.warning {
  color: #ffff00;
  font-weight: bold;
}

.block-notification {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ff0000;
  color: #ffffff;
  padding: 1.5rem 3rem;
  border: 3px solid #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
  z-index: 1000;
  animation: shake 0.5s, fadeOut 2s forwards;
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-50%, -50%) rotate(-5deg); }
  75% { transform: translate(-50%, -50%) rotate(5deg); }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

@media (max-width: 768px) {
  .terminal-editor {
    height: 350px;
  }
  
  .terminal-status {
    font-size: 0.75rem;
  }
}
</style>