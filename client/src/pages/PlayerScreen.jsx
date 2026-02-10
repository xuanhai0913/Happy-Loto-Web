import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import socket from "../socket";
import LotoTicket from "../components/LotoTicket";
import QuickChat from "../components/QuickChat";
import VerificationModal from "../components/VerificationModal";
import BackgroundMusic from "../components/BackgroundMusic";

export default function PlayerScreen() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const initState = location.state || {};

    const [ticket, setTicket] = useState(initState.ticket || null);
    const [playerId] = useState(initState.playerId || null);
    const [calledNumbers, setCalledNumbers] = useState(initState.calledNumbers || []);
    const [currentNumber, setCurrentNumber] = useState(initState.currentNumber || null);
    const [selectedNumbers, setSelectedNumbers] = useState(
        () => new Set(initState.savedSelected || [])
    );
    const [isPlaying, setIsPlaying] = useState(initState.isPlaying || false);
    const [isPaused, setIsPaused] = useState(initState.isPaused || false);
    const [showNumberAnim, setShowNumberAnim] = useState(false);
    const [result, setResult] = useState(null); // 'win' | 'fail' | null
    const [resultMessage, setResultMessage] = useState("");
    const [falseAlarmAlert, setFalseAlarmAlert] = useState(null);
    const [winnerAlert, setWinnerAlert] = useState(null);
    const [verification, setVerification] = useState(null);
    const [isSubmittingKinh, setIsSubmittingKinh] = useState(false);
    const [playerName] = useState(
        () => localStorage.getItem("loto_player_name") || "Người chơi"
    );

    // Redirect if no ticket
    useEffect(() => {
        if (!ticket) {
            navigate(`/?room=${roomCode}`);
        }
    }, [ticket]);

    // Sync selected numbers to server for reconnect persistence
    useEffect(() => {
        if (selectedNumbers.size > 0) {
            socket.emit("sync_selected", {
                roomCode,
                selectedNumbers: [...selectedNumbers],
            });
        }
    }, [selectedNumbers, roomCode]);

    useEffect(() => {
        socket.on("game_started", () => {
            setIsPlaying(true);
            setIsPaused(false);
            setResult(null);
            setWinnerAlert(null);
        });

        socket.on("number_called", ({ number, calledNumbers: all }) => {
            setCurrentNumber(number);
            setCalledNumbers(all);
            setShowNumberAnim(true);
            setTimeout(() => setShowNumberAnim(false), 600);
        });

        socket.on("game_paused", () => setIsPaused(true));
        socket.on("game_resumed", () => setIsPaused(false));

        socket.on("game_reset", ({ ticket: newTicket }) => {
            setTicket(newTicket);
            setCalledNumbers([]);
            setCurrentNumber(null);
            setSelectedNumbers(new Set());
            setIsPlaying(false);
            setIsPaused(false);
            setResult(null);
            setResultMessage("");
            setWinnerAlert(null);
            setFalseAlarmAlert(null);
            setVerification(null);
            setIsSubmittingKinh(false);
        });

        socket.on("game_reset_broadcast", () => {
            setCalledNumbers([]);
            setCurrentNumber(null);
            setSelectedNumbers(new Set());
            setIsPlaying(false);
            setIsPaused(false);
            setResult(null);
            setWinnerAlert(null);
            setFalseAlarmAlert(null);
            setVerification(null);
            setIsSubmittingKinh(false);
        });

        // VERIFICATION FLOW
        socket.on("verification_start", (data) => {
            setVerification({
                ...data,
                result: null, // waiting for result
            });
        });

        socket.on("verification_result", (data) => {
            setVerification((prev) => prev ? { ...prev, result: data } : null);
            setIsSubmittingKinh(false);

            if (data.valid) {
                setIsPlaying(false);
                if (data.playerId === playerId) {
                    setResult("win");
                    setResultMessage("🎉 CHÚC MỪNG BẠN ĐÃ KINH!");
                    const end = Date.now() + 4000;
                    const fire = () => {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { x: Math.random(), y: Math.random() * 0.6 },
                            colors: ["#F59E0B", "#DC2626", "#FFD700", "#FF6B6B"],
                        });
                        if (Date.now() < end) requestAnimationFrame(fire);
                    };
                    fire();
                } else {
                    setWinnerAlert({ playerId: data.playerId, playerName: data.playerName });
                    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
                }
            } else {
                if (data.playerId === playerId) {
                    setResult("fail");
                    setResultMessage("😂 KINH HỤT RỒI! Nghe cho kỹ nha!");
                } else {
                    setFalseAlarmAlert(data.playerName || data.playerId);
                    setTimeout(() => setFalseAlarmAlert(null), 5000);
                }
            }

            // Auto-close verification modal after 4 more seconds
            setTimeout(() => setVerification(null), 4000);
        });

        socket.on("room_closed", () => {
            sessionStorage.removeItem("loto_room");
            sessionStorage.removeItem("loto_is_host");
            alert("Chủ phòng đã rời đi! Phòng đã đóng.");
            navigate("/");
        });

        return () => {
            socket.off("game_started");
            socket.off("number_called");
            socket.off("game_paused");
            socket.off("game_resumed");
            socket.off("game_reset");
            socket.off("game_reset_broadcast");
            socket.off("verification_start");
            socket.off("verification_result");
            socket.off("room_closed");
        };
    }, [playerId]);

    const handleToggleNumber = useCallback(
        (num) => {
            setSelectedNumbers((prev) => {
                const next = new Set(prev);
                if (next.has(num)) {
                    next.delete(num);
                } else {
                    next.add(num);
                }
                return next;
            });
            if (result === "fail") {
                setResult(null);
                setResultMessage("");
            }
        },
        [result]
    );

    const handleKinh = () => {
        if (!ticket || isSubmittingKinh) return;

        for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
            const rowNumbers = ticket[rowIdx].filter((n) => n !== null);
            const selectedInRow = rowNumbers.filter((n) => selectedNumbers.has(n));

            if (selectedInRow.length === 5) {
                setIsSubmittingKinh(true);
                socket.emit(
                    "check_win",
                    {
                        roomCode,
                        rowNumbers: selectedInRow,
                        rowIndex: rowIdx,
                        selectedNumbers: [...selectedNumbers],
                    },
                    (response) => {
                        if (!response.success) {
                            setIsSubmittingKinh(false);
                            setResult("fail");
                            setResultMessage(response.error || "Có lỗi xảy ra!");
                        }
                    }
                );
                return;
            }
        }
    };

    const hasCompleteRow = ticket
        ? ticket.some((row) => {
            const nums = row.filter((n) => n !== null);
            return nums.length === 5 && nums.every((n) => selectedNumbers.has(n));
        })
        : false;

    const totalSelected = selectedNumbers.size;

    if (!ticket) return null;

    return (
        <div className="min-h-dvh flex flex-col">
            {/* Header */}
            <header className="bg-tet-card border-b border-tet-gold/20 px-4 py-3 sticky top-0 z-40">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎟️</span>
                        <div>
                            <p className="text-sm font-bold text-tet-gold">Phòng {roomCode}</p>
                            <p className="text-[10px] text-tet-cream/40">
                                {isPlaying
                                    ? isPaused
                                        ? "⏸️ Tạm dừng"
                                        : "🎮 Đang chơi"
                                    : "⏳ Chờ bắt đầu"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <BackgroundMusic />
                        <div className="text-center">
                            <p className="text-[10px] text-tet-cream/40">Đã đánh</p>
                            <p className="text-lg font-black text-tet-gold">{totalSelected}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4 pb-20">
                {/* Current Number */}
                <div className="card text-center py-4 relative overflow-hidden">
                    {currentNumber && (
                        <div className="absolute inset-0 bg-gradient-to-br from-tet-gold/5 to-tet-red/5 pointer-events-none" />
                    )}
                    <p className="text-xs text-tet-cream/50 mb-2 relative z-10">Số vừa gọi</p>
                    <div
                        className={`relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-full
            bg-gradient-to-br from-tet-gold to-tet-gold-dark text-tet-red-dark
            text-4xl font-black shadow-lg shadow-tet-gold/20
            ${showNumberAnim ? "animate-number-reveal" : ""}
            ${currentNumber ? "" : "opacity-30"}`}
                    >
                        {currentNumber || "?"}
                    </div>
                    <p className="text-xs text-tet-cream/40 mt-2 relative z-10">
                        {calledNumbers.length > 0
                            ? `${calledNumbers.length} số đã gọi`
                            : "Chưa bắt đầu"}
                    </p>
                </div>

                {/* Loto Ticket */}
                <div className="card p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-tet-gold flex items-center gap-1.5">
                            <span>🎫</span> Vé của bạn
                        </h3>
                        <span className="text-[10px] text-tet-cream/40 bg-tet-cream/5 px-2 py-0.5 rounded-full">
                            Chạm số để đánh dấu
                        </span>
                    </div>
                    <LotoTicket
                        ticket={ticket}
                        selectedNumbers={selectedNumbers}
                        calledNumbers={calledNumbers}
                        onToggle={handleToggleNumber}
                        playerName={playerName}
                    />

                    {/* Reroll button — only show before game starts */}
                    {!isPlaying && (
                        <button
                            onClick={() => socket.emit("reroll_ticket", { roomCode })}
                            className="mt-3 w-full bg-tet-card-light hover:bg-tet-gold/10 border border-tet-gold/30 text-tet-gold font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            🔄 Đổi vé khác
                        </button>
                    )}
                </div>

                {/* KINH Button */}
                <button
                    onClick={handleKinh}
                    disabled={!hasCompleteRow || !isPlaying || result === "win" || isSubmittingKinh}
                    className="btn-kinh w-full"
                >
                    <span className="relative z-10">
                        {isSubmittingKinh
                            ? "⏳ Đang dò vé..."
                            : result === "win"
                                ? "🏆 ĐÃ THẮNG!"
                                : "🔥 KINH NGAY! 🔥"}
                    </span>
                    {hasCompleteRow && isPlaying && !isSubmittingKinh && (
                        <span className="absolute inset-0 bg-tet-cream/10 animate-pulse rounded-2xl" />
                    )}
                </button>

                {/* Result Overlays */}
                {result === "win" && (
                    <div className="card bg-gradient-to-r from-tet-gold/20 to-yellow-500/20 border-tet-gold/40 text-center py-6 space-y-3">
                        <img src="/images/meme/mewnhanlixi.png" alt="Mèo nhận lì xì" className="w-32 h-32 mx-auto rounded-2xl shadow-lg object-cover" />
                        <h2 className="text-3xl font-black text-tet-gold">KINH RỒI!</h2>
                        <p className="text-tet-cream/80">{resultMessage}</p>
                        <p className="text-tet-gold/60 text-sm">Bạn là người chiến thắng! 🎆</p>
                    </div>
                )}

                {result === "fail" && (
                    <div className="card bg-red-50 border-red-300 text-center py-6 space-y-3 animate-shake">
                        <img src="/images/meme/mewngaingung.png" alt="Mèo ngại ngùng" className="w-32 h-32 mx-auto rounded-2xl shadow-lg object-cover" />
                        <h2 className="text-2xl font-black text-red-500">KINH HỤT!</h2>
                        <p className="text-tet-cream/80">{resultMessage}</p>
                        <p className="text-xs text-tet-cream/50">Nghe kỹ rồi hãy kinh nha!</p>
                        <button
                            onClick={() => { setResult(null); setResultMessage(""); }}
                            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg transition-all cursor-pointer font-bold"
                        >
                            OK, tôi hiểu rồi 😅
                        </button>
                    </div>
                )}

                {winnerAlert && result !== "win" && (
                    <div className="card bg-gradient-to-r from-tet-gold/10 to-yellow-500/10 border-tet-gold/30 text-center py-6 space-y-2">
                        <img src="/images/meme/mewmituoc.png" alt="Mèo mít ướt" className="w-28 h-28 mx-auto rounded-2xl shadow-lg object-cover" />
                        <h2 className="text-xl font-bold text-tet-gold">
                            {winnerAlert.playerName || "Ai đó"} đã KINH!
                        </h2>
                        <p className="text-tet-cream/80 text-sm">Ván này đã kết thúc... Hẹn ván sau nhé!</p>
                    </div>
                )}

                {falseAlarmAlert && (
                    <div className="card bg-red-900/20 border-red-500/20 text-center py-3 animate-shake">
                        <p className="text-red-400 font-bold">
                            🚨 {falseAlarmAlert} kinh hụt rồi! 😂
                        </p>
                    </div>
                )}

                {/* Called Numbers Summary */}
                {calledNumbers.length > 0 && (
                    <details className="card">
                        <summary className="text-sm font-bold text-tet-gold cursor-pointer flex items-center gap-2">
                            <span>📋</span> Số đã gọi ({calledNumbers.length})
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {calledNumbers.map((n) => (
                                <span
                                    key={n}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full
                  bg-tet-gold/20 text-tet-gold text-xs font-bold"
                                >
                                    {n}
                                </span>
                            ))}
                        </div>
                    </details>
                )}
            </div>

            {/* Verification Modal */}
            {verification && (
                <VerificationModal
                    data={verification}
                    isMe={verification.playerId === playerId}
                />
            )}

            {/* Quick Chat */}
            <QuickChat roomCode={roomCode} />
        </div>
    );
}
