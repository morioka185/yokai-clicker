/* ==========================================
   戦闘システム（複数敵対応）
   ========================================== */

const Combat = {
    lastUpdate: 0,
    regenTimer: 0,

    // === ヘルパー: 生存敵リスト ===
    getAliveEnemies() {
        return GameState.dungeon.currentEnemies.filter(e => e && e.hp > 0);
    },

    getEnemyInZone(zone) {
        return GameState.dungeon.currentEnemies.find(e => e && e.hp > 0 && e.position === zone) || null;
    },

    getAdjacentEnemies(zone) {
        const adj = [];
        if (zone > 0) {
            const left = this.getEnemyInZone(zone - 1);
            if (left) adj.push(left);
        }
        if (zone < 2) {
            const right = this.getEnemyInZone(zone + 1);
            if (right) adj.push(right);
        }
        return adj;
    },

    // === メインのクリック攻撃処理（複数敵対応） ===
    // targetEnemies: 攻撃対象の敵配列、dmgMultPerTarget: 全体攻撃時のダメージ倍率
    performClick(weaponMultiplier = 1.0, targetEnemies = null, dmgMultPerTarget = 1.0) {
        const d = GameState.dungeon;
        const alive = this.getAliveEnemies();
        if (!d.active || alive.length === 0) return;

        const stats = calculatePlayerStats();

        // ターゲットが指定されていなければ先頭の生存敵
        // 無双スキル: 通常攻撃が全体攻撃になる
        if (!targetEnemies) {
            if (stats.aoeAttack) {
                targetEnemies = alive;
                dmgMultPerTarget = stats.aoeDmgPercent / 100;
            } else {
                targetEnemies = [alive[0]];
            }
        }

        for (const target of targetEnemies) {
            if (!target || target.hp <= 0) continue;

            const dmgResult = this.calculateDamage(stats, target, weaponMultiplier);
            let damage = dmgResult.damage;

            // クリティカル判定
            let isCrit = Math.random() * 100 < stats.critRate;
            if (isCrit) {
                damage = Math.floor(damage * stats.critDmg / 100);
            }

            // クリックダメージボーナス
            damage = Math.floor(damage * (1 + stats.clickDmgPercent / 100));

            // HP50%以下ボーナス
            if (stats.lowHpAtkBonus > 0 && d.playerHP < d.playerMaxHP * 0.5) {
                damage = Math.floor(damage * (1 + stats.lowHpAtkBonus / 100));
            }

            // ボスダメージボーナス
            if (target.isBoss && stats.bossDmgPercent > 0) {
                damage = Math.floor(damage * (1 + stats.bossDmgPercent / 100));
            }

            // 複数体ヒット時のダメージ係数
            damage = Math.floor(damage * dmgMultPerTarget);

            // SE（最初の敵のみ）
            if (target === targetEnemies[0]) {
                if (isCrit) SoundManager.crit(); else SoundManager.hit();
            }

            // ダメージ適用（属性情報付き）
            this.applyDamageToEnemy(damage, isCrit, target, {
                element: dmgResult.primaryElement,
                effectiveness: dmgResult.effectiveness
            });

            // 吸血
            if (stats.lifeSteal > 0) {
                const healAmount = Math.floor(damage * stats.lifeSteal / 100);
                this.healPlayer(healAmount);
            }

            // 追加攻撃
            if (stats.multiHitChance > 0 && Math.random() * 100 < stats.multiHitChance) {
                const extraDmg = Math.floor(damage * 0.5);
                const t = target;
                setTimeout(() => this.applyDamageToEnemy(extraDmg, false, t), 150);
            }

            // 固定効果（即死など）
            for (const fx of stats.fixedEffects) {
                if (fx.instantKillChance && Math.random() < fx.instantKillChance) {
                    if (!target.isBoss || target.hp < target.maxHP * 0.1) {
                        this.applyDamageToEnemy(target.hp, false, target);
                        addBattleLog('裁きの一撃が発動！', 'damage');
                    }
                }
            }
        }
    },

    calculateDamage(stats, enemy, multiplier = 1.0) {
        // 基礎ダメージ
        let damage = Math.max(1, stats.atk - enemy.def * 0.3);
        damage *= multiplier;

        // 属性ダメージ
        let elements = [];
        if (stats.weaponElement) elements.push(stats.weaponElement);
        elements = elements.concat(stats.addElements);

        let elemBonus = 0;
        let bestEffectiveness = 1.0;
        let primaryElement = null;
        for (const elem of elements) {
            const mult = getElementMultiplier(elem, enemy.element);
            elemBonus += stats.elemDmg[elem] * mult;
            if (mult > 1) damage *= mult;
            else if (mult < 1) damage *= mult;
            // 最も効果的/非効果的な属性を記録
            if (!primaryElement || Math.abs(mult - 1) > Math.abs(bestEffectiveness - 1)) {
                bestEffectiveness = mult;
                primaryElement = elem;
            }
        }
        damage += elemBonus;

        // 最低ダメージ保証
        damage = Math.max(1, Math.floor(damage));

        // ±10%のランダム幅
        damage = Math.floor(damage * randomFloat(0.9, 1.1));

        // 属性情報を返す（ダメージ表示に使用）
        return { damage, primaryElement, effectiveness: bestEffectiveness };
    },

    // === ダメージ適用（個別敵対応） ===
    // elemOpts: { element, effectiveness } 属性情報（オプション）
    applyDamageToEnemy(damage, isCrit, targetEnemy, elemOpts) {
        const d = GameState.dungeon;
        // 後方互換: targetEnemyが未指定なら先頭の生存敵
        if (!targetEnemy) {
            targetEnemy = d.currentEnemy;
        }
        if (!targetEnemy || targetEnemy.hp <= 0) return;

        targetEnemy.hp = Math.max(0, targetEnemy.hp - damage);

        // ダメージ表示（ポジション連動、属性色付き）
        const posX = getPositionX(targetEnemy.position);
        showDamageNumber(damage, posX, 50, isCrit ? 'crit' : 'normal', elemOpts || {});
        if (isCrit) screenShake();

        // 敵ヒットアニメーション
        const enemyVisual = document.getElementById(`enemy-visual-${targetEnemy.position}`);
        if (enemyVisual) {
            enemyVisual.classList.remove('enemy-hit');
            void enemyVisual.offsetWidth;
            enemyVisual.classList.add('enemy-hit');
        }

        // UI更新
        UI.updateEnemyHP();

        // 敵撃破チェック
        if (targetEnemy.hp <= 0) {
            this.onEnemyDefeated(targetEnemy);
        }
    },

    healPlayer(amount) {
        const d = GameState.dungeon;
        d.playerHP = Math.min(d.playerMaxHP, d.playerHP + amount);
        if (amount > 0) {
            showDamageNumber(amount, 50, 50, 'heal');
            SoundManager.heal();
        }
        UI.updatePlayerBars();
    },

    // === 個別敵撃破処理 ===
    onEnemyDefeated(enemy) {
        const d = GameState.dungeon;

        // SE
        SoundManager.enemyDefeat();

        // 死亡アニメーション
        const enemyVisual = document.getElementById(`enemy-visual-${enemy.position}`);
        if (enemyVisual) {
            enemyVisual.classList.add('enemy-death');
        }
        const slot = document.getElementById(`enemy-slot-${enemy.position}`);
        if (slot) {
            setTimeout(() => slot.classList.add('defeated'), 500);
        }

        const stats = calculatePlayerStats();

        // 経験値
        const expGain = Math.floor(enemy.expReward * (1 + stats.expBonus / 100));
        d.playerExp += expGain;
        addBattleLog(`${enemy.name}を討伐！ EXP+${expGain}`, 'level');

        // ゴールド
        const goldGain = Math.floor(enemy.goldReward * (1 + stats.goldBonus / 100));
        d.lootedGold += goldGain;
        addBattleLog(`+${goldGain}G`, 'loot');

        // 霊石（ボスのみ）
        if (enemy.isBoss && enemy.spiritStoneReward) {
            d.lootedSpiritStones += enemy.spiritStoneReward;
            addBattleLog(`+${enemy.spiritStoneReward} 霊石`, 'loot');
        }

        // ドロップ処理
        this.processDrops(enemy, stats);

        // 式神EXP（パーティ全員に敵EXPの30%を付与）
        for (const shikiId of GameState.shikigami.party) {
            if (shikiId && GameState.shikigami.owned[shikiId]) {
                Shikigami.addExp(shikiId, Math.floor(enemy.expReward * 0.3));
            }
        }

        // 大爆発スキル: 敵撃破時に周囲にダメージ
        if (stats.deathExplosion) {
            const explosionDmg = Math.floor(enemy.maxHP * stats.explosionPercent / 100);
            const otherAlive = this.getAliveEnemies().filter(e => e !== enemy);
            for (const other of otherAlive) {
                this.applyDamageToEnemy(explosionDmg, false, other);
            }
            if (otherAlive.length > 0) {
                addBattleLog(`大爆発！ 周囲に${explosionDmg}ダメージ`, 'damage');
            }
        }

        // 図鑑登録
        GameState.encyclopedia.discoveredEnemies[enemy.id] = true;

        // レベルアップチェック
        this.checkLevelUp();

        // 討伐数更新
        d.killCount++;
        UI.updateKillCounter();

        // 攻撃タイマー削除
        delete d.enemyAttackTimers[enemy.position];

        // 全敵撃破チェック
        const alive = this.getAliveEnemies();
        if (alive.length === 0) {
            this.onWaveCleared();
        }
    },

    // === ウェーブクリア ===
    onWaveCleared() {
        const d = GameState.dungeon;

        // 階層クリアチェック
        if (d.killCount >= d.killsRequired) {
            d.floorCleared = true;

            const dungeon = DUNGEONS[d.currentDungeon];
            const bossId = dungeon.bossFloors[d.currentFloor];
            // ボス階の通常敵を倒した後にボス出現
            if (bossId && !d.currentEnemies.some(e => e.isBoss)) {
                setTimeout(() => this.spawnBoss(bossId), 800);
            } else if (d.currentFloor >= dungeon.floors && !dungeon.isInfinite) {
                // ダンジョン踏破
                setTimeout(() => Dungeon.onDungeonCleared(), 1000);
            } else {
                // 自動で次の階へ進む
                setTimeout(() => Dungeon.nextFloor(), 800);
            }
        } else {
            // 次のウェーブ出現
            setTimeout(() => this.spawnEnemyWave(), 600);
        }
    },

    processDrops(enemy, stats) {
        const d = GameState.dungeon;
        const dropBonus = 1 + stats.dropRate / 100;

        // 通常素材ドロップ
        if (enemy.drops) {
            for (const drop of enemy.drops) {
                if (Math.random() < drop.chance * dropBonus) {
                    const count = drop.min ? randomInt(drop.min, drop.max) : 1;
                    d.lootedMaterials[drop.id] = (d.lootedMaterials[drop.id] || 0) + count;
                    const mat = MATERIALS[drop.id];
                    if (mat) {
                        addBattleLog(`${mat.emoji} ${mat.name} x${count} を入手`, 'loot');
                    }
                }
            }
        }

        // ボス武器ドロップ
        if (enemy.weaponDrops) {
            for (const wDrop of enemy.weaponDrops) {
                if (Math.random() < wDrop.chance * dropBonus) {
                    const item = Equipment.generateBossWeapon(wDrop, d.currentFloor);
                    d.lootedEquipment.push(item);
                    addBattleLog(`【${getRarityName(item.rarity)}】${item.name} を入手！`, 'loot');
                    showNotification(`${item.name} を入手！`, 'success');
                }
            }
        }

        // ボス防具ドロップ
        if (enemy.armorDrops) {
            for (const aDrop of enemy.armorDrops) {
                if (Math.random() < aDrop.chance * dropBonus) {
                    const item = Equipment.generateBossArmor(aDrop, d.currentFloor);
                    d.lootedEquipment.push(item);
                    addBattleLog(`【${getRarityName(item.rarity)}】${item.name} を入手！`, 'loot');
                    showNotification(`${item.name} を入手！`, 'success');
                }
            }
        }

        // 式神ドロップ（ボス固有の★4式神）
        if (enemy.isBoss && enemy.id) {
            for (const [shikiId, shikiData] of Object.entries(SHIKIGAMI_DATA)) {
                if (shikiData.obtainMethod === 'boss' && shikiData.obtainBoss === enemy.id) {
                    if (!GameState.shikigami.owned[shikiId]) {
                        Shikigami.obtainShikigami(shikiId);
                        addBattleLog(`式神「${shikiData.name}」が仲間になった！`, 'loot');
                    }
                }
            }

            // 初回撃破ボーナス
            if (!GameState.player.firstClearBonuses[enemy.id]) {
                GameState.player.firstClearBonuses[enemy.id] = true;
                const bonusStones = enemy.spiritStoneReward || 10;
                d.lootedSpiritStones += bonusStones;
                addBattleLog(`初回撃破ボーナス！ +${bonusStones} 霊石`, 'loot');
                showNotification('初回撃破ボーナス！', 'success');
            }
        }
    },

    checkLevelUp() {
        const d = GameState.dungeon;
        const expNeeded = getExpToNextLevel(d.playerLevel);
        if (d.playerExp >= expNeeded) {
            d.playerExp -= expNeeded;
            d.playerLevel++;

            SoundManager.levelUp();
            d.pendingLevelUps++;

            addBattleLog(`レベルアップ！ Lv.${d.playerLevel}`, 'level');
            showNotification(`レベルアップ！ Lv.${d.playerLevel}`, 'success');

            const stats = calculatePlayerStats();
            d.playerMaxHP = stats.maxHP;
            d.playerMaxMP = stats.maxMP;
            d.playerHP = d.playerMaxHP;
            d.playerMP = d.playerMaxMP;

            UI.updatePlayerBars();
            UI.updatePlayerStats();

            document.getElementById('battle-screen').classList.add('levelup-flash');
            setTimeout(() => document.getElementById('battle-screen').classList.remove('levelup-flash'), 1000);

            this.checkLevelUp();
        }
    },

    showLevelUpChoices(onComplete) {
        const d = GameState.dungeon;

        if (d.pendingLevelUps <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const allSkills = Object.values(LEVELUP_SKILLS);
        const available = allSkills.filter(s => {
            if (!s.stackable && d.acquiredSkills[s.id]) return false;
            if (s.stackable && d.acquiredSkills[s.id] >= s.maxStack) return false;
            return true;
        });

        const choices = [];
        const pool = [...available];
        for (let i = 0; i < 3 && pool.length > 0; i++) {
            const idx = randomInt(0, pool.length - 1);
            choices.push(pool.splice(idx, 1)[0]);
        }

        if (choices.length === 0) {
            d.pendingLevelUps = 0;
            if (onComplete) onComplete();
            return;
        }

        const container = document.getElementById('levelup-choices');
        container.innerHTML = '';

        const hint = document.getElementById('levelup-hint');
        if (hint) {
            hint.textContent = d.pendingLevelUps > 1
                ? `スキルを一つ選択せよ（残り${d.pendingLevelUps}回）`
                : 'スキルを一つ選択せよ';
        }

        for (const skill of choices) {
            const btn = document.createElement('button');
            btn.className = 'levelup-choice';
            const categoryClass = skill.category === 'budo' ? 'category-budo' :
                                 skill.category === 'onmyo' ? 'category-onmyo' : 'category-jintsuu';
            const categoryName = skill.category === 'budo' ? '武道' :
                                skill.category === 'onmyo' ? '陰陽術' : '神通力';
            const current = d.acquiredSkills[skill.id] || 0;
            const stackInfo = skill.stackable ? ` (${current}/${skill.maxStack})` : '';

            btn.innerHTML = `
                <span class="levelup-choice-category ${categoryClass}">${categoryName}</span>
                <div class="levelup-choice-name">${skill.name}${stackInfo}</div>
                <div class="levelup-choice-desc">${skill.desc}</div>
            `;
            btn.onclick = () => {
                d.acquiredSkills[skill.id] = (d.acquiredSkills[skill.id] || 0) + 1;
                d.pendingLevelUps--;
                closeModal('levelup-modal');
                UI.updatePlayerStats();
                addBattleLog(`スキル「${skill.name}」を習得！`, 'system');

                if (d.pendingLevelUps > 0) {
                    setTimeout(() => this.showLevelUpChoices(onComplete), 300);
                } else if (onComplete) {
                    onComplete();
                }
            };
            container.appendChild(btn);
        }

        openModal('levelup-modal');
    },

    // === ボス出現（1体、中央ポジション） ===
    spawnBoss(bossId) {
        const boss = BOSSES[bossId];
        if (!boss) return;

        const d = GameState.dungeon;
        const scaling = getFloorScaling(d.currentDungeon, d.currentFloor);

        const bossEnemy = {
            ...boss,
            hp: Math.floor(boss.baseHP * scaling),
            maxHP: Math.floor(boss.baseHP * scaling),
            atk: Math.floor(boss.baseATK * scaling),
            def: Math.floor(boss.baseDEF * scaling),
            expReward: Math.floor(boss.expReward * scaling),
            goldReward: Math.floor(boss.goldReward * scaling),
            position: 1 // 中央
        };

        d.currentEnemies = [bossEnemy];
        d.enemyAttackTimers = { 1: 0 };
        d.killCount = d.killsRequired - 1;
        d.floorCleared = false;
        // btn-next-floor removed (auto-advance)

        SoundManager.bossAppear();
        addBattleLog(`ボス出現！ ${boss.name}！`, 'system');
        showNotification(`ボス出現！ ${boss.name}`, 'warning');

        UI.updateEnemyDisplay();
    },

    // === ウェーブ生成（1~3体の敵を同時出現） ===
    spawnEnemyWave() {
        const d = GameState.dungeon;
        const dungeonData = DUNGEONS[d.currentDungeon];
        const enemyTable = DUNGEON_ENEMIES[dungeonData.enemyTable];

        if (!enemyTable || enemyTable.length === 0) return;

        const scaling = getFloorScaling(d.currentDungeon, d.currentFloor);

        // 出現数: 序盤1体、5F以降2体、10F以降3体
        const maxCount = Math.min(3, 1 + Math.floor(d.currentFloor / 5));
        // 残り必要討伐数を考慮
        const remaining = d.killsRequired - d.killCount;
        const count = Math.min(maxCount, remaining);

        // ポジション割り当て
        let positions;
        if (count === 1) {
            positions = [1]; // 中央
        } else if (count === 2) {
            positions = [0, 2]; // 左右
        } else {
            positions = [0, 1, 2]; // 左中右
        }

        const enemies = [];
        d.enemyAttackTimers = {};

        for (let i = 0; i < count; i++) {
            const enemyId = randomChoice(enemyTable);
            const enemyData = ENEMIES[enemyId];
            if (!enemyData) continue;

            const enemy = {
                ...enemyData,
                hp: Math.floor(enemyData.baseHP * scaling),
                maxHP: Math.floor(enemyData.baseHP * scaling),
                atk: Math.floor(enemyData.baseATK * scaling),
                def: Math.floor(enemyData.baseDEF * scaling),
                expReward: Math.floor(enemyData.expReward * scaling),
                goldReward: Math.floor(enemyData.goldReward * scaling),
                position: positions[i]
            };
            enemies.push(enemy);
            // 攻撃タイマーにstagger追加（敵ごとにずらす）
            d.enemyAttackTimers[positions[i]] = i * 0.8;
        }

        d.currentEnemies = enemies;
        UI.updateEnemyDisplay();
    },

    // spawnNextEnemyはspawnEnemyWaveに委譲
    spawnNextEnemy() {
        this.spawnEnemyWave();
    },

    // === ゲームループ ===
    update(timestamp) {
        if (!GameState.dungeon.active) return;

        const dt = (timestamp - this.lastUpdate) / 1000;
        this.lastUpdate = timestamp;
        if (dt > 1) return;

        const d = GameState.dungeon;
        const stats = calculatePlayerStats();

        // HP自然回復 + MP自然回復
        this.regenTimer += dt;
        if (this.regenTimer >= 1) {
            this.regenTimer = 0;
            if (stats.hpRegen > 0 && d.playerHP < d.playerMaxHP) {
                const regenAmount = Math.floor(d.playerMaxHP * stats.hpRegen / 100);
                this.healPlayer(regenAmount);
            }
            // MP回復: 毎秒最大MPの3%
            if (d.playerMP < d.playerMaxMP) {
                d.playerMP = Math.min(d.playerMaxMP, d.playerMP + Math.max(1, Math.floor(d.playerMaxMP * 0.03)));
                UI.updatePlayerBars();
            }
        }

        // 各敵の独立攻撃タイマー
        const alive = this.getAliveEnemies();
        const aliveCount = alive.length;
        if (aliveCount > 0) {
            const enemyAtkInterval = (2.0 + aliveCount * 0.5) * (1 + stats.enemyAtkSlow / 100);
            for (const enemy of alive) {
                const pos = enemy.position;
                if (d.enemyAttackTimers[pos] === undefined) d.enemyAttackTimers[pos] = 0;
                d.enemyAttackTimers[pos] += dt;
                if (d.enemyAttackTimers[pos] >= enemyAtkInterval) {
                    d.enemyAttackTimers[pos] = 0;
                    this.enemyAttackFrom(enemy);
                }
            }
        }

        // 自動攻撃（先頭の生存敵を攻撃）
        if (d.autoAttack && alive.length > 0) {
            const atkInterval = Math.max(0.3, 1.0 / (1 + stats.atkSpeed / 100));
            if (!d.autoAttackAccum) d.autoAttackAccum = 0;
            d.autoAttackAccum += dt;
            if (d.autoAttackAccum >= atkInterval) {
                d.autoAttackAccum = 0;
                this.performClick(0.5, [alive[0]]);
            }
        }

        // バフタイマー
        for (const buff of d.buffs) {
            if (buff.remaining > 0) buff.remaining -= dt;
        }

        // 結界の自動発動（MP20消費）
        if (d.acquiredSkills['onmyo_kekkai']) {
            const hasBarrier = d.buffs.find(b => b.type === 'invincible' && b.remaining > 0);
            if (!d.barrierCooldown) d.barrierCooldown = 0;
            if (d.barrierCooldown > 0) {
                d.barrierCooldown -= dt;
            } else if (!hasBarrier && d.playerMP >= 20) {
                d.playerMP -= 20;
                d.buffs.push({ type: 'invincible', remaining: 30 });
                d.barrierCooldown = 120;
                addBattleLog('結界が自動展開！ 30秒間無敵 (MP-20)', 'system');
                showNotification('結界展開！', 'info', 2000);
                UI.updatePlayerBars();
            }
        }

        // 式神スキル
        this.updateShikigamiSkills(dt);
        Shikigami.updateCooldownBars();

        // 武器UIの更新
        Weapons.update(dt);
    },

    // === 個別敵の攻撃 ===
    enemyAttackFrom(enemy) {
        const d = GameState.dungeon;
        if (!enemy || enemy.hp <= 0) return;

        // バフチェック（無敵）
        const invincible = d.buffs.find(b => b.type === 'invincible' && b.remaining > 0);
        if (invincible) {
            addBattleLog('結界が攻撃を防いだ！', 'system');
            return;
        }

        const stats = calculatePlayerStats();
        let damage = Math.max(1, enemy.atk - stats.def * 0.5);
        damage = Math.floor(damage * (1 - stats.dmgReduction / 100));
        damage = Math.floor(damage * randomFloat(0.8, 1.2));

        // 属性ダメージ軽減
        if (enemy.element && stats.elemResist[enemy.element]) {
            damage = Math.floor(damage * (1 - stats.elemResist[enemy.element] / 100));
        }

        d.playerHP = Math.max(0, d.playerHP - damage);
        SoundManager.playerHit();
        addBattleLog(`${enemy.name}の攻撃！ ${damage}ダメージ`, 'damage');
        UI.updatePlayerBars();

        // --- ビジュアルフィードバック ---
        const isHeavy = damage > d.playerMaxHP * 0.2;
        this.showPlayerHitEffect(enemy, damage, isHeavy);

        // 死亡チェック
        if (d.playerHP <= 0) {
            if (stats.revive && !d.reviveUsed) {
                d.reviveUsed = true;
                d.playerHP = Math.floor(d.playerMaxHP * stats.reviveHpPercent / 100);
                addBattleLog('復活スキルが発動！', 'system');
                showNotification('復活！', 'success');
                UI.updatePlayerBars();
            } else {
                this.onPlayerDefeated();
            }
        }
    },

    // === 被ダメージビジュアルエフェクト ===
    showPlayerHitEffect(enemy, damage, isHeavy) {
        // 1. 赤フラッシュオーバーレイ
        const overlay = document.getElementById('player-hit-overlay');
        if (overlay) {
            overlay.classList.remove('active', 'heavy');
            void overlay.offsetWidth; // reflow
            overlay.classList.add(isHeavy ? 'heavy' : 'active');
            setTimeout(() => overlay.classList.remove('active', 'heavy'), 500);
        }

        // 2. 敵の突進アニメーション
        const enemyVisual = document.getElementById(`enemy-visual-${enemy.position}`);
        if (enemyVisual) {
            enemyVisual.classList.remove('enemy-lunge');
            void enemyVisual.offsetWidth;
            enemyVisual.classList.add('enemy-lunge');
            setTimeout(() => enemyVisual.classList.remove('enemy-lunge'), 400);
        }

        // 3. HPバーフラッシュ
        const hpBar = document.querySelector('.hp-bar');
        if (hpBar) {
            hpBar.classList.remove('bar-flash');
            void hpBar.offsetWidth;
            hpBar.classList.add('bar-flash');
            setTimeout(() => hpBar.classList.remove('bar-flash'), 300);
        }

        // 4. プレイヤーダメージ数字表示
        const header = document.querySelector('.battle-header');
        if (header) {
            const dmgEl = document.createElement('div');
            dmgEl.className = 'player-damage-number' + (isHeavy ? ' heavy' : '');
            dmgEl.textContent = '-' + formatNumber(damage);
            const offsetX = randomInt(-30, 30);
            dmgEl.style.left = `calc(50% + ${offsetX}px)`;
            dmgEl.style.top = '100%';
            header.style.position = 'relative';
            header.appendChild(dmgEl);
            setTimeout(() => dmgEl.remove(), 800);
        }
    },

    // 後方互換用
    enemyAttack() {
        const alive = this.getAliveEnemies();
        if (alive.length > 0) {
            this.enemyAttackFrom(alive[0]);
        }
    },

    onPlayerDefeated() {
        const d = GameState.dungeon;
        d.active = false;
        SoundManager.playerDeath();
        addBattleLog('力尽きた...', 'damage');
        Dungeon.onDungeonFailed();
    },

    updateShikigamiSkills(dt) {
        const d = GameState.dungeon;
        const alive = this.getAliveEnemies();
        if (alive.length === 0) return;

        for (let i = 0; i < GameState.shikigami.party.length; i++) {
            const shikiId = GameState.shikigami.party[i];
            if (!shikiId) continue;
            const data = SHIKIGAMI_DATA[shikiId];
            if (!data) continue;

            if (!d.shikigamiTimers[i]) d.shikigamiTimers[i] = 0;
            d.shikigamiTimers[i] += dt;

            if (d.shikigamiTimers[i] >= data.skill.interval) {
                d.shikigamiTimers[i] = 0;
                // MP消費（★レベルに応じたコスト）
                const mpCost = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 18 }[data.stars] || 5;
                if (d.playerMP >= mpCost) {
                    d.playerMP -= mpCost;
                    UI.updatePlayerBars();
                    this.executeShikigamiSkill(shikiId, data);
                } else {
                    addBattleLog(`${data.name}のMP不足...`, 'system');
                }
            }
        }
    },

    executeShikigamiSkill(shikiId, data) {
        const d = GameState.dungeon;
        const owned = GameState.shikigami.owned[shikiId];
        if (!owned) return;

        const stats = calculatePlayerStats();
        const shikiATK = data.baseATK * (1 + owned.level * 0.1) * (1 + stats.shikigamiDpsPercent / 100);
        const alive = this.getAliveEnemies();
        const skillElem = data.skill.element || data.element || null;
        const partyIndex = GameState.shikigami.party.indexOf(shikiId);

        // 式神スロット発動フラッシュ
        this.flashShikigamiSlot(partyIndex, skillElem || data.element);

        if (data.skill.type === 'damage') {
            if (alive.length === 0) return;
            const targets = data.skill.aoe ? alive : [alive[0]];
            const isAoe = targets.length > 1;

            // スキル名ラベル表示
            this.showShikigamiSkillLabel(data, skillElem);

            // AoEエフェクト
            if (isAoe) {
                this.showShikigamiAoeEffect(skillElem);
            }

            for (const target of targets) {
                let dmg = Math.floor(shikiATK * data.skill.multiplier);
                let effectiveness = 1.0;
                if (skillElem) {
                    effectiveness = getElementMultiplier(skillElem, target.element);
                    dmg = Math.floor(dmg * effectiveness);
                }

                // 属性色付きダメージ表示
                const posX = getPositionX(target.position);
                showDamageNumber(dmg, posX, 50, 'shikigami', {
                    element: skillElem,
                    effectiveness: effectiveness
                });

                // 個別ヒットエフェクト
                this.showShikigamiHitEffect(target, skillElem);

                // ダメージ適用（ダメージ数字は独自表示済みなので直接HP減算）
                this.applyShikigamiDamage(dmg, target);
            }

            const sampleDmg = Math.floor(shikiATK * data.skill.multiplier);
            addBattleLog(`${data.name}「${data.skill.name}」！ ${sampleDmg}ダメージ${targets.length > 1 ? ` ×${targets.length}体` : ''}`, 'system');

            // healAlly
            if (data.skill.healAlly) {
                const healAmt = Math.floor(d.playerMaxHP * data.skill.healAlly / 100);
                this.healPlayer(healAmt);
                this.showShikigamiHealEffect();
                addBattleLog(`${data.name}の加護！ HP+${healAmt}`, 'heal');
            }

            // debuffAtk
            if (data.skill.debuffAtk) {
                for (const target of targets) {
                    if (target.hp > 0) {
                        const origAtk = target.atk;
                        target.atk = Math.max(1, Math.floor(target.atk * (1 - data.skill.debuffAtk / 100)));
                        setTimeout(() => {
                            if (target.hp > 0) target.atk = origAtk;
                        }, 10000);
                    }
                }
                addBattleLog(`敵のATK-${data.skill.debuffAtk}%！(10秒)`, 'system');
            }

            // stun
            if (data.skill.stun) {
                for (const target of targets) {
                    if (target.hp > 0) {
                        d.enemyAttackTimers[target.position] = -(data.skill.stun);
                    }
                }
                addBattleLog(`敵を${data.skill.stun}秒拘束！`, 'system');
            }

        } else if (data.skill.type === 'heal') {
            const healAmt = Math.floor(d.playerMaxHP * data.skill.value / 100);
            this.healPlayer(healAmt);
            this.showShikigamiSkillLabel(data, 'wood');
            this.showShikigamiHealEffect();
            addBattleLog(`${data.name}「${data.skill.name}」！ HP+${healAmt}`, 'heal');

        } else if (data.skill.type === 'debuff') {
            if (alive.length === 0) return;
            this.showShikigamiSkillLabel(data, null);
            const duration = (data.skill.duration || 10) * 1000;
            for (const target of alive) {
                this.showShikigamiDebuffEffect(target);
                if (data.skill.stat === 'atk') {
                    const origAtk = target.atk;
                    target.atk = Math.max(1, Math.floor(target.atk * (1 + data.skill.value / 100)));
                    setTimeout(() => {
                        if (target.hp > 0) target.atk = origAtk;
                    }, duration);
                }
            }
            addBattleLog(`${data.name}「${data.skill.name}」！ 敵を弱体化(${data.skill.duration || 10}秒)`, 'system');
        }
    },

    // === 式神ダメージ適用（独自のダメージ数字表示は呼び出し側で済み） ===
    applyShikigamiDamage(damage, targetEnemy) {
        const d = GameState.dungeon;
        if (!targetEnemy || targetEnemy.hp <= 0) return;
        targetEnemy.hp = Math.max(0, targetEnemy.hp - damage);

        // 敵ヒットアニメーション
        const enemyVisual = document.getElementById(`enemy-visual-${targetEnemy.position}`);
        if (enemyVisual) {
            enemyVisual.classList.remove('enemy-hit');
            void enemyVisual.offsetWidth;
            enemyVisual.classList.add('enemy-hit');
        }

        UI.updateEnemyHP();
        if (targetEnemy.hp <= 0) {
            this.onEnemyDefeated(targetEnemy);
        }
    },

    // === 式神ビジュアルエフェクト群 ===

    // スキル名ラベル表示
    showShikigamiSkillLabel(data, element) {
        const container = document.getElementById('damage-numbers');
        if (!container) return;
        const label = document.createElement('div');
        const elemClass = element ? `element-${element}` : 'element-none';
        label.className = `shikigami-skill-label ${elemClass}`;
        label.textContent = `${data.emoji} ${data.skill.name}`;
        label.style.left = '50%';
        label.style.top = '18%';
        label.style.transform = 'translateX(-50%)';
        container.appendChild(label);
        setTimeout(() => label.remove(), 1500);
    },

    // 個別ヒットエフェクト（敵位置に属性エフェクト表示）
    showShikigamiHitEffect(target, element) {
        const area = document.getElementById('enemy-area');
        if (!area) return;
        const posX = getPositionX(target.position);
        const fx = document.createElement('div');
        const fxClass = element ? `shiki-fx-${element}` : 'shiki-fx-none';
        fx.className = `shikigami-attack-fx ${fxClass}`;
        fx.style.left = `${posX}%`;
        fx.style.top = '55%';
        fx.style.transform = 'translate(-50%, -50%)';
        area.appendChild(fx);
        setTimeout(() => fx.remove(), 700);
    },

    // AoE全体エフェクト
    showShikigamiAoeEffect(element) {
        const area = document.getElementById('enemy-area');
        if (!area) return;
        const fx = document.createElement('div');
        const elemClass = element ? `element-${element}` : 'element-none';
        fx.className = `shiki-fx-aoe ${elemClass}`;
        area.appendChild(fx);
        setTimeout(() => fx.remove(), 800);
    },

    // ヒールエフェクト
    showShikigamiHealEffect() {
        const area = document.getElementById('enemy-area');
        if (!area) return;
        const fx = document.createElement('div');
        fx.className = 'shiki-fx-heal';
        area.appendChild(fx);
        setTimeout(() => fx.remove(), 900);
    },

    // デバフエフェクト（個別敵に紫エフェクト）
    showShikigamiDebuffEffect(target) {
        const area = document.getElementById('enemy-area');
        if (!area) return;
        const posX = getPositionX(target.position);
        const fx = document.createElement('div');
        fx.className = 'shikigami-attack-fx shiki-fx-debuff';
        fx.style.left = `${posX}%`;
        fx.style.top = '55%';
        fx.style.transform = 'translate(-50%, -50%)';
        area.appendChild(fx);
        setTimeout(() => fx.remove(), 600);
    },

    // 式神パネルスロット発動フラッシュ
    flashShikigamiSlot(partyIndex, element) {
        if (partyIndex < 0) return;
        const slot = document.querySelector(`#shikigami-party .shikigami-slot:nth-child(${partyIndex + 2})`);
        if (!slot) return;
        slot.classList.remove('skill-active', 'skill-active-fire', 'skill-active-water',
            'skill-active-thunder', 'skill-active-earth', 'skill-active-wood');
        void slot.offsetWidth;
        slot.classList.add('skill-active');
        if (element) slot.classList.add(`skill-active-${element}`);
        setTimeout(() => {
            slot.classList.remove('skill-active', 'skill-active-fire', 'skill-active-water',
                'skill-active-thunder', 'skill-active-earth', 'skill-active-wood');
        }, 600);
    },

};
