import { memo, useMemo } from "react";

// Single ticket colors - one per ticket
const TICKET_COLORS = [
    "#FFD700", // Vàng (Yellow)
    "#FF5722", // Cam (Orange)
    "#4CAF50", // Xanh lá (Green)
    "#2196F3", // Xanh dương (Blue)
    "#E91E63", // Hồng (Pink)
    "#9C27B0", // Tím (Purple)
    "#00BCD4", // Xanh ngọc (Cyan)
];

const LotoTicket = memo(function LotoTicket({ ticket, selectedNumbers, calledNumbers, onToggle, playerName }) {
    if (!ticket) return null;

    // Pick color based on playerName + ticket data (so reroll changes color)
    const ticketColor = useMemo(() => {
        let hash = (playerName || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const firstNum = ticket.flat().find((n) => n !== null) || 0;
        hash += firstNum * 7;
        return TICKET_COLORS[hash % TICKET_COLORS.length];
    }, [playerName, ticket]);

    return (
        <div className="single-color-ticket" style={{ borderColor: ticketColor }}>
            {/* Header: Player name */}
            <div className="ticket-header-section" style={{ background: ticketColor }}>
                <div className="header-dots">• • • • • • • • • • • • • •</div>
                <div className="player-name-display">
                    {playerName || "Người chơi"}
                </div>
                <div className="header-dots">• • • • • • • • • • • • • •</div>
            </div>

            {/* Section 1: Rows 1-3 */}
            <div className="ticket-section">
                {ticket.slice(0, 3).map((row, rowIdx) => (
                    <div key={rowIdx} className="ticket-row-single">
                        {row.map((num, colIdx) => (
                            <div key={`${rowIdx}-${colIdx}`} className="cell-wrapper">
                                {num === null ? (
                                    <div className="cell-empty-single" />
                                ) : (
                                    <button
                                        onClick={() => onToggle(num)}
                                        className={`cell-number-single ${selectedNumbers.has(num) ? "cell-selected-single" : ""
                                            } ${calledNumbers.includes(num) && !selectedNumbers.has(num) ? "cell-called-single" : ""}`}
                                        style={{
                                            backgroundColor: selectedNumbers.has(num) ? "#FFD700" : ticketColor,
                                            color: selectedNumbers.has(num) ? "#000" : "#000",
                                            border: selectedNumbers.has(num) ? "3px solid #DAA520" : "2px solid rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        {num}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Divider 1 */}
            <div className="ticket-divider" style={{ background: ticketColor }}>
                Mã đáo thành công
            </div>

            {/* Section 2: Rows 4-6 */}
            <div className="ticket-section">
                {ticket.slice(3, 6).map((row, rowIdx) => (
                    <div key={rowIdx + 3} className="ticket-row-single">
                        {row.map((num, colIdx) => (
                            <div key={`${rowIdx + 3}-${colIdx}`} className="cell-wrapper">
                                {num === null ? (
                                    <div className="cell-empty-single" />
                                ) : (
                                    <button
                                        onClick={() => onToggle(num)}
                                        className={`cell-number-single ${selectedNumbers.has(num) ? "cell-selected-single" : ""
                                            } ${calledNumbers.includes(num) && !selectedNumbers.has(num) ? "cell-called-single" : ""}`}
                                        style={{
                                            backgroundColor: selectedNumbers.has(num) ? "#FFD700" : ticketColor,
                                            color: selectedNumbers.has(num) ? "#000" : "#000",
                                            border: selectedNumbers.has(num) ? "3px solid #DAA520" : "2px solid rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        {num}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Divider 2 */}
            <div className="ticket-divider" style={{ background: ticketColor }}>
                An Khang Thịnh Vượng
            </div>

            {/* Section 3: Rows 7-9 */}
            <div className="ticket-section">
                {ticket.slice(6, 9).map((row, rowIdx) => (
                    <div key={rowIdx + 6} className="ticket-row-single">
                        {row.map((num, colIdx) => (
                            <div key={`${rowIdx + 6}-${colIdx}`} className="cell-wrapper">
                                {num === null ? (
                                    <div className="cell-empty-single" />
                                ) : (
                                    <button
                                        onClick={() => onToggle(num)}
                                        className={`cell-number-single ${selectedNumbers.has(num) ? "cell-selected-single" : ""
                                            } ${calledNumbers.includes(num) && !selectedNumbers.has(num) ? "cell-called-single" : ""}`}
                                        style={{
                                            backgroundColor: selectedNumbers.has(num) ? "#FFD700" : ticketColor,
                                            color: selectedNumbers.has(num) ? "#000" : "#000",
                                            border: selectedNumbers.has(num) ? "3px solid #DAA520" : "2px solid rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        {num}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="ticket-footer-section" style={{ background: ticketColor }}>
                <div className="footer-dots">• • • • • • • • • • • • • •</div>
                <div className="footer-text">Chúc bạn may mắn</div>
                <div className="footer-dots">• • • • • • • • • • • • • •</div>
            </div>
        </div>
    );
});

export default LotoTicket;
