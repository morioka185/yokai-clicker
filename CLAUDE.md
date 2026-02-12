# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**妖怪退魔録 〜無限百鬼夜行〜** — 和風ローグライク・ダンジョンクロウラー型クリッカーゲーム。
バニラJS（ES6+）のSPA。ビルドツール・バンドラー不使用。`index.html`をブラウザで直接開いて動作する。

## 開発方法

- **起動**: `index.html` をブラウザで開くだけ（サーバー不要）
- **ビルド/テスト**: なし（ビルドシステム・テストフレームワーク未導入）
- **保存データ**: localStorage（JSON）。Base64エクスポート/インポート対応

## アーキテクチャ

### グローバル状態管理
`GameState`（`state.js`）が唯一のグローバル状態オブジェクト。永続データ（player, inventory, equipped, shikigami, encyclopedia）とセッションデータ（dungeon）に分離。

### モジュール構成
クラスは使わず、名前空間オブジェクト（`Combat`, `Weapons`, `UI`, `Dungeon` 等）で機能を分離。各JSファイルが単一責務を持つ。

### スクリプト読み込み順序（`index.html`内）
1. **データ定義** (`js/data/`): enemies → equipment → skills → shikigami → dungeons
2. **基盤** : sound → state → utils
3. **ゲームロジック**: combat → weapons → dungeon → equipment → shikigami → smithy → gacha → arena → encyclopedia → save → ui
4. **エントリポイント**: main.js（最後に読み込み）

読み込み順序に依存関係があるため、新規ファイル追加時は`index.html`の`<script>`タグの位置に注意。

### ゲームループ
`requestAnimationFrame`ベース。delta time（フレーム間経過時間）で更新。`Weapons.update(dt)`, `Combat.update(timestamp)` 等が毎フレーム呼ばれる。

## 主要システム

### 戦闘 (`combat.js`)
- マルチエネミー（最大3体同時）、ゾーン制（左0/中央1/右2）
- エネミーごとに独立した攻撃タイマー
- プレイヤーステータスは装備+スキルから動的計算

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
フロア自動進行。敵ステータスはフロア番号でスケール。ボスフロアあり。無限モード対応。

### 装備 (`equipment.js`, `js/data/equipment.js`)
6スロット（武器/頭/体/手/足/お守り）。レアリティ6段階（コモン〜神話）。強化(+0〜+15)、エンチャント、錬成、進化。

### 式神 (`shikigami.js`)
16種。★1〜★5。パーティ3体編成。アクティブスキル（MP消費）+ パッシブバフ。

### スキル (`js/data/skills.js`)
ローグライク式レベルアップ時3択。武道/陰陽術/神通力の3カテゴリ。ダンジョンセッション内のみ有効。

## コーディング規約

- **関数名**: camelCase（`calculatePlayerStats()`）
- **定数**: UPPER_SNAKE_CASE（`LEVELUP_SKILLS`）
- **グローバルオブジェクト**: PascalCase（`GameState`, `Combat`）
- **コメント/UI文字列**: 日本語
- **DOM操作**: innerHTML でバッチ更新。UI描画は`ui.js`に集約
- **数値フォーマット**: `formatNumber()`で日本語表記（万、億）
- **ユーティリティ**: `utils.js`に汎用関数（`randomInt`, `weightedRandom`, `getTapZone`, `getElementMultiplier`等）

## 未実装/プレースホルダー

- ショップシステム（プレースホルダー通知のみ）
- 神社/転生システム（プレースホルダー通知のみ）
- 闘技場PvP（基本実装のみ）
