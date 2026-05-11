import { useState } from "react"
import { Search, BookOpen, MessageSquare, ChevronDown, ChevronRight, ExternalLink, Mail } from "lucide-react"

const FAQS = [
    {
        cat: "Assessment",
        items: [
            { q: "What happens if I lose internet during an exam?", a: "Your answers are auto-saved every 30 seconds. Reconnect and continue — your progress is safe as long as the exam is still active." },
            { q: "Can I go back to previous questions?", a: "Yes. Use the Previous button or click any question number in the Question Palette on the right side of your screen." },
            { q: "What is the Flag/Review feature?", a: "Flagging marks a question for review. Flagged questions show in amber in your palette. You can revisit them before submitting." },
            { q: "Why was my exam auto-submitted?", a: "This happens when: (1) time runs out, (2) you switch tabs too many times, (3) you exit fullscreen too many times, or (4) the proctoring system detects violations." },
        ]
    },
    {
        cat: "Interviews",
        items: [
            { q: "How do I join an interview room?", a: "Go to Interviews in the sidebar and click Join Room. Ensure your camera and microphone are allowed in your browser." },
            { q: "What happens if the interviewer disconnects?", a: "The session stays active. Wait for the interviewer to reconnect. If they don't return within 5 minutes, contact your examiner." },
        ]
    },
    {
        cat: "Applications & Drives",
        items: [
            { q: "How do I apply for a placement drive?", a: "Go to Dashboard and browse available drives. Click Apply and fill the application form." },
            { q: "What does 'Shortlisted' mean?", a: "You've passed the initial screening and have been selected for the next stage (usually an exam or interview)." },
            { q: "Can I withdraw my application?", a: "Currently applications cannot be withdrawn once submitted. Contact the examiner directly if needed." },
        ]
    },
]

export default function HelpPage() {
    const [search, setSearch] = useState("")
    const [expanded, setExpanded] = useState({})

    function toggle(key) {
        setExpanded(p => ({ ...p, [key]: !p[key] }))
    }

    const filtered = FAQS.map(cat => ({
        ...cat,
        items: cat.items.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.items.length > 0)

    return (
        <div className="p-8 w-full max-w-6xl animate-in fade-in duration-500 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Help & Support</h1>
                <p className="text-zinc-400 text-sm mt-1">Find answers or contact us for help.</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search help articles..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/40 placeholder-zinc-600"
                />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: BookOpen, label: "Documentation", desc: "Full platform guide" },
                    { icon: MessageSquare, label: "Community", desc: "Ask other students" },
                    { icon: Mail, label: "Contact Us", desc: "Email our team" },
                ].map(c => {
                    const Icon = c.icon
                    return (
                        <div key={c.label} className="bg-[#09090b] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 hover:border-violet-500/20 transition-colors cursor-pointer group">
                            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <Icon size={15} className="text-violet-400" />
                            </div>
                            <p className="text-sm font-bold text-white">{c.label}</p>
                            <p className="text-xs text-zinc-500">{c.desc}</p>
                        </div>
                    )
                })}
            </div>

            {/* FAQs */}
            <div className="space-y-5">
                <h2 className="text-sm font-bold text-white">Frequently Asked Questions</h2>
                {filtered.length === 0 && (
                    <p className="text-zinc-600 text-sm text-center py-8">No results for "{search}"</p>
                )}
                {filtered.map(cat => (
                    <div key={cat.cat}>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{cat.cat}</p>
                        <div className="space-y-2">
                            {cat.items.map((item, i) => {
                                const key = `${cat.cat}-${i}`
                                return (
                                    <div key={key} className="bg-[#09090b] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                                        <button
                                            onClick={() => toggle(key)}
                                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                                        >
                                            <span className="text-sm font-semibold text-zinc-300 pr-4">{item.q}</span>
                                            {expanded[key] ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
                                        </button>
                                        {expanded[key] && (
                                            <div className="px-5 pb-4 text-xs text-zinc-500 leading-relaxed border-t border-white/5 pt-3">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact CTA */}
            <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p className="font-bold text-white text-sm">Still need help?</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Our support team typically responds within 24 hours.</p>
                </div>
                <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                    <Mail size={13} /> Email Support
                </button>
            </div>
        </div>
    )
}
