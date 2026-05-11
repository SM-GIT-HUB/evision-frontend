import { useState } from "react"
import toast from "react-hot-toast"
import { AlertTriangle } from "lucide-react"
import { useNavigate } from "react-router-dom"

function ExamCard({ exam, type, role })
{
    const navigate = useNavigate();

    const [showRules, setShowRules] = useState(false);

    async function handleStartExam()
    {
        const now = Date.now();
        const startTime = new Date(exam.startTime).getTime();

        if (now < startTime) {
            return toast.error("Exam has not started yet", { id: "t" });
        }

        try {

            //
            // STEP 1 -> ask camera permission first
            //
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

            //
            // stop temporary permission stream immediately
            //
            stream.getTracks().forEach(track => track.stop());

            //
            // STEP 2 -> fullscreen
            //
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }

            //
            // STEP 3 -> start exam
            //
            navigate(`/exam/${exam._id}`);
        }
        catch(err) {

            console.log(err);

            toast.error(
                "Camera and fullscreen permissions are required"
            )
        }
    }

    return (
        <>
            <div className="
                bg-[#09090B]
                border border-zinc-800/80
                rounded-[28px]
                p-6
                hover:border-zinc-700
                hover:bg-zinc-950
                transition-all
                duration-300
            ">

                <h2 className="text-2xl font-bold tracking-tight">
                    {exam.title}
                </h2>

                <div className="
                    mt-5
                    space-y-3
                    text-sm
                    text-zinc-500
                ">

                    <div className="flex items-center justify-between">
                        <span>Start</span>

                        <span className="text-zinc-300">
                            {new Date(exam.startTime).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span>End</span>

                        <span className="text-zinc-300">
                            {new Date(exam.endTime).toLocaleString()}
                        </span>
                    </div>
                </div>

                {
                    role === "student" && type === "past" &&
                    <p className="mt-6 text-lg">
                        Score: <span className="font-semibold text-white">
                            {exam.score} / {exam.fullMarks}
                        </span>
                    </p>
                }

                <div className="mt-7">

                    {
                        role === "student" && type === "upcoming" &&
                        <button
                            onClick={() => setShowRules(true)}
                            className="
                                bg-zinc-100 text-black px-5 py-3 rounded-xl
                                font-semibold hover:bg-zinc-300 transition
                            "
                        >
                            Start Exam
                        </button>
                    }

                    {
                        role === "examiner" && type === "upcoming" &&
                        <button
                            onClick={() => {

                                const now = Date.now();

                                const endTime =
                                    new Date(exam.endTime).getTime();

                                if (now >= endTime)
                                {
                                    return toast.error(
                                        "Cannot edit completed exam"
                                    )
                                }

                                navigate(`/exam/edit/${exam._id}`);
                            }}
                            className="bg-zinc-100 text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-300 transition"
                        >
                            Edit Exam
                        </button>
                    }

                    {
                        role === "examiner" && type === "past" &&
                        <button
                            onClick={() => navigate(`/exam/results/${exam._id}`)}
                            className="bg-zinc-100 text-black px-5 py-3 rounded-xl font-semibold hover:bg-zinc-300 transition"
                        >
                            See Results
                        </button>
                    }

                </div>

            </div>

            {
                showRules &&
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-6">

                    <div className="
                        w-full max-w-2xl
                        bg-zinc-950 border border-zinc-800
                        rounded-3xl p-8
                    ">

                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/20 p-3 rounded-2xl">
                                <AlertTriangle className="text-red-400" size={28} />
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold">
                                    Exam Instructions
                                </h2>

                                <p className="text-zinc-400 mt-1">
                                    Please read all rules carefully before starting.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 text-zinc-300 leading-relaxed">

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                • Do not exit fullscreen mode during the examination.
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                • Do not switch tabs, minimize the browser, or open other applications.
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                • Sit in a well-lit environment and remain visible during monitoring.
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                • Refreshing, closing, or leaving the exam may automatically submit your test.
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                • Once the exam is started or closed or submitted, it cannot be started again.
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300">
                                • Frequent violations may result in automatic submission of your exam.
                            </div>

                        </div>

                        <div className="flex gap-4 mt-8">

                            <button
                                onClick={() => setShowRules(false)}
                                className="
                                    flex-1 border border-zinc-700
                                    py-3 rounded-2xl hover:bg-zinc-900 transition
                                "
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleStartExam}
                                className="
                                    flex-1 bg-zinc-100 text-black
                                    py-3 rounded-2xl font-semibold
                                    hover:bg-zinc-300 transition
                                "
                            >
                                I Understand & Start Exam
                            </button>

                        </div>

                    </div>

                </div>
            }
        </>
    )
}

export default ExamCard