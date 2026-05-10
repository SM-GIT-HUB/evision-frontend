import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { Building2, Clock, ChevronRight, GraduationCap, Code2, Users, Loader2, Search } from "lucide-react"
import { getOpenDrives } from "../api/drive-api"
import { getMyApplications } from "../api/application-api"

export default function BrowseDrivesPage() {
    const [drives, setDrives] = useState([])
    const [appliedIds, setAppliedIds] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        Promise.allSettled([getOpenDrives(), getMyApplications()])
            .then(([dr, ar]) => {
                if (dr.status === "fulfilled") setDrives(dr.value.data || [])
                if (ar.status === "fulfilled") {
                    setAppliedIds(new Set((ar.value.data || []).map(a => a.driveId?._id || a.driveId)))
                }
            })
            .catch(() => toast.error("Failed to load"))
            .finally(() => setLoading(false))
    }, [])

    const filtered = drives.filter(d =>
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.company?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fade-in" style={{ padding:"32px 36px", maxWidth:900 }}>
            <div style={{ marginBottom:28 }}>
                <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Browse Drives</h1>
                <p style={{ color:"var(--text-2)", fontSize:13.5, marginTop:4 }}>Find and apply to hiring drives that match your profile.</p>
            </div>

            {/* Search */}
            <div style={{ position:"relative", marginBottom:24 }}>
                <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }} />
                <input
                    className="field-input"
                    style={{ paddingLeft:36 }}
                    placeholder="Search drives by title or company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
                    <Loader2 size={30} color="var(--primary)" className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ border:"1px dashed var(--border)", borderRadius:14, padding:"60px 24px", textAlign:"center", color:"var(--text-3)" }}>
                    <Building2 size={36} style={{ opacity:0.3, margin:"0 auto 10px" }} />
                    <p style={{ margin:0 }}>{search ? "No drives match your search." : "No drives open right now."}</p>
                </div>
            ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <p style={{ margin:"0 0 4px", fontSize:12.5, color:"var(--text-3)" }}>{filtered.length} drive{filtered.length !== 1 ? "s" : ""} available</p>
                    {filtered.map(drive => <DriveCard key={drive._id} drive={drive} applied={appliedIds.has(drive._id)} />)}
                </div>
            )}
        </div>
    )
}

function DriveCard({ drive, applied }) {
    const deadline = drive.applicationDeadline ? new Date(drive.applicationDeadline) : null
    const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86_400_000) : null
    const expired  = daysLeft !== null && daysLeft <= 0

    return (
        <div className="card" style={{
            transition:"border-color 0.15s, box-shadow 0.15s",
            opacity: applied || expired ? 0.75 : 1,
        }}
        onMouseEnter={e => { if (!applied && !expired) { e.currentTarget.style.borderColor="var(--border-2)"; e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,0.4)" } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="none" }}
        >
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
                <div style={{ flex:1 }}>
                    {/* Status chips row */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                        <span className="badge badge-emerald">✅ Accepting Applications</span>
                        {daysLeft !== null && !expired && (
                            <span className="badge badge-yellow"><Clock size={10} /> {daysLeft}d left</span>
                        )}
                        {expired && <span className="badge badge-red">Deadline passed</span>}
                    </div>

                    <h2 style={{ fontSize:16, fontWeight:700, margin:"0 0 4px" }}>{drive.title}</h2>
                    {drive.company && (
                        <p style={{ margin:"0 0 10px", fontSize:13, color:"var(--text-2)", display:"flex", alignItems:"center", gap:5 }}>
                            <Building2 size={13} /> {drive.company}
                        </p>
                    )}

                    {drive.description && (
                        <p style={{ margin:"0 0 14px", fontSize:13, color:"var(--text-3)", lineHeight:1.6, maxWidth:560 }}>
                            {drive.description.slice(0, 120)}{drive.description.length > 120 ? "…" : ""}
                        </p>
                    )}

                    {/* Eligibility chips */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {drive.eligibility?.minCGPA > 0 && (
                            <EChip icon={<GraduationCap size={11} />} label={`CGPA ≥ ${drive.eligibility.minCGPA}`} />
                        )}
                        {drive.eligibility?.passingYear && (
                            <EChip icon={<Clock size={11} />} label={`Batch ${drive.eligibility.passingYear}`} />
                        )}
                        {drive.eligibility?.branches?.length > 0 && (
                            <EChip icon={<Code2 size={11} />} label={drive.eligibility.branches.join(" / ")} />
                        )}
                        {drive.examDuration && (
                            <EChip icon={<Clock size={11} />} label={`${drive.examDuration} min exam`} />
                        )}
                    </div>
                </div>

                <div style={{ flexShrink:0 }}>
                    {applied ? (
                        <span className="badge badge-emerald" style={{ padding:"8px 14px", fontSize:12.5 }}>✓ Applied</span>
                    ) : expired ? (
                        <span className="badge badge-zinc" style={{ padding:"8px 14px", fontSize:12.5 }}>Closed</span>
                    ) : (
                        <Link to={`/apply/${drive._id}`} className="btn btn-primary">
                            Apply Now <ChevronRight size={14} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

function EChip({ icon, label }) {
    return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid var(--border)", borderRadius:7, fontSize:12, color:"var(--text-2)" }}>
            {icon} {label}
        </span>
    )
}
