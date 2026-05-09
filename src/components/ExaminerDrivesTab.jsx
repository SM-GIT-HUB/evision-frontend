import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
    Building2, Users, Trophy, ChevronRight, Loader2, Clock,
    CheckCircle2, AlertCircle, BarChart2, ArrowRight
} from "lucide-react"
import { getMyDrives, closeExam, finalizeDrive, scheduleExam } from "../api/drive-api"
import { getDriveApplications } from "../api/drive-api"

const STATUS_CONFIG = {
    draft:          { label: "Draft",        color: "bg-zinc-700/30 text-zinc-400 border-zinc-700" },
    open:           { label: "Open",         color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    exam_scheduled: { label: "Exam Invited", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    interviewing:   { label: "Interviewing", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
    closed:         { label: "Closed",       color: "bg-zinc-700/30 text-zinc-500 border-zinc-700/30" },
}

export default function ExaminerDrivesTab() {
    const navigate = useNavigate()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDrive, setSelectedDrive] = useState(null)
    const [applications, setApplications] = useState([])
    const [appsLoading, setAppsLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const [statusFilter, setStatusFilter] = useState("")

    useEffect(() => {
        fetchDrives()
    }, [])

    async function fetchDrives() {
        try {
            const res = await getMyDrives()
            setDrives(res.data || [])
        } catch {
            toast.error("Failed to load drives")
        } finally {
            setLoading(false)
        }
    }

    async function openDrivePanel(drive) {
        setSelectedDrive(drive)
        setAppsLoading(true)
        try {
            const res = await getDriveApplications(drive._id)
            setApplications(res.data || [])
        } catch {
            toast.error("Failed to load applicants")
        } finally {
            setAppsLoading(false)
        }
    }

    async function handleAction(driveId, action) {
        setActionLoading(action)
        try {
            if (action === "schedule-exam") await scheduleExam(driveId)
            if (action === "close-exam")    await closeExam(driveId)
            if (action === "finalize")      await finalizeDrive(driveId)
            toast.success("Done!")
            fetchDrives()
            if (selectedDrive?._id === driveId) openDrivePanel({ ...selectedDrive, _id: driveId })
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed")
        } finally {
            setActionLoading(null)
        }
    }

    const filteredApps = statusFilter
        ? applications.filter(a => a.status === statusFilter)
        : applications

    // Stats from applications
    const stats = {
        total:       applications.length,
        eligible:    applications.filter(a => a.screeningStatus === "eligible").length,
        shortlisted: applications.filter(a => a.status === "shortlisted").length,
        interviewed: applications.filter(a => a.status === "interviewed").length,
        selected:    applications.filter(a => a.status === "selected").length,
    }

    if (loading) return (
        <div className="flex justify-center py-24">
            <Loader2 className="text-violet-400 animate-spin" size={36} />
        </div>
    )

    return (
        <div className="mt-6">
            {!selectedDrive ? (
                /* ── Drives List ── */
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">My Drives</h2>
                        <button onClick={() => navigate("/drive/create")}
                            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-500 transition">
                            <Building2 size={14} /> New Drive
                        </button>
                    </div>

                    {drives.length === 0 ? (
                        <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center text-zinc-500">
                            <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg">No drives yet.</p>
                            <button onClick={() => navigate("/drive/create")}
                                className="mt-4 text-violet-400 hover:underline text-sm">
                                Create your first drive →
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {drives.map(drive => {
                                const cfg = STATUS_CONFIG[drive.status] || STATUS_CONFIG.draft
                                return (
                                    <div key={drive._id} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition cursor-pointer"
                                        onClick={() => openDrivePanel(drive)}>
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {drive.company && <span className="text-xs text-zinc-500">{drive.company}</span>}
                                                </div>
                                                <h3 className="text-lg font-bold mb-3">{drive.title}</h3>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <span className="flex items-center gap-1.5 text-zinc-400">
                                                        <Users size={14} /> {drive.stats?.totalApplicants || 0} applicants
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-violet-400">
                                                        <Trophy size={14} /> {drive.stats?.shortlisted || 0} shortlisted
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                                        <CheckCircle2 size={14} /> {drive.stats?.selected || 0} selected
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-600 flex-shrink-0 mt-1" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Drive Detail Panel ── */
                <div>
                    {/* Back */}
                    <button onClick={() => setSelectedDrive(null)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition">
                        ← All Drives
                    </button>

                    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                        <div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border mb-2 inline-block ${STATUS_CONFIG[selectedDrive.status]?.color}`}>
                                {STATUS_CONFIG[selectedDrive.status]?.label}
                            </span>
                            <h2 className="text-2xl font-bold">{selectedDrive.title}</h2>
                            {selectedDrive.company && <p className="text-zinc-500 text-sm mt-0.5">{selectedDrive.company}</p>}
                        </div>

                        {/* Pipeline action buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {selectedDrive.status === "open" && (
                                <ActionBtn label="📨 Schedule Exam" loading={actionLoading === "schedule-exam"}
                                    onClick={() => handleAction(selectedDrive._id, "schedule-exam")} />
                            )}
                            {selectedDrive.status === "exam_scheduled" && (
                                <ActionBtn label="🔒 Close Exam & Shortlist" loading={actionLoading === "close-exam"}
                                    onClick={() => handleAction(selectedDrive._id, "close-exam")} />
                            )}
                            {selectedDrive.status === "interviewing" && (
                                <ActionBtn label="🏆 Finalize & Select" loading={actionLoading === "finalize"}
                                    onClick={() => handleAction(selectedDrive._id, "finalize")}
                                    variant="emerald" />
                            )}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-5 gap-3 mb-6">
                        {[
                            { label: "Total",       value: stats.total,       color: "text-white" },
                            { label: "Eligible",    value: stats.eligible,    color: "text-blue-400" },
                            { label: "Shortlisted", value: stats.shortlisted, color: "text-violet-400" },
                            { label: "Interviewed", value: stats.interviewed, color: "text-cyan-400" },
                            { label: "Selected",    value: stats.selected,    color: "text-emerald-400" },
                        ].map(s => (
                            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status filter */}
                    <div className="flex gap-2 flex-wrap mb-4">
                        {["", "applied", "screened", "shortlisted", "interview_scheduled", "interviewed", "selected", "rejected"].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                                    statusFilter === s
                                        ? "bg-violet-600 border-violet-500 text-white"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                                }`}>
                                {s === "" ? "All" : s.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>

                    {/* Applicants table */}
                    {appsLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-400" size={28} /></div>
                    ) : filteredApps.length === 0 ? (
                        <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                            No applications found.
                        </div>
                    ) : (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="border-b border-zinc-800">
                                    <tr className="text-zinc-500 text-xs uppercase tracking-widest">
                                        <th className="text-left px-5 py-4">Candidate</th>
                                        <th className="text-left px-4 py-4">College</th>
                                        <th className="text-center px-4 py-4">CGPA</th>
                                        <th className="text-center px-4 py-4">Exam</th>
                                        <th className="text-center px-4 py-4">Interview</th>
                                        <th className="text-center px-4 py-4">Final</th>
                                        <th className="text-center px-4 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredApps.map((app, i) => (
                                        <AppRow key={app._id} app={app} rank={i + 1} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function AppRow({ app, rank }) {
    const statusColors = {
        selected:   "bg-emerald-500/20 text-emerald-400",
        shortlisted:"bg-violet-500/20 text-violet-400",
        rejected:   "bg-red-500/10 text-red-400",
        interviewed:"bg-cyan-500/20 text-cyan-400",
        screened:   "bg-blue-500/20 text-blue-400",
        applied:    "bg-zinc-700/30 text-zinc-400",
        waitlisted: "bg-yellow-500/20 text-yellow-400",
    }
    const sc = statusColors[app.status] || statusColors.applied

    return (
        <tr className={`hover:bg-zinc-900/50 transition ${app.status === "selected" ? "bg-emerald-500/5" : ""}`}>
            <td className="px-5 py-4">
                <p className="font-medium text-white">{app.personalInfo?.fullName}</p>
                <p className="text-xs text-zinc-500">{app.candidateId?.email}</p>
            </td>
            <td className="px-4 py-4">
                <p className="text-zinc-300">{app.personalInfo?.college}</p>
                <p className="text-xs text-zinc-500">{app.personalInfo?.branch}</p>
            </td>
            <td className="px-4 py-4 text-center text-white font-mono">{app.personalInfo?.cgpa}</td>
            <td className="px-4 py-4 text-center">
                {app.examScore !== null ? (
                    <span className="font-mono text-white">{app.examScore}</span>
                ) : <span className="text-zinc-700">—</span>}
                {app.examRank && <span className="text-xs text-zinc-500 ml-1">#{app.examRank}</span>}
            </td>
            <td className="px-4 py-4 text-center">
                {app.interviewScore !== null ? (
                    <span className="font-mono text-violet-400">{app.interviewScore}</span>
                ) : <span className="text-zinc-700">—</span>}
            </td>
            <td className="px-4 py-4 text-center">
                {app.finalScore !== null ? (
                    <span className="font-mono text-emerald-400 font-bold">{app.finalScore}</span>
                ) : <span className="text-zinc-700">—</span>}
                {app.finalRank && <span className="text-xs text-zinc-500 ml-1">#{app.finalRank}</span>}
            </td>
            <td className="px-4 py-4 text-center">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${sc}`}>
                    {app.status?.replace(/_/g, " ")}
                </span>
            </td>
        </tr>
    )
}

function ActionBtn({ label, onClick, loading, variant = "violet" }) {
    const colors = {
        violet: "bg-violet-600 hover:bg-violet-500",
        emerald: "bg-emerald-600 hover:bg-emerald-500"
    }
    return (
        <button onClick={onClick} disabled={loading}
            className={`flex items-center gap-2 ${colors[variant]} text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {label}
        </button>
    )
}
