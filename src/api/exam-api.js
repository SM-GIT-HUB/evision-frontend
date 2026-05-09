import api from "./axios"

export async function getExamDetails()
{
    const response = await api.get("/exam/details");
    return response.data;
}

export async function createExam(data)
{
    const response = await api.post("/exam/create", data);
    return response.data;
}

export async function getResults(examId)
{
    const response = await api.get(`/exam/results/${examId}`);
    return response.data;
}

export async function editExam(examId, data)
{
    const response = await api.patch(`/exam/edit/${examId}`, data);
    return response.data;
}

export async function getExam(examId)
{
    const response = await api.get(`/exam/${examId}`);
    return response.data;
}

export async function submitExam(data)
{
    const response = await api.post(
        "/exam/submit",
        data
    )

    return response.data;
}

export async function saveAnswers(examId, data)
{
    const response = await api.post(
        `/exam/save-answers/${examId}`,
        data
    )

    return response.data;
}