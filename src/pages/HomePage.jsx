import { useEffect, useState } from "react"
import useAuthStore from "../store/auth-store"
import { getExamDetails } from "../api/exam-api"
import { getMyRooms } from "../api/room-api"
import ExamSection from "../components/ExamSection"
import RoomsSection from "../components/RoomsSection"
import SelectionSection from "../components/SelectionSection"
import LoadingSpinner from "../components/LoadingSpinner"
import DashboardHeader from "../components/DashboardHeader"
import ExaminerDrivesTab from "../components/ExaminerDrivesTab"
import StudentPortal from "../components/StudentPortal"

function HomePage()
{
    const { user } = useAuthStore();
    const isExaminer = user.role === "examiner";

    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(() => {
        const saved = localStorage.getItem("selectedExamTab") || ""
        // Reset to role-appropriate default if stale
        if (!saved || saved === "drives" || saved === "my-applications") {
            return isExaminer ? "drives" : "portal"
        }
        return saved
    })

    const [upcomingExams, setUpcomingExams] = useState([]);
    const [pastExams, setPastExams] = useState([]);
    const [upcomingRooms, setUpcomingRooms] = useState([]);
    const [pastRooms, setPastRooms] = useState([]);

    useEffect(() => {
        localStorage.setItem("selectedExamTab", selectedTab);
    }, [selectedTab])

    useEffect(() => {
        async function fetchAll() {
            try {
                const [examRes, upcomingRoomsRes, pastRoomsRes] = await Promise.allSettled([
                    getExamDetails(),
                    getMyRooms("upcoming"),
                    getMyRooms("past")
                ]);

                if (examRes.status === "fulfilled") {
                    setUpcomingExams(examRes.value.data.upcoming || []);
                    setPastExams(examRes.value.data.past || []);
                }
                if (upcomingRoomsRes.status === "fulfilled") setUpcomingRooms(upcomingRoomsRes.value.data || []);
                if (pastRoomsRes.status === "fulfilled") setPastRooms(pastRoomsRes.value.data || []);
            } catch(err) {
                console.log(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [])

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-7xl mx-auto">

                <DashboardHeader
                    user={user}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />

                <div className="mt-8">

                    {/* ── Student: My Portal (primary view) ── */}
                    {selectedTab === "portal" && !isExaminer && (
                        <StudentPortal />
                    )}

                    {/* ── Shared: Exams ── */}
                    {selectedTab === "upcoming" && (
                        <ExamSection title="Upcoming Exams" exams={upcomingExams} type="upcoming" role={user.role} />
                    )}
                    {selectedTab === "past" && (
                        <ExamSection title="Past Exams" exams={pastExams} type="past" role={user.role} />
                    )}

                    {/* ── Shared: Interviews ── */}
                    {selectedTab === "rooms" && (
                        <RoomsSection upcomingRooms={upcomingRooms} pastRooms={pastRooms} role={user.role} />
                    )}

                    {/* ── Examiner: Drives Dashboard ── */}
                    {selectedTab === "drives" && isExaminer && (
                        <ExaminerDrivesTab />
                    )}

                    {/* ── Examiner: Selection Board ── */}
                    {selectedTab === "selection" && isExaminer && (
                        <SelectionSection exams={pastExams} />
                    )}

                </div>
            </div>
        </div>
    )
}

export default HomePage