/* ==========================================
   装備データベース
   ========================================== */

// レアリティ定義
const RARITY = {
    common:    { id: 'common',    name: '凡',  color: '#9e9e9e', enchantBonus: 0 },
    uncommon:  { id: 'uncommon',  name: '良',  color: '#4caf50', enchantBonus: 0 },
    rare:      { id: 'rare',      name: '優',  color: '#2196f3', enchantBonus: 1 },
    epic:      { id: 'epic',      name: '極',  color: '#9c27b0', enchantBonus: 1 },
    legendary: { id: 'legendary', name: '伝説', color: '#ff9800', enchantBonus: 2 },
    mythic:    { id: 'mythic',    name: '神器', color: '#ff1744', enchantBonus: 3 }
};

// 装備スロット
const EQUIP_SLOTS = {
    weapon:  { id: 'weapon',  name: '武器' },
    head:    { id: 'head',    name: '頭' },
    body:    { id: 'body',    name: '胴' },
    hands:   { id: 'hands',   name: '手' },
    feet:    { id: 'feet',    name: '足' },
    charm:   { id: 'charm',   name: '御守り' }
};

// 武器タイプ
const WEAPON_TYPES = {
    katana: { id: 'katana', name: '刀',  emoji: '🗡️', clickType: 'combo' },
    bow:    { id: 'bow',    name: '弓',  emoji: '🏹', clickType: 'charge' },
    spear:  { id: 'spear',  name: '槍',  emoji: '🔱', clickType: 'rhythm' },
    fist:   { id: 'fist',   name: '拳',  emoji: '👊', clickType: 'rapid' },
    staff:  { id: 'staff',  name: '杖',  emoji: '🪄', clickType: 'pattern' },
    hammer: { id: 'hammer', name: '大槌', emoji: '🔨', clickType: 'timing' }
};

// エンチャントプール
const ENCHANT_POOL = {
    // 攻撃系
    goriki:      { id: 'goriki',      name: '剛力',     category: 'attack', stat: 'atkPercent',       min: 5,   max: 25,  format: 'ATK +{value}%' },
    kaishin:     { id: 'kaishin',     name: '会心',     category: 'attack', stat: 'critRate',         min: 3,   max: 15,  format: 'クリティカル率 +{value}%' },
    mogeki:      { id: 'mogeki',      name: '猛攻',     category: 'attack', stat: 'clickDmgPercent',  min: 10,  max: 50,  format: 'クリックダメージ +{value}%' },
    renda:       { id: 'renda',       name: '連打',     category: 'attack', stat: 'multiHitChance',   min: 5,   max: 20,  format: '追加攻撃確率 +{value}%' },
    critDmg:     { id: 'critDmg',     name: '必殺',     category: 'attack', stat: 'critDmgPercent',   min: 10,  max: 50,  format: 'クリティカルダメージ +{value}%' },
    // 属性系
    fire_ench:    { id: 'fire_ench',    name: '火炎付与', category: 'element', stat: 'fireDmg',     min: 50,  max: 500, format: '火属性ダメージ +{value}' },
    water_ench:   { id: 'water_ench',   name: '氷結付与', category: 'element', stat: 'waterDmg',    min: 50,  max: 500, format: '水属性ダメージ +{value}' },
    thunder_ench: { id: 'thunder_ench', name: '雷撃付与', category: 'element', stat: 'thunderDmg',  min: 50,  max: 500, format: '雷属性ダメージ +{value}' },
    earth_ench:   { id: 'earth_ench',   name: '地震付与', category: 'element', stat: 'earthDmg',    min: 50,  max: 500, format: '土属性ダメージ +{value}' },
    wood_ench:    { id: 'wood_ench',    name: '疾風付与', category: 'element', stat: 'woodDmg',     min: 50,  max: 500, format: '木属性ダメージ +{value}' },
    // 防御系
    kenshu:  { id: 'kenshu',  name: '堅守', category: 'defense', stat: 'defPercent',    min: 5,  max: 25, format: 'DEF +{value}%' },
    katsuryoku: { id: 'katsuryoku', name: '活力', category: 'defense', stat: 'hpPercent', min: 10, max: 40, format: 'HP +{value}%' },
    saisei:  { id: 'saisei',  name: '再生', category: 'defense', stat: 'hpRegen',       min: 0.5, max: 3, format: '毎秒HP回復 +{value}%' },
    taisei:  { id: 'taisei',  name: '耐性', category: 'defense', stat: 'elemResist',    min: 5,  max: 20, format: '属性ダメージ軽減 +{value}%' },
    // 特殊系
    kyuuketsu: { id: 'kyuuketsu', name: '吸血',  category: 'special', stat: 'lifeSteal',    min: 1,  max: 8,  format: '与ダメの{value}%をHP回復' },
    kinun:     { id: 'kinun',     name: '金運',  category: 'special', stat: 'goldBonus',    min: 10, max: 50, format: 'ゴールド獲得 +{value}%' },
    tanchi:    { id: 'tanchi',    name: '探知',  category: 'special', stat: 'dropRate',     min: 5,  max: 25, format: 'レアドロップ率 +{value}%' },
    kasoku:    { id: 'kasoku',    name: '加速',  category: 'special', stat: 'atkSpeed',     min: 5,  max: 20, format: '攻撃速度 +{value}%' },
    keiken:    { id: 'keiken',    name: '経験',  category: 'special', stat: 'expBonus',     min: 10, max: 30, format: '獲得EXP +{value}%' }
};

