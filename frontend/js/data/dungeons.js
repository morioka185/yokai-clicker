/* ==========================================
   ダンジョンデータ
   ========================================== */

const DUNGEONS = {
    forest: {
        id: 'forest', name: '初心者の森', emoji: '🌲',
        floors: 10, element: 'wood',
        desc: '退魔の修行場。妖怪たちが棲む穏やかな森。',
        unlockCondition: null,
        enemyTable: 'forest',
        bossFloors: { 10: 'boss_yamawarashi' },
        killsPerFloor: 5,
        bgColor: '#1a2e1a',
        recommended: 'Lv.1~'
    },
    shrine: {
        id: 'shrine', name: '妖狐の社', emoji: '⛩️',
        floors: 25, element: 'fire',
        desc: '妖狐が支配する古い神社。狐火が揺らめく。',
        unlockCondition: { dungeon: 'forest', cleared: true },
        enemyTable: 'shrine',
        bossFloors: { 25: 'boss_kyuubi' },
        killsPerFloor: 6,
        bgColor: '#2e1a1a',
        recommended: '装備推奨'
    },
    cave: {
        id: 'cave', name: '火焔洞窟', emoji: '🌋',
        floors: 40, element: 'fire',
        desc: '溶岩が流れる灼熱の洞窟。罠に注意。',
        unlockCondition: { dungeon: 'shrine', cleared: true },
        enemyTable: 'cave',
        bossFloors: { 40: 'boss_enraenra' },
        killsPerFloor: 7,
        bgColor: '#2e1a0a',
        recommended: '装備強化推奨'
    },
    sea: {
        id: 'sea', name: '深海神殿', emoji: '🌊',
        floors: 55, element: 'water',
        desc: '海底に沈む古代神殿。水の妖怪が守る。',
        unlockCondition: { dungeon: 'cave', cleared: true },
        enemyTable: 'sea',
        bossFloors: { 55: 'boss_ryuujin' },
        killsPerFloor: 7,
        bgColor: '#0a1a2e',
        recommended: '上級者向け'
    },
    thunder: {
        id: 'thunder', name: '雷雲城', emoji: '⛈️',
        floors: 70, element: 'thunder',
        desc: '雲の上にそびえる城。雷が轟く。',
        unlockCondition: { dungeon: 'sea', cleared: true },
        enemyTable: 'thunder',
        bossFloors: { 70: 'boss_raijin' },
        killsPerFloor: 8,
        bgColor: '#1a1a2e',
        recommended: '熟練者向け'
    },
    dark: {
        id: 'dark', name: '冥界門', emoji: '🌑',
        floors: 100, element: null,
        desc: '冥界への門。全属性の妖怪が待ち構える。',
        unlockCondition: { dungeon: 'thunder', cleared: true },
        enemyTable: 'dark',
        bossFloors: { 100: 'boss_enma' },
        killsPerFloor: 8,
        bgColor: '#0a0a1e',
        recommended: '最高難易度'
    },
    infinite: {
        id: 'infinite', name: '無限回廊', emoji: '♾️',
        floors: Infinity, element: null,
        desc: '終わりなき回廊。挑戦者を永遠に試し続ける。',
        unlockCondition: { dungeon: 'dark', cleared: true },
        enemyTable: 'infinite',
        bossFloors: {},  // 10階ごとにランダムボス
        killsPerFloor: 10,
        bgColor: '#0a0a0f',
        recommended: '???',
        isInfinite: true
    }
};

// 階層ごとの敵レベルスケーリング
function getFloorScaling(dungeonId, floor) {
    const dungeon = DUNGEONS[dungeonId];
    const baseMultiplier = {
        forest: 1.0,
        shrine: 1.8,
        cave: 3.0,
        sea: 5.0,
        thunder: 8.0,
        dark: 12.0,
        infinite: 15.0
    }[dungeonId] || 1.0;

    const floorMultiplier = 1 + (floor - 1) * 0.15;
    const infiniteScaling = dungeonId === 'infinite' ? Math.pow(1.05, floor) : 1;

    return baseMultiplier * floorMultiplier * infiniteScaling;
}

// 経験値テーブル（ダンジョン内レベル用）
function getExpToNextLevel(level) {
    return Math.floor(20 * Math.pow(level, 1.5));
}
