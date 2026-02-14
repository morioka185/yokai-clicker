/* ==========================================
   認証UI・トークン管理
   ========================================== */

const Auth = {
    // 自動ログイン試行
    async tryAutoLogin() {
        const token = Api.getToken();
        if (!token) return false;

        const res = await Api.getMe();
        if (res.ok) {
            GameState.online.loggedIn = true;
            GameState.online.userId = res.data.id;
            GameState.online.username = res.data.username;
            GameState.online.displayName = res.data.displayName;
            GameState.online.isGuest = res.data.isGuest || false;
            this.updateAuthUI();
            return true;
        } else {
            Api.clearToken();
            return false;
        }
    },

    // ログインモーダル表示
    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        this.renderLoginForm();
        modal.classList.add('active');
    },

    // モーダルを閉じる
    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('active');
    },

    // ログインフォーム描画
    renderLoginForm() {
        const content = document.getElementById('auth-modal-content');
        content.innerHTML = `
            <h2 style="margin-bottom:20px;text-align:center">ログイン</h2>
            <div id="auth-error" style="color:var(--accent-red);font-size:13px;margin-bottom:12px;display:none"></div>
            <div style="display:flex;flex-direction:column;gap:12px">
                <input type="text" id="auth-username" placeholder="ユーザー名" maxlength="20"
                    style="padding:10px 12px;background:var(--bg-darkest);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px">
                <input type="password" id="auth-password" placeholder="パスワード"
                    style="padding:10px 12px;background:var(--bg-darkest);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px">
                <button class="btn btn-primary" onclick="Auth.doLogin()">ログイン</button>
                <button class="btn btn-secondary" onclick="Auth.renderRegisterForm()">アカウント登録へ</button>
                <div style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:8px">
                    <span style="cursor:pointer;text-decoration:underline" onclick="Auth.closeModal()">閉じる</span>
                </div>
            </div>
        `;
    },

    // 登録フォーム描画
    renderRegisterForm() {
        const content = document.getElementById('auth-modal-content');
        content.innerHTML = `
            <h2 style="margin-bottom:20px;text-align:center">アカウント登録</h2>
            <div id="auth-error" style="color:var(--accent-red);font-size:13px;margin-bottom:12px;display:none"></div>
            <div style="display:flex;flex-direction:column;gap:12px">
                <input type="text" id="auth-username" placeholder="ユーザー名（英数字3〜20文字）" maxlength="20"
                    style="padding:10px 12px;background:var(--bg-darkest);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px">
                <input type="text" id="auth-displayname" placeholder="表示名（ゲーム内名前）" maxlength="30"
                    style="padding:10px 12px;background:var(--bg-darkest);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px">
                <input type="password" id="auth-password" placeholder="パスワード（6文字以上）"
                    style="padding:10px 12px;background:var(--bg-darkest);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px">
                <button class="btn btn-primary" onclick="Auth.doRegister()">登録</button>
                <button class="btn btn-secondary" onclick="Auth.renderLoginForm()">ログインへ戻る</button>
                <div style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:8px">
                    <span style="cursor:pointer;text-decoration:underline" onclick="Auth.closeModal()">閉じる</span>
                </div>
            </div>
        `;
    },

    // エラー表示
    showError(msg) {
        const el = document.getElementById('auth-error');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    },

    // ログイン実行
    async doLogin() {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        if (!username || !password) {
            return this.showError('ユーザー名とパスワードを入力してください');
        }

        const res = await Api.login(username, password);
        if (!res.ok) {
            return this.showError(res.error);
        }

        Api.setToken(res.data.token);
        GameState.online.loggedIn = true;
        GameState.online.userId = res.data.user.id;
        GameState.online.username = res.data.user.username;
        GameState.online.displayName = res.data.user.displayName;
        GameState.online.isGuest = false;

        this.closeModal();
        this.updateAuthUI();
        showNotification('ログインしました', 'success');

        // サーバーとセーブ同期
        Save.syncWithServer();
    },

    // 登録実行
    async doRegister() {
        const username = document.getElementById('auth-username').value.trim();
        const displayName = document.getElementById('auth-displayname').value.trim();
        const password = document.getElementById('auth-password').value;

        if (!username || !displayName || !password) {
            return this.showError('全ての項目を入力してください');
        }

        const res = await Api.register(username, password, displayName);
        if (!res.ok) {
            return this.showError(res.error);
        }

        Api.setToken(res.data.token);
        GameState.online.loggedIn = true;
        GameState.online.userId = res.data.user.id;
        GameState.online.username = res.data.user.username;
        GameState.online.displayName = res.data.user.displayName;
        GameState.online.isGuest = false;

        // 表示名をゲーム内プレイヤー名にも反映
        GameState.player.name = displayName;

        this.closeModal();
        this.updateAuthUI();
        showNotification('アカウントを登録しました！', 'success');

        // ローカルのセーブデータをサーバーにアップロード
        Save.uploadToServer();
    },

    // ゲストログイン
    async doGuestLogin() {
        const res = await Api.guestLogin();
        if (!res.ok) {
            showNotification('ゲストログインに失敗しました', 'error');
            return;
        }

        Api.setToken(res.data.token);
        GameState.online.loggedIn = true;
        GameState.online.userId = res.data.user.id;
        GameState.online.username = res.data.user.username;
        GameState.online.displayName = res.data.user.displayName;
        GameState.online.isGuest = true;

        this.updateAuthUI();
        showNotification('ゲストとしてログインしました', 'info');
    },

    // ログアウト
    logout() {
        Api.clearToken();
        GameState.online.loggedIn = false;
        GameState.online.userId = null;
        GameState.online.username = null;
        GameState.online.displayName = null;
        GameState.online.isGuest = false;
        this.updateAuthUI();
        showNotification('ログアウトしました', 'info');
    },

    // 認証UIの状態更新
    updateAuthUI() {
        // タイトル画面のボタン
        const loginBtn = document.getElementById('btn-title-login');
        const guestBtn = document.getElementById('btn-title-guest');
        const loggedInInfo = document.getElementById('title-logged-in');

        if (GameState.online.loggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (guestBtn) guestBtn.style.display = 'none';
            if (loggedInInfo) {
                loggedInInfo.style.display = '';
                loggedInInfo.textContent = GameState.online.displayName || GameState.online.username;
            }
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (guestBtn) guestBtn.style.display = '';
            if (loggedInInfo) loggedInInfo.style.display = 'none';
        }
    }
};
