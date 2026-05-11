import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
    Clock, CheckCircle2, BarChart3, Video, ChevronRight,
    Loader2, Rocket, Calendar as CalIcon, TrendingUp,
    Zap, Users, Trophy, Briefcase
} from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getDashboardData } from "../api/analytics-api"
import { getMyApplications } from "../api/application-api"
import { getMyDrives } from "../api/drive-api"
import SpotlightCard from "../bits/SpotlightCard"
import CountUp from "../bits/CountUp"
import {
    RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts"

// ── Status configs ─────────────────────────────────────────
const STATUS_CFG = {
    applied:              { label: "Applied",         cls: "text-zinc-400  bg-zinc-500/10  border-zinc-500/20" },
    screened:             { label: "Eligible",        cls: "text-blue-400  bg-blue-500/10  border-blue-500/20" },
    exam_invited:         { label: "Exam Invite",     cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    exam_done:            { label: "Exam Done",       cls: "text-blue-400  bg-blue-500/10  border-blue-500/20" },
    shortlisted:          { label: "Shortlisted 🎯",  cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    interview_scheduled:  { label: "Interview Set",   cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    interviewed:          { label: "Interviewed",     cls: "text-blue-400  bg-blue-500/10  border-blue-500/20" },
    selected:             { label: "Selected 🎉",     cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    rejected:             { label: "Not Selected",    cls: "text-red-400   bg-red-500/10   border-red-500/20" },
    waitlisted:           { label: "Waitlisted",      cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
}

// ── Helpers ────────────────────────────────────────────────
function timeUntil(date) {
    const diff = new Date(date) - Date.now()
    if (diff <= 0) return "Now"
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (d > 0) return `Starts in ${d}d ${h}h`
    if (h > 0) return `Starts in ${h}h ${m}m`
    return `Starts in ${m}m`
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

// ── Calendar mini ─────────────────────────────────────────
function MiniCalendar({ events = [] }) {
    const [cur, setCur] = useState(new Date())
    const year = cur.getFullYear()
    const month = cur.getMonth()
    const today = new Date()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

    const eventDays = new Set(events.map(e => {
        const d = new Date(e.startTime || e.start)
        return d.getMonth() === month && d.getFullYear() === year ? d.getDate() : null
    }).filter(Boolean))

    return (
        <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">{MONTHS[month]} {year}</h3>
                <div className="flex gap-1">
                    <button onClick={() => setCur(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 text-xs transition-colors">‹</button>
                    <button onClick={() => setCur(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 text-xs transition-colors">›</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="text-[10px] text-zinc-600 font-semibold text-center">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                    const hasEvent = eventDays.has(day)
                    return (
                        <div key={day} className={`relative h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                            ${isToday ? "bg-violet-600 text-white font-bold" : "text-zinc-400 hover:bg-white/5"}
                        `}>
                            {day}
                            {hasEvent && !isToday && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Progress donut ─────────────────────────────────────────
function ProgressDonut({ overall, skills }) {
    const skillData = [
        { name: "Coding",        value: skills.coding       || 0, fill: "#8b5cf6" },
        { name: "Aptitude",      value: skills.aptitude     || 0, fill: "#6366f1" },
        { name: "System Design", value: skills.system_design || 0, fill: "#22c55e" },
        { name: "Behavioral",    value: skills.behavioral   || 0, fill: "#f59e0b" },
    ]
    return (
        <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Progress Overview</h3>
                <Link to="/results" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">View Detailed Report →</Link>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: overall, fill: "#8b5cf6" }]} startAngle={90} endAngle={-270}>
                            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#27272a" }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{overall}%</span>
                        <span className="text-[9px] text-zinc-500 font-semibold">Overall</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2.5">
                    {skillData.map(s => (
                        <div key={s.name} className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 w-28 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                                <span className="text-[11px] text-zinc-400 font-medium">{s.name}</span>
                            </div>
                            <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.value}%`, background: s.fill }} />
                            </div>
                            <span className="text-xs font-bold text-zinc-300 w-8 text-right">{s.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Student Dashboard ──────────────────────────────────────
function StudentDashboard() {
    const [dash, setDash]     = useState(null)
    const [apps, setApps]     = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            getDashboardData().catch(() => null),
            getMyApplications().catch(() => ({ data: [] }))
        ]).then(([dashRes, appsRes]) => {
            setDash(dashRes?.data || null)
            setApps(appsRes?.data || [])
        }).finally(() => setLoading(false))
    }, [])

    if (loading) return <Spinner />

    const stats = dash?.stats || {}
    const upcoming = dash?.upcomingAssessments || []
    const skills = dash?.skillBreakdown || {}
    const overall = stats.overallProgress || stats.avgScore || 0

    const activeApps  = apps.filter(a => !["rejected","selected","waitlisted"].includes(a.status))
    const doneApps    = apps.filter(a => ["rejected","selected","waitlisted"].includes(a.status))

    const statCards = [
        { label: "Upcoming Assessments", value: upcoming.length, sub: `${upcoming.length} scheduled`, color: "text-violet-400", icon: "📅" },
        { label: "Completed",            value: stats.completedCount || 0, sub: "Assessments", color: "text-emerald-400", icon: "✅" },
        { label: "In Pipeline",          value: activeApps.length, sub: "Active applications", color: "text-blue-400", icon: "⚡" },
        { label: "Average Score",        value: `${stats.avgScore || 0}%`, sub: "Across all tests", color: "text-yellow-400", icon: "📊", noCountUp: true },
    ]

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back 👋</h1>
                <p className="text-zinc-400 mt-0.5 text-sm">Track your assessments, interviews and progress in one place.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <SpotlightCard key={s.label} className="p-5 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col gap-1" spotlightColor="rgba(255,255,255,0.04)">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">{s.label}</span>
                            <span className="text-lg">{s.icon}</span>
                        </div>
                        <span className={`text-3xl font-black ${s.color}`}>
                            {s.noCountUp ? s.value : <CountUp to={typeof s.value === "number" ? s.value : 0} />}
                        </span>
                        <span className="text-[11px] text-zinc-600">{s.sub}</span>
                    </SpotlightCard>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Left: Assessments */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Upcoming Assessments */}
                    <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white text-sm">Upcoming Assessments</h3>
                            <Link to="/my-applications" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">View All</Link>
                        </div>
                        {upcoming.length === 0 ? (
                            <EmptyState icon="📝" text="No upcoming assessments" />
                        ) : (
                            <div className="space-y-3">
                                {upcoming.slice(0, 4).map(exam => (
                                    <div key={exam._id} className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 text-lg">📝</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{exam.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {fmtDate(exam.startTime)} · {exam.duration || 90} mins
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-violet-400">{timeUntil(exam.startTime)}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Applications */}
                    {activeApps.length > 0 && (
                        <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white text-sm">Active Applications</h3>
                                <Link to="/my-applications" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">View All</Link>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                {activeApps.slice(0, 4).map(app => {
                                    const cfg = STATUS_CFG[app.status] || STATUS_CFG.applied
                                    return (
                                        <div key={app._id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{app.driveId?.title || "Drive"}</p>
                                                    {app.driveId?.company && <p className="text-[11px] text-zinc-500">{app.driveId.company}</p>}
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wide ${cfg.cls}`}>{cfg.label}</span>
                                            </div>
                                            {app.examScore != null && (
                                                <div className="text-[11px] text-zinc-500">Exam: <span className="text-white font-bold">{app.examScore}</span></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past (compact) */}
                    {doneApps.length > 0 && (
                        <div className="bg-[#09090b] border border-white/5 rounded-2xl p-5">
                            <h3 className="font-bold text-white text-sm mb-4">Past Applications</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {doneApps.slice(0, 4).map(app => {
                                    const cfg = STATUS_CFG[app.status] || STATUS_CFG.applied
                                    return (
                                        <div key={app._id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-zinc-300 truncate">{app.driveId?.title || "Drive"}</p>
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${cfg.cls}`}>{cfg.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Calendar + Progress */}
                <div className="space-y-5">
                    <MiniCalendar events={upcoming} />
                    <ProgressDonut overall={overall} skills={skills} />
                </div>
            </div>
        </div>
    )
}

// ── Examiner Dashboard ─────────────────────────────────────
function ExaminerDashboard() {
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyDrives()
            .then(res => setDrives(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <Spinner />

    const stats = [
        { label: "Total Drives",  value: drives.length,                                                                     icon: Briefcase, color: "text-blue-400" },
        { label: "Active",        value: drives.filter(d => ["open","exam_scheduled","interviewing"].includes(d.status)).length, icon: Zap,      color: "text-violet-400" },
        { label: "Applicants",    value: drives.reduce((s, d) => s + (d.stats?.totalApplicants || 0), 0),                   icon: Users,     color: "text-yellow-400" },
        { label: "Selected",      value: drives.reduce((s, d) => s + (d.stats?.selected || 0), 0),                          icon: Trophy,    color: "text-emerald-400" },
    ]

    const DRIVE_STATUS = {
        draft:          { label: "Draft",        cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
        open:           { label: "Open",         cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        exam_scheduled: { label: "Exam Live",    cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        interviewing:   { label: "Interviewing", cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
        closed:         { label: "Closed",       cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Examiner Command Center</h1>
                <p className="text-zinc-400 mt-1">Manage hiring pipelines and discover top talent.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(s => {
                    const Icon = s.icon
                    return (
                        <SpotlightCard key={s.label} className="p-6 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col justify-between h-32" spotlightColor="rgba(255,255,255,0.05)">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.label}</span>
                                <Icon size={16} className={s.color} />
                            </div>
                            <span className={`text-4xl font-black ${s.color}`}><CountUp to={s.value} /></span>
                        </SpotlightCard>
                    )
                })}
            </div>

            <h2 className="text-sm font-bold text-white tracking-wide">Pipeline Overview</h2>

            {drives.length === 0 ? (
                <EmptyState icon="🏢" text="No drives yet" cta={<Link to="/drive/create" className="text-violet-400 text-sm font-medium hover:text-violet-300">Create your first drive →</Link>} />
            ) : (
                <div className="bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Drive</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Applicants</th>
                                <th className="px-6 py-4 text-center">Shortlisted</th>
                                <th className="px-6 py-4 text-center">Selected</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {drives.map(drive => {
                                const sc = DRIVE_STATUS[drive.status] || DRIVE_STATUS.draft
                                return (
                                    <tr key={drive._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white text-base">{drive.title}</p>
                                            {drive.company && <p className="text-xs font-semibold text-zinc-500">{drive.company}</p>}
                                        </td>
                                        <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${sc.cls}`}>{sc.label}</span></td>
                                        <td className="px-6 py-4 text-center font-mono text-zinc-300">{drive.stats?.totalApplicants || 0}</td>
                                        <td className="px-6 py-4 text-center font-mono text-zinc-300">{drive.stats?.shortlisted || 0}</td>
                                        <td className="px-6 py-4 text-center font-mono text-emerald-400">{drive.stats?.selected || 0}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to="/my-drives" className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-violet-300">
                                                Manage <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ── Exports ────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuthStore()
    return user?.role === "examiner" ? <ExaminerDashboard /> : <StudentDashboard />
}

function Spinner() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
        </div>
    )
}

function EmptyState({ icon, text, cta }) {
    return (
        <div className="border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">{icon}</span>
            <p className="text-zinc-400 text-sm">{text}</p>
            {cta && <div>{cta}</div>}
        </div>
    )
}
