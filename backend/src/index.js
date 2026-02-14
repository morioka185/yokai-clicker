const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimit');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/api/', apiLimiter);

// ヘルスチェック
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch {
        res.status(500).json({ status: 'error', db: 'disconnected' });
    }
});

// ルート
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/save', require('./routes/save'));
app.use('/api/v1/leaderboard', require('./routes/leaderboard'));
app.use('/api/v1/arena', require('./routes/arena'));

// プレイヤー名重複チェック
app.get('/api/v1/player/check-name/:name', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE display_name = $1',
            [req.params.name]
        );
        res.json({ available: result.rows.length === 0 });
    } catch {
        res.status(500).json({ error: 'チェックに失敗しました' });
    }
});

// 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

app.listen(PORT, () => {
    console.log(`yokai-clicker backend listening on port ${PORT}`);
});
