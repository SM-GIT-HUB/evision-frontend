import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { Video, ArrowLeft, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createRoom } from "../api/room-api"
import { getExamDetails } from "../api/exam-api"
import useAuthStore from "../store/auth-store"

function CreateRoomPage()
{
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        participantEmail: "",
        startTime: "",
        endTime: "",
        examId: ""
    })

    // only examiners can access this page
    useEffect(() => {
        if (user?.role !== "examiner") {
            navigate("/");
        }
    }, [user, navigate])

    // load exams to optionally link room to an exam
    useEffect(() => {
        async function loadExams() {
            try {
                const res = await getExamDetails();
                const all = [...(res.data.upcoming || []), ...(res.data.past || [])];
                setExams(all);
            }
            catch {
                // silently fail — linking is optional
            }
        }
        loadExams();
    }, [])

    function handleChange(e)
    {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e)
    {
        e.preventDefault();

        if (!formData.name || !formData.participantEmail || !formData.startTime || !formData.endTime) {
            return toast.error("Please fill in all required fields");
        }

        setLoading(true);

        try {
            await createRoom({
                ...formData,
                examId: formData.examId || undefined
            });
            toast.success("Interview room created! Invite email sent.");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed to create room");
        }
        finally {
            setLoading(false);
        }
    }

    // compute minimum datetime-local value (now)
    const nowIso = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-lg">

                {/* Header */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950">

                    <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
                        <Video size={22} className="text-violet-400" />
                        Schedule Interview
                    </h1>
                    <p className="text-zinc-500 text-sm mb-7">
                        Create a live interview room. The candidate will receive an email invite.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <Field label="Interview Name *" htmlFor="room-name">
                            <input
                                id="room-name"
                                name="name"
                                type="text"
                                placeholder="e.g. Frontend Developer Round 1"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Candidate Email *" htmlFor="participant-email">
                            <input
                                id="participant-email"
                                name="participantEmail"
                                type="email"
                                placeholder="candidate@example.com"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition"
                                value={formData.participantEmail}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Start Time *" htmlFor="start-time">
                                <input
                                    id="start-time"
                                    name="startTime"
                                    type="datetime-local"
                                    min={nowIso}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition"
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
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                        </div>

                        <Field label="Link to Exam (optional)" htmlFor="exam-link">
                            <select
                                id="exam-link"
                                name="examId"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition cursor-pointer"
                                value={formData.examId}
                                onChange={handleChange}
                            >
                                <option value="">— No linked exam —</option>
                                {exams.map(exam => (
                                    <option key={exam._id} value={exam._id}>
                                        {exam.title}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <button
                            id="create-room-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Video size={18} />
                                    Create Interview Room
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function Field({ label, htmlFor, children })
{
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {label}
            </label>
            {children}
        </div>
    )
}

export default CreateRoomPage
