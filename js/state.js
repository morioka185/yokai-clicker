/* ==========================================
   ゲーム状態管理
   ========================================== */

const GameState = {
    // メタ情報
    version: '1.0.0',
    screen: 'title',

    // プレイヤー永続データ（里に持ち帰る）
    player: {
        name: '退魔師',
        gold: 500,
        spiritStones: 50,
        satoriPoints: 0,       // 悟りポイント（転生通貨）
        totalClears: 0,
        totalDefeats: 0,
        highestFloor: {},       // { dungeonId: floor }
        clearedDungeons: {},    // { dungeonId: true }
        firstClearBonuses: {},  // { bossId: true }

        // 永続ステータスボーナス（悟りポイントで購入）
        satoriBonuses: {
            atk: 0,
            def: 0,
            hp: 0,
            critRate: 0,
            goldBonus: 0,
            expBonus: 0,
            dropRate: 0
        }
    },

    // インベントリ（永続）
    inventory: {
        equipment: [],     // 装備アイテム配列
        materials: {},     // { materialId: count }
        maxEquipSlots: 50
    },

    // 装備中（永続）
    equipped: {
        weapon: null,
        head: null,
        body: null,
        hands: null,
        feet: null,
        charm: null
    },

    // 式神コレクション（永続）
    shikigami: {
        owned: {},          // { shikigamiId: { level, exp, affection } }
        party: [null, null, null]  // 編成中の式神ID（最大3体）
    },

    // ガチャカウンター
    gachaPity: {
        spirit: 0,
        gold: 0
    },

    // ダンジョン内一時データ
    dungeon: {
        active: false,
        currentDungeon: null,
        currentFloor: 1,
        playerLevel: 1,
        playerExp: 0,
        playerHP: 100,
        playerMaxHP: 100,
        playerMP: 50,
        playerMaxMP: 50,
        playerATK: 10,
        playerDEF: 5,
        playerCritRate: 5,
        playerCritDmg: 150,

        // ダンジョン内で得たスキル
        acquiredSkills: {},  // { skillId: stackCount }

        // ダンジョン内で得たアイテム
        lootedEquipment: [],
        lootedMaterials: {},
        lootedGold: 0,
        lootedSpiritStones: 0,

        // 戦闘状態
        currentEnemies: [],
        enemyAttackTimers: {},
        killCount: 0,
        killsRequired: 5,
        floorCleared: false,

        // 自動攻撃
        autoAttack: false,
        autoAttackTimer: null,

        // 武器UI状態
        weaponState: {},

        // バフ・デバフ
        buffs: [],
        enemyDebuffs: [],

        // 式神スキルタイマー
        shikigamiTimers: [],

        // 復活フラグ
        reviveUsed: false,

        // 未選択のレベルアップ回数
        pendingLevelUps: 0
    },

    // 闘技場
    arena: {
        rank: 1000,
        wins: 0,
        losses: 0,
        medals: 0
    },

    // 図鑑
    encyclopedia: {
        discoveredEnemies: {},
        achievements: {},
        craftCount: 0
    },

    // 設定
    settings: {
        soundEnabled: true,
        autoSave: true,
        damageNumbers: true,
        shakeScreen: true
    },

    // 戦闘ログ
    battleLog: []
};

// 状態のディープコピー
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}

// currentEnemy 互換ゲッター/セッター（既存コードとの互換性維持）
Object.defineProperty(GameState.dungeon, 'currentEnemy', {
    get() {
        return this.currentEnemies.find(e => e && e.hp > 0) || null;
    },
    set(val) {
        if (val === null) {
            this.currentEnemies = [];
        } else {
            this.currentEnemies = [val];
        }
    },
    configurable: true,
    enumerable: false
});

