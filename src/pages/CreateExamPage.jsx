import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate, Navigate } from "react-router-dom"
import { ArrowLeft, BookOpen, Clock, Target, Users, Loader2 } from "lucide-react"

import { createExam } from "../api/exam-api"
import useAuthStore from "../store/auth-store"

function CreateExamPage()
{
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        startTime: "",
        endTime: "",
        eligibleCandidates: "",
        duration: "",
        passingMarks: "",
        status: "active"
    })

    if (!isAuthenticated || user?.role !== "examiner") {
        return <Navigate to="/" replace />;
    }

    function handleChange(e) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function validateEmails(emails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emails.every(email => emailRegex.test(email));
    }

    async function handleCreateExam(e)
    {
        e.preventDefault();

        const { title, startTime, endTime, eligibleCandidates } = formData;

        if (!title || !startTime || !endTime || !eligibleCandidates) {
            return toast.error("Please fill all required fields");
        }

        if (new Date(startTime) < new Date()) {
            return toast.error("Start time must be in the future");
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return toast.error("End time must be after start time");
        }

        const emails = eligibleCandidates.split(/[\s,]+/).map(e => e.trim()).filter(Boolean);

        if (emails.length === 0) {
            return toast.error("Enter at least one candidate email");
        }

        if (!validateEmails(emails)) {
            return toast.error("One or more email addresses are invalid");
        }

        setLoading(true);
        try {
            await createExam({
                title: formData.title,
                startTime: formData.startTime,
                endTime: formData.endTime,
                eligibleCandidates: formData.eligibleCandidates,
                duration: formData.duration ? Number(formData.duration) : 0,
                passingMarks: formData.passingMarks ? Number(formData.passingMarks) : 0,
                status: formData.status
            });

            toast.success("Exam created! Invite emails sent to candidates.");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed to create exam");
        }
        finally {
            setLoading(false);
        }
    }

    const nowIso = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-2xl mx-auto">

                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-8">

                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
                        <BookOpen size={26} className="text-white" />
                        Create Exam
                    </h1>
                    <p className="text-zinc-500 text-sm mb-8">
                        Invite emails, set schedule, and configure scoring rules.
                    </p>

                    <form onSubmit={handleCreateExam} className="space-y-6">

                        {/* Exam Title */}
                        <Field label="Exam Name *" htmlFor="exam-title">
                            <input
                                id="exam-title"
                                name="title"
                                type="text"
                                placeholder="e.g. Frontend Developer Assessment"
                                className={inputCls}
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        {/* Schedule */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Start Time *" htmlFor="start-time">
                                <input
                                    id="start-time"
                                    name="startTime"
                                    type="datetime-local"
                                    min={nowIso}
                                    className={inputCls}
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                            <Field label="End Time *" htmlFor="end-time">
                                <input
                                    id="end-time"
                                    name="endTime"
                                    type="datetime-local"
                                    min={formData.startTime || nowIso}
                                    className={inputCls}
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                        </div>

                        {/* Duration + Passing Marks */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={<span className="flex items-center gap-1"><Clock size={12} /> Duration (minutes)</span>} htmlFor="duration">
                                <input
                                    id="duration"
                                    name="duration"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 60 (0 = no limit)"
                                    className={inputCls}
                                    value={formData.duration}
                                    onChange={handleChange}
                                />
                            </Field>
                            <Field label={<span className="flex items-center gap-1"><Target size={12} /> Passing Marks</span>} htmlFor="passing-marks">
                                <input
                                    id="passing-marks"
                                    name="passingMarks"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 40"
                                    className={inputCls}
                                    value={formData.passingMarks}
                                    onChange={handleChange}
                                />
                            </Field>
                        </div>

                        {/* Status */}
                        <Field label="Exam Status" htmlFor="exam-status">
                            <select
                                id="exam-status"
                                name="status"
                                className={inputCls + " cursor-pointer"}
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">Active — visible to candidates</option>
                                <option value="draft">Draft — hidden from candidates</option>
                            </select>
                        </Field>

                        {/* Candidates */}
                        <Field
                            label={<span className="flex items-center gap-1"><Users size={12} /> Eligible Candidates *</span>}
                            htmlFor="candidates"
                        >
                            <textarea
                                id="candidates"
                                name="eligibleCandidates"
                                rows={4}
                                placeholder={"alice@example.com, bob@example.com\n(comma or newline separated)"}
                                className={inputCls + " resize-none"}
                                value={formData.eligibleCandidates}
                                onChange={handleChange}
                                required
                            />
                            <p className="text-xs text-zinc-600 mt-1.5">
                                Each candidate will receive an email invite automatically.
                            </p>
                        </Field>

                        <button
                            id="create-exam-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Creating Exam...</>
                            ) : (
                                <><BookOpen size={18} /> Create Exam</>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    )
}

const inputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition text-white"

function Field({ label, htmlFor, children })
{
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                {label}
            </label>
            {children}
        </div>
    )
}

export default CreateExamPage