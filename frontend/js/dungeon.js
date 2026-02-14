/* ==========================================
   ダンジョンシステム
   ========================================== */

const Dungeon = {
    // ダンジョン選択画面の表示
    renderDungeonSelect() {
        const list = document.getElementById('dungeon-list');
        list.innerHTML = '';

        for (const [id, dungeon] of Object.entries(DUNGEONS)) {
            const unlocked = this.isDungeonUnlocked(id);
            const cleared = GameState.player.clearedDungeons[id];
            const highestFloor = GameState.player.highestFloor[id] || 0;

            const card = document.createElement('div');
            card.className = `dungeon-card ${unlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <span class="dungeon-card-icon">${dungeon.emoji}</span>
                <div class="dungeon-card-info">
                    <div class="dungeon-card-name">${dungeon.name} ${cleared ? '✅' : ''}</div>
                    <div class="dungeon-card-detail">
                        ${dungeon.desc}<br>
                        ${dungeon.element ? `属性: ${getElementName(dungeon.element)}` : '全属性'}
                        ${highestFloor > 0 ? ` | 最高到達: ${highestFloor}F` : ''}
                    </div>
                </div>
                <span class="dungeon-card-floors">${dungeon.isInfinite ? '∞' : dungeon.floors}F</span>
            `;

            if (unlocked) {
                card.onclick = () => this.startDungeon(id);
            }

            list.appendChild(card);
        }
    },

    isDungeonUnlocked(dungeonId) {
        const dungeon = DUNGEONS[dungeonId];
        if (!dungeon.unlockCondition) return true;
        if (dungeon.unlockCondition.dungeon) {
            return !!GameState.player.clearedDungeons[dungeon.unlockCondition.dungeon];
        }
        return false;
    },

    // ダンジョン開始
    startDungeon(dungeonId) {
        const dungeon = DUNGEONS[dungeonId];
        if (!dungeon) return;

        // ダンジョン一時データ初期化
        const d = GameState.dungeon;
        d.active = true;
        d.currentDungeon = dungeonId;
        d.currentFloor = 1;
        d.playerLevel = 1;
        d.playerExp = 0;
        d.acquiredSkills = {};
        d.lootedEquipment = [];
        d.lootedMaterials = {};
        d.lootedGold = 0;
        d.lootedSpiritStones = 0;
        d.currentEnemies = [];
        d.enemyAttackTimers = {};
        d.killCount = 0;
        d.killsRequired = dungeon.killsPerFloor;
        d.floorCleared = false;
        d.weaponState = {};
        d.buffs = [];
        d.enemyDebuffs = [];
        d.shikigamiTimers = [];
        d.reviveUsed = false;
        d.autoAttackAccum = 0;
        d.pendingLevelUps = 0;

        // ステータス計算
        const stats = calculatePlayerStats();
        d.playerMaxHP = stats.maxHP;
        d.playerHP = stats.maxHP;
        d.playerMaxMP = stats.maxMP;
        d.playerMP = stats.maxMP;
        d.playerATK = stats.atk;
        d.playerDEF = stats.def;
        d.playerCritRate = stats.critRate;
        d.playerCritDmg = stats.critDmg;

        // 戦闘ログクリア
        GameState.battleLog = [];

        // 画面遷移
        switchScreen('battle');

        // UI初期化
        document.getElementById('dungeon-name').textContent = dungeon.name;
        document.getElementById('floor-display').textContent = `B${d.currentFloor}F`;
        // btn-next-floor removed (auto-advance)
        // 武器UI初期化
        Weapons.init(stats.weaponType);

        // プレイヤーステータス表示
        UI.updatePlayerStats();
        UI.updatePlayerBars();
        UI.updateEquipmentTab();

        // 最初の敵出現
        Combat.spawnNextEnemy();
        Combat.lastUpdate = performance.now();

        addBattleLog(`${dungeon.name}に潜入！`, 'system');

        // ゲームループ開始
        this.startGameLoop();
    },

    // 次の階へ
    nextFloor() {
        const d = GameState.dungeon;
        const nextFloorNum = d.currentFloor + 1;

        // 階層遷移エフェクトを表示し、完了後にレベルアップ→進行
        this.showFloorTransition(nextFloorNum, () => {
            if (d.pendingLevelUps > 0) {
                Combat.showLevelUpChoices(() => {
                    this.hideFloorTransition();
                    this.proceedToNextFloor();
                });
            } else {
                this.hideFloorTransition();
                this.proceedToNextFloor();
            }
        });
    },

    // 階層遷移オーバーレイ表示
    showFloorTransition(floorNum, callback) {
        const overlay = document.getElementById('floor-transition');
        const text = document.getElementById('floor-transition-text');
        const subtitle = document.getElementById('floor-transition-subtitle');

        if (!overlay) {
            if (callback) callback();
            return;
        }

        text.textContent = `B${floorNum}F`;

        const dungeon = DUNGEONS[GameState.dungeon.currentDungeon];
        const bossId = dungeon.bossFloors && dungeon.bossFloors[floorNum];
        const isInfiniteBoss = dungeon.isInfinite && floorNum % 10 === 0;

        if (bossId || isInfiniteBoss) {
            subtitle.textContent = '⚠ ボス出現 ⚠';
            subtitle.classList.add('boss-warning');
        } else {
            subtitle.textContent = dungeon.name;
            subtitle.classList.remove('boss-warning');
        }

        overlay.classList.remove('fade-out');
        overlay.classList.add('active');

        // 表示後にコールバック
        setTimeout(() => {
            if (callback) callback();
        }, 1200);
    },

    // 階層遷移オーバーレイ非表示
    hideFloorTransition() {
        const overlay = document.getElementById('floor-transition');
        if (!overlay) return;

        overlay.classList.remove('active');
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.classList.remove('fade-out');
        }, 500);
    },

    // 実際に次の階へ進む処理
    proceedToNextFloor() {
        const d = GameState.dungeon;
        const dungeon = DUNGEONS[d.currentDungeon];

        d.currentFloor++;
        d.killCount = 0;
        d.floorCleared = false;

        // 討伐数は階層に応じて増加
        d.killsRequired = dungeon.killsPerFloor + Math.floor(d.currentFloor / 10);

        document.getElementById('floor-display').textContent = `B${d.currentFloor}F`;
        // btn-next-floor removed (auto-advance)

        UI.updateKillCounter();

        // 最高到達階更新
        if (!GameState.player.highestFloor[d.currentDungeon] || d.currentFloor > GameState.player.highestFloor[d.currentDungeon]) {
            GameState.player.highestFloor[d.currentDungeon] = d.currentFloor;
        }

        // ボス階チェック
        const bossId = dungeon.bossFloors[d.currentFloor];
        if (bossId) {
            Combat.spawnBoss(bossId);
        } else if (dungeon.isInfinite && d.currentFloor % 10 === 0) {
            // 無限回廊：10階ごとにランダムボス
            const bossKeys = Object.keys(BOSSES);
            const randomBoss = randomChoice(bossKeys);
            Combat.spawnBoss(randomBoss);
        } else {
            Combat.spawnNextEnemy();
        }

        addBattleLog(`--- B${d.currentFloor}F ---`, 'system');
    },

    // ダンジョン踏破成功
    onDungeonCleared() {
        const d = GameState.dungeon;
        d.active = false;

        const dungeon = DUNGEONS[d.currentDungeon];
        GameState.player.clearedDungeons[d.currentDungeon] = true;
        GameState.player.totalClears++;

        // 報酬をプレイヤーに付与
        this.applyRewards(true);

        // 結果表示
        document.getElementById('result-title').textContent = '🎉 踏破成功！';
        document.getElementById('result-title').style.color = 'var(--accent-gold)';
        document.getElementById('result-details').innerHTML = this.buildResultHTML(true);
        openModal('result-modal');

        showNotification(`${dungeon.name}を踏破！`, 'success', 5000);

        // 実績チェック
        Encyclopedia.checkAllAchievements();

        // セーブ
        Save.autoSave();
    },

    // ダンジョン失敗
    onDungeonFailed() {
        const d = GameState.dungeon;
        d.active = false;

        GameState.player.totalDefeats++;

        // 報酬を半減して付与
        this.applyRewards(false);

        // 結果表示
        document.getElementById('result-title').textContent = '💀 力尽きた...';
        document.getElementById('result-title').style.color = 'var(--accent-red)';
        document.getElementById('result-details').innerHTML = this.buildResultHTML(false);
        openModal('result-modal');
    },

    // 撤退
    retreat() {
        const d = GameState.dungeon;
        d.active = false;

        // 撤退は成功扱い（アイテム全持ち帰り）
        this.applyRewards(true);

        document.getElementById('result-title').textContent = '🏃 撤退完了';
        document.getElementById('result-title').style.color = 'var(--text-secondary)';
        document.getElementById('result-details').innerHTML = this.buildResultHTML(true);
        openModal('result-modal');
    },

    // 報酬適用
    applyRewards(success) {
        const d = GameState.dungeon;
        const lossMultiplier = success ? 1.0 : 0.5;

        // ゴールド
        const goldGain = Math.floor(d.lootedGold * lossMultiplier);
        GameState.player.gold += goldGain;

        // 霊石
        const stoneGain = Math.floor(d.lootedSpiritStones * lossMultiplier);
        GameState.player.spiritStones += stoneGain;

        // 素材
        for (const [matId, count] of Object.entries(d.lootedMaterials)) {
            const gain = Math.floor(count * lossMultiplier);
            if (gain > 0) {
                GameState.inventory.materials[matId] = (GameState.inventory.materials[matId] || 0) + gain;
            }
        }

        // 装備（失敗時は消失）
        if (success) {
            for (const item of d.lootedEquipment) {
                if (GameState.inventory.equipment.length < GameState.inventory.maxEquipSlots) {
                    GameState.inventory.equipment.push(item);
                }
            }
        }
    },

    buildResultHTML(success) {
        const d = GameState.dungeon;
        const lossMultiplier = success ? 1.0 : 0.5;

        let html = `<div style="margin-bottom:12px">到達階層: <strong>B${d.currentFloor}F</strong></div>`;
        html += `<div style="margin-bottom:12px">討伐レベル: <strong>Lv.${d.playerLevel}</strong></div>`;

        html += `<div style="margin-bottom:4px">💰 ゴールド: +${formatNumber(Math.floor(d.lootedGold * lossMultiplier))}</div>`;

        if (d.lootedSpiritStones > 0) {
            html += `<div style="margin-bottom:4px">💎 霊石: +${Math.floor(d.lootedSpiritStones * lossMultiplier)}</div>`;
        }

        // 素材
        const matEntries = Object.entries(d.lootedMaterials);
        if (matEntries.length > 0) {
            html += '<div style="margin-top:12px;margin-bottom:4px"><strong>素材:</strong></div>';
            for (const [matId, count] of matEntries) {
                const mat = MATERIALS[matId];
                const gain = Math.floor(count * lossMultiplier);
                if (mat && gain > 0) {
                    html += `<div style="padding-left:8px">${mat.emoji} ${mat.name} ×${gain}</div>`;
                }
            }
        }

        // 装備
        if (d.lootedEquipment.length > 0) {
            html += '<div style="margin-top:12px;margin-bottom:4px"><strong>装備:</strong></div>';
            if (success) {
                for (const item of d.lootedEquipment) {
                    html += `<div style="padding-left:8px;color:${getRarityColor(item.rarity)}">【${getRarityName(item.rarity)}】${item.name}</div>`;
                }
            } else {
                html += '<div style="padding-left:8px;color:var(--accent-red)">全て消失...</div>';
            }
        }

        if (!success) {
            html += '<div style="margin-top:12px;color:var(--accent-red)">※ ゴールド・素材は半減、装備は消失</div>';
        }

        return html;
    },

    // ゲームループ
    gameLoopId: null,

    startGameLoop() {
        const loop = (timestamp) => {
            Combat.update(timestamp);
            if (GameState.dungeon.active) {
                this.gameLoopId = requestAnimationFrame(loop);
            }
        };
        this.gameLoopId = requestAnimationFrame(loop);
    },

    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
};
