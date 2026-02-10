import { memo, useMemo } from "react";

const TICKET_COLORS = [
    "#FFD700", // Vàng (Yellow)
    "#FF5722", // Cam (Orange)
    "#4CAF50", // Xanh lá (Green)
    "#2196F3", // Xanh dương (Blue)
    "#E91E63", // Hồng (Pink)
    "#9C27B0", // Tím (Purple)
    "#00BCD4", // Xanh ngọc (Cyan)
];

function getTicketColor(playerName, ticket) {
    let hash = (playerName || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    if (ticket && ticket.length > 0) {
        const firstNum = ticket.flat().find((n) => n !== null) || 0;
        hash += firstNum * 7;
    }
    return TICKET_COLORS[hash % TICKET_COLORS.length];
}

/**
 * VerificationModal - "Dò Vé Công Khai"
 * Shows the claimer's ticket to everyone for dramatic public verification.
 * Uses the SAME single-color ticket theme as LotoTicket.
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

    // Same color logic as LotoTicket
    const ticketColor = useMemo(() => getTicketColor(playerName, ticket), [playerName, ticket]);

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

                {/* Ticket Display - SINGLE COLOR Traditional Style */}
                {ticket && (
                    <div className="single-color-ticket" style={{ borderColor: ticketColor, borderWidth: "3px" }}>
                        {/* Header */}
                        <div className="ticket-header-section" style={{ background: ticketColor, padding: "8px 10px" }}>
                            <div className="player-name-display" style={{ fontSize: "13px" }}>
                                {playerName || "Người chơi"}
                            </div>
                        </div>

                        {/* Section 1: Rows 0-2 */}
                        <div className="ticket-section">
                            {ticket.slice(0, 3).map((row, rIdx) => renderVerifyRow(row, rIdx, rIdx, rowIndex, rowNumbers, calledNumbers, result, ticketColor, isWaiting, isValid))}
                        </div>

                        {/* Divider 1 */}
                        <div className="ticket-divider" style={{ background: ticketColor, padding: "6px", fontSize: "11px" }}>
                            Mã đáo thành công
                        </div>

                        {/* Section 2: Rows 3-5 */}
                        <div className="ticket-section">
                            {ticket.slice(3, 6).map((row, rIdx) => renderVerifyRow(row, rIdx + 3, rIdx + 3, rowIndex, rowNumbers, calledNumbers, result, ticketColor, isWaiting, isValid))}
                        </div>

                        {/* Divider 2 */}
                        <div className="ticket-divider" style={{ background: ticketColor, padding: "6px", fontSize: "11px" }}>
                            An Khang Thịnh Vượng
                        </div>

                        {/* Section 3: Rows 6-8 */}
                        <div className="ticket-section">
                            {ticket.slice(6, 9).map((row, rIdx) => renderVerifyRow(row, rIdx + 6, rIdx + 6, rowIndex, rowNumbers, calledNumbers, result, ticketColor, isWaiting, isValid))}
                        </div>

                        {/* Footer */}
                        <div className="ticket-footer-section" style={{ background: ticketColor, padding: "8px 10px" }}>
                            <div className="footer-text" style={{ fontSize: "11px" }}>Chúc bạn may mắn</div>
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

function renderVerifyRow(row, rIdx, actualRowIdx, claimedRowIndex, rowNumbers, calledNumbers, result, ticketColor, isWaiting, isValid) {
    const isClaimedRow = actualRowIdx === claimedRowIndex;

    return (
        <div key={rIdx} className="relative">
            {/* Highlight the claimed row */}
            {isClaimedRow && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        border: `3px solid ${isWaiting ? "#FFD700" : isValid ? "#22C55E" : "#EF4444"}`,
                        animation: isWaiting ? "pulse 2s infinite" : "none",
                    }}
                />
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(9, 1fr)",
                gap: "0",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}>
                {row.map((num, cIdx) => {
                    if (num === null) {
                        return (
                            <div
                                key={`${rIdx}-${cIdx}`}
                                style={{
                                    height: "32px",
                                    backgroundColor: "#FFFFFF",
                                    borderRight: "1px solid rgba(0,0,0,0.05)",
                                }}
                            />
                        );
                    }

                    const isInClaimedRow = isClaimedRow && rowNumbers.includes(num);
                    const wasCalled = calledNumbers?.includes(num);
                    const isInvalid = result?.invalidNumbers?.includes(num);

                    let bgColor = ticketColor;
                    let txtColor = "#000";
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
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: "900",
                                backgroundColor: bgColor,
                                color: txtColor,
                                borderRight: "1px solid rgba(255,255,255,0.3)",
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
}

export default VerificationModal;