// ダンジョン用のプレイヤーステータスを計算
function calculatePlayerStats() {
    const d = GameState.dungeon;
    const p = GameState.player;
    const eq = GameState.equipped;

    // 基礎ステータス（レベルベース）
    let baseATK = 10 + (d.playerLevel - 1) * 3;
    let baseDEF = 5 + (d.playerLevel - 1) * 2;
    let baseHP  = 100 + (d.playerLevel - 1) * 20;
    let baseMP  = 50 + (d.playerLevel - 1) * 5;

    // 悟りボーナス
    baseATK += p.satoriBonuses.atk;
    baseDEF += p.satoriBonuses.def;
    baseHP  += p.satoriBonuses.hp;

    let stats = {
        atk: baseATK,
        def: baseDEF,
        maxHP: baseHP,
        maxMP: baseMP,
        critRate: 5 + p.satoriBonuses.critRate,
        critDmg: 150,
        clickDmgPercent: 0,
        multiHitChance: 0,
        atkSpeed: 0,
        lifeSteal: 0,
        goldBonus: p.satoriBonuses.goldBonus,
        expBonus: p.satoriBonuses.expBonus,
        dropRate: p.satoriBonuses.dropRate,
        hpRegen: 0,
        dmgReduction: 0,
        enemyAtkSlow: 0,
        shikigamiDpsPercent: 0,
        elemDmg: { fire: 0, water: 0, thunder: 0, earth: 0, wood: 0 },
        elemResist: { fire: 0, water: 0, thunder: 0, earth: 0, wood: 0 },
        weaponType: 'fist',
        weaponElement: null,
        addElements: [],
        aoeAttack: false,
        aoeDmgPercent: 0,
        lowHpAtkBonus: 0,
        deathExplosion: false,
        explosionPercent: 0,
        revive: false,
        reviveHpPercent: 0,
        bossDmgPercent: 0,
        fixedEffects: [],
        hpPercent: 0,
        atkPercent: 0,
        defPercent: 0
    };

    // 装備ステータス加算
    for (const slotId in eq) {
        const item = eq[slotId];
        if (!item) continue;

        if (item.atk) stats.atk += item.atk;
        if (item.def) stats.def += item.def;
        if (item.hp) stats.maxHP += item.hp;
        if (item.element && slotId === 'weapon') stats.weaponElement = item.element;
        if (item.weaponType) stats.weaponType = item.weaponType;

        // エンチャント効果
        if (item.enchants) {
            for (const ench of item.enchants) {
                applyEnchantToStats(stats, ench);
            }
        }

        // 固定効果
        if (item.fixedEffect) {
            stats.fixedEffects.push(item.fixedEffect);
        }
    }

    // スキル効果加算
    for (const skillId in d.acquiredSkills) {
        const skill = LEVELUP_SKILLS[skillId];
        if (!skill) continue;
        const stacks = d.acquiredSkills[skillId];
        applySkillToStats(stats, skill, stacks);
    }

    // 式神パッシブ
    for (const shikiId of GameState.shikigami.party) {
        if (!shikiId) continue;
        const owned = GameState.shikigami.owned[shikiId];
        if (!owned) continue;
        const data = SHIKIGAMI_DATA[shikiId];
        if (data && data.passive) {
            applyShikigamiPassive(stats, data.passive);
        }
    }

    // パーセント系の適用
    stats.atk = Math.floor(stats.atk * (1 + stats.atkPercent / 100));
    stats.def = Math.floor(stats.def * (1 + stats.defPercent / 100));
    stats.maxHP = Math.floor(stats.maxHP * (1 + stats.hpPercent / 100));

    return stats;
}

function applyEnchantToStats(stats, ench) {
    const def = ENCHANT_POOL[ench.id];
    if (!def) return;
    switch (def.stat) {
        case 'atkPercent': stats.atkPercent += ench.value; break;
        case 'critRate': stats.critRate += ench.value; break;
        case 'clickDmgPercent': stats.clickDmgPercent += ench.value; break;
        case 'multiHitChance': stats.multiHitChance += ench.value; break;
        case 'critDmgPercent': stats.critDmg += ench.value; break;
        case 'fireDmg': stats.elemDmg.fire += ench.value; break;
        case 'waterDmg': stats.elemDmg.water += ench.value; break;
        case 'thunderDmg': stats.elemDmg.thunder += ench.value; break;
        case 'earthDmg': stats.elemDmg.earth += ench.value; break;
        case 'woodDmg': stats.elemDmg.wood += ench.value; break;
        case 'defPercent': stats.defPercent += ench.value; break;
        case 'hpPercent': stats.hpPercent += ench.value; break;
        case 'hpRegen': stats.hpRegen += ench.value; break;
        case 'elemResist':
            for (const e in stats.elemResist) stats.elemResist[e] += ench.value;
            break;
        case 'lifeSteal': stats.lifeSteal += ench.value; break;
        case 'goldBonus': stats.goldBonus += ench.value; break;
        case 'dropRate': stats.dropRate += ench.value; break;
        case 'atkSpeed': stats.atkSpeed += ench.value; break;
        case 'expBonus': stats.expBonus += ench.value; break;
    }
}

