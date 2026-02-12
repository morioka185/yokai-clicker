/* ==========================================
   図鑑・実績システム
   ========================================== */

// ===== 実績定義 =====
const ACHIEVEMENTS = {
    // --- 討伐系 ---
    first_kill: {
        id: 'first_kill', name: '初めての討伐', icon: '⚔️',
        desc: '妖怪を1体討伐する',
        category: 'combat',
        check: () => Object.keys(GameState.encyclopedia.discoveredEnemies).length >= 1,
        reward: { spiritStones: 10 }
    },
    kill_10_types: {
        id: 'kill_10_types', name: '妖怪博士', icon: '📚',
        desc: '10種類の妖怪を討伐する',
        category: 'combat',
        check: () => Object.keys(GameState.encyclopedia.discoveredEnemies).length >= 10,
        reward: { spiritStones: 50 }
    },
    kill_all_types: {
        id: 'kill_all_types', name: '百鬼夜行制覇', icon: '👹',
        desc: '全種類の妖怪を討伐する',
        category: 'combat',
        check: () => {
            const total = Object.keys(ENEMIES).length + Object.keys(BOSSES).length;
            return Object.keys(GameState.encyclopedia.discoveredEnemies).length >= total;
        },
        reward: { spiritStones: 200 }
    },
    // --- ボス系 ---
    first_boss: {
        id: 'first_boss', name: '初めてのボス討伐', icon: '💀',
        desc: 'ボスを1体討伐する',
        category: 'combat',
        check: () => {
            return Object.keys(BOSSES).some(id => GameState.encyclopedia.discoveredEnemies[id]);
        },
        reward: { spiritStones: 30 }
    },
    all_bosses: {
        id: 'all_bosses', name: '全ボス制覇', icon: '👑',
        desc: '全てのボスを討伐する',
        category: 'combat',
        check: () => {
            return Object.keys(BOSSES).every(id => GameState.encyclopedia.discoveredEnemies[id]);
        },
        reward: { spiritStones: 300 }
    },
    // --- ダンジョン系 ---
    clear_forest: {
        id: 'clear_forest', name: '森の守り手', icon: '🌲',
        desc: '初心者の森を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['forest'],
        reward: { spiritStones: 30 }
    },
    clear_shrine: {
        id: 'clear_shrine', name: '狐退治', icon: '⛩️',
        desc: '妖狐の社を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['shrine'],
        reward: { spiritStones: 50 }
    },
    clear_cave: {
        id: 'clear_cave', name: '炎を越えて', icon: '🌋',
        desc: '火焔洞窟を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['cave'],
        reward: { spiritStones: 50 }
    },
    clear_sea: {
        id: 'clear_sea', name: '深淵の征服者', icon: '🌊',
        desc: '深海神殿を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['sea'],
        reward: { spiritStones: 50 }
    },
    clear_thunder: {
        id: 'clear_thunder', name: '雷神殺し', icon: '⛈️',
        desc: '雷雲城を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['thunder'],
        reward: { spiritStones: 50 }
    },
    clear_dark: {
        id: 'clear_dark', name: '冥界突破', icon: '🌑',
        desc: '冥界門を踏破する',
        category: 'dungeon',
        check: () => !!GameState.player.clearedDungeons['dark'],
        reward: { spiritStones: 100 }
    },
    clear_all: {
        id: 'clear_all', name: '退魔師の極み', icon: '🏆',
        desc: '全ダンジョンを踏破する',
        category: 'dungeon',
        check: () => {
            return ['forest','shrine','cave','sea','thunder','dark'].every(
                id => GameState.player.clearedDungeons[id]
            );
        },
        reward: { spiritStones: 500 }
    },
    infinite_10: {
        id: 'infinite_10', name: '回廊の探求者', icon: '♾️',
        desc: '無限回廊10Fに到達する',
        category: 'dungeon',
        check: () => (GameState.player.highestFloor['infinite'] || 0) >= 10,
        reward: { spiritStones: 50 }
    },
    infinite_50: {
        id: 'infinite_50', name: '回廊の征服者', icon: '♾️',
        desc: '無限回廊50Fに到達する',
        category: 'dungeon',
        check: () => (GameState.player.highestFloor['infinite'] || 0) >= 50,
        reward: { spiritStones: 100 }
    },
    infinite_100: {
        id: 'infinite_100', name: '終わりなき者', icon: '♾️',
        desc: '無限回廊100Fに到達する',
        category: 'dungeon',
        check: () => (GameState.player.highestFloor['infinite'] || 0) >= 100,
        reward: { spiritStones: 300 }
    },
    // --- 収集系 ---
    shikigami_3: {
        id: 'shikigami_3', name: '式神使い', icon: '🦊',
        desc: '式神を3体集める',
        category: 'collection',
        check: () => Object.keys(GameState.shikigami.owned).length >= 3,
        reward: { spiritStones: 20 }
    },
    shikigami_10: {
        id: 'shikigami_10', name: '式神マスター', icon: '🦊',
        desc: '式神を10体集める',
        category: 'collection',
        check: () => Object.keys(GameState.shikigami.owned).length >= 10,
        reward: { spiritStones: 100 }
    },
    shikigami_all: {
        id: 'shikigami_all', name: '式神コンプリート', icon: '✨',
        desc: '全式神を集める',
        category: 'collection',
        check: () => Object.keys(GameState.shikigami.owned).length >= Object.keys(SHIKIGAMI_DATA).length,
        reward: { spiritStones: 500 }
    },
    // --- 鍛冶系 ---
    first_craft: {
        id: 'first_craft', name: '駆け出し鍛冶師', icon: '🔨',
        desc: '装備を1つ作成する',
        category: 'smithy',
        check: () => (GameState.encyclopedia.craftCount || 0) >= 1,
        reward: { gold: 1000 }
    },
    enhance_10: {
        id: 'enhance_10', name: '強化の達人', icon: '⬆️',
        desc: '装備を+10まで強化する',
        category: 'smithy',
        check: () => {
            const allItems = [...GameState.inventory.equipment];
            for (const item of Object.values(GameState.equipped)) {
                if (item) allItems.push(item);
            }
            return allItems.some(i => i.enhanceLevel >= 10);
        },
        reward: { spiritStones: 50 }
    },
    enhance_15: {
        id: 'enhance_15', name: '伝説の鍛冶師', icon: '🌟',
        desc: '装備を+15まで強化する',
        category: 'smithy',
        check: () => {
            const allItems = [...GameState.inventory.equipment];
            for (const item of Object.values(GameState.equipped)) {
                if (item) allItems.push(item);
            }
            return allItems.some(i => i.enhanceLevel >= 15);
        },
        reward: { spiritStones: 100 }
    },
    // --- 金策系 ---
    gold_10000: {
        id: 'gold_10000', name: '金持ちの始まり', icon: '💰',
        desc: '10,000G以上を所持する',
        category: 'economy',
        check: () => GameState.player.gold >= 10000,
        reward: { spiritStones: 10 }
    },
    gold_100000: {
        id: 'gold_100000', name: '大富豪', icon: '💰',
        desc: '100,000G以上を所持する',
        category: 'economy',
        check: () => GameState.player.gold >= 100000,
        reward: { spiritStones: 30 }
    },
    gold_1000000: {
        id: 'gold_1000000', name: '億万長者', icon: '💰',
        desc: '1,000,000G以上を所持する',
        category: 'economy',
        check: () => GameState.player.gold >= 1000000,
        reward: { spiritStones: 100 }
    },
    // --- 闘技場系 ---
    arena_first_win: {
        id: 'arena_first_win', name: '初勝利', icon: '🏟️',
        desc: '闘技場で1勝する',
        category: 'arena',
        check: () => GameState.arena.wins >= 1,
        reward: { spiritStones: 10 }
    },
    arena_10_wins: {
        id: 'arena_10_wins', name: '闘士', icon: '🏟️',
        desc: '闘技場で10勝する',
        category: 'arena',
        check: () => GameState.arena.wins >= 10,
        reward: { spiritStones: 50 }
    },
    arena_top100: {
        id: 'arena_top100', name: '上位100位', icon: '🥇',
        desc: '闘技場で順位100位以内に入る',
        category: 'arena',
        check: () => GameState.arena.rank <= 100,
        reward: { spiritStones: 100 }
    }
};

