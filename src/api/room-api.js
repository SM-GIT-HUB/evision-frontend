import api from "./axios"

export async function createRoom(data) {
    const response = await api.post("/room/create", data);
    return response.data;
}

export async function getMyRooms(type = "") {
    const response = await api.get(`/room/my-rooms${type ? `?type=${type}` : ""}`);
    return response.data;
}

export async function getRoom(roomId) {
    const response = await api.get(`/room/${roomId}`);
    return response.data;
}

export async function updateRoomNotes(roomId, notes) {
    const response = await api.patch(`/room/${roomId}/notes`, { notes });
    return response.data;
}

export async function updateInterviewScore(roomId, interviewScore) {
    const response = await api.patch(`/room/${roomId}/score`, { interviewScore });
    return response.data;
}
