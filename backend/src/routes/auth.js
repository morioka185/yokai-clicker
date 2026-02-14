const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { authRequired } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

// POST /api/v1/auth/register
router.post('/register', loginLimiter, async (req, res) => {
    try {
        const { username, password, displayName } = req.body;
        const result = await AuthService.register(username, password, displayName);
        res.status(201).json(result);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'サーバーエラー' });
    }
});

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);
        res.json(result);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'サーバーエラー' });
    }
});

// POST /api/v1/auth/guest
router.post('/guest', loginLimiter, async (req, res) => {
    try {
        const result = await AuthService.createGuest();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: 'ゲストアカウント作成に失敗しました' });
    }
});

// GET /api/v1/auth/me
router.get('/me', authRequired, async (req, res) => {
    try {
        const user = await AuthService.getMe(req.user.id);
        res.json(user);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'サーバーエラー' });
    }
});

module.exports = router;
