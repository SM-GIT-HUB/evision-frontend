import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"
import SignupPage from "../pages/SignupPage"
import LandingPage from "../pages/LandingPage"
import ResultsPage from "../pages/ResultsPage"
import useAuthStore from "../store/auth-store"
import EditExamPage from "../pages/EditExamPage"
import CreateExamPage from "../pages/CreateExamPage"
import CreateRoomPage from "../pages/CreateRoomPage"
import ExamPage from "../features/exam/pages/ExamPage"
import ExamFinishedPage from "../pages/ExamFinishedPage"

// New Drive System
import BrowseDrivesPage from "../pages/BrowseDrivesPage"
import ApplyDrivePage from "../pages/ApplyDrivePage"
import MyApplicationsPage from "../pages/MyApplicationsPage"
import CreateDrivePage from "../pages/CreateDrivePage"

import { BrowserRouter, Routes, Route } from "react-router-dom"

function AppRoutes()
{
    const { isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <Routes>
                {/* Root */}
                <Route path="/" element={ isAuthenticated ? <HomePage /> : <LandingPage /> } />

                {/* Auth */}
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Legacy Exam System */}
                <Route path="/exam/create"        element={<CreateExamPage />} />
                <Route path="/exam/results/:id"   element={<ResultsPage />} />
                <Route path="/exam/edit/:id"      element={<EditExamPage />} />
                <Route path="/exam/:id"           element={<ExamPage />} />
                <Route path="/exam-finished"      element={<ExamFinishedPage />} />

                {/* Room / Interview */}
                <Route path="/room/create" element={<CreateRoomPage />} />

                {/* ── NEW: Drive System ─────────────────────────── */}
                <Route path="/drives"            element={<BrowseDrivesPage />} />
                <Route path="/drive/create"      element={<CreateDrivePage />} />
                <Route path="/apply/:driveId"    element={<ApplyDrivePage />} />
                <Route path="/my-applications"   element={<MyApplicationsPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes