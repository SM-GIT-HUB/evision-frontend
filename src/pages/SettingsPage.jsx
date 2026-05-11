import { useState } from "react"
import { User, Mail, Lock, Bell, Shield, Palette, Eye, EyeOff } from "lucide-react"
import useAuthStore from "../store/auth-store"

const SECTIONS = [
    { id: "profile",       label: "Profile",       icon: User },
    { id: "security",      label: "Security",      icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance",    label: "Appearance",    icon: Palette },
    { id: "privacy",       label: "Privacy",       icon: Shield },
]

function Toggle({ on, toggle }) {
    return (
        <button onClick={toggle} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-violet-600" : "bg-zinc-700"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
        </button>
    )
}

export default function SettingsPage() {
    const { user } = useAuthStore()
    const [active, setActive] = useState("profile")
    const [showPass, setShowPass] = useState(false)
    const [notifs, setNotifs] = useState({ examInvite: true, examReminder: true, resultReady: true, shortlisted: true, selected: true, email: false })
    const [theme, setTheme] = useState("dark")
    const [privacy, setPrivacy] = useState({ leaderboard: true, profile: true, analytics: false })

    return (
        <div className="p-8 w-full max-w-6xl animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
            <div className="flex gap-6">
                <aside className="w-48 shrink-0 space-y-1">
                    {SECTIONS.map(s => {
                        const Icon = s.icon
                        return (
                            <button key={s.id} onClick={() => setActive(s.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left
                                    ${active === s.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/20" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}>
                                <Icon size={15} /> {s.label}
                            </button>
                        )
                    })}
                </aside>

                <div className="flex-1 bg-[#09090b] border border-white/5 rounded-2xl p-6 space-y-5">
                    {active === "profile" && <>
                        <h2 className="text-base font-bold text-white">Profile</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center text-xl font-black text-white">
                                {(user?.name || user?.email || "U")[0].toUpperCase()}
                            </div>
                            <button className="text-sm text-violet-400 font-semibold hover:text-violet-300">Change Photo</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[{ l: "Display Name", v: user?.name || "" }, { l: "Email", v: user?.email || "", dis: true }, { l: "Role", v: user?.role || "", dis: true }, { l: "Institution", v: "", ph: "Enter college/company" }].map(f => (
                                <div key={f.l}>
                                    <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{f.l}</label>
                                    <input defaultValue={f.v} placeholder={f.ph || ""} disabled={f.dis}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/40 placeholder-zinc-700 disabled:opacity-40" />
                                </div>
                            ))}
                        </div>
                        <button className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">Save Changes</button>
                    </>}

                    {active === "security" && <>
                        <h2 className="text-base font-bold text-white">Security</h2>
                        {["Current Password", "New Password", "Confirm Password"].map(l => (
                            <div key={l}>
                                <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{l}</label>
                                <div className="relative">
                                    <input type={showPass ? "text" : "password"} placeholder="••••••••"
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/40 pr-10" />
                                    <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">Update Password</button>
                    </>}

                    {active === "notifications" && <>
                        <h2 className="text-base font-bold text-white">Notifications</h2>
                        {[{ k: "examInvite", l: "Exam Invitations", d: "When you're invited to an exam" }, { k: "examReminder", l: "Exam Reminders", d: "Before exam starts" }, { k: "resultReady", l: "Result Published", d: "When results are available" }, { k: "shortlisted", l: "Shortlisted", d: "When shortlisted for a drive" }, { k: "selected", l: "Selection Updates", d: "Final selection notifications" }, { k: "email", l: "Email Digest", d: "Weekly summary email" }].map(n => (
                            <div key={n.k} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div><p className="text-sm font-semibold text-white">{n.l}</p><p className="text-xs text-zinc-500">{n.d}</p></div>
                                <Toggle on={notifs[n.k]} toggle={() => setNotifs(p => ({ ...p, [n.k]: !p[n.k] }))} />
                            </div>
                        ))}
                    </>}

                    {active === "appearance" && <>
                        <h2 className="text-base font-bold text-white">Appearance</h2>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-3 uppercase tracking-wider">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            {["dark", "light", "system"].map(t => (
                                <button key={t} onClick={() => setTheme(t)}
                                    className={`p-4 rounded-xl border text-sm font-semibold capitalize transition-colors
                                        ${theme === t ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-white/10 text-zinc-400 hover:border-white/20"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-600 mt-3">Full light mode coming soon. App runs in dark mode.</p>
                    </>}

                    {active === "privacy" && <>
                        <h2 className="text-base font-bold text-white">Privacy</h2>
                        {[{ k: "leaderboard", l: "Show on Leaderboard", d: "Let your name appear in public rankings" }, { k: "profile", l: "Profile Visibility", d: "Visible to other students" }, { k: "analytics", l: "Share Analytics", d: "Anonymized data for platform improvement" }].map(s => (
                            <div key={s.k} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div><p className="text-sm font-semibold text-white">{s.l}</p><p className="text-xs text-zinc-500">{s.d}</p></div>
                                <Toggle on={privacy[s.k]} toggle={() => setPrivacy(p => ({ ...p, [s.k]: !p[s.k] }))} />
                            </div>
                        ))}
                    </>}
                </div>
            </div>
        </div>
    )
}
