/* ==========================================
   武器種別クリックシステム
   ========================================== */

const Weapons = {
    state: {},
    _lastEffectTiming: null, // 槍・大槌のタイミング情報を保持

    init(weaponType) {
        this.state = {};
        const ui = document.getElementById('weapon-ui');
        ui.innerHTML = '';

        switch (weaponType) {
            case 'katana': this.initKatana(ui); break;
            case 'bow': this.initBow(ui); break;
            case 'spear': this.initSpear(ui); break;
            case 'fist': this.initFist(ui); break;
            case 'staff': this.initStaff(ui); break;
            case 'hammer': this.initHammer(ui); break;
            default: this.initFist(ui); break;
        }
    },

    update(dt) {
        const stats = calculatePlayerStats();
        switch (stats.weaponType) {
            case 'bow': this.updateBow(dt); break;
            case 'spear': this.updateSpear(dt); break;
            case 'fist': this.updateFist(dt); break;
            case 'hammer': this.updateHammer(dt); break;
        }
    },

    handleClick(e) {
        const stats = calculatePlayerStats();
        switch (stats.weaponType) {
            case 'katana': this.clickKatana(e); break;
            case 'bow': this.clickBow(e); break;
            case 'spear': this.clickSpear(e); break;
            case 'fist': this.clickFist(e); break;
            case 'staff': break; // Staff uses pattern nodes
            case 'hammer': this.clickHammer(e); break;
            default: Combat.performClick(1.0); break;
        }
    },

    handleMouseDown(e) {
        this._lastEvent = e;
        const stats = calculatePlayerStats();
        if (stats.weaponType === 'bow') this.startChargeBow();
    },

    handleMouseUp(e) {
        const stats = calculatePlayerStats();
        if (stats.weaponType === 'bow') this.releaseBow(e);
    },

    // === ゾーンベースターゲット選択ヘルパー ===
    _getZoneTarget(e) {
        const zone = getTapZone(e);
        const target = Combat.getEnemyInZone(zone);
        // ゾーンに敵がいなければ最寄りの生存敵
        if (target) return { target, zone };
        const alive = Combat.getAliveEnemies();
        return { target: alive.length > 0 ? alive[0] : null, zone };
    },

    // ===== 刀 (Katana) - コンボ型 =====
    initKatana(ui) {
        this.state = { comboCount: 0, lastClickTime: 0, comboTimer: null };
        ui.innerHTML = `
            <div class="weapon-ui-inner katana-theme">
                <div class="weapon-header">
                    <span class="weapon-type-badge katana-badge">⚔️ 刀</span>
                    <span class="weapon-mechanic">連斬モード</span>
                </div>
                <div class="weapon-main-display">
                    <div class="combo-display">
                        <span class="combo-count" id="katana-combo">0</span>
                        <span class="combo-label">HIT</span>
                    </div>
                    <div class="weapon-tip">
                        <div class="weapon-tip-text">連続タップでコンボ！</div>
                        <div class="weapon-tip-detail">3の倍数で <span style="color:var(--accent-gold)">強斬撃</span> / 10+で倍率UP</div>
                    </div>
                </div>
            </div>
        `;
    },

    clickKatana(e) {
        const now = Date.now();
        const s = this.state;

        if (now - s.lastClickTime > 1000) {
            s.comboCount = 0;
        }
        s.lastClickTime = now;
        s.comboCount++;

        let multiplier = 1.0;
        const isComboHit = s.comboCount % 3 === 0;
        if (isComboHit) {
            multiplier = 1.5;
            addBattleLog(`コンボ${s.comboCount}！ 強斬撃！`, 'damage');
        }
        if (s.comboCount >= 10) {
            multiplier *= 1 + (s.comboCount - 10) * 0.05;
        }

        // ゾーンターゲット選択
        const { target, zone } = this._getZoneTarget(e);
        if (!target) return;

        // 3コンボ達成 → 全敵に斬撃
        if (isComboHit) {
            const allAlive = Combat.getAliveEnemies();
            Combat.performClick(multiplier, allAlive, 0.8);
        } else {
            Combat.performClick(multiplier, [target]);
        }

        const comboEl = document.getElementById('katana-combo');
        if (comboEl) comboEl.textContent = s.comboCount;

        clearTimeout(s.comboTimer);
        s.comboTimer = setTimeout(() => {
            s.comboCount = 0;
            if (comboEl) comboEl.textContent = '0';
        }, 1500);
    },

    // ===== 弓 (Bow) - チャージ型 =====
    initBow(ui) {
        this.state = { charging: false, chargeStart: 0, chargeLevel: 0, justReleased: false };
        ui.innerHTML = `
            <div class="weapon-ui-inner bow-theme">
                <div class="weapon-header">
                    <span class="weapon-type-badge bow-badge">🏹 弓</span>
                    <span class="weapon-mechanic">チャージモード</span>
                </div>
                <div class="weapon-main-display">
                    <div class="charge-bar-container">
                        <div class="charge-bar-outer">
                            <div class="charge-bar-fill" id="bow-charge-bar"></div>
                            <div class="charge-level-markers">
                                <span class="charge-marker" style="left:7%">速射</span>
                                <span class="charge-marker" style="left:27%">射撃</span>
                                <span class="charge-marker accent" style="left:60%">貫通</span>
                                <span class="charge-marker gold" style="left:90%">破魔</span>
                            </div>
                        </div>
                        <div class="charge-bar-label" id="bow-charge-label">長押し → チャージ → 離して発射！</div>
                    </div>
                </div>
            </div>
        `;
    },

    startChargeBow() {
        this.state.charging = true;
        this.state.chargeStart = Date.now();
    },

    releaseBow(e) {
        if (!this.state.charging) return;
        this.state.charging = false;
        this.state.justReleased = true;

        const chargeTime = (Date.now() - this.state.chargeStart) / 1000;
        let multiplier;
        let label;
        let isPiercing = false;

        if (chargeTime < 0.2) {
            multiplier = 0.5;
            label = '速射';
        } else if (chargeTime < 0.8) {
            multiplier = 1.0;
            label = '射撃';
        } else if (chargeTime < 2.0) {
            multiplier = 3.0;
            label = '貫通矢！';
            isPiercing = true;
        } else {
            multiplier = 5.0;
            label = '破魔の矢！！';
            isPiercing = true;
            screenShake();
        }

        // エフェクト
        const releaseEvent = e || this._lastEvent;
        this.showBowReleaseEffect(releaseEvent, chargeTime);

        // ゾーンターゲット選択
        const { target } = this._getZoneTarget(releaseEvent);
        if (!target) return;

        // 貫通矢/破魔の矢 → 全敵貫通
        if (isPiercing) {
            const allAlive = Combat.getAliveEnemies();
            Combat.performClick(multiplier, allAlive, 0.8);
        } else {
            Combat.performClick(multiplier, [target]);
        }
        addBattleLog(`${label} (×${multiplier})`, 'damage');

        const bar = document.getElementById('bow-charge-bar');
        if (bar) bar.style.width = '0%';
        const labelEl = document.getElementById('bow-charge-label');
        if (labelEl) labelEl.textContent = label;
    },

    clickBow(e) {
        // チャージ解放直後の二重発動を防止
        if (this.state.justReleased) {
            this.state.justReleased = false;
            return;
        }
        // タップ = 速射（チャージ中でなければ）
        if (!this.state.charging) {
            const { target } = this._getZoneTarget(e);
            if (target) {
                Combat.performClick(0.5, [target]);
            }
        }
    },

    updateBow(dt) {
        if (!this.state.charging) return;
        const chargeTime = (Date.now() - this.state.chargeStart) / 1000;
        const percent = Math.min(100, (chargeTime / 3) * 100);
        const bar = document.getElementById('bow-charge-bar');
        if (bar) {
            bar.style.width = percent + '%';
            if (chargeTime >= 2.0) bar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
            else if (chargeTime >= 0.8) bar.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
            else bar.style.background = 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))';
        }
        const label = document.getElementById('bow-charge-label');
        if (label) {
            if (chargeTime >= 2.0) label.textContent = '⚡ フルチャージ！離せ！';
            else if (chargeTime >= 0.8) label.textContent = '🏹 貫通チャージ中...';
            else label.textContent = 'チャージ中...';
        }
    },

    // ===== 槍 (Spear) - リズム型 =====
    initSpear(ui) {
        this.state = { cursorPos: 0, direction: 1, speed: 2.0, perfectCount: 0 };
        ui.innerHTML = `
            <div class="weapon-ui-inner spear-theme">
                <div class="weapon-header">
                    <span class="weapon-type-badge spear-badge">🔱 槍</span>
                    <span class="weapon-mechanic">タイミングモード</span>
                </div>
                <div class="weapon-main-display">
                    <div class="rhythm-gauge-container">
                        <div class="rhythm-track">
                            <div class="rhythm-target">
                                <span class="rhythm-target-label">HERE!</span>
                            </div>
                            <div class="rhythm-cursor" id="spear-cursor"></div>
                        </div>
                        <div class="spear-info-row">
                            <span class="weapon-tip-text">中央でタップ！</span>
                            <span id="spear-combo" class="spear-combo-text">Perfect: 0</span>
                            <span id="spear-timing" class="spear-timing-text"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    clickSpear(e) {
        const s = this.state;
        const pos = s.cursorPos; // 0-100

        const diff = Math.abs(pos - 50);
        let multiplier;
        let timing;
        let isPerfect = false;

        if (diff <= 5) {
            multiplier = 2.0;
            timing = 'Perfect!';
            s.perfectCount++;
            isPerfect = true;
        } else if (diff <= 12) {
            multiplier = 1.5;
            timing = 'Great!';
            s.perfectCount = Math.max(0, s.perfectCount - 1);
        } else if (diff <= 22) {
            multiplier = 1.0;
            timing = 'Good';
            s.perfectCount = 0;
        } else {
            multiplier = 0.3;
            timing = 'Miss...';
            s.perfectCount = 0;
        }

        if (s.perfectCount >= 5) multiplier *= 3.0;
        else if (s.perfectCount >= 3) multiplier *= 2.0;
        else if (s.perfectCount >= 2) multiplier *= 1.5;

        // ゾーンターゲット選択
        const { target } = this._getZoneTarget(e);
        if (!target) return;

        // Perfect判定 → 全敵貫通
        if (isPerfect) {
            const allAlive = Combat.getAliveEnemies();
            Combat.performClick(multiplier, allAlive, 0.8);
        } else {
            Combat.performClick(multiplier, [target]);
        }

        const timingEl = document.getElementById('spear-timing');
        if (timingEl) {
            timingEl.textContent = timing;
            timingEl.style.color = diff <= 5 ? 'var(--accent-gold)' :
                                   diff <= 12 ? 'var(--accent-green)' :
                                   diff <= 22 ? 'var(--text-secondary)' : 'var(--accent-red)';
        }
        const comboEl = document.getElementById('spear-combo');
        if (comboEl) comboEl.textContent = `コンボ: ${s.perfectCount}`;
    },

    updateSpear(dt) {
        const s = this.state;
        s.cursorPos += s.direction * s.speed * dt * 60;
        if (s.cursorPos >= 100) { s.cursorPos = 100; s.direction = -1; }
        if (s.cursorPos <= 0) { s.cursorPos = 0; s.direction = 1; }

        const cursor = document.getElementById('spear-cursor');
        if (cursor) cursor.style.left = s.cursorPos + '%';
    },

    // ===== 拳 (Fist) - 連打型 =====
    initFist(ui) {
        this.state = { clicks: [], clicksPerSecond: 0, rank: '通常' };
        ui.innerHTML = `
            <div class="weapon-ui-inner fist-theme">
                <div class="weapon-header">
                    <span class="weapon-type-badge fist-badge">👊 拳</span>
                    <span class="weapon-mechanic">連打モード</span>
                </div>
                <div class="weapon-main-display">
                    <div class="fist-display">
                        <div class="fist-cps-area">
                            <span class="combo-count" id="fist-cps">0</span>
                            <span class="combo-label">打/秒</span>
                        </div>
                        <span class="combo-rank" id="fist-rank">通常</span>
                    </div>
                    <div class="fist-tiers">
                        <span class="fist-tier">4+:疾風</span>
                        <span class="fist-tier">8+:練気</span>
                        <span class="fist-tier">13+:無双</span>
                    </div>
                    <div class="weapon-tip-text">とにかく高速連打！速いほど強い</div>
                </div>
            </div>
        `;
    },

    clickFist(e) {
        const s = this.state;
        const now = Date.now();
        s.clicks.push(now);

        s.clicks = s.clicks.filter(t => now - t < 2000);
        const cps = s.clicks.length / 2;

        let multiplier;
        let rank;
        let rankColor;
        let isRenki = false;
        let isMusou = false;

        if (cps >= 13) {
            multiplier = 4.0; rank = '無双'; rankColor = '#ff1744';
            isMusou = true;
        } else if (cps >= 8) {
            multiplier = 2.5; rank = '練気'; rankColor = '#ff9800';
            isRenki = true;
        } else if (cps >= 4) {
            multiplier = 1.5; rank = '疾風'; rankColor = '#4caf50';
        } else {
            multiplier = 0.6; rank = '通常'; rankColor = '#9e9e9e';
        }

        // ゾーンターゲット選択
        const { target, zone } = this._getZoneTarget(e);
        if (!target) return;

        // 無双 → 全敵攻撃、練気 → タップゾーン+隣接スプラッシュ
        if (isMusou) {
            const allAlive = Combat.getAliveEnemies();
            Combat.performClick(multiplier * 0.4, allAlive, 0.7);
        } else if (isRenki) {
            const targets = [target];
            const adj = Combat.getAdjacentEnemies(zone);
            for (const a of adj) {
                if (!targets.includes(a)) targets.push(a);
            }
            Combat.performClick(multiplier * 0.4, targets, 0.8);
        } else {
            Combat.performClick(multiplier * 0.4, [target]);
        }

        const cpsEl = document.getElementById('fist-cps');
        const rankEl = document.getElementById('fist-rank');
        if (cpsEl) cpsEl.textContent = cps.toFixed(1);
        if (rankEl) {
            rankEl.textContent = rank;
            rankEl.style.background = rankColor;
            rankEl.style.color = '#fff';
            rankEl.style.padding = '2px 10px';
            rankEl.style.borderRadius = '4px';
        }
    },

    updateFist(dt) {
        const s = this.state;
        const now = Date.now();
        s.clicks = s.clicks.filter(t => now - t < 2000);
        const cps = s.clicks.length / 2;
        const cpsEl = document.getElementById('fist-cps');
        if (cpsEl) cpsEl.textContent = cps.toFixed(1);

        if (cps < 1) {
            const rankEl = document.getElementById('fist-rank');
            if (rankEl) {
                rankEl.textContent = '通常';
                rankEl.style.background = '#9e9e9e';
            }
        }
    },

    // ===== 杖 (Staff) - パターン型 =====
    initStaff(ui) {
        this.generateNewPattern();
        this.renderStaffUI(ui);
    },

    generateNewPattern() {
        const nodeCount = randomInt(3, 5);
        const pattern = [];
        const available = [];
        for (let i = 0; i < nodeCount; i++) available.push(i);

        const patternLength = randomInt(3, nodeCount);
        for (let i = 0; i < patternLength; i++) {
            pattern.push(randomChoice(available));
        }

        this.state = {
            nodeCount,
            pattern,
            currentIndex: 0,
            completed: false
        };
    },

    renderStaffUI(ui) {
        const s = this.state;
        if (!ui) ui = document.getElementById('weapon-ui');

        let html = `<div class="weapon-ui-inner staff-theme">
            <div class="weapon-header">
                <span class="weapon-type-badge staff-badge">🪄 杖</span>
                <span class="weapon-mechanic">詠唱モード</span>
            </div>
            <div class="weapon-main-display">
                <div class="staff-layout">
                    <div class="magic-pattern">`;
        for (let i = 0; i < s.nodeCount; i++) {
            const isNext = !s.completed && s.pattern[s.currentIndex] === i;
            html += `<div class="magic-node ${isNext ? 'next' : ''}" data-node="${i}" onclick="Weapons.clickStaffNode(${i})">${i + 1}</div>`;
        }
        html += `</div>
                    <div class="staff-info">
                        <div class="staff-sequence" id="staff-hint">詠唱順: `;
        html += s.pattern.map((n, idx) => {
            if (idx < s.currentIndex) return `<span class="seq-done">${n + 1}</span>`;
            if (idx === s.currentIndex) return `<span class="seq-current">${n + 1}</span>`;
            return `<span class="seq-pending">${n + 1}</span>`;
        }).join('<span class="seq-arrow">→</span>');
        html += `</div>
                        <div class="weapon-tip-text">光っている番号を順にタップ！</div>
                    </div>
                </div>
            </div>
        </div>`;

        ui.innerHTML = html;
    },

    clickStaffNode(nodeIndex) {
        const s = this.state;
        if (s.completed) return;

        if (s.pattern[s.currentIndex] === nodeIndex) {
            // 正解
            const node = document.querySelector(`.magic-node[data-node="${nodeIndex}"]`);
            if (node) {
                node.classList.add('correct');
                node.classList.remove('next');
                const container = document.getElementById('enemy-area');
                if (container) {
                    const nRect = node.getBoundingClientRect();
                    const cRect = container.getBoundingClientRect();
                    const coords = {
                        container,
                        x: nRect.left + nRect.width / 2 - cRect.left,
                        y: nRect.top + nRect.height / 2 - cRect.top
                    };
                    this._effectStaff(coords, false);
                }
            }
            s.currentIndex++;

            if (s.currentIndex >= s.pattern.length) {
                // パターン完成！→ 全敵AoE
                s.completed = true;
                const multiplier = 2.0 + s.pattern.length * 0.5;
                const allAlive = Combat.getAliveEnemies();
                Combat.performClick(multiplier, allAlive);
                addBattleLog(`陰陽術完成！ 全体攻撃！ (×${multiplier})`, 'damage');
                screenShake();
                this.showStaffCompleteEffect();

                setTimeout(() => {
                    this.generateNewPattern();
                    this.renderStaffUI();
                }, 800);
            } else {
                this.renderStaffUI();
            }
        } else {
            // 不正解 - ランダム1体に弱い攻撃
            const alive = Combat.getAliveEnemies();
            const target = alive.length > 0 ? randomChoice(alive) : null;
            if (target) {
                Combat.performClick(0.3, [target]);
            }
            addBattleLog('詠唱失敗...', 'system');
            s.currentIndex = 0;
            this.renderStaffUI();
        }
    },

    // ===== 大槌 (Hammer) - タイミング一撃型 =====
    initHammer(ui) {
        this.state = { gauge: 0, direction: 1, speed: 1.2 };
        ui.innerHTML = `
            <div class="weapon-ui-inner hammer-theme">
                <div class="weapon-header">
                    <span class="weapon-type-badge hammer-badge">🔨 大槌</span>
                    <span class="weapon-mechanic">一撃モード</span>
                </div>
                <div class="weapon-main-display">
                    <div class="charge-bar-container">
                        <div class="charge-bar-outer hammer-gauge-outer">
                            <div class="charge-bar-fill" id="hammer-gauge" style="background:linear-gradient(90deg, #ef4444, #ff9800)"></div>
                            <div class="hammer-perfect-zone">
                                <span class="hammer-zone-label">JUST!</span>
                            </div>
                        </div>
                        <div class="hammer-info-row">
                            <span class="weapon-tip-text">金色ゾーンでタップ → 大ダメージ！</span>
                            <span id="hammer-label" class="hammer-result-text"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    clickHammer(e) {
        const s = this.state;
        const gauge = s.gauge; // 0-100

        let multiplier;
        let label;
        let isJust = false;
        let isNear = false;

        if (gauge >= 88 && gauge <= 100) {
            multiplier = 8.0;
            label = 'ジャストタイミング！！';
            isJust = true;
            screenShake();
        } else if (gauge >= 75) {
            multiplier = 4.0;
            label = 'ニア！';
            isNear = true;
        } else {
            multiplier = 1.0;
            label = 'ミス';
        }

        // ゾーンターゲット選択
        const { target, zone } = this._getZoneTarget(e);
        if (!target) return;

        // Just→全敵、Near→ゾーン+隣接、Miss→ゾーンのみ
        if (isJust) {
            const allAlive = Combat.getAliveEnemies();
            Combat.performClick(multiplier, allAlive, 0.8);
        } else if (isNear) {
            const targets = [target];
            const adj = Combat.getAdjacentEnemies(zone);
            for (const a of adj) {
                if (!targets.includes(a)) targets.push(a);
            }
            Combat.performClick(multiplier, targets, 0.9);
        } else {
            Combat.performClick(multiplier, [target]);
        }
        addBattleLog(`大槌: ${label} (×${multiplier})`, 'damage');

        const labelEl = document.getElementById('hammer-label');
        if (labelEl) {
            labelEl.textContent = label;
            labelEl.style.color = multiplier >= 8 ? 'var(--accent-gold)' : multiplier >= 4 ? 'var(--accent-green)' : 'var(--text-muted)';
        }

        s.gauge = 0;
    },

    updateHammer(dt) {
        const s = this.state;
        s.gauge += s.direction * s.speed * dt * 50;

        if (s.gauge >= 100) {
            s.gauge = 100;
            s.direction = -1;
            // 自動発動（タイミング逃した場合）
            setTimeout(() => {
                if (s.gauge <= 0 && s.direction === -1) {
                    // 放置で自動発動 ×2.0
                }
            }, 500);
        }
        if (s.gauge <= 0) {
            s.gauge = 0;
            s.direction = 1;
        }

        const bar = document.getElementById('hammer-gauge');
        if (bar) bar.style.width = s.gauge + '%';
    },

    // ===== 武器エフェクトシステム =====

    // エフェクト座標を取得するヘルパー（複数敵対応）
    _getEffectCoords(e) {
        const container = document.getElementById('enemy-area');
        if (!container) return null;
        const rect = container.getBoundingClientRect();

        let clientX, clientY;
        if (e && e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e && typeof e.clientX === 'number' && e.clientX !== 0) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            // キーボード or 座標なし → タップゾーンの敵 or 先頭の生存敵を参照
            const zone = getTapZone(e);
            const visual = document.getElementById(`enemy-visual-${zone}`) ||
                           document.querySelector('.enemy-visual');
            if (visual) {
                const vRect = visual.getBoundingClientRect();
                clientX = vRect.left + vRect.width / 2 + randomInt(-20, 20);
                clientY = vRect.top + vRect.height / 2 + randomInt(-20, 20);
            } else {
                clientX = rect.left + rect.width / 2;
                clientY = rect.top + rect.height / 2;
            }
        }

        return {
            container,
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    },

    // DOM要素を作成して自動削除するヘルパー
    _fx(container, x, y, className, duration) {
        const el = document.createElement('div');
        el.className = 'wfx ' + className;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        container.appendChild(el);
        setTimeout(() => el.remove(), duration);
        return el;
    },

    // メインエフェクト呼び出し
    showEffect(e) {
        const coords = this._getEffectCoords(e);
        if (!coords) return;

        const stats = calculatePlayerStats();
        switch (stats.weaponType) {
            case 'katana': this._effectKatana(coords); break;
            case 'bow':    this._effectBow(coords); break;
            case 'spear':  this._effectSpear(coords); break;
            case 'fist':   this._effectFist(coords); break;
            case 'staff':  this._effectStaff(coords, false); break;
            case 'hammer': this._effectHammer(coords); break;
            default:       this._effectDefault(coords); break;
        }
    },

    // --- 刀エフェクト: 斬撃ライン ---
    _effectKatana(coords) {
        const { container, x, y } = coords;
        const s = this.state;
        const combo = s.comboCount || 0;
        const isComboHit = combo > 0 && combo % 3 === 0;

        // メインの斬撃ライン
        const angle1 = -45 + Math.random() * 90;
        let cls = 'wfx-katana-slash';
        if (combo >= 10) cls += ' combo-max';
        else if (isComboHit) cls += ' combo-strong';

        const slash1 = this._fx(container, x, y, cls, 350);
        slash1.style.setProperty('--angle', angle1 + 'deg');

        // コンボ3の倍数: クロス斬撃
        if (isComboHit) {
            const slash2 = this._fx(container, x, y, cls, 350);
            slash2.style.setProperty('--angle', (angle1 + 70 + Math.random() * 20) + 'deg');
        }

        // 高コンボ時: 火花パーティクル
        if (combo >= 5) {
            const sparkCount = Math.min(5, Math.floor(combo / 5) + 2);
            for (let i = 0; i < sparkCount; i++) {
                const spark = this._fx(container, x + randomInt(-15, 15), y + randomInt(-15, 15), 'wfx-katana-spark', 450);
                const ang = Math.random() * Math.PI * 2;
                const dist = 20 + Math.random() * 30;
                spark.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
                spark.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
            }
        }
    },

    // --- 弓エフェクト: 矢の着弾 ---
    _effectBow(coords, chargeLevel) {
        const { container, x, y } = coords;
        // chargeLevel: undefined=速射, 'normal'=射撃, 'charged'=貫通, 'full'=破魔の矢
        const level = chargeLevel || 'quick';

        // 矢のトレイル
        let trailCls = 'wfx-bow-trail';
        if (level === 'full') trailCls += ' full-charge';
        else if (level === 'charged') trailCls += ' charged';
        this._fx(container, x, y, trailCls, 350);

        // 着弾リング
        let ringCls = 'wfx-bow-ring';
        if (level === 'full') ringCls += ' full-charge';
        else if (level === 'charged') ringCls += ' charged';
        this._fx(container, x, y, ringCls, 400);

        // 貫通矢以上: 放射線
        if (level === 'charged' || level === 'full') {
            const rayCount = level === 'full' ? 8 : 5;
            for (let i = 0; i < rayCount; i++) {
                const ray = this._fx(container, x, y, 'wfx-bow-ray', 450);
                ray.style.setProperty('--ray-angle', (i * (360 / rayCount) + randomInt(-10, 10)) + 'deg');
            }
        }
    },

    // 弓リリースエフェクト（releaseBowから呼ぶ）
    showBowReleaseEffect(e, chargeTime) {
        let level = 'quick';
        if (chargeTime >= 2.0) level = 'full';
        else if (chargeTime >= 0.8) level = 'charged';
        else if (chargeTime >= 0.2) level = 'normal';

        const coords = this._getEffectCoords(e);
        if (!coords) {
            const container = document.getElementById('enemy-area');
            if (!container) return;
            const visual = document.querySelector('.enemy-visual');
            if (!visual) return;
            const rect = container.getBoundingClientRect();
            const vRect = visual.getBoundingClientRect();
            const fallback = {
                container,
                x: vRect.left + vRect.width / 2 - rect.left + randomInt(-15, 15),
                y: vRect.top + vRect.height / 2 - rect.top + randomInt(-10, 10)
            };
            this._effectBow(fallback, level);
            return;
        }

        this._effectBow(coords, level);
    },

    // --- 槍エフェクト: 突き ---
    _effectSpear(coords) {
        const { container, x, y } = coords;
        const s = this.state;
        const pos = s.cursorPos || 50;
        const diff = Math.abs(pos - 50);

        let timing;
        if (diff <= 5) timing = 'perfect';
        else if (diff <= 12) timing = 'great';
        else if (diff <= 22) timing = 'good';
        else timing = 'miss';

        // 突きライン
        this._fx(container, x, y, 'wfx-spear-thrust ' + timing, 400);

        // バースト（miss以外）
        if (timing !== 'miss') {
            this._fx(container, x, y - 10, 'wfx-spear-burst ' + timing, 350);
        }

        // Perfect時: 追加のリング
        if (timing === 'perfect') {
            this._fx(container, x, y, 'wfx-spear-perfect-ring', 550);

            // Perfectコンボ3以上: 追加の突きライン
            if (s.perfectCount >= 3) {
                setTimeout(() => {
                    this._fx(container, x + randomInt(-10, 10), y + randomInt(-5, 5), 'wfx-spear-thrust perfect', 400);
                }, 80);
            }
        }
    },

    // --- 拳エフェクト: 衝撃波 ---
    _effectFist(coords) {
        const { container, x, y } = coords;
        const s = this.state;
        const clicks = s.clicks || [];
        const now = Date.now();
        const recentClicks = clicks.filter(t => now - t < 2000);
        const cps = recentClicks.length / 2;

        let rank;
        if (cps >= 13) rank = 'rank-musou';
        else if (cps >= 8) rank = 'rank-renki';
        else if (cps >= 4) rank = 'rank-shippuu';
        else rank = 'rank-normal';

        // 中心フラッシュ
        this._fx(container, x, y, 'wfx-fist-flash', 250);

        // 衝撃波リング
        const ring = this._fx(container, x, y, 'wfx-fist-shockwave ' + rank, 400);
        const scale = rank === 'rank-musou' ? 2.5 : rank === 'rank-renki' ? 2.0 : rank === 'rank-shippuu' ? 1.6 : 1.2;
        ring.style.setProperty('--shock-scale', scale);

        // スピードライン
        const lineCount = rank === 'rank-musou' ? 8 : rank === 'rank-renki' ? 6 : rank === 'rank-shippuu' ? 5 : 3;
        const baseAngle = Math.random() * 360;
        for (let i = 0; i < lineCount; i++) {
            const angle = baseAngle + (i * (360 / lineCount)) + randomInt(-15, 15);
            const line = this._fx(container, x, y, 'wfx-fist-speed-line ' + rank, 350);
            line.style.setProperty('--line-angle', angle + 'deg');
        }
    },

    // --- 杖エフェクト: 魔法陣＋スパークル ---
    _effectStaff(coords, isComplete) {
        const { container, x, y } = coords;
        const completeCls = isComplete ? ' complete' : '';

        // 魔法陣
        this._fx(container, x, y, 'wfx-staff-circle' + completeCls, 550);

        // スパークルパーティクル
        const sparkleCount = isComplete ? 6 : 3;
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = this._fx(
                container,
                x + randomInt(-20, 20),
                y + randomInt(-20, 20),
                'wfx-staff-sparkle' + completeCls,
                550
            );
            const midX = randomInt(-15, 15);
            const midY = randomInt(-20, -5);
            sparkle.style.setProperty('--sx', midX + 'px');
            sparkle.style.setProperty('--sy', midY + 'px');
            sparkle.style.setProperty('--ex', (midX + randomInt(-10, 10)) + 'px');
            sparkle.style.setProperty('--ey', (midY - 15 - Math.random() * 20) + 'px');
        }

        // ルーン文字
        const runes = ['卍', '呪', '封', '霊', '陰', '陽', '火', '水', '雷', '風'];
        const rune = this._fx(container, x + randomInt(-10, 10), y + randomInt(-10, 10), 'wfx-staff-rune' + completeCls, 650);
        rune.textContent = randomChoice(runes);
    },

    // 杖パターン完成エフェクト（複数敵全体にエフェクト）
    showStaffCompleteEffect() {
        const container = document.getElementById('enemy-area');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        // 全生存敵にエフェクト
        const alive = Combat.getAliveEnemies();
        for (const enemy of alive) {
            const visual = document.getElementById(`enemy-visual-${enemy.position}`);
            if (!visual) continue;
            const vRect = visual.getBoundingClientRect();
            const coords = {
                container,
                x: vRect.left + vRect.width / 2 - rect.left,
                y: vRect.top + vRect.height / 2 - rect.top
            };
            this._effectStaff(coords, true);
        }
        // 生存敵が0なら中央にフォールバック
        if (alive.length === 0) {
            this._effectStaff({ container, x: rect.width / 2, y: rect.height / 2 }, true);
        }
    },

    // --- 大槌エフェクト: 叩きつけ ---
    _effectHammer(coords) {
        const { container, x, y } = coords;
        const s = this.state;
        const gauge = s.gauge || 0;

        let timing;
        if (gauge >= 88 && gauge <= 100) timing = 'just';
        else if (gauge >= 75) timing = 'near';
        else timing = 'miss';

        // メインリング
        const ring = this._fx(container, x, y, 'wfx-hammer-ring ' + timing, 550);
        const scale = timing === 'just' ? 2.8 : timing === 'near' ? 2.2 : 1.5;
        ring.style.setProperty('--ring-scale', scale);

        // クラックライン
        const crackCount = timing === 'just' ? 6 : timing === 'near' ? 4 : 2;
        const baseAngle = Math.random() * 360;
        for (let i = 0; i < crackCount; i++) {
            const angle = baseAngle + (i * (360 / crackCount)) + randomInt(-15, 15);
            const length = timing === 'just' ? randomInt(40, 65) : timing === 'near' ? randomInt(25, 45) : randomInt(15, 25);
            const crack = this._fx(container, x, y, 'wfx-hammer-crack' + (timing === 'just' ? ' just' : ''), 550);
            crack.style.setProperty('--crack-angle', angle + 'deg');
            crack.style.setProperty('--crack-length', length + 'px');
        }

        // 破片パーティクル（near以上）
        if (timing !== 'miss') {
            const debrisCount = timing === 'just' ? 8 : 4;
            for (let i = 0; i < debrisCount; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 50;
                const debris = this._fx(container, x, y, 'wfx-hammer-debris' + (timing === 'just' ? ' just' : ''), 500);
                debris.style.setProperty('--deb-x', Math.cos(ang) * dist + 'px');
                debris.style.setProperty('--deb-y', (Math.sin(ang) * dist - 20) + 'px');
            }
        }

        // 地面の衝撃波（near以上）
        if (timing !== 'miss') {
            this._fx(container, x, y + 20, 'wfx-hammer-ground' + (timing === 'just' ? ' just' : ''), 450);
        }
    },

    // --- デフォルトエフェクト（素手等） ---
    _effectDefault(coords) {
        const { container, x, y } = coords;
        const ripple = document.createElement('div');
        ripple.className = 'tap-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        container.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
    }
};
