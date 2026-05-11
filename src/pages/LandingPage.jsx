import { Link } from "react-router-dom"
import { ShieldCheck, Video, Code2, Target, ChevronRight, Lock, BrainCircuit } from "lucide-react"
import { useEffect, useState } from "react"
import SoftAurora from "../bits/SoftAurora"
import SplitText from "../bits/SplitText"
import ShinyText from "../bits/ShinyText"
import CountUp from "../bits/CountUp"
import SpotlightCard from "../bits/SpotlightCard"
import Magnet from "../bits/Magnet"

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
            
            {/* --- Background Effects using Aurora --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
                <SoftAurora 
                  color1="#6d28d9" 
                  color2="#312e81" 
                  speed={0.5} 
                  brightness={0.8}
                  enableMouseInteraction={false}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
            </div>

            {/* --- Floating Pill Navbar --- */}
            <div className="fixed top-6 inset-x-0 z-50 flex justify-center px-6">
                <nav className={`transition-all duration-500 rounded-full flex items-center justify-between px-6 py-3 w-full max-w-5xl ${
                    scrolled 
                    ? 'bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
                    : 'bg-transparent border border-transparent'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-full text-white shadow-lg shadow-violet-500/20">
                            <ShieldCheck size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            EVision
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <Link to="/login" className="text-sm font-bold tracking-wide text-zinc-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signup" className="group">
                            <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-zinc-200 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </nav>
            </div>

            <main className="relative z-10 pt-32 pb-20">
                
                {/* --- Hero Section --- */}
                <section className="px-6 min-h-[85vh] flex flex-col items-center justify-center text-center max-w-6xl mx-auto">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8 shadow-inner shadow-white/5">
                        <ShinyText text="✨ NEXT-GEN HIRING PLATFORM" speed={3} className="text-[11px] font-bold tracking-[0.2em] uppercase" />
                    </div>

                    <div className="w-full flex items-center justify-center mb-8 min-h-[14rem]">
                        <SplitText 
                            text="Hire the top 1% without the guesswork."
                            className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-center select-none text-white max-w-4xl drop-shadow-2xl"
                            delay={30}
                            duration={0.8}
                        />
                    </div>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-12 font-medium">
                        Replace fragmented tools with a single, intelligent platform. Conduct secure auto-proctored exams, host live coding interviews, and manage selections seamlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Link to="/signup" className="group relative px-8 py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
                            <div className="relative z-10 flex items-center gap-2">
                                Start Hiring for Free <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                        
                        <Link to="/login" className="group px-8 py-4 rounded-full bg-transparent border border-white/10 text-white font-bold text-sm tracking-wide uppercase hover:bg-white/5 transition-colors backdrop-blur-md">
                            <span className="flex items-center gap-2 text-zinc-300 group-hover:text-white transition-colors">
                                <Code2 size={16} /> Join an Exam
                            </span>
                        </Link>
                    </div>

                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10 w-full">
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white flex items-center"><CountUp to={1200} />+</span>
                            <span className="text-sm text-zinc-500 mt-1">Candidates</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white flex items-center"><CountUp to={50} />+</span>
                            <span className="text-sm text-zinc-500 mt-1">Companies</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white flex items-center"><CountUp to={99} />%</span>
                            <span className="text-sm text-zinc-500 mt-1">Uptime</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white flex items-center"><CountUp to={24} />/7</span>
                            <span className="text-sm text-zinc-500 mt-1">Support</span>
                        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[300px]">
                        
                        <SpotlightCard className="md:col-span-2 md:row-span-2 border border-white/5" spotlightColor="rgba(16, 185, 129, 0.08)">
                            <div className="absolute inset-0 p-12 flex flex-col justify-end z-10 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="mb-6 bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-emerald-500/20 backdrop-blur-xl">
                                    <Lock size={28} className="text-emerald-400" />
                                </div>
                                <h3 className="text-4xl font-black mb-4 tracking-tight">Fort Knox-level Security</h3>
                                <p className="text-zinc-400 text-lg max-w-md font-medium leading-relaxed">
                                    AI-powered tab-switching detection, mandatory fullscreen enforcement, and automated submission protocols ensure zero malpractice.
                                </p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="border border-white/5" spotlightColor="rgba(139, 92, 246, 0.08)">
                            <div className="absolute inset-0 p-8 flex flex-col z-10 bg-gradient-to-b from-black/40 to-transparent">
                                <div className="bg-violet-500/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-violet-500/20 mb-6 backdrop-blur-xl">
                                    <Code2 size={24} className="text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-black mb-3 tracking-tight">Live Pair Programming</h3>
                                <p className="text-zinc-400 font-medium leading-relaxed">
                                    Real-time code synchronization powered by Socket.io and Monaco Editor. Code together, flawlessly.
                                </p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="border border-white/5" spotlightColor="rgba(59, 130, 246, 0.08)">
                            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-6 backdrop-blur-xl">
                                    <Video size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-black mb-3 tracking-tight">P2P Video Interviews</h3>
                                <p className="text-zinc-400 font-medium leading-relaxed">
                                    Built-in WebRTC video streaming. No external plugins or Zoom links required. Just one click to connect.
                                </p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="border border-white/5" spotlightColor="rgba(244, 63, 94, 0.08)">
                            <div className="absolute inset-0 p-8 flex flex-col z-10 bg-gradient-to-b from-black/40 to-transparent">
                                <div className="bg-rose-500/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-6 backdrop-blur-xl">
                                    <BrainCircuit size={24} className="text-rose-400" />
                                </div>
                                <h3 className="text-2xl font-black mb-3 tracking-tight">Auto Evaluation</h3>
                                <p className="text-zinc-400 font-medium leading-relaxed">
                                    Instant grading for MCQs and robust tracking. Save hours of manual checking per candidate.
                                </p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="md:col-span-2 border border-white/5" spotlightColor="rgba(99, 102, 241, 0.08)">
                            <div className="absolute inset-0 p-10 flex flex-col justify-center z-10 bg-gradient-to-r from-black/60 to-transparent">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-indigo-500/20 backdrop-blur-xl">
                                        <Target size={28} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tight">The Selection Board</h3>
                                </div>
                                <p className="text-zinc-400 text-lg max-w-xl font-medium leading-relaxed">
                                    A unified leaderboard aggregating exam scores and interview ratings. Shortlist, reject, or hire with a single click.
                                </p>
                            </div>
                        </SpotlightCard>

                    </div>
                </section>

                {/* --- Bottom CTA --- */}
                <section className="py-32 px-6 text-center border-t border-white/5 bg-[#050505]">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Ready to upgrade your hiring?</h2>
                    <p className="text-xl text-zinc-400 mb-10 font-medium">Join examiners using EVision to find the best talent.</p>
                    <Link to="/signup">
                        <button className="px-10 py-5 rounded-full bg-white text-black font-black tracking-widest uppercase text-sm shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all hover:scale-105">
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