import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../socket";
import Trophy3D from "../components/Trophy3D";

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

    // Pre-fill room code from QR code url param (don't auto-join — let user enter name)
    useEffect(() => {
        const roomParam = searchParams.get("room");
        if (roomParam && roomParam.length === 4) {
            setRoomCode(roomParam);
            // Don't auto-join: let user enter their name first
            return;
        }

        // Check for saved session to auto-reconnect (name already saved)
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
        <div
            className="min-h-dvh flex flex-col"
            style={{
                fontFamily: "'Quicksand', sans-serif",
                background: "linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 50%, #FFF7ED 100%)",
            }}
        >
            {/* Decorative blurred circles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 128, height: 128, top: 40, left: 40,
                        background: "rgba(251, 191, 36, 0.15)",
                        filter: "blur(40px)",
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 192, height: 192, bottom: 80, right: 40,
                        background: "rgba(251, 146, 60, 0.12)",
                        filter: "blur(60px)",
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 96, height: 96, top: "33%", left: "25%",
                        background: "rgba(253, 224, 71, 0.15)",
                        filter: "blur(30px)",
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 160, height: 160, top: 80, right: "25%",
                        background: "rgba(252, 165, 165, 0.1)",
                        filter: "blur(40px)",
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-lg mx-auto">

                {/* Header / Logo */}
                <header className="text-center mb-8">
                    <div className="mx-auto w-24 h-24 mb-4">
                        <img
                            src="/images/loto-logo.png"
                            alt="Happy Loto"
                            className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h1
                        className="text-4xl md:text-5xl font-bold tracking-wide mb-2 uppercase"
                        style={{ color: "#EAB308", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                    >
                        Happy Loto
                    </h1>
                    <p
                        className="font-medium tracking-widest text-sm uppercase"
                        style={{ color: "#FB923C" }}
                    >
                        🎊 Xuân Bính Ngọ • Lô Tô Online 🎊
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="w-12 h-px opacity-50" style={{ background: "#FDBA74" }} />
                        <span
                            className="text-xl leading-none"
                            style={{ color: "#FDBA74", transform: "rotate(45deg)", display: "inline-block" }}
                        >
                            ❖
                        </span>
                        <span className="w-12 h-px opacity-50" style={{ background: "#FDBA74" }} />
                    </div>
                </header>

                {/* Cards */}
                <main className="w-full space-y-6">

                    {/* Create Room Card */}
                    <div
                        className="rounded-2xl shadow-xl p-6 md:p-8 transition-transform duration-300 hover:-translate-y-1"
                        style={{ background: "#FFFFFF" }}
                    >
                        <h2
                            className="text-xl font-bold mb-2"
                            style={{ color: "#F97316" }}
                        >
                            Tạo Phòng Mới
                        </h2>
                        <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
                            Bạn sẽ là chủ xị, quay số và điều khiển ván chơi.
                        </p>
                        <button
                            onClick={handleCreateRoom}
                            disabled={loading}
                            className="w-full font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-lg uppercase tracking-wide disabled:opacity-50 cursor-pointer"
                            style={{
                                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                                color: "#FFFFFF",
                            }}
                        >
                            {loading ? "Đang tạo..." : "Tạo Phòng"}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4 text-sm font-medium uppercase tracking-wider">
                        <span className="h-px w-full" style={{ background: "#D1D5DB" }} />
                        <span style={{ color: "#9CA3AF" }}>Hoặc</span>
                        <span className="h-px w-full" style={{ background: "#D1D5DB" }} />
                    </div>

                    {/* Join Room Card */}
                    <div
                        className="rounded-2xl shadow-xl p-6 md:p-8 transition-transform duration-300 hover:-translate-y-1"
                        style={{ background: "#FFFFFF" }}
                    >
                        <h2
                            className="text-xl font-bold mb-6"
                            style={{ color: "#F97316" }}
                        >
                            Vào Phòng
                        </h2>

                        <div className="space-y-4">
                            {/* Player name */}
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Tên của bạn (tùy chọn)"
                                maxLength={20}
                                className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                style={{
                                    background: "#FFF7ED",
                                    border: "1px solid #FED7AA",
                                    color: "#374151",
                                }}
                            />

                            {/* Room code */}
                            <input
                                type="text"
                                inputMode="numeric"
                                value={roomCode}
                                onChange={handleCodeInput}
                                placeholder="Mã phòng"
                                maxLength={4}
                                className="w-full rounded-xl px-4 py-3 text-center font-bold text-2xl tracking-[0.5em] transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                style={{
                                    background: "#FFF7ED",
                                    border: "2px solid #FDBA74",
                                    color: "#D97706",
                                }}
                            />

                            {/* Join button */}
                            <button
                                onClick={() => handleJoinRoom()}
                                disabled={loading || roomCode.length !== 4}
                                className="w-full font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-lg uppercase tracking-wide mt-2 disabled:opacity-50 cursor-pointer"
                                style={{
                                    background: "linear-gradient(135deg, #FB7185, #E11D48)",
                                    color: "#FFFFFF",
                                }}
                            >
                                Vào
                            </button>
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="flex flex-col items-center">
                        <Trophy3D size={120} />
                        <button
                            onClick={() => navigate("/leaderboard")}
                            className="w-full font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer hover:-translate-y-0.5 -mt-2"
                            style={{
                                background: "#FFFFFF",
                                color: "#F97316",
                            }}
                        >
                            <span
                                className="material-icons-round group-hover:scale-110 transition-transform"
                                style={{ fontSize: 24 }}
                            >
                                emoji_events
                            </span>
                            Bảng Xếp Hạng
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="rounded-xl p-3 text-center text-sm animate-shake"
                            style={{
                                background: "#FEF2F2",
                                border: "1px solid #FCA5A5",
                                color: "#DC2626",
                            }}
                        >
                            {error}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="mt-12 text-center space-y-2" style={{ opacity: 0.7 }}>
                    <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                        Made with <span className="text-rose-500 animate-pulse">❤</span> for Tết 2026 • Happy Loto v1.0
                    </p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                        © 2026{" "}
                        <a
                            href="https://www.hailamdev.space/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: "#FB923C" }}
                        >
                            Hailamdev
                        </a>
                        {" "}• All rights reserved
                    </p>
                </footer>
            </div>
        </div>
    );
}
