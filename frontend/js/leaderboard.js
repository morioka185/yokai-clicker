/* ==========================================
   ランキング表示
   ========================================== */

const Leaderboard = {
    currentTab: 'infinite',

    render() {
        const content = document.getElementById('leaderboard-content');
        if (!content) return;

        content.innerHTML = `
            <div class="leaderboard-tabs" style="display:flex;gap:8px;margin-bottom:20px">
                <button class="btn btn-sm ${this.currentTab === 'infinite' ? 'btn-primary' : 'btn-secondary'}" onclick="Leaderboard.switchTab('infinite')">無限回廊</button>
                <button class="btn btn-sm ${this.currentTab === 'clears' ? 'btn-primary' : 'btn-secondary'}" onclick="Leaderboard.switchTab('clears')">総クリア数</button>
                <button class="btn btn-sm ${this.currentTab === 'arena' ? 'btn-primary' : 'btn-secondary'}" onclick="Leaderboard.switchTab('arena')">闘技場</button>
            </div>
            <div id="leaderboard-my-rank" style="margin-bottom:16px"></div>
            <div id="leaderboard-list" style="font-size:13px;color:var(--text-muted)">読み込み中...</div>
        `;

        this.loadData();
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    async loadData() {
        const listEl = document.getElementById('leaderboard-list');
        const myRankEl = document.getElementById('leaderboard-my-rank');

        // ランキングデータ取得
        const res = await Api.getLeaderboard(this.currentTab);
        if (!res.ok) {
            listEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px">ランキングを取得できませんでした</div>';
            return;
        }

        const data = res.data;
        if (data.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px">まだランキングデータがありません</div>';
        } else {
            const scoreLabel = this.getScoreLabel();
            listEl.innerHTML = `
                <table style="width:100%;border-collapse:collapse">
                    <thead>
                        <tr style="border-bottom:1px solid var(--border-color);text-align:left">
                            <th style="padding:8px 4px;width:40px">#</th>
                            <th style="padding:8px 4px">プレイヤー</th>
                            <th style="padding:8px 4px;text-align:right">${scoreLabel}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr style="border-bottom:1px solid rgba(51,51,85,0.3)">
                                <td style="padding:6px 4px;font-weight:700;color:${row.rank <= 3 ? 'var(--accent-gold)' : 'var(--text-secondary)'}">${row.rank}</td>
                                <td style="padding:6px 4px;color:var(--text-primary)">${this.escapeHtml(row.displayName)}</td>
                                <td style="padding:6px 4px;text-align:right;color:var(--accent-primary)">${this.formatScore(row)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        // 自分の順位
        if (GameState.online.loggedIn) {
            const myRes = await Api.getMyRank(this.currentTab);
            if (myRes.ok && myRes.data.rank) {
                myRankEl.innerHTML = `
                    <div class="equip-card" style="text-align:center">
                        <div style="font-size:12px;color:var(--text-secondary)">あなたの順位</div>
                        <div style="font-size:24px;font-weight:700;color:var(--accent-gold)">${myRes.data.rank}位</div>
                        <div style="font-size:13px;color:var(--text-secondary)">スコア: ${myRes.data.score}</div>
                    </div>
                `;
            } else {
                myRankEl.innerHTML = `
                    <div class="equip-card" style="text-align:center;color:var(--text-muted);font-size:13px">
                        まだランキングに参加していません
                    </div>
                `;
            }
        } else {
            myRankEl.innerHTML = `
                <div class="equip-card" style="text-align:center;color:var(--text-muted);font-size:13px">
                    ログインすると自分の順位が表示されます
                </div>
            `;
        }
    },

    getScoreLabel() {
        switch (this.currentTab) {
            case 'infinite': return '最高階層';
            case 'clears': return '総クリア数';
            case 'arena': return '闘技場順位';
            default: return 'スコア';
        }
    },

    formatScore(row) {
        switch (this.currentTab) {
            case 'infinite': return row.highestFloorInfinite + 'F';
            case 'clears': return row.totalClears + '回';
            case 'arena': return row.arenaRank + '位';
            default: return row.score;
        }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
