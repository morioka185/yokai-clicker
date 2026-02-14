/* ==========================================
   API通信レイヤー
   ========================================== */

const Api = {
    BASE_URL: '/api/v1',
    token: null,

    // トークン管理
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('yokai_auth_token', token);
        } else {
            localStorage.removeItem('yokai_auth_token');
        }
    },

    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('yokai_auth_token');
        }
        return this.token;
    },

    clearToken() {
        this.token = null;
        localStorage.removeItem('yokai_auth_token');
    },

    // 汎用fetchラッパー
    async request(method, path, body) {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const opts = { method, headers };
        if (body && method !== 'GET') {
            opts.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(this.BASE_URL + path, opts);
            const data = await res.json();
            if (!res.ok) {
                return { ok: false, status: res.status, error: data.error || 'エラーが発生しました' };
            }
            return { ok: true, data };
        } catch (err) {
            console.warn('API request failed:', err);
            return { ok: false, status: 0, error: 'サーバーに接続できません' };
        }
    },

    // 認証API
    async register(username, password, displayName) {
        return this.request('POST', '/auth/register', { username, password, displayName });
    },
    async login(username, password) {
        return this.request('POST', '/auth/login', { username, password });
    },
    async guestLogin() {
        return this.request('POST', '/auth/guest');
    },
    async getMe() {
        return this.request('GET', '/auth/me');
    },

    // セーブAPI
    async getSave() {
        return this.request('GET', '/save');
    },
    async putSave(saveData, version) {
        return this.request('PUT', '/save', { saveData, version });
    },

    // ランキングAPI
    async getLeaderboard(type) {
        return this.request('GET', '/leaderboard/' + type);
    },
    async getMyRank(type) {
        return this.request('GET', '/leaderboard/' + type + '/me');
    },

    // 闘技場API
    async getArenaOpponents() {
        return this.request('GET', '/arena/opponents');
    },
    async reportArenaBattle(defenderId, attackerWon, rankChange) {
        return this.request('POST', '/arena/battle', { defenderId, attackerWon, rankChange });
    },
    async updateArenaSnapshot(snapshot) {
        return this.request('PUT', '/arena/snapshot', snapshot);
    },

    // プレイヤー名チェック
    async checkName(name) {
        return this.request('GET', '/player/check-name/' + encodeURIComponent(name));
    }
};
