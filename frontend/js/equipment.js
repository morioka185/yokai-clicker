/* ==========================================
   装備生成・管理システム
   ========================================== */

const Equipment = {
    // ボス武器ドロップ生成
    generateBossWeapon(dropData, floor) {
        const enchantCount = randomInt(dropData.enchantSlots.min, dropData.enchantSlots.max);
        const enchants = this.generateEnchants(enchantCount, floor);

        // レアリティ判定（エンチャント数に基づく）
        let rarity;
        if (enchantCount >= 4) rarity = 'legendary';
        else if (enchantCount >= 3) rarity = 'epic';
        else if (enchantCount >= 2) rarity = 'rare';
        else rarity = 'uncommon';

        const item = {
            uid: generateUID(),
            name: dropData.baseName,
            slot: dropData.slot,
            weaponType: dropData.weaponType,
            rarity: rarity,
            atk: Math.floor(dropData.baseATK * randomFloat(0.9, 1.1)),
            def: 0,
            hp: 0,
            element: dropData.element || null,
            enchants: enchants,
            enhanceLevel: 0,
            fixedEffect: dropData.fixedEffect || null
        };

        return item;
    },

    // ボス防具ドロップ生成
    generateBossArmor(dropData, floor) {
        const enchantCount = randomInt(dropData.enchantSlots.min, dropData.enchantSlots.max);
        const enchants = this.generateEnchants(enchantCount, floor);

        let rarity;
        if (enchantCount >= 4) rarity = 'legendary';
        else if (enchantCount >= 3) rarity = 'epic';
        else if (enchantCount >= 2) rarity = 'rare';
        else rarity = 'uncommon';

        return {
            uid: generateUID(),
            name: dropData.baseName,
            slot: dropData.slot,
            rarity: rarity,
            atk: 0,
            def: Math.floor(dropData.baseDEF * randomFloat(0.9, 1.1)),
            hp: Math.floor((dropData.baseHP || 0) * randomFloat(0.9, 1.1)),
            element: dropData.element || null,
            enchants: enchants,
            enhanceLevel: 0,
            fixedEffect: null
        };
    },

    // ランダム装備生成（通常ドロップ・ガチャ用）
    generateRandomEquipment(level, forcedRarity = null) {
        const rarityWeights = {
            common: 40,
            uncommon: 30,
            rare: 20,
            epic: 8,
            legendary: 2
        };
        const rarity = forcedRarity || weightedRandom(rarityWeights);
        const rarityData = RARITY[rarity];

        // スロットランダム
        const slots = Object.keys(EQUIP_SLOTS);
        const slot = randomChoice(slots);

        const isWeapon = slot === 'weapon';

        // 武器タイプ
        let weaponType = null;
        if (isWeapon) {
            const types = Object.keys(WEAPON_TYPES);
            weaponType = randomChoice(types);
        }

        // 基礎ステータス
        const levelMult = 1 + level * 0.5;
        const rarityMult = { common: 1, uncommon: 1.3, rare: 1.6, epic: 2, legendary: 2.5 }[rarity];
        const baseATK = isWeapon ? Math.floor(20 * levelMult * rarityMult * randomFloat(0.8, 1.2)) : 0;
        const baseDEF = !isWeapon ? Math.floor(10 * levelMult * rarityMult * randomFloat(0.8, 1.2)) : 0;
        const baseHP = !isWeapon ? Math.floor(30 * levelMult * rarityMult * randomFloat(0.8, 1.2)) : 0;

        // エンチャント数
        const enchantBase = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }[rarity];
        const enchantCount = Math.max(0, enchantBase + randomInt(-1, rarityData.enchantBonus));
        const enchants = this.generateEnchants(enchantCount, level);

        // 属性（ランダム）
        const elements = [null, null, null, 'fire', 'water', 'thunder', 'earth', 'wood'];
        const element = randomChoice(elements);

        // 名前生成
        const name = this.generateEquipName(slot, weaponType, rarity, element);

        return {
            uid: generateUID(),
            name: name,
            slot: slot,
            weaponType: weaponType,
            rarity: rarity,
            atk: baseATK,
            def: baseDEF,
            hp: baseHP,
            element: element,
            enchants: enchants,
            enhanceLevel: 0,
            fixedEffect: null
        };
    },

    // エンチャント生成
    generateEnchants(count, floorLevel = 1) {
        const enchants = [];
        const usedIds = new Set();
        const pool = Object.values(ENCHANT_POOL);

        for (let i = 0; i < count; i++) {
            const available = pool.filter(e => !usedIds.has(e.id));
            if (available.length === 0) break;

            const ench = randomChoice(available);
            usedIds.add(ench.id);

            // 値はフロアレベルに応じてスケーリング
            const scaling = Math.min(1, 0.3 + floorLevel * 0.02);
            const range = ench.max - ench.min;
            const value = Number((ench.min + range * scaling * Math.random()).toFixed(1));

            enchants.push({
                id: ench.id,
                name: ench.name,
                value: value,
                display: ench.format.replace('{value}', value)
            });
        }

        return enchants;
    },

    // 装備名生成
    generateEquipName(slot, weaponType, rarity, element) {
        const elementPrefix = {
            fire: '炎の', water: '水の', thunder: '雷の', earth: '岩の', wood: '翠の'
        };
        const rarityPrefix = {
            common: '', uncommon: '', rare: '上質な', epic: '極上の', legendary: '伝説の'
        };
        const slotNames = {
            weapon: weaponType ? WEAPON_TYPES[weaponType].name : '武器',
            head: randomChoice(['兜', '鉢金', '額当て']),
            body: randomChoice(['鎧', '法衣', '胴着']),
            hands: randomChoice(['篭手', '手甲', '手袋']),
            feet: randomChoice(['脚絆', '足袋', '草鞋']),
            charm: randomChoice(['御守り', '勾玉', '数珠'])
        };

        const prefix = (element ? elementPrefix[element] || '' : '') + (rarityPrefix[rarity] || '');
        return prefix + slotNames[slot];
    },

    // 装備のHTML表示
    renderEquipCard(item, onClick = null) {
        const div = document.createElement('div');
        div.className = `equip-card`;
        div.style.borderLeftColor = getRarityColor(item.rarity);
        div.style.borderLeftWidth = '3px';
        div.style.borderLeftStyle = 'solid';

        let statsHtml = '';
        if (item.atk > 0) statsHtml += `ATK: ${item.atk}`;
        if (item.def > 0) statsHtml += `${statsHtml ? ' / ' : ''}DEF: ${item.def}`;
        if (item.hp > 0) statsHtml += `${statsHtml ? ' / ' : ''}HP: ${item.hp}`;
        if (item.element) statsHtml += `${statsHtml ? ' / ' : ''}属性: ${getElementName(item.element)}`;
        if (item.enhanceLevel > 0) statsHtml += ` [+${item.enhanceLevel}]`;

        let enchantHtml = '';
        if (item.enchants && item.enchants.length > 0) {
            enchantHtml = item.enchants.map(e => `<div class="enchant-line">✦ ${e.display}</div>`).join('');
        }

        let fixedHtml = '';
        if (item.fixedEffect) {
            fixedHtml = `<div class="enchant-line" style="color:var(--accent-gold)">★ ${item.fixedEffect.name}: ${item.fixedEffect.desc}</div>`;
        }

        const slotName = item.slot === 'weapon' && item.weaponType
            ? WEAPON_TYPES[item.weaponType].name
            : EQUIP_SLOTS[item.slot]?.name || item.slot;

        div.innerHTML = `
            <div class="equip-card-header">
                <span class="equip-card-name" style="color:${getRarityColor(item.rarity)}">${item.name}</span>
                <span class="equip-card-rarity" style="background:${getRarityColor(item.rarity)}22;color:${getRarityColor(item.rarity)}">${getRarityName(item.rarity)} / ${slotName}</span>
            </div>
            <div class="equip-card-stats">${statsHtml}</div>
            <div class="equip-card-enchants">${enchantHtml}${fixedHtml}</div>
        `;

        if (onClick) {
            div.onclick = () => onClick(item);
        }

        return div;
    },

    // 装備する
    equipItem(item) {
        const slot = item.slot;
        const currentEquipped = GameState.equipped[slot];

        // 現在装備中のアイテムをインベントリに戻す
        if (currentEquipped) {
            GameState.inventory.equipment.push(currentEquipped);
        }

        // 新しいアイテムを装備
        GameState.equipped[slot] = item;

        // インベントリから除去
        const idx = GameState.inventory.equipment.findIndex(e => e.uid === item.uid);
        if (idx >= 0) {
            GameState.inventory.equipment.splice(idx, 1);
        }

        showNotification(`${item.name} を装備した！`, 'success');

        // 武器変更時はUIを更新
        if (slot === 'weapon' && GameState.dungeon.active) {
            const stats = calculatePlayerStats();
            Weapons.init(stats.weaponType);
        }
    },

    // 装備を外す
    unequipItem(slot) {
        const item = GameState.equipped[slot];
        if (!item) return;

        if (GameState.inventory.equipment.length >= GameState.inventory.maxEquipSlots) {
            showNotification('倉庫がいっぱいです！', 'error');
            return;
        }

        GameState.inventory.equipment.push(item);
        GameState.equipped[slot] = null;
        showNotification(`${item.name} を外した`, 'info');
    }
};
