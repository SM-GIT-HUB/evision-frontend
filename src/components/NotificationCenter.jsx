import { useState, useEffect, useRef } from "react"
import { Bell, X, CheckCheck, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../api/notification-api"

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

export default function NotificationCenter() {
    const [open, setOpen]         = useState(false)
    const [notifs, setNotifs]     = useState([])
    const [unread, setUnread]     = useState(0)
    const [loading, setLoading]   = useState(false)
    const ref = useRef(null)

    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Poll unread count every 30s
    useEffect(() => {
        fetchCount()
        const id = setInterval(fetchCount, 30000)
        return () => clearInterval(id)
    }, [])

    async function fetchCount() {
        try {
            const res = await getUnreadCount()
            setUnread(res.data?.count || 0)
        } catch {}
    }

    async function handleOpen() {
        setOpen(v => !v)
        if (!open) {
            setLoading(true)
            try {
                const res = await getNotifications(1, 20)
                setNotifs(res.data?.notifications || [])
                setUnread(res.data?.unreadCount || 0)
            } catch {}
            finally { setLoading(false) }
        }
    }

    async function handleMarkRead(id) {
        try {
            await markNotificationRead(id)
            setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
            setUnread(prev => Math.max(0, prev - 1))
        } catch {}
    }

    async function handleMarkAll() {
        try {
            await markAllNotificationsRead()
            setNotifs(prev => prev.map(n => ({ ...n, read: true })))
            setUnread(0)
        } catch {}
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

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <Bell size={18} className="text-zinc-300" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-96 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <div>
                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                {unread > 0 && <p className="text-xs text-zinc-500">{unread} unread</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {unread > 0 && (
                                    <button onClick={handleMarkAll} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                        <CheckCheck size={14} /> Mark all read
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                    <Bell size={32} className="mb-3 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifs.map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => !n.read && handleMarkRead(n._id)}
                                        className={`flex gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.read ? "bg-violet-500/5" : ""}`}
                                    >
                                        <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold leading-snug ${n.read ? "text-zinc-400" : "text-white"}`}>
                                                    {n.title}
                                                </p>
                                                {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1" />}
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifs.length > 0 && (
                            <div className="border-t border-white/5 px-5 py-3">
                                <Link
                                    to="/messages"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium"
                                >
                                    View all notifications <ExternalLink size={12} />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
