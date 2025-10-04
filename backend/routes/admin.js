const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.is_admin, u.created_at, u.last_login,
        COUNT(DISTINCT s.challenge_id) as challenges_solved,
        COALESCE(SUM(sc.score), 0) as total_score
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'accepted'
      LEFT JOIN scores sc ON u.id = sc.user_id
      GROUP BY u.id
      ORDER BY total_score DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points,
        c.allowed_languages, c.time_limit, c.memory_limit, c.is_active,
        c.created_at,
        COUNT(s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.user_id END) as solved_by
      FROM challenges c
      LEFT JOIN submissions s ON c.id = s.challenge_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obtaining challenges:', error);
    res.status(500).json({ error: 'Error obtaining challenges' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await db.query(
      'SELECT id, username, email, is_admin, created_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const submissionsResult = await db.query(`
      SELECT 
        s.id, s.challenge_id, c.title as challenge_title,
        s.language, s.status, s.score, s.execution_time,
        s.submitted_at
      FROM submissions s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.submitted_at DESC
    `, [id]);

    res.json({
      user: userResult.rows[0],
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error('Error obtaining user:', error);
    res.status(500).json({ error: 'Error obtaining user' });
  }
});

router.post('/challenges', async (req, res) => {
  try {
    const {
      title, description, difficulty, points,
      testCases, timeLimit, memoryLimit, allowedLanguages
    } = req.body;

    if (!title || !description || !difficulty || !testCases) {
      return res.status(400).json({ error: 'Incomplete data' });
    }

    const result = await db.query(
      `INSERT INTO challenges 
       (title, description, difficulty, points, test_cases, time_limit, memory_limit, allowed_languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title, description, difficulty, points || 100,
        JSON.stringify(testCases), timeLimit || 5000,
        memoryLimit || 256, JSON.stringify(allowedLanguages || ['python', 'javascript'])
      ]
    );

    res.status(201).json({
      message: 'Challenge successfully created',
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Error creating challenge' });
  }
});

router.put('/challenges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, difficulty, points,
      testCases, timeLimit, memoryLimit, allowedLanguages, isActive
    } = req.body;

    const result = await db.query(
      `UPDATE challenges
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           difficulty = COALESCE($3, difficulty),
           points = COALESCE($4, points),
           test_cases = COALESCE($5, test_cases),
           time_limit = COALESCE($6, time_limit),
           memory_limit = COALESCE($7, memory_limit),
           allowed_languages = COALESCE($8, allowed_languages),
           is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [
        title, description, difficulty, points,
        testCases ? JSON.stringify(testCases) : null,
        timeLimit, memoryLimit,
        allowedLanguages ? JSON.stringify(allowedLanguages) : null,
        isActive, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      message: 'Challenge successfully updated',
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Error updating challenge' });
  }
});

router.delete('/challenges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submissions = await db.query(
      'SELECT COUNT(*) FROM submissions WHERE challenge_id = $1',
      [id]
    );

    const hasSubmissions = parseInt(submissions.rows[0].count) > 0;

    if (hasSubmissions) {
      await db.query(
        'UPDATE challenges SET is_active = FALSE WHERE id = $1',
        [id]
      );
      res.json({ 
        message: 'Challenge disabled (has associated shipments)',
        deactivated: true 
      });
    } else {
      await db.query('DELETE FROM challenges WHERE id = $1', [id]);
      res.json({ 
        message: 'Challenge completely eliminated',
        deleted: true 
      });
    }
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Error deleting challenge' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const challengesCount = await db.query('SELECT COUNT(*) FROM challenges WHERE is_active = TRUE');
    const submissionsCount = await db.query('SELECT COUNT(*) FROM submissions');
    
    const recentActivity = await db.query(`
      SELECT 
        u.username,
        c.title as challenge_title,
        s.status,
        s.language,
        s.submitted_at
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN challenges c ON s.challenge_id = c.id
      ORDER BY s.submitted_at DESC
      LIMIT 20
    `);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalChallenges: parseInt(challengesCount.rows[0].count),
      totalSubmissions: parseInt(submissionsCount.rows[0].count),
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Error obtaining statistics:', error);
    res.status(500).json({ error: 'Error obtaining statistics' });
  }
});

module.exports = router;