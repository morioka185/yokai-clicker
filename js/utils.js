/* ==========================================
   ユーティリティ関数
   ========================================== */

// 乱数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
        r -= weight;
        if (r <= 0) return key;
    }
    return Object.keys(weights)[0];
}

// 数値フォーマット
function formatNumber(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + '兆';
    if (n >= 1e8) return (n / 1e8).toFixed(1) + '億';
    if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
    return Math.floor(n).toLocaleString();
}

function formatPercent(n) {
    return n.toFixed(1) + '%';
}

// 属性相性
const ELEMENT_ADVANTAGE = {
    fire: 'wood',
    wood: 'earth',
    earth: 'thunder',
    thunder: 'water',
    water: 'fire'
};

function getElementMultiplier(attackElement, defenseElement) {
    if (!attackElement || !defenseElement) return 1.0;
    if (ELEMENT_ADVANTAGE[attackElement] === defenseElement) return 1.5;
    if (ELEMENT_ADVANTAGE[defenseElement] === attackElement) return 0.7;
    return 1.0;
}

function getElementName(element) {
    const names = { fire: '火', water: '水', thunder: '雷', earth: '土', wood: '木' };
    return names[element] || '無';
}

function getElementClass(element) {
    return element ? `element-${element}` : '';
}

// レアリティ関連
function getRarityName(rarityId) {
    return RARITY[rarityId] ? RARITY[rarityId].name : rarityId;
}

function getRarityColor(rarityId) {
    return RARITY[rarityId] ? RARITY[rarityId].color : '#9e9e9e';
}

// UID生成
let _uidCounter = 0;
function generateUID() {
    return Date.now().toString(36) + '_' + (++_uidCounter).toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

// タップゾーン判定（0=左, 1=中央, 2=右）
function getTapZone(e) {
    const area = document.getElementById('enemy-area');
    if (!area) return 1;
    const rect = area.getBoundingClientRect();
    let clientX;
    if (e && e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
    } else if (e && e.changedTouches && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX;
    } else if (e && typeof e.clientX === 'number' && e.clientX !== 0) {
        clientX = e.clientX;
    } else {
        return 1; // キーボード等はデフォルト中央
    }
    const relX = (clientX - rect.left) / rect.width;
    if (relX < 0.333) return 0;
    if (relX < 0.666) return 1;
    return 2;
}

// 通知表示
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notif.remove(), 300);
    }, duration);
}

// ダメージ数字表示（xはポジション%: 20=左, 50=中央, 80=右）
// type: 'normal' | 'crit' | 'heal' | 'shikigami'
// opts: { element: 'fire'|'water'|... , effectiveness: 1.5|0.7|1.0 }
function showDamageNumber(amount, x, y, type = 'normal', opts = {}) {
    if (!GameState.settings.damageNumbers) return;

    const container = document.getElementById('damage-numbers');
    const elem = document.createElement('div');

    // 基本クラス
    let cls = 'damage-number';
    if (type === 'crit') cls += ' crit';
    if (type === 'heal') cls += ' heal';
    if (type === 'shikigami') cls += ' shikigami-dmg';

    // 属性ダメージクラス
    if (opts.element) {
        cls += ` element-${opts.element}-dmg`;
    }
    elem.className = cls;

    if (type === 'heal') {
        elem.textContent = '+' + formatNumber(amount);
    } else {
        elem.textContent = formatNumber(amount);
    }

    const offsetX = randomInt(-30, 30);
    const offsetY = randomInt(-20, 20);
    elem.style.left = `calc(${x}% + ${offsetX}px)`;
    elem.style.top = `calc(50% + ${offsetY}px)`;

    container.appendChild(elem);
    setTimeout(() => elem.remove(), 1000);

    // 属性相性テキスト表示
    if (opts.effectiveness && opts.effectiveness !== 1.0) {
        showEffectivenessText(x, opts.effectiveness);
    }
}

// 属性相性フローティングテキスト
function showEffectivenessText(x, multiplier) {
    const container = document.getElementById('damage-numbers');
    const elem = document.createElement('div');

    if (multiplier > 1) {
        elem.className = 'effectiveness-text effective';
        elem.textContent = '効果抜群！';
    } else {
        elem.className = 'effectiveness-text not-effective';
        elem.textContent = 'いまひとつ…';
    }

    elem.style.left = `calc(${x}% + ${randomInt(-15, 15)}px)`;
    elem.style.top = `calc(35% + ${randomInt(-10, 10)}px)`;

    container.appendChild(elem);
    setTimeout(() => elem.remove(), 1200);
}

// 敵ポジションからダメージ表示X%を取得
function getPositionX(position) {
    const aliveCount = GameState.dungeon.currentEnemies.filter(e => e && e.hp > 0).length;
    if (aliveCount <= 1) return 50;
    const posMap = { 0: 20, 1: 50, 2: 80 };
    return posMap[position] || 50;
}

// 画面振動
function screenShake() {
    if (!GameState.settings.shakeScreen) return;
    const el = document.getElementById('enemy-area');
    el.classList.add('screen-shake');
    setTimeout(() => el.classList.remove('screen-shake'), 300);
}

// 画面遷移
function switchScreen(screenId) {
    SoundManager.uiNavigate();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId + '-screen');
    if (target) {
        target.classList.add('active');
        GameState.screen = screenId;
    }
}

// モーダル開閉
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 戦闘ログ追加
function addBattleLog(message, type = 'system') {
    GameState.battleLog.unshift({ message, type, time: Date.now() });
    if (GameState.battleLog.length > 100) GameState.battleLog.pop();
    updateBattleLogUI();
}

function updateBattleLogUI() {
    const logPane = document.getElementById('tab-log');
    if (!logPane) return;
    logPane.innerHTML = GameState.battleLog.slice(0, 50).map(entry =>
        `<div class="log-entry ${entry.type}">${entry.message}</div>`
    ).join('');
}

// 星表示
function starsDisplay(count) {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
}