// 鍛冶レシピ
const CRAFT_RECIPES = {
    // 初心者レシピ
    wooden_katana: {
        id: 'wooden_katana', name: '木刀', slot: 'weapon', weaponType: 'katana',
        baseATK: 50, rarity: 'common',
        materials: { wood_shard: 5, spirit_wood: 2 },
        goldCost: 100
    },
    wooden_bow: {
        id: 'wooden_bow', name: '木弓', slot: 'weapon', weaponType: 'bow',
        baseATK: 45, rarity: 'common',
        materials: { wood_shard: 5, spirit_wood: 3 },
        goldCost: 100
    },
    // 中級レシピ（ボス素材使用）
    yamawarashi_club_plus: {
        id: 'yamawarashi_club_plus', name: '山童の棍棒・改', slot: 'weapon', weaponType: 'hammer',
        baseATK: 200, rarity: 'rare', element: 'wood',
        materials: { yamawarashi_bark: 10, yamawarashi_core: 2, youkai_iron: 5 },
        goldCost: 2000
    },
    kyuubi_robe_plus: {
        id: 'kyuubi_robe_plus', name: '九尾の法衣・改', slot: 'body',
        baseDEF: 200, baseHP: 350, rarity: 'epic', element: 'fire',
        materials: { kyuubi_fur: 10, foxfire_crystal: 3, youkai_iron: 8 },
        goldCost: 5000
    },
    // 上級レシピ
    dragon_spear: {
        id: 'dragon_spear', name: '龍神の薙刀・改', slot: 'weapon', weaponType: 'spear',
        baseATK: 1800, rarity: 'legendary', element: 'water',
        materials: { dragon_scale: 15, dragon_orb: 2, youkai_iron: 20 },
        goldCost: 20000
    },
    enma_blade: {
        id: 'enma_blade', name: '閻魔の断罪刀・真', slot: 'weapon', weaponType: 'katana',
        baseATK: 4000, rarity: 'legendary', element: null,
        materials: { meikai_iron: 20, enma_seal: 3, dark_essence: 30 },
        goldCost: 50000,
        fixedEffect: { name: '裁きの一撃', desc: '10%の確率で即死判定', instantKillChance: 0.1 }
    }
};

