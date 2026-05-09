import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"
import SignupPage from "../pages/SignupPage"
import LandingPage from "../pages/LandingPage"
import ResultsPage from "../pages/ResultsPage"
import useAuthStore from "../store/auth-store"
import EditExamPage from "../pages/EditExamPage"
import CreateExamPage from "../pages/CreateExamPage"
import ExamPage from "../features/exam/pages/ExamPage"
import ExamFinishedPage from "../pages/ExamFinishedPage"
import { BrowserRouter, Routes, Route } from "react-router-dom"

function AppRoutes()
{
    const { isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={ isAuthenticated ? <HomePage /> : <LandingPage /> } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/exam/create" element={<CreateExamPage/>} />
                <Route path="/exam/results/:id" element={<ResultsPage/>} />
                <Route path="/exam/edit/:id" element={<EditExamPage />} />
                <Route path="/exam/:id" element={<ExamPage />} />
                <Route path="/exam-finished" element={<ExamFinishedPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes