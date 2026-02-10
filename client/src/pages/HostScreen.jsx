import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import socket from "../socket";
import NumberBoard from "../components/NumberBoard";
import QuickChat from "../components/QuickChat";
import VerificationModal from "../components/VerificationModal";
import BackgroundMusic from "../components/BackgroundMusic";

const DOMAIN = window.location.origin;

export default function HostScreen() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [playerCount, setPlayerCount] = useState(0);
    const [onlineCount, setOnlineCount] = useState(0);
    const [players, setPlayers] = useState([]);
    const [calledNumbers, setCalledNumbers] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [winner, setWinner] = useState(null);
    const [showNumberAnim, setShowNumberAnim] = useState(false);
    const [isCallingNumber, setIsCallingNumber] = useState(false);
    const [verification, setVerification] = useState(null);
    const [showPlayers, setShowPlayers] = useState(false);

    useEffect(() => {
        socket.on("player_joined", ({ playerCount: pc, onlineCount: oc, players: pl }) => {
            setPlayerCount(pc);
            setOnlineCount(oc);
            if (pl) setPlayers(pl);
        });

        socket.on("player_left", ({ playerCount: pc, onlineCount: oc, players: pl }) => {
            setPlayerCount(pc);
            setOnlineCount(oc);
            if (pl) setPlayers(pl);
        });

        socket.on("number_called", ({ number, calledNumbers: all }) => {
            setCurrentNumber(number);
            setCalledNumbers(all);
            setShowNumberAnim(true);
            setIsCallingNumber(false);
            setTimeout(() => setShowNumberAnim(false), 600);

            // Play audio
            const audio = new Audio(`/audio/num_${number}.mp3`);
            audio.play().catch(() => { });
        });

        socket.on("game_started", () => {
            setIsPlaying(true);
            setIsPaused(false);
        });

        socket.on("game_paused", () => setIsPaused(true));
        socket.on("game_resumed", () => setIsPaused(false));

        socket.on("game_reset_broadcast", () => {
            setCalledNumbers([]);
            setCurrentNumber(null);
            setIsPlaying(false);
            setIsPaused(false);
            setWinner(null);
            setVerification(null);
        });

        // VERIFICATION FLOW
        socket.on("verification_start", (data) => {
            setVerification({ ...data, result: null });
        });

        socket.on("verification_result", (data) => {
            setVerification((prev) => (prev ? { ...prev, result: data } : null));

            if (data.valid) {
                setWinner({ playerId: data.playerId, playerName: data.playerName, rowNumbers: data.rowNumbers });
                setIsPlaying(false);
            }

            setTimeout(() => setVerification(null), 4000);
        });

        socket.on("game_over", () => setIsPlaying(false));

        return () => {
            socket.off("player_joined");
            socket.off("player_left");
            socket.off("number_called");
            socket.off("game_started");
            socket.off("game_paused");
            socket.off("game_resumed");
            socket.off("game_reset_broadcast");
            socket.off("verification_start");
            socket.off("verification_result");
            socket.off("game_over");
        };
    }, []);

    const handleStart = () => socket.emit("start_game", { roomCode });

    const handleCallNumber = () => {
        if (isCallingNumber) return;
        setIsCallingNumber(true);
        socket.emit("call_number", { roomCode });
    };

    const handlePause = () => {
        if (isPaused) {
            socket.emit("resume_game", { roomCode });
        } else {
            socket.emit("pause_game", { roomCode });
        }
    };

    const handleReset = () => {
        if (window.confirm("Bạn có chắc muốn reset ván chơi?")) {
            socket.emit("reset_game", { roomCode });
        }
    };

    const joinLink = `${DOMAIN}/?room=${roomCode}`;

    return (
        <div className="min-h-dvh flex flex-col">
            {/* Header */}
            <header className="bg-tet-card border-b border-tet-gold/20 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎰</span>
                        <div>
                            <h1 className="text-lg font-bold text-tet-gold">HAPPY LOTO</h1>
                            <p className="text-xs text-white/40">Chủ phòng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <BackgroundMusic />
                        <div className="text-center">
                            <p className="text-xs text-white/40">Mã phòng</p>
                            <p className="text-2xl font-black text-tet-gold tracking-widest">{roomCode}</p>
                        </div>
                        <button
                            onClick={() => setShowPlayers(!showPlayers)}
                            className="text-center cursor-pointer hover:bg-white/5 px-2 py-1 rounded-lg transition-all"
                        >
                            <p className="text-xs text-white/40">Người chơi</p>
                            <p className="text-2xl font-black text-tet-gold">
                                {onlineCount}<span className="text-sm text-white/30">/{playerCount}</span>
                            </p>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4 pb-20">
                {/* Player List Dropdown */}
                {showPlayers && (
                    <div className="card space-y-2">
                        <h3 className="text-sm font-bold text-tet-gold flex items-center gap-2">
                            <span>👥</span> Danh sách người chơi ({onlineCount} online / {playerCount} tổng)
                        </h3>
                        {players.length === 0 ? (
                            <p className="text-white/30 text-sm">Chưa có ai vào phòng</p>
                        ) : (
                            <div className="space-y-1">
                                {players.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg bg-white/5"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${p.online ? "bg-green-400" : "bg-gray-500"}`} />
                                        <span className={p.online ? "text-white/80" : "text-white/30"}>
                                            {p.name}
                                        </span>
                                        {!p.online && (
                                            <span className="text-[10px] text-white/20 ml-auto">mất kết nối</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Current Number Display */}
                <div className="card text-center py-8 relative overflow-hidden">
                    {currentNumber && (
                        <div className="absolute inset-0 bg-gradient-to-br from-tet-gold/10 via-transparent to-tet-red/10 pointer-events-none" />
                    )}

                    <p className="text-sm text-white/40 mb-2 relative z-10">
                        {isPlaying
                            ? isPaused
                                ? "⏸️ Tạm dừng"
                                : `Đã gọi ${calledNumbers.length}/90 số`
                            : "Chờ bắt đầu"}
                    </p>

                    <div
                        className={`relative z-10 inline-flex items-center justify-center w-32 h-32 rounded-full
            bg-gradient-to-br from-tet-gold to-tet-gold-dark text-tet-red-dark
            text-6xl font-black shadow-2xl shadow-tet-gold/30
            ${showNumberAnim ? "animate-number-reveal" : ""}
            ${currentNumber ? "animate-pulse-glow" : "opacity-30"}`}
                    >
                        {currentNumber || "?"}
                    </div>

                    {calledNumbers.length > 0 && (
                        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap relative z-10">
                            <span className="text-white/30 text-xs">Gần đây:</span>
                            {calledNumbers
                                .slice(-5)
                                .reverse()
                                .map((n, i) => (
                                    <span
                                        key={n}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full
                    text-sm font-bold ${i === 0
                                                ? "bg-tet-gold/20 text-tet-gold"
                                                : "bg-white/5 text-white/40"
                                            }`}
                                    >
                                        {n}
                                    </span>
                                ))}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                    {!isPlaying && calledNumbers.length === 0 && (
                        <button
                            onClick={handleStart}
                            disabled={playerCount === 0}
                            className="btn-primary col-span-2 text-lg disabled:opacity-50"
                        >
                            🎮 BẮT ĐẦU ({onlineCount} online)
                        </button>
                    )}

                    {isPlaying && (
                        <>
                            <button
                                onClick={handleCallNumber}
                                disabled={isPaused || isCallingNumber || !!verification}
                                className="btn-primary text-lg col-span-2 disabled:opacity-50"
                            >
                                {isCallingNumber
                                    ? "⏳ Đang quay..."
                                    : verification
                                        ? "🔍 Đang dò vé..."
                                        : "🎲 QUAY SỐ"}
                            </button>
                            <button onClick={handlePause} className="btn-danger">
                                {isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                            >
                                🔄 Ván mới
                            </button>
                        </>
                    )}

                    {!isPlaying && calledNumbers.length > 0 && !winner && (
                        <>
                            <button onClick={handleStart} className="btn-primary col-span-1">
                                ▶️ Tiếp tục
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                            >
                                🔄 Ván mới
                            </button>
                        </>
                    )}
                </div>

                {/* QR Code */}
                <div className="card flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl">
                        <QRCodeSVG value={joinLink} size={100} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-tet-gold mb-1">📱 Quét để vào phòng</p>
                        <p className="text-xs text-white/40 break-all">{joinLink}</p>
                        <button
                            onClick={() => navigator.clipboard?.writeText(joinLink)}
                            className="mt-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                            📋 Copy link
                        </button>
                    </div>
                </div>

                {/* Number Board */}
                <NumberBoard calledNumbers={calledNumbers} />

                {/* Winner Banner */}
                {winner && (
                    <div className="card bg-gradient-to-r from-tet-gold/20 to-tet-red/20 text-center py-8 space-y-3 border-tet-gold/40">
                        <div className="text-5xl">🏆</div>
                        <h2 className="text-2xl font-black text-tet-gold">KINH RỒI!</h2>
                        <p className="text-white/70">
                            🎉 {winner.playerName || "Người chơi"} đã thắng!
                        </p>
                        <p className="text-xs text-white/40">
                            Số thắng: [{winner.rowNumbers.join(", ")}]
                        </p>
                        <button onClick={handleReset} className="btn-primary mt-4">
                            🔄 Chơi ván mới
                        </button>
                    </div>
                )}
            </div>

            {/* Verification Modal */}
            {verification && (
                <VerificationModal data={verification} isMe={false} />
            )}

            {/* Quick Chat */}
            <QuickChat roomCode={roomCode} />
        </div>
    );
}
