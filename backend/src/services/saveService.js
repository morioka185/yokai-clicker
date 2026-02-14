const pool = require('../config/database');

const SaveService = {
    // セーブデータ取得
    async getSave(userId) {
        const result = await pool.query(
            'SELECT save_data, version, saved_at FROM save_data WHERE user_id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    },

    // セーブデータ保存 + ランキングキャッシュ更新
    async putSave(userId, saveData, version) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // UPSERT セーブデータ
            await client.query(
                `INSERT INTO save_data (user_id, save_data, version, saved_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET save_data = $2, version = $3, saved_at = NOW()`,
                [userId, JSON.stringify(saveData), version || '1.0.0']
            );

            // ランキングキャッシュ更新
            const displayName = saveData.player?.name || '退魔師';
            const highestFloorInfinite = saveData.player?.highestFloor?.infinite || 0;
            const totalClears = saveData.player?.totalClears || 0;
            const arenaRank = saveData.arena?.rank || 1000;
            const arenaWins = saveData.arena?.wins || 0;
            const achievementCount = saveData.encyclopedia?.achievements
                ? Object.keys(saveData.encyclopedia.achievements).length
                : 0;

            await client.query(
                `INSERT INTO leaderboard_cache (user_id, display_name, highest_floor_infinite, total_clears, arena_rank, arena_wins, achievement_count, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                    display_name = $2,
                    highest_floor_infinite = $3,
                    total_clears = $4,
                    arena_rank = $5,
                    arena_wins = $6,
                    achievement_count = $7,
                    updated_at = NOW()`,
                [userId, displayName, highestFloorInfinite, totalClears, arenaRank, arenaWins, achievementCount]
            );

            await client.query('COMMIT');
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};

module.exports = SaveService;
