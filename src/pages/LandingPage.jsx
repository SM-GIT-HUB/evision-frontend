import { Link } from "react-router-dom"
import { ShieldCheck, Video, Code2, Users, LayoutDashboard, Target, Zap, ChevronRight, CheckCircle2, Award, Sparkles, BrainCircuit, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { MaskContainer } from "../components/ui/svg-mask-effect"

// --- Custom Cursor Component ---
function CustomCursor() {
    const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e) => {
            if (['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.closest('button') || e.target.closest('a')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
            {/* Inner Dot */}
            <div 
                className="absolute w-2 h-2 bg-white rounded-full mix-blend-difference transition-transform duration-75 ease-out"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: `translate(-50%, -50%) scale(${isHovering ? 0 : 1})`,
                }}
            />
            {/* Outer Ring */}
            <div 
                className="absolute w-10 h-10 border border-violet-500 rounded-full transition-all duration-300 ease-out"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
                    backgroundColor: isHovering ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    backdropFilter: isHovering ? 'blur(2px)' : 'none'
                }}
            />
        </div>
    );
}

export default function LandingPage()
{
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hide native cursor for desktop
    useEffect(() => {
        document.body.classList.add('md:cursor-none');
        return () => document.body.classList.remove('md:cursor-none');
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-violet-500/30">
            <CustomCursor />
            
            {/* --- Background Effects --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/30 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '5s' }}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* --- Navbar --- */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-lg border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
                            <ShieldCheck size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            EVision
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signup">
                            <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-lg">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">
                
                {/* --- Hero Section --- */}
                <section className="px-6 min-h-[85vh] flex flex-col items-center justify-center text-center max-w-6xl mx-auto">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-8 hover:bg-white/[0.06] transition-colors cursor-default">
                        <Sparkles size={14} className="text-violet-400" />
                        <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">The Future of Tech Hiring</span>
                    </div>

                    <div className="w-full flex items-center justify-center mb-8 h-[24rem]">
                        <MaskContainer
                            revealText={
                                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-center select-none text-white">
                                    Hire the top 1% <br />
                                    <span className="text-zinc-500">
                                        without the guesswork.
                                    </span>
                                </h1>
                            }
                            className="rounded-3xl"
                            size={50}
                            revealSize={400}
                        >
                            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-center select-none text-black">
                                Hire the top 1% <br />
                                <span className="text-violet-600">
                                    without the guesswork.
                                </span>
                            </h1>
                        </MaskContainer>
                    </div>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-12 font-medium">
                        Replace fragmented tools with a single, intelligent platform. Conduct secure auto-proctored exams, host live coding interviews, and manage selections seamlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <Link to="/signup" className="group relative px-8 py-4 rounded-full bg-white text-black font-semibold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
                            <div className="relative z-10 flex items-center gap-2">
                                Start Hiring for Free <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                        
                        <Link to="/login" className="group px-8 py-4 rounded-full bg-transparent border border-zinc-700 text-white font-semibold text-lg hover:bg-zinc-900 transition-colors">
                            <span className="flex items-center gap-2 text-zinc-300 group-hover:text-white transition-colors">
                                <Code2 size={18} /> Join an Exam
                            </span>
                        </Link>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Scroll</span>
                        <div className="w-px h-8 bg-gradient-to-b from-zinc-500 to-transparent"></div>
                    </div>
                </section>

                {/* --- Bento Grid Features Section --- */}
                <section className="py-32 px-6 max-w-7xl mx-auto" id="features">
                    
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                            Everything you need.<br/>
                            <span className="text-zinc-500">In one place.</span>
                        </h2>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        
                        {/* Large Card: Secure Exams */}
                        <div className="md:col-span-2 md:row-span-2 group relative rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="absolute inset-0 p-10 flex flex-col justify-end z-10">
                                <div className="mb-4 bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                    <Lock size={26} className="text-emerald-400" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3">Fort Knox-level Security</h3>
                                <p className="text-zinc-400 text-lg max-w-md">
                                    AI-powered tab-switching detection, mandatory fullscreen enforcement, and automated submission protocols ensure zero malpractice.
                                </p>
                            </div>
                            {/* Abstract Graphic */}
                            <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] group-hover:bg-emerald-500/30 transition-colors duration-700"></div>
                        </div>

                        {/* Standard Card: Live Coding */}
                        <div className="group relative rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-bl from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 p-8 flex flex-col">
                                <div className="bg-violet-500/20 w-12 h-12 rounded-xl flex items-center justify-center border border-violet-500/30 mb-6">
                                    <Code2 size={22} className="text-violet-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Live Pair Programming</h3>
                                <p className="text-zinc-400 text-sm">
                                    Real-time code synchronization powered by Socket.io and Monaco Editor. Code together, flawlessly.
                                </p>
                            </div>
                        </div>

                        {/* Standard Card: WebRTC */}
                        <div className="group relative rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center border border-blue-500/30 mb-6">
                                    <Video size={22} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">P2P Video Interviews</h3>
                                <p className="text-zinc-400 text-sm">
                                    Built-in WebRTC video streaming. No external plugins or Zoom links required. Just one click to connect.
                                </p>
                            </div>
                        </div>

                        {/* Standard Card: Smart Evaluation */}
                        <div className="group relative rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-bl from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 p-8 flex flex-col">
                                <div className="bg-rose-500/20 w-12 h-12 rounded-xl flex items-center justify-center border border-rose-500/30 mb-6">
                                    <BrainCircuit size={22} className="text-rose-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Auto Evaluation</h3>
                                <p className="text-zinc-400 text-sm">
                                    Instant grading for MCQs and robust tracking. Save hours of manual checking per candidate.
                                </p>
                            </div>
                        </div>

                        {/* Wide Card: Selection Board */}
                        <div className="md:col-span-2 group relative rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 p-10 flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                        <Target size={26} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold">The Selection Board</h3>
                                </div>
                                <p className="text-zinc-400 text-lg max-w-xl">
                                    A unified leaderboard aggregating exam scores and interview ratings. Shortlist, reject, or hire with a single click.
                                </p>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                                <Award size={300} />
                            </div>
                        </div>

                    </div>
                </section>

                {/* --- How It Works Section --- */}
                <section className="py-32 px-6 relative border-t border-white/5 bg-zinc-950/30">
                    <div className="max-w-7xl mx-auto">
                        
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Designed for both sides of the table.</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            
                            {/* Left Side: Content */}
                            <div className="space-y-12">
                                
                                <div className="flex gap-6 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:border-violet-500/50 group-hover:text-violet-400 transition-colors">
                                        <span className="font-bold">1</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3">Create & Broadcast</h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg">
                                            Examiners define exam parameters (duration, passing marks, MCQs, theory) and paste candidate emails. Our system automatically dispatches OTP-secured invites.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-colors">
                                        <span className="font-bold">2</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3">Proctored Assessment</h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg">
                                            Candidates enter the exam. The browser is locked into fullscreen. Leaving the tab triggers warnings and auto-submission protocols.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">
                                        <span className="font-bold">3</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3">Interview & Hire</h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg">
                                            Shortlisted candidates join a live WebRTC room with an integrated Monaco code editor. Examiners evaluate in real-time and update the Selection Board.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Right Side: Visual/Mockup */}
                            <div className="relative">
                                {/* Glassmorphic Card Mockup */}
                                <div className="relative z-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    
                                    {/* Mockup Header */}
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-zinc-400 font-mono">
                                            Selection Board
                                        </div>
                                    </div>

                                    {/* Mockup Rows */}
                                    <div className="space-y-4">
                                        {[
                                            { name: "Alice Johnson", score: "92", status: "Selected", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
                                            { name: "Bob Smith", score: "85", status: "Shortlisted", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
                                            { name: "Charlie Davis", score: "45", status: "Rejected", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" },
                                        ].map((row, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
                                                        {row.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm">{row.name}</div>
                                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">Total: {row.score}/100</div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${row.bg} ${row.color} ${row.border}`}>
                                                    {row.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                                {/* Decorative Background Elements */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-violet-600/30 to-blue-600/30 blur-[100px] -z-10 rounded-full"></div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* --- Bottom CTA --- */}
                <section className="py-32 px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to upgrade your hiring?</h2>
                    <p className="text-xl text-zinc-400 mb-10">Join examiners using EVision to find the best talent.</p>
                    <Link to="/signup">
                        <button className="px-10 py-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                            Create Your First Exam
                        </button>
                    </Link>
                </section>

            </main>

            {/* --- Footer --- */}
            <footer className="border-t border-white/10 py-12 text-center bg-black relative z-10">
                <div className="flex items-center justify-center gap-2 mb-6 opacity-70">
                    <ShieldCheck size={24} className="text-violet-400" />
                    <span className="text-xl font-bold tracking-tight text-white">EVision Platform</span>
                </div>
                <div className="flex justify-center gap-6 mb-8 text-sm font-medium text-zinc-500">
                    <a href="#" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors cursor-pointer">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors cursor-pointer">Contact Support</a>
                </div>
                <p className="text-zinc-600 text-sm">
                    © {new Date().getFullYear()} EVision. Built for the modern examiner.
                </p>
            </footer>

        </div>
    )
}