import { useState } from "react"
import toast from "react-hot-toast"
import { AlertTriangle, Clock, Target, CheckCircle2, XCircle, Hourglass } from "lucide-react"
import { useNavigate } from "react-router-dom"

const STATUS_META = {
    draft:  { label: "Draft",  cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    active: { label: "Active", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    closed: { label: "Closed", cls: "bg-red-500/20 text-red-400 border-red-500/30" }
}

const SELECTION_META = {
    pending:     { label: "Pending",     icon: Hourglass,      cls: "text-zinc-400" },
    shortlisted: { label: "Shortlisted", icon: CheckCircle2,   cls: "text-yellow-400" },
    selected:    { label: "Selected ✓",  icon: CheckCircle2,   cls: "text-green-400" },
    rejected:    { label: "Rejected",    icon: XCircle,        cls: "text-red-400" }
}

function ExamCard({ exam, type, role })
{
    const navigate = useNavigate();
    const [showRules, setShowRules] = useState(false);

    const statusMeta = STATUS_META[exam.status] || STATUS_META.active;
    const selMeta    = exam.selectionStatus ? SELECTION_META[exam.selectionStatus] : null;

    async function handleStartExam()
    {
        const now       = Date.now();
        const startTime = new Date(exam.startTime).getTime();

        if (now < startTime) {
            return toast.error("Exam has not started yet", { id: "t" });
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            stream.getTracks().forEach(track => track.stop());

            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }

            navigate(`/exam/${exam._id}`);
        }
        catch {
            toast.error("Camera and fullscreen permissions are required");
        }
    }

    return (
        <>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition flex flex-col gap-4">

                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold leading-tight">{exam.title}</h2>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusMeta.cls}`}>
                        {statusMeta.label}
                    </span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                    {exam.duration > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {exam.duration} min
                        </span>
                    )}
                    {exam.passingMarks > 0 && (
                        <span className="flex items-center gap-1">
                            <Target size={11} />
                            Pass: {exam.passingMarks}/{exam.fullMarks}
                        </span>
                    )}
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs text-zinc-500">
                    <p>Start: <span className="text-zinc-400">{new Date(exam.startTime).toLocaleString()}</span></p>
                    <p>End: <span className="text-zinc-400">{new Date(exam.endTime).toLocaleString()}</span></p>
                </div>

                {/* Student past — score + selection status */}
                {role === "student" && type === "past" && (
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-xs text-zinc-500 mb-0.5">Your Score</p>
                            <p className="text-lg font-bold">
                                {exam.score ?? "—"}
                                <span className="text-zinc-500 font-normal text-sm"> / {exam.fullMarks}</span>
                            </p>
                        </div>

                        {selMeta && (
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${selMeta.cls}`}>
                                <selMeta.icon size={15} />
                                {selMeta.label}
                            </div>
                        )}
                    </div>
                )}

                {/* CTA buttons */}
                <div className="mt-auto">
                    {role === "student" && type === "upcoming" && (
                        <button
                            onClick={() => setShowRules(true)}
                            className="w-full bg-white text-black py-2.5 rounded-xl font-semibold hover:bg-zinc-200 transition text-sm"
                        >
                            Start Exam
                        </button>
                    )}

                    {role === "examiner" && type === "upcoming" && (
                        <button
                            onClick={() => {
                                if (Date.now() >= new Date(exam.endTime).getTime()) {
                                    return toast.error("Cannot edit completed exam");
                                }
                                navigate(`/exam/edit/${exam._id}`);
                            }}
                            className="w-full border border-zinc-700 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-900 hover:border-zinc-600 transition"
                        >
                            Edit Exam
                        </button>
                    )}

                    {role === "examiner" && type === "past" && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/exam/results/${exam._id}`)}
                                className="flex-1 bg-white text-black py-2.5 rounded-xl font-semibold hover:bg-zinc-200 transition text-sm"
                            >
                                See Results
                            </button>
                            <button
                                onClick={() => navigate(`/?tab=selection&examId=${exam._id}`)}
                                className="flex-1 border border-zinc-700 py-2.5 rounded-xl text-sm hover:bg-zinc-900 transition"
                            >
                                Selection Board
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-6">
                    <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-red-500/20 p-3 rounded-2xl">
                                <AlertTriangle className="text-red-400" size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Exam Instructions</h2>
                                <p className="text-zinc-400 text-sm mt-0.5">Read all rules before starting</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-zinc-300 text-sm leading-relaxed">
                            {[
                                "Do not exit fullscreen mode during the examination.",
                                "Do not switch tabs, minimize the browser, or open other applications.",
                                "Sit in a well-lit environment and remain visible during monitoring.",
                                "Refreshing, closing, or leaving the exam may automatically submit your test.",
                                "Once started, the exam cannot be restarted.",
                            ].map((rule, i) => (
                                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                    • {rule}
                                </div>
                            ))}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300">
                                • Frequent violations may result in automatic submission of your exam.
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowRules(false)}
                                className="flex-1 border border-zinc-700 py-3 rounded-2xl hover:bg-zinc-900 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartExam}
                                className="flex-1 bg-white text-black py-3 rounded-2xl font-semibold hover:bg-zinc-200 transition"
                            >
                                I Understand & Start
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ExamCard