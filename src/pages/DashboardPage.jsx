import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Building2, FileText, Trophy, ChevronRight, Clock, Zap, CheckCircle2, AlertCircle, Loader2, Rocket, Briefcase, UserCheck, Users } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getMyApplications } from "../api/application-api"
import { getMyDrives } from "../api/drive-api"
import SpotlightCard from "../bits/SpotlightCard"
import CountUp from "../bits/CountUp"
import ClickSpark from "../bits/ClickSpark"

const PIPELINE = ["applied","screened","exam_invited","exam_done","shortlisted","interviewed","selected"]
const PIDX = Object.fromEntries(PIPELINE.map((s,i) => [s, i]))

const STATUS_CFG = {
    applied:             { label: "Applied",          cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
    screened:            { label: "Eligible",         cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    exam_invited:        { label: "Exam Invite",      cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    exam_done:           { label: "Exam Submitted",   cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    shortlisted:         { label: "Shortlisted 🎯",   cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    interview_scheduled: { label: "Interview Set",    cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    interviewed:         { label: "Interviewed",      cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    selected:            { label: "Selected 🎉",      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    rejected:            { label: "Not Selected",     cls: "text-red-400 bg-red-500/10 border-red-500/20" },
    waitlisted:          { label: "Waitlisted",       cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
}

// ── Student Dashboard ──────────────────────────────────────────────────────────
function StudentDashboard() {
    const [apps, setApps] = useState([])
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyApplications().then(res => {
            setApps(res.data || [])
        }).finally(() => setLoading(false))
    }, [])

    if (loading) return <Loader center />

    const activeApps = apps.filter(a => !["rejected","selected","waitlisted"].includes(a.status))
    const doneApps   = apps.filter(a => ["rejected","selected","waitlisted"].includes(a.status))

    const stats = [
        { label: "Applied",     value: apps.length, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "In Pipeline", value: activeApps.length, color: "text-violet-400", bg: "bg-violet-500/10" },
        { label: "Shortlisted", value: apps.filter(a => ["shortlisted","interviewed"].includes(a.status)).length, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { label: "Selected",    value: apps.filter(a => a.status === "selected").length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    ]

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Student Command Center</h1>
                <p className="text-zinc-400 mt-1">Track your hiring journey and secure your dream role.</p>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(s => (
                    <SpotlightCard key={s.label} className="p-6 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col items-start gap-2" spotlightColor="rgba(255, 255, 255, 0.05)">
                        <span className={`text-4xl font-black ${s.color}`}><CountUp to={s.value} /></span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.label}</span>
                    </SpotlightCard>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Active applications */}
                <div className="space-y-6">
                    <div>
                        <SectionTitle>Active Assessments</SectionTitle>
                        {activeApps.length === 0 ? (
                            <Empty icon={<FileText size={40} />} text="No active assessments" />
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {activeApps.map(app => <AppCard key={app._id} app={app} />)}
                            </div>
                        )}
                    </div>

                    {doneApps.length > 0 && (
                        <div className="pt-4">
                            <SectionTitle>Past Assessments</SectionTitle>
                            <div className="grid md:grid-cols-2 gap-3">
                                {doneApps.map(app => <AppCard key={app._id} app={app} compact />)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Examiner Dashboard ─────────────────────────────────────────────────────────
function ExaminerDashboard() {
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyDrives()
            .then(res => setDrives(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <Loader center />

    const stats = [
        { label: "Total Drives",  value: drives.length, icon: Briefcase, color: "text-blue-400" },
        { label: "Active",        value: drives.filter(d => ["open","exam_scheduled","interviewing"].includes(d.status)).length, icon: Zap, color: "text-violet-400" },
        { label: "Applicants",    value: drives.reduce((s, d) => s + (d.stats?.totalApplicants || 0), 0), icon: Users, color: "text-yellow-400" },
        { label: "Selected",      value: drives.reduce((s, d) => s + (d.stats?.selected || 0), 0), icon: Trophy, color: "text-emerald-400" },
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

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(s => {
                    const Icon = s.icon;
                    return (
                        <SpotlightCard key={s.label} className="p-6 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col justify-between h-32" spotlightColor="rgba(255, 255, 255, 0.05)">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.label}</span>
                                <Icon size={16} className={s.color} />
                            </div>
                            <span className={`text-4xl font-black ${s.color}`}><CountUp to={s.value} /></span>
                        </SpotlightCard>
                    )
                })}
            </div>

            <SectionTitle>Pipeline Overview</SectionTitle>

            {drives.length === 0 ? (
                <Empty icon={<Building2 size={40} />} text="No drives initiated yet" sub={<Link to="/drive/create" className="text-violet-400 text-sm font-medium hover:text-violet-300">Create your first drive →</Link>} />
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
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${sc.cls}`}>{sc.label}</span>
                                        </td>
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

// ── Main export ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuthStore()
    return user?.role === "examiner" ? <ExaminerDashboard /> : <StudentDashboard />
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function AppCard({ app, compact = false }) {
    const cfg = STATUS_CFG[app.status] || STATUS_CFG.applied
    const isTerminal = ["rejected","selected","waitlisted"].includes(app.status)
    const curIdx = PIDX[app.status] ?? 0

    return (
        <SpotlightCard className={`border ${app.status === "selected" ? "border-emerald-500/30 bg-emerald-500/5" : app.status === "rejected" ? "border-white/5 bg-black/40" : "border-white/10 bg-[#09090b]"} rounded-2xl ${compact ? "p-4" : "p-5"} shadow-lg`} spotlightColor="rgba(255, 255, 255, 0.05)">
            <div className={`flex justify-between items-start gap-4 ${compact ? "" : "mb-4"}`}>
                <div>
                    {app.driveId?.company && <p className="text-xs font-semibold text-zinc-500 mb-0.5">{app.driveId.company}</p>}
                    <p className="text-base font-bold text-white">{app.driveId?.title || "Drive"}</p>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                        Applied: {new Date(app.appliedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider shrink-0 ${cfg.cls}`}>{cfg.label}</span>
            </div>

            {/* Pipeline bar */}
            {!isTerminal && !compact && (
                <div className="flex items-center mt-2">
                    {PIPELINE.map((s, i) => {
                        const done   = i < curIdx
                        const active = i === curIdx
                        return (
                            <div key={s} className="flex items-center" style={{ flex: i < PIPELINE.length-1 ? 1 : "none" }}>
                                <div className={`shrink-0 rounded-full transition-all ${active ? "w-3 h-3 bg-violet-500 ring-4 ring-violet-500/20" : done ? "w-2 h-2 bg-emerald-500" : "w-2 h-2 bg-zinc-800"}`} />
                                {i < PIPELINE.length-1 && (
                                    <div className={`flex-1 h-[2px] mx-1 ${done ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Selected banner */}
            {app.status === "selected" && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-bold text-center flex items-center justify-center gap-2">
                    🎊 Offer Extended!
                    {app.finalScore != null && <span className="text-emerald-500/70 font-medium">· Final Score: {app.finalScore}/100</span>}
                </div>
            )}

            {/* Scores */}
            {(app.examScore != null || app.finalScore != null) && !compact && (
                <div className="flex gap-3 mt-4">
                    {app.examScore != null && (
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Exam Score</p>
                            <p className="text-xl font-black font-mono text-white mt-1">{app.examScore}</p>
                        </div>
                    )}
                    {app.finalScore != null && (
                        <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">Final Score</p>
                            <p className="text-xl font-black font-mono text-emerald-400 mt-1">{app.finalScore}</p>
                        </div>
                    )}
                </div>
            )}
        </SpotlightCard>
    )
}

function SectionTitle({ children, className = "" }) {
    return <h2 className={`text-sm font-bold text-white tracking-wide mb-4 ${className}`}>{children}</h2>
}

function Empty({ icon, text, sub }) {
    return (
        <div className="border border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <div className="text-zinc-600 mb-4">{icon}</div>
            <p className="text-zinc-300 font-medium">{text}</p>
            {sub && <div className="mt-2">{sub}</div>}
        </div>
    )
}

function Loader({ center }) {
    return (
        <div className={`flex justify-center items-center p-20 ${center ? "h-full w-full" : ""}`}>
            <Loader2 size={32} className="text-violet-500 animate-spin" />
        </div>
    )
}
