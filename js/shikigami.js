/* ==========================================
   式神システム
   ========================================== */

const Shikigami = {
    renderShikigamiScreen() {
        const content = document.getElementById('shikigami-content');
        const owned = GameState.shikigami.owned;
        const party = GameState.shikigami.party;

        let html = '<h3 style="margin-bottom:16px">編成中</h3>';
        html += '<div style="display:flex;gap:12px;margin-bottom:24px">';
        for (let i = 0; i < 3; i++) {
            const shikiId = party[i];
            if (shikiId && owned[shikiId]) {
                const data = SHIKIGAMI_DATA[shikiId];
                html += `
                    <div class="equip-card" style="flex:1;cursor:pointer" onclick="Shikigami.removeFromParty(${i})">
                        <div style="font-size:32px;text-align:center">${data.emoji}</div>
                        <div style="text-align:center;font-weight:600">${data.name}</div>
                        <div style="text-align:center;font-size:11px;color:var(--accent-gold)">${starsDisplay(data.stars)}</div>
                        <div style="text-align:center;font-size:11px;color:var(--text-secondary)">Lv.${owned[shikiId].level}</div>
                        <div style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:4px">クリックで外す</div>
                    </div>
                `;
            } else {
                html += `<div class="equip-card" style="flex:1;text-align:center;color:var(--text-muted);padding:24px">空きスロット</div>`;
            }
        }
        html += '</div>';

        html += '<h3 style="margin-bottom:16px">所持式神</h3>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';

        const sortedShiki = Object.entries(owned).sort((a, b) => {
            const dataA = SHIKIGAMI_DATA[a[0]];
            const dataB = SHIKIGAMI_DATA[b[0]];
            return (dataB?.stars || 0) - (dataA?.stars || 0);
        });

        for (const [shikiId, shikiOwned] of sortedShiki) {
            const data = SHIKIGAMI_DATA[shikiId];
            if (!data) continue;
            const inParty = party.includes(shikiId);
            const elemClass = getElementClass(data.element);

            html += `
                <div class="equip-card ${inParty ? '' : ''}" style="${inParty ? 'border-color:var(--accent-primary)' : ''}" onclick="Shikigami.addToParty('${shikiId}')">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:28px">${data.emoji}</span>
                        <div>
                            <div style="font-weight:600">${data.name} ${inParty ? '(編成中)' : ''}</div>
                            <div style="font-size:11px;color:var(--accent-gold)">${starsDisplay(data.stars)}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:6px">
                        Lv.${shikiOwned.level}/${data.stars * 10} | ${getElementName(data.element)}属性<br>
                        EXP: ${shikiOwned.exp}/${this.getExpToLevel(shikiOwned.level)}<br>
                        技: ${data.skill.name}
                    </div>
                </div>
            `;
        }

        if (sortedShiki.length === 0) {
            html += '<div style="color:var(--text-muted);padding:20px">式神を持っていません。冒険やガチャで入手しましょう。</div>';
        }

        html += '</div>';
        content.innerHTML = html;
    },

    addToParty(shikiId) {
        const party = GameState.shikigami.party;
        if (party.includes(shikiId)) {
            showNotification('すでに編成中です', 'warning');
            return;
        }
        const emptySlot = party.indexOf(null);
        if (emptySlot === -1) {
            showNotification('編成枠がいっぱいです。先に外してください。', 'warning');
            return;
        }
        party[emptySlot] = shikiId;
        showNotification(`${SHIKIGAMI_DATA[shikiId].name}を編成！`, 'success');
        this.renderShikigamiScreen();
    },

    removeFromParty(slotIndex) {
        const party = GameState.shikigami.party;
        const shikiId = party[slotIndex];
        if (shikiId) {
            party[slotIndex] = null;
            showNotification(`${SHIKIGAMI_DATA[shikiId].name}を外しました`, 'info');
            this.renderShikigamiScreen();
        }
    },

    // 式神入手
    obtainShikigami(shikiId) {
        if (GameState.shikigami.owned[shikiId]) {
            // 被り → 好感度UP
            GameState.shikigami.owned[shikiId].affection += 10;
            showNotification(`${SHIKIGAMI_DATA[shikiId].name}の魂片を入手（好感度+10）`, 'info');
        } else {
            GameState.shikigami.owned[shikiId] = {
                level: 1,
                exp: 0,
                affection: 0
            };
            showNotification(`新しい式神「${SHIKIGAMI_DATA[shikiId].name}」を入手！`, 'success', 5000);
        }
    },

    // 式神経験値テーブル
    getExpToLevel(level) {
        return Math.floor(50 * Math.pow(level, 1.5));
    },

    // 式神に経験値を付与
    addExp(shikiId, amount) {
        const owned = GameState.shikigami.owned[shikiId];
        if (!owned) return;
        const data = SHIKIGAMI_DATA[shikiId];
        if (!data) return;

        owned.exp += amount;
        const maxLevel = data.stars * 10; // ★1=Lv10上限, ★5=Lv50上限
        while (owned.level < maxLevel) {
            const expNeeded = this.getExpToLevel(owned.level);
            if (owned.exp < expNeeded) break;
            owned.exp -= expNeeded;
            owned.level++;
            addBattleLog(`式神「${data.name}」がLv.${owned.level}に！`, 'level');
            showNotification(`${data.name} Lv.${owned.level}！`, 'info', 2000);
        }
    },

    // 戦闘パネル表示
    renderBattleParty() {
        const panel = document.getElementById('shikigami-party');
        const party = GameState.shikigami.party;
        let html = '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">式神</div>';

        for (let i = 0; i < 3; i++) {
            const shikiId = party[i];
            if (shikiId && GameState.shikigami.owned[shikiId]) {
                const data = SHIKIGAMI_DATA[shikiId];
                const owned = GameState.shikigami.owned[shikiId];
                const elemColor = data.element ? `var(--element-${data.element})` : 'var(--text-secondary)';
                html += `
                    <div class="shikigami-slot" data-shiki-index="${i}">
                        <span style="font-size:16px">${data.emoji}</span>
                        <span style="font-size:11px">${data.name}</span>
                        <span style="font-size:9px;color:${elemColor};margin-left:auto">${getElementName(data.element)}</span>
                        <div class="shiki-cd-bar" id="shiki-cd-${i}" style="width:0%"></div>
                    </div>
                `;
            } else {
                html += `<div class="shikigami-slot" style="color:var(--text-muted);font-size:11px">空き</div>`;
            }
        }

        panel.innerHTML = html;
    },

    // クールダウンバー更新（Combat.updateから毎フレーム呼ばれる）
    updateCooldownBars() {
        const d = GameState.dungeon;
        const party = GameState.shikigami.party;
        for (let i = 0; i < party.length; i++) {
            const shikiId = party[i];
            if (!shikiId) continue;
            const data = SHIKIGAMI_DATA[shikiId];
            if (!data) continue;
            const bar = document.getElementById(`shiki-cd-${i}`);
            if (!bar) continue;
            const timer = d.shikigamiTimers[i] || 0;
            const interval = data.skill.interval;
            const percent = Math.min(100, (timer / interval) * 100);
            bar.style.width = percent + '%';
            if (percent >= 95) {
                bar.classList.add('ready');
            } else {
                bar.classList.remove('ready');
            }
        }
    }
};
