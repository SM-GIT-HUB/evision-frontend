import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { Building2, FileText, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { getMyApplications } from "../api/application-api"
import SpotlightCard from "../bits/SpotlightCard"

const PIPELINE = ["applied","screened","exam_invited","exam_done","shortlisted","interviewed","selected"]
const PIDX = Object.fromEntries(PIPELINE.map((s,i) => [s, i]))

const STATUS_CFG = {
    applied:             { label: "Applied",          cls: "badge-zinc" },
    screened:            { label: "Eligible",         cls: "badge-blue" },
    exam_invited:        { label: "Exam Invite Sent", cls: "badge-yellow" },
    exam_done:           { label: "Exam Submitted",   cls: "badge-blue" },
    shortlisted:         { label: "Shortlisted 🎯",   cls: "badge-violet" },
    interview_scheduled: { label: "Interview Set",    cls: "badge-violet" },
    interviewed:         { label: "Interviewed",      cls: "badge-blue" },
    selected:            { label: "Selected 🎉",      cls: "badge-emerald" },
    rejected:            { label: "Not Selected",     cls: "badge-red" },
    waitlisted:          { label: "Waitlisted",       cls: "badge-yellow" },
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")

    useEffect(() => {
        getMyApplications()
            .then(res => setApplications(res.data || []))
            .catch(() => toast.error("Failed to load applications"))
            .finally(() => setLoading(false))
    }, [])

    const filtered = filter === "all"
        ? applications
        : filter === "active"
            ? applications.filter(a => !["rejected","selected","waitlisted"].includes(a.status))
            : applications.filter(a => ["rejected","selected","waitlisted"].includes(a.status))

    return (
        <div className="fade-in px-8 py-10 max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">My Applications</h1>
                <p className="text-zinc-400 text-sm mt-2">Track your application status and progress across all recruitment drives.</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-8 bg-[#09090b] p-1.5 rounded-2xl w-max border border-white/5">
                {[
                    { key:"all",     label:`All (${applications.length})` },
                    { key:"active",  label:`Active (${applications.filter(a => !["rejected","selected","waitlisted"].includes(a.status)).length})` },
                    { key:"done",    label:`Completed (${applications.filter(a => ["rejected","selected","waitlisted"].includes(a.status)).length})` },
                ].map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filter === t.key ? "bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 size={32} className="text-violet-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center text-zinc-500 bg-[#050505]">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <FileText size={28} className="text-zinc-400" />
                    </div>
                    <p className="font-medium text-zinc-400 mb-4">{applications.length === 0 ? "You haven't applied to any drives yet." : "No applications found in this category."}</p>
                    {applications.length === 0 && (
                        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                            Browse Open Drives
                        </Link>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {filtered.map(app => <ApplicationCard key={app._id} app={app} />)}
                </div>
            )}
        </div>
    )
}

function ApplicationCard({ app }) {
    const cfg = STATUS_CFG[app.status] || STATUS_CFG.applied
    const isTerminal = ["rejected","selected","waitlisted"].includes(app.status)
    const curIdx = PIDX[app.status] ?? 0

    return (
        <SpotlightCard className={`p-6 transition-all border ${app.status === "selected" ? "border-emerald-500/30" : app.status === "rejected" ? "border-red-500/20 opacity-80" : "border-white/5"}`}>
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                    {app.driveId?.company && (
                        <p className="text-xs text-violet-400 mb-1.5 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                            <Building2 size={12} /> {app.driveId.company}
                        </p>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{app.driveId?.title || "Recruitment Drive"}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Clock size={12} /> Applied on {new Date(app.appliedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shadow-sm ${
                    app.status === 'selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-violet-500/10 text-violet-400 border-violet-500/20'
                }`}>
                    {cfg.label}
                </div>
            </div>

            {/* Pipeline stepper */}
            {!isTerminal && (
                <div className="mb-6 bg-[#000000] rounded-2xl p-5 border border-white/5 shadow-inner">
                    <div className="flex items-center">
                        {PIPELINE.map((s, i) => {
                            const done   = i < curIdx
                            const active = i === curIdx
                            return (
                                <div key={s} className="flex items-center" style={{ flex: i < PIPELINE.length-1 ? 1 : "none" }}>
                                    <div title={s.replace(/_/g," ")} className={`rounded-full shrink-0 transition-all duration-300 ${
                                        active ? "w-4 h-4 bg-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.8)] border-2 border-black" : 
                                        done ? "w-3 h-3 bg-emerald-500" : "w-3 h-3 bg-zinc-800"
                                    }`} />
                                    {i < PIPELINE.length-1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                                            done ? "bg-emerald-500/50" : "bg-zinc-800/50"
                                        }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between mt-3 px-1">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Applied</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Shortlisted</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Selected</span>
                    </div>
                </div>
            )}

            {/* Selected banner */}
            {app.status === "selected" && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center mb-4 backdrop-blur-sm">
                    <p className="font-bold text-emerald-400 flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Congratulations! You've been selected!
                    </p>
                    {app.finalScore != null && (
                        <p className="text-xs text-emerald-400/70 mt-1 font-medium">
                            Final Score: {app.finalScore}/100 • Rank #{app.finalRank}
                        </p>
                    )}
                </div>
            )}

            {/* Rejection reason */}
            {app.status === "rejected" && app.screeningReason && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 leading-relaxed">{app.screeningReason}</p>
                </div>
            )}

            {/* Scores */}
            {(app.examScore != null || app.interviewScore != null || app.finalScore != null) && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {app.examScore != null && <ScoreBox label="Exam Score" value={app.examScore} sub={app.examRank ? `Rank #${app.examRank}` : null} />}
                    {app.interviewScore != null && <ScoreBox label="Interview" value={app.interviewScore} color="text-violet-400" />}
                    {app.finalScore != null && <ScoreBox label="Final Score" value={`${app.finalScore}/100`} sub={app.finalRank ? `Rank #${app.finalRank}` : null} color="text-emerald-400" />}
                </div>
            )}
        </SpotlightCard>
    )
}

function ScoreBox({ label, value, sub, color }) {
    return (
        <div className="bg-[#000000] border border-white/5 rounded-xl p-4 text-center shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 relative z-10">{label}</p>
            <p className={`text-2xl font-black font-mono tracking-tighter relative z-10 ${color || "text-white"}`}>{value}</p>
            {sub && <p className="text-[10px] text-zinc-500 font-medium mt-1 relative z-10">{sub}</p>}
        </div>
    )
}
