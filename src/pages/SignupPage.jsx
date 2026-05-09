import { useState } from "react"
import toast from "react-hot-toast"
import { Navigate, useNavigate } from "react-router-dom"
import { GraduationCap, ShieldCheck } from "lucide-react"
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
        otp: "",
        role: "student"   // default role
    })

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function sendOtp()
    {
        if (!formData.email) {
            return toast.error("Please enter your email");
        }
        try {
            setLoading(true);
            await signupManual({ email: formData.email, role: formData.role });
            toast.success("OTP sent to your email");
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
            toast.success("Account created successfully!");
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

                <h1 className="text-3xl font-bold text-center mb-2">
                    Create Account
                </h1>
                <p className="text-zinc-400 text-center text-sm mb-8">
                    Join ExamPro as a student or examiner
                </p>

                {/* STEP 1 — Role + Email */}
                {
                    step === 1 &&
                    <div className="space-y-5">

                        {/* Role Selector */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                id="role-student"
                                onClick={() => setFormData({ ...formData, role: "student" })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition
                                    ${formData.role === "student"
                                        ? "border-white bg-white/10 text-white"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                <GraduationCap size={24} />
                                <span className="text-sm font-medium">Student</span>
                            </button>

                            <button
                                id="role-examiner"
                                onClick={() => setFormData({ ...formData, role: "examiner" })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition
                                    ${formData.role === "examiner"
                                        ? "border-white bg-white/10 text-white"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                <ShieldCheck size={24} />
                                <span className="text-sm font-medium">Examiner</span>
                            </button>
                        </div>

                        <input
                            id="signup-email"
                            type="email"
                            placeholder="Email address"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600 transition"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                        />

                        <button
                            id="send-otp-btn"
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
                            onClick={sendOtp}
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP →"}
                        </button>

                        <p className="text-center text-zinc-400">
                            Already have an account?{" "}
                            <a href="/login" className="text-white hover:underline">Login</a>
                        </p>
                    </div>
                }

                {/* STEP 2 — Password + OTP */}
                {
                    step === 2 &&
                    <div className="space-y-4">

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400">
                            OTP sent to <span className="text-white">{formData.email}</span>
                            {" "}
                            <button
                                className="text-zinc-500 hover:text-white text-xs ml-2 underline"
                                onClick={() => setStep(1)}
                            >
                                Change
                            </button>
                        </div>

                        <input
                            id="signup-password"
                            type="password"
                            placeholder="Create password (min 6 chars)"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600 transition"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />

                        <input
                            id="signup-otp"
                            type="text"
                            placeholder="Enter OTP from email"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600 transition"
                            value={formData.otp}
                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                        />

                        <button
                            id="create-account-btn"
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
                            onClick={handleSignup}
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </div>
                }

                {/* OAuth */}
                {step === 1 && (
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 text-zinc-600 text-sm">
                            <div className="flex-1 border-t border-zinc-800" />
                            <span>or</span>
                            <div className="flex-1 border-t border-zinc-800" />
                        </div>

                        <button
                            id="google-signup"
                            className="w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-900 transition text-sm"
                            onClick={() => {
                                window.location.href = "http://localhost:3000/api/v1/auth/oauth/google";
                            }}
                        >
                            Continue with Google
                        </button>

                        <button
                            id="github-signup"
                            className="w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-900 transition text-sm"
                            onClick={() => {
                                window.location.href = "http://localhost:3000/api/v1/auth/oauth/github";
                            }}
                        >
                            Continue with GitHub
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SignupPage