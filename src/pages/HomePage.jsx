import { Navigate } from "react-router-dom"

// Legacy redirect — dashboard is now at /dashboard
export default function HomePage() {
    return <Navigate to="/dashboard" replace />
}