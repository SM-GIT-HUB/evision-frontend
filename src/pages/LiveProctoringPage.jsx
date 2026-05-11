import { useState, useEffect } from "react"
import { ShieldAlert, AlertTriangle, XCircle, Search, Activity, UserX, Loader2 } from "lucide-react"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import SpotlightCard from "../bits/SpotlightCard"

export default function LiveProctoringPage() {
    const [socket, setSocket] = useState(null)
    const [activeSessions, setActiveSessions] = useState([])
    const [search, setSearch] = useState("")

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true })
        setSocket(newSocket)

        newSocket.emit("proctor_join")

        newSocket.on("proctor_update", (data) => {
            setActiveSessions(data)
        })

        newSocket.on("student_terminated", (userId) => {
            toast.success("Student session terminated")
        })

        return () => {
            newSocket.disconnect()
        }
    }, [])

    const handleTerminate = (socketId) => {
        if (window.confirm("Are you sure you want to terminate this student's exam? This will force submit their current answers and lock them out.")) {
            socket.emit("terminate_student", socketId)
        }
    }

    const filtered = activeSessions.filter(s => 
        (s.userName || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.examTitle || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 w-full max-w-6xl animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-violet-500" /> Live Proctoring
                    </h1>
                    <p className="text-zinc-400 text-sm mt-0.5">Monitor active assessments and flag violations in real-time.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search students..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
                    />
                </div>
            </div>

            {activeSessions.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center text-zinc-500 bg-[#050505]">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <ShieldAlert size={28} className="text-zinc-400" />
                    </div>
                    <p className="font-medium text-zinc-400">No active assessments right now.</p>
                    <p className="text-sm text-zinc-600 mt-2">When students start an exam, they will appear here live.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(session => (
                        <SpotlightCard key={session.socketId} className={`p-5 border transition-colors ${
                            session.warnings >= 3 ? "border-red-500/30 bg-red-500/5" :
                            session.warnings > 0 ? "border-yellow-500/30 bg-yellow-500/5" :
                            "border-white/5"
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-sm text-white">
                                        {(session.userName || "U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{session.userName}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{session.userEmail}</p>
                                    </div>
                                </div>
                                <span className="flex h-3 w-3 relative mt-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="bg-black/30 rounded-lg p-3">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Assessment</p>
                                    <p className="text-sm text-zinc-300 font-medium truncate">{session.examTitle}</p>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                                    session.warnings >= 3 ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                    session.warnings > 0 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                }`}>
                                    <AlertTriangle size={16} />
                                    <span className="text-sm font-bold">{session.warnings} Tab Violations</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleTerminate(session.socketId)}
                                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                            >
                                <UserX size={16} /> Terminate Assessment
                            </button>
                        </SpotlightCard>
                    ))}
                </div>
            )}
        </div>
    )
}
