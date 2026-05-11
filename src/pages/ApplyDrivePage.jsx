import { useState, useEffect } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import { ArrowLeft, ArrowRight, User, GraduationCap, Briefcase, CheckCircle2, Loader2, Upload } from "lucide-react"
import useAuthStore from "../store/auth-store"
import { getDriveById } from "../api/drive-api"
import { applyToDrive } from "../api/application-api"

const STEPS = [
    { id: 1, label: "Personal Info", icon: User },
    { id: 2, label: "Education",     icon: GraduationCap },
    { id: 3, label: "Skills",        icon: Briefcase },
    { id: 4, label: "Review",        icon: CheckCircle2 },
]

const SKILL_SUGGESTIONS = ["JavaScript", "Python", "Java", "C++", "React", "Node.js", "SQL", "DSA", "Machine Learning", "Communication", "Problem Solving"]

export default function ApplyDrivePage() {
    const { driveId } = useParams()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuthStore()

    const [drive, setDrive] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [step, setStep] = useState(1)
    const [skillInput, setSkillInput] = useState("")

    const [form, setForm] = useState({
        fullName: user?.name || "",
        phone: "",
        college: "",
        branch: "",
        cgpa: "",
        passingYear: new Date().getFullYear(),
        skills: [],
        resumeUrl: ""
    })

    useEffect(() => {
        async function fetch() {
            try {
                const res = await getDriveById(driveId)
                setDrive(res.data)
                if (res.data.myApplication) {
                    toast("You have already applied to this drive!")
                    navigate("/my-applications")
                }
            } catch {
                toast.error("Drive not found")
                navigate("/drives")
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [driveId])

    if (!isAuthenticated) return <Navigate to="/" replace />
    if (user?.role !== "student") return <Navigate to="/" replace />

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    function addSkill(skill) {
        const s = skill.trim()
        if (s && !form.skills.includes(s)) {
            setForm(prev => ({ ...prev, skills: [...prev.skills, s] }))
        }
        setSkillInput("")
    }

    function removeSkill(skill) {
        setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
    }

    function validateStep() {
        if (step === 1) {
            if (!form.fullName || !form.phone) return toast.error("Full name and phone are required")
        }
        if (step === 2) {
            if (!form.college || !form.branch || !form.cgpa || !form.passingYear)
                return toast.error("All education fields are required")
            if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10)
                return toast.error("CGPA must be between 0 and 10")
        }
        return true
    }

    function nextStep() {
        if (validateStep() === true) setStep(s => s + 1)
    }

    async function handleSubmit() {
        setSubmitting(true)
        try {
            const res = await applyToDrive(driveId, {
                ...form,
                cgpa: Number(form.cgpa),
                passingYear: Number(form.passingYear)
            })
            toast.success(res.message || "Application submitted!")
            navigate("/my-applications")
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit application")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="text-violet-400 animate-spin" size={40} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-2xl mx-auto">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition">
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Drive Title */}
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-1">{drive?.company}</p>
                    <h1 className="text-3xl font-bold">{drive?.title}</h1>
                    <p className="text-zinc-500 text-sm mt-1">Application Form</p>
                </div>

                {/* Step Progress */}
                <div className="flex items-center gap-2 mb-10">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon
                        const active = step === s.id
                        const done = step > s.id
                        return (
                            <div key={s.id} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                    active ? "bg-violet-600 text-white" :
                                    done ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" :
                                    "bg-zinc-900 text-zinc-500 border border-zinc-800"
                                }`}>
                                    {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                                    <span className="hidden sm:block">{s.label}</span>
                                    <span className="sm:hidden">{s.id}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`h-px flex-1 ${done ? "bg-emerald-600/40" : "bg-zinc-800"}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Form Card */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">

                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                            <Field label="Full Name *">
                                <input name="fullName" value={form.fullName} onChange={handleChange}
                                    placeholder="John Doe" className={inputCls} />
                            </Field>
                            <Field label="Phone Number *">
                                <input name="phone" value={form.phone} onChange={handleChange}
                                    placeholder="+91 9876543210" className={inputCls} />
                            </Field>
                        </div>
                    )}

                    {/* Step 2: Education */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-semibold mb-6">Education Details</h2>
                            <Field label="College / University *">
                                <input name="college" value={form.college} onChange={handleChange}
                                    placeholder="IIT Delhi" className={inputCls} />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Branch *">
                                    <input name="branch" value={form.branch} onChange={handleChange}
                                        placeholder="Computer Science" className={inputCls} />
                                </Field>
                                <Field label="Passing Year *">
                                    <input name="passingYear" type="number" value={form.passingYear} onChange={handleChange}
                                        placeholder="2025" className={inputCls} />
                                </Field>
                            </div>
                            <Field label="CGPA *">
                                <input name="cgpa" type="number" step="0.01" min="0" max="10"
                                    value={form.cgpa} onChange={handleChange}
                                    placeholder="8.5 (out of 10)" className={inputCls} />
                            </Field>

                            {/* Show eligibility warning */}
                            {drive?.eligibility?.minCGPA > 0 && (
                                <div className={`px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
                                    Number(form.cgpa) >= drive.eligibility.minCGPA
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                }`}>
                                    {Number(form.cgpa) >= drive.eligibility.minCGPA ? "✅" : "⚠️"}
                                    Min CGPA required: {drive.eligibility.minCGPA}
                                    {Number(form.cgpa) < drive.eligibility.minCGPA && " — Your application may be screened out"}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Skills + Resume */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-semibold mb-6">Skills & Resume</h2>

                            <Field label="Add Skills">
                                <div className="flex gap-2">
                                    <input
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                                        placeholder="Type a skill and press Enter"
                                        className={inputCls + " flex-1"}
                                    />
                                    <button onClick={() => addSkill(skillInput)}
                                        className="px-4 bg-violet-600 rounded-xl text-sm font-medium hover:bg-violet-500 transition">
                                        Add
                                    </button>
                                </div>
                                {/* Suggestions */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map(s => (
                                        <button key={s} onClick={() => addSkill(s)}
                                            className="px-3 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 transition">
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                                {/* Added skills */}
                                {form.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {form.skills.map(s => (
                                            <span key={s} className="px-3 py-1 text-xs bg-violet-600/20 text-violet-300 border border-violet-600/30 rounded-full flex items-center gap-1">
                                                {s}
                                                <button onClick={() => removeSkill(s)} className="ml-1 hover:text-white">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Field>

                            <Field label="Resume Link (Google Drive / GitHub)">
                                <div className="flex items-center gap-2">
                                    <Upload size={14} className="text-zinc-500 flex-shrink-0" />
                                    <input name="resumeUrl" value={form.resumeUrl} onChange={handleChange}
                                        placeholder="https://drive.google.com/..." className={inputCls} />
                                </div>
                            </Field>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-6">Review Your Application</h2>

                            <ReviewRow label="Full Name" value={form.fullName} />
                            <ReviewRow label="Phone" value={form.phone} />
                            <ReviewRow label="College" value={form.college} />
                            <ReviewRow label="Branch" value={form.branch} />
                            <ReviewRow label="CGPA" value={`${form.cgpa} / 10`} />
                            <ReviewRow label="Passing Year" value={form.passingYear} />
                            <ReviewRow label="Skills" value={form.skills.join(", ") || "None added"} />
                            {form.resumeUrl && <ReviewRow label="Resume" value={form.resumeUrl} />}

                            <div className="mt-6 border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 text-sm text-zinc-400">
                                By submitting, your application will be automatically screened against the eligibility criteria.
                                You will receive a confirmation email at <strong className="text-white">{user?.email}</strong>.
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex-1 border border-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-900 transition flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Back
                            </button>
                        )}

                        {step < 4 ? (
                            <button onClick={nextStep}
                                className="flex-1 bg-violet-600 py-3 rounded-xl font-medium hover:bg-violet-500 transition flex items-center justify-center gap-2">
                                Continue <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-60">
                                {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={18} /> Submit Application</>}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-medium">{label}</label>
            {children}
        </div>
    )
}

function ReviewRow({ label, value }) {
    return (
        <div className="flex justify-between items-start py-3 border-b border-zinc-800 last:border-0">
            <span className="text-zinc-500 text-sm">{label}</span>
            <span className="text-white text-sm font-medium text-right max-w-[60%] break-all">{value}</span>
        </div>
    )
}

const inputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition text-white"
