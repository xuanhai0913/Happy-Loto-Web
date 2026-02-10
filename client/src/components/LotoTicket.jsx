import { memo } from "react";

const LotoTicket = memo(function LotoTicket({ ticket, selectedNumbers, calledNumbers, onToggle }) {
    if (!ticket) return null;

    return (
        <div className="space-y-1.5">
            {ticket.map((row, rowIdx) => {
                const rowNumbers = row.filter((n) => n !== null);
                const selectedInRow = rowNumbers.filter((n) => selectedNumbers.has(n));
                const isRowComplete = selectedInRow.length === 5;

                return (
                    <div key={rowIdx} className="relative">
                        {/* Row completion indicator */}
                        {isRowComplete && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-[80%] bg-tet-gold rounded-full animate-pulse" />
                        )}

                        <div className="grid grid-cols-9 gap-1">
                            {row.map((num, colIdx) => {
                                if (num === null) {
                                    return (
                                        <div key={`${rowIdx}-${colIdx}`} className="ticket-cell ticket-cell-empty">
                                            <span className="text-white/5 text-xs">·</span>
                                        </div>
                                    );
                                }

                                const isSelected = selectedNumbers.has(num);
                                const isCalled = calledNumbers.includes(num);

                                return (
                                    <button
                                        key={`${rowIdx}-${colIdx}`}
                                        onClick={() => onToggle(num)}
                                        className={`ticket-cell ${isSelected
                                                ? "ticket-cell-selected"
                                                : "ticket-cell-normal"
                                            } ${isCalled && !isSelected ? "ring-1 ring-tet-gold/30" : ""}`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Row status */}
                        <div className="flex items-center justify-end mt-0.5 gap-1">
                            {isRowComplete && (
                                <span className="text-[9px] text-tet-gold font-bold animate-pulse">
                                    ✨ ĐỦ HÀNG!
                                </span>
                            )}
                            <span className="text-[9px] text-white/20">
                                {selectedInRow.length}/5
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default LotoTicket;
