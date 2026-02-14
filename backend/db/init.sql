-- 妖怪退魔録 データベーススキーマ

-- ユーザー
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(20) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(30) NOT NULL,
    is_guest        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ DEFAULT NOW()
);

-- セーブデータ（GameState全体をJSONBで格納、1ユーザー1セーブ）
CREATE TABLE save_data (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    version   VARCHAR(20) DEFAULT '1.0.0',
    save_data JSONB NOT NULL,
    saved_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ランキングキャッシュ（セーブ保存時に自動更新）
CREATE TABLE leaderboard_cache (
    user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name         VARCHAR(30) NOT NULL,
    highest_floor_infinite INTEGER DEFAULT 0,
    total_clears         INTEGER DEFAULT 0,
    arena_rank           INTEGER DEFAULT 1000,
    arena_wins           INTEGER DEFAULT 0,
    achievement_count    INTEGER DEFAULT 0,
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 闘技場スナップショット（拠点帰還時に更新、対戦相手取得用）
CREATE TABLE arena_snapshots (
    user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name   VARCHAR(30) NOT NULL,
    level          INTEGER DEFAULT 1,
    atk            INTEGER DEFAULT 10,
    def            INTEGER DEFAULT 5,
    hp             INTEGER DEFAULT 100,
    crit_rate      REAL DEFAULT 5.0,
    weapon_element VARCHAR(20),
    weapon_name    VARCHAR(50),
    arena_rank     INTEGER DEFAULT 1000,
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 闘技場戦闘ログ
CREATE TABLE arena_battle_log (
    id           SERIAL PRIMARY KEY,
    attacker_id  INTEGER REFERENCES users(id),
    defender_id  INTEGER REFERENCES users(id),
    attacker_won BOOLEAN NOT NULL,
    rank_change  INTEGER,
    fought_at    TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_leaderboard_infinite ON leaderboard_cache(highest_floor_infinite DESC);
CREATE INDEX idx_leaderboard_clears ON leaderboard_cache(total_clears DESC);
CREATE INDEX idx_leaderboard_arena ON leaderboard_cache(arena_rank ASC);
CREATE INDEX idx_arena_snapshots_rank ON arena_snapshots(arena_rank);
CREATE INDEX idx_arena_battle_log_attacker ON arena_battle_log(attacker_id, fought_at DESC);
CREATE INDEX idx_arena_battle_log_defender ON arena_battle_log(defender_id, fought_at DESC);
