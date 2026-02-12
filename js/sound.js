/* ==========================================
   サウンドエフェクト（Web Audio API）
   ========================================== */

const SoundManager = {
    ctx: null,
    masterVolume: 0.3,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return !!this.ctx;
    },

    isEnabled() {
        return GameState.settings.soundEnabled && this.ensureContext();
    },

    // --- 基本音生成ヘルパー ---
    playTone(freq, duration, type, volume, rampDown) {
        if (!this.isEnabled()) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (rampDown !== false) {
            gain.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        } else {
            gain.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    playNoise(duration, volume) {
        if (!this.isEnabled()) return;
        const ctx = this.ctx;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
    },

    // --- SE一覧 ---

    // クリック攻撃
    hit() {
        this.playNoise(0.05, 0.4);
        this.playTone(300, 0.08, 'square', 0.2);
    },

    // クリティカルヒット
    crit() {
        this.playNoise(0.08, 0.5);
        this.playTone(500, 0.06, 'square', 0.3);
        this.playTone(700, 0.1, 'sawtooth', 0.2);
    },

    // 敵撃破
    enemyDefeat() {
        if (!this.isEnabled()) return;
        this.playTone(400, 0.1, 'square', 0.25);
        setTimeout(() => this.playTone(600, 0.1, 'square', 0.2), 80);
        setTimeout(() => this.playTone(800, 0.15, 'square', 0.15), 160);
    },

    // ボス出現
    bossAppear() {
        if (!this.isEnabled()) return;
        this.playTone(150, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.35), 200);
        setTimeout(() => this.playTone(80, 0.5, 'sawtooth', 0.3), 450);
    },

    // レベルアップ
    levelUp() {
        if (!this.isEnabled()) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.2), i * 100);
        });
    },

    // スキル発動
    skill() {
        if (!this.isEnabled()) return;
        this.playTone(600, 0.08, 'sine', 0.25);
        this.playTone(900, 0.12, 'sine', 0.2);
    },

    // 回復
    heal() {
        if (!this.isEnabled()) return;
        this.playTone(523, 0.12, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.12, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.15), 200);
    },

    // 被ダメージ
    playerHit() {
        this.playNoise(0.06, 0.3);
        this.playTone(200, 0.1, 'sawtooth', 0.2);
    },

    // 死亡
    playerDeath() {
        if (!this.isEnabled()) return;
        const notes = [400, 350, 300, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sawtooth', 0.25), i * 150);
        });
    },

    // ガチャ演出
    gachaPull() {
        if (!this.isEnabled()) return;
        this.playTone(300, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.2), 100);
        setTimeout(() => this.playTone(500, 0.1, 'square', 0.2), 200);
        setTimeout(() => this.playTone(800, 0.2, 'triangle', 0.25), 350);
    },

    // ガチャ高レア
    gachaRare() {
        if (!this.isEnabled()) return;
        const notes = [523, 659, 784, 1047, 1318];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.2), i * 80);
        });
    },

    // UI選択・ボタン
    uiClick() {
        this.playTone(800, 0.04, 'sine', 0.15);
    },

    // 画面遷移
    uiNavigate() {
        this.playTone(600, 0.05, 'sine', 0.12);
        this.playTone(900, 0.06, 'sine', 0.1);
    },

    // アイテム入手
    itemGet() {
        if (!this.isEnabled()) return;
        this.playTone(700, 0.08, 'square', 0.15);
        setTimeout(() => this.playTone(900, 0.1, 'square', 0.15), 80);
    },

    // 次の階
    nextFloor() {
        if (!this.isEnabled()) return;
        this.playTone(400, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'triangle', 0.2), 100);
        setTimeout(() => this.playTone(600, 0.15, 'triangle', 0.2), 200);
    }
};

// 最初のユーザー操作でAudioContextを起動
document.addEventListener('click', () => SoundManager.ensureContext(), { once: true });
document.addEventListener('touchstart', () => SoundManager.ensureContext(), { once: true });
