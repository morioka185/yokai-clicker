/* ==========================================
   セーブ/ロードシステム
   ========================================== */

const Save = {
    SAVE_KEY: 'youkai_taimairoku_save',

    save() {
        const data = {
            version: GameState.version,
            timestamp: Date.now(),
            player: GameState.player,
            inventory: GameState.inventory,
            equipped: GameState.equipped,
            shikigami: GameState.shikigami,
            gachaPity: GameState.gachaPity,
            arena: GameState.arena,
            encyclopedia: GameState.encyclopedia,
            settings: GameState.settings
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);

            // バージョンチェック・マイグレーション
            if (data.player) GameState.player = { ...GameState.player, ...data.player };
            if (data.inventory) GameState.inventory = { ...GameState.inventory, ...data.inventory };
            if (data.equipped) GameState.equipped = { ...GameState.equipped, ...data.equipped };
            if (data.shikigami) GameState.shikigami = { ...GameState.shikigami, ...data.shikigami };
            if (data.gachaPity) GameState.gachaPity = { ...GameState.gachaPity, ...data.gachaPity };
            if (data.arena) GameState.arena = { ...GameState.arena, ...data.arena };
            if (data.encyclopedia) GameState.encyclopedia = { ...GameState.encyclopedia, ...data.encyclopedia };
            if (data.settings) GameState.settings = { ...GameState.settings, ...data.settings };

            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    },

    autoSave() {
        if (GameState.settings.autoSave) {
            this.save();
            // ログイン中はサーバーにもデバウンス付きで保存
            this.debouncedServerSave();
        }
    },

    // サーバー保存のデバウンス（30秒）
    _serverSaveTimer: null,
    debouncedServerSave() {
        if (!GameState.online.loggedIn) return;
        if (this._serverSaveTimer) clearTimeout(this._serverSaveTimer);
        this._serverSaveTimer = setTimeout(() => {
            this.uploadToServer();
        }, 30000);
    },

    // セーブデータをサーバーにアップロード
    async uploadToServer() {
        if (!GameState.online.loggedIn) return;
        try {
            const saveData = {
                version: GameState.version,
                timestamp: Date.now(),
                player: GameState.player,
                inventory: GameState.inventory,
                equipped: GameState.equipped,
                shikigami: GameState.shikigami,
                gachaPity: GameState.gachaPity,
                arena: GameState.arena,
                encyclopedia: GameState.encyclopedia,
                settings: GameState.settings
            };
            await Api.putSave(saveData, GameState.version);
        } catch (e) {
            console.warn('Server save failed:', e);
        }
    },

    // ログイン時のサーバー同期（タイムスタンプ比較）
    async syncWithServer() {
        if (!GameState.online.loggedIn) return;
        try {
            const res = await Api.getSave();
            if (!res.ok || !res.data.exists) {
                // サーバーにデータなし → ローカルをアップロード
                if (this.hasSave()) {
                    this.uploadToServer();
                }
                return;
            }

            const serverData = res.data.saveData;
            const serverTime = serverData.timestamp || 0;

            // ローカルのタイムスタンプ取得
            const raw = localStorage.getItem(this.SAVE_KEY);
            const localTime = raw ? (JSON.parse(raw).timestamp || 0) : 0;

            if (serverTime > localTime) {
                // サーバーの方が新しい → ダウンロード
                this.applyData(serverData);
                this.save();
                showNotification('サーバーからセーブデータを同期しました', 'info');
            } else if (localTime > serverTime) {
                // ローカルの方が新しい → アップロード
                this.uploadToServer();
            }
        } catch (e) {
            console.warn('Sync failed:', e);
        }
    },

    // データ適用ヘルパー
    applyData(data) {
        if (data.player) GameState.player = { ...GameState.player, ...data.player };
        if (data.inventory) GameState.inventory = { ...GameState.inventory, ...data.inventory };
        if (data.equipped) GameState.equipped = { ...GameState.equipped, ...data.equipped };
        if (data.shikigami) GameState.shikigami = { ...GameState.shikigami, ...data.shikigami };
        if (data.gachaPity) GameState.gachaPity = { ...GameState.gachaPity, ...data.gachaPity };
        if (data.arena) GameState.arena = { ...GameState.arena, ...data.arena };
        if (data.encyclopedia) GameState.encyclopedia = { ...GameState.encyclopedia, ...data.encyclopedia };
        if (data.settings) GameState.settings = { ...GameState.settings, ...data.settings };
    },

    // エクスポート（テキスト）
    exportSave() {
        const data = {
            version: GameState.version,
            timestamp: Date.now(),
            player: GameState.player,
            inventory: GameState.inventory,
            equipped: GameState.equipped,
            shikigami: GameState.shikigami,
            gachaPity: GameState.gachaPity,
            arena: GameState.arena,
            encyclopedia: GameState.encyclopedia,
            settings: GameState.settings
        };

        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        return encoded;
    },

    // インポート
    importSave(encoded) {
        try {
            const json = decodeURIComponent(escape(atob(encoded)));
            const data = JSON.parse(json);

            if (data.player) GameState.player = { ...GameState.player, ...data.player };
            if (data.inventory) GameState.inventory = { ...GameState.inventory, ...data.inventory };
            if (data.equipped) GameState.equipped = { ...GameState.equipped, ...data.equipped };
            if (data.shikigami) GameState.shikigami = { ...GameState.shikigami, ...data.shikigami };
            if (data.gachaPity) GameState.gachaPity = { ...GameState.gachaPity, ...data.gachaPity };
            if (data.arena) GameState.arena = { ...GameState.arena, ...data.arena };
            if (data.encyclopedia) GameState.encyclopedia = { ...GameState.encyclopedia, ...data.encyclopedia };
            if (data.settings) GameState.settings = { ...GameState.settings, ...data.settings };

            this.save();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },

    // 設定画面
    renderSettings() {
        const content = document.getElementById('settings-content');
        content.innerHTML = `
            <div style="max-width:500px">
                <h3 style="margin-bottom:16px">ゲーム設定</h3>

                <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:32px">
                    <label style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md)">
                        <span>効果音</span>
                        <input type="checkbox" ${GameState.settings.soundEnabled ? 'checked' : ''} onchange="GameState.settings.soundEnabled=this.checked;Save.autoSave()">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md)">
                        <span>ダメージ数字表示</span>
                        <input type="checkbox" ${GameState.settings.damageNumbers ? 'checked' : ''} onchange="GameState.settings.damageNumbers=this.checked;Save.autoSave()">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md)">
                        <span>画面振動</span>
                        <input type="checkbox" ${GameState.settings.shakeScreen ? 'checked' : ''} onchange="GameState.settings.shakeScreen=this.checked;Save.autoSave()">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md)">
                        <span>オートセーブ</span>
                        <input type="checkbox" ${GameState.settings.autoSave ? 'checked' : ''} onchange="GameState.settings.autoSave=this.checked">
                    </label>
                </div>

                <h3 style="margin-bottom:16px">セーブデータ</h3>

                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px">
                    <button class="btn btn-primary" onclick="Save.save();showNotification('セーブ完了！','success')">💾 手動セーブ</button>
                    <button class="btn btn-secondary" onclick="Save.showExport()">📤 データエクスポート</button>
                    <button class="btn btn-secondary" onclick="Save.showImport()">📥 データインポート</button>
                    <button class="btn btn-danger" onclick="Save.confirmDelete()">🗑️ セーブデータ削除</button>
                </div>

                <div id="save-io-area"></div>

                <h3 style="margin-bottom:16px;margin-top:32px">アカウント</h3>
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px">
                    ${GameState.online.loggedIn ? `
                        <div style="padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md)">
                            <div style="font-size:13px;color:var(--text-secondary)">ログイン中: <strong style="color:var(--text-primary)">${GameState.online.displayName || GameState.online.username}</strong></div>
                            ${GameState.online.isGuest ? '<div style="font-size:11px;color:var(--accent-gold);margin-top:4px">ゲストアカウント</div>' : ''}
                        </div>
                        <button class="btn btn-secondary" onclick="Save.uploadToServer();showNotification('サーバーに保存しました','success')">☁️ サーバーに保存</button>
                        <button class="btn btn-danger" onclick="Auth.logout();Save.renderSettings()">ログアウト</button>
                    ` : `
                        <div style="padding:12px;background:var(--bg-darkest);border-radius:var(--radius-md);color:var(--text-muted);font-size:13px">
                            未ログイン（ローカル保存のみ）
                        </div>
                        <button class="btn btn-primary" onclick="Auth.showLoginModal()">ログイン / 登録</button>
                    `}
                </div>

                <h3 style="margin-bottom:16px;margin-top:32px">ゲーム情報</h3>
                <div style="font-size:12px;color:var(--text-muted)">
                    妖怪退魔録 〜無限百鬼夜行〜 v${GameState.version}<br>
                    クリッカー × ハクスラ × ローグライク
                </div>
            </div>
        `;
    },

    showExport() {
        const area = document.getElementById('save-io-area');
        const data = this.exportSave();
        area.innerHTML = `
            <textarea style="width:100%;height:100px;background:var(--bg-darkest);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:8px;font-size:11px;resize:none" readonly onclick="this.select()">${data}</textarea>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">テキストをコピーして保存してください</div>
        `;
    },

    showImport() {
        const area = document.getElementById('save-io-area');
        area.innerHTML = `
            <textarea id="import-data" style="width:100%;height:100px;background:var(--bg-darkest);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:8px;font-size:11px;resize:none" placeholder="エクスポートしたテキストを貼り付け"></textarea>
            <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="Save.doImport()">インポート実行</button>
        `;
    },

    doImport() {
        const data = document.getElementById('import-data').value.trim();
        if (!data) return;
        if (this.importSave(data)) {
            showNotification('インポート成功！ページをリロードします。', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('インポート失敗。データが正しくありません。', 'error');
        }
    },

    confirmDelete() {
        if (confirm('本当にセーブデータを削除しますか？この操作は取り消せません。')) {
            this.deleteSave();
            showNotification('セーブデータを削除しました。リロードします。', 'warning');
            setTimeout(() => location.reload(), 1500);
        }
    }
};
