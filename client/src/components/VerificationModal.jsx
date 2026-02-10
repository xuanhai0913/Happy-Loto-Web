import { memo } from "react";

const ROW_COLORS = [
    { bg: "#E85D2C", text: "#FFFFFF", border: "#C74A20" },
    { bg: "#2E9E4F", text: "#FFFFFF", border: "#237A3C" },
    { bg: "#E84393", text: "#FFFFFF", border: "#C5357B" },
    { bg: "#F5A623", text: "#FFFFFF", border: "#D4901D" },
    { bg: "#3498DB", text: "#FFFFFF", border: "#2980B9" },
    { bg: "#E74C3C", text: "#FFFFFF", border: "#C0392B" },
    { bg: "#8E44AD", text: "#FFFFFF", border: "#7D3C98" },
    { bg: "#1ABC9C", text: "#FFFFFF", border: "#16A085" },
    { bg: "#E67E22", text: "#FFFFFF", border: "#D35400" },
];

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
                className={`w-full max-w-md rounded-3xl p-5 space-y-4 border-2 shadow-2xl transition-all duration-500
          ${isWaiting
                        ? "bg-white border-tet-gold shadow-tet-gold/20"
                        : isValid
                            ? "bg-white border-green-500 shadow-green-500/20"
                            : "bg-white border-red-500 shadow-red-500/20"
                    }`}
            >
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="text-3xl">
                        {isWaiting ? (
                            <span>🔍</span>
                        ) : isValid ? (
                            <img src="/images/meme/mewnhanlixi.png" alt="Thắng" className="w-24 h-24 mx-auto rounded-2xl shadow-lg object-cover" />
                        ) : (
                            <img src="/images/meme/mewngaingung.png" alt="Kinh hụt" className="w-24 h-24 mx-auto rounded-2xl shadow-lg object-cover" />
                        )}
                    </div>
                    <h2
                        className={`text-xl font-black ${isWaiting
                            ? "text-tet-gold"
                            : isValid
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                    >
                        {isWaiting
                            ? "ĐANG DÒ VÉ..."
                            : isValid
                                ? "KINH HỢP LỆ!"
                                : "KINH HỤT!"}
                    </h2>
                    <p className="text-tet-cream/60 text-sm">
                        {isMe ? "Vé của bạn" : `Vé của ${playerName}`} đang được dò
                    </p>
                </div>

                {/* Ticket Display - Traditional Style */}
                {ticket && (
                    <div className="loto-ticket-traditional" style={{ borderWidth: "2px" }}>
                        <div className="ticket-grid" style={{ padding: "3px", gap: "2px" }}>
                            {ticket.map((row, rIdx) => {
                                const color = ROW_COLORS[rIdx % ROW_COLORS.length];

                                return (
                                    <div key={rIdx} className="relative">
                                        {/* Highlight the claimed row */}
                                        {rIdx === rowIndex && (
                                            <div
                                                className={`absolute inset-0 rounded-lg border-3 -m-0.5 z-10 pointer-events-none
                      ${isWaiting
                                                        ? "border-tet-gold animate-pulse"
                                                        : isValid
                                                            ? "border-green-400"
                                                            : "border-red-400"
                                                    }`}
                                                style={{ borderWidth: "3px" }}
                                            />
                                        )}

                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(9, 1fr)",
                                            gap: "2px",
                                        }}>
                                            {row.map((num, cIdx) => {
                                                if (num === null) {
                                                    return (
                                                        <div
                                                            key={`${rIdx}-${cIdx}`}
                                                            style={{
                                                                height: "30px",
                                                                backgroundColor: `${color.bg}15`,
                                                                borderRadius: "4px",
                                                                border: `1px dashed ${color.border}30`,
                                                            }}
                                                        />
                                                    );
                                                }

                                                const isInClaimedRow = rIdx === rowIndex && rowNumbers.includes(num);
                                                const wasCalled = calledNumbers?.includes(num);
                                                const isInvalid = result?.invalidNumbers?.includes(num);

                                                let bgColor = color.bg;
                                                let txtColor = color.text;
                                                let extraStyle = {};

                                                if (isInvalid) {
                                                    bgColor = "#EF4444";
                                                    txtColor = "#FFFFFF";
                                                    extraStyle = {
                                                        boxShadow: "0 0 0 2px #FCA5A5",
                                                        animation: "shake 0.6s ease-in-out",
                                                    };
                                                } else if (isInClaimedRow && wasCalled) {
                                                    bgColor = "#22C55E";
                                                    txtColor = "#FFFFFF";
                                                    extraStyle = { boxShadow: "0 0 8px rgba(34,197,94,0.4)" };
                                                } else if (isInClaimedRow) {
                                                    bgColor = "#FFD700";
                                                    txtColor = "#8B0000";
                                                } else if (wasCalled) {
                                                    bgColor = "#FFD700";
                                                    txtColor = "#8B0000";
                                                    extraStyle = { opacity: 0.7 };
                                                }

                                                return (
                                                    <div
                                                        key={`${rIdx}-${cIdx}`}
                                                        style={{
                                                            height: "30px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            borderRadius: "4px",
                                                            backgroundColor: bgColor,
                                                            color: txtColor,
                                                            border: `1px solid ${color.border}`,
                                                            transition: "all 0.5s",
                                                            ...extraStyle,
                                                        }}
                                                    >
                                                        {num}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Result detail */}
                {result && !isValid && result.invalidNumbers?.length > 0 && (
                    <div className="text-center bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                        <p className="text-red-600 text-sm font-bold">
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
                        <p className="text-green-600 text-lg font-bold">
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
