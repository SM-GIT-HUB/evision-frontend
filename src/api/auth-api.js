import api from "./axios"

export async function getMe()
{
    const response = await api.get("/auth/me");
    return response.data;
}

export async function loginManual(data)
{
    const response = await api.post("/auth/login/manual", data);
    return response.data;
}

export async function signupManual(data)
{
    const response = await api.post("/auth/signup/manual", data);
    return response.data;
}

export async function verifySignup(data)
{
    const response = await api.post("/auth/signup/manual/verify", data);
    return response.data;
}

export async function logout()
{
    const response =
        await api.post("/auth/logout");

    return response.data;
}