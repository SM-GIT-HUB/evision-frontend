import { useState } from "react"
import toast from "react-hot-toast"
import { loginManual } from "../api/auth-api"
import useAuthStore from "../store/auth-store"
import { useNavigate, Navigate } from "react-router-dom"

function LoginPage()
{
    const navigate = useNavigate();
    const { setUser, isAuthenticated } = useAuthStore();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const [loading, setLoading] = useState(false);
    
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleLogin()
    {
        try {
            setLoading(true);

            const response = await loginManual(formData);
            console.log(response);
            setUser(response.data);

            toast.success("Login successful");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Login failed");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            
            <div className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 bg-zinc-950">

                <h1 className="text-3xl font-bold text-center">
                    Login
                </h1>

                <div className="mt-8 space-y-4">

                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({
                            ...formData,
                            email: e.target.value
                        })}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                        value={formData.password}
                        onChange={(e) => setFormData({
                            ...formData,
                            password: e.target.value
                        })}
                    />

                    <button className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition"
                    onClick={handleLogin}
                    disabled={loading}
                    >
                        {
                            loading ? "Logging in..." : "Login"
                        }
                    </button>

                    <p className="text-center text-zinc-400 mt-6">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-white hover:underline">
                            Signup
                        </a>
                    </p>
                </div>

                <div className="mt-6 space-y-3">

                    <button
                        className="w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-900 transition"
                        onClick={() => {
                            window.location.href = "http://localhost:3000/api/v1/auth/oauth/google";
                        }}
                    >
                        Continue with Google
                    </button>

                    <button
                        className="w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-900 transition"
                        onClick={() => {
                            window.location.href = "http://localhost:3000/api/v1/auth/oauth/github";
                        }}
                    >
                        Continue with GitHub
                    </button>
                </div>

            </div>
        </div>
    )
}

export default LoginPage