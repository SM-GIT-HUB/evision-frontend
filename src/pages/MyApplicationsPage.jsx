import { useState, useEffect } from "react"
import { Link, Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Building2, CheckCircle2, Clock, ChevronRight, Loader2, AlertCircle, Trophy, Video } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getMyApplications } from "../api/application-api"

const PIPELINE_STEPS = [
    { key: "applied",               label: "Applied" },
    { key: "screened",              label: "Screened" },
    { key: "exam_invited",          label: "Exam Invite" },
    { key: "exam_done",             label: "Exam Done" },
    { key: "shortlisted",           label: "Shortlisted" },
    { key: "interview_scheduled",   label: "Interview Scheduled" },
    { key: "interviewed",           label: "Interviewed" },
    { key: "selected",              label: "Selected 🎉" },
]

const STEP_INDEX = Object.fromEntries(PIPELINE_STEPS.map((s, i) => [s.key, i]))

const STATUS_CONFIG = {
    applied:                { color: "text-zinc-400",   bg: "bg-zinc-700/20", border: "border-zinc-700/30",   label: "Applied",               icon: Clock },
    screened:               { color: "text-blue-400",   bg: "bg-blue-500/10", border: "border-blue-500/20",   label: "Eligible",              icon: CheckCircle2 },
    exam_invited:           { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Exam Invite Sent",     icon: Clock },
    exam_done:              { color: "text-blue-300",   bg: "bg-blue-500/10", border: "border-blue-500/20",   label: "Exam Submitted",        icon: CheckCircle2 },
    shortlisted:            { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Shortlisted!",         icon: Trophy },
    interview_scheduled:    { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", label: "Interview Scheduled", icon: Video },
    interviewed:            { color: "text-cyan-400",   bg: "bg-cyan-500/10", border: "border-cyan-500/20",   label: "Interview Done",        icon: CheckCircle2 },
    selected:               { color: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Selected 🎉",       icon: Trophy },
    rejected:               { color: "text-red-400",    bg: "bg-red-500/10",  border: "border-red-500/20",    label: "Not Shortlisted",       icon: AlertCircle },
    waitlisted:             { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Waitlisted",          icon: Clock },
}

export default function MyApplicationsPage({ embedded = false }) {
    const { isAuthenticated } = useAuthStore()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetch() {
            try {
                const res = await getMyApplications()
                setApplications(res.data || [])
            } catch {
                toast.error("Failed to load applications")
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (!isAuthenticated && !embedded) return <Navigate to="/" replace />

    const content = (
        <div className={embedded ? "" : "min-h-screen bg-black text-white px-6 py-10"}>
            <div className={embedded ? "" : "max-w-4xl mx-auto"}>

                <div className="mb-8">
                    <h2 className={embedded ? "text-2xl font-bold" : "text-4xl font-bold"}>My Applications</h2>
                    <p className="text-zinc-400 mt-2 text-sm">Track your application status across all drives.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="text-violet-400 animate-spin" size={32} />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center text-zinc-500">
                        <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No applications yet.</p>
                        <Link to="/drives" className="inline-block mt-4 text-violet-400 hover:underline text-sm">
                            Browse open drives →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {applications.map(app => (
                            <ApplicationCard key={app._id} app={app} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    return content
}

function ApplicationCard({ app }) {
    const drive = app.driveId
    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
    const Icon = cfg.icon

    const currentStepIdx = STEP_INDEX[app.status] ?? 0
    const isTerminal = ["rejected", "waitlisted", "selected"].includes(app.status)

    return (
        <div className={`bg-zinc-950 border rounded-2xl p-7 transition-all ${
            app.status === "selected" ? "border-emerald-500/40" :
            app.status === "rejected" ? "border-red-500/20" :
            "border-zinc-800"
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <p className="text-xs text-zinc-500 mb-1">{drive?.company}</p>
                    <h2 className="text-xl font-bold">{drive?.title}</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon size={14} /> {cfg.label}
                </div>
            </div>

            {/* Progress Bar (only for non-terminal states) */}
            {!isTerminal && (
                <div className="mb-6">
                    <div className="flex items-center gap-0">
                        {PIPELINE_STEPS.slice(0, -1).map((s, i) => {
                            const done = i <= currentStepIdx
                            const active = i === currentStepIdx
                            return (
                                <div key={s.key} className="flex items-center flex-1">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                                        active ? "bg-violet-500 ring-2 ring-violet-500/30" :
                                        done ? "bg-emerald-500" : "bg-zinc-700"
                                    }`} />
                                    {i < PIPELINE_STEPS.length - 2 && (
                                        <div className={`h-0.5 flex-1 ${done ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600 mt-2">
                        <span>Applied</span>
                        <span>Shortlisted</span>
                        <span>Selected</span>
                    </div>
                </div>
            )}

            {/* Selected Banner */}
            {app.status === "selected" && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center mb-4">
                    <p className="text-emerald-400 font-bold text-lg">🎊 Congratulations! You have been selected!</p>
                    {app.finalScore && <p className="text-emerald-300 text-sm mt-1">Final Score: {app.finalScore}/100 | Rank: #{app.finalRank}</p>}
                </div>
            )}

            {/* Rejected Message */}
            {app.status === "rejected" && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-zinc-400 mb-4">
                    {app.screeningReason
                        ? `Screening: ${app.screeningReason}`
                        : "Your application was not shortlisted at this stage. Thank you for applying."}
                </div>
            )}

            {/* Scores (if available) */}
            {(app.examScore !== null || app.interviewScore !== null) && (
                <div className="flex gap-4 mt-2">
                    {app.examScore !== null && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center flex-1">
                            <p className="text-xs text-zinc-500 mb-1">Exam Score</p>
                            <p className="text-2xl font-bold text-white">{app.examScore}</p>
                            {app.examRank && <p className="text-xs text-zinc-500 mt-1">Rank #{app.examRank}</p>}
                        </div>
                    )}
                    {app.interviewScore !== null && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center flex-1">
                            <p className="text-xs text-zinc-500 mb-1">Interview Score</p>
                            <p className="text-2xl font-bold text-violet-400">{app.interviewScore}</p>
                        </div>
                    )}
                    {app.finalScore !== null && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center flex-1">
                            <p className="text-xs text-zinc-500 mb-1">Final Score</p>
                            <p className="text-2xl font-bold text-emerald-400">{app.finalScore}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
