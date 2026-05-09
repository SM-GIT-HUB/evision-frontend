import toast from "react-hot-toast"
import { logout } from "../api/auth-api"
import { ShieldCheck } from "lucide-react"
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
        <div className="flex flex-col gap-8">
            
            <div>
                <div className="w-full flex justify-between">
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <ShieldCheck size={38} />
                        EVision
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="
                            bg-red-500 hover:bg-red-600
                            px-5 py-2.5 rounded-xl transition
                        "
                    >
                        Logout
                    </button>
                </div>

                <p className="mt-4 text-zinc-400 text-lg">
                    Welcome back, {user.name}
                </p>

                <p className="mt-2 text-zinc-500">
                    Role: <span className="text-white capitalize">{user.role}</span>
                </p>
            </div>

            <div className="flex gap-3 flex-wrap">

                <button
                    onClick={() => setSelectedTab("upcoming")}
                    className={`px-5 py-2.5 rounded-xl border transition
                    ${
                        selectedTab === "upcoming"
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                >
                    Upcoming Exams
                </button>

                <button
                    onClick={() => setSelectedTab("past")}
                    className={`px-5 py-2.5 rounded-xl border transition
                    ${
                        selectedTab === "past"
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                >
                    Past Exams
                </button>

                {
                    user.role === "examiner" &&
                    <button
                        onClick={() => navigate("/exam/create")}
                        className="bg-zinc-900 border border-zinc-800 px-5 py-2.5 rounded-xl hover:border-zinc-700 transition"
                    >
                        Create Exam
                    </button>
                }

            </div>

        </div>
    )
}

export default DashboardHeader