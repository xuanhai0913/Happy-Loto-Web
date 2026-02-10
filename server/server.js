const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://loto.hailamdev.space"],
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

// Serve audio files
app.use("/audio", express.static(path.join(__dirname, "../public/audio")));

// Serve React build in production
const clientBuild = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuild));

// ==================== GAME DATA ====================

const rooms = new Map();
// Map persistentId -> { socketId, roomCode } for reconnect
const playerSessions = new Map();
// Timeout handles for disconnected players (grace period)
const disconnectTimers = new Map();

const RECONNECT_GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes

// ==================== TICKET GENERATION ====================

function generateTicket() {
    const columnRanges = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
        [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
        [50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
        [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
        [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
        [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
    ];

    // 9 rows × 9 columns, each row has exactly 5 numbers
    for (let attempt = 0; attempt < 100; attempt++) {
        const ticket = Array.from({ length: 9 }, () => new Array(9).fill(null));
        const colCounts = new Array(9).fill(0);
        let valid = true;

        // Step 1: Assign 5 columns per row
        for (let row = 0; row < 9; row++) {
            const available = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
                (c) => colCounts[c] < columnRanges[c].length
            );
            if (available.length < 5) { valid = false; break; }

            const cols = available
                .sort(() => Math.random() - 0.5)
                .slice(0, 5)
                .sort((a, b) => a - b);

            cols.forEach((col) => {
                ticket[row][col] = -1; // placeholder
                colCounts[col]++;
            });
        }

        if (!valid) continue;

        // Step 2: Fill in actual numbers from column ranges
        for (let col = 0; col < 9; col++) {
            const count = colCounts[col];
            if (count === 0) continue;
            const shuffled = [...columnRanges[col]].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, count).sort((a, b) => a - b);

            let idx = 0;
            for (let row = 0; row < 9; row++) {
                if (ticket[row][col] === -1) {
                    ticket[row][col] = selected[idx++];
                }
            }
        }

        return ticket;
    }

    // Fallback: simple ticket if algorithm fails (should never happen)
    const ticket = Array.from({ length: 9 }, () => new Array(9).fill(null));
    for (let row = 0; row < 9; row++) {
        const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        cols.forEach((col) => {
            const range = columnRanges[col];
            ticket[row][col] = range[Math.floor(Math.random() * range.length)];
        });
    }
    return ticket;
}

function generateRoomCode() {
    let code;
    do {
        code = String(Math.floor(1000 + Math.random() * 9000));
    } while (rooms.has(code));
    return code;
}

function getAvailableNumber(room) {
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    const available = allNumbers.filter((n) => !room.calledNumbers.includes(n));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

// Get online player count for a room
function getOnlineCount(room) {
    let count = 0;
    for (const [, pData] of room.players) {
        if (pData.online) count++;
    }
    return count;
}

// Build player list for host
function getPlayerList(room) {
    const list = [];
    for (const [pid, pData] of room.players) {
        list.push({
            id: pid,
            name: pData.name,
            online: pData.online,
            joinedAt: pData.joinedAt,
        });
    }
    return list;
}

// ==================== SOCKET.IO ====================

io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // --- CREATE ROOM ---
    socket.on("create_room", (callback) => {
        const roomCode = generateRoomCode();
        const room = {
            hostId: socket.id,
            hostPersistentId: null,
            players: new Map(),
            calledNumbers: [],
            currentNumber: null,
            isPlaying: false,
            isPaused: false,
            winner: null,
            verifying: null, // { playerId, ticket, selectedNumbers, rowIndex, rowNumbers }
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isHost = true;

        console.log(`🏠 Room created: ${roomCode} by ${socket.id}`);
        callback({ success: true, roomCode });
    });

    // --- JOIN ROOM ---
    socket.on("join_room", ({ roomCode, persistentId, name }, callback) => {
        const room = rooms.get(roomCode);
        if (!room) {
            return callback({ success: false, error: "Phòng không tồn tại!" });
        }

        // Check if this is a reconnect
        if (persistentId && room.players.has(persistentId)) {
            const playerData = room.players.get(persistentId);

            // Cancel disconnect timer if any
            const timerKey = `${roomCode}:${persistentId}`;
            if (disconnectTimers.has(timerKey)) {
                clearTimeout(disconnectTimers.get(timerKey));
                disconnectTimers.delete(timerKey);
            }

            // Update socket mapping
            playerData.socketId = socket.id;
            playerData.online = true;
            socket.join(roomCode);
            socket.roomCode = roomCode;
            socket.isHost = false;
            socket.persistentId = persistentId;
            playerSessions.set(persistentId, { socketId: socket.id, roomCode });

            console.log(`🔄 Player ${persistentId} RECONNECTED to room ${roomCode}`);

            // Send back full state
            callback({
                success: true,
                reconnected: true,
                ticket: playerData.ticket,
                playerId: persistentId,
                selectedNumbers: playerData.selectedNumbers || [],
                calledNumbers: room.calledNumbers,
                currentNumber: room.currentNumber,
                isPlaying: room.isPlaying,
                isPaused: room.isPaused,
                winner: room.winner,
            });

            // Notify host
            io.to(roomCode).emit("player_joined", {
                playerCount: room.players.size,
                onlineCount: getOnlineCount(room),
                players: getPlayerList(room),
            });
            return;
        }

        // Block joining if game is already in progress (new player)
        if (room.isPlaying && room.calledNumbers.length > 0) {
            return callback({ success: false, error: "Game đang chạy, không thể vào!" });
        }

        const ticket = generateTicket();
        const pid = persistentId || crypto.randomUUID();
        const playerName = name || `Khách ${room.players.size + 1}`;

        room.players.set(pid, {
            socketId: socket.id,
            ticket,
            selectedNumbers: [],
            name: playerName,
            online: true,
            joinedAt: Date.now(),
        });

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isHost = false;
        socket.persistentId = pid;
        playerSessions.set(pid, { socketId: socket.id, roomCode });

        // Notify everyone about player count
        io.to(roomCode).emit("player_joined", {
            playerCount: room.players.size,
            onlineCount: getOnlineCount(room),
            players: getPlayerList(room),
        });

        console.log(`👤 Player ${pid} (${playerName}) joined room ${roomCode} (${room.players.size} players)`);
        callback({ success: true, ticket, playerId: pid });
    });

    // --- SYNC SELECTED NUMBERS (for reconnect) ---
    socket.on("sync_selected", ({ roomCode, selectedNumbers }) => {
        const room = rooms.get(roomCode);
        if (!room || !socket.persistentId) return;
        const player = room.players.get(socket.persistentId);
        if (player) {
            player.selectedNumbers = selectedNumbers;
        }
    });

    // --- START GAME ---
    socket.on("start_game", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.isPlaying = true;
        room.isPaused = false;
        room.winner = null;
        room.verifying = null;
        io.to(roomCode).emit("game_started");
        console.log(`🎮 Game started in room ${roomCode}`);
    });

    // --- CALL NUMBER ---
    socket.on("call_number", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id || !room.isPlaying || room.isPaused) return;
        // Block calling if verification is in progress
        if (room.verifying) return;

        const number = getAvailableNumber(room);
        if (number === null) {
            io.to(roomCode).emit("game_over", { message: "Đã hết số!" });
            return;
        }

        room.calledNumbers.push(number);
        room.currentNumber = number;

        io.to(roomCode).emit("number_called", {
            number,
            calledNumbers: [...room.calledNumbers],
            totalCalled: room.calledNumbers.length,
        });

        console.log(`🔢 Room ${roomCode}: Called number ${number} (${room.calledNumbers.length}/90)`);
    });

    // --- PAUSE GAME ---
    socket.on("pause_game", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.isPaused = true;
        io.to(roomCode).emit("game_paused");
        console.log(`⏸️ Game paused in room ${roomCode}`);
    });

    // --- RESUME GAME ---
    socket.on("resume_game", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.isPaused = false;
        io.to(roomCode).emit("game_resumed");
        console.log(`▶️ Game resumed in room ${roomCode}`);
    });

    // --- RESET GAME ---
    socket.on("reset_game", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.calledNumbers = [];
        room.currentNumber = null;
        room.isPlaying = false;
        room.isPaused = false;
        room.winner = null;
        room.verifying = null;

        // Generate new tickets for all players
        for (const [, playerData] of room.players) {
            playerData.ticket = generateTicket();
            playerData.selectedNumbers = [];
        }

        // Send new tickets to each player
        for (const [pid, playerData] of room.players) {
            if (playerData.online && playerData.socketId) {
                io.to(playerData.socketId).emit("game_reset", { ticket: playerData.ticket });
            }
        }

        io.to(roomCode).emit("game_reset_broadcast");
        console.log(`🔄 Game reset in room ${roomCode}`);
    });

    // --- CHECK WIN ("KINH") with PUBLIC VERIFICATION ---
    socket.on("check_win", ({ roomCode, rowNumbers, rowIndex, selectedNumbers: userSelected }, callback) => {
        const room = rooms.get(roomCode);
        if (!room) return callback({ success: false, error: "Phòng không tồn tại!" });

        const pid = socket.persistentId;
        const player = room.players.get(pid);
        if (!player) return callback({ success: false, error: "Bạn không trong phòng!" });

        if (room.winner) {
            return callback({ success: false, error: "Game đã có người thắng!" });
        }

        if (room.verifying) {
            return callback({ success: false, error: "Đang dò vé người khác, chờ chút!" });
        }

        console.log(`🎯 Player ${pid} claims KINH with row ${rowIndex}: [${rowNumbers.join(", ")}]`);
        console.log(`   Called numbers: [${room.calledNumbers.join(", ")}]`);

        // STEP 1: Pause game & broadcast VERIFICATION START
        room.isPaused = true;
        room.verifying = {
            playerId: pid,
            playerName: player.name,
            ticket: player.ticket,
            selectedNumbers: userSelected || [],
            rowIndex,
            rowNumbers,
        };

        // Broadcast to everyone: "ĐANG DÒ VÉ!"
        io.to(roomCode).emit("verification_start", {
            playerId: pid,
            playerName: player.name,
            ticket: player.ticket,
            selectedNumbers: userSelected || [],
            rowIndex,
            rowNumbers,
            calledNumbers: [...room.calledNumbers],
        });

        console.log(`🔍 Verification started for player ${pid} in room ${roomCode}`);

        // STEP 2: After 3 seconds, do actual validation and broadcast result
        setTimeout(() => {
            const isValid = rowNumbers.every((num) =>
                room.calledNumbers.includes(num)
            );

            const ticketRow = player.ticket[rowIndex];
            const ticketNumbers = ticketRow.filter((n) => n !== null);
            const isOnTicket = rowNumbers.every((num) => ticketNumbers.includes(num));

            if (isValid && isOnTicket && rowNumbers.length === 5) {
                // WINNER!
                room.winner = pid;
                room.isPlaying = false;
                room.verifying = null;

                io.to(roomCode).emit("verification_result", {
                    valid: true,
                    playerId: pid,
                    playerName: player.name,
                    rowNumbers,
                    rowIndex,
                });

                console.log(`🏆 WINNER! Player ${pid} in room ${roomCode}!`);
            } else {
                // FALSE ALARM
                const invalidNumbers = rowNumbers.filter(
                    (num) => !room.calledNumbers.includes(num)
                );

                room.verifying = null;
                room.isPaused = false;

                io.to(roomCode).emit("verification_result", {
                    valid: false,
                    playerId: pid,
                    playerName: player.name,
                    invalidNumbers,
                    rowNumbers,
                    rowIndex,
                });

                io.to(roomCode).emit("game_resumed");

                console.log(`❌ FALSE ALARM by ${pid} - Invalid: [${invalidNumbers.join(", ")}]`);
            }
        }, 3500); // 3.5 second dramatic pause for verification

        callback({ success: true, message: "Đang dò vé..." });
    });

    // --- QUICK CHAT ---
    socket.on("quick_chat", ({ roomCode, emoji, text }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const pid = socket.persistentId || socket.id;
        const player = room.players.get(pid);
        const playerName = player?.name || "Chủ phòng";

        io.to(roomCode).emit("chat_message", {
            playerId: pid,
            playerName,
            emoji,
            text,
            timestamp: Date.now(),
        });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
        console.log(`🔌 Disconnected: ${socket.id}`);

        if (socket.roomCode) {
            const room = rooms.get(socket.roomCode);
            if (room) {
                if (socket.isHost) {
                    // Host left - destroy room
                    io.to(socket.roomCode).emit("room_closed", {
                        message: "Chủ phòng đã rời đi!",
                    });
                    // Clean up player sessions
                    for (const [pid] of room.players) {
                        playerSessions.delete(pid);
                    }
                    rooms.delete(socket.roomCode);
                    console.log(`🗑️ Room ${socket.roomCode} destroyed (host left)`);
                } else if (socket.persistentId) {
                    // Player disconnected - set offline, start grace timer
                    const player = room.players.get(socket.persistentId);
                    if (player) {
                        player.online = false;
                        player.socketId = null;

                        // Start grace period timer
                        const timerKey = `${socket.roomCode}:${socket.persistentId}`;
                        const timer = setTimeout(() => {
                            // If still offline after grace period, remove
                            const rm = rooms.get(socket.roomCode);
                            if (rm) {
                                const p = rm.players.get(socket.persistentId);
                                if (p && !p.online) {
                                    rm.players.delete(socket.persistentId);
                                    playerSessions.delete(socket.persistentId);
                                    io.to(socket.roomCode).emit("player_left", {
                                        playerCount: rm.players.size,
                                        onlineCount: getOnlineCount(rm),
                                        players: getPlayerList(rm),
                                    });
                                    console.log(`🗑️ Player ${socket.persistentId} removed after timeout`);
                                }
                            }
                            disconnectTimers.delete(timerKey);
                        }, RECONNECT_GRACE_PERIOD);

                        disconnectTimers.set(timerKey, timer);

                        io.to(socket.roomCode).emit("player_left", {
                            playerCount: room.players.size,
                            onlineCount: getOnlineCount(room),
                            players: getPlayerList(room),
                        });
                        console.log(`😴 Player ${socket.persistentId} offline (grace: ${RECONNECT_GRACE_PERIOD / 1000}s)`);
                    }
                }
            }
        }
    });
});

// --- CATCH-ALL: serve React app ---
app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🎰 Happy Loto Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
