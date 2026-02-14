/* ==========================================
   敵データベース
   ========================================== */
const ENEMIES = {
    // --- 初心者の森 (1-10F) ---
    forest_tanuki: {
        id: 'forest_tanuki', name: '化け狸', emoji: '🦝',
        element: 'wood', baseHP: 50, baseATK: 8, baseDEF: 3,
        expReward: 10, goldReward: 5,
        drops: [
            { id: 'tanuki_fur', chance: 0.5 },
            { id: 'wood_shard', chance: 0.3 }
        ]
    },
    forest_kodama: {
        id: 'forest_kodama', name: '木霊', emoji: '🌳',
        element: 'wood', baseHP: 35, baseATK: 5, baseDEF: 5,
        expReward: 8, goldReward: 4,
        drops: [
            { id: 'spirit_wood', chance: 0.4 },
            { id: 'wood_shard', chance: 0.3 }
        ]
    },
    forest_hitotsume: {
        id: 'forest_hitotsume', name: '一つ目小僧', emoji: '👁️',
        element: 'earth', baseHP: 60, baseATK: 10, baseDEF: 4,
        expReward: 12, goldReward: 7,
        drops: [
            { id: 'youkai_eye', chance: 0.3 },
            { id: 'earth_shard', chance: 0.3 }
        ]
    },
    forest_kappa: {
        id: 'forest_kappa', name: '河童', emoji: '🥒',
        element: 'water', baseHP: 55, baseATK: 9, baseDEF: 6,
        expReward: 11, goldReward: 6,
        drops: [
            { id: 'kappa_shell', chance: 0.4 },
            { id: 'water_shard', chance: 0.3 }
        ]
    },

    // --- 妖狐の社 (11-25F) ---
    shrine_kitsunebi: {
        id: 'shrine_kitsunebi', name: '狐火', emoji: '🔥',
        element: 'fire', baseHP: 80, baseATK: 18, baseDEF: 5,
        expReward: 20, goldReward: 12,
        drops: [
            { id: 'foxfire_crystal', chance: 0.35 },
            { id: 'fire_shard', chance: 0.3 }
        ]
    },
    shrine_inugami: {
        id: 'shrine_inugami', name: '犬神', emoji: '🐕',
        element: 'earth', baseHP: 120, baseATK: 15, baseDEF: 10,
        expReward: 22, goldReward: 14,
        drops: [
            { id: 'inugami_fang', chance: 0.3 },
            { id: 'earth_shard', chance: 0.3 }
        ]
    },
    shrine_kitsune: {
        id: 'shrine_kitsune', name: '妖狐', emoji: '🦊',
        element: 'fire', baseHP: 100, baseATK: 20, baseDEF: 8,
        expReward: 25, goldReward: 16,
        drops: [
            { id: 'fox_fur', chance: 0.35 },
            { id: 'fire_shard', chance: 0.4 }
        ]
    },
    shrine_tengu: {
        id: 'shrine_tengu', name: '天狗', emoji: '👺',
        element: 'wood', baseHP: 110, baseATK: 22, baseDEF: 7,
        expReward: 28, goldReward: 18,
        drops: [
            { id: 'tengu_feather', chance: 0.3 },
            { id: 'wood_shard', chance: 0.4 }
        ]
    },

    // --- 火焔洞窟 (26-40F) ---
    cave_hinotama: {
        id: 'cave_hinotama', name: '火の玉', emoji: '☄️',
        element: 'fire', baseHP: 150, baseATK: 30, baseDEF: 8,
        expReward: 40, goldReward: 25,
        drops: [
            { id: 'flame_core', chance: 0.35 },
            { id: 'fire_shard', chance: 0.5 }
        ]
    },
    cave_onibi: {
        id: 'cave_onibi', name: '鬼火', emoji: '🟣',
        element: 'fire', baseHP: 130, baseATK: 35, baseDEF: 6,
        expReward: 38, goldReward: 22,
        drops: [
            { id: 'onibi_essence', chance: 0.3 },
            { id: 'fire_shard', chance: 0.4 }
        ]
    },
    cave_salamander: {
        id: 'cave_salamander', name: '火蜥蜴', emoji: '🦎',
        element: 'fire', baseHP: 180, baseATK: 28, baseDEF: 15,
        expReward: 45, goldReward: 28,
        drops: [
            { id: 'salamander_scale', chance: 0.3 },
            { id: 'youkai_iron', chance: 0.25 }
        ]
    },

    // --- 深海神殿 (41-55F) ---
    sea_ningyo: {
        id: 'sea_ningyo', name: '人魚', emoji: '🧜',
        element: 'water', baseHP: 200, baseATK: 35, baseDEF: 18,
        expReward: 60, goldReward: 40,
        drops: [
            { id: 'ningyo_scale', chance: 0.3 },
            { id: 'water_shard', chance: 0.5 }
        ]
    },
    sea_umibouzu: {
        id: 'sea_umibouzu', name: '海坊主', emoji: '🌊',
        element: 'water', baseHP: 280, baseATK: 40, baseDEF: 20,
        expReward: 65, goldReward: 45,
        drops: [
            { id: 'sea_crystal', chance: 0.3 },
            { id: 'water_shard', chance: 0.4 }
        ]
    },

    // --- 雷雲城 (56-70F) ---
    thunder_raijuu: {
        id: 'thunder_raijuu', name: '雷獣', emoji: '⚡',
        element: 'thunder', baseHP: 300, baseATK: 55, baseDEF: 22,
        expReward: 85, goldReward: 60,
        drops: [
            { id: 'thunder_fang', chance: 0.3 },
            { id: 'thunder_shard', chance: 0.5 }
        ]
    },
    thunder_raiden: {
        id: 'thunder_raiden', name: '雷電', emoji: '🌩️',
        element: 'thunder', baseHP: 260, baseATK: 60, baseDEF: 18,
        expReward: 80, goldReward: 55,
        drops: [
            { id: 'lightning_core', chance: 0.3 },
            { id: 'thunder_shard', chance: 0.4 }
        ]
    },

    // --- 冥界門 (71-100F) ---
    dark_shinigami: {
        id: 'dark_shinigami', name: '死神', emoji: '💀',
        element: 'earth', baseHP: 400, baseATK: 70, baseDEF: 30,
        expReward: 120, goldReward: 80,
        drops: [
            { id: 'death_scythe_shard', chance: 0.2 },
            { id: 'dark_essence', chance: 0.4 }
        ]
    },
    dark_gashadokuro: {
        id: 'dark_gashadokuro', name: 'がしゃどくろ', emoji: '☠️',
        element: 'earth', baseHP: 500, baseATK: 65, baseDEF: 35,
        expReward: 130, goldReward: 90,
        drops: [
            { id: 'giant_bone', chance: 0.3 },
            { id: 'dark_essence', chance: 0.35 }
        ]
    }
};

