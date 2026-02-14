const express = require('express');
const router = express.Router();
const ArenaService = require('../services/arenaService');
const { authRequired } = require('../middleware/auth');

// GET /api/v1/arena/opponents
router.get('/opponents', authRequired, async (req, res) => {
    try {
        const opponents = await ArenaService.getOpponents(req.user.id);
        res.json(opponents);
    } catch (err) {
        res.status(500).json({ error: '対戦相手の取得に失敗しました' });
    }
});

// POST /api/v1/arena/battle
router.post('/battle', authRequired, async (req, res) => {
    try {
        const { defenderId, attackerWon, rankChange } = req.body;
        if (typeof attackerWon !== 'boolean') {
            return res.status(400).json({ error: '勝敗情報が必要です' });
        }
        const result = await ArenaService.reportBattle(
            req.user.id,
            defenderId,
            attackerWon,
            rankChange || 0
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: '対戦結果の報告に失敗しました' });
    }
});

// PUT /api/v1/arena/snapshot
router.put('/snapshot', authRequired, async (req, res) => {
    try {
        const result = await ArenaService.updateSnapshot(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'スナップショットの更新に失敗しました' });
    }
});

module.exports = router;
