import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"

function LandingPage()
{
    return (
        <div className="min-h-screen bg-black text-white">
            
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
                
                <div className="flex items-center gap-2">
                    <ShieldCheck size={30} />
                    <h1 className="text-2xl font-bold">
                        EVision
                    </h1>
                </div>

                <Link to="/login">
                    <button
                        className="bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition"
                    >
                        Login
                    </button>
                </Link>
            </nav>

            {/* Hero */}
            <section className="flex flex-col items-center justify-center text-center px-6 py-32">
                
                <h1 className="text-6xl font-bold max-w-4xl leading-tight">
                    Smart Online Examination Platform
                </h1>

                <p className="text-zinc-400 text-lg mt-6 max-w-2xl">
                    Secure exams with fullscreen enforcement, AI proctoring,
                    auto-save, auto-submit, and real-time monitoring.
                </p>

                <button
                    className="mt-10 bg-white text-black px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zinc-200 transition"
                >
                    Get Started
                </button>
            </section>
        </div>
    )
}

export default LandingPage