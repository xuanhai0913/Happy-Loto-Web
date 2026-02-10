import { memo } from "react";

/**
 * VerificationModal - "Dò Vé Công Khai"
 * Shows the claimer's ticket to everyone for dramatic public verification.
 */
const VerificationModal = memo(function VerificationModal({ data, isMe }) {
    if (!data) return null;

    const {
        playerName,
        ticket,
        rowIndex,
        rowNumbers,
        calledNumbers,
        result,
    } = data;

    const isWaiting = !result;
    const isValid = result?.valid;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className={`w-full max-w-md rounded-3xl p-5 space-y-4 border shadow-2xl transition-all duration-500
          ${isWaiting
                        ? "bg-tet-card border-tet-gold/40 shadow-tet-gold/20"
                        : isValid
                            ? "bg-gradient-to-br from-tet-card to-green-950 border-green-500/40 shadow-green-500/20"
                            : "bg-gradient-to-br from-tet-card to-red-950 border-red-500/40 shadow-red-500/20"
                    }`}
            >
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="text-3xl">
                        {isWaiting ? "🔍" : isValid ? "🏆✅" : "🚨❌"}
                    </div>
                    <h2
                        className={`text-xl font-black ${isWaiting
                            ? "text-tet-gold"
                            : isValid
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                    >
                        {isWaiting
                            ? "ĐANG DÒ VÉ..."
                            : isValid
                                ? "KINH HỢP LỆ!"
                                : "KINH HỤT!"}
                    </h2>
                    <p className="text-tet-cream/70 text-sm">
                        {isMe ? "Vé của bạn" : `Vé của ${playerName}`} đang được dò
                    </p>
                </div>

                {/* Ticket Display */}
                {ticket && (
                    <div className="bg-tet-cream/10 rounded-2xl p-3 space-y-1.5">
                        {ticket.map((row, rIdx) => (
                            <div key={rIdx} className="relative">
                                {/* Highlight the claimed row */}
                                {rIdx === rowIndex && (
                                    <div
                                        className={`absolute inset-0 rounded-lg border-2 -m-0.5 z-10 pointer-events-none
                      ${isWaiting
                                                ? "border-tet-gold animate-pulse"
                                                : isValid
                                                    ? "border-green-400"
                                                    : "border-red-400"
                                            }`}
                                    />
                                )}

                                <div className="grid grid-cols-9 gap-1">
                                    {row.map((num, cIdx) => {
                                        if (num === null) {
                                            return (
                                                <div
                                                    key={`${rIdx}-${cIdx}`}
                                                    className="h-7 flex items-center justify-center text-tet-cream/10 text-[10px] rounded"
                                                >
                                                    ·
                                                </div>
                                            );
                                        }

                                        const isInClaimedRow = rIdx === rowIndex && rowNumbers.includes(num);
                                        const wasCalled = calledNumbers?.includes(num);
                                        const isInvalid = result?.invalidNumbers?.includes(num);

                                        let cellClass =
                                            "h-7 flex items-center justify-center text-[10px] font-bold rounded transition-all duration-500 ";

                                        if (isInvalid) {
                                            // Number NOT called - highlight RED
                                            cellClass += "bg-red-500 text-white ring-2 ring-red-300 animate-shake";
                                        } else if (isInClaimedRow && wasCalled) {
                                            // Valid number in claimed row - GREEN
                                            cellClass += "bg-green-500/80 text-white";
                                        } else if (isInClaimedRow) {
                                            // In claimed row but checking
                                            cellClass += "bg-tet-gold/60 text-tet-red-dark";
                                        } else if (wasCalled) {
                                            // Called but not in claimed row
                                            cellClass += "bg-tet-gold/20 text-tet-gold";
                                        } else {
                                            cellClass += "bg-tet-cream/5 text-tet-cream/50";
                                        }

                                        return (
                                            <div key={`${rIdx}-${cIdx}`} className={cellClass}>
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Result detail */}
                {result && !isValid && result.invalidNumbers?.length > 0 && (
                    <div className="text-center bg-red-900/40 rounded-xl p-3 space-y-1">
                        <p className="text-red-300 text-sm font-bold">
                            Số chưa được gọi:
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            {result.invalidNumbers.map((n) => (
                                <span
                                    key={n}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full
                    bg-red-500 text-white font-black text-lg"
                                >
                                    {n}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {result && isValid && (
                    <div className="text-center space-y-2">
                        <p className="text-green-300 text-lg font-bold">
                            🎉 {isMe ? "Bạn" : playerName} đã chiến thắng!
                        </p>
                        <p className="text-tet-cream/50 text-xs">
                            Chúc mừng năm mới! 🧧
                        </p>
                    </div>
                )}

                {/* Waiting spinner */}
                {isWaiting && (
                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className="w-2 h-2 bg-tet-gold rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                        <div className="w-2 h-2 bg-tet-gold rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-tet-gold rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="text-tet-gold/60 text-sm ml-2">Đang kiểm tra...</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export default VerificationModal;
