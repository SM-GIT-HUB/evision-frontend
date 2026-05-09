import { useState, useEffect } from "react"
import { Link, Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Building2, Users, Clock, ChevronRight, CheckCircle2, Loader2, GraduationCap, Code2 } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getOpenDrives } from "../api/drive-api"

const STATUS_COLORS = {
    draft:           "bg-zinc-700/30 text-zinc-400 border-zinc-700/50",
    open:            "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    exam_scheduled:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
    interviewing:    "bg-violet-500/20 text-violet-400 border-violet-500/30",
    closed:          "bg-zinc-700/30 text-zinc-500 border-zinc-700/50",
}

export default function BrowseDrivesPage({ embedded = false }) {
    const { isAuthenticated } = useAuthStore()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetch() {
            try {
                const res = await getOpenDrives()
                setDrives(res.data || [])
            } catch {
                toast.error("Failed to load drives")
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (!isAuthenticated && !embedded) return <Navigate to="/" replace />

    const content = (
        <div className={embedded ? "" : "min-h-screen bg-black text-white px-6 py-10"}>
            <div className={embedded ? "" : "max-w-5xl mx-auto"}>

                <div className="mb-8">
                    <h2 className={embedded ? "text-2xl font-bold" : "text-4xl font-bold"}>Browse Drives</h2>
                    <p className="text-zinc-400 mt-2 text-sm">Find and apply to hiring drives that match your profile.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="text-violet-400 animate-spin" size={32} />
                    </div>
                ) : drives.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center text-zinc-500">
                        <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No drives open right now.</p>
                        <p className="text-sm mt-1">Check back later!</p>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {drives.map(drive => (
                            <DriveCard key={drive._id} drive={drive} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    )

    return content
}

function DriveCard({ drive }) {
    const deadline = drive.applicationDeadline ? new Date(drive.applicationDeadline) : null
    const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86_400_000) : null

    return (
        <div className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-7 transition-all">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[drive.status] || STATUS_COLORS.open}`}>
                            {drive.status === "open" ? "✅ Accepting Applications" : drive.status}
                        </span>
                        {daysLeft !== null && daysLeft > 0 && (
                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                                <Clock size={12} /> {daysLeft}d left
                            </span>
                        )}
                    </div>

                    <h2 className="text-xl font-bold mb-1 group-hover:text-violet-300 transition-colors">
                        {drive.title}
                    </h2>
                    {drive.company && (
                        <p className="text-zinc-400 text-sm flex items-center gap-1 mb-4">
                            <Building2 size={14} /> {drive.company}
                        </p>
                    )}

                    {drive.description && (
                        <p className="text-zinc-400 text-sm leading-relaxed mb-5 max-w-2xl">
                            {drive.description}
                        </p>
                    )}

                    {/* Eligibility chips */}
                    <div className="flex flex-wrap gap-2">
                        {drive.eligibility?.minCGPA > 0 && (
                            <Chip icon={<GraduationCap size={12} />} label={`CGPA ≥ ${drive.eligibility.minCGPA}`} />
                        )}
                        {drive.eligibility?.passingYear && (
                            <Chip icon={<Clock size={12} />} label={`Batch ${drive.eligibility.passingYear}`} />
                        )}
                        {drive.eligibility?.branches?.length > 0 && (
                            <Chip icon={<Code2 size={12} />} label={drive.eligibility.branches.join(" / ")} />
                        )}
                        {drive.examDuration && (
                            <Chip icon={<Clock size={12} />} label={`${drive.examDuration} min exam`} />
                        )}
                    </div>
                </div>

                <Link to={`/apply/${drive._id}`}
                    className="flex-shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all group-hover:scale-105">
                    Apply Now <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    )
}

function Chip({ icon, label }) {
    return (
        <span className="flex items-center gap-1 text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
            {icon} {label}
        </span>
    )
}
