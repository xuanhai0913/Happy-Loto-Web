import { useState, useEffect, useRef } from "react";
import socket from "../socket";

const EMOJIS = ["😂", "😭", "😡", "🎉", "🤣", "👏", "🔥", "💀"];

const QUICK_TEXTS = [
    "Nhanh lên! 🏃",
    "Chậm thôi! 🐌",
    "Run tay quá! 🤚",
    "Sắp kinh rồi! 🔥",
    "Hên quá trời! 🍀",
    "Huề cả làng! 😅",
];

export default function QuickChat({ roomCode }) {
    const [floatingItems, setFloatingItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("emoji"); // 'emoji' | 'text'
    const idCounter = useRef(0);

    useEffect(() => {
        socket.on("chat_message", ({ emoji, text, playerName }) => {
            const id = idCounter.current++;
            const left = 10 + Math.random() * 80;
            const content = emoji || text;

            setFloatingItems((prev) => [...prev, { id, content, left, isText: !!text }]);

            setTimeout(() => {
                setFloatingItems((prev) => prev.filter((e) => e.id !== id));
            }, 3500);
        });

        return () => {
            socket.off("chat_message");
        };
    }, []);

    const sendEmoji = (emoji) => {
        socket.emit("quick_chat", { roomCode, emoji });
    };

    const sendText = (text) => {
        socket.emit("quick_chat", { roomCode, text });
    };

    return (
        <>
            {/* Floating items */}
            {floatingItems.map(({ id, content, left, isText }) => (
                <div
                    key={id}
                    className="floating-emoji"
                    style={{
                        left: `${left}%`,
                        bottom: "80px",
                        fontSize: isText ? "0.9rem" : "2rem",
                        ...(isText && {
                            background: "rgba(245, 158, 11, 0.9)",
                            color: "#7F1D1D",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                        }),
                    }}
                >
                    {content}
                </div>
            ))}

            {/* Chat bar */}
            <div className="sticky bottom-0 bg-tet-card/95 backdrop-blur-md border-t border-white/10 px-4 py-2 z-50">
                <div className="max-w-lg mx-auto">
                    {isOpen ? (
                        <div className="space-y-2">
                            {/* Tabs */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setActiveTab("emoji")}
                                    className={`text-xs px-3 py-1 rounded-full transition-all cursor-pointer
                    ${activeTab === "emoji" ? "bg-tet-gold/20 text-tet-gold" : "text-tet-cream/50 hover:text-tet-cream/70"}`}
                                >
                                    😂 Emoji
                                </button>
                                <button
                                    onClick={() => setActiveTab("text")}
                                    className={`text-xs px-3 py-1 rounded-full transition-all cursor-pointer
                    ${activeTab === "text" ? "bg-tet-gold/20 text-tet-gold" : "text-tet-cream/50 hover:text-tet-cream/70"}`}
                                >
                                    Chat nhanh
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-auto text-tet-cream/50 hover:text-tet-cream/70 text-sm px-2 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === "emoji" ? (
                                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                    {EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => sendEmoji(emoji)}
                                            className="text-2xl p-2 hover:bg-tet-cream/10 rounded-xl transition-all
                                 active:scale-75 cursor-pointer shrink-0"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {QUICK_TEXTS.map((text) => (
                                        <button
                                            key={text}
                                            onClick={() => sendText(text)}
                                            className="text-xs px-3 py-1.5 bg-tet-cream/10 hover:bg-tet-gold/20 
                                 text-tet-cream/80 hover:text-tet-gold rounded-full transition-all
                                 active:scale-90 cursor-pointer shrink-0 whitespace-nowrap"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full text-center text-tet-cream/50 hover:text-tet-cream/70 text-sm py-1
                         transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            Gửi biểu cảm / Chat nhanh
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
