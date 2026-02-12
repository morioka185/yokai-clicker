/* ==========================================
   式神データベース
   ========================================== */

const SHIKIGAMI_DATA = {
    // ★1 式神
    kodama: {
        id: 'kodama', name: '木霊', emoji: '🌱', stars: 1,
        element: 'wood',
        baseHP: 100, baseATK: 15, baseDEF: 10,
        skill: { name: '癒しの葉', desc: '退魔師のHP5%回復', interval: 15, type: 'heal', value: 5 },
        passive: { desc: 'HP回復量+5%', hpRegen: 0.5 },
        obtainMethod: 'drop'
    },
    hinotama_shiki: {
        id: 'hinotama_shiki', name: '火の玉', emoji: '🔥', stars: 1,
        element: 'fire',
        baseHP: 60, baseATK: 25, baseDEF: 5,
        skill: { name: '炎弾', desc: '敵単体に火属性ATK100%ダメージ', interval: 10, type: 'damage', multiplier: 1.0, element: 'fire' },
        passive: { desc: '火属性ダメージ+5%', fireDmgPercent: 5 },
        obtainMethod: 'drop'
    },
    // ★2 式神
    kappa_shiki: {
        id: 'kappa_shiki', name: '河童', emoji: '🥒', stars: 2,
        element: 'water',
        baseHP: 200, baseATK: 20, baseDEF: 20,
        skill: { name: '水鉄砲', desc: '敵単体に水属性ATK150%ダメージ', interval: 12, type: 'damage', multiplier: 1.5, element: 'water' },
        passive: { desc: '水属性耐性+10%', waterResist: 10 },
        obtainMethod: 'drop'
    },
    tanuki_shiki: {
        id: 'tanuki_shiki', name: '化け狸', emoji: '🦝', stars: 2,
        element: 'earth',
        baseHP: 180, baseATK: 18, baseDEF: 25,
        skill: { name: '化かし', desc: '敵のATK20%ダウン(10秒)', interval: 20, type: 'debuff', stat: 'atk', value: -20, duration: 10 },
        passive: { desc: 'ゴールド獲得+10%', goldBonus: 10 },
        obtainMethod: 'drop'
    },
    // ★3 式神
    inugami_shiki: {
        id: 'inugami_shiki', name: '犬神', emoji: '🐕', stars: 3,
        element: 'earth',
        baseHP: 400, baseATK: 45, baseDEF: 35,
        skill: { name: '牙突', desc: '敵単体にATK200%ダメージ', interval: 10, type: 'damage', multiplier: 2.0 },
        passive: { desc: 'ATK+8%', atkPercent: 8 },
        obtainMethod: 'drop'
    },
    tengu_shiki: {
        id: 'tengu_shiki', name: '天狗', emoji: '👺', stars: 3,
        element: 'wood',
        baseHP: 350, baseATK: 55, baseDEF: 25,
        skill: { name: '烈風扇', desc: '敵全体に木属性ATK120%ダメージ', interval: 15, type: 'damage', multiplier: 1.2, element: 'wood', aoe: true },
        passive: { desc: '攻撃速度+5%', atkSpeed: 5 },
        obtainMethod: 'drop'
    },
    // ★4 式神（ボス撃破で加入）
    shiro_kitsune: {
        id: 'shiro_kitsune', name: '白狐', emoji: '🦊', stars: 4,
        element: 'fire',
        baseHP: 600, baseATK: 80, baseDEF: 45,
        skill: { name: '狐火連弾', desc: '敵全体に火属性ATK200%ダメージ', interval: 12, type: 'damage', multiplier: 2.0, element: 'fire', aoe: true },
        passive: { desc: 'ゴールド獲得+15%', goldBonus: 15 },
        obtainMethod: 'boss',
        obtainBoss: 'boss_kyuubi'
    },
    ryuujin_ko: {
        id: 'ryuujin_ko', name: '龍の子', emoji: '🐲', stars: 4,
        element: 'water',
        baseHP: 800, baseATK: 70, baseDEF: 60,
        skill: { name: '津波', desc: '敵全体に水属性ATK250%ダメージ', interval: 15, type: 'damage', multiplier: 2.5, element: 'water', aoe: true },
        passive: { desc: 'HP+15%', hpPercent: 15 },
        obtainMethod: 'boss',
        obtainBoss: 'boss_ryuujin'
    },
    raijin_kodomo: {
        id: 'raijin_kodomo', name: '雷の童子', emoji: '⚡', stars: 4,
        element: 'thunder',
        baseHP: 500, baseATK: 100, baseDEF: 40,
        skill: { name: '雷撃', desc: '敵単体に雷属性ATK350%ダメージ', interval: 10, type: 'damage', multiplier: 3.5, element: 'thunder' },
        passive: { desc: 'クリティカル率+8%', critRate: 8 },
        obtainMethod: 'boss',
        obtainBoss: 'boss_raijin'
    },
    enma_shisha: {
        id: 'enma_shisha', name: '閻魔の使者', emoji: '💀', stars: 4,
        element: 'earth',
        baseHP: 700, baseATK: 90, baseDEF: 55,
        skill: { name: '裁きの鎖', desc: '敵全体にATK200%ダメージ+3秒拘束', interval: 18, type: 'damage', multiplier: 2.0, aoe: true, stun: 3 },
        passive: { desc: 'EXP獲得+15%', expBonus: 15 },
        obtainMethod: 'boss',
        obtainBoss: 'boss_enma'
    },
    // ★5 式神（超レア）
    amaterasu: {
        id: 'amaterasu', name: '天照', emoji: '☀️', stars: 5,
        element: 'fire',
        baseHP: 1200, baseATK: 150, baseDEF: 80,
        skill: { name: '天照大御神', desc: '敵全体に火属性ATK500%ダメージ+味方全体HP20%回復', interval: 20, type: 'damage', multiplier: 5.0, element: 'fire', aoe: true, healAlly: 20 },
        passive: { desc: '全ステータス+10%', allStats: 10 },
        obtainMethod: 'gacha'
    },
    tsukuyomi: {
        id: 'tsukuyomi', name: '月読', emoji: '🌙', stars: 5,
        element: 'water',
        baseHP: 1000, baseATK: 180, baseDEF: 60,
        skill: { name: '月光', desc: '敵全体に水属性ATK400%ダメージ+ATK30%ダウン', interval: 18, type: 'damage', multiplier: 4.0, element: 'water', aoe: true, debuffAtk: 30 },
        passive: { desc: 'クリックダメージ+20%', clickDmgPercent: 20 },
        obtainMethod: 'gacha'
    },
    susanoo: {
        id: 'susanoo', name: '素戔嗚', emoji: '⛈️', stars: 5,
        element: 'thunder',
        baseHP: 1500, baseATK: 200, baseDEF: 100,
        skill: { name: '天叢雲剣', desc: '敵単体に雷属性ATK800%ダメージ', interval: 15, type: 'damage', multiplier: 8.0, element: 'thunder' },
        passive: { desc: 'ボスダメージ+25%', bossDmgPercent: 25 },
        obtainMethod: 'gacha'
    }
};

// ガチャ排出テーブル
const GACHA_TABLE = {
    spirit: {
        name: '霊石召喚',
        cost: { spiritStones: 10 },
        tenCost: { spiritStones: 100 },
        pity: 50,
        rates: {
            5: 0.02,  // ★5: 2%
            4: 0.08,  // ★4: 8%
            3: 0.30,  // ★3: 30%
            2: 0.40,  // ★2: 40%
            1: 0.20   // ★1: 20%
        }
    },
    gold: {
        name: '黄金召喚',
        cost: { gold: 5000 },
        tenCost: { gold: 45000 },
        pity: 50,
        rates: {
            legendary: 0.02,
            epic: 0.08,
            rare: 0.25,
            uncommon: 0.40,
            common: 0.25
        }
    }
};
