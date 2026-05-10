import api from "./axios"

export async function applyToDrive(driveId, data) {
    const response = await api.post(`/application/apply/${driveId}`, data)
    return response.data
}

export async function getMyApplications() {
    const response = await api.get("/application/my-applications")
    return response.data
}

export async function getMyApplicationForDrive(driveId) {
    const response = await api.get(`/application/my-application/${driveId}`)
    return response.data
}

export async function overrideApplication(id, action, reason = "") {
    const response = await api.patch(`/application/${id}/override`, { action, reason })
    return response.data
}

export async function updateApplicationInterviewScore(id, interviewScore) {
    const response = await api.patch(`/application/${id}/interview-score`, { interviewScore })
    return response.data
}

export async function inviteCandidates(driveId, emails) {
    const response = await api.post(`/application/invite/${driveId}`, { emails })
    return response.data
}
