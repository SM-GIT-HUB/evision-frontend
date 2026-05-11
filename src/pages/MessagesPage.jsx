import { Bell, CheckCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notification-api"

const TYPE_ICON = {
    exam_invite:          "📝",
    exam_reminder:        "⏰",
    result_ready:         "📊",
    shortlisted:          "🎯",
    interview_scheduled:  "🎙️",
    interview_reminder:   "⏰",
    selected:             "🎉",
    rejected:             "❌",
    achievement_unlocked: "🏆",
    general:              "🔔"
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export default function MessagesPage() {
    const [notifs, setNotifs]   = useState([])
    const [loading, setLoading] = useState(true)
    const [unread, setUnread]   = useState(0)

    useEffect(() => {
        getNotifications(1, 50)
            .then(res => {
                setNotifs(res.data?.notifications || [])
                setUnread(res.data?.unreadCount || 0)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function handleMarkAll() {
        await markAllNotificationsRead().catch(() => {})
        setNotifs(prev => prev.map(n => ({ ...n, read: true })))
        setUnread(0)
    }

    async function handleRead(id) {
        await markNotificationRead(id).catch(() => {})
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        setUnread(p => Math.max(0, p - 1))
    }

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    {unread > 0 && <p className="text-zinc-400 text-sm mt-0.5">{unread} unread</p>}
                </div>
                {unread > 0 && (
                    <button onClick={handleMarkAll} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
                        <CheckCheck size={16} /> Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                        <Bell size={40} className="mb-4 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : notifs.map(n => (
                    <div
                        key={n._id}
                        onClick={() => !n.read && handleRead(n._id)}
                        className={`flex gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.read ? "bg-violet-500/5" : ""}`}
                    >
                        <span className="text-2xl shrink-0 mt-1">{TYPE_ICON[n.type] || "🔔"}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <p className={`text-sm font-semibold ${n.read ? "text-zinc-400" : "text-white"}`}>{n.title}</p>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-zinc-700 font-mono mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
