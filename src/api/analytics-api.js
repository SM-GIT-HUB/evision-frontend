import api from "./axios"

export async function getAnalytics(range = "6months") {
    const response = await api.get(`/analytics/me?range=${range}`)
    return response.data
}

export async function getDashboardData() {
    const response = await api.get("/analytics/dashboard")
    return response.data
}

export async function getGlobalLeaderboard() {
    const response = await api.get("/analytics/leaderboard")
    return response.data
}
