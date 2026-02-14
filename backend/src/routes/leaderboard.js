const express = require('express');
const router = express.Router();
const LeaderboardService = require('../services/leaderboardService');
const { authRequired } = require('../middleware/auth');

// GET /api/v1/leaderboard/:type
router.get('/:type', async (req, res) => {
    try {
        const data = await LeaderboardService.getLeaderboard(req.params.type);
        res.json(data);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'サーバーエラー' });
    }
});

// GET /api/v1/leaderboard/:type/me
router.get('/:type/me', authRequired, async (req, res) => {
    try {
        const data = await LeaderboardService.getMyRank(req.params.type, req.user.id);
        res.json(data);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'サーバーエラー' });
    }
});

module.exports = router;
