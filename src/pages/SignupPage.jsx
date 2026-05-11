import { useState } from "react"
import toast from "react-hot-toast"
import { Link, Navigate, useNavigate } from "react-router-dom"

import {
    GraduationCap,
    ShieldCheck
} from "lucide-react"

import {
    signupManual,
    verifySignup
} from "../api/auth-api"

import useAuthStore from "../store/auth-store"

function SignupPage()
{
    const navigate = useNavigate();

    const { isAuthenticated } = useAuthStore();

    const [role, setRole] = useState("student");

    const [step, setStep] = useState("email");

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        password: "",
        name: ""
    });

    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    async function handleSendOtp()
    {
        try {

            if (!formData.email) {
                return toast.error("Email required");
            }

            setLoading(true);

            await signupManual({
                email: formData.email,
                role
            });

            toast.success("OTP sent");

            setStep("verify");
        }
        catch(err) {

            toast.error(
                err.response?.data?.message ||
                "Failed to send OTP"
            )
        }
        finally {
            setLoading(false);
        }
    }

    async function handleVerify()
    {
        try {

            if (
                !formData.otp ||
                !formData.password ||
                !formData.name
            ) {
                return toast.error("All fields required");
            }

            setLoading(true);

            await verifySignup({
                email: formData.email,
                otp: formData.otp,
                password: formData.password,
                name: formData.name,
                role
            });

            toast.success("Account created");

            navigate("/login");
        }
        catch(err) {

            toast.error(
                err.response?.data?.message ||
                "Verification failed"
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
                        Create Account
                    </h1>

                    <p className="text-zinc-500 text-base mt-2">
                        Join EVision as a student or examiner
                    </p>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">

                    <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`
                            rounded-2xl border p-4 transition
                            flex flex-col items-center justify-center gap-2
                            min-h-25
                            ${
                                role === "student"
                                ? "border-white bg-zinc-800"
                                : "border-zinc-800 bg-zinc-900"
                            }
                        `}
                    >
                        <GraduationCap size={24} />

                        <span className="text-lg font-medium">
                            Student
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole("examiner")}
                        className={`
                            rounded-2xl border p-4 transition
                            flex flex-col items-center justify-center gap-2
                            min-h-25
                            ${
                                role === "examiner"
                                ? "border-white bg-zinc-800"
                                : "border-zinc-800 bg-zinc-900"
                            }
                        `}
                    >
                        <ShieldCheck size={24} />

                        <span className="text-lg font-medium">
                            Examiner
                        </span>
                    </button>

                </div>

                <div className="mt-5 space-y-3">

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

                    {
                        step === "verify" &&
                        <>
                            <input
                                type="text"
                                placeholder="OTP"
                                className="
                                    w-full
                                    bg-zinc-900
                                    border border-zinc-800
                                    rounded-xl
                                    px-4 py-3
                                    outline-none
                                    text-base
                                "
                                value={formData.otp}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    otp: e.target.value
                                })}
                            />

                            <input
                                type="text"
                                placeholder="Full Name"
                                className="
                                    w-full
                                    bg-zinc-900
                                    border border-zinc-800
                                    rounded-xl
                                    px-4 py-3
                                    outline-none
                                    text-base
                                "
                                value={formData.name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    name: e.target.value
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
                        </>
                    }

                    {
                        step === "email"
                        ?
                        <button
                            onClick={handleSendOtp}
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
                                ? "Sending..."
                                : "Send OTP →"
                            }
                        </button>
                        :
                        <button
                            onClick={handleVerify}
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
                                ? "Creating..."
                                : "Create Account"
                            }
                        </button>
                    }

                    <p className="text-center text-zinc-500 mt-4 text-base">
                        Already have an account?{" "}

                        <Link
                            to="/login"
                            className="text-white"
                        >
                            Login
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
                            `${import.meta.env.VITE_API_URL}/auth/oauth/google?role=${role}`
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
                            `${import.meta.env.VITE_API_URL}/auth/oauth/github?role=${role}`
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

export default SignupPage