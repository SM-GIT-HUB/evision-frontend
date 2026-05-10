import { useState, useEffect } from "react"
import { Video, Calendar, Clock, User, ExternalLink, Loader2 } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getMyRooms } from "../api/room-api"
import { useNavigate } from "react-router-dom"

export default function InterviewsPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [upcoming, setUpcoming] = useState([])
    const [past, setPast] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([getMyRooms("upcoming"), getMyRooms("past")])
            .then(([u, p]) => {
                if (u.status === "fulfilled") setUpcoming(u.value.data || [])
                if (p.status === "fulfilled") setPast(p.value.data || [])
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={{ display:"flex", justifyContent:"center", padding:80 }}>
            <Loader2 size={28} color="var(--primary)" className="animate-spin" />
        </div>
    )

    return (
        <div className="fade-in" style={{ padding:"32px 36px", maxWidth:900 }}>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>Interviews</h1>
            <p style={{ color:"var(--text-2)", fontSize:13.5, marginBottom:28 }}>
                {user?.role === "examiner" ? "Manage scheduled interview rooms." : "Your upcoming and past interview sessions."}
            </p>

            {user?.role === "examiner" && (
                <button
                    onClick={() => navigate("/room/create")}
                    className="btn btn-primary"
                    style={{ marginBottom:24 }}>
                    + Schedule Interview
                </button>
            )}

            {/* Upcoming */}
            <SectionLabel>Upcoming Interviews</SectionLabel>
            {upcoming.length === 0 ? (
                <Empty icon={<Video size={30} />} text="No upcoming interviews" />
            ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
                    {upcoming.map(room => <RoomCard key={room._id} room={room} isUpcoming navigate={navigate} />)}
                </div>
            )}

            {/* Past */}
            <SectionLabel style={{ marginTop:12 }}>Past Interviews</SectionLabel>
            {past.length === 0 ? (
                <Empty icon={<Calendar size={28} />} text="No past interviews" />
            ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {past.map(room => <RoomCard key={room._id} room={room} navigate={navigate} />)}
                </div>
            )}
        </div>
    )
}

function RoomCard({ room, isUpcoming, navigate }) {
    const dt = room.scheduledAt ? new Date(room.scheduledAt) : null
    return (
        <div className="card" style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Video size={14} color="#a78bfa" />
                        </div>
                        <div>
                            <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{room.title || "Interview Session"}</p>
                            {room.driveId?.title && <p style={{ margin:0, fontSize:11, color:"var(--text-3)" }}>Drive: {room.driveId.title}</p>}
                        </div>
                    </div>

                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                        {dt && (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12.5, color:"var(--text-2)" }}>
                                <Calendar size={12} />
                                {dt.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                            </span>
                        )}
                        {dt && (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12.5, color:"var(--text-2)" }}>
                                <Clock size={12} />
                                {dt.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                            </span>
                        )}
                        {room.candidateName && (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12.5, color:"var(--text-2)" }}>
                                <User size={12} /> {room.candidateName}
                            </span>
                        )}
                    </div>
                </div>

                {isUpcoming && room._id && (
                    <a href={`http://localhost:5174/room/${room._id}`} target="_blank" rel="noreferrer"
                        className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>
                        Join <ExternalLink size={12} />
                    </a>
                )}
            </div>
        </div>
    )
}

function SectionLabel({ children, style }) {
    return <h2 style={{ fontSize:13, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px", ...style }}>{children}</h2>
}

function Empty({ icon, text }) {
    return (
        <div style={{ border:"1px dashed var(--border)", borderRadius:12, padding:"32px 24px", textAlign:"center", color:"var(--text-3)", marginBottom:24 }}>
            <div style={{ opacity:0.3, marginBottom:8, display:"flex", justifyContent:"center" }}>{icon}</div>
            <p style={{ margin:0, fontSize:13.5 }}>{text}</p>
        </div>
    )
}
