const express = require('express');
const axios = require('axios').default;
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JUDGE_URL = process.env.JUDGE_URL || 'http://judge:4000';
const SUBMISSIONS_DIR = process.env.SUBMISSIONS_DIR || '/app/submissions';

async function ensureSubmissionsDir() {
  try {
    await fs.mkdir(SUBMISSIONS_DIR, { recursive: true, mode: 0o755 });
  } catch (error) {
    console.error('Error creating submissions directory:', error);
  }
}
ensureSubmissionsDir();

async function saveCodeToFile(userid, challengeId, code, language) {
  try {
    const userDir = path.join(SUBMISSIONS_DIR, String(userid));
    await fs.mkdir(userDir, { recursive: true, mode: 0o755 });

    const extensions = {
      python: 'py',
      javascript: 'js',
      cpp: 'cpp',
      java: 'java'
    };

    const ext = extensions[language] || 'txt';
    const filename = `${challengeId}.${ext}`;
    const filepath = path.join(userDir, filename);

    await fs.writeFile(filepath, code, 'utf8');
    console.log(`Code Saved: ${filepath}`);

    return filepath;
  } catch (error) {
    console.error('Error saving code:', error);
    return null;
  }
}

router.post('/', authenticate, async (req, res) => {
  try {
    const { challengeId, code, language } = req.body;
    const userId = req.user.userId;

    if (!challengeId || !code || !language) {
      return res.status(400).json({ error: 'Incomplete data' });
    }

    const challengeResult = await db.query(
      'SELECT * FROM challenges WHERE id = $1 AND is_active = TRUE',
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    if (!challenge.allowed_languages.includes(language)) {
      return res.status(400).json({ error: 'Language not allowed for this challenge' });
    }

    const submissionResult = await db.query(
      `INSERT INTO submissions (user_id, challenge_id, code, language, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [userId, challengeId, code, language]
    );

    const submissionId = submissionResult.rows[0].id;

    evaluateSubmission(userId,submissionId, code, language, challenge,challengeId)
      .catch(err => console.error('Evaluation error:', err));

    res.json({
      message: 'Solution sent successfully',
      submissionId
    });
  } catch (error) {
    console.error('Error sending solution:', error);
    res.status(500).json({ error: 'Error sending solution' });
  }
});

router.get('/user/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT 
        s.id, s.challenge_id, c.title as challenge_title,
        s.language, s.status, s.score, s.submitted_at
       FROM submissions s
       JOIN challenges c ON s.challenge_id = c.id
       WHERE s.user_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error obtaining shipments:', error);
    res.status(500).json({ error: 'Error obtaining shipments' });
  }
});

async function evaluateSubmission(Username,submissionId, code, language, challenge,challengeId) {
  try {
    saveCodeToFile(Username,challengeId, code, language);
    console.log(`[Submission ${submissionId}] Starting evaluation`);

    await db.query(
      'UPDATE submissions SET status = $1 WHERE id = $2',
      ['running', submissionId]
    );

    let response;
    try {
      response = await axios.post(`${JUDGE_URL}/execute`, {
        code,
        language,
        testCases: challenge.test_cases,
        timeLimit: challenge.time_limit,
        memoryLimit: challenge.memory_limit
      }, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`[Submission ${submissionId}] Response from the judge received`);
    } catch (axiosError) {
      console.error(`[Submission ${submissionId}] Error communicating with the judge:`, axiosError.message);

      await db.query(
        `UPDATE submissions SET status = $1, evaluated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['runtime_error', submissionId]
      );
      return;
    }

    const { status, executionTime, memoryUsed, testResults } = response.data;

    let score = 0;
    if (status === 'accepted') {
      const passedTests = testResults.filter(t => t.passed).length;
      score = Math.floor((passedTests / testResults.length) * challenge.points);
    }

    console.log(`[Submission ${submissionId}] Status: ${status}, Points: ${score}`);

    await db.query(
      `UPDATE submissions 
       SET status = $1, execution_time = $2, memory_used = $3, 
           score = $4, test_results = $5, evaluated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [status, executionTime, memoryUsed, score, JSON.stringify(testResults), submissionId]
    );

    if (status === 'accepted') {
      const submission = await db.query(
        'SELECT user_id, challenge_id FROM submissions WHERE id = $1',
        [submissionId]
      );

      if (submission.rows.length > 0) {
        await db.query(
          `INSERT INTO scores (user_id, challenge_id, score)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, challenge_id)
           DO UPDATE SET score = GREATEST(scores.score, EXCLUDED.score),
                         completion_time = CURRENT_TIMESTAMP`,
          [submission.rows[0].user_id, submission.rows[0].challenge_id, score]
        );
      }
    }

    console.log(`[Submission ${submissionId}] Evaluation completed`);
  } catch (error) {
    console.error(`[Submission ${submissionId}] Error in evaluation:`, error);

    await db.query(
      `UPDATE submissions SET status = $1, evaluated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      ['runtime_error', submissionId]
    );
  }
}

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT id, challenge_id, language, status, execution_time,
              memory_used, score, test_results, submitted_at, evaluated_at
       FROM submissions
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving shipment:', error);
    res.status(500).json({ error: 'Error retrieving shipment' });
  }
});

module.exports = router;