// ===== 図鑑モジュール =====
const Encyclopedia = {
    currentTab: 'enemies',

    render() {
        this.updateSummary();
        this.renderTab();
    },

    // サマリー表示
    updateSummary() {
        const el = document.getElementById('enc-summary');
        const totalEnemies = Object.keys(ENEMIES).length;
        const totalBosses = Object.keys(BOSSES).length;
        const totalShikigami = Object.keys(SHIKIGAMI_DATA).length;
        const totalMaterials = Object.keys(MATERIALS).length;

        const discoveredCount = Object.keys(GameState.encyclopedia.discoveredEnemies).length;
        const ownedShikigami = Object.keys(GameState.shikigami.owned).length;
        const discoveredMats = Object.entries(GameState.inventory.materials).filter(([,c]) => c > 0).length;

        const achCompleted = Object.values(ACHIEVEMENTS).filter(a => a.check()).length;
        const achTotal = Object.keys(ACHIEVEMENTS).length;

        const overallDiscovered = discoveredCount + ownedShikigami + discoveredMats;
        const overallTotal = totalEnemies + totalBosses + totalShikigami + totalMaterials;
        const overallPercent = overallTotal > 0 ? Math.floor(overallDiscovered / overallTotal * 100) : 0;

        el.innerHTML = `
            <div class="enc-summary-stat">
                図鑑収集率: <span class="enc-summary-value">${overallPercent}%</span>
            </div>
            <div class="enc-summary-stat">
                妖怪: <span class="enc-summary-value">${discoveredCount}/${totalEnemies + totalBosses}</span>
            </div>
            <div class="enc-summary-stat">
                式神: <span class="enc-summary-value">${ownedShikigami}/${totalShikigami}</span>
            </div>
            <div class="enc-summary-stat">
                実績: <span class="enc-summary-value">${achCompleted}/${achTotal}</span>
            </div>
            <div style="flex:1">
                <div class="enc-progress-bar">
                    <div class="enc-progress-fill" style="width:${overallPercent}%"></div>
                </div>
            </div>
        `;
    },

    // タブ切替
    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.enc-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.enc-tab[data-enc="${tab}"]`)?.classList.add('active');
        this.renderTab();
    },

    renderTab() {
        switch (this.currentTab) {
            case 'enemies': this.renderEnemies(); break;
            case 'bosses': this.renderBosses(); break;
            case 'shikigami': this.renderShikigami(); break;
            case 'equipment': this.renderEquipment(); break;
            case 'materials': this.renderMaterials(); break;
            case 'achievements': this.renderAchievements(); break;
        }
    },

    // ===== 妖怪図鑑 =====
    renderEnemies() {
        const content = document.getElementById('enc-content');
        const discovered = GameState.encyclopedia.discoveredEnemies;
        const total = Object.keys(ENEMIES).length;
        const found = Object.keys(ENEMIES).filter(id => discovered[id]).length;

        let html = `<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary)">発見: ${found}/${total}</div>`;
        html += '<div class="enc-grid">';

        for (const [id, enemy] of Object.entries(ENEMIES)) {
            const isDiscovered = !!discovered[id];
            html += this.buildEnemyCard(enemy, isDiscovered, false);
        }

        html += '</div>';
        content.innerHTML = html;
    },

    // ===== ボス図鑑 =====
    renderBosses() {
        const content = document.getElementById('enc-content');
        const discovered = GameState.encyclopedia.discoveredEnemies;
        const total = Object.keys(BOSSES).length;
        const found = Object.keys(BOSSES).filter(id => discovered[id]).length;

        let html = `<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary)">発見: ${found}/${total}</div>`;
        html += '<div class="enc-grid">';

        for (const [id, boss] of Object.entries(BOSSES)) {
            const isDiscovered = !!discovered[id];
            html += this.buildEnemyCard(boss, isDiscovered, true);
        }

        html += '</div>';
        content.innerHTML = html;
    },

    buildEnemyCard(enemy, isDiscovered, isBoss) {
        const elemClass = enemy.element ? `element-${enemy.element}` : '';
        const elemName = enemy.element ? getElementName(enemy.element) : '無';

        if (!isDiscovered) {
            return `
                <div class="enc-card undiscovered">
                    <div class="enc-card-header">
                        <div class="enc-card-icon">❓</div>
                        <div class="enc-card-title">
                            <div class="enc-card-name">???</div>
                            <div class="enc-card-sub">未発見</div>
                        </div>
                    </div>
                    <div class="enc-card-body" style="color:var(--text-muted)">
                        この妖怪はまだ発見されていません。<br>ダンジョンを探索して出会いましょう。
                    </div>
                </div>
            `;
        }

        // ドロップ情報
        let dropsHtml = '';
        if (enemy.drops && enemy.drops.length > 0) {
            dropsHtml += '<div class="enc-card-drops"><div class="enc-card-drops-title">ドロップ素材</div>';
            for (const drop of enemy.drops) {
                const mat = MATERIALS[drop.id];
                if (mat) {
                    const pct = Math.round(drop.chance * 100);
                    dropsHtml += `<div class="enc-drop-item">${mat.emoji} ${mat.name} (${pct}%)</div>`;
                }
            }
            dropsHtml += '</div>';
        }

        // ボス専用ドロップ
        let bossDropsHtml = '';
        if (isBoss) {
            if (enemy.weaponDrops) {
                bossDropsHtml += '<div class="enc-card-drops"><div class="enc-card-drops-title">武器ドロップ</div>';
                for (const wd of enemy.weaponDrops) {
                    const pct = Math.round(wd.chance * 100);
                    const wType = wd.weaponType ? WEAPON_TYPES[wd.weaponType]?.name : '';
                    bossDropsHtml += `<div class="enc-drop-item" style="color:var(--accent-gold)">⚔️ ${wd.baseName} (${wType}) [${pct}%]</div>`;
                }
                bossDropsHtml += '</div>';
            }
            if (enemy.armorDrops) {
                bossDropsHtml += '<div class="enc-card-drops"><div class="enc-card-drops-title">防具ドロップ</div>';
                for (const ad of enemy.armorDrops) {
                    const pct = Math.round(ad.chance * 100);
                    const slotName = EQUIP_SLOTS[ad.slot]?.name || ad.slot;
                    bossDropsHtml += `<div class="enc-drop-item" style="color:var(--accent-cyan)">🛡️ ${ad.baseName} (${slotName}) [${pct}%]</div>`;
                }
                bossDropsHtml += '</div>';
            }
        }

        return `
            <div class="enc-card">
                ${enemy.element ? `<span class="enc-card-element ${elemClass}">${elemName}</span>` : ''}
                <div class="enc-card-header">
                    <div class="enc-card-icon">${enemy.emoji}</div>
                    <div class="enc-card-title">
                        <div class="enc-card-name">${isBoss ? '【BOSS】' : ''}${enemy.name}</div>
                        <div class="enc-card-sub">${isBoss ? 'ボス妖怪' : '通常妖怪'} / ${elemName}属性</div>
                    </div>
                </div>
                <div class="enc-card-body">
                    <div class="enc-stat"><span class="enc-stat-label">基礎HP</span><span class="enc-stat-value">${formatNumber(enemy.baseHP)}</span></div>
                    <div class="enc-stat"><span class="enc-stat-label">基礎ATK</span><span class="enc-stat-value">${enemy.baseATK}</span></div>
                    <div class="enc-stat"><span class="enc-stat-label">基礎DEF</span><span class="enc-stat-value">${enemy.baseDEF}</span></div>
                    <div class="enc-stat"><span class="enc-stat-label">経験値</span><span class="enc-stat-value">${enemy.expReward}</span></div>
                    <div class="enc-stat"><span class="enc-stat-label">ゴールド</span><span class="enc-stat-value">${enemy.goldReward}</span></div>
                    ${isBoss && enemy.spiritStoneReward ? `<div class="enc-stat"><span class="enc-stat-label">霊石</span><span class="enc-stat-value" style="color:var(--accent-primary)">${enemy.spiritStoneReward}</span></div>` : ''}
                </div>
                ${dropsHtml}
                ${bossDropsHtml}
            </div>
        `;
    },

    // ===== 式神図鑑 =====
    renderShikigami() {
        const content = document.getElementById('enc-content');
        const owned = GameState.shikigami.owned;
        const total = Object.keys(SHIKIGAMI_DATA).length;
        const found = Object.keys(owned).length;

        let html = `<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary)">収集: ${found}/${total}</div>`;
        html += '<div class="enc-grid">';

        // ★の高い順にソート
        const sorted = Object.entries(SHIKIGAMI_DATA).sort((a, b) => b[1].stars - a[1].stars);

        for (const [id, data] of sorted) {
            const isOwned = !!owned[id];
            const elemClass = data.element ? `element-${data.element}` : '';
            const elemName = data.element ? getElementName(data.element) : '無';

            const obtainText = {
                drop: 'ダンジョンドロップ',
                boss: `ボス撃破 (${BOSSES[data.obtainBoss]?.name || '???'})`,
                gacha: '霊石召喚'
            }[data.obtainMethod] || '???';

            if (!isOwned) {
                html += `
                    <div class="enc-card undiscovered">
                        <div class="enc-card-header">
                            <div class="enc-card-icon">❓</div>
                            <div class="enc-card-title">
                                <div class="enc-card-name">???</div>
                                <div class="enc-card-sub">${starsDisplay(data.stars)} / 未入手</div>
                            </div>
                        </div>
                        <div class="enc-card-body" style="color:var(--text-muted)">
                            入手方法: ${obtainText}
                        </div>
                    </div>
                `;
            } else {
                const ownData = owned[id];
                html += `
                    <div class="enc-card">
                        ${data.element ? `<span class="enc-card-element ${elemClass}">${elemName}</span>` : ''}
                        <div class="enc-card-header">
                            <div class="enc-card-icon">${data.emoji}</div>
                            <div class="enc-card-title">
                                <div class="enc-card-name">${data.name}</div>
                                <div class="enc-card-sub" style="color:var(--accent-gold)">${starsDisplay(data.stars)}</div>
                            </div>
                        </div>
                        <div class="enc-card-body">
                            <div class="enc-stat"><span class="enc-stat-label">Lv</span><span class="enc-stat-value">${ownData.level}</span></div>
                            <div class="enc-stat"><span class="enc-stat-label">好感度</span><span class="enc-stat-value">${ownData.affection}</span></div>
                            <div class="enc-stat"><span class="enc-stat-label">属性</span><span class="enc-stat-value">${elemName}</span></div>
                            <div class="enc-stat"><span class="enc-stat-label">HP</span><span class="enc-stat-value">${data.baseHP}</span></div>
                            <div class="enc-stat"><span class="enc-stat-label">ATK</span><span class="enc-stat-value">${data.baseATK}</span></div>
                            <div class="enc-stat"><span class="enc-stat-label">DEF</span><span class="enc-stat-value">${data.baseDEF}</span></div>
                            <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)">
                                <div style="font-size:11px;color:var(--accent-cyan)">技: ${data.skill.name}</div>
                                <div style="font-size:10px;color:var(--text-secondary)">${data.skill.desc}</div>
                                <div style="font-size:10px;color:var(--text-muted);margin-top:4px">パッシブ: ${data.passive.desc}</div>
                            </div>
                            <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">入手: ${obtainText}</div>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
        content.innerHTML = html;
    },

    // ===== 装備図鑑 =====
    renderEquipment() {
        const content = document.getElementById('enc-content');

        // 入手済み装備を集計（現在所持 + 装備中）
        const allItems = [...GameState.inventory.equipment];
        for (const item of Object.values(GameState.equipped)) {
            if (item) allItems.push(item);
        }

        // レアリティ別の所持数
        const rarityCounts = {};
        for (const r of Object.keys(RARITY)) { rarityCounts[r] = 0; }
        for (const item of allItems) { rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1; }

        // 武器タイプ別
        const typeCounts = {};
        for (const t of Object.keys(WEAPON_TYPES)) { typeCounts[t] = 0; }
        for (const item of allItems) {
            if (item.weaponType) typeCounts[item.weaponType] = (typeCounts[item.weaponType] || 0) + 1;
        }

        let html = `
            <div style="margin-bottom:24px">
                <h3 style="margin-bottom:12px">所持装備統計</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        `;

        for (const [rarityId, rarity] of Object.entries(RARITY)) {
            html += `
                <div class="equip-card" style="min-width:100px;text-align:center;border-left:3px solid ${rarity.color}">
                    <div style="font-size:11px;color:var(--text-muted)">${rarity.name}</div>
                    <div style="font-size:22px;font-weight:700;color:${rarity.color}">${rarityCounts[rarityId]}</div>
                </div>
            `;
        }

        html += '</div>';

        html += '<h4 style="margin-bottom:8px;font-size:14px">武器タイプ別</h4>';
        html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">';
        for (const [typeId, type] of Object.entries(WEAPON_TYPES)) {
            html += `
                <div class="equip-card" style="min-width:80px;text-align:center">
                    <div style="font-size:24px">${type.emoji}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${type.name}</div>
                    <div style="font-size:16px;font-weight:700">${typeCounts[typeId]}</div>
                </div>
            `;
        }
        html += '</div>';

        // エンチャント一覧
        html += '<h4 style="margin-bottom:8px;font-size:14px">エンチャント一覧</h4>';
        html += '<div class="enc-grid">';
        for (const [id, ench] of Object.entries(ENCHANT_POOL)) {
            const categoryName = { attack: '攻撃', element: '属性', defense: '防御', special: '特殊' }[ench.category] || '';
            const categoryColor = { attack: 'var(--accent-red)', element: 'var(--accent-cyan)', defense: 'var(--accent-green)', special: 'var(--accent-gold)' }[ench.category] || 'var(--text-muted)';
            html += `
                <div class="enc-card" style="padding:10px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-weight:600;font-size:13px">✦ ${ench.name}</span>
                        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${categoryColor}22;color:${categoryColor}">${categoryName}</span>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">
                        ${ench.format.replace('{value}', `${ench.min}~${ench.max}`)}
                    </div>
                </div>
            `;
        }
        html += '</div></div>';

        content.innerHTML = html;
    },

    // ===== 素材図鑑 =====
    renderMaterials() {
        const content = document.getElementById('enc-content');
        const inv = GameState.inventory.materials;
        const total = Object.keys(MATERIALS).length;
        const found = Object.entries(inv).filter(([,c]) => c > 0).length;

        let html = `<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary)">発見: ${found}/${total}</div>`;
        html += '<div class="enc-grid">';

        // レアリティ順にソート
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
        const sorted = Object.entries(MATERIALS).sort((a, b) =>
            (rarityOrder[a[1].rarity] || 0) - (rarityOrder[b[1].rarity] || 0)
        );

        for (const [id, mat] of sorted) {
            const count = inv[id] || 0;
            const isDiscovered = count > 0;

            // どの敵がドロップするか検索
            const dropSources = [];
            for (const [enemyId, enemy] of Object.entries(ENEMIES)) {
                if (enemy.drops && enemy.drops.some(d => d.id === id)) {
                    dropSources.push(enemy.name);
                }
            }
            for (const [bossId, boss] of Object.entries(BOSSES)) {
                if (boss.drops && boss.drops.some(d => d.id === id)) {
                    dropSources.push(`${boss.name}(BOSS)`);
                }
            }

            if (!isDiscovered) {
                html += `
                    <div class="enc-card undiscovered" style="padding:10px">
                        <div class="enc-card-header" style="margin-bottom:0">
                            <div class="enc-card-icon" style="font-size:24px;width:36px;height:36px">❓</div>
                            <div class="enc-card-title">
                                <div class="enc-card-name" style="font-size:13px">???</div>
                                <div class="enc-card-sub">未発見</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="enc-card" style="padding:10px">
                        <div class="enc-card-header" style="margin-bottom:4px">
                            <div class="enc-card-icon" style="font-size:24px;width:36px;height:36px">${mat.emoji}</div>
                            <div class="enc-card-title">
                                <div class="enc-card-name" style="font-size:13px">${mat.name}</div>
                                <div class="enc-card-sub">
                                    <span style="color:${getRarityColor(mat.rarity)}">${getRarityName(mat.rarity)}</span>
                                    | 所持: <span style="color:var(--accent-gold)">${count}</span>
                                </div>
                            </div>
                        </div>
                        ${dropSources.length > 0 ? `<div style="font-size:10px;color:var(--text-muted)">入手: ${dropSources.join(', ')}</div>` : ''}
                    </div>
                `;
            }
        }

        html += '</div>';
        content.innerHTML = html;
    },

    // ===== 実績 =====
    renderAchievements() {
        const content = document.getElementById('enc-content');

        // 実績チェックを実行して状態を更新
        this.checkAllAchievements();

        const categories = {
            combat: { name: '討伐', icon: '⚔️' },
            dungeon: { name: 'ダンジョン', icon: '🗺️' },
            collection: { name: '収集', icon: '🦊' },
            smithy: { name: '鍛冶', icon: '🔨' },
            economy: { name: '経済', icon: '💰' },
            arena: { name: '闘技場', icon: '🏟️' }
        };

        const achByCategory = {};
        for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
            const cat = ach.category || 'other';
            if (!achByCategory[cat]) achByCategory[cat] = [];
            achByCategory[cat].push({ ...ach, isCompleted: !!GameState.encyclopedia.achievements[id] });
        }

        const totalAch = Object.keys(ACHIEVEMENTS).length;
        const completedAch = Object.keys(GameState.encyclopedia.achievements).length;

        let html = `
            <div style="margin-bottom:20px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-size:13px;color:var(--text-secondary)">達成: ${completedAch}/${totalAch}</span>
                    <span style="font-size:13px;color:var(--accent-gold)">${totalAch > 0 ? Math.floor(completedAch / totalAch * 100) : 0}%</span>
                </div>
                <div class="enc-progress-bar">
                    <div class="enc-progress-fill" style="width:${totalAch > 0 ? (completedAch / totalAch * 100) : 0}%"></div>
                </div>
            </div>
        `;

        for (const [catId, catInfo] of Object.entries(categories)) {
            const achs = achByCategory[catId];
            if (!achs || achs.length === 0) continue;

            const catCompleted = achs.filter(a => a.isCompleted).length;

            html += `<h3 style="margin:20px 0 12px;font-size:15px">${catInfo.icon} ${catInfo.name} (${catCompleted}/${achs.length})</h3>`;
            html += '<div style="display:flex;flex-direction:column;gap:8px">';

            for (const ach of achs) {
                const rewardText = this.formatReward(ach.reward);
                html += `
                    <div class="ach-card ${ach.isCompleted ? 'completed' : 'locked'}">
                        <div class="ach-icon">${ach.icon}</div>
                        <div class="ach-info">
                            <div class="ach-name">${ach.name}</div>
                            <div class="ach-desc">${ach.desc}</div>
                            <div class="ach-reward">報酬: ${rewardText}</div>
                        </div>
                        <span class="ach-status ${ach.isCompleted ? 'done' : 'not-done'}">
                            ${ach.isCompleted ? '達成済' : '未達成'}
                        </span>
                    </div>
                `;
            }

            html += '</div>';
        }

        content.innerHTML = html;
    },

    formatReward(reward) {
        const parts = [];
        if (reward.spiritStones) parts.push(`💎 ${reward.spiritStones}`);
        if (reward.gold) parts.push(`💰 ${formatNumber(reward.gold)}`);
        return parts.join(' / ') || 'なし';
    },

    // 全実績チェック → 新たに達成したら報酬付与
    checkAllAchievements() {
        for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
            if (GameState.encyclopedia.achievements[id]) continue; // 既に達成済み
            if (ach.check()) {
                GameState.encyclopedia.achievements[id] = { completedAt: Date.now() };
                // 報酬付与
                if (ach.reward.spiritStones) {
                    GameState.player.spiritStones += ach.reward.spiritStones;
                }
                if (ach.reward.gold) {
                    GameState.player.gold += ach.reward.gold;
                }
                showNotification(`実績達成！「${ach.name}」`, 'success', 4000);
            }
        }
    }
};
