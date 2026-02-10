import { memo } from "react";

const NumberBoard = memo(function NumberBoard({ calledNumbers }) {
    const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

    return (
        <div className="card">
            <h3 className="text-sm font-bold text-tet-gold mb-3 flex items-center gap-2">
                <span>📊</span> Bảng số (Đã gọi: {calledNumbers.length}/90)
            </h3>
            <div className="grid grid-cols-10 gap-1">
                {numbers.map((num) => {
                    const isCalled = calledNumbers.includes(num);
                    return (
                        <div
                            key={num}
                            className={`flex items-center justify-center w-full aspect-square rounded-md
                text-xs font-bold transition-all duration-300
                ${isCalled
                                    ? "bg-gradient-to-br from-tet-gold to-tet-gold-dark text-tet-red-dark shadow-sm shadow-tet-gold/20 scale-105"
                                    : "bg-white/5 text-white/20"
                                }`}
                        >
                            {num}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default NumberBoard;
