/* ==========================================
   スキルデータベース（ローグライクレベルアップ選択）
   ========================================== */

const LEVELUP_SKILLS = {
    // ===== 武道系 =====
    budo_goriki: {
        id: 'budo_goriki', name: '剛力', category: 'budo',
        desc: 'クリックダメージ +50%',
        effect: { clickDmgPercent: 50 },
        stackable: true, maxStack: 10
    },
    budo_rengeki: {
        id: 'budo_rengeki', name: '連撃', category: 'budo',
        desc: 'クリック時30%の確率で追加攻撃',
        effect: { multiHitChance: 30 },
        stackable: true, maxStack: 3
    },
    budo_kaishin: {
        id: 'budo_kaishin', name: '会心の極', category: 'budo',
        desc: 'クリティカル率+10%, ダメージ+50%',
        effect: { critRate: 10, critDmgPercent: 50 },
        stackable: true, maxStack: 5
    },
    budo_ikari: {
        id: 'budo_ikari', name: '怒りの力', category: 'budo',
        desc: 'HP50%以下でATK+100%',
        effect: { lowHpAtkBonus: 100 },
        stackable: false
    },
    budo_teppeki: {
        id: 'budo_teppeki', name: '鉄壁', category: 'budo',
        desc: 'DEF+30%, 被ダメージ-10%',
        effect: { defPercent: 30, dmgReduction: 10 },
        stackable: true, maxStack: 5
    },
    budo_hayate: {
        id: 'budo_hayate', name: '疾風', category: 'budo',
        desc: '攻撃速度+20%',
        effect: { atkSpeed: 20 },
        stackable: true, maxStack: 5
    },
    budo_musou: {
        id: 'budo_musou', name: '無双', category: 'budo',
        desc: '通常攻撃が全体攻撃になる（ダメージ50%）',
        effect: { aoeAttack: true, aoeDmgPercent: 50 },
        stackable: false
    },

    // ===== 陰陽術系 =====
    onmyo_katon: {
        id: 'onmyo_katon', name: '火遁', category: 'onmyo',
        desc: '通常攻撃に火属性ダメージ追加',
        effect: { addElement: 'fire', elemDmgFlat: 30 },
        stackable: true, maxStack: 5
    },
    onmyo_suiton: {
        id: 'onmyo_suiton', name: '水遁', category: 'onmyo',
        desc: '通常攻撃に水属性ダメージ追加',
        effect: { addElement: 'water', elemDmgFlat: 30 },
        stackable: true, maxStack: 5
    },
    onmyo_raiton: {
        id: 'onmyo_raiton', name: '雷遁', category: 'onmyo',
        desc: '通常攻撃に雷属性ダメージ追加',
        effect: { addElement: 'thunder', elemDmgFlat: 30 },
        stackable: true, maxStack: 5
    },
    onmyo_kekkai: {
        id: 'onmyo_kekkai', name: '結界', category: 'onmyo',
        desc: '30秒間の無敵バリア（CD:120秒）',
        effect: { barrierSkill: true, barrierDuration: 30, barrierCD: 120 },
        stackable: false
    },
    onmyo_jubaku: {
        id: 'onmyo_jubaku', name: '呪縛', category: 'onmyo',
        desc: '敵の攻撃速度-30%',
        effect: { enemyAtkSlow: 30 },
        stackable: true, maxStack: 3
    },
    onmyo_kaifuku: {
        id: 'onmyo_kaifuku', name: '回復術', category: 'onmyo',
        desc: '毎秒HP2%回復',
        effect: { hpRegen: 2 },
        stackable: true, maxStack: 5
    },
    onmyo_bakuhatsu: {
        id: 'onmyo_bakuhatsu', name: '大爆発', category: 'onmyo',
        desc: '敵撃破時に周囲に撃破HPの30%のダメージ',
        effect: { deathExplosion: true, explosionPercent: 30 },
        stackable: false
    },

    // ===== 神通力系 =====
    jintsuu_senrigan: {
        id: 'jintsuu_senrigan', name: '千里眼', category: 'jintsuu',
        desc: 'レアドロップ率+25%',
        effect: { dropRate: 25 },
        stackable: true, maxStack: 5
    },
    jintsuu_kinun: {
        id: 'jintsuu_kinun', name: '金運', category: 'jintsuu',
        desc: 'ゴールド獲得+100%',
        effect: { goldBonus: 100 },
        stackable: true, maxStack: 5
    },
    jintsuu_shikigami_kyouka: {
        id: 'jintsuu_shikigami_kyouka', name: '式神強化', category: 'jintsuu',
        desc: '同行式神のDPS+40%',
        effect: { shikigamiDpsPercent: 40 },
        stackable: true, maxStack: 5
    },
    jintsuu_keiken: {
        id: 'jintsuu_keiken', name: '修行', category: 'jintsuu',
        desc: '獲得経験値+50%',
        effect: { expBonus: 50 },
        stackable: true, maxStack: 5
    },
    jintsuu_fukkatsu: {
        id: 'jintsuu_fukkatsu', name: '復活', category: 'jintsuu',
        desc: '力尽きた時、1度だけHP50%で復活',
        effect: { revive: true, reviveHpPercent: 50 },
        stackable: false
    },
    jintsuu_hp: {
        id: 'jintsuu_hp', name: '生命力強化', category: 'jintsuu',
        desc: 'HP+30%',
        effect: { hpPercent: 30 },
        stackable: true, maxStack: 10
    },
    jintsuu_kyuuketsu: {
        id: 'jintsuu_kyuuketsu', name: '吸血', category: 'jintsuu',
        desc: '与ダメの5%をHP回復',
        effect: { lifeSteal: 5 },
        stackable: true, maxStack: 3
    },
    jintsuu_jidou: {
        id: 'jintsuu_jidou', name: '自律戦闘', category: 'jintsuu',
        desc: '自動で敵を攻撃する（威力50%）',
        effect: { autoAttack: true },
        stackable: false
    }
};