// 素材定義
const MATERIALS = {
    // 基本素材
    wood_shard:     { id: 'wood_shard',     name: '木の欠片',     emoji: '🪵', rarity: 'common' },
    fire_shard:     { id: 'fire_shard',     name: '火の欠片',     emoji: '🔥', rarity: 'common' },
    water_shard:    { id: 'water_shard',    name: '水の欠片',     emoji: '💧', rarity: 'common' },
    thunder_shard:  { id: 'thunder_shard',  name: '雷の欠片',     emoji: '⚡', rarity: 'common' },
    earth_shard:    { id: 'earth_shard',    name: '土の欠片',     emoji: '🪨', rarity: 'common' },
    youkai_iron:    { id: 'youkai_iron',    name: '妖鉄',        emoji: '⛏️', rarity: 'uncommon' },
    // モンスター素材
    tanuki_fur:     { id: 'tanuki_fur',     name: '狸の毛皮',     emoji: '🦝', rarity: 'common' },
    spirit_wood:    { id: 'spirit_wood',    name: '霊木',        emoji: '🌿', rarity: 'common' },
    youkai_eye:     { id: 'youkai_eye',     name: '妖怪の目玉',   emoji: '👁️', rarity: 'uncommon' },
    kappa_shell:    { id: 'kappa_shell',    name: '河童の甲羅',   emoji: '🐢', rarity: 'uncommon' },
    foxfire_crystal:{ id: 'foxfire_crystal', name: '狐火の結晶',  emoji: '💎', rarity: 'rare' },
    inugami_fang:   { id: 'inugami_fang',   name: '犬神の牙',    emoji: '🦷', rarity: 'uncommon' },
    fox_fur:        { id: 'fox_fur',        name: '妖狐の毛皮',   emoji: '🦊', rarity: 'uncommon' },
    tengu_feather:  { id: 'tengu_feather',  name: '天狗の羽',     emoji: '🪶', rarity: 'rare' },
    flame_core:     { id: 'flame_core',     name: '炎の核',      emoji: '🔴', rarity: 'rare' },
    onibi_essence:  { id: 'onibi_essence',  name: '鬼火の精',    emoji: '🟣', rarity: 'rare' },
    salamander_scale:{ id: 'salamander_scale', name: '火蜥蜴の鱗', emoji: '🦎', rarity: 'rare' },
    ningyo_scale:   { id: 'ningyo_scale',   name: '人魚の鱗',    emoji: '✨', rarity: 'rare' },
    sea_crystal:    { id: 'sea_crystal',    name: '海の結晶',    emoji: '🌊', rarity: 'epic' },
    thunder_fang:   { id: 'thunder_fang',   name: '雷獣の牙',    emoji: '⚡', rarity: 'rare' },
    lightning_core: { id: 'lightning_core',  name: '雷の核',     emoji: '💛', rarity: 'epic' },
    death_scythe_shard: { id: 'death_scythe_shard', name: '死神の鎌片', emoji: '💀', rarity: 'epic' },
    dark_essence:   { id: 'dark_essence',   name: '闇の精',     emoji: '🖤', rarity: 'epic' },
    giant_bone:     { id: 'giant_bone',     name: '巨骨',       emoji: '🦴', rarity: 'epic' },
    // ボス専用素材
    yamawarashi_bark: { id: 'yamawarashi_bark', name: '山童の木皮', emoji: '🌳', rarity: 'uncommon' },
    yamawarashi_core: { id: 'yamawarashi_core', name: '山童の核',  emoji: '💚', rarity: 'rare' },
    kyuubi_fur:     { id: 'kyuubi_fur',     name: '九尾の毛皮',   emoji: '🦊', rarity: 'rare' },
    smoke_essence:  { id: 'smoke_essence',  name: '煙の精',      emoji: '🌫️', rarity: 'rare' },
    dragon_scale:   { id: 'dragon_scale',   name: '龍鱗',       emoji: '🐉', rarity: 'epic' },
    dragon_orb:     { id: 'dragon_orb',     name: '龍玉',       emoji: '🔮', rarity: 'legendary' },
    raijin_drum:    { id: 'raijin_drum',    name: '雷神の太鼓片', emoji: '🥁', rarity: 'epic' },
    meikai_iron:    { id: 'meikai_iron',    name: '冥界鉄',     emoji: '⛓️', rarity: 'legendary' },
    enma_seal:      { id: 'enma_seal',      name: '閻魔の裁印',  emoji: '📜', rarity: 'legendary' },
    // 強化用素材
    enhance_stone:  { id: 'enhance_stone',  name: '強化石',     emoji: '💠', rarity: 'uncommon' },
    protect_charm:  { id: 'protect_charm',  name: '保護札',     emoji: '📿', rarity: 'rare' }
};
