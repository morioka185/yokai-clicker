const rateLimit = require('express-rate-limit');

// ログイン用: 15回/15分
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: 'リクエストが多すぎます。しばらくお待ちください。' },
    standardHeaders: true,
    legacyHeaders: false
});

// API全般: 100回/分
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'リクエストが多すぎます。しばらくお待ちください。' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { loginLimiter, apiLimiter };
