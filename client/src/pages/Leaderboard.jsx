import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Trophy3D from "../components/Trophy3D";

export default function Leaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("leaderboard");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/leaderboard").then((r) => r.json()),
            fetch("/api/stats").then((r) => r.json()),
            fetch("/api/history").then((r) => r.json()),
        ])
            .then(([lb, st, hi]) => {
                setLeaderboard(lb);
                setStats(st);
                setHistory(hi);
            })
            .catch((err) => console.error("Failed to load data:", err))
            .finally(() => setLoading(false));
    }, []);

    const getMedal = (index) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `#${index + 1}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr + "Z");
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="text-5xl animate-bounce">
                        <img src="/images/loto-logo.png" alt="Loading" className="w-14 h-14 mx-auto" />
                    </div>
                    <p className="text-tet-cream/60">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex flex-col">
            {/* Header */}
            <header className="bg-tet-card border-b border-tet-gold/20 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate("/")}
                        className="text-tet-cream/60 hover:text-tet-gold transition-colors cursor-pointer text-sm"
                    >
                        ← Trang chủ
                    </button>
                    <h1 className="text-lg font-bold text-tet-gold">Bảng Xếp Hạng</h1>
                    <div className="w-16" />
                </div>
            </header>

            <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4">
                {/* 3D Trophy */}
                <div className="flex flex-col items-center -mt-2 -mb-2">
                    <Trophy3D size={140} />
                    <p className="text-tet-gold/60 text-xs -mt-2">Kéo để xoay cúp</p>
                </div>
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="card text-center py-3">
                            <p className="text-2xl font-black text-tet-gold">{stats.totalGames}</p>
                            <p className="text-xs text-tet-cream/50">Tổng ván</p>
                        </div>
                        <div className="card text-center py-3">
                            <p className="text-2xl font-black text-tet-gold">{stats.totalPlayers}</p>
                            <p className="text-xs text-tet-cream/50">Người chơi</p>
                        </div>
                        <div className="card text-center py-3">
                            <p className="text-2xl font-black text-green-500">{stats.gamesWithWinner}</p>
                            <p className="text-xs text-tet-cream/50">Có người thắng</p>
                        </div>
                        <div className="card text-center py-3">
                            <p className="text-2xl font-black text-tet-red">{stats.avgNumbersToWin || "—"}</p>
                            <p className="text-xs text-tet-cream/50">TB số để thắng</p>
                        </div>
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "leaderboard"
                            ? "bg-tet-gold text-tet-red-dark shadow-lg"
                            : "bg-tet-card text-tet-cream/60 hover:text-tet-cream/80"
                            }`}
                    >
                        Xếp hạng
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "history"
                            ? "bg-tet-gold text-tet-red-dark shadow-lg"
                            : "bg-tet-card text-tet-cream/60 hover:text-tet-cream/80"
                            }`}
                    >
                        Lịch sử
                    </button>
                </div>

                {/* Leaderboard Tab */}
                {activeTab === "leaderboard" && (
                    <div className="card space-y-1 overflow-hidden">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 space-y-2">
                                <p className="text-tet-cream/50 text-lg font-bold">—</p>
                                <p className="text-tet-cream/50">Chưa có dữ liệu</p>
                                <p className="text-tet-cream/30 text-xs">Chơi vài ván để thấy bảng xếp hạng!</p>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-1 text-xs font-bold text-tet-cream/50 py-2 px-1 border-b border-tet-cream/10">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-4">Tên</div>
                                    <div className="col-span-2 text-center">Trận</div>
                                    <div className="col-span-2 text-center">Thắng</div>
                                    <div className="col-span-1 text-center">Hụt</div>
                                    <div className="col-span-2 text-center">Tỉ lệ</div>
                                </div>

                                {/* Players */}
                                {leaderboard.map((player, index) => (
                                    <div
                                        key={player.persistent_id}
                                        className={`grid grid-cols-12 gap-1 items-center py-2.5 px-1 rounded-lg text-sm ${index < 3
                                            ? "bg-tet-gold/10 border border-tet-gold/20"
                                            : index % 2 === 0
                                                ? "bg-tet-cream/5"
                                                : ""
                                            }`}
                                    >
                                        <div className="col-span-1 font-bold text-center">
                                            {getMedal(index)}
                                        </div>
                                        <div className="col-span-4 font-bold text-tet-cream/90 truncate">
                                            {player.name}
                                        </div>
                                        <div className="col-span-2 text-center text-tet-cream/60">
                                            {player.total_games}
                                        </div>
                                        <div className="col-span-2 text-center font-bold text-tet-gold">
                                            {player.total_wins}
                                        </div>
                                        <div className="col-span-1 text-center text-red-400 text-xs">
                                            {player.total_false_alarms}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${player.win_rate >= 50
                                                ? "bg-green-500/20 text-green-400"
                                                : player.win_rate >= 25
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-tet-cream/10 text-tet-cream/50"
                                                }`}>
                                                {player.win_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <div className="card text-center py-8 space-y-2">
                                <p className="text-tet-cream/50 text-lg font-bold">—</p>
                                <p className="text-tet-cream/50">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            history.map((game) => (
                                <div key={game.id} className="card py-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${game.winner_name ? "bg-green-500/20 text-green-400" : "bg-tet-cream/10 text-tet-cream/40"}`}>
                                                {game.winner_name ? "THẮNG" : "HÒA"}
                                            </span>
                                            <div>
                                                <p className="font-bold text-sm text-tet-cream/80">
                                                    Phòng {game.room_code}
                                                </p>
                                                <p className="text-xs text-tet-cream/40">
                                                    {game.player_count} người • {game.numbers_called} số
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-tet-cream/30">
                                            {formatDate(game.ended_at)}
                                        </p>
                                    </div>
                                    {game.winner_name && (
                                        <div className="flex items-center gap-2 bg-tet-gold/10 rounded-lg px-3 py-1.5 mt-1">
                                            <span className="text-sm font-black text-tet-gold">★</span>
                                            <span className="text-sm font-bold text-tet-gold">
                                                {game.winner_name}
                                            </span>
                                            {game.winning_numbers && (
                                                <span className="text-xs text-tet-cream/40 ml-auto">
                                                    [{game.winning_numbers.join(", ")}]
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Copyright */}
                <div className="text-center text-xs py-3 text-tet-cream/30">
                    © 2026{" "}
                    <a
                        href="https://www.hailamdev.space/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tet-gold/50 hover:text-tet-gold underline underline-offset-2 transition-colors"
                    >
                        Hailamdev
                    </a>
                </div>
            </div>
        </div>
    );
}
