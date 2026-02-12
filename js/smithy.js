/* ==========================================
   鍛冶システム
   ========================================== */

const Smithy = {
    currentTab: 'craft',

    render() {
        const content = document.getElementById('smithy-content');
        switch (this.currentTab) {
            case 'craft': this.renderCraft(content); break;
            case 'enhance': this.renderEnhance(content); break;
            case 'reforge': this.renderReforge(content); break;
            case 'evolve': this.renderEvolve(content); break;
            case 'dismantle': this.renderDismantle(content); break;
        }
    },

    // 作成
    renderCraft(content) {
        let html = '<h3 style="margin-bottom:16px">装備作成</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:8px">';

        for (const [recipeId, recipe] of Object.entries(CRAFT_RECIPES)) {
            const canCraft = this.canCraft(recipe);
            const materialList = Object.entries(recipe.materials).map(([matId, count]) => {
                const mat = MATERIALS[matId];
                const have = GameState.inventory.materials[matId] || 0;
                const enough = have >= count;
                return `<span style="color:${enough ? 'var(--accent-green)' : 'var(--accent-red)'}">${mat ? mat.emoji : ''} ${mat ? mat.name : matId}: ${have}/${count}</span>`;
            }).join(' | ');

            html += `
                <div class="equip-card">
                    <div class="equip-card-header">
                        <span class="equip-card-name" style="color:${getRarityColor(recipe.rarity)}">${recipe.name}</span>
                        <span class="equip-card-rarity" style="background:${getRarityColor(recipe.rarity)}22;color:${getRarityColor(recipe.rarity)}">${getRarityName(recipe.rarity)}</span>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:6px 0">
                        ${recipe.slot === 'weapon' ? `ATK: ${recipe.baseATK}` : `DEF: ${recipe.baseDEF || 0}`}
                        ${recipe.element ? ` | ${getElementName(recipe.element)}属性` : ''}
                        ${recipe.weaponType ? ` | ${WEAPON_TYPES[recipe.weaponType].name}` : ''}
                    </div>
                    <div style="font-size:11px;margin:6px 0">${materialList}</div>
                    <div style="font-size:11px;color:var(--accent-gold);margin-bottom:8px">💰 ${formatNumber(recipe.goldCost)}G</div>
                    <button class="btn btn-sm ${canCraft ? 'btn-primary' : ''}" ${canCraft ? '' : 'disabled'} onclick="Smithy.craft('${recipeId}')">作成</button>
                </div>
            `;
        }

        html += '</div>';
        content.innerHTML = html;
    },

    canCraft(recipe) {
        if (GameState.player.gold < recipe.goldCost) return false;
        for (const [matId, count] of Object.entries(recipe.materials)) {
            if ((GameState.inventory.materials[matId] || 0) < count) return false;
        }
        if (GameState.inventory.equipment.length >= GameState.inventory.maxEquipSlots) return false;
        return true;
    },

    craft(recipeId) {
        const recipe = CRAFT_RECIPES[recipeId];
        if (!recipe || !this.canCraft(recipe)) return;

        // 素材消費
        GameState.player.gold -= recipe.goldCost;
        for (const [matId, count] of Object.entries(recipe.materials)) {
            GameState.inventory.materials[matId] -= count;
        }

        // 装備生成
        const item = {
            uid: generateUID(),
            name: recipe.name,
            slot: recipe.slot,
            weaponType: recipe.weaponType || null,
            rarity: recipe.rarity,
            atk: recipe.baseATK || 0,
            def: recipe.baseDEF || 0,
            hp: recipe.baseHP || 0,
            element: recipe.element || null,
            enchants: [],
            enhanceLevel: 0,
            fixedEffect: recipe.fixedEffect || null
        };

        GameState.inventory.equipment.push(item);
        GameState.encyclopedia.craftCount = (GameState.encyclopedia.craftCount || 0) + 1;
        showNotification(`${item.name} を作成！`, 'success');
        this.render();
        Save.autoSave();
    },

    // 強化
    renderEnhance(content) {
        let html = '<h3 style="margin-bottom:16px">装備強化</h3>';
        html += '<p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">装備を選択して強化（+1〜+15）。強化石が必要。+10以上は失敗リスクあり（保護札で防止可）。</p>';

        // 装備リスト
        const allEquip = [...GameState.inventory.equipment];
        for (const [slot, item] of Object.entries(GameState.equipped)) {
            if (item) allEquip.push({ ...item, isEquipped: true });
        }

        html += '<div style="display:flex;flex-direction:column;gap:8px">';
        for (const item of allEquip) {
            if (item.enhanceLevel >= 15) continue;
            const cost = this.getEnhanceCost(item.enhanceLevel);
            const hasStone = (GameState.inventory.materials['enhance_stone'] || 0) >= cost.stones;
            const hasGold = GameState.player.gold >= cost.gold;
            const needsProtect = item.enhanceLevel >= 9;
            const hasProtect = needsProtect ? (GameState.inventory.materials['protect_charm'] || 0) > 0 : true;

            html += `
                <div class="equip-card" style="border-left:3px solid ${getRarityColor(item.rarity)}">
                    <div class="equip-card-header">
                        <span class="equip-card-name" style="color:${getRarityColor(item.rarity)}">
                            ${item.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ''} ${item.isEquipped ? '(装備中)' : ''}
                        </span>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0">
                        強化石: ${GameState.inventory.materials['enhance_stone'] || 0}/${cost.stones}
                        | 💰 ${formatNumber(cost.gold)}G
                        ${needsProtect ? `| 保護札: ${GameState.inventory.materials['protect_charm'] || 0}/1` : ''}
                        | 成功率: ${cost.successRate}%
                    </div>
                    <button class="btn btn-sm ${hasStone && hasGold ? 'btn-primary' : ''}"
                            ${hasStone && hasGold ? '' : 'disabled'}
                            onclick="Smithy.enhance('${item.uid}')">+${item.enhanceLevel + 1}に強化</button>
                </div>
            `;
        }
        html += '</div>';
        content.innerHTML = html;
    },

    getEnhanceCost(currentLevel) {
        const baseCost = 100 * Math.pow(1.5, currentLevel);
        return {
            stones: Math.max(1, Math.floor(1 + currentLevel * 0.5)),
            gold: Math.floor(baseCost),
            successRate: Math.max(30, 100 - currentLevel * 7)
        };
    },

    enhance(itemUid) {
        // アイテム検索
        let item = GameState.inventory.equipment.find(e => e.uid === itemUid);
        let isEquipped = false;
        if (!item) {
            for (const [slot, eq] of Object.entries(GameState.equipped)) {
                if (eq && eq.uid === itemUid) {
                    item = eq;
                    isEquipped = true;
                    break;
                }
            }
        }
        if (!item) return;

        const cost = this.getEnhanceCost(item.enhanceLevel);

        // コスト消費
        GameState.player.gold -= cost.gold;
        GameState.inventory.materials['enhance_stone'] = (GameState.inventory.materials['enhance_stone'] || 0) - cost.stones;

        // 成功判定
        if (Math.random() * 100 < cost.successRate) {
            item.enhanceLevel++;
            // ステータスUP
            if (item.atk > 0) item.atk = Math.floor(item.atk * 1.08);
            if (item.def > 0) item.def = Math.floor(item.def * 1.08);
            if (item.hp > 0) item.hp = Math.floor(item.hp * 1.05);
            showNotification(`強化成功！ ${item.name} +${item.enhanceLevel}`, 'success');
        } else {
            // 失敗
            const needsProtect = item.enhanceLevel >= 9;
            const hasProtect = needsProtect && (GameState.inventory.materials['protect_charm'] || 0) > 0;

            if (needsProtect && hasProtect) {
                GameState.inventory.materials['protect_charm']--;
                showNotification('強化失敗... 保護札が装備を守った！', 'warning');
            } else if (needsProtect) {
                // 破壊リスク（20%）
                if (Math.random() < 0.2) {
                    // 装備破壊
                    if (isEquipped) {
                        for (const slot in GameState.equipped) {
                            if (GameState.equipped[slot]?.uid === itemUid) {
                                GameState.equipped[slot] = null;
                                break;
                            }
                        }
                    } else {
                        const idx = GameState.inventory.equipment.findIndex(e => e.uid === itemUid);
                        if (idx >= 0) GameState.inventory.equipment.splice(idx, 1);
                    }
                    showNotification(`${item.name} が破壊された！`, 'error', 5000);
                } else {
                    item.enhanceLevel = Math.max(0, item.enhanceLevel - 1);
                    showNotification('強化失敗... 強化値が1下がった', 'error');
                }
            } else {
                showNotification('強化失敗...', 'warning');
            }
        }

        this.render();
        Save.autoSave();
    },

    // 錬成（エンチャント付け替え）
    renderReforge(content) {
        let html = '<h3 style="margin-bottom:16px">錬成（エンチャント付与）</h3>';
        html += '<p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">装備にランダムエンチャントを1つ追加する。上限時はランダムに1つ置換。5000G必要。</p>';

        const allEquip = [...GameState.inventory.equipment];
        for (const [slot, item] of Object.entries(GameState.equipped)) {
            if (item) allEquip.push({ ...item, isEquipped: true });
        }
        html += '<div style="display:flex;flex-direction:column;gap:8px">';
        for (const item of allEquip) {
            const maxEnchants = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 }[item.rarity] || 2;
            const atMax = item.enchants.length >= maxEnchants;
            html += `<div class="equip-card" style="border-left:3px solid ${getRarityColor(item.rarity)}">`;
            html += `<div class="equip-card-name" style="color:${getRarityColor(item.rarity)}">${item.name} ${item.isEquipped ? '(装備中)' : ''} (${item.enchants.length}/${maxEnchants}エンチャント)</div>`;
            if (item.enchants.length > 0) {
                html += item.enchants.map(e => `<div class="enchant-line">✦ ${e.display}</div>`).join('');
            }
            const canReforge = GameState.player.gold >= 5000;
            const label = atMax ? '錬成・置換 (5000G)' : '錬成・追加 (5000G)';
            html += `<button class="btn btn-sm ${canReforge ? 'btn-primary' : ''}" ${canReforge ? '' : 'disabled'} style="margin-top:8px" onclick="Smithy.reforge('${item.uid}')">${label}</button>`;
            html += '</div>';
        }
        html += '</div>';
        content.innerHTML = html;
    },

    reforge(itemUid) {
        let item = GameState.inventory.equipment.find(e => e.uid === itemUid);
        if (!item) {
            for (const [slot, eq] of Object.entries(GameState.equipped)) {
                if (eq && eq.uid === itemUid) { item = eq; break; }
            }
        }
        if (!item || GameState.player.gold < 5000) return;

        GameState.player.gold -= 5000;

        const maxEnchants = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 }[item.rarity] || 2;
        const newEnchants = Equipment.generateEnchants(1, 50);
        if (newEnchants.length > 0) {
            if (item.enchants.length >= maxEnchants) {
                // 上限時：ランダムに1つ置換
                const replaceIdx = randomInt(0, item.enchants.length - 1);
                const oldName = item.enchants[replaceIdx].name;
                item.enchants[replaceIdx] = newEnchants[0];
                showNotification(`「${oldName}」→「${newEnchants[0].name}」に置換！`, 'success');
            } else {
                item.enchants.push(newEnchants[0]);
                showNotification(`「${newEnchants[0].name}」を付与！`, 'success');
            }
        }

        this.render();
        Save.autoSave();
    },

    // 進化
    renderEvolve(content) {
        content.innerHTML = `
            <h3 style="margin-bottom:16px">進化</h3>
            <p style="color:var(--text-secondary);font-size:13px">
                伝説装備 + 特殊素材 → 神器に昇格<br>
                神器はゲーム中最強の装備です。<br><br>
                <span style="color:var(--text-muted)">（伝説装備を入手してから利用可能）</span>
            </p>
        `;
    },

    // 分解
    renderDismantle(content) {
        let html = '<h3 style="margin-bottom:16px">分解</h3>';
        html += '<p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">不要な装備を素材に分解する。</p>';

        html += '<div style="display:flex;flex-direction:column;gap:8px">';
        for (const item of GameState.inventory.equipment) {
            const returns = this.getDismantleReturns(item);
            html += `
                <div class="equip-card" style="border-left:3px solid ${getRarityColor(item.rarity)}">
                    <div class="equip-card-name" style="color:${getRarityColor(item.rarity)}">${item.name}</div>
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0">
                        分解で得られるもの: 💰 ${formatNumber(returns.gold)}G
                        ${returns.stones > 0 ? ` + 強化石 ×${returns.stones}` : ''}
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="Smithy.dismantle('${item.uid}')">分解</button>
                </div>
            `;
        }
        if (GameState.inventory.equipment.length === 0) {
            html += '<div style="color:var(--text-muted)">分解できる装備がありません</div>';
        }
        html += '</div>';
        content.innerHTML = html;
    },

    getDismantleReturns(item) {
        const baseGold = { common: 50, uncommon: 150, rare: 500, epic: 1500, legendary: 5000, mythic: 15000 }[item.rarity] || 50;
        const stones = { common: 0, uncommon: 0, rare: 1, epic: 2, legendary: 3, mythic: 5 }[item.rarity] || 0;
        return { gold: baseGold, stones };
    },

    dismantle(itemUid) {
        const idx = GameState.inventory.equipment.findIndex(e => e.uid === itemUid);
        if (idx < 0) return;

        const item = GameState.inventory.equipment[idx];
        const returns = this.getDismantleReturns(item);

        GameState.player.gold += returns.gold;
        if (returns.stones > 0) {
            GameState.inventory.materials['enhance_stone'] = (GameState.inventory.materials['enhance_stone'] || 0) + returns.stones;
        }

        GameState.inventory.equipment.splice(idx, 1);
        showNotification(`${item.name} を分解。${formatNumber(returns.gold)}G 入手`, 'info');
        this.render();
        Save.autoSave();
    }
};
