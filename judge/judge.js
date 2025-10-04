const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.JUDGE_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const CODES_DIR = path.join(__dirname, 'codes');

async function ensureDirs() {
  try {
    await fs.mkdir(CODES_DIR, { recursive: true, mode: 0o777 });
    console.log(`Directory ready: ${CODES_DIR}`);
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}
ensureDirs();

const LANGUAGE_CONFIG = {
  python: {
    extension: 'py',
    compile: null,
    execute: (file) => ['python3', file],
    timeout: 5000
  },
  cpp: {
    extension: 'cpp',
    compile: (file, output) => ['g++', '-std=c++17', '-O2', file, '-o', output],
    execute: (file) => [file],
    timeout: 5000
  }
};

app.post('/execute', async (req, res) => {
  const executionId = uuidv4();
  const destDir = path.join(CODES_DIR, executionId);

  console.log(`[${executionId}] New application`);
  try {
    const { code, language, testCases, timeLimit, memoryLimit } = req.body;

    if (!code || !language || !testCases) {
      return res.status(400).json({ error: 'Incomplete data' });
    }
    if (!LANGUAGE_CONFIG[language]) {
      return res.status(400).json({ error: 'Language not supported' });
    }

    await fs.mkdir(destDir, { recursive: true, mode: 0o777 });
    const config = LANGUAGE_CONFIG[language];
    const sourceFile = path.join(destDir, `solution.${config.extension}`);

    await fs.writeFile(sourceFile, code);

    let executableFile = sourceFile;
    if (config.compile) {
      const compiledFile = path.join(destDir, 'solution');
      const compileResult = await compileCode(
        config.compile(sourceFile, compiledFile),
        timeLimit || 10000
      );

      if (!compileResult.success) {
        return res.json({
          status: 'compile_error',
          error: compileResult.error,
          testResults: []
        });
      }
      executableFile = compiledFile;
    }

    const testResults = [];
    let totalTime = 0;
    let maxMemory = 0;

    for (const testCase of testCases) {
      const result = await runTestCase(
        config.execute(executableFile),
        testCase.input,
        testCase.output,
        timeLimit || config.timeout,
        memoryLimit || 256
      );

      testResults.push(result);
      totalTime += result.executionTime || 0;
      maxMemory = Math.max(maxMemory, result.memoryUsed || 0);

      if (!result.passed) break;
    }

    const allPassed = testResults.every((r) => r.passed);
    const hasTimeout = testResults.some((r) => r.status === 'timeout');
    const hasRuntimeError = testResults.some((r) => r.status === 'runtime_error');

    let finalStatus = 'wrong_answer';
    if (allPassed) finalStatus = 'accepted';
    else if (hasTimeout) finalStatus = 'time_limit';
    else if (hasRuntimeError) finalStatus = 'runtime_error';

    res.json({
      status: finalStatus,
      executionTime: totalTime,
      memoryUsed: maxMemory,
      testResults
    });
  } catch (error) {
    console.error(`[${executionId}] Error:`, error);
    res.status(500).json({ error: 'Internal error by the judge' });
  }
});

function compileCode(command, timeout) {
  return new Promise((resolve) => {
    const process = spawn(command[0], command.slice(1));
    let stderr = '';

    const timer = setTimeout(() => {
      process.kill();
      resolve({ success: false, error: 'Compilation timeout' });
    }, timeout);

    process.stderr.on('data', (data) => (stderr += data.toString()));

    process.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ success: true });
      else resolve({ success: false, error: stderr || 'Compilation failed' });
    });

    process.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, error: err.message });
    });
  });
}

function runTestCase(command, input, expectedOutput, timeLimit, memoryLimit) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const process = spawn(command[0], command.slice(1), { cwd: path.dirname(command[0]) });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      process.kill('SIGKILL');
    }, timeLimit);

    if (input) process.stdin.write(input + '\n');
    process.stdin.end();

    process.stdout.on('data', (d) => (stdout += d.toString()));
    process.stderr.on('data', (d) => (stderr += d.toString()));

    process.on('close', (code) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      if (killed) {
        return resolve({
          passed: false,
          status: 'timeout',
          executionTime,
          input,
          expected: expectedOutput,
          actual: stdout.trim()
        });
      }

      if (code !== 0) {
        return resolve({
          passed: false,
          status: 'runtime_error',
          executionTime,
          error: stderr || `Exit code: ${code}`,
          input,
          expected: expectedOutput,
          actual: stdout.trim()
        });
      }

      const actualOutput = stdout.trim();
      const passed = actualOutput === expectedOutput.trim();

      resolve({
        passed,
        status: passed ? 'passed' : 'wrong_answer',
        executionTime,
        memoryUsed: 0,
        input,
        expected: expectedOutput,
        actual: actualOutput
      });
    });

    process.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        passed: false,
        status: 'runtime_error',
        error: err.message,
        input,
        expected: expectedOutput,
        actual: ''
      });
    });
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    codesDir: CODES_DIR
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Judge service running on port ${PORT}`);
  console.log(`Codes directory: ${CODES_DIR}`);
  console.log(
    `Supported languages: ${Object.keys(LANGUAGE_CONFIG).join(', ')}`
  );
});