/* ==========================================
   ボスデータ
   ========================================== */
const BOSSES = {
    // 初心者の森 10Fボス
    boss_yamawarashi: {
        id: 'boss_yamawarashi', name: '山童', emoji: '👹',
        element: 'wood', baseHP: 300, baseATK: 25, baseDEF: 12,
        expReward: 80, goldReward: 50, spiritStoneReward: 50,
        isBoss: true,
        drops: [
            { id: 'yamawarashi_bark', chance: 1.0, min: 2, max: 5 },
            { id: 'yamawarashi_core', chance: 1.0, min: 1, max: 1 }
        ],
        weaponDrops: [
            {
                baseName: '山童の棍棒', slot: 'weapon', weaponType: 'hammer',
                baseATK: 120, element: 'wood', chance: 0.5,
                enchantSlots: { min: 1, max: 2 }
            }
        ],
        armorDrops: [
            {
                baseName: '山童の面', slot: 'head',
                baseDEF: 40, baseHP: 50, chance: 0.3,
                enchantSlots: { min: 1, max: 2 }
            }
        ]
    },
    // 妖狐の社 25Fボス
    boss_kyuubi: {
        id: 'boss_kyuubi', name: '九尾の妖狐', emoji: '🦊',
        element: 'fire', baseHP: 1200, baseATK: 60, baseDEF: 25,
        expReward: 250, goldReward: 200, spiritStoneReward: 50,
        isBoss: true,
        drops: [
            { id: 'kyuubi_fur', chance: 1.0, min: 3, max: 8 },
            { id: 'foxfire_crystal', chance: 1.0, min: 1, max: 2 }
        ],
        weaponDrops: [
            {
                baseName: '狐火の扇', slot: 'weapon', weaponType: 'staff',
                baseATK: 450, element: 'fire', chance: 0.4,
                enchantSlots: { min: 2, max: 3 }
            },
            {
                baseName: '九尾の爪', slot: 'weapon', weaponType: 'fist',
                baseATK: 380, element: 'fire', chance: 0.3,
                enchantSlots: { min: 2, max: 3 }
            }
        ],
        armorDrops: [
            {
                baseName: '九尾の法衣', slot: 'body',
                baseDEF: 120, baseHP: 200, chance: 0.35,
                enchantSlots: { min: 2, max: 3 }
            }
        ]
    },
    // 火焔洞窟 40Fボス
    boss_enraenra: {
        id: 'boss_enraenra', name: '煙々羅', emoji: '🌫️',
        element: 'fire', baseHP: 2500, baseATK: 90, baseDEF: 35,
        expReward: 500, goldReward: 400, spiritStoneReward: 50,
        isBoss: true,
        drops: [
            { id: 'smoke_essence', chance: 1.0, min: 4, max: 10 },
            { id: 'flame_core', chance: 1.0, min: 2, max: 3 }
        ],
        weaponDrops: [
            {
                baseName: '煙々羅の煙管', slot: 'weapon', weaponType: 'staff',
                baseATK: 750, element: 'fire', chance: 0.35,
                enchantSlots: { min: 2, max: 4 }
            }
        ],
        armorDrops: [
            {
                baseName: '煙の羽衣', slot: 'body',
                baseDEF: 200, baseHP: 350, chance: 0.3,
                enchantSlots: { min: 2, max: 3 }
            }
        ]
    },
    // 深海神殿 55Fボス
    boss_ryuujin: {
        id: 'boss_ryuujin', name: '龍神', emoji: '🐉',
        element: 'water', baseHP: 5000, baseATK: 130, baseDEF: 50,
        expReward: 800, goldReward: 600, spiritStoneReward: 50,
        isBoss: true,
        drops: [
            { id: 'dragon_scale', chance: 1.0, min: 5, max: 12 },
            { id: 'dragon_orb', chance: 0.5, min: 1, max: 1 }
        ],
        weaponDrops: [
            {
                baseName: '龍神の薙刀', slot: 'weapon', weaponType: 'spear',
                baseATK: 1200, element: 'water', chance: 0.3,
                enchantSlots: { min: 3, max: 4 }
            }
        ],
        armorDrops: [
            {
                baseName: '龍鱗の鎧', slot: 'body',
                baseDEF: 350, baseHP: 600, chance: 0.25,
                enchantSlots: { min: 3, max: 4 }
            }
        ]
    },
    // 雷雲城 70Fボス
    boss_raijin: {
        id: 'boss_raijin', name: '雷神', emoji: '⛈️',
        element: 'thunder', baseHP: 8000, baseATK: 180, baseDEF: 65,
        expReward: 1200, goldReward: 900, spiritStoneReward: 50,
        isBoss: true,
        drops: [
            { id: 'raijin_drum', chance: 1.0, min: 3, max: 6 },
            { id: 'lightning_core', chance: 1.0, min: 2, max: 4 }
        ],
        weaponDrops: [
            {
                baseName: '雷神の槌', slot: 'weapon', weaponType: 'hammer',
                baseATK: 1800, element: 'thunder', chance: 0.25,
                enchantSlots: { min: 3, max: 5 }
            }
        ],
        armorDrops: [
            {
                baseName: '雷雲の具足', slot: 'feet',
                baseDEF: 280, baseHP: 400, chance: 0.3,
                enchantSlots: { min: 3, max: 4 }
            }
        ]
    },
    // 冥界門 100Fボス
    boss_enma: {
        id: 'boss_enma', name: '閻魔大王', emoji: '👑',
        element: 'earth', baseHP: 15000, baseATK: 250, baseDEF: 100,
        expReward: 2000, goldReward: 1500, spiritStoneReward: 100,
        isBoss: true,
        drops: [
            { id: 'meikai_iron', chance: 1.0, min: 5, max: 15 },
            { id: 'enma_seal', chance: 1.0, min: 1, max: 1 }
        ],
        weaponDrops: [
            {
                baseName: '閻魔の断罪刀', slot: 'weapon', weaponType: 'katana',
                baseATK: 2800, element: null, chance: 0.2,
                enchantSlots: { min: 3, max: 5 },
                fixedEffect: { name: '裁きの一撃', desc: '10%の確率で即死判定', instantKillChance: 0.1 }
            }
        ],
        armorDrops: [
            {
                baseName: '閻魔の裁きの冠', slot: 'head',
                baseDEF: 500, baseHP: 800, chance: 0.15,
                enchantSlots: { min: 4, max: 5 }
            }
        ]
    }
};

// ダンジョンごとの敵出現テーブル
const DUNGEON_ENEMIES = {
    forest: ['forest_tanuki', 'forest_kodama', 'forest_hitotsume', 'forest_kappa'],
    shrine: ['shrine_kitsunebi', 'shrine_inugami', 'shrine_kitsune', 'shrine_tengu'],
    cave: ['cave_hinotama', 'cave_onibi', 'cave_salamander'],
    sea: ['sea_ningyo', 'sea_umibouzu'],
    thunder: ['thunder_raijuu', 'thunder_raiden'],
    dark: ['dark_shinigami', 'dark_gashadokuro'],
    infinite: ['dark_shinigami', 'dark_gashadokuro', 'thunder_raijuu', 'sea_umibouzu', 'cave_salamander']
};
