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
    const [showPlayers, setShowPlayers] = useState(true);
    const [isAutoSpin, setIsAutoSpin] = useState(false);
    const [autoSpinSpeed, setAutoSpinSpeed] = useState(5000);

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

        socket.on("game_over", () => {
            setIsPlaying(false);
            setIsAutoSpin(false);
        });

        socket.on("auto_spin_started", ({ speed }) => {
            setIsAutoSpin(true);
            setAutoSpinSpeed(speed);
        });

        socket.on("auto_spin_stopped", () => {
            setIsAutoSpin(false);
        });

        socket.on("game_reset_broadcast", () => {
            setIsAutoSpin(false);
        });

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
            socket.off("auto_spin_started");
            socket.off("auto_spin_stopped");
        };
    }, []);

    const handleStart = () => socket.emit("start_game", { roomCode });

    const handleCallNumber = () => {
        if (isCallingNumber || isAutoSpin) return;
        setIsCallingNumber(true);
        socket.emit("call_number", { roomCode });
    };

    const handleToggleAutoSpin = () => {
        if (isAutoSpin) {
            socket.emit("stop_auto_spin", { roomCode });
        } else {
            socket.emit("start_auto_spin", { roomCode, speed: autoSpinSpeed });
        }
    };

    const handleSpeedChange = (speed) => {
        setAutoSpinSpeed(speed);
        if (isAutoSpin) {
            // Restart with new speed
            socket.emit("start_auto_spin", { roomCode, speed });
        }
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
                        <img src="/images/loto-logo.png" alt="Happy Loto" className="w-10 h-10 rounded-lg" />
                        <div>
                            <h1 className="text-lg font-bold text-tet-gold">HAPPY LOTO</h1>
                            <p className="text-xs text-tet-cream/50">Chủ phòng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <BackgroundMusic />
                        <div className="text-center">
                            <p className="text-xs text-tet-cream/50">Mã phòng</p>
                            <p className="text-2xl font-black text-tet-gold tracking-widest">{roomCode}</p>
                        </div>
                        <button
                            onClick={() => setShowPlayers(!showPlayers)}
                            className="text-center cursor-pointer hover:bg-tet-cream/5 px-2 py-1 rounded-lg transition-all"
                        >
                            <p className="text-xs text-tet-cream/50">Người chơi</p>
                            <p className="text-2xl font-black text-tet-gold">
                                {onlineCount}<span className="text-sm text-tet-cream/40">/{playerCount}</span>
                            </p>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4 pb-20">
                {/* Player List Panel - Always visible */}
                <div className="card">
                    <button
                        onClick={() => setShowPlayers(!showPlayers)}
                        className="w-full flex items-center justify-between cursor-pointer"
                    >
                        <h3 className="text-sm font-bold text-tet-gold flex items-center gap-2">
                            Người chơi
                            <span className="bg-tet-gold/20 text-tet-gold text-xs px-2 py-0.5 rounded-full font-black">
                                {onlineCount}/{playerCount}
                            </span>
                        </h3>
                        <span className="text-tet-cream/40 text-sm">
                            {showPlayers ? "▲" : "▼"}
                        </span>
                    </button>

                    {showPlayers && (
                        <div className="mt-3 space-y-1.5">
                            {players.length === 0 ? (
                                <p className="text-tet-cream/40 text-sm text-center py-2">Chưa có ai vào phòng</p>
                            ) : (
                                players.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className={`flex items-center gap-3 text-sm py-2 px-3 rounded-xl transition-all ${p.online
                                            ? "bg-green-500/10 border border-green-500/20"
                                            : "bg-red-500/10 border border-red-500/15"
                                            }`}
                                    >
                                        <span className="text-gray-500 text-xs font-bold w-5 text-center">
                                            {idx + 1}
                                        </span>
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.online ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-red-400"
                                            }`} />
                                        <span className={`font-bold truncate ${p.online ? "text-green-800" : "text-red-400/60 line-through"
                                            }`}>
                                            {p.name}
                                        </span>
                                        {p.online ? (
                                            <span className="ml-auto text-[10px] font-semibold text-green-600">online</span>
                                        ) : (
                                            <span className="ml-auto text-[10px] font-semibold text-red-400">offline</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Current Number Display */}
                <div className="card text-center py-8 relative overflow-hidden">
                    {currentNumber && (
                        <div className="absolute inset-0 bg-gradient-to-br from-tet-gold/10 via-transparent to-tet-red/10 pointer-events-none" />
                    )}

                    <p className="text-sm text-tet-cream/50 mb-2 relative z-10">
                        {isPlaying
                            ? isPaused
                                ? "Tạm dừng"
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
                            <span className="text-tet-cream/40 text-xs">Gần đây:</span>
                            {calledNumbers
                                .slice(-5)
                                .reverse()
                                .map((n, i) => (
                                    <span
                                        key={n}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full
                    text-sm font-bold ${i === 0
                                                ? "bg-tet-gold/20 text-tet-gold"
                                                : "bg-tet-cream/5 text-tet-cream/50"
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
                            BẮT ĐẦU ({onlineCount} online)
                        </button>
                    )}

                    {isPlaying && (
                        <>
                            <button
                                onClick={handleCallNumber}
                                disabled={isPaused || isCallingNumber || !!verification || isAutoSpin}
                                className="btn-primary text-lg col-span-2 disabled:opacity-50"
                            >
                                {isAutoSpin
                                    ? "Đang tự động quay..."
                                    : isCallingNumber
                                        ? "Đang quay..."
                                        : verification
                                            ? "Đang dò vé..."
                                            : "QUAY SỐ"}
                            </button>

                            {/* Auto-spin controls */}
                            <div className="col-span-2 auto-spin-panel">
                                <div className="auto-spin-header">
                                    <span className="auto-spin-label">
                                        <span className="material-icons-round" style={{ fontSize: 18 }}>autorenew</span>
                                        Tự động quay
                                    </span>
                                    <button
                                        onClick={handleToggleAutoSpin}
                                        disabled={isPaused || !!verification}
                                        className={`auto-spin-toggle ${isAutoSpin ? "active" : ""}`}
                                    >
                                        <span className="auto-spin-toggle-knob" />
                                    </button>
                                </div>
                                <div className="auto-spin-speeds">
                                    {[{ label: "Nhanh", value: 3000 }, { label: "Vừa", value: 5000 }, { label: "Chậm", value: 8000 }].map((s) => (
                                        <button
                                            key={s.value}
                                            onClick={() => handleSpeedChange(s.value)}
                                            className={`auto-spin-speed-btn ${autoSpinSpeed === s.value ? "active" : ""}`}
                                        >
                                            {s.label}
                                            <span className="auto-spin-speed-sub">{s.value / 1000}s</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handlePause} className="btn-danger">
                                {isPaused ? "Tiếp tục" : "Tạm dừng"}
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-tet-cream/10 hover:bg-tet-cream/15 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                            >
                                Ván mới
                            </button>
                        </>
                    )}

                    {!isPlaying && calledNumbers.length > 0 && !winner && (
                        <>
                            <button onClick={handleStart} className="btn-primary col-span-1">
                                Tiếp tục
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-tet-cream/10 hover:bg-tet-cream/15 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                            >
                                Ván mới
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
                        <p className="text-sm font-bold text-tet-gold mb-1">Quét để vào phòng</p>
                        <p className="text-xs text-tet-cream/50 break-all">{joinLink}</p>
                        <button
                            onClick={() => navigator.clipboard?.writeText(joinLink)}
                            className="mt-2 text-xs bg-tet-cream/10 hover:bg-tet-cream/15 px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                            Copy link
                        </button>
                    </div>
                </div>

                {/* Number Board */}
                <NumberBoard calledNumbers={calledNumbers} />

                {/* Winner Banner */}
                {winner && (
                    <div className="card bg-gradient-to-r from-tet-gold/20 to-tet-red/20 text-center py-6 space-y-3 border-tet-gold/40">
                        <img src="/images/meme/mewnhanlixi.png" alt="Chiến thắng" className="w-28 h-28 mx-auto rounded-2xl shadow-lg object-cover" />
                        <h2 className="text-2xl font-black text-tet-gold">KINH RỒI!</h2>
                        <p className="text-tet-cream/80">
                            {winner.playerName || "Người chơi"} đã thắng!
                        </p>
                        <p className="text-xs text-tet-cream/50">
                            Số thắng: [{winner.rowNumbers.join(", ")}]
                        </p>
                        <button onClick={handleReset} className="btn-primary mt-4">
                            Chơi ván mới
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

            {/* Copyright */}
            <div className="text-center text-xs py-3 text-tet-cream/30">
                © 2026{" "}
                <a
                    href="https://www.hailamdev.space/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tet-gold/50 hover:text-tet-gold underline underline-offset-2 transition-colors"
                >
                    Hailamdev
                </a>
            </div>
        </div>
    );
}
