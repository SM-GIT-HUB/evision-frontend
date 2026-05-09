import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate, Navigate } from "react-router-dom"

import { createExam } from "../api/exam-api"
import useAuthStore from "../store/auth-store"

function CreateExamPage()
{
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        startTime: "",
        endTime: "",
        eligibleCandidates: ""
    })

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    function validateEmails(emails)
    {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emails.every(email => emailRegex.test(email));
    }

    async function handleCreateExam()
    {
        try {
            const { title, startTime, endTime, eligibleCandidates } = formData;

            if (!title || !startTime || !endTime || !eligibleCandidates) {
                return toast.error("All fields are required");
            }

            if (new Date(startTime) >= new Date(endTime)) {
                return toast.error("Start time must be before end time");
            }

            if (new Date(startTime) < new Date()) {
                return toast.error("Start time must be a future date");
            }

            const emails = eligibleCandidates
                .split(/[\s,]+/)
                .map(email => email.trim())
                .filter(Boolean);

            if (emails.length === 0) {
                return toast.error("Please provide valid candidate emails");
            }

            if (!validateEmails(emails)) {
                return toast.error("Invalid email format detected");
            }

            setLoading(true);

            await createExam({
                title,
                startTime,
                endTime,
                eligibleCandidates
            })

            toast.success("Exam created successfully");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed to create exam");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">

            <div className="max-w-2xl mx-auto">

                <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-8">

                    <h1 className="text-4xl font-bold">
                        Create Exam
                    </h1>

                    <p className="text-zinc-400 mt-3">
                        Fill all mandatory details to create a new exam.
                    </p>

                    <div className="mt-8 space-y-5">

                        <div>
                            <label className="block mb-2 text-sm text-zinc-400">
                                Exam Name
                            </label>

                            <input
                                type="text"
                                placeholder="Enter exam name"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    title: e.target.value
                                })}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm text-zinc-400">
                                Start Time
                            </label>

                            <input
                                type="datetime-local"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                value={formData.startTime}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    startTime: e.target.value
                                })}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm text-zinc-400">
                                End Time
                            </label>

                            <input
                                type="datetime-local"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                value={formData.endTime}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    endTime: e.target.value
                                })}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm text-zinc-400">
                                Eligible Candidates
                            </label>

                            <textarea
                                rows={5}
                                placeholder="a@gmail.com, b@gmail.com"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
                                value={formData.eligibleCandidates}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    eligibleCandidates: e.target.value
                                })}
                            />

                            <p className="text-sm text-zinc-500 mt-2">
                                Enter emails separated by commas.
                            </p>
                        </div>

                        <button
                            onClick={handleCreateExam}
                            disabled={loading}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition"
                        >
                            {
                                loading ? "Creating..." : "Create Exam"
                            }
                        </button>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default CreateExamPage