import { useState } from "react"
import toast from "react-hot-toast"
import { Navigate, useNavigate } from "react-router-dom"
import useAuthStore from "../store/auth-store"
import { signupManual, verifySignup } from "../api/auth-api"

function SignupPage()
{
    const navigate = useNavigate();
    const { setUser, isAuthenticated } = useAuthStore();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        otp: ""
    })
    
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function sendOtp()
    {
        try {
            setLoading(true);

            await signupManual({
                email: formData.email
            })

            toast.success("OTP sent successfully");
            setStep(2);
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        }
        finally {
            setLoading(false);
        }
    }

    async function handleSignup()
    {
        try {
            setLoading(true);

            const response = await verifySignup(formData);
            setUser(response.data);

            toast.success("Signup successful");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Signup failed");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 bg-zinc-950">

                <h1 className="text-3xl font-bold text-center">
                    Signup
                </h1>

                {/* STEP 1 */}
                {
                    step === 1 &&
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

                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition"
                            onClick={sendOtp}
                            disabled={loading}
                        >
                            {
                                loading ? "Sending..." : "Send OTP"
                            }
                        </button>

                        <p className="text-center text-zinc-400 mt-6">
                            Already have an account?{" "}
                            <a href="/login" className="text-white hover:underline">
                                Login
                            </a>
                        </p>
                    </div>
                }

                {/* STEP 2 */}
                {
                    step === 2 &&
                    <div className="mt-8 space-y-4">

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

                        <input
                            type="text"
                            placeholder="OTP"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                            value={formData.otp}
                            onChange={(e) => setFormData({
                                ...formData,
                                otp: e.target.value
                            })}
                        />

                        <button
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition"
                            onClick={handleSignup}
                            disabled={loading}
                        >
                            {
                                loading ? "Creating..." : "Create Account"
                            }
                        </button>
                    </div>
                }

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

export default SignupPage