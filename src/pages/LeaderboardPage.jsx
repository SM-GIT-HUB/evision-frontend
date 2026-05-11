import { useState, useEffect } from "react"
import { Trophy, Medal, Crown, TrendingUp, Search, Filter } from "lucide-react"
import { getGlobalLeaderboard } from "../api/analytics-api"

const BADGE_STYLE = {
    gold:   { ring: "ring-yellow-400/50", bg: "bg-yellow-400/10 border-yellow-400/30", icon: <Crown size={14} className="text-yellow-400" /> },
    silver: { ring: "ring-zinc-300/50",   bg: "bg-zinc-400/10 border-zinc-400/30",     icon: <Medal size={14} className="text-zinc-300" /> },
    bronze: { ring: "ring-orange-400/50", bg: "bg-orange-400/10 border-orange-400/30", icon: <Medal size={14} className="text-orange-400" /> },
    "":     { ring: "",                   bg: "",                                        icon: null },
}

export default function LeaderboardPage() {
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [rawLeaders, setRawLeaders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getGlobalLeaderboard().then(res => {
            setRawLeaders(res?.data || [])
            setLoading(false)
        }).catch(err => {
            console.error(err)
            setLoading(false)
        })
    }, [])

    const leaders = rawLeaders.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

    const top3 = leaders.slice(0, 3)
    const rest  = leaders.slice(3)

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh]"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
    }

    return (
        <div className="p-8 w-full max-w-6xl animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">Top performers across all assessments</p>
                </div>
                <div className="flex items-center gap-2">
                    {["all", "weekly", "monthly"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors capitalize
                                ${filter === f ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 placeholder-zinc-600 transition-colors"
                />
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4">
                {[top3[1], top3[0], top3[2]].map((l, pos) => {
                    if (!l) return <div key={pos} />
                    const isFirst = l.rank === 1
                    const badge = BADGE_STYLE[l.badge]
                    return (
                        <div key={l.rank} className={`bg-[#09090b] border rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all
                            ${isFirst ? "border-yellow-400/30 bg-yellow-400/5 scale-105 shadow-[0_0_30px_rgba(250,204,21,0.1)]" : "border-white/5"}`}>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                {l.rank === 1 ? "1st" : l.rank === 2 ? "2nd" : "3rd"}
                            </div>
                            <div className={`relative w-14 h-14 rounded-full bg-zinc-800 border-2 flex items-center justify-center text-lg font-black text-white ring-2 ${badge.ring}`}>
                                {l.avatar}
                                {badge.icon && (
                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border flex items-center justify-center ${badge.bg}`}>
                                        {badge.icon}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{l.name}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{l.exams} exams</p>
                            </div>
                            <div className={`text-2xl font-black ${isFirst ? "text-yellow-400" : "text-violet-400"}`}>{l.score}%</div>
                        </div>
                    )
                })}
            </div>

            {/* Table */}
            <div className="bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/5">
                        <tr className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                            <th className="text-left px-5 py-3">Rank</th>
                            <th className="text-left px-5 py-3">Student</th>
                            <th className="text-center px-5 py-3">Exams</th>
                            <th className="text-center px-5 py-3">Avg Score</th>
                            <th className="text-center px-5 py-3">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rest.map(l => (
                            <tr key={l.rank} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-3.5">
                                    <span className="text-zinc-400 font-mono font-bold text-sm">#{l.rank}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-zinc-300">
                                            {l.avatar}
                                        </div>
                                        <span className="font-semibold text-zinc-300">{l.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-center text-zinc-400 font-mono">{l.exams}</td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className="font-bold text-violet-400">{l.score}%</span>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className={`text-xs font-bold ${l.change > 0 ? "text-emerald-400" : l.change < 0 ? "text-red-400" : "text-zinc-600"}`}>
                                        {l.change > 0 ? `+${l.change}` : l.change === 0 ? "-" : l.change}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
