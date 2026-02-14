# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**妖怪退魔録 〜無限百鬼夜行〜** — 和風ローグライク・ダンジョンクロウラー型クリッカーゲーム。
バニラJS（ES6+）のSPA + Node.js(Express) バックエンド。Docker Compose で PostgreSQL と合わせてデプロイ。

## ディレクトリ構成

```
yokai-clicker/
├── docker-compose.yml        # frontend / backend / db の3サービス
├── CLAUDE.md
├── frontend/                 # 静的フロントエンド（Nginx配信）
│   ├── Dockerfile.prod
│   ├── nginx.conf            # APIプロキシ (/api/ → backend:3000)
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── data/             # ゲームデータ定義
│       ├── api.js            # API通信レイヤー（fetchラッパー）
│       ├── auth.js           # 認証UI・トークン管理
│       ├── leaderboard.js    # ランキング表示
│       ├── state.js          # グローバル状態（GameState）
│       ├── save.js           # セーブ/ロード + サーバー同期
│       ├── arena.js          # 闘技場（NPC + 実プレイヤー）
│       └── ...               # その他既存ファイル
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── src/
    │   ├── index.js          # Express エントリポイント
    │   ├── config/database.js
    │   ├── middleware/        # auth.js, rateLimit.js
    │   ├── routes/            # auth, save, leaderboard, arena
    │   └── services/          # authService, saveService, leaderboardService, arenaService
    └── db/init.sql            # PostgreSQLスキーマ
```

## 開発方法

- **ローカル開発（フロントのみ）**: `frontend/index.html` をブラウザで直接開く（サーバー不要、オフラインモードで動作）
- **フルスタック開発**: `docker compose up -d --build` で3サービス起動
- **バックエンド単体**: `cd backend && npm install && npm run dev`
- **ビルド/テスト**: なし（テストフレームワーク未導入）
- **保存データ**: localStorage（オフライン）+ PostgreSQL JSONB（オンライン）

## アーキテクチャ

### グローバル状態管理
`GameState`（`frontend/js/state.js`）が唯一のグローバル状態オブジェクト。永続データ（player, inventory, equipped, shikigami, encyclopedia）、セッションデータ（dungeon）、オンライン状態（online）に分離。

### GameState データ構造（セーブ対象）
```javascript
{
  version: '1.0.0',
  timestamp: Date.now(),
  player: { name, level, exp, hp, maxHp, mp, maxMp, gold, spiritStones, ... },
  inventory: { equipment: [], materials: {} },
  equipped: { weapon, head, body, hands, feet, charm },
  shikigami: { owned: {}, party: [null, null, null] },
  gachaPity: { spirit: 0, gold: 0 },
  arena: { rank, wins, losses, medals },
  encyclopedia: { discoveredEnemies: {}, achievements: {} },
  settings: { soundEnabled, autoSave, damageNumbers, shakeScreen },
  dungeon: { /* セッションデータ: 探索中のダンジョン状態 */ }
}
```

### フロントエンド モジュール構成
クラスは使わず、名前空間オブジェクト（`Combat`, `Weapons`, `UI`, `Dungeon`, `Api`, `Auth`, `Leaderboard` 等）で機能を分離。

### スクリプト読み込み順序（`index.html`内）
1. **データ定義** (`js/data/`): enemies → equipment → skills → shikigami → dungeons
2. **基盤**: sound → state → utils → **api → auth**
3. **ゲームロジック**: combat → weapons → dungeon → equipment → shikigami → smithy → gacha → arena → **leaderboard** → encyclopedia → save → ui
4. **エントリポイント**: main.js（最後に読み込み）

### バックエンド
Express + pg (PostgreSQL)。JWT認証。`/api/v1/` 以下にRESTful API。

### オフラインフォールバック
API失敗時はサイレントに従来のlocalStorage動作に戻る。ログインなしでも全機能プレイ可能。

### ゲームループ
`requestAnimationFrame`ベース。delta time（フレーム間経過時間）で更新。

## 主要システム

### 戦闘 (`combat.js`)
- マルチエネミー（最大3体同時）、ゾーン制（左0/中央1/右2）
- エネミーごとに独立した攻撃タイマー
- プレイヤーステータスは装備+スキルから動的計算

### ステータス計算パイプライン (`combat.js: calculatePlayerStats()`)
基本値(レベル) → 装備ボーナス → 装備エンチャント → スキル効果(加算) → 式神パッシブ → 割合修正(乗算)。複数ファイルのデータを集約するため、変更時は影響範囲に注意。

### ダメージ計算
```
damage = (ATK - DEF*0.3) × 武器倍率 × 属性相性 × (1+クリック%/100) × クリティカル × ランダム(0.9~1.1)
```

### 武器 (`weapons.js`) — 6種各固有メカニクス
| 武器 | メカニクス | 特殊効果 |
|------|-----------|---------|
| 刀 | コンボ蓄積 | 3hit毎AoE、10コンボ以上でダメージ倍率 |
| 弓 | チャージ（4段階）| フルチャージで貫通（全体攻撃）|
| 槍 | タイミングカーソル | パーフェクトで2倍+AoE |
| 拳 | CPS（クリック/秒）| 4CPS以上で隣接AoE、13CPS以上で全体 |
| 杖 | パターン入力 | 正順クリックで全体魔法攻撃 |
| 大槌 | ゲージタイミング | ゴールドゾーンで8倍+全体 |

