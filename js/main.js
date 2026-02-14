/* ==========================================
   メイン初期化・イベントバインド
   ========================================== */

(function() {
    'use strict';

    // ===== 初期化 =====
    function init() {
        // セーブデータチェック
        if (Save.hasSave()) {
            document.getElementById('btn-load-game').style.display = '';
        }

        // タイトルパーティクル
        createTitleParticles();

        // イベントバインド
        bindEvents();

        // タブ初期化
        UI.initTabs();
    }

    // ===== タイトルパーティクル =====
    function createTitleParticles() {
        const container = document.getElementById('title-particles');
        const colors = ['#8b5cf6', '#d946ef', '#f59e0b', '#22c55e', '#3b82f6'];

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.backgroundColor = randomChoice(colors);
            particle.style.animationDuration = (5 + Math.random() * 10) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.opacity = 0.3 + Math.random() * 0.4;
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }

    // ===== モバイル判定 =====
    function isMobile() {
        return window.innerWidth <= 600;
    }

    // ===== イベントバインド =====
    function bindEvents() {
        // --- タイトル画面 ---
        document.getElementById('btn-new-game').addEventListener('click', () => {
            startNewGame();
        });

        document.getElementById('btn-load-game').addEventListener('click', () => {
            Save.load();
            goToVillage();
        });

        // --- 拠点画面 ---
        document.querySelectorAll('.village-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const location = btn.dataset.location;
                navigateVillage(location);
            });
        });

        // --- ダンジョン選択 ---
        document.getElementById('btn-back-village').addEventListener('click', () => goToVillage());

        // --- 戦闘画面 ---
        // クリック攻撃はclick-area-overlay（enemy-area全体をカバー）に委譲
        const clickArea = document.getElementById('click-area');
        clickArea.addEventListener('click', (e) => {
            Weapons.showEffect(e);
            Weapons.handleClick(e);
        });
        clickArea.addEventListener('mousedown', (e) => {
            Weapons.handleMouseDown(e);
        });
        clickArea.addEventListener('mouseup', (e) => {
            Weapons.handleMouseUp(e);
        });

        // タッチ対応
        clickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Weapons.showEffect(e);
            Weapons.handleMouseDown(e);
        }, { passive: false });
        clickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            Weapons.handleMouseUp(e);
            Weapons.handleClick(e);
        }, { passive: false });

        // 自動攻撃
        document.getElementById('btn-auto-toggle').addEventListener('click', () => {
            GameState.dungeon.autoAttack = !GameState.dungeon.autoAttack;
            document.getElementById('btn-auto-toggle').textContent =
                GameState.dungeon.autoAttack ? '自動: ON (50%)' : '自動攻撃: OFF';
            document.getElementById('btn-auto-toggle').style.borderColor =
                GameState.dungeon.autoAttack ? 'var(--accent-green)' : 'var(--border-color)';
        });

        // 撤退
        document.getElementById('btn-retreat').addEventListener('click', () => {
            if (confirm('撤退しますか？（集めたアイテムは持ち帰れます）')) {
                Dungeon.retreat();
            }
        });

        // --- モバイル情報パネルトグル ---
        document.getElementById('btn-mobile-info').addEventListener('click', () => {
            toggleMobilePanel(true);
        });
        document.getElementById('btn-close-panel').addEventListener('click', () => {
            toggleMobilePanel(false);
        });
        document.getElementById('mobile-panel-backdrop').addEventListener('click', () => {
            toggleMobilePanel(false);
        });

        // --- モーダル ---
        document.getElementById('btn-close-drop').addEventListener('click', () => {
            closeModal('drop-modal');
        });

        document.getElementById('btn-result-ok').addEventListener('click', () => {
            closeModal('result-modal');
            goToVillage();
        });

        // --- 各画面の戻るボタン ---
        document.getElementById('btn-back-village-smithy').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-inv').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-shiki').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-gacha').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-arena').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-enc').addEventListener('click', () => goToVillage());
        document.getElementById('btn-back-village-settings').addEventListener('click', () => goToVillage());

        // --- キーボードショートカット ---
        document.addEventListener('keydown', (e) => {
            if (GameState.screen !== 'battle' || !GameState.dungeon.active) return;

            // スペースでクリック攻撃
            if (e.code === 'Space') {
                e.preventDefault();
                Weapons.showEffect(e);
                Weapons.handleClick(e);
            }

            // Aで自動攻撃トグル
            if (e.code === 'KeyA') {
                document.getElementById('btn-auto-toggle').click();
            }
        });

        // --- オートセーブ ---
        setInterval(() => {
            if (GameState.screen !== 'title') {
                Save.autoSave();
            }
        }, 30000);
    }

    // ===== モバイル情報パネル開閉 =====
    function toggleMobilePanel(show) {
        const panel = document.getElementById('battle-right-panel');
        const backdrop = document.getElementById('mobile-panel-backdrop');

        if (show) {
            panel.classList.add('mobile-visible');
            backdrop.classList.add('active');
            // 装備タブとスキルタブを更新
            UI.updateAcquiredSkills();
            UI.updateEquipmentTab();
        } else {
            panel.classList.remove('mobile-visible');
            backdrop.classList.remove('active');
        }
    }

    // showTapRipple は Weapons.showEffect(e) に統合済み

    // ===== 新規ゲーム =====
    function startNewGame() {
        // 初期式神を付与
        Shikigami.obtainShikigami('kodama');
        Shikigami.obtainShikigami('hinotama_shiki');

        // 初期装備（全6種の武器を付与）
        const starterWeapons = [
            { name: '退魔の木刀',   weaponType: 'katana', atk: 15 },
            { name: '退魔の短弓',   weaponType: 'bow',    atk: 12 },
            { name: '退魔の竹槍',   weaponType: 'spear',  atk: 13 },
            { name: '退魔の手甲',   weaponType: 'fist',   atk: 10 },
            { name: '退魔の木杖',   weaponType: 'staff',  atk: 11 },
            { name: '退魔の木槌',   weaponType: 'hammer', atk: 14 },
        ];

        starterWeapons.forEach((w, i) => {
            const item = {
                uid: generateUID(),
                name: w.name,
                slot: 'weapon',
                weaponType: w.weaponType,
                rarity: 'common',
                atk: w.atk,
                def: 0,
                hp: 0,
                element: null,
                enchants: [],
                enhanceLevel: 0,
                fixedEffect: null
            };
            if (i === 0) {
                // 最初の武器（刀）を装備
                GameState.equipped.weapon = item;
            } else {
                // 残りはインベントリへ
                GameState.inventory.equipment.push(item);
            }
        });

        // 初期素材
        GameState.inventory.materials['wood_shard'] = 10;
        GameState.inventory.materials['enhance_stone'] = 3;

        Save.save();
        goToVillage();

        showNotification('退魔の旅が始まる...', 'info', 3000);
    }

    // ===== 拠点へ移動 =====
    function goToVillage() {
        Dungeon.stopGameLoop();
        GameState.dungeon.active = false;
        switchScreen('village');
        UI.updateVillageSummary();
        Encyclopedia.checkAllAchievements();
    }
    window.goToVillage = goToVillage;

    // ===== 拠点内ナビゲーション =====
    function navigateVillage(location) {
        switch (location) {
            case 'dungeon':
                switchScreen('dungeon-select');
                Dungeon.renderDungeonSelect();
                break;
            case 'smithy':
                switchScreen('smithy');
                Smithy.render();
                break;
            case 'inventory':
                switchScreen('inventory');
                UI.renderInventory('equip');
                break;
            case 'shikigami':
                switchScreen('shikigami');
                Shikigami.renderShikigamiScreen();
                break;
            case 'gacha':
                switchScreen('gacha');
                Gacha.render();
                break;
            case 'arena':
                switchScreen('arena');
                Arena.render();
                break;
            case 'shop':
                switchScreen('village');
                showNotification('商店は今後のアップデートで実装予定です', 'info');
                break;
            case 'shrine':
                switchScreen('village');
                showNotification('神社（転生システム）は今後のアップデートで実装予定です', 'info');
                break;
            case 'encyclopedia':
                switchScreen('encyclopedia');
                Encyclopedia.render();
                break;
            case 'settings':
                switchScreen('settings');
                Save.renderSettings();
                break;
        }
    }

    // ===== DOM Ready =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
