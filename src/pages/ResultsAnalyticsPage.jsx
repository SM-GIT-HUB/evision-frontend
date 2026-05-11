import { useState, useEffect } from "react"
import { Loader2, TrendingUp, Award, Star } from "lucide-react"
import { getAnalytics } from "../api/analytics-api"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"

// ── Color palettes ─────────────────────────────────────────
const DIST_COLORS = ["#22c55e", "#8b5cf6", "#f59e0b", "#ef4444"]

const INSIGHT_CFG = {
    positive: { bg: "bg-emerald-500/10 border-emerald-500/20", icon: "📈", text: "text-emerald-400" },
    warning:  { bg: "bg-yellow-500/10  border-yellow-500/20",  icon: "⚠️", text: "text-yellow-400" },
    tip:      { bg: "bg-blue-500/10    border-blue-500/20",    icon: "💡", text: "text-blue-400" },
    info:     { bg: "bg-violet-500/10  border-violet-500/20",  icon: "ℹ️", text: "text-violet-400" },
}

const BADGE_ICONS = {
    top_performer:      "🥇",
    consistent_learner: "📚",
    problem_solver:     "🧩",
    rising_star:        "⭐",
    first_selection:    "🎉",
    interview_ace:      "🎙️",
    speed_demon:        "⚡",
}

// ── Custom tooltip for line chart ──────────────────────────
function CustomLineTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
            <p className="text-zinc-400 mb-1">{label}</p>
            <p className="text-white font-bold">{payload[0].value}%</p>
        </div>
    )
}

export default function ResultsAnalyticsPage() {
    const [data, setData]     = useState(null)
    const [range, setRange]   = useState("6months")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        getAnalytics(range)
            .then(res => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [range])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
        </div>
    )

    const summary  = data?.summary  || {}
    const monthly  = data?.monthlyScores || []
    const distRaw  = data?.scoreDistribution || {}
    const skills   = data?.skillBreakdown || {}
    const recent   = data?.recentAssessments || []
    const achiev   = data?.achievements || []
    const insights = data?.insights || []

    const distData = [
        { name: "90% and above", value: distRaw.above90    || 0 },
        { name: "75% – 89%",     value: distRaw.range75to89 || 0 },
        { name: "50% – 74%",     value: distRaw.range50to74 || 0 },
        { name: "Below 50%",     value: distRaw.below50    || 0 },
    ].filter(d => d.value > 0)

    const total = distData.reduce((s, d) => s + d.value, 0) || 1

    const radarData = [
        { subject: "Problem Solving", value: skills.coding       || 0, fullMark: 100 },
        { subject: "Web Dev",          value: skills.system_design || 0, fullMark: 100 },
        { subject: "Coding",           value: skills.coding       || 0, fullMark: 100 },
        { subject: "DBMS",             value: skills.aptitude     || 0, fullMark: 100 },
        { subject: "System Design",    value: skills.system_design || 0, fullMark: 100 },
    ]

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Results &amp; Analytics</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">Track your performance and improvement over time.</p>
                </div>
                <select
                    value={range}
                    onChange={e => setRange(e.target.value)}
                    className="bg-zinc-900 border border-white/10 text-zinc-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-violet-500 transition-colors"
                >
                    <option value="3months">Last 3 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="12months">Last 12 Months</option>
                </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Assessments Taken", value: summary.totalExams  || 0, sub: "↑ total", color: "text-violet-400", icon: "📄" },
                    { label: "Average Score",      value: `${summary.avgScore || 0}%`, sub: "Across tests", color: "text-emerald-400", icon: "📊", raw: true },
                    { label: "Highest Score",      value: `${summary.highestScore || 0}%`, sub: summary.highestScoreTitle || "Best exam", color: "text-blue-400", icon: "🏆", raw: true },
                    { label: "Rank",               value: `#${summary.rank || "–"}`, sub: `Top ${summary.topPercent || 100}% of students`, color: "text-yellow-400", icon: "🎯", raw: true },
                ].map(s => (
                    <div key={s.label} className="bg-[#09090b] border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">{s.label}</span>
                            <span className="text-lg">{s.icon}</span>
                        </div>
                        <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                        <span className="text-[11px] text-zinc-600">{s.sub}</span>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Performance Line Chart */}
                <div className="lg:col-span-2 bg-[#09090b] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-sm">Performance Overview</h3>
                        <span className="text-xs text-zinc-500">Score (%)</span>
                    </div>
                    {monthly.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">No data yet — take your first assessment!</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomLineTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="avgScore"
                                    stroke="#8b5cf6"
                                    strokeWidth={2.5}
                                    dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 2, stroke: "#09090b" }}
                                    activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2, fill: "#09090b" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Score Distribution Donut */}
                <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-white text-sm mb-4">Score Distribution</h3>
                    {distData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">No results yet</div>
                    ) : (
                        <>
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={distData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                                            {distData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i]} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black text-white">{summary.totalExams || 0}</span>
                                    <span className="text-[10px] text-zinc-500">Total</span>
                                </div>
                            </div>
                            <div className="space-y-2 mt-3">
                                {distData.map((d, i) => (
                                    <div key={d.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: DIST_COLORS[i] }} />
                                            <span className="text-zinc-400">{d.name}</span>
                                        </div>
                                        <span className="text-zinc-300 font-bold">{d.value} ({Math.round(d.value / total * 100)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Assessments */}
                <div className="lg:col-span-2 bg-[#09090b] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-white text-sm mb-4">Recent Assessments</h3>
                    {recent.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">No assessments yet</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-zinc-600 border-b border-white/5">
                                        <th className="text-left pb-3 font-semibold">Assessment</th>
                                        <th className="text-left pb-3 font-semibold">Date</th>
                                        <th className="text-left pb-3 font-semibold">Score</th>
                                        <th className="text-left pb-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recent.map((r, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 pr-4">
                                                <p className="text-white font-semibold">{r.title}</p>
                                            </td>
                                            <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">
                                                {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`font-bold ${r.score >= 75 ? "text-emerald-400" : r.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                                    {r.score}%
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Skill Radar + Insights */}
                <div className="space-y-5">
                    {/* Radar */}
                    <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                        <h3 className="font-bold text-white text-sm mb-3">Skill Strength</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                <PolarGrid stroke="#27272a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#71717a", fontSize: 9 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                        <h3 className="font-bold text-white text-sm mb-3">Insights</h3>
                        <div className="space-y-3">
                            {insights.length === 0 ? (
                                <p className="text-zinc-600 text-xs">Take more exams to see insights.</p>
                            ) : insights.map((ins, i) => {
                                const cfg = INSIGHT_CFG[ins.type] || INSIGHT_CFG.info
                                return (
                                    <div key={i} className={`flex gap-3 p-3 rounded-xl border ${cfg.bg}`}>
                                        <span className="text-lg shrink-0">{cfg.icon}</span>
                                        <div>
                                            <p className={`text-xs font-bold ${cfg.text}`}>{ins.title}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{ins.message}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievements */}
            {achiev.length > 0 && (
                <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-white text-sm mb-4">Achievements</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {achiev.map((a, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center hover:bg-white/[0.04] transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl">
                                    {BADGE_ICONS[a.badge] || "🏅"}
                                </div>
                                <p className="text-xs font-bold text-white leading-tight">{a.title}</p>
                                <p className="text-[10px] text-zinc-500 leading-tight">{a.description}</p>
                                {a.unlockedAt && (
                                    <p className="text-[9px] text-zinc-700 font-mono">
                                        {new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
