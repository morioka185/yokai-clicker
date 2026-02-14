const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// JWT検証ミドルウェア
function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: '認証が必要です' });
    }

    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.id, username: payload.username };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'トークンが無効または期限切れです' });
    }
}

// オプショナル認証（ログイン済みなら req.user をセット、なくても通す）
function authOptional(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.id, username: payload.username };
    } catch {
        req.user = null;
    }
    next();
}

// トークン生成
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = { authRequired, authOptional, generateToken };
