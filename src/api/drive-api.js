import api from "./axios"

// ─── Examiner ─────────────────────────────────────────────────────────────────
export async function createDrive(data) {
    const response = await api.post("/drive/create", data)
    return response.data
}

export async function getMyDrives() {
    const response = await api.get("/drive/my-drives")
    return response.data
}

export async function updateDrive(id, data) {
    const response = await api.patch(`/drive/${id}`, data)
    return response.data
}

export async function addDriveQuestions(id, questions) {
    const response = await api.post(`/drive/${id}/questions`, { questions })
    return response.data
}

export async function publishDrive(id) {
    const response = await api.patch(`/drive/${id}/publish`)
    return response.data
}

export async function scheduleExam(id) {
    const response = await api.patch(`/drive/${id}/schedule-exam`)
    return response.data
}

export async function closeExam(id) {
    const response = await api.patch(`/drive/${id}/close-exam`)
    return response.data
}

export async function finalizeDrive(id) {
    const response = await api.patch(`/drive/${id}/finalize`)
    return response.data
}

export async function getDriveApplications(id, params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await api.get(`/drive/${id}/applications${query ? `?${query}` : ""}`)
    return response.data
}

// ─── Both ─────────────────────────────────────────────────────────────────────
export async function getOpenDrives() {
    const response = await api.get("/drive/open")
    return response.data
}

export async function getDriveById(id) {
    const response = await api.get(`/drive/${id}`)
    return response.data
}

// ─── Assessment ───────────────────────────────────────────────────────────────
export async function getAssessmentQuestions(driveId) {
    const response = await api.get(`/drive/${driveId}/assessment-questions`)
    return response.data
}

export async function runCode(driveId, data) {
    const response = await api.post(`/drive/${driveId}/run-code`, data)
    return response.data
}

export async function submitAssessment(driveId, answers) {
    const response = await api.post(`/drive/${driveId}/submit-assessment`, { answers })
    return response.data
}

export async function terminateCandidate(driveId, candidateId) {
    const response = await api.patch(`/drive/${driveId}/terminate-candidate/${candidateId}`)
    return response.data
}
