import toast from "react-hot-toast"
import useCamera from "../hooks/useCamera"
import useFaceMonitoring from "../hooks/useFaceMonitoring"

import { useEffect, useState, useCallback } from "react"
import { Navigate, useParams, useNavigate } from "react-router-dom"

import { getExam, submitExam } from "../../../api/exam-api"

import { clearAnswers } from "../utils/exam-storage"

import { formatAnswersForSubmission } from "../utils/format-answers"

import useAuthStore from "../../../store/auth-store"

import LoadingSpinner from "../../../components/LoadingSpinner"

import Timer from "../components/Timer"
import useExamTimer from "../hooks/useExamTimer"
import useExamAnswers from "../hooks/useExamAnswers"
import QuestionRenderer from "../components/QuestionRenderer"
import QuestionNavigation from "../components/QuestionNavigation"

import useAutosave from "../hooks/useAutosave"
import useBeforeUnload from "../hooks/useBeforeUnload"
import useRefreshSubmit from "../hooks/useRefreshSubmit"

import useFullscreen from "../hooks/useFullscreen"
import useFocusMonitor from "../hooks/useFocusMonitor"

function ExamPage()
{
    const { id } = useParams();

    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [violations, setViolations] = useState({
        fullscreen: 3,
        focus: 5,
        camera: 5
    })

    const { isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(true);

    const [exam, setExam] = useState();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const {
        answers,
        updateAnswer
    } = useExamAnswers(id);

    useEffect(() => {
        let mounted = true;

        async function fetchExam()
        {
            try {
                const response = await getExam(id);

                if (mounted) {
                    setExam(response.data);
                }
            }
            catch(err) {
                toast.error(
                    err.response?.data?.message ||
                    "Failed to fetch exam"
                )
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchExam();

        return () => {
            mounted = false;
        }

    }, [id])

    const handleSubmitExam = useCallback(async ({
        silent = false,
        showError = true
    } = {}) =>
    {
        try {

            if (submitted || submitting) {
                return;
            }

            setSubmitting(true);

            const formattedAnswers =
                formatAnswersForSubmission(answers);

            await submitExam({
                examId: id,
                answers: formattedAnswers
            })

            setSubmitted(true);

            clearAnswers(id);

            if (!silent)
            {
                toast.success("Exam submitted");

                navigate("/exam-finished", {
                    replace: true
                })
            }
        }
        catch(err) {

            if (showError)
            {
                toast.error(
                    err.response?.data?.message ||
                    err.response?.data?.error?.message ||
                    "Failed to submit exam"
                )
            }
        }
        finally {
            setSubmitting(false);
        }

    }, [
        submitted,
        submitting,
        answers,
        id,
        navigate
    ])

    const timeLeft = useExamTimer(
        exam?.endTime,
        handleSubmitExam
    )

    useAutosave({
        exam,
        examId: id,
        answers
    })

    useBeforeUnload(!submitted);

    useRefreshSubmit({
        enabled: !submitted,
        submitExam: handleSubmitExam
    })

    const handleViolation = useCallback((type) => {
        setViolations(prev => {
            const currentCount = prev[type];
            const nextCount = Math.max(currentCount - 1, 0);

            const messages = {
                fullscreen: "Fullscreen exited",
                focus: "Focus lost",
                camera: "Camera violation"
            }

            toast.error(
                `${messages[type]}! Remaining attempts: ${nextCount}`, 
                { id: `${type}-violation` }
            )
            
            if (nextCount === 0 && !submitted && !submitting) {
                setTimeout(() => {
                    handleSubmitExam({ silent: false });
                    toast.error(`Exam auto-submitted: ${type} limit reached`, { id: 'auto-sub' });
                }, 0);
            }

            return { ...prev, [type]: nextCount };
        })
    }, [submitted, submitting, handleSubmitExam]);

    const handleCameraDisconnect = useCallback(() => {
        handleViolation("camera");
    }, [handleViolation])

    const {
        videoRef,
        cameraError
    } = useCamera({
        enabled: !submitted,
        onCameraDisconnected: handleCameraDisconnect
    })

    useFaceMonitoring({
        enabled: !submitted,
        videoRef,
        onViolation: () =>
            handleViolation("camera")
    })

    // Ensure your hooks use this updated handler
    useFullscreen({
        enabled: !submitted,
        onViolation: () => handleViolation('fullscreen')
    })

    useFocusMonitor({
        enabled: !submitted,
        onViolation: () => handleViolation('focus')
    })

    useEffect(() => {
        if (submitted) {
            return;
        }

        function prevent(e)
        {
            e.preventDefault();
        }

        function handleKeyDown(e)
        {
            //
            // F12
            //
            if (e.key === "F12")
            {
                e.preventDefault();
            }

            //
            // Ctrl+Shift+I
            // Ctrl+Shift+J
            // Ctrl+U
            //
            if (
                e.ctrlKey &&
                (
                    e.key.toLowerCase() === "u" ||
                    (
                        e.shiftKey &&
                        ["i", "j", "c"].includes(
                            e.key.toLowerCase()
                        )
                    )
                )
            )
            {
                e.preventDefault();
            }

            //
            // copy/paste/cut/select
            //
            if (
                e.ctrlKey &&
                ["c", "v", "x", "a"].includes(
                    e.key.toLowerCase()
                )
            )
            {
                e.preventDefault();
            }
        }

        document.addEventListener(
            "contextmenu",
            prevent
        );

        document.addEventListener(
            "copy",
            prevent
        );

        document.addEventListener(
            "paste",
            prevent
        );

        document.addEventListener(
            "cut",
            prevent
        );

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            document.removeEventListener(
                "contextmenu",
                prevent
            );

            document.removeEventListener(
                "copy",
                prevent
            );

            document.removeEventListener(
                "paste",
                prevent
            );

            document.removeEventListener(
                "cut",
                prevent
            );

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        }

    }, [submitted])

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    if (loading) {
        return <LoadingSpinner />
    }

    if (!exam) {
        return null;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-black text-white px-6 py-8">

            <div className="max-w-7xl mx-auto">

                <div className="flex items-start justify-between gap-6">

                    <div>

                        <h1 className="text-4xl font-bold">
                            {exam.title}
                        </h1>

                        <p className="text-zinc-500 mt-2">
                            {exam.questions.length} Questions
                        </p>

                    </div>

                    <div className="
                        fixed top-6 right-6 z-50
                        flex flex-col gap-3
                    ">

                        <div className="flex items-center gap-3">

                            <div className="
                                w-52 h-32 bg-zinc-950 border border-zinc-800
                                rounded-2xl overflow-hidden relative
                            ">

                                {
                                    cameraError
                                    ?
                                    <div className="
                                        absolute inset-0 flex items-center justify-center
                                        text-red-400 text-xs text-center px-3
                                    ">
                                        {cameraError}
                                    </div>
                                    :
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        controls={false}
                                        disablePictureInPicture
                                        className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                }

                            </div>

                            <Timer timeLeft={timeLeft} />

                        </div>

                        <div className="
                            bg-zinc-950 border border-zinc-800
                            rounded-2xl p-2 space-y-1
                        ">

                            <div className="flex items-center justify-between gap-10">
                                <p className="text-sm text-zinc-400">
                                    Fullscreen Violations
                                </p>

                                <p className="font-semibold text-red-400">
                                    {violations.fullscreen}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-10">
                                <p className="text-sm text-zinc-400">
                                    Focus Violations
                                </p>

                                <p className="font-semibold text-yellow-400">
                                    {violations.focus}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-10">
                                <p className="text-sm text-zinc-400">
                                    Camera Violations
                                </p>

                                <p className="font-semibold text-orange-400">
                                    {violations.camera}
                                </p>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="mt-10">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-zinc-500 text-sm">
                            Answers are automatically saved periodically
                        </p>
                    </div>

                    <QuestionNavigation
                        questions={exam.questions}
                        currentQuestionIndex={currentQuestionIndex}
                        setCurrentQuestionIndex={setCurrentQuestionIndex}
                        answers={answers}
                    />

                </div>

                <div className="
                    mt-10 bg-zinc-900 border border-zinc-800
                    rounded-3xl p-6 min-h-100
                ">

                    {
                        exam.questions && exam.questions.length > 0 &&
                        <QuestionRenderer
                            question={currentQuestion}
                            value={
                                answers[currentQuestion._id]?.response
                            }
                            onChange={(response) =>
                                updateAnswer(
                                    currentQuestion._id,
                                    response
                                )
                            }
                        />
                    }

                </div>

                <div className="mt-8 flex items-center justify-between">

                    <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() =>
                            setCurrentQuestionIndex(prev => prev - 1)
                        }
                        className="
                            px-6 py-3 rounded-2xl border border-zinc-800
                            disabled:opacity-40
                        "
                    >
                        Previous
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="
                                bg-red-500 hover:bg-red-600 transition
                                px-6 py-3 rounded-2xl font-semibold
                            "
                            disabled={submitting}
                        >
                            {
                                submitting
                                ? "Submitting..."
                                : "Submit Exam"
                            }
                        </button>

                        {
                            showSubmitConfirm &&
                            <div className="
                                absolute left-1/2 -translate-x-1/2 bottom-16
                                w-80 bg-zinc-950 border border-zinc-800
                                rounded-2xl p-5 shadow-2xl z-50
                            ">

                                <h3 className="text-lg font-semibold">
                                    Submit Exam?
                                </h3>

                                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                    Are you sure you want to submit the exam?
                                    You won't be able to change answers afterwards.
                                </p>

                                <div className="flex gap-3 mt-5">

                                    <button
                                        onClick={() => setShowSubmitConfirm(false)}
                                        className="
                                            flex-1 border border-zinc-700
                                            py-2.5 rounded-xl
                                        "
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSubmitExam}
                                        className="
                                            flex-1 bg-red-500 hover:bg-red-600
                                            py-2.5 rounded-xl font-semibold
                                        "
                                    >
                                        Confirm
                                    </button>

                                </div>

                            </div>
                        }
                    </div>

                    <button
                        disabled={
                            currentQuestionIndex ===
                            exam.questions.length - 1
                        }
                        onClick={() =>
                            setCurrentQuestionIndex(prev => prev + 1)
                        }
                        className="
                            px-6 py-3 rounded-2xl border border-zinc-800
                            disabled:opacity-40
                        "
                    >
                        Next
                    </button>

                </div>

            </div>

        </div>
    )
}

export default ExamPage