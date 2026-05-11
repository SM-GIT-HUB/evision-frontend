import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { Video, ArrowLeft, Loader2, Calendar, Link as LinkIcon, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createRoom } from "../api/room-api"
import { getExamDetails } from "../api/exam-api"

function CreateRoomPage()
{
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        participantEmail: "",
        startTime: "",
        endTime: "",
        examId: ""
    })

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
        <div className="fade-in" style={{ padding: "32px 36px", maxWidth: 650 }}>
            
            <button
                onClick={() => navigate("/interviews")}
                className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition font-medium"
            >
                <ArrowLeft size={16} />
                Back to Interviews
            </button>

            <div className="border border-white/5 rounded-3xl p-8 bg-black/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                        <Video size={20} className="text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Schedule Interview
                    </h1>
                </div>
                
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed relative z-10">
                    Create a secure, real-time interview room. An automated invitation email will be sent directly to the candidate.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                        <Field label="Interview Name *" htmlFor="room-name" icon={<Video size={14} className="text-zinc-500" />}>
                            <input
                                id="room-name"
                                name="name"
                                type="text"
                                placeholder="e.g. Frontend Developer Round 1"
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-zinc-200 placeholder:text-zinc-700 font-medium"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Candidate Email *" htmlFor="participant-email" icon={<User size={14} className="text-zinc-500" />}>
                            <input
                                id="participant-email"
                                name="participantEmail"
                                type="email"
                                placeholder="candidate@example.com"
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-zinc-200 placeholder:text-zinc-700 font-medium"
                                value={formData.participantEmail}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-5">
                            <Field label="Start Time *" htmlFor="start-time" icon={<Calendar size={14} className="text-zinc-500" />}>
                                <input
                                    id="start-time"
                                    name="startTime"
                                    type="datetime-local"
                                    min={nowIso}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-zinc-200 font-medium"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>

                            <Field label="End Time *" htmlFor="end-time" icon={<Calendar size={14} className="text-zinc-500" />}>
                                <input
                                    id="end-time"
                                    name="endTime"
                                    type="datetime-local"
                                    min={formData.startTime || nowIso}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition text-zinc-200 font-medium"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                        </div>

                        <Field label="Link to Exam (optional)" htmlFor="exam-link" icon={<LinkIcon size={14} className="text-zinc-500" />}>
                            <select
                                id="exam-link"
                                name="examId"
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition cursor-pointer text-zinc-200 font-medium appearance-none"
                                value={formData.examId}
                                onChange={handleChange}
                            >
                                <option value="" className="text-zinc-500">— No linked exam —</option>
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
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating Room...
                                </>
                            ) : (
                                <>
                                    <Video size={18} />
                                    Finalize & Create Room
                                </>
                            )}
                        </button>
                    </form>
                </div>
        </div>
    )
}

function Field({ label, htmlFor, children, icon })
{
    return (
        <div className="space-y-2 relative">
            <label htmlFor={htmlFor} className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                {icon}
                {label}
            </label>
            {children}
        </div>
    )
}

export default CreateRoomPage
