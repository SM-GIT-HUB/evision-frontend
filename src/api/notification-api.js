import api from "./axios"

export async function getNotifications(page = 1, limit = 20) {
    const response = await api.get(`/notification?page=${page}&limit=${limit}`)
    return response.data
}

export async function getUnreadCount() {
    const response = await api.get("/notification/unread-count")
    return response.data
}

export async function markNotificationRead(id) {
    const response = await api.patch(`/notification/${id}/read`)
    return response.data
}

export async function markAllNotificationsRead() {
    const response = await api.patch("/notification/read-all")
    return response.data
}
