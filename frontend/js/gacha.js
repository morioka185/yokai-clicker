/* ==========================================
   ガチャシステム
   ========================================== */

const Gacha = {
    render() {
        const content = document.getElementById('gacha-content');

        let html = '';

        // 霊石ガチャ（式神）
        html += `
            <div class="gacha-banner">
                <div class="gacha-banner-title">🦊 霊石召喚 ～式神の契約～</div>
                <div class="gacha-banner-desc">
                    霊石を使って式神を召喚！ 全式神がプレイでも入手可能です。<br>
                    ★5: 2% / ★4: 8% / ★3: 30% / ★2: 40% / ★1: 20%<br>
                    天井: ${GACHA_TABLE.spirit.pity}連で★5確定<br>
                    現在の天井カウント: ${GameState.gachaPity.spirit}/${GACHA_TABLE.spirit.pity}
                </div>
                <div style="font-size:14px;margin-bottom:12px">
                    💎 所持霊石: <strong>${GameState.player.spiritStones}</strong>
                </div>
                <div class="gacha-buttons">
                    <button class="btn btn-primary" onclick="Gacha.pullSpirit(1)"
                        ${GameState.player.spiritStones >= 10 ? '' : 'disabled'}>
                        単発 (💎10)
                    </button>
                    <button class="btn btn-primary" onclick="Gacha.pullSpirit(10)"
                        ${GameState.player.spiritStones >= 100 ? '' : 'disabled'}>
                        10連 (💎100)
                    </button>
                </div>
                <div id="gacha-spirit-result" class="gacha-result"></div>
            </div>
        `;

        // 黄金ガチャ（装備）
        html += `
            <div class="gacha-banner">
                <div class="gacha-banner-title">⚔️ 黄金召喚 ～霊装の宝物庫～</div>
                <div class="gacha-banner-desc">
                    ゴールドでランダム装備を入手。鍛冶素材も排出されます。<br>
                    伝説: 2% / 極: 8% / 優: 25% / 良: 40% / 凡: 25%<br>
                    天井: ${GACHA_TABLE.gold.pity}連で伝説確定<br>
                    現在の天井カウント: ${GameState.gachaPity.gold}/${GACHA_TABLE.gold.pity}
                </div>
                <div style="font-size:14px;margin-bottom:12px">
                    💰 所持ゴールド: <strong>${formatNumber(GameState.player.gold)}</strong>
                </div>
                <div class="gacha-buttons">
                    <button class="btn btn-secondary" onclick="Gacha.pullGold(1)"
                        ${GameState.player.gold >= 5000 ? '' : 'disabled'}>
                        単発 (💰5,000)
                    </button>
                    <button class="btn btn-secondary" onclick="Gacha.pullGold(10)"
                        ${GameState.player.gold >= 45000 ? '' : 'disabled'}>
                        10連 (💰45,000)
                    </button>
                </div>
                <div id="gacha-gold-result" class="gacha-result"></div>
            </div>
        `;

        content.innerHTML = html;
    },

    pullSpirit(count) {
        const cost = count === 10 ? 100 : 10;
        if (GameState.player.spiritStones < cost) return;
        GameState.player.spiritStones -= cost;

        const results = [];
        for (let i = 0; i < count; i++) {
            GameState.gachaPity.spirit++;

            let stars;
            if (GameState.gachaPity.spirit >= GACHA_TABLE.spirit.pity) {
                stars = 5;
                GameState.gachaPity.spirit = 0;
            } else {
                stars = parseInt(weightedRandom(
                    Object.fromEntries(
                        Object.entries(GACHA_TABLE.spirit.rates).map(([k, v]) => [k, v])
                    )
                ));
            }

            // 対象式神を取得
            const candidates = Object.entries(SHIKIGAMI_DATA)
                .filter(([, data]) => data.stars === stars)
                .map(([id]) => id);

            if (candidates.length > 0) {
                const shikiId = randomChoice(candidates);
                const isNew = !GameState.shikigami.owned[shikiId];
                Shikigami.obtainShikigami(shikiId);
                const data = SHIKIGAMI_DATA[shikiId];
                results.push({
                    emoji: data.emoji,
                    name: data.name,
                    stars: data.stars,
                    isNew: isNew
                });
            }
        }

        // SE
        const hasHighStar = results.some(r => r.stars >= 4);
        if (hasHighStar) SoundManager.gachaRare(); else SoundManager.gachaPull();

        // 結果表示
        const resultContainer = document.getElementById('gacha-spirit-result');
        resultContainer.innerHTML = results.map((r, i) => `
            <div class="gacha-card" style="animation-delay:${i * 0.1}s;border-color:${r.stars >= 4 ? 'var(--accent-gold)' : r.stars >= 3 ? 'var(--rarity-rare)' : 'var(--border-color)'}">
                <div class="gacha-card-icon">${r.emoji}</div>
                <div class="gacha-card-name">${r.name}</div>
                <div style="font-size:10px;color:var(--accent-gold)">${starsDisplay(r.stars)}</div>
                ${r.isNew ? '<div style="font-size:9px;color:var(--accent-green)">NEW!</div>' : ''}
            </div>
        `).join('');

        this.render();
        Save.autoSave();
    },

    pullGold(count) {
        const cost = count === 10 ? 45000 : 5000;
        if (GameState.player.gold < cost) return;
        GameState.player.gold -= cost;

        const results = [];
        for (let i = 0; i < count; i++) {
            GameState.gachaPity.gold++;

            let rarity;
            if (GameState.gachaPity.gold >= GACHA_TABLE.gold.pity) {
                rarity = 'legendary';
                GameState.gachaPity.gold = 0;
            } else {
                rarity = weightedRandom(GACHA_TABLE.gold.rates);
            }

            // 70% 装備 / 30% 素材
            if (Math.random() < 0.7) {
                const item = Equipment.generateRandomEquipment(30, rarity);
                if (GameState.inventory.equipment.length < GameState.inventory.maxEquipSlots) {
                    GameState.inventory.equipment.push(item);
                }
                results.push({
                    emoji: item.slot === 'weapon' && item.weaponType ? WEAPON_TYPES[item.weaponType].emoji : '🛡️',
                    name: item.name,
                    rarity: item.rarity
                });
            } else {
                // 素材（強化石、保護札など）
                const matRoll = Math.random();
                let matId, matCount;
                if (matRoll < 0.5) {
                    matId = 'enhance_stone';
                    matCount = randomInt(1, 3);
                } else if (matRoll < 0.8) {
                    matId = 'youkai_iron';
                    matCount = randomInt(2, 5);
                } else {
                    matId = 'protect_charm';
                    matCount = 1;
                }
                GameState.inventory.materials[matId] = (GameState.inventory.materials[matId] || 0) + matCount;
                const mat = MATERIALS[matId];
                results.push({
                    emoji: mat.emoji,
                    name: `${mat.name} ×${matCount}`,
                    rarity: mat.rarity
                });
            }
        }

        // SE
        const hasRare = results.some(r => r.rarity === 'legendary' || r.rarity === 'epic');
        if (hasRare) SoundManager.gachaRare(); else SoundManager.gachaPull();

        const resultContainer = document.getElementById('gacha-gold-result');
        resultContainer.innerHTML = results.map((r, i) => `
            <div class="gacha-card" style="animation-delay:${i * 0.1}s;border-color:${getRarityColor(r.rarity)}">
                <div class="gacha-card-icon">${r.emoji}</div>
                <div class="gacha-card-name" style="color:${getRarityColor(r.rarity)}">${r.name}</div>
            </div>
        `).join('');

        this.render();
        Save.autoSave();
    }
};
