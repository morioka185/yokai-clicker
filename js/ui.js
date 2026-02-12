/* ==========================================
   UI管理
   ========================================== */

const UI = {
    // プレイヤーHPバー等の更新
    updatePlayerBars() {
        const d = GameState.dungeon;
        const stats = calculatePlayerStats();

        // HP
        const hpPercent = Math.max(0, (d.playerHP / d.playerMaxHP) * 100);
        document.getElementById('player-hp-bar').style.width = hpPercent + '%';
        document.getElementById('player-hp-text').textContent = `${Math.floor(d.playerHP)} / ${d.playerMaxHP}`;

        // MP
        const mpPercent = Math.max(0, (d.playerMP / d.playerMaxMP) * 100);
        document.getElementById('player-mp-bar').style.width = mpPercent + '%';
        document.getElementById('player-mp-text').textContent = `${Math.floor(d.playerMP)} / ${d.playerMaxMP}`;

        // EXP
        const expNeeded = getExpToNextLevel(d.playerLevel);
        const expPercent = Math.min(100, (d.playerExp / expNeeded) * 100);
        document.getElementById('player-exp-bar').style.width = expPercent + '%';
        document.getElementById('player-exp-text').textContent = `${d.playerExp} / ${expNeeded}`;

        // Level & Resources
        document.getElementById('player-level').textContent = d.playerLevel;
        document.getElementById('gold-display').textContent = formatNumber(GameState.player.gold + d.lootedGold);
        document.getElementById('spirit-stone-display').textContent = GameState.player.spiritStones + d.lootedSpiritStones;
    },

    // 敵HP更新（全スロット）
    updateEnemyHP() {
        const enemies = GameState.dungeon.currentEnemies;
        for (const enemy of enemies) {
            if (!enemy) continue;
            const barEl = document.getElementById(`enemy-hp-bar-${enemy.position}`);
            const textEl = document.getElementById(`enemy-hp-text-${enemy.position}`);
            if (barEl) {
                const hpPercent = Math.max(0, (enemy.hp / enemy.maxHP) * 100);
                barEl.style.width = hpPercent + '%';
            }
            if (textEl) {
                textEl.textContent = `${formatNumber(enemy.hp)} / ${formatNumber(enemy.maxHP)}`;
            }
        }
    },

    // 敵表示更新（動的HTML生成）
    updateEnemyDisplay() {
        const enemies = GameState.dungeon.currentEnemies;
        const wave = document.getElementById('enemy-wave');
        if (!wave) return;

        // シングル/マルチ判定
        const aliveCount = enemies.filter(e => e && e.hp > 0).length;
        wave.className = 'enemy-wave' + (aliveCount <= 1 ? ' single-enemy' : '');

        let html = '';
        for (const enemy of enemies) {
            if (!enemy) continue;
            const isBoss = enemy.isBoss;
            const elemHtml = enemy.element
                ? `<span class="enemy-element element-${enemy.element}">${getElementName(enemy.element)}</span>`
                : '';

            html += `
                <div class="enemy-slot ${isBoss ? 'boss-slot' : ''}" id="enemy-slot-${enemy.position}" style="animation-delay:${enemy.position * 0.1}s">
                    <div class="enemy-info">
                        <span class="enemy-name">${enemy.name}</span>
                        <span class="enemy-level">Lv.${Math.floor(enemy.atk / 5)}</span>
                        ${elemHtml}
                    </div>
                    <div class="bar enemy-hp-bar">
                        <div class="bar-fill" id="enemy-hp-bar-${enemy.position}"></div>
                        <span class="bar-text" id="enemy-hp-text-${enemy.position}"></span>
                    </div>
                    <div class="enemy-visual" id="enemy-visual-${enemy.position}">
                        <span>${enemy.emoji}</span>
                    </div>
                </div>
            `;
        }
        wave.innerHTML = html;
        this.updateEnemyHP();
    },

    // プレイヤーステータス表示
    updatePlayerStats() {
        const stats = calculatePlayerStats();
        const d = GameState.dungeon;

        const statsEl = document.getElementById('player-stats');
        statsEl.innerHTML = `
            <div class="stat-row"><span class="stat-name">ATK</span><span class="stat-value">${stats.atk}</span></div>
            <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">${stats.def}</span></div>
            <div class="stat-row"><span class="stat-name">CRI</span><span class="stat-value">${stats.critRate.toFixed(1)}%</span></div>
            <div class="stat-row"><span class="stat-name">SPD</span><span class="stat-value">+${stats.atkSpeed}%</span></div>
            <div class="stat-row"><span class="stat-name">吸血</span><span class="stat-value">${stats.lifeSteal}%</span></div>
            <div class="stat-row"><span class="stat-name">金運</span><span class="stat-value">+${stats.goldBonus}%</span></div>
        `;

        // 武器情報
        const weaponInfo = document.getElementById('current-weapon-info');
        const weapon = GameState.equipped.weapon;
        if (weapon) {
            weaponInfo.innerHTML = `
                <div class="weapon-name" style="color:${getRarityColor(weapon.rarity)}">
                    ${weapon.weaponType ? WEAPON_TYPES[weapon.weaponType].emoji : '👊'} ${weapon.name}
                </div>
                <div>ATK: ${weapon.atk} ${weapon.enhanceLevel > 0 ? `(+${weapon.enhanceLevel})` : ''}</div>
                ${weapon.element ? `<div>${getElementName(weapon.element)}属性</div>` : ''}
            `;
        } else {
            weaponInfo.innerHTML = '<div class="weapon-name">👊 素手</div><div>ATK: 基礎値のみ</div>';
        }

        // 式神表示
        Shikigami.renderBattleParty();

        // スキル一覧更新
        this.updateAcquiredSkills();
    },

    // 習得済みスキル表示
    updateAcquiredSkills() {
        const pane = document.getElementById('tab-skills');
        const skills = GameState.dungeon.acquiredSkills;
        let html = '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">習得済みスキル</div>';

        const entries = Object.entries(skills);
        if (entries.length === 0) {
            html += '<div style="font-size:12px;color:var(--text-muted)">レベルアップでスキルを習得</div>';
        } else {
            for (const [skillId, stacks] of entries) {
                const skill = LEVELUP_SKILLS[skillId];
                if (!skill) continue;
                const categoryClass = skill.category === 'budo' ? 'category-budo' :
                                     skill.category === 'onmyo' ? 'category-onmyo' : 'category-jintsuu';
                html += `
                    <div style="padding:4px 0;border-bottom:1px solid rgba(51,51,85,0.3)">
                        <span class="levelup-choice-category ${categoryClass}" style="font-size:9px;padding:1px 6px">${skill.category === 'budo' ? '武' : skill.category === 'onmyo' ? '陰' : '神'}</span>
                        <span style="font-size:12px">${skill.name}</span>
                        ${stacks > 1 ? `<span style="font-size:10px;color:var(--accent-gold)"> ×${stacks}</span>` : ''}
                    </div>
                `;
            }
        }

        pane.innerHTML = html;
    },

    // 装備タブ（戦闘中の装備確認）
    updateEquipmentTab() {
        const pane = document.getElementById('tab-equipment');
        let html = '';

        for (const [slotId, slot] of Object.entries(EQUIP_SLOTS)) {
            const item = GameState.equipped[slotId];
            html += `<div style="margin-bottom:8px">`;
            html += `<div style="font-size:10px;color:var(--text-muted)">${slot.name}</div>`;
            if (item) {
                html += `
                    <div style="font-size:12px;color:${getRarityColor(item.rarity)}">
                        ${item.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ''}
                    </div>
                `;
            } else {
                html += `<div style="font-size:12px;color:var(--text-muted)">未装備</div>`;
            }
            html += '</div>';
        }

        pane.innerHTML = html;
    },

    // 討伐カウンター更新
    updateKillCounter() {
        document.getElementById('kill-count').textContent = GameState.dungeon.killCount;
        document.getElementById('kill-required').textContent = GameState.dungeon.killsRequired;
        this.updateItemsTab();
    },

    // 道具タブ（ダンジョン内収集物表示）
    updateItemsTab() {
        const pane = document.getElementById('tab-items');
        if (!pane) return;

        const d = GameState.dungeon;
        let html = '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">今回の収集物</div>';

        html += `<div style="font-size:12px;margin-bottom:6px">💰 ゴールド: ${formatNumber(d.lootedGold)}</div>`;
        if (d.lootedSpiritStones > 0) {
            html += `<div style="font-size:12px;margin-bottom:6px">💎 霊石: ${d.lootedSpiritStones}</div>`;
        }

        const matEntries = Object.entries(d.lootedMaterials);
        if (matEntries.length > 0) {
            html += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;margin-bottom:4px">素材</div>';
            for (const [matId, count] of matEntries) {
                const mat = MATERIALS[matId];
                if (mat && count > 0) {
                    html += `<div style="font-size:12px;padding:2px 0">${mat.emoji} ${mat.name} ×${count}</div>`;
                }
            }
        }

        if (d.lootedEquipment.length > 0) {
            html += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;margin-bottom:4px">装備</div>';
            for (const item of d.lootedEquipment) {
                html += `<div style="font-size:12px;padding:2px 0;color:${getRarityColor(item.rarity)}">${item.name}</div>`;
            }
        }

        if (d.lootedGold === 0 && matEntries.length === 0 && d.lootedEquipment.length === 0) {
            html += '<div style="font-size:12px;color:var(--text-muted)">まだ何も入手していません</div>';
        }

        pane.innerHTML = html;
    },

    // 拠点のプレイヤーサマリー
    updateVillageSummary() {
        const el = document.getElementById('village-player-summary');
        if (!el) return;

        el.innerHTML = `
            <span>💰 ${formatNumber(GameState.player.gold)}</span>
            <span>💎 ${GameState.player.spiritStones}</span>
            <span>踏破: ${GameState.player.totalClears}回</span>
        `;
    },

    // インベントリ画面
    renderInventory(tab = 'equip') {
        const content = document.getElementById('inventory-content');

        if (tab === 'equip') {
            let html = '';

            // 装備中
            html += '<h3 style="margin-bottom:12px">装備中</h3>';
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:24px">';
            for (const [slotId, slot] of Object.entries(EQUIP_SLOTS)) {
                const item = GameState.equipped[slotId];
                if (item) {
                    const card = Equipment.renderEquipCard(item, () => {
                        Equipment.unequipItem(slotId);
                        this.renderInventory('equip');
                    });
                    html += `<div class="equip-card" style="border-left:3px solid ${getRarityColor(item.rarity)};cursor:pointer" onclick="Equipment.unequipItem('${slotId}');UI.renderInventory('equip')">
                        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${slot.name} (クリックで外す)</div>
                        <div style="color:${getRarityColor(item.rarity)};font-weight:600">${item.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ''}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">
                            ${item.atk > 0 ? `ATK:${item.atk}` : ''} ${item.def > 0 ? `DEF:${item.def}` : ''} ${item.hp > 0 ? `HP:${item.hp}` : ''}
                        </div>
                    </div>`;
                } else {
                    html += `<div class="equip-card" style="color:var(--text-muted)"><div style="font-size:10px">${slot.name}</div>未装備</div>`;
                }
            }
            html += '</div>';

            // 倉庫
            html += `<h3 style="margin-bottom:12px">倉庫 (${GameState.inventory.equipment.length}/${GameState.inventory.maxEquipSlots})</h3>`;
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">';

            const sorted = [...GameState.inventory.equipment].sort((a, b) => {
                const rarityOrder = { mythic: 0, legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5 };
                return (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5);
            });

            for (const item of sorted) {
                html += `<div class="equip-card" style="border-left:3px solid ${getRarityColor(item.rarity)};cursor:pointer" onclick="Equipment.equipItem(GameState.inventory.equipment.find(e=>e.uid==='${item.uid}'));UI.renderInventory('equip')">
                    <div style="font-size:10px;color:var(--text-muted)">クリックで装備</div>
                    <div style="color:${getRarityColor(item.rarity)};font-weight:600;font-size:13px">${item.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ''}</div>
                    <div style="font-size:11px;color:var(--text-secondary)">
                        【${getRarityName(item.rarity)}】${item.slot === 'weapon' && item.weaponType ? WEAPON_TYPES[item.weaponType].name : EQUIP_SLOTS[item.slot]?.name || ''}
                        ${item.atk > 0 ? ` ATK:${item.atk}` : ''} ${item.def > 0 ? ` DEF:${item.def}` : ''}
                    </div>
                    ${item.enchants.length > 0 ? item.enchants.map(e => `<div style="font-size:10px;color:var(--accent-cyan)">✦ ${e.display}</div>`).join('') : ''}
                </div>`;
            }

            if (sorted.length === 0) {
                html += '<div style="color:var(--text-muted);padding:20px">装備がありません</div>';
            }
            html += '</div>';

            content.innerHTML = html;
        } else if (tab === 'materials') {
            let html = '<h3 style="margin-bottom:12px">素材一覧</h3>';
            html += '<div class="inv-grid">';

            const matEntries = Object.entries(GameState.inventory.materials).filter(([, count]) => count > 0);
            if (matEntries.length === 0) {
                html += '<div style="color:var(--text-muted);padding:20px">素材がありません</div>';
            }

            for (const [matId, count] of matEntries) {
                const mat = MATERIALS[matId];
                if (!mat) continue;
                html += `
                    <div class="material-item">
                        <span class="material-icon">${mat.emoji}</span>
                        <div class="material-info">
                            <div class="material-name">${mat.name}</div>
                            <div class="material-count">×${count}</div>
                        </div>
                    </div>
                `;
            }

            html += '</div>';
            content.innerHTML = html;
        }
    },

    // タブ切り替え
    initTabs() {
        // バトル内タブ
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const tabId = btn.dataset.tab;
                document.getElementById(`tab-${tabId}`).classList.add('active');
                // タブ切替時にコンテンツを更新
                if (tabId === 'items') UI.updateItemsTab();
                if (tabId === 'skills') UI.updateAcquiredSkills();
                if (tabId === 'equipment') UI.updateEquipmentTab();
            });
        });

        // 鍛冶タブ
        document.querySelectorAll('.smithy-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.smithy-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Smithy.currentTab = btn.dataset.smithy;
                Smithy.render();
            });
        });

        // インベントリタブ
        document.querySelectorAll('.inv-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                UI.renderInventory(btn.dataset.inv);
            });
        });

        // 図鑑タブ
        document.querySelectorAll('.enc-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                Encyclopedia.switchTab(btn.dataset.enc);
            });
        });
    }
};
