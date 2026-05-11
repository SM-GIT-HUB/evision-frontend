import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import useAuthStore from "../store/auth-store"
import AppShell from "../components/AppShell"

// Public pages
import LandingPage    from "../pages/LandingPage"
import LoginPage      from "../pages/LoginPage"
import SignupPage     from "../pages/SignupPage"

// Authenticated pages
import DashboardPage       from "../pages/DashboardPage"
import BrowseDrivesPage    from "../pages/BrowseDrivesPage"
import ApplyDrivePage      from "../pages/ApplyDrivePage"
import MyApplicationsPage  from "../pages/MyApplicationsPage"
import CreateDrivePage     from "../pages/CreateDrivePage"
import MyDrivesPage        from "../pages/MyDrivesPage"
import InterviewsPage      from "../pages/InterviewsPage"

// Legacy exam system
import CreateExamPage   from "../pages/CreateExamPage"
import EditExamPage     from "../pages/EditExamPage"
import ResultsPage      from "../pages/ResultsPage"
import ExamFinishedPage from "../pages/ExamFinishedPage"
import ExamPage         from "../features/exam/pages/ExamPage"
import CreateRoomPage   from "../pages/CreateRoomPage"
import RoomPage         from "../pages/RoomPage"
import RoomFinishedPage from "../pages/RoomFinishedPage"

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuthStore()
    if (!isAuthenticated) return <Navigate to="/" replace />
    return <AppShell>{children}</AppShell>
}

function ExaminerRoute({ children }) {
    const { isAuthenticated, user } = useAuthStore()
    if (!isAuthenticated) return <Navigate to="/" replace />
    if (user?.role !== "examiner") return <Navigate to="/dashboard" replace />
    return <AppShell>{children}</AppShell>
}

function AppRoutes() {
    const { isAuthenticated } = useAuthStore()

    return (
        <BrowserRouter>
            <Routes>
                {/* ── Public ─────────────────────────────────────────────── */}
                <Route path="/"        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                <Route path="/login"   element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                <Route path="/signup"  element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

                {/* ── Exam (no shell — fullscreen) ────────────────────────── */}
                <Route path="/exam/:id"        element={<ExamPage />} />
                <Route path="/exam-finished"   element={<ExamFinishedPage />} />
                
                {/* ── Room (no shell — fullscreen) ────────────────────────── */}
                <Route path="/room/:roomId"    element={<RoomPage />} />
                <Route path="/room-finished"   element={<RoomFinishedPage />} />

                {/* ── Authenticated (with Sidebar) ────────────────────────── */}
                <Route path="/dashboard"       element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/my-applications" element={<PrivateRoute><MyApplicationsPage /></PrivateRoute>} />
                <Route path="/apply/:driveId"  element={<PrivateRoute><ApplyDrivePage /></PrivateRoute>} />
                <Route path="/interviews"      element={<PrivateRoute><InterviewsPage /></PrivateRoute>} />

                {/* Legacy exam */}
                <Route path="/exam/create"      element={<PrivateRoute><CreateExamPage /></PrivateRoute>} />
                <Route path="/exam/edit/:id"    element={<PrivateRoute><EditExamPage /></PrivateRoute>} />
                <Route path="/exam/results/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />

                {/* ── Examiner Only ────────────────────────────────────────── */}
                <Route path="/room/create"   element={<ExaminerRoute><CreateRoomPage /></ExaminerRoute>} />
                <Route path="/my-drives"     element={<ExaminerRoute><MyDrivesPage /></ExaminerRoute>} />
                <Route path="/drive/create"  element={<ExaminerRoute><CreateDrivePage /></ExaminerRoute>} />

                {/* Backward compat redirects */}
                <Route path="/home"       element={<Navigate to="/dashboard" replace />} />
                <Route path="/drives-old" element={<Navigate to="/drives" replace />} />
                <Route path="/selection"  element={<Navigate to="/my-drives" replace />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes