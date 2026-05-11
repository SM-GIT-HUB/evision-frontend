import api from "./axios"

export async function getMyAchievements() {
    const response = await api.get("/achievement/me")
    return response.data
}
