import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Building2, ChevronRight, Loader2, CheckCircle2, ChevronLeft, Filter, Users, CalendarDays, Lock, Trophy } from "lucide-react"
import { getMyDrives, getDriveApplications, scheduleExam, closeExam, finalizeDrive } from "../api/drive-api"
import { inviteCandidates } from "../api/application-api"
import SpotlightCard from "../bits/SpotlightCard"
import CountUp from "../bits/CountUp"
import ClickSpark from "../bits/ClickSpark"
import Magnet from "../bits/Magnet"

const DRIVE_STATUS = {
    draft:          { label: "Draft",        cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
    open:           { label: "Open",         cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    exam_scheduled: { label: "Exam Live",    cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    interviewing:   { label: "Interviewing", cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    closed:         { label: "Closed",       cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
}

const APP_STATUS = {
    selected:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    shortlisted: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    interviewed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    screened:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
    exam_done:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
    exam_invited:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    applied:     "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    rejected:    "text-red-400 bg-red-500/10 border-red-500/20",
    waitlisted:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
}

export default function MyDrivesPage() {
    const navigate = useNavigate()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [apps, setApps] = useState([])
    const [appsLoading, setAppsLoading] = useState(false)
    const [filter, setFilter] = useState("")
    const [actionBusy, setActionBusy] = useState(null)
    const [inviteEmails, setInviteEmails] = useState("")
    const [inviteLoading, setInviteLoading] = useState(false)

    useEffect(() => { load() }, [])

    async function load() {
        try {
            const res = await getMyDrives()
            setDrives(res.data || [])
        } catch { toast.error("Failed to load drives") }
        finally { setLoading(false) }
    }

    async function openDrive(drive) {
        setSelected(drive)
        setAppsLoading(true)
        setFilter("")
        try {
            const res = await getDriveApplications(drive._id)
            setApps(res.data || [])
        } catch { toast.error("Failed to load applicants") }
        finally { setAppsLoading(false) }
    }

    async function doAction(id, action) {
        setActionBusy(action)
        try {
            if (action === "schedule-exam") await scheduleExam(id)
            if (action === "close-exam")    await closeExam(id)
            if (action === "finalize")      await finalizeDrive(id)
            toast.success("Action successful!")
            await load()
            const updated = (await getMyDrives()).data?.find(d => d._id === id)
            if (updated) { setSelected(updated); openDrive(updated) }
        } catch (err) { toast.error(err.response?.data?.message || "Failed to execute action") }
        finally { setActionBusy(null) }
    }

    async function handleInvite() {
        if (!inviteEmails.trim()) return toast.error("Enter at least one email");
        const list = inviteEmails.split(",").map(e => e.trim()).filter(Boolean);
        setInviteLoading(true);
        try {
            await inviteCandidates(selected._id, list);
            toast.success(`Invited ${list.length} candidate(s)`);
            setInviteEmails("");
            openDrive(selected); // refresh candidates list
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to invite");
        } finally {
            setInviteLoading(false);
        }
    }

    const filteredApps = filter ? apps.filter(a => a.status === filter) : apps
    const stats = {
        total:       apps.length,
        eligible:    apps.filter(a => a.screeningStatus === "eligible").length,
        shortlisted: apps.filter(a => ["shortlisted","interviewed"].includes(a.status)).length,
        selected:    apps.filter(a => a.status === "selected").length,
    }

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader2 size={36} className="animate-spin text-violet-500" />
        </div>
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {!selected ? (
                /* ── Drives List View ── */
                <>
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#09090b] to-transparent p-6 rounded-3xl border border-white/5">
                        <div>
                            <h1 className="text-3xl font-black text-white">My Drives</h1>
                            <p className="text-zinc-400 mt-2 font-medium">Manage and track your active hiring pipelines.</p>
                        </div>
                        <Magnet padding={20} magnetStrength={3}>
                            <ClickSpark sparkColor="#8b5cf6" sparkSize={6} sparkRadius={15} sparkCount={5} duration={400}>
                                <button onClick={() => navigate("/drive/create")} className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                                    + New Drive
                                </button>
                            </ClickSpark>
                        </Magnet>
                    </div>

                    {drives.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                            <Building2 size={48} className="text-zinc-700 mb-6" />
                            <p className="text-xl font-bold text-white mb-2">No active drives</p>
                            <p className="text-zinc-500 font-medium">Create a new drive to start accepting applications.</p>
                        </div>
                    ) : (
                        <div className="bg-[#09090b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-5">Drive Overview</th>
                                        <th className="px-6 py-5">Status</th>
                                        <th className="px-6 py-5 text-center">Applicants</th>
                                        <th className="px-6 py-5 text-center">Shortlisted</th>
                                        <th className="px-6 py-5 text-center">Selected</th>
                                        <th className="px-6 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {drives.map(drive => {
                                        const sc = DRIVE_STATUS[drive.status] || DRIVE_STATUS.draft
                                        return (
                                            <tr key={drive._id} onClick={() => openDrive(drive)} className="cursor-pointer hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-white text-base group-hover:text-violet-300 transition-colors">{drive.title}</p>
                                                    {drive.company && <p className="text-xs font-semibold text-zinc-500 mt-0.5">{drive.company}</p>}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${sc.cls}`}>{sc.label}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-mono text-zinc-300 font-bold">{drive.stats?.totalApplicants || 0}</td>
                                                <td className="px-6 py-5 text-center font-mono text-violet-400 font-bold">{drive.stats?.shortlisted || 0}</td>
                                                <td className="px-6 py-5 text-center font-mono text-emerald-400 font-bold">{drive.stats?.selected || 0}</td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Pipeline <ChevronRight size={16} />
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                /* ── Drive Pipeline Detail View ── */
                <>
                    <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-medium text-sm w-fit group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Drives
                    </button>

                    {/* Drive Header */}
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6 bg-[#09090b] border border-white/5 p-6 rounded-3xl">
                        <div>
                            <div className="mb-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${DRIVE_STATUS[selected.status]?.cls}`}>{DRIVE_STATUS[selected.status]?.label}</span>
                            </div>
                            <h1 className="text-3xl font-black text-white">{selected.title}</h1>
                            {selected.company && <p className="text-sm font-semibold text-zinc-500 mt-2 flex items-center gap-2"><Building2 size={16}/> {selected.company}</p>}
                        </div>

                        {/* Pipeline Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {selected.status === "open" && (
                                <ActionBtn icon={<CalendarDays size={16}/>} label="Schedule Exam" busy={actionBusy === "schedule-exam"} onClick={() => doAction(selected._id, "schedule-exam")} variant="blue" />
                            )}
                            {selected.status === "exam_scheduled" && (
                                <ActionBtn icon={<Lock size={16}/>} label="Close Exam & Shortlist" busy={actionBusy === "close-exam"} onClick={() => doAction(selected._id, "close-exam")} variant="violet" />
                            )}
                            {selected.status === "interviewing" && (
                                <ActionBtn icon={<Trophy size={16}/>} label="Finalize Selection" busy={actionBusy === "finalize"} onClick={() => doAction(selected._id, "finalize")} variant="emerald" />
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Apps", value: stats.total, color: "text-white" },
                            { label: "Eligible", value: stats.eligible, color: "text-blue-400" },
                            { label: "Shortlisted", value: stats.shortlisted, color: "text-violet-400" },
                            { label: "Selected", value: stats.selected, color: "text-emerald-400" },
                        ].map(s => (
                            <SpotlightCard key={s.label} className="p-5 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col justify-center" spotlightColor="rgba(255, 255, 255, 0.05)">
                                <span className={`text-3xl font-black ${s.color}`}><CountUp to={s.value} /></span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-1">{s.label}</span>
                            </SpotlightCard>
                        ))}
                    </div>

                    {/* Invite Candidates Form */}
                    {selected.status === "open" && (
                        <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl">
                            <h2 className="text-sm font-bold text-white mb-2">Invite Candidates</h2>
                            <p className="text-xs text-zinc-500 mb-4">Enter a comma-separated list of candidate emails to grant them access to this drive.</p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="e.g. john@university.edu, sara@gmail.com"
                                    value={inviteEmails}
                                    onChange={e => setInviteEmails(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 transition-colors"
                                />
                                <button
                                    onClick={handleInvite}
                                    disabled={inviteLoading}
                                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Send Invites
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div className="flex flex-wrap gap-2 p-1 bg-white/5 border border-white/5 rounded-xl w-fit">
                        {["", "applied", "screened", "exam_invited", "exam_done", "shortlisted", "interviewed", "selected", "rejected"].map(s => {
                            const isActive = filter === s;
                            return (
                                <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors capitalize ${isActive ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}>
                                    {s === "" ? "All Candidates" : s.replace(/_/g," ")}
                                </button>
                            )
                        })}
                    </div>

                    {/* Candidates Table */}
                    {appsLoading ? (
                        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-violet-500" /></div>
                    ) : filteredApps.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center">
                            <Users size={40} className="text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-400 font-medium text-sm">No applications found for this filter.</p>
                        </div>
                    ) : (
                        <div className="bg-[#09090b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase font-black text-zinc-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">College details</th>
                                        <th className="px-6 py-4 text-center">CGPA</th>
                                        <th className="px-6 py-4 text-center">Exam Score</th>
                                        <th className="px-6 py-4 text-center">Interview</th>
                                        <th className="px-6 py-4 text-center">Final Score</th>
                                        <th className="px-6 py-4 text-center">Current Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredApps.map((app) => (
                                        <tr key={app._id} className={`hover:bg-white/[0.02] transition-colors ${app.status === "selected" ? "bg-emerald-500/[0.02]" : ""}`}>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{app.personalInfo?.fullName}</p>
                                                <p className="text-[11px] font-mono text-zinc-500 mt-1">{app.candidateId?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-zinc-300">{app.personalInfo?.college}</p>
                                                <p className="text-[11px] font-semibold text-zinc-500 mt-1">{app.personalInfo?.branch}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-white">{app.personalInfo?.cgpa}</td>
                                            <td className="px-6 py-4 text-center font-mono">
                                                {app.examScore != null ? <span className="font-bold text-white">{app.examScore} <span className="text-[10px] text-zinc-500">#{app.examRank}</span></span> : <span className="text-zinc-700">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono">
                                                {app.interviewScore != null ? <span className="font-bold text-violet-400">{app.interviewScore}</span> : <span className="text-zinc-700">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono">
                                                {app.finalScore != null ? <span className="font-bold text-emerald-400">{app.finalScore} <span className="text-[10px] text-zinc-500">#{app.finalRank}</span></span> : <span className="text-zinc-700">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${APP_STATUS[app.status] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"}`}>
                                                    {app.status?.replace(/_/g," ")}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function ActionBtn({ label, onClick, busy, variant, icon }) {
    const config = {
        blue: "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20",
        violet: "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20",
        emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    }[variant];

    return (
        <ClickSpark sparkColor={variant === "emerald" ? "#10b981" : variant === "violet" ? "#8b5cf6" : "#3b82f6"} sparkSize={5} sparkRadius={15} sparkCount={4} duration={400}>
            <button onClick={onClick} disabled={busy} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${config} ${busy ? "opacity-50 cursor-not-allowed" : ""}`}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : icon}
                {label}
            </button>
        </ClickSpark>
    )
}
