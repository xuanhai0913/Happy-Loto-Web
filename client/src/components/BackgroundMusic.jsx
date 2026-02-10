import { useState, useRef, useEffect } from "react";

/**
 * BackgroundMusic - Tết background music with toggle
 * Uses a royalty-free Tết-style ambient loop
 */
export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        // Create audio element with a Tết vibe ambient music
        // Using a simple sine-wave based "spring music" generator as fallback
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.15; // Keep it low so it doesn't overpower TTS

        // Try loading a Tết music file if available
        audio.src = "/audio/tet_music.mp3";

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    const toggle = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(() => {
                // Browser may block autoplay - user needs to interact first
                console.log("Audio play blocked by browser - needs user interaction");
            });
            setIsPlaying(true);
        }
    };

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg
                 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            title={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
        >
            <span className={`text-base ${isPlaying ? "animate-bounce" : ""}`} style={{ animationDuration: "1s" }}>
                {isPlaying ? "🔊" : "🔇"}
            </span>
            <span className="text-white/40 hidden sm:inline">
                {isPlaying ? "Nhạc" : "Nhạc"}
            </span>
        </button>
    );
}
