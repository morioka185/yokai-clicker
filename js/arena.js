/* ==========================================
   闘技場（PvPシミュレーション）
   ========================================== */

const Arena = {
    // NPC対戦相手を生成
    generateOpponent(rank) {
        const level = Math.max(1, Math.floor(rank / 10));
        const names = ['赤鬼丸', '白蛇姫', '月影', '雷蔵', '風魔', '鬼灯', '夜叉丸', '玉藻', '酒呑童子', '茨木'];
        const name = randomChoice(names);

        return {
            name: name,
            level: level,
            atk: 10 + level * 5 + randomInt(0, level * 2),
            def: 5 + level * 3 + randomInt(0, level),
            hp: 100 + level * 30 + randomInt(0, level * 10),
            critRate: 5 + Math.min(30, level * 0.5),
            element: randomChoice(['fire', 'water', 'thunder', 'earth', 'wood'])
        };
    },

    render() {
        const content = document.getElementById('arena-content');
        const a = GameState.arena;

        let html = `
            <div style="display:flex;gap:24px;margin-bottom:24px">
                <div class="equip-card" style="flex:1;text-align:center">
                    <div style="font-size:14px;color:var(--text-secondary)">順位</div>
                    <div style="font-size:28px;font-weight:700;color:var(--accent-gold)">${a.rank}</div>
                </div>
                <div class="equip-card" style="flex:1;text-align:center">
                    <div style="font-size:14px;color:var(--text-secondary)">戦績</div>
                    <div style="font-size:18px;font-weight:600">${a.wins}勝 ${a.losses}敗</div>
                </div>
                <div class="equip-card" style="flex:1;text-align:center">
                    <div style="font-size:14px;color:var(--text-secondary)">闘技メダル</div>
                    <div style="font-size:28px;font-weight:700;color:var(--accent-primary)">${a.medals}</div>
                </div>
            </div>

            <h3 style="margin-bottom:16px">対戦相手</h3>
            <div style="display:flex;flex-direction:column;gap:8px" id="arena-opponents"></div>

            <button class="btn btn-primary" style="margin-top:16px" onclick="Arena.refreshOpponents()">対戦相手を更新</button>

            <div id="arena-battle-result" style="margin-top:24px"></div>

            <h3 style="margin-top:32px;margin-bottom:16px">🎖️ メダル交換所</h3>
            <div style="font-size:13px;margin-bottom:12px">所持メダル: <strong>${a.medals}</strong></div>
            <div style="display:flex;flex-direction:column;gap:8px" id="arena-shop">
                <div class="equip-card" style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-weight:600">💎 霊石 ×10</div>
                        <div style="font-size:11px;color:var(--text-secondary)">メダル50枚</div>
                    </div>
                    <button class="btn btn-sm ${a.medals >= 50 ? 'btn-primary' : ''}" ${a.medals >= 50 ? '' : 'disabled'} onclick="Arena.exchangeMedals('spiritStones', 10, 50)">交換</button>
                </div>
                <div class="equip-card" style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-weight:600">💠 強化石 ×5</div>
                        <div style="font-size:11px;color:var(--text-secondary)">メダル100枚</div>
                    </div>
                    <button class="btn btn-sm ${a.medals >= 100 ? 'btn-primary' : ''}" ${a.medals >= 100 ? '' : 'disabled'} onclick="Arena.exchangeMedals('enhance_stone', 5, 100)">交換</button>
                </div>
                <div class="equip-card" style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-weight:600">📿 保護札 ×1</div>
                        <div style="font-size:11px;color:var(--text-secondary)">メダル200枚</div>
                    </div>
                    <button class="btn btn-sm ${a.medals >= 200 ? 'btn-primary' : ''}" ${a.medals >= 200 ? '' : 'disabled'} onclick="Arena.exchangeMedals('protect_charm', 1, 200)">交換</button>
                </div>
            </div>
        `;

        content.innerHTML = html;
        this.refreshOpponents();
    },

    refreshOpponents() {
        const container = document.getElementById('arena-opponents');
        if (!container) return;

        const rank = GameState.arena.rank;
        const opponents = [];
        for (let i = 0; i < 3; i++) {
            const oppRank = Math.max(1, rank + randomInt(-50, 50));
            opponents.push({
                rank: oppRank,
                ...this.generateOpponent(oppRank)
            });
        }

        container.innerHTML = opponents.map((opp, i) => `
            <div class="equip-card" style="display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-weight:600">${opp.name} <span style="color:var(--text-muted)">(順位: ${opp.rank})</span></div>
                    <div style="font-size:11px;color:var(--text-secondary)">
                        Lv.${opp.level} | ATK:${opp.atk} DEF:${opp.def} HP:${opp.hp} | ${getElementName(opp.element)}属性
                    </div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="Arena.battle(${JSON.stringify(opp).replace(/"/g, '&quot;')})">挑戦</button>
            </div>
        `).join('');
    },

    exchangeMedals(itemType, amount, cost) {
        if (GameState.arena.medals < cost) return;
        GameState.arena.medals -= cost;

        if (itemType === 'spiritStones') {
            GameState.player.spiritStones += amount;
            showNotification(`霊石 ×${amount} を入手！`, 'success');
        } else {
            GameState.inventory.materials[itemType] = (GameState.inventory.materials[itemType] || 0) + amount;
            const mat = MATERIALS[itemType];
            showNotification(`${mat ? mat.name : itemType} ×${amount} を入手！`, 'success');
        }

        this.render();
        Save.autoSave();
    },

    battle(opponent) {
        const stats = calculatePlayerStats();
        const playerPower = stats.atk * 2 + stats.def + stats.maxHP / 10 + stats.critRate;
        const oppPower = opponent.atk * 2 + opponent.def + opponent.hp / 10 + opponent.critRate;

        // 属性相性
        let elemMult = 1.0;
        if (stats.weaponElement) {
            elemMult = getElementMultiplier(stats.weaponElement, opponent.element);
        }

        const playerScore = playerPower * elemMult * randomFloat(0.8, 1.2);
        const oppScore = oppPower * randomFloat(0.8, 1.2);

        const won = playerScore > oppScore;

        if (won) {
            GameState.arena.wins++;
            const rankGain = Math.max(1, Math.floor((opponent.rank - GameState.arena.rank) / 5 + 5));
            GameState.arena.rank = Math.max(1, GameState.arena.rank - rankGain);
            const medals = randomInt(5, 15);
            GameState.arena.medals += medals;
            showNotification(`勝利！ 順位+${rankGain} / メダル+${medals}`, 'success');
        } else {
            GameState.arena.losses++;
            const rankLoss = randomInt(1, 3);
            GameState.arena.rank += rankLoss;
            showNotification(`敗北... 順位-${rankLoss}`, 'error');
        }

        // 結果表示
        const resultDiv = document.getElementById('arena-battle-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="equip-card" style="text-align:center;border-left:3px solid ${won ? 'var(--accent-green)' : 'var(--accent-red)'}">
                    <div style="font-size:24px;font-weight:700;color:${won ? 'var(--accent-green)' : 'var(--accent-red)'}">
                        ${won ? '勝利！' : '敗北...'}
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);margin-top:8px">
                        vs ${opponent.name} (Lv.${opponent.level})<br>
                        あなた: ${Math.floor(playerScore)} vs 相手: ${Math.floor(oppScore)}
                    </div>
                </div>
            `;
        }

        this.render();
        Save.autoSave();
    }
};
