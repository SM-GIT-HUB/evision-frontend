import { useState } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import { LayoutDashboard, Building2, Video, BarChart2, LogOut, ShieldCheck, Plus, Inbox, Trophy, Code2, CalendarDays, MessageSquare, Star, Settings, HelpCircle } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { logout } from "../api/auth-api"
import { motion, AnimatePresence } from "motion/react"
import ClickSpark from "../bits/ClickSpark"

const EXAMINER_NAV = [
    { to: "/dashboard",   label: "Dashboard",        icon: LayoutDashboard },
    { to: "/my-drives",   label: "Drive Management", icon: Building2 },
    { to: "/interviews",  label: "Interviews",        icon: Video },
    { to: "/selection",   label: "Selection Board",   icon: BarChart2 },
]

const STUDENT_NAV = [
    { to: "/dashboard",       label: "Dashboard",          icon: LayoutDashboard },
    { to: "/my-applications", label: "My Assessments",     icon: Inbox },
    { to: "/interviews",      label: "Interviews",          icon: Video },
    { to: "/coding-practice", label: "Coding Practice",    icon: Code2 },
    { to: "/calendar",        label: "Calendar",            icon: CalendarDays },
    { to: "/messages",        label: "Messages",            icon: MessageSquare },
]

const STUDENT_BOTTOM_NAV = [
    { to: "/leaderboard",  label: "Leaderboard",  icon: Trophy },
    { to: "/achievements", label: "Achievements", icon: Star },
    { to: "/help",         label: "Help & Support", icon: HelpCircle },
    { to: "/settings",     label: "Settings",     icon: Settings },
]

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, setUser } = useAuthStore()
    const isExaminer = user?.role === "examiner"
    const navItems = isExaminer ? EXAMINER_NAV : STUDENT_NAV
    const [open, setOpen] = useState(false)

    async function handleLogout() {
        try {
            await logout()
            setUser(null)
            toast.success("Logged out")
            navigate("/")
        } catch(err) {
            toast.error("Logout failed")
        }
    }

    const initials = (user?.name || user?.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

    return (
        <motion.aside 
            initial={{ width: "80px" }}
            animate={{ width: open ? "260px" : "80px" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="m-4 h-[calc(100vh-32px)] rounded-[2rem] bg-[#09090b] border border-white/10 flex flex-col relative z-50 shrink-0 overflow-hidden shadow-2xl"
        >
            {/* ── Logo Area ── */}
            <div className="h-20 flex items-center px-5 shrink-0 whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-black">
                        <ShieldCheck size={22} strokeWidth={2.5} />
                    </div>
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: open ? 1 : 0 }}
                        className="font-bold text-xl tracking-tight text-white font-mono"
                    >
                        EVision
                    </motion.span>
                </div>
            </div>

            {/* ── Examiner Quick Action ── */}
            {isExaminer && (
                <div className="px-4 py-2 shrink-0">
                    <ClickSpark sparkColor="#ffffff" sparkSize={6} sparkRadius={15} sparkCount={5} duration={400}>
                        <button
                            onClick={() => navigate("/drive/create")}
                            className="w-full h-11 flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors overflow-hidden whitespace-nowrap"
                        >
                            <Plus size={18} className="shrink-0" />
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}>
                                New Drive
                            </motion.span>
                        </button>
                    </ClickSpark>
                </div>
            )}

            {/* ── Nav Items ── */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                {navItems.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.to
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`
                                relative flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap group
                                ${isActive ? "text-white bg-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            <Icon size={20} className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }}>
                                {item.label}
                            </motion.span>
                        </NavLink>
                    )
                })}

                {/* OTHER section for students */}
                {!isExaminer && (
                    <>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: open ? 1 : 0 }}
                            className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3.5 pt-4 pb-1"
                        >
                            Other
                        </motion.p>
                        {STUDENT_BOTTOM_NAV.map(item => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.to
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={`
                                        relative flex items-center gap-4 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap group
                                        ${isActive ? "text-white bg-white/10" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"}
                                    `}
                                >
                                    <Icon size={18} className={`shrink-0 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }}>
                                        {item.label}
                                    </motion.span>
                                </NavLink>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* ── Upgrade to Pro ── */}
            {!isExaminer && open && (
                <div className="px-4 py-3 shrink-0">
                    <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-yellow-500/10 border border-violet-500/20 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-xs font-bold text-white">Upgrade to Pro</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">Unlock advanced analytics and premium features.</p>
                        <button className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors">
                            Upgrade Now →
                        </button>
                    </div>
                </div>
            )}

            {/* ── User Footer ── */}
            <div className="p-4 mt-auto shrink-0 border-t border-white/5 bg-black/20 whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${initials}&background=18181b&color=ffffff`} className="w-full h-full rounded-full" alt="Avatar"/>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} className="flex flex-col">
                        <span className="text-sm font-bold text-white">{user?.name || "User"}</span>
                        <span className="text-xs font-mono text-zinc-500 capitalize">{user?.role}</span>
                    </motion.div>
                </div>

                <button onClick={handleLogout} className="w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-colors group">
                    <LogOut size={20} className="shrink-0" />
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }}>
                        Logout
                    </motion.span>
                </button>
            </div>
        </motion.aside>
    )
}
