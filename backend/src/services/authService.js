const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

const AuthService = {
    // アカウント登録
    async register(username, password, displayName) {
        // バリデーション
        if (!username || username.length < 3 || username.length > 20) {
            throw { status: 400, message: 'ユーザー名は3〜20文字で入力してください' };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw { status: 400, message: 'ユーザー名は英数字とアンダースコアのみ使用可能です' };
        }
        if (!password || password.length < 6) {
            throw { status: 400, message: 'パスワードは6文字以上で入力してください' };
        }
        if (!displayName || displayName.length < 1 || displayName.length > 30) {
            throw { status: 400, message: '表示名は1〜30文字で入力してください' };
        }

        // 重複チェック
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            throw { status: 409, message: 'このユーザー名は既に使用されています' };
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name',
            [username, passwordHash, displayName]
        );

        const user = result.rows[0];
        const token = generateToken(user);
        return { token, user: { id: user.id, username: user.username, displayName: user.display_name } };
    },

    // ログイン
    async login(username, password) {
        const result = await pool.query(
            'SELECT id, username, password_hash, display_name FROM users WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            throw { status: 401, message: 'ユーザー名またはパスワードが正しくありません' };
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            throw { status: 401, message: 'ユーザー名またはパスワードが正しくありません' };
        }

        // 最終ログイン日時更新
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const token = generateToken(user);
        return { token, user: { id: user.id, username: user.username, displayName: user.display_name } };
    },

    // ゲストアカウント作成
    async createGuest() {
        const guestId = 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const displayName = '旅の退魔師';
        // ゲストにはランダムなパスワードを設定（ログイン不要だが内部的に必要）
        const passwordHash = await bcrypt.hash(guestId, SALT_ROUNDS);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, display_name, is_guest) VALUES ($1, $2, $3, TRUE) RETURNING id, username, display_name',
            [guestId, passwordHash, displayName]
        );

        const user = result.rows[0];
        const token = generateToken(user);
        return { token, user: { id: user.id, username: user.username, displayName: user.display_name, isGuest: true } };
    },

    // ユーザー情報取得
    async getMe(userId) {
        const result = await pool.query(
            'SELECT id, username, display_name, is_guest, created_at FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            throw { status: 404, message: 'ユーザーが見つかりません' };
        }
        const u = result.rows[0];
        return { id: u.id, username: u.username, displayName: u.display_name, isGuest: u.is_guest, createdAt: u.created_at };
    }
};

module.exports = AuthService;
