import { memo } from "react";

// Traditional Vietnamese Loto row colors - vibrant like real tickets
const ROW_COLORS = [
    { bg: "#E85D2C", text: "#FFFFFF", border: "#C74A20" },  // Cam đậm (Orange)
    { bg: "#2E9E4F", text: "#FFFFFF", border: "#237A3C" },  // Xanh lá (Green)
    { bg: "#E84393", text: "#FFFFFF", border: "#C5357B" },  // Hồng (Pink)
    { bg: "#F5A623", text: "#FFFFFF", border: "#D4901D" },  // Vàng cam (Amber)
    { bg: "#3498DB", text: "#FFFFFF", border: "#2980B9" },  // Xanh dương (Blue)
    { bg: "#E74C3C", text: "#FFFFFF", border: "#C0392B" },  // Đỏ (Red)
    { bg: "#8E44AD", text: "#FFFFFF", border: "#7D3C98" },  // Tím (Purple)
    { bg: "#1ABC9C", text: "#FFFFFF", border: "#16A085" },  // Ngọc (Teal)
    { bg: "#E67E22", text: "#FFFFFF", border: "#D35400" },  // Cam (Deep Orange)
];

const LotoTicket = memo(function LotoTicket({ ticket, selectedNumbers, calledNumbers, onToggle, playerName }) {
    if (!ticket) return null;

    return (
        <div className="loto-ticket-traditional">
            {/* Ticket header with player name */}
            <div className="ticket-header">
                <div className="ticket-header-left">
                    <span className="ticket-brand">LÔ TÔ</span>
                </div>
                <div className="ticket-header-center">
                    {playerName && (
                        <span className="ticket-player-name">{playerName}</span>
                    )}
                </div>
                <div className="ticket-header-right">
                    <span className="ticket-label">HAPPY LOTO</span>
                </div>
            </div>

            {/* Ticket grid */}
            <div className="ticket-grid">
                {ticket.map((row, rowIdx) => {
                    const color = ROW_COLORS[rowIdx % ROW_COLORS.length];
                    const rowNumbers = row.filter((n) => n !== null);
                    const selectedInRow = rowNumbers.filter((n) => selectedNumbers.has(n));
                    const isRowComplete = selectedInRow.length === 5;

                    return (
                        <div
                            key={rowIdx}
                            className={`ticket-row ${isRowComplete ? "ticket-row-complete" : ""}`}
                        >
                            {row.map((num, colIdx) => {
                                if (num === null) {
                                    return (
                                        <div
                                            key={`${rowIdx}-${colIdx}`}
                                            className="ticket-cell-trad ticket-cell-empty-trad"
                                            style={{
                                                backgroundColor: `${color.bg}15`,
                                                borderColor: `${color.border}30`,
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
                                        className={`ticket-cell-trad ${isSelected
                                                ? "ticket-cell-selected-trad"
                                                : "ticket-cell-number-trad"
                                            } ${isCalled && !isSelected ? "ticket-cell-called" : ""}`}
                                        style={
                                            isSelected
                                                ? {
                                                    backgroundColor: "#FFD700",
                                                    color: "#8B0000",
                                                    borderColor: "#DAA520",
                                                }
                                                : {
                                                    backgroundColor: color.bg,
                                                    color: color.text,
                                                    borderColor: color.border,
                                                }
                                        }
                                    >
                                        <span className="cell-number">{num}</span>
                                        {isSelected && <span className="cell-check">✓</span>}
                                    </button>
                                );
                            })}

                            {/* Row complete indicator */}
                            {isRowComplete && (
                                <div className="row-complete-badge">
                                    ⭐
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Ticket footer */}
            <div className="ticket-footer">
                <span>🎊 Chúc may mắn! 🎊</span>
            </div>
        </div>
    );
});

export default LotoTicket;
