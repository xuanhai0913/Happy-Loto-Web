import { memo } from "react";

// Traditional Vietnamese Loto colors - SUPER vibrant like real tickets
const ROW_COLORS = [
    "#FF5722", // Cam rực (Bright Orange)
    "#4CAF50", // Xanh lá tươi (Bright Green)  
    "#E91E63", // Hồng sốc (Hot Pink)
    "#FFC107", // Vàng tươi (Bright Yellow)
    "#2196F3", // Xanh dương (Bright Blue)
    "#F44336", // Đỏ rực (Bright Red)
    "#9C27B0", // Tím (Purple)
    "#00BCD4", // Xanh ngọc (Cyan)
    "#FF9800", // Cam vàng (Orange)
];

const LotoTicket = memo(function LotoTicket({ ticket, selectedNumbers, calledNumbers, onToggle, playerName }) {
    if (!ticket) return null;

    return (
        <div className="traditional-loto-ticket">
            {/* Decorative header */}
            <div className="ticket-header-deco">
                <div className="deco-dots">• • • • • • • • • • • • • •</div>
                <div className="ticket-title">TÊM TEN</div>
                <div className="deco-dots">• • • • • • • • • • • • • •</div>
            </div>

            {/* Player name banner */}
            {playerName && (
                <div className="ticket-player-banner">
                    <span className="player-name-tag">{playerName}</span>
                </div>
            )}

            {/* Ticket grid */}
            <div className="ticket-grid-traditional">
                {ticket.map((row, rowIdx) => {
                    const bgColor = ROW_COLORS[rowIdx % ROW_COLORS.length];
                    const rowNumbers = row.filter((n) => n !== null);
                    const selectedInRow = rowNumbers.filter((n) => selectedNumbers.has(n));
                    const isRowComplete = selectedInRow.length === 5;

                    return (
                        <div
                            key={rowIdx}
                            className={`ticket-row-trad ${isRowComplete ? "row-complete-glow" : ""}`}
                            style={{ backgroundColor: bgColor }}
                        >
                            {row.map((num, colIdx) => {
                                if (num === null) {
                                    // Empty cell — slightly transparent
                                    return (
                                        <div
                                            key={`${rowIdx}-${colIdx}`}
                                            className="ticket-cell-trad cell-empty-trad"
                                            style={{
                                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                                border: "2px solid rgba(255, 255, 255, 0.3)",
                                            }}
                                        />
                                    );
                                }

                                const isSelected = selectedNumbers.has(num);
                                const isCalled = calledNumbers.includes(num);

                                return (
                                    <button
                                        key={`${rowIdx}-${colIdx}`}
                                        onClick={() => onToggle(num)}
                                        className={`ticket-cell-trad cell-number-trad ${isSelected ? "cell-selected-gold" : ""
                                            } ${isCalled && !isSelected ? "cell-called-dim" : ""}`}
                                        style={
                                            isSelected
                                                ? {
                                                    backgroundColor: "#FFD700",
                                                    color: "#8B0000",
                                                    fontWeight: "900",
                                                    border: "3px solid #DAA520",
                                                    boxShadow: "0 0 12px rgba(255, 215, 0, 0.8)",
                                                }
                                                : {
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    color: bgColor,
                                                    fontWeight: "900",
                                                    border: "2px solid rgba(255, 255, 255, 0.8)",
                                                }
                                        }
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Decorative footer */}
            <div className="ticket-footer-deco">
                <div className="deco-dots">• • • • • • • • • • • • • •</div>
                <div className="ticket-footer-text">TÊM TEN NHẤT</div>
                <div className="deco-dots">• • • • • • • • • • • • • •</div>
            </div>

            {/* Complete row badge */}
            {ticket.some((row, idx) => {
                const rowNumbers = row.filter((n) => n !== null);
                const selectedInRow = rowNumbers.filter((n) => selectedNumbers.has(n));
                return selectedInRow.length === 5;
            }) && (
                    <div className="complete-row-badge">
                        ⭐ KINH! ⭐
                    </div>
                )}
        </div>
    );
});

export default LotoTicket;
