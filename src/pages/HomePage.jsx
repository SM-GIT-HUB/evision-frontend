import { useEffect, useState, useRef } from "react"

import useAuthStore from "../store/auth-store"
import { getExamDetails } from "../api/exam-api"
import ExamSection from "../components/ExamSection"
import LoadingSpinner from "../components/LoadingSpinner"
import DashboardHeader from "../components/DashboardHeader"
import { requestCameraAccess } from "../utils/request-camera-access"

function HomePage()
{
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(() => {
        return localStorage.getItem("selectedExamTab") || "upcoming";
    })

    const [upcomingExams, setUpcomingExams] = useState([]);
    const [pastExams, setPastExams] = useState([]);

    const requestedCameraRef = useRef(false);

    useEffect(() => {
        localStorage.setItem("selectedExamTab", selectedTab);
    }, [selectedTab])

    useEffect(() => {
        async function fetchExamDetails()
        {
            try {
                const response = await getExamDetails();

                setUpcomingExams(response.data.upcoming || []);
                setPastExams(response.data.past || []);
            }
            catch(err) {
                console.log(err.message);
            }
            finally {
                setLoading(false);
            }
        }

        fetchExamDetails();
    }, [])

    useEffect(() => {
        if (!user) {
            return;
        }

        if (requestedCameraRef.current) {
            return;
        }

        requestedCameraRef.current = true;

        async function requestCameraPermission()
        {
            try {
                await requestCameraAccess();
            }
            catch(err) {
                console.log(
                    "Camera permission denied",
                    err
                )
            }
        }

        requestCameraPermission();

    }, [user])

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="
            min-h-screen
            bg-black
            text-white
            px-5 py-6
        ">
            <div className="max-w-7xl mx-auto">

                <DashboardHeader
                    user={user}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />

                {
                    selectedTab === "upcoming" &&
                    <ExamSection
                        title="Upcoming Exams"
                        exams={upcomingExams}
                        type="upcoming"
                        role={user.role}
                    />
                }

                {
                    selectedTab === "past" &&
                    <ExamSection
                        title="Past Exams"
                        exams={pastExams}
                        type="past"
                        role={user.role}
                    />
                }
            </div>
        </div>
    )
}

export default HomePage