const pool = require('../config/database');

const VALID_TYPES = {
    infinite: { column: 'highest_floor_infinite', order: 'DESC' },
    clears: { column: 'total_clears', order: 'DESC' },
    arena: { column: 'arena_rank', order: 'ASC' }
};

const LeaderboardService = {
    // ランキング取得（上位50件）
    async getLeaderboard(type) {
        const config = VALID_TYPES[type];
        if (!config) {
            throw { status: 400, message: '無効なランキングタイプです' };
        }

        const result = await pool.query(
            `SELECT user_id, display_name, ${config.column} AS score, arena_rank, total_clears, highest_floor_infinite
             FROM leaderboard_cache
             ORDER BY ${config.column} ${config.order}
             LIMIT 50`
        );

        return result.rows.map((row, i) => ({
            rank: i + 1,
            userId: row.user_id,
            displayName: row.display_name,
            score: row.score,
            arenaRank: row.arena_rank,
            totalClears: row.total_clears,
            highestFloorInfinite: row.highest_floor_infinite
        }));
    },

    // 自分の順位取得
    async getMyRank(type, userId) {
        const config = VALID_TYPES[type];
        if (!config) {
            throw { status: 400, message: '無効なランキングタイプです' };
        }

        // ユーザーのスコアを取得
        const userResult = await pool.query(
            `SELECT ${config.column} AS score FROM leaderboard_cache WHERE user_id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return { rank: null, score: 0 };
        }

        const myScore = userResult.rows[0].score;

        // 自分より上の人数をカウント
        const op = config.order === 'DESC' ? '>' : '<';
        const countResult = await pool.query(
            `SELECT COUNT(*) AS cnt FROM leaderboard_cache WHERE ${config.column} ${op} $1`,
            [myScore]
        );

        const rank = parseInt(countResult.rows[0].cnt) + 1;
        return { rank, score: myScore };
    }
};

module.exports = LeaderboardService;
