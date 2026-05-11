import { useState, useEffect } from "react"
import { Link, Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
    Building2, Clock, Trophy, CheckCircle2, AlertCircle,
    ChevronRight, Loader2, FileText, ArrowRight, Zap
} from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getMyApplications } from "../api/application-api"
import { getOpenDrives } from "../api/drive-api"

const PIPELINE_STEPS = ["applied", "screened", "exam_invited", "exam_done", "shortlisted", "interviewed", "selected"]
const STEP_IDX = Object.fromEntries(PIPELINE_STEPS.map((s, i) => [s, i]))

const STATUS_CFG = {
    applied:              { label: "Applied",            color: "text-zinc-400",    bg: "bg-zinc-700/30",    border: "border-zinc-700/30" },
    screened:             { label: "Eligible ✅",        color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
    exam_invited:         { label: "Exam Invite Sent",   color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
    exam_done:            { label: "Exam Submitted",     color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
    shortlisted:          { label: "Shortlisted 🎯",     color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
    interview_scheduled:  { label: "Interview Scheduled",color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20" },
    interviewed:          { label: "Interview Done",     color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
    selected:             { label: "Selected 🎉",        color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    rejected:             { label: "Not Selected",       color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
    waitlisted:           { label: "Waitlisted",         color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
}

export default function StudentPortal() {
    const { isAuthenticated, user } = useAuthStore()
    const [applications, setApplications] = useState([])
    const [openDrives, setOpenDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("applications")

    useEffect(() => {
        async function load() {
            try {
                const [appRes, driveRes] = await Promise.allSettled([
                    getMyApplications(),
                    getOpenDrives()
                ])
                if (appRes.status === "fulfilled") setApplications(appRes.value.data || [])
                if (driveRes.status === "fulfilled") setOpenDrives(driveRes.value.data || [])
            } catch {
                toast.error("Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (!isAuthenticated) return <Navigate to="/" replace />

    const stats = {
        applied:     applications.length,
        shortlisted: applications.filter(a => ["shortlisted","interviewed","selected"].includes(a.status)).length,
        selected:    applications.filter(a => a.status === "selected").length,
    }

    // Drives the student hasn't applied to yet
    const appliedDriveIds = new Set(applications.map(a => a.driveId?._id || a.driveId))
    const newDrives = openDrives.filter(d => !appliedDriveIds.has(d._id))

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <Loader2 className="text-violet-400 animate-spin" size={36} />
        </div>
    )

    return (
        <div className="mt-6 max-w-4xl">

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard label="Applied" value={stats.applied} color="text-white" sub="total drives" />
                <StatCard label="Shortlisted" value={stats.shortlisted} color="text-violet-400" sub="in pipeline" />
                <StatCard label="Selected" value={stats.selected} color="text-emerald-400" sub="offers" />
            </div>

            {/* ── New Drives Banner (if any open drives not yet applied) ── */}
            {newDrives.length > 0 && (
                <Link to="/drives"
                    className="flex items-center justify-between bg-violet-600/10 border border-violet-500/30 rounded-2xl px-6 py-4 mb-8 hover:bg-violet-600/15 transition group">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-600/30 rounded-xl flex items-center justify-center">
                            <Zap size={16} className="text-violet-400" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">
                                {newDrives.length} new drive{newDrives.length > 1 ? "s" : ""} open for application
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {newDrives.slice(0, 2).map(d => d.title).join(", ")}{newDrives.length > 2 ? ` +${newDrives.length - 2} more` : ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-violet-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                        Apply Now <ArrowRight size={14} />
                    </div>
                </Link>
            )}

            {/* ── Tab Toggle ── */}
            <div className="flex gap-1 border-b border-zinc-800 mb-6">
                {[
                    { key: "applications", label: "My Applications", count: applications.length },
                    { key: "explore",      label: "Explore Drives",   count: newDrives.length },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                            activeTab === t.key
                                ? "border-violet-500 text-white"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}>
                        {t.label}
                        {t.count > 0 && (
                            <span className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${
                                activeTab === t.key ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"
                            }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── My Applications ── */}
            {activeTab === "applications" && (
                <div className="space-y-4">
                    {applications.length === 0 ? (
                        <EmptyState
                            icon={<FileText size={36} className="opacity-30" />}
                            title="No applications yet"
                            action={<Link to="/drives" className="text-violet-400 hover:underline text-sm">Browse open drives →</Link>}
                        />
                    ) : (
                        applications.map(app => <ApplicationCard key={app._id} app={app} />)
                    )}
                </div>
            )}

            {/* ── Explore Drives ── */}
            {activeTab === "explore" && (
                <div className="space-y-4">
                    {openDrives.length === 0 ? (
                        <EmptyState
                            icon={<Building2 size={36} className="opacity-30" />}
                            title="No drives open right now"
                        />
                    ) : (
                        openDrives.map(drive => {
                            const applied = appliedDriveIds.has(drive._id)
                            const deadline = drive.applicationDeadline ? new Date(drive.applicationDeadline) : null
                            const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86_400_000) : null

                            return (
                                <div key={drive._id} className={`bg-zinc-950 border rounded-2xl p-5 transition ${
                                    applied ? "border-zinc-800/50 opacity-60" : "border-zinc-800 hover:border-zinc-700"
                                }`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                {drive.company && (
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Building2 size={11} /> {drive.company}
                                                    </span>
                                                )}
                                                {daysLeft !== null && daysLeft > 0 && !applied && (
                                                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                                                        <Clock size={11} /> {daysLeft}d left
                                                    </span>
                                                )}
                                                {daysLeft !== null && daysLeft <= 0 && (
                                                    <span className="text-xs text-red-400">Deadline passed</span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-semibold text-white">{drive.title}</h3>
                                            {drive.eligibility?.minCGPA > 0 && (
                                                <p className="text-xs text-zinc-500 mt-1">Min CGPA: {drive.eligibility.minCGPA}</p>
                                            )}
                                        </div>

                                        {applied ? (
                                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex-shrink-0">
                                                <CheckCircle2 size={12} /> Applied
                                            </span>
                                        ) : (
                                            <Link to={`/apply/${drive._id}`}
                                                className="flex-shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-semibold text-xs transition">
                                                Apply <ChevronRight size={12} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

        </div>
    )
}

// ── Application Card ───────────────────────────────────────────────────────────
function ApplicationCard({ app }) {
    const cfg = STATUS_CFG[app.status] || STATUS_CFG.applied
    const isTerminal = ["rejected", "waitlisted", "selected"].includes(app.status)
    const currentIdx = STEP_IDX[app.status] ?? 0

    return (
        <div className={`bg-zinc-950 border rounded-2xl p-6 transition ${
            app.status === "selected" ? "border-emerald-500/40 bg-emerald-500/5" :
            app.status === "rejected" ? "border-zinc-800/50" :
            "border-zinc-800"
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    {app.driveId?.company && (
                        <p className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1">
                            <Building2 size={11} /> {app.driveId.company}
                        </p>
                    )}
                    <h3 className="text-lg font-bold">{app.driveId?.title || "Drive"}</h3>
                    <p className="text-xs text-zinc-600 mt-0.5">
                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                </div>
                <span className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    {cfg.label}
                </span>
            </div>

            {/* Pipeline Progress */}
            {!isTerminal && (
                <div className="mb-5">
                    <div className="relative flex items-center">
                        {PIPELINE_STEPS.map((s, i) => {
                            const done   = i < currentIdx
                            const active = i === currentIdx
                            return (
                                <div key={s} className="flex items-center flex-1 last:flex-none">
                                    <div className={`relative flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all ${
                                        active ? "bg-violet-500 ring-4 ring-violet-500/20 scale-125" :
                                        done   ? "bg-emerald-500" : "bg-zinc-700"
                                    }`}>
                                        {active && (
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-violet-400 font-semibold">
                                                {STATUS_CFG[s]?.label?.replace(/[🎯🎉✅]/g, "").trim()}
                                            </div>
                                        )}
                                    </div>
                                    {i < PIPELINE_STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-emerald-500/60" : "bg-zinc-800"}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-700 mt-3">
                        <span>Applied</span>
                        <span>Shortlisted</span>
                        <span>Selected</span>
                    </div>
                </div>
            )}

            {/* Selected Banner */}
            {app.status === "selected" && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 text-center mb-4">
                    <p className="text-emerald-400 font-bold text-base">🎊 Congratulations! You've been selected!</p>
                    {app.finalScore != null && (
                        <p className="text-emerald-300/70 text-xs mt-1">
                            Final Score: {app.finalScore}/100 · Rank #{app.finalRank}
                        </p>
                    )}
                </div>
            )}

            {/* Rejected */}
            {app.status === "rejected" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-500">
                    {app.screeningReason || "Your application was not shortlisted at this stage. Keep applying!"}
                </div>
            )}

            {/* Scores */}
            {(app.examScore != null || app.interviewScore != null || app.finalScore != null) && (
                <div className="flex gap-3 mt-4">
                    {app.examScore != null && (
                        <ScoreChip label="Exam" value={app.examScore} sub={app.examRank ? `Rank #${app.examRank}` : null} color="text-white" />
                    )}
                    {app.interviewScore != null && (
                        <ScoreChip label="Interview" value={app.interviewScore} color="text-violet-400" />
                    )}
                    {app.finalScore != null && (
                        <ScoreChip label="Final" value={`${app.finalScore}/100`} sub={app.finalRank ? `Rank #${app.finalRank}` : null} color="text-emerald-400" />
                    )}
                </div>
            )}
        </div>
    )
}

function ScoreChip({ label, value, sub, color }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex-1 text-center">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
        </div>
    )
}

function StatCard({ label, value, color, sub }) {
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-zinc-400 mt-1 font-medium">{label}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
        </div>
    )
}

function EmptyState({ icon, title, action }) {
    return (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-14 text-center text-zinc-500">
            <div className="flex justify-center mb-3">{icon}</div>
            <p className="text-base">{title}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    )
}
