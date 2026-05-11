import { useState } from "react"
import toast from "react-hot-toast"

import { loginManual } from "../api/auth-api"

import useAuthStore from "../store/auth-store"

import {
    Link,
    Navigate,
    useNavigate
} from "react-router-dom"

function LoginPage()
{
    const navigate = useNavigate();

    const {
        setUser,
        isAuthenticated
    } = useAuthStore();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    async function handleLogin()
    {
        try {

            if (
                !formData.email ||
                !formData.password
            ) {
                return toast.error("All fields required");
            }

            setLoading(true);

            const response =
                await loginManual(formData);

            setUser(response.data);

            toast.success("Login successful");

            navigate("/");
        }
        catch(err) {

            toast.error(
                err.response?.data?.message ||
                "Login failed"
            )
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="
            min-h-screen
            bg-black
            text-white
            flex items-center justify-center
            px-4 py-4
        ">

            <div className="
                w-full max-w-xl
                border border-zinc-800
                rounded-[28px]
                p-6
                bg-black
            ">

                <div className="text-center">

                    <h1 className="text-4xl font-bold">
                        Login
                    </h1>

                    <p className="text-zinc-500 text-base mt-2">
                        Welcome back to EVision
                    </p>

                </div>

                <div className="mt-6 space-y-3">

                    <input
                        type="email"
                        placeholder="Email address"
                        className="
                            w-full
                            bg-zinc-900
                            border border-zinc-800
                            rounded-xl
                            px-4 py-3
                            outline-none
                            text-base
                        "
                        value={formData.email}
                        onChange={(e) => setFormData({
                            ...formData,
                            email: e.target.value
                        })}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="
                            w-full
                            bg-zinc-900
                            border border-zinc-800
                            rounded-xl
                            px-4 py-3
                            outline-none
                            text-base
                        "
                        value={formData.password}
                        onChange={(e) => setFormData({
                            ...formData,
                            password: e.target.value
                        })}
                    />

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="
                            w-full
                            bg-white text-black
                            py-3
                            rounded-xl
                            text-lg
                            font-semibold
                            hover:bg-zinc-200
                            transition
                        "
                    >
                        {
                            loading
                            ? "Logging in..."
                            : "Login"
                        }
                    </button>

                    <p className="text-center text-zinc-500 mt-4 text-base">
                        Don't have an account?{" "}

                        <Link
                            to="/signup"
                            className="text-white"
                        >
                            Signup
                        </Link>
                    </p>

                    <div className="flex items-center gap-3 my-4">

                        <div className="flex-1 h-px bg-zinc-800" />

                        <span className="text-zinc-500 text-sm">
                            or
                        </span>

                        <div className="flex-1 h-px bg-zinc-800" />

                    </div>

                    <button
                        onClick={() => {
                            window.location.href =
                            `${import.meta.env.VITE_API_URL}/auth/oauth/google`
                        }}
                        className="
                            w-full
                            border border-zinc-800
                            py-3
                            rounded-xl
                            hover:bg-zinc-900
                            transition
                            text-base
                        "
                    >
                        Continue with Google
                    </button>

                    <button
                        onClick={() => {
                            window.location.href =
                            `${import.meta.env.VITE_API_URL}/auth/oauth/github`
                        }}
                        className="
                            w-full
                            border border-zinc-800
                            py-3
                            rounded-xl
                            hover:bg-zinc-900
                            transition
                            text-base
                        "
                    >
                        Continue with GitHub
                    </button>

                </div>

            </div>

        </div>
    )
}

export default LoginPage