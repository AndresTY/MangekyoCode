const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points,
        c.allowed_languages, c.time_limit, c.memory_limit,
        (SELECT COUNT(*) FROM submissions WHERE challenge_id = c.id AND user_id = $1 AND status = 'accepted') as solved
      FROM challenges c
      WHERE c.is_active = TRUE
      ORDER BY c.id ASC
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obtaining challenges:', error);
    res.status(500).json({ error: 'Error obtaining challenges' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await db.query(`
      SELECT 
        id, title, description, difficulty, points,
        test_cases, allowed_languages, time_limit, memory_limit
      FROM challenges
      WHERE id = $1 AND is_active = TRUE
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const completedCheck = await db.query(`
      SELECT id FROM submissions 
      WHERE user_id = $1 AND challenge_id = $2 AND status = 'accepted'
      LIMIT 1
    `, [userId, id]);

    const isCompleted = completedCheck.rows.length > 0;

    const challenge = result.rows[0];
    const publicTestCases = challenge.test_cases.map(tc => ({
      input: tc.input
    }));

    res.json({
      ...challenge,
      test_cases: publicTestCases,
      isCompleted
    });
  } catch (error) {
    console.error('Error obtaining challenge:', error);
    res.status(500).json({ error: 'Error obtaining challenge' });
  }
});

router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN status = 'accepted' THEN user_id END) as solved_by,
        AVG(CASE WHEN status = 'accepted' THEN execution_time END) as avg_time
      FROM submissions
      WHERE challenge_id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obtaining statistics:', error);
    res.status(500).json({ error: 'Error obtaining statistics' });
  }
});

router.get('/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        u.username,
        s.score,
        s.completion_time,
        sub.execution_time,
        sub.language
      FROM scores s
      JOIN users u ON s.user_id = u.id
      JOIN submissions sub ON sub.user_id = s.user_id AND sub.challenge_id = s.challenge_id AND sub.status = 'accepted'
      WHERE s.challenge_id = $1
      ORDER BY s.score DESC, sub.execution_time ASC
      LIMIT 100
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obtaining leaderboard:', error);
    res.status(500).json({ error: 'Error obtaining leaderboard' });
  }
});

module.exports = router;