function applySkillToStats(stats, skill, stacks) {
    const e = skill.effect;
    for (let i = 0; i < stacks; i++) {
        if (e.clickDmgPercent) stats.clickDmgPercent += e.clickDmgPercent;
        if (e.multiHitChance) stats.multiHitChance += e.multiHitChance;
        if (e.critRate) stats.critRate += e.critRate;
        if (e.critDmgPercent) stats.critDmg += e.critDmgPercent;
        if (e.defPercent) stats.defPercent += e.defPercent;
        if (e.dmgReduction) stats.dmgReduction += e.dmgReduction;
        if (e.atkSpeed) stats.atkSpeed += e.atkSpeed;
        if (e.lowHpAtkBonus) stats.lowHpAtkBonus += e.lowHpAtkBonus;
        if (e.hpPercent) stats.hpPercent += e.hpPercent;
        if (e.hpRegen) stats.hpRegen += e.hpRegen;
        if (e.lifeSteal) stats.lifeSteal += e.lifeSteal;
        if (e.dropRate) stats.dropRate += e.dropRate;
        if (e.goldBonus) stats.goldBonus += e.goldBonus;
        if (e.expBonus) stats.expBonus += e.expBonus;
        if (e.shikigamiDpsPercent) stats.shikigamiDpsPercent += e.shikigamiDpsPercent;
        if (e.enemyAtkSlow) stats.enemyAtkSlow += e.enemyAtkSlow;
        if (e.addElement && !stats.addElements.includes(e.addElement)) {
            stats.addElements.push(e.addElement);
        }
        if (e.elemDmgFlat && e.addElement) {
            stats.elemDmg[e.addElement] = (stats.elemDmg[e.addElement] || 0) + e.elemDmgFlat;
        }
    }
    // Non-stackable effects (applied once)
    if (e.aoeAttack) { stats.aoeAttack = true; stats.aoeDmgPercent = e.aoeDmgPercent || 50; }
    if (e.deathExplosion) { stats.deathExplosion = true; stats.explosionPercent = e.explosionPercent || 30; }
    if (e.revive) { stats.revive = true; stats.reviveHpPercent = e.reviveHpPercent || 50; }
}

function applyShikigamiPassive(stats, passive) {
    if (passive.hpRegen) stats.hpRegen += passive.hpRegen;
    if (passive.fireDmgPercent) stats.elemDmg.fire += passive.fireDmgPercent;
    if (passive.waterResist) stats.elemResist.water += passive.waterResist;
    if (passive.goldBonus) stats.goldBonus += passive.goldBonus;
    if (passive.atkPercent) stats.atkPercent += passive.atkPercent;
    if (passive.atkSpeed) stats.atkSpeed += passive.atkSpeed;
    if (passive.critRate) stats.critRate += passive.critRate;
    if (passive.clickDmgPercent) stats.clickDmgPercent += passive.clickDmgPercent;
    if (passive.hpPercent) stats.hpPercent += passive.hpPercent;
    if (passive.expBonus) stats.expBonus += passive.expBonus;
    if (passive.bossDmgPercent) stats.bossDmgPercent += passive.bossDmgPercent;
    if (passive.allStats) {
        stats.atkPercent += passive.allStats;
        stats.defPercent += passive.allStats;
        stats.hpPercent += passive.allStats;
    }
}
