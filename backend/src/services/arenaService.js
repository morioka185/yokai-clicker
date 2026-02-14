const pool = require('../config/database');

const ArenaService = {
    // 同ランク帯の対戦相手3名を取得
    async getOpponents(userId) {
        // ユーザーの闘技場ランクを取得
        const userResult = await pool.query(
            'SELECT arena_rank FROM arena_snapshots WHERE user_id = $1',
            [userId]
        );
        const myRank = userResult.rows.length > 0 ? userResult.rows[0].arena_rank : 1000;

        // 自分を除いてランクの近い相手を取得
        const result = await pool.query(
            `SELECT user_id, display_name, level, atk, def, hp, crit_rate, weapon_element, weapon_name, arena_rank
             FROM arena_snapshots
             WHERE user_id != $1
             ORDER BY ABS(arena_rank - $2), RANDOM()
             LIMIT 3`,
            [userId, myRank]
        );

        return result.rows.map(row => ({
            userId: row.user_id,
            name: row.display_name,
            level: row.level,
            atk: row.atk,
            def: row.def,
            hp: row.hp,
            critRate: row.crit_rate,
            element: row.weapon_element,
            weaponName: row.weapon_name,
            rank: row.arena_rank
        }));
    },

    // 対戦結果報告
    async reportBattle(attackerId, defenderId, attackerWon, rankChange) {
        await pool.query(
            `INSERT INTO arena_battle_log (attacker_id, defender_id, attacker_won, rank_change)
             VALUES ($1, $2, $3, $4)`,
            [attackerId, defenderId, attackerWon, rankChange]
        );

        // 勝者のランクを更新
        if (attackerWon) {
            await pool.query(
                'UPDATE arena_snapshots SET arena_rank = GREATEST(1, arena_rank - $2) WHERE user_id = $1',
                [attackerId, Math.abs(rankChange)]
            );
        } else {
            await pool.query(
                'UPDATE arena_snapshots SET arena_rank = arena_rank + $2 WHERE user_id = $1',
                [attackerId, Math.abs(rankChange)]
            );
        }

        return { success: true };
    },

    // スナップショット更新
    async updateSnapshot(userId, snapshot) {
        await pool.query(
            `INSERT INTO arena_snapshots (user_id, display_name, level, atk, def, hp, crit_rate, weapon_element, weapon_name, arena_rank, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                display_name = $2, level = $3, atk = $4, def = $5, hp = $6,
                crit_rate = $7, weapon_element = $8, weapon_name = $9, arena_rank = $10, updated_at = NOW()`,
            [
                userId,
                snapshot.displayName || '退魔師',
                snapshot.level || 1,
                snapshot.atk || 10,
                snapshot.def || 5,
                snapshot.hp || 100,
                snapshot.critRate || 5.0,
                snapshot.weaponElement || null,
                snapshot.weaponName || null,
                snapshot.arenaRank || 1000
            ]
        );
        return { success: true };
    }
};

module.exports = ArenaService;
