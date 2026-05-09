import toast from "react-hot-toast"
import { logout } from "../api/auth-api"
import { ShieldCheck, GraduationCap, Video, BarChart2, Plus, Building2, LayoutDashboard } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/auth-store"

function DashboardHeader({ user, selectedTab, setSelectedTab })
{
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const isExaminer = user.role === "examiner";

    async function handleLogout() {
        try {
            await logout();
            setUser(null);
            toast.success("Logged out");
            navigate("/login");
        } catch(err) {
            toast.error(err.response?.data?.message || "Logout failed");
        }
    }

    return (
        <div className="flex flex-col gap-5">

            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <span className="text-xl font-bold">EVision</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm pl-0.5">
                        <span>Welcome back,</span>
                        <span className="text-white font-semibold">{user.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            isExaminer
                                ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                                : "bg-sky-500/20 text-sky-400 border-sky-500/30"
                        }`}>
                            {isExaminer ? "Examiner" : "Student"}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {isExaminer ? (
                        <>
                            <button onClick={() => navigate("/exam/create")}
                                className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-xl text-sm hover:border-zinc-500 transition">
                                <Plus size={14} /> New Exam
                            </button>
                            <button onClick={() => navigate("/drive/create")}
                                className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-500 transition">
                                <Building2 size={14} /> New Drive
                            </button>
                            <button onClick={() => navigate("/room/create")}
                                className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-xl text-sm hover:border-zinc-500 transition">
                                <Video size={14} /> Schedule Interview
                            </button>
                        </>
                    ) : null}

                    <button onClick={handleLogout}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-xl text-sm transition">
                        Logout
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-zinc-800 pb-px">
                {isExaminer ? (
                    <>
                        <Tab id="tab-upcoming"  label="Upcoming Exams"  value="upcoming"   active={selectedTab} set={setSelectedTab} />
                        <Tab id="tab-past"      label="Past Exams"      value="past"       active={selectedTab} set={setSelectedTab} />
                        <Tab id="tab-rooms"     label="Interviews"      value="rooms"      active={selectedTab} set={setSelectedTab} icon={<Video size={13} />} />
                        <Tab id="tab-drives"    label="My Drives"       value="drives"     active={selectedTab} set={setSelectedTab} icon={<Building2 size={13} />} />
                        <Tab id="tab-selection" label="Selection Board" value="selection"  active={selectedTab} set={setSelectedTab} icon={<BarChart2 size={13} />} />
                    </>
                ) : (
                    <>
                        <Tab id="tab-portal"    label="My Portal"       value="portal"     active={selectedTab} set={setSelectedTab} icon={<LayoutDashboard size={13} />} />
                        <Tab id="tab-rooms"     label="Interviews"      value="rooms"      active={selectedTab} set={setSelectedTab} icon={<Video size={13} />} />
                        <Tab id="tab-upcoming"  label="Upcoming Exams"  value="upcoming"   active={selectedTab} set={setSelectedTab} />
                    </>
                )}
            </div>
        </div>
    )
}

function Tab({ id, label, value, active, set, icon }) {
    const isActive = active === value
    return (
        <button id={id} onClick={() => set(value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                isActive
                    ? "border-violet-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}>
            {icon}{label}
        </button>
    )
}

export default DashboardHeader