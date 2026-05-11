import { Trophy, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { getMyAchievements } from "../api/achievement-api"
import { useState, useEffect } from "react"

const BADGE_ICONS = {
    top_performer:      "🥇",
    consistent_learner: "📚",
    problem_solver:     "🧩",
    rising_star:        "⭐",
    first_selection:    "🎉",
    interview_ace:      "🎙️",
    speed_demon:        "⚡",
}

export default function AchievementsPage() {
    const [items, setItems]   = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyAchievements()
            .then(res => setItems(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const unlocked = items.filter(a => a.unlocked)
    const locked   = items.filter(a => !a.unlocked)

    return (
        <div className="p-8 w-full max-w-6xl animate-in fade-in duration-500 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Achievements</h1>
                <p className="text-zinc-400 text-sm mt-1">Complete assessments and interviews to unlock badges.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Earned",  value: unlocked.length, color: "text-violet-400", icon: "🏆" },
                    { label: "Locked",  value: locked.length,   color: "text-zinc-500",   icon: "🔒" },
                    { label: "Total",   value: items.length,    color: "text-blue-400",   icon: "📦" },
                    { label: "Progress", value: `${items.length ? Math.round(unlocked.length / items.length * 100) : 0}%`, color: "text-emerald-400", icon: "📈", raw: true },
                ].map(s => (
                    <div key={s.label} className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">{s.label}</span>
                            <span>{s.icon}</span>
                        </div>
                        <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            {unlocked.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-white mb-4">🏅 Earned Badges</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {unlocked.map((a, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 p-5 bg-[#09090b] border border-violet-500/20 rounded-2xl text-center hover:border-violet-500/40 transition-colors">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-3xl">
                                    {BADGE_ICONS[a.badge] || "🏅"}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{a.title}</p>
                                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{a.description}</p>
                                    {a.unlockedAt && (
                                        <p className="text-[10px] text-zinc-700 font-mono mt-2">
                                            {new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {locked.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-zinc-500 mb-4">🔒 Locked Badges</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {locked.map((a, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 p-5 bg-[#09090b] border border-white/5 rounded-2xl text-center opacity-50">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl grayscale">
                                    {BADGE_ICONS[a.badge] || "🏅"}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-400">{a.title}</p>
                                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{a.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {items.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <Trophy size={48} className="mb-4 opacity-30" />
                    <p className="text-sm">No achievements yet — take your first exam!</p>
                    <Link to="/my-applications" className="text-violet-400 text-sm font-medium mt-2 hover:text-violet-300">Browse Drives →</Link>
                </div>
            )}
        </div>
    )
}
