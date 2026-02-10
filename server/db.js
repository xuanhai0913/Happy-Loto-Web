const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "loto.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// ==================== SCHEMA ====================

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    player_count INTEGER NOT NULL DEFAULT 0,
    numbers_called INTEGER NOT NULL DEFAULT 0,
    winner_name TEXT,
    winner_persistent_id TEXT,
    winning_numbers TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    persistent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_false_alarms INTEGER DEFAULT 0,
    last_played_at DATETIME
  );
`);

// ==================== PREPARED STATEMENTS ====================

const stmts = {
    insertGame: db.prepare(`
    INSERT INTO games (room_code, player_count, numbers_called, winner_name, winner_persistent_id, winning_numbers, ended_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `),

    upsertPlayer: db.prepare(`
    INSERT INTO player_stats (persistent_id, name, total_games, total_wins, total_false_alarms, last_played_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(persistent_id) DO UPDATE SET
      name = excluded.name,
      total_games = total_games + excluded.total_games,
      total_wins = total_wins + excluded.total_wins,
      total_false_alarms = total_false_alarms + excluded.total_false_alarms,
      last_played_at = datetime('now')
  `),

    getLeaderboard: db.prepare(`
    SELECT persistent_id, name, total_games, total_wins, total_false_alarms,
           CASE WHEN total_games > 0 THEN ROUND(total_wins * 100.0 / total_games, 1) ELSE 0 END AS win_rate
    FROM player_stats
    WHERE total_games > 0
    ORDER BY total_wins DESC, win_rate DESC, total_games DESC
    LIMIT ?
  `),

    getRecentGames: db.prepare(`
    SELECT id, room_code, player_count, numbers_called, winner_name, winning_numbers, ended_at
    FROM games
    ORDER BY id DESC
    LIMIT ?
  `),

    getTotalStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM games) AS total_games,
      (SELECT COUNT(*) FROM player_stats WHERE total_games > 0) AS total_players,
      (SELECT COUNT(*) FROM games WHERE winner_name IS NOT NULL) AS games_with_winner,
      (SELECT AVG(numbers_called) FROM games WHERE winner_name IS NOT NULL) AS avg_numbers_to_win
  `),
};

// ==================== API FUNCTIONS ====================

/**
 * Record a completed game (when someone wins or game ends)
 */
function recordGame({ roomCode, playerCount, numbersCalled, winnerName, winnerPersistentId, winningNumbers }) {
    try {
        stmts.insertGame.run(
            roomCode,
            playerCount,
            numbersCalled,
            winnerName || null,
            winnerPersistentId || null,
            winningNumbers ? JSON.stringify(winningNumbers) : null
        );
        console.log(`📊 Game recorded: room=${roomCode}, winner=${winnerName || "none"}`);
    } catch (err) {
        console.error("❌ Error recording game:", err.message);
    }
}

/**
 * Update player stats (call when game starts for all participants)
 */
function recordPlayerGame(persistentId, name) {
    try {
        stmts.upsertPlayer.run(persistentId, name, 1, 0, 0);
    } catch (err) {
        console.error("❌ Error recording player game:", err.message);
    }
}

/**
 * Record a win for a player
 */
function recordPlayerWin(persistentId, name) {
    try {
        stmts.upsertPlayer.run(persistentId, name, 0, 1, 0);
    } catch (err) {
        console.error("❌ Error recording player win:", err.message);
    }
}

/**
 * Record a false alarm for a player
 */
function recordFalseAlarm(persistentId, name) {
    try {
        stmts.upsertPlayer.run(persistentId, name, 0, 0, 1);
    } catch (err) {
        console.error("❌ Error recording false alarm:", err.message);
    }
}

/**
 * Get leaderboard (top N players)
 */
function getLeaderboard(limit = 20) {
    return stmts.getLeaderboard.all(limit);
}

/**
 * Get recent games
 */
function getRecentGames(limit = 20) {
    const games = stmts.getRecentGames.all(limit);
    return games.map((g) => ({
        ...g,
        winning_numbers: g.winning_numbers ? JSON.parse(g.winning_numbers) : null,
    }));
}

/**
 * Get overall stats
 */
function getStats() {
    const row = stmts.getTotalStats.get();
    return {
        totalGames: row.total_games || 0,
        totalPlayers: row.total_players || 0,
        gamesWithWinner: row.games_with_winner || 0,
        avgNumbersToWin: row.avg_numbers_to_win ? Math.round(row.avg_numbers_to_win) : 0,
    };
}

module.exports = {
    recordGame,
    recordPlayerGame,
    recordPlayerWin,
    recordFalseAlarm,
    getLeaderboard,
    getRecentGames,
    getStats,
};
