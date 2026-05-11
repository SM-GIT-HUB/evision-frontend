import toast from "react-hot-toast"
import { logout } from "../api/auth-api"
import { LogOut, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/auth-store"

function DashboardHeader({ user, selectedTab, setSelectedTab })
{
    const navigate = useNavigate();
    const { setUser } = useAuthStore();

    async function handleLogout()
    {
        try {

            await logout();

            setUser(null);

            toast.success("Logged out");

            navigate("/login");
        }
        catch(err) {

            toast.error(
                err.response?.data?.message ||
                "Logout failed"
            )
        }
    }
    
    return (
        <div className="space-y-8">

            <div className="flex items-start justify-between gap-6">

                <div>

                    <div className="flex items-center gap-4">

                        <div className="
                            w-14 h-14
                            rounded-2xl
                            bg-zinc-100
                            text-black
                            flex items-center justify-center
                        ">
                            <ShieldCheck size={28} />
                        </div>

                        <div>

                            <h1 className="text-5xl font-bold tracking-tight">
                                EVision
                            </h1>

                            <p className="text-zinc-500 mt-1">
                                Welcome back, {user.name}
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    onClick={handleLogout}
                    className="
                        h-fit
                        border border-zinc-800
                        bg-zinc-950
                        hover:bg-zinc-900
                        hover:border-zinc-700
                        px-5 py-3
                        rounded-2xl
                        transition flex gap-2
                    "
                >
                    <h1>Logout</h1>
                    <LogOut className="text-red-600"/>
                </button>

            </div>

            <div className="flex flex-wrap gap-3">

                <button
                    onClick={() => setSelectedTab("upcoming")}
                    className={`
                        px-5 py-3 rounded-2xl border transition
                        font-medium
                        ${
                            selectedTab === "upcoming"
                            ? "bg-zinc-100 text-black border-zinc-100"
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                        }
                    `}
                >
                    Upcoming Exams
                </button>

                <button
                    onClick={() => setSelectedTab("past")}
                    className={`
                        px-5 py-3 rounded-2xl border transition
                        font-medium
                        ${
                            selectedTab === "past"
                            ? "bg-zinc-100 text-black border-zinc-100"
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                        }
                    `}
                >
                    Past Exams
                </button>

                {
                    user.role === "examiner" &&
                    <button
                        onClick={() => navigate("/exam/create")}
                        className="
                            px-5 py-3 rounded-2xl
                            bg-zinc-950
                            border border-zinc-800
                            hover:border-zinc-700
                            hover:bg-zinc-900
                            transition
                            font-medium
                        "
                    >
                        Create Exam
                    </button>
                }

            </div>

        </div>
    )
}

export default DashboardHeader