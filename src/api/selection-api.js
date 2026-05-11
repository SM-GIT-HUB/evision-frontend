import api from "./axios"

export async function getSelectionBoard(examId) {
    const response = await api.get(`/selection/${examId}`);
    return response.data;
}

export async function updateCandidateStatus(selectionId, { status, examinerNotes }) {
    const response = await api.patch(`/selection/${selectionId}/status`, {
        status,
        examinerNotes
    });
    return response.data;
}

export async function getMySelectionStatus(examId) {
    const response = await api.get(`/selection/my-status?examId=${examId}`);
    return response.data;
}