### ダンジョン (`dungeon.js`)
- ストーリーダンジョン（固定フロア数）+ 無限回廊（エンドレス）
- フロア進行: キル数ノルマ達成で自動進行、ボスフロアは一定間隔
- スケーリング: `1 + (floor-1) * difficultyFactor`（ダンジョン毎に係数が異なる）
- 死亡=ゴールド/素材50%失い装備全喪失、撤退=全アイテム保持

### 装備・鍛冶 (`equipment.js`, `smithy.js`)
- レアリティ: 凡→良→優→極→伝説→神器
- 強化(+1~+20)、エンチャント(レアリティでスロット数決定)、進化(レアリティ昇格)、解体
- ボスドロップ: 固有武器（ボス毎テーマ、フロア深度でスケーリング）

### 式神 (`shikigami.js`)
- パーティ3体編成、自動スキル発動(MP消費)、パッシブ効果
- ★1~5レアリティ、戦闘EXP(敵EXPの30%)でレベルアップ
- 入手: ガチャ / ボスドロップ(★4固有)

### ガチャ (`gacha.js`)
- 霊石ガチャ: ★1(50%)→★5(1%)、天井50連で★4以上保証
- ゴールドガチャ: ★1(70%)→★3(5%)

### 認証 (`auth.js` / `backend/src/routes/auth.js`)
ユーザー名+パスワード登録、ゲストアカウント、JWT(7日有効期限)。自動ログイン対応。

### セーブ同期 (`save.js`)
localStorage（常に）+ サーバー保存（ログイン時、30秒デバウンス）。ログイン時にタイムスタンプ比較で同期方向を自動決定。

### ランキング (`leaderboard.js`)
無限回廊最高階層 / 総クリア数 / 闘技場順位の3タブ。`leaderboard_cache`テーブルはセーブ保存時に自動更新。

### 闘技場 (`arena.js`)
ログイン時は実プレイヤーのスナップショットと対戦。非ログイン時はNPC生成にフォールバック。

### 図鑑・実績 (`encyclopedia.js`)
敵発見記録・実績システム。発見済み敵・達成済み実績は `encyclopedia` に格納。

### ビジュアルエフェクト（パワーティアシステム）
スキル威力に応じてTier 0~4に分類。Tierが上がるとリング、スピードライン、パーティクル、画面シェイクが追加。属性ごとに色分け（火=赤、水=青、雷=黄、土=茶、木=緑）。

## クロスシステム連携（変更時の影響範囲）

- **セーブ保存** (`PUT /save`) → `leaderboard_cache` 自動更新（saveService内）
- **拠点帰還** → `arena_snapshots` 更新（プレイヤーの最新ステータスを反映）
- **装備変更/スキル取得** → `calculatePlayerStats()` 再計算が必要
- **ダンジョンクリア** → encyclopedia更新、実績チェック、報酬付与

## DBスキーマ

- `users`: ユーザー管理
- `save_data`: GameState全体をJSONBで格納（1ユーザー1セーブ）
- `leaderboard_cache`: セーブ保存時に自動更新されるランキングキャッシュ
- `arena_snapshots`: 闘技場用プレイヤーステータス（拠点帰還時に更新）
- `arena_battle_log`: 対戦履歴

## APIエンドポイント（ベース: `/api/v1`）

- `POST /auth/register|login|guest`, `GET /auth/me`
- `GET|PUT /save`
- `GET /leaderboard/:type`, `GET /leaderboard/:type/me`
- `GET /arena/opponents`, `POST /arena/battle`, `PUT /arena/snapshot`
- `GET /player/check-name/:name`
- `GET /health` — ヘルスチェック（DB接続確認含む）

## コーディング規約

- **関数名**: camelCase（`calculatePlayerStats()`）
- **定数**: UPPER_SNAKE_CASE（`LEVELUP_SKILLS`）
- **グローバルオブジェクト**: PascalCase（`GameState`, `Combat`, `Api`, `Auth`）
- **コメント/UI文字列**: 日本語
- **DOM操作**: innerHTML でバッチ更新。UI描画は`ui.js`に集約
- **数値フォーマット**: `formatNumber()`で日本語表記（万、億）
- **バックエンド**: CommonJS (`require`)、pgパラメータ化クエリ（$1, $2）

## Docker構成

```bash
docker compose up -d --build    # 起動
docker compose down             # 停止
docker compose logs -f backend  # バックエンドログ
```

Cloudflare Tunnel でフロントエンド (Nginx:80) に接続。Nginx が `/api/` をバックエンド (Express:3000) にプロキシ。

## 未実装/プレースホルダー

- ショップシステム（プレースホルダー通知のみ）
- 神社/転生システム（プレースホルダー通知のみ、`satoriBonuses` は GameState に存在）

## VPS・デプロイ情報

VPS接続情報・サーバー構成・デプロイ手順については **`VPS_INFO.md`** を参照すること。
