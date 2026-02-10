import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../socket";

// Generate or retrieve a persistent player ID
function getPersistentId() {
    let id = localStorage.getItem("loto_player_id");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("loto_player_id", id);
    }
    return id;
}

export default function Home() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState(
        () => localStorage.getItem("loto_player_name") || ""
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-join from QR code url param
    useEffect(() => {
        const roomParam = searchParams.get("room");
        if (roomParam && roomParam.length === 4) {
            setRoomCode(roomParam);
            handleJoinRoom(roomParam);
        }

        // Check for saved session to auto-reconnect
        const savedRoom = sessionStorage.getItem("loto_room");
        const savedIsHost = sessionStorage.getItem("loto_is_host");
        if (savedRoom && !roomParam) {
            if (savedIsHost === "true") {
                // Can't reconnect as host easily - skip
            } else {
                setRoomCode(savedRoom);
                handleJoinRoom(savedRoom);
            }
        }
    }, []);

    const handleCreateRoom = () => {
        setLoading(true);
        setError("");
        socket.emit("create_room", (response) => {
            setLoading(false);
            if (response.success) {
                sessionStorage.setItem("loto_room", response.roomCode);
                sessionStorage.setItem("loto_is_host", "true");
                navigate(`/host/${response.roomCode}`);
            } else {
                setError("Không thể tạo phòng. Thử lại!");
            }
        });
    };

    const handleJoinRoom = (code) => {
        const joinCode = code || roomCode;
        if (joinCode.length !== 4) {
            setError("Mã phòng phải có 4 chữ số!");
            return;
        }

        const name = playerName.trim() || undefined;
        if (name) localStorage.setItem("loto_player_name", name);

        setLoading(true);
        setError("");
        const persistentId = getPersistentId();

        socket.emit(
            "join_room",
            { roomCode: joinCode, persistentId, name },
            (response) => {
                setLoading(false);
                if (response.success) {
                    sessionStorage.setItem("loto_room", joinCode);
                    sessionStorage.setItem("loto_is_host", "false");

                    navigate(`/play/${joinCode}`, {
                        state: {
                            ticket: response.ticket,
                            playerId: response.playerId,
                            reconnected: response.reconnected || false,
                            savedSelected: response.selectedNumbers || [],
                            calledNumbers: response.calledNumbers || [],
                            currentNumber: response.currentNumber || null,
                            isPlaying: response.isPlaying || false,
                            isPaused: response.isPaused || false,
                            winner: response.winner || null,
                        },
                    });
                } else {
                    setError(response.error || "Không thể vào phòng!");
                }
            }
        );
    };

    const handleCodeInput = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
        setRoomCode(val);
        setError("");
    };

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🏮</div>
                <div className="absolute top-20 right-16 text-5xl opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🧧</div>
                <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🎋</div>
                <div className="absolute bottom-32 right-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>🎆</div>
                <div className="absolute top-1/3 left-1/4 text-4xl opacity-10 animate-pulse">✨</div>
                <div className="absolute top-1/2 right-1/4 text-4xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>🌸</div>
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-md space-y-8">
                {/* Logo & Title */}
                <div className="text-center space-y-3">
                    <div className="text-7xl mb-4">🎰</div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-tet-gold via-tet-gold-light to-tet-gold bg-clip-text text-transparent">
                        HAPPY LOTO
                    </h1>
                    <p className="text-tet-gold/60 text-sm font-medium tracking-widest uppercase">
                        🎊 Xuân Bính Ngọ • Lô Tô Online 🎊
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="h-px w-12 bg-gradient-to-r from-transparent to-tet-gold/40"></span>
                        <span className="text-tet-gold/60 text-xs">❖</span>
                        <span className="h-px w-12 bg-gradient-to-l from-transparent to-tet-gold/40"></span>
                    </div>
                </div>

                {/* Create Room */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-bold text-tet-gold flex items-center gap-2">
                        <span>🏠</span> Tạo Phòng Mới
                    </h2>
                    <p className="text-white/50 text-sm">
                        Bạn sẽ là chủ xị, quay số và điều khiển ván chơi.
                    </p>
                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="btn-primary w-full text-lg disabled:opacity-50"
                    >
                        {loading ? "⏳ Đang tạo..." : "🎲 TẠO PHÒNG"}
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                    <span className="flex-1 h-px bg-white/10"></span>
                    <span className="text-white/30 text-sm font-medium">HOẶC</span>
                    <span className="flex-1 h-px bg-white/10"></span>
                </div>

                {/* Join Room */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-bold text-tet-gold flex items-center gap-2">
                        <span>🎟️</span> Vào Phòng
                    </h2>

                    {/* Player name */}
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Tên của bạn (tùy chọn)"
                        maxLength={20}
                        className="w-full bg-tet-bg border border-white/10 rounded-xl px-4 py-2.5
                       text-sm text-white placeholder:text-white/20
                       focus:outline-none focus:border-tet-gold/40 transition-colors"
                    />

                    <div className="flex gap-3">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={roomCode}
                            onChange={handleCodeInput}
                            placeholder="Mã phòng"
                            maxLength={4}
                            className="flex-1 bg-tet-bg border-2 border-tet-gold/30 rounded-xl px-4 py-3
                         text-center text-2xl font-bold text-tet-gold tracking-[0.5em]
                         placeholder:text-white/20 placeholder:text-base placeholder:tracking-normal
                         focus:outline-none focus:border-tet-gold transition-colors"
                        />
                        <button
                            onClick={() => handleJoinRoom()}
                            disabled={loading || roomCode.length !== 4}
                            className="btn-danger px-6 disabled:opacity-50"
                        >
                            VÀO
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3 text-center text-red-300 text-sm animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                <p className="text-center text-white/20 text-xs pt-4">
                    Made with ❤️ for Tết 2026 • Happy Loto v1.0
                </p>
            </div>
        </div>
    );
}
