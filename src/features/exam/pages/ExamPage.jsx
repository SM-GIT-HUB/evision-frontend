import toast from "react-hot-toast"
import useCamera from "../hooks/useCamera"
import useFaceMonitoring from "../hooks/useFaceMonitoring"
import { useEffect, useState, useCallback, useRef } from "react"
import { Navigate, useParams, useNavigate } from "react-router-dom"
import { getAssessmentQuestions, submitAssessment } from "../../../api/drive-api"
import { clearAnswers } from "../utils/exam-storage"
import { formatAnswersForSubmission } from "../utils/format-answers"
import useAuthStore from "../../../store/auth-store"
import { io } from "socket.io-client"
import LoadingSpinner from "../../../components/LoadingSpinner"
import useExamTimer from "../hooks/useExamTimer"
import useExamAnswers from "../hooks/useExamAnswers"
import QuestionRenderer from "../components/QuestionRenderer"
import useAutosave from "../hooks/useAutosave"
import useBeforeUnload from "../hooks/useBeforeUnload"
import useRefreshSubmit from "../hooks/useRefreshSubmit"
import useFullscreen from "../hooks/useFullscreen"
import useFocusMonitor from "../hooks/useFocusMonitor"
import {
    ShieldCheck, Flag, BookOpen, Calculator, FileText,
    Bookmark, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight,
    CheckCircle2, X, Clock
} from "lucide-react"

// ── Tab Detection Hook ────────────────────────────────────
function useTabDetection({ enabled, onViolation }) {
    useEffect(() => {
        if (!enabled) return
        function handleVisibility() {
            if (document.hidden) onViolation()
        }
        document.addEventListener("visibilitychange", handleVisibility)
        return () => document.removeEventListener("visibilitychange", handleVisibility)
    }, [enabled, onViolation])
}

// ── Timer display ─────────────────────────────────────────
function TimerDisplay({ timeLeft }) {
    const h = Math.floor(timeLeft / 3600)
    const m = Math.floor((timeLeft % 3600) / 60)
    const s = timeLeft % 60
    const isLow = timeLeft < 300
    return (
        <span className={`font-mono text-2xl font-black tracking-widest ${isLow ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
    )
}

export default function ExamPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [flagged, setFlagged] = useState(new Set())
    const [notes, setNotes] = useState("")
    const [showNotes, setShowNotes] = useState(false)
    const [showCalc, setShowCalc] = useState(false)
    const [calcVal, setCalcVal] = useState("")
    const [lastSaved, setLastSaved] = useState(null)
    const [tabViolations, setTabViolations] = useState(0)
    const TAB_LIMIT = 5

    const [violations, setViolations] = useState({ fullscreen: 3, focus: 5, camera: 5 })
    const { user, isAuthenticated } = useAuthStore()
    const [socket, setSocket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState()
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const { answers, updateAnswer } = useExamAnswers(id)

    useEffect(() => {
        let mounted = true
        async function fetchExamData() {
            try {
                // Fetch drive info for title/details
                const res = await getAssessmentQuestions(id)
                
                // Separate standard (MCQ/Theory) from Coding questions
                const standardQs = res.data.filter(q => q.type !== "coding")
                
                if (mounted) {
                    setExam({
                        id,
                        title: "Assessment", // We could fetch drive title here too if needed
                        questions: standardQs,
                        fullMarks: standardQs.reduce((acc, q) => acc + (q.fullScore || 1), 0)
                    })
                    if (standardQs.length === 0) {
                        toast.error("No standard questions found. Redirecting to coding assessment...")
                        navigate(`/coding-assessment/${id}`)
                    }
                }
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to fetch assessment questions")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchExamData()
        return () => { mounted = false }
    }, [id])

    const handleSubmitExam = useCallback(async ({ silent = false, showError = true } = {}) => {
        try {
            if (submitted || submitting) return
            setSubmitting(true)
            
            // Format answers: { [questionId]: { response } }
            const formatted = {}
            Object.keys(answers).forEach(qid => {
                formatted[qid] = { response: answers[qid].response }
            })

            await submitAssessment(id, formatted)
            
            setSubmitted(true)
            clearAnswers(id)
            if (!silent) {
                toast.success("Assessment submitted successfully!")
                navigate("/exam-finished", { replace: true })
            }
        } catch (err) {
            if (showError) toast.error(err.response?.data?.message || "Failed to submit assessment")
        } finally {
            setSubmitting(false)
        }
    }, [submitted, submitting, answers, id, navigate])

    const timeLeft = useExamTimer(exam?.endTime, handleSubmitExam)
    useAutosave({ exam, examId: id, answers })
    useBeforeUnload(!submitted)
    useRefreshSubmit({ enabled: !submitted, submitExam: handleSubmitExam })

    const handleViolation = useCallback((type) => {
        setViolations(prev => {
            const next = Math.max(prev[type] - 1, 0)
            const labels = { fullscreen: "Fullscreen exited", focus: "Tab/window switched", camera: "Camera violation" }
            toast.error(`${labels[type]}! Remaining: ${next}`, { id: `${type}-v` })
            if (next === 0 && !submitted && !submitting) {
                setTimeout(() => handleSubmitExam({ silent: false }), 0)
            }
            return { ...prev, [type]: next }
        })
    }, [submitted, submitting, handleSubmitExam])

    useTabDetection({
        enabled: !submitted,
        onViolation: () => {
            setTabViolations(v => {
                const next = v + 1
                toast.error(`Tab switch detected! Warning ${next}/${TAB_LIMIT}`, { id: "tab-v" })
                if (socket) socket.emit("tab_violation")
                if (next >= TAB_LIMIT && !submitted) handleSubmitExam({ silent: false })
                return next
            })
        }
    })

    // Live Proctoring Connection
    useEffect(() => {
        if (submitted || !exam) return

        const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true })
        setSocket(newSocket)

        newSocket.emit("join_exam", {
            userId: user?._id || user?.id,
            userName: user?.name,
            userEmail: user?.email,
            examId: id,
            examTitle: exam.title
        })

        newSocket.on("force_submit", () => {
            toast.error("Your exam was terminated by the proctor.")
            handleSubmitExam()
        })

        return () => {
            newSocket.emit("leave_exam")
            newSocket.disconnect()
        }
    }, [submitted, user, exam, id, handleSubmitExam])

    const { videoRef, cameraError } = useCamera({ enabled: !submitted, onCameraDisconnected: () => handleViolation("camera") })
    useFaceMonitoring({ enabled: !submitted, videoRef, onViolation: () => handleViolation("camera") })
    useFullscreen({ enabled: !submitted, onViolation: () => handleViolation("fullscreen") })
    useFocusMonitor({ enabled: !submitted, onViolation: () => handleViolation("focus") })

    useEffect(() => {
        if (submitted) return
        const prevent = e => e.preventDefault()
        const handleKey = e => {
            if (e.key === "F12") e.preventDefault()
            if (e.ctrlKey && (e.key.toLowerCase() === "u" || (e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase())))) e.preventDefault()
        }
        document.addEventListener("contextmenu", prevent)
        document.addEventListener("copy", prevent)
        document.addEventListener("paste", prevent)
        document.addEventListener("cut", prevent)
        window.addEventListener("keydown", handleKey)
        return () => {
            document.removeEventListener("contextmenu", prevent)
            document.removeEventListener("copy", prevent)
            document.removeEventListener("paste", prevent)
            document.removeEventListener("cut", prevent)
            window.removeEventListener("keydown", handleKey)
        }
    }, [submitted])

    if (!isAuthenticated) return <Navigate to="/" replace />
    if (loading) return <LoadingSpinner />
    if (!exam) return null

    const questions = exam.questions || []
    const currentQuestion = questions[currentQuestionIndex]
    const answeredCount = Object.keys(answers).filter(k => answers[k]?.response != null && answers[k]?.response !== "").length
    const flaggedCount = flagged.size
    const notAnswered = questions.length - answeredCount

    function toggleFlag(qid) {
        setFlagged(prev => {
            const next = new Set(prev)
            next.has(qid) ? next.delete(qid) : next.add(qid)
            return next
        })
    }

    function getQuestionStatus(q, i) {
        const isAnswered = answers[q._id]?.response != null && answers[q._id]?.response !== ""
        const isCurrent = i === currentQuestionIndex
        const isFlagged = flagged.has(q._id)
        if (isCurrent) return "current"
        if (isFlagged) return "review"
        if (isAnswered) return "answered"
        return "not-answered"
    }

    const STATUS_STYLE = {
        answered:    "bg-emerald-500 text-white border-emerald-500",
        current:     "bg-violet-600 text-white border-violet-600 ring-2 ring-violet-400/50",
        "not-answered": "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500",
        review:      "bg-amber-500/20 text-amber-400 border-amber-500",
    }

    // Simple calculator
    function calcPress(val) {
        if (val === "=") {
            try { setCalcVal(String(eval(calcVal))) } catch { setCalcVal("Error") }
        } else if (val === "C") {
            setCalcVal("")
        } else if (val === "←") {
            setCalcVal(p => p.slice(0, -1))
        } else {
            setCalcVal(p => p + val)
        }
    }
    const CALC_KEYS = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","←","(", ")"]

    return (
        <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-5 shrink-0 bg-[#0d0d14]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                        <ShieldCheck size={16} className="text-black" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-lg tracking-tight">EVision</span>
                </div>

                <div className="flex items-center gap-3">
                    <h1 className="font-bold text-white text-sm hidden sm:block">{exam.title}</h1>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold">Secure Session Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2">
                        <Clock size={14} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500 font-semibold">Time Left</span>
                        <TimerDisplay timeLeft={timeLeft} />
                    </div>
                    <button
                        onClick={() => setShowSubmitConfirm(true)}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        {submitting ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : null}
                        End Exam
                    </button>
                </div>
            </header>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL — Exam Details & Tools */}
                <aside className="w-52 shrink-0 border-r border-white/5 bg-[#0d0d14] flex flex-col overflow-y-auto">
                    {/* Camera */}
                    <div className="p-3 border-b border-white/5">
                        <div className="w-full h-28 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative">
                            {cameraError ? (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs text-center p-2">Camera unavailable</div>
                            ) : (
                                <video ref={videoRef} autoPlay muted playsInline controls={false} disablePictureInPicture className="w-full h-full object-cover scale-x-[-1]" />
                            )}
                        </div>
                    </div>

                    {/* Exam Info */}
                    <div className="p-4 border-b border-white/5 space-y-3">
                        <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Test</p>
                            <p className="text-sm font-bold text-white mt-0.5">{exam.title}</p>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Questions</p>
                                <p className="text-base font-black text-white">{questions.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Marks</p>
                                <p className="text-base font-black text-white">{exam.fullMarks || questions.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Violations */}
                    <div className="p-4 border-b border-white/5 space-y-2">
                        {[
                            { label: "Fullscreen", val: violations.fullscreen, color: "text-red-400" },
                            { label: "Tab Switch", val: tabViolations, limit: TAB_LIMIT, color: "text-yellow-400" },
                            { label: "Focus", val: violations.focus, color: "text-orange-400" },
                        ].map(v => (
                            <div key={v.label} className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-500">{v.label}</span>
                                <span className={`text-xs font-bold ${v.color}`}>{v.val}{v.limit ? `/${v.limit}` : ""}</span>
                            </div>
                        ))}
                    </div>

                    {/* Sidebar Tools */}
                    <nav className="flex-1 p-3 space-y-1">
                        {[
                            { label: "Instructions", icon: BookOpen, action: null },
                            { label: "Calculator", icon: Calculator, action: () => setShowCalc(v => !v), active: showCalc },
                            { label: "Notes", icon: FileText, action: () => setShowNotes(v => !v), active: showNotes },
                            { label: `Flagged (${flaggedCount})`, icon: Bookmark, action: null },
                            { label: "Save & Review", icon: RotateCcw, action: () => setShowSubmitConfirm(true) },
                        ].map(item => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.label}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left
                                        ${item.active ? "bg-violet-500/20 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                                >
                                    <Icon size={15} />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Proctoring Status */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <ShieldCheck size={16} />
                            <div>
                                <p className="text-xs font-bold">Proctoring Active</p>
                                <p className="text-[10px] text-zinc-500">No issues detected</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* CENTER — Question Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Question Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0d0d14]">
                        <span className="text-sm font-bold text-zinc-300">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <button
                            onClick={() => toggleFlag(currentQuestion?._id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border
                                ${flagged.has(currentQuestion?._id)
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : "text-zinc-500 border-white/10 hover:border-amber-500/30 hover:text-amber-400"}`}
                        >
                            <Flag size={13} />
                            {flagged.has(currentQuestion?._id) ? "Flagged" : "Flag"}
                        </button>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {questions.length > 0 && currentQuestion && (
                            <QuestionRenderer
                                question={currentQuestion}
                                value={answers[currentQuestion._id]?.response}
                                onChange={(response) => updateAnswer(currentQuestion._id, response)}
                            />
                        )}
                    </div>

                    {/* Auto-saved indicator + Navigation */}
                    <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-[#0d0d14]">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 size={14} />
                            <div>
                                <p className="text-xs font-semibold">Auto-saved</p>
                                <p className="text-[10px] text-zinc-600">Last saved just now</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(p => p - 1)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                disabled={currentQuestionIndex === questions.length - 1}
                                onClick={() => setCurrentQuestionIndex(p => p + 1)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>

                        <button
                            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                            onClick={() => toast("Report feature coming soon")}
                        >
                            <AlertTriangle size={13} /> Report an Issue
                        </button>
                    </div>
                </main>

                {/* RIGHT PANEL — Question Palette */}
                <aside className="w-56 shrink-0 border-l border-white/5 bg-[#0d0d14] overflow-y-auto">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Questions</h3>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
                            {[
                                { label: "Answered", color: "bg-emerald-500" },
                                { label: "Current", color: "bg-violet-600" },
                                { label: "Not Answered", color: "bg-transparent border border-zinc-700" },
                                { label: "Review", color: "bg-amber-500/30 border border-amber-500" },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-sm shrink-0 ${l.color}`} />
                                    <span className="text-[10px] text-zinc-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="p-4">
                        <div className="grid grid-cols-5 gap-1.5">
                            {questions.map((q, i) => {
                                const status = getQuestionStatus(q, i)
                                return (
                                    <button
                                        key={q._id}
                                        onClick={() => setCurrentQuestionIndex(i)}
                                        className={`h-9 w-full rounded-lg text-xs font-bold border transition-all ${STATUS_STYLE[status]}`}
                                    >
                                        {i + 1}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Palette Summary */}
                    <div className="p-4 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Question Palette</h3>
                        <div className="space-y-2">
                            {[
                                { label: "Answered", val: answeredCount, color: "text-emerald-400" },
                                { label: "Not Answered", val: notAnswered, color: "text-zinc-400" },
                                { label: "Marked for Review", val: flaggedCount, color: "text-amber-400" },
                                { label: "Total", val: questions.length, color: "text-white", bold: true },
                            ].map(s => (
                                <div key={s.label} className={`flex items-center justify-between text-xs ${s.bold ? "border-t border-white/5 pt-2 mt-2" : ""}`}>
                                    <span className="text-zinc-500">{s.label}</span>
                                    <span className={`font-bold ${s.color}`}>{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* ── Calculator Modal ─────────────────────────────────────── */}
            {showCalc && (
                <div className="fixed bottom-20 left-56 z-50 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 w-52">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">Calculator</span>
                        <button onClick={() => setShowCalc(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                    </div>
                    <div className="bg-black rounded-xl px-3 py-2 text-right text-white font-mono text-lg mb-3 min-h-10 break-all">
                        {calcVal || "0"}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {CALC_KEYS.map(k => (
                            <button
                                key={k}
                                onClick={() => calcPress(k)}
                                className={`h-9 rounded-lg text-sm font-bold transition-colors
                                    ${k === "=" ? "bg-violet-600 hover:bg-violet-500 text-white" :
                                      k === "C" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" :
                                      "bg-white/5 hover:bg-white/10 text-zinc-300"}`}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Notes Modal ───────────────────────────────────────────── */}
            {showNotes && (
                <div className="fixed bottom-20 left-56 z-50 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 w-72">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">Scratch Notes</span>
                        <button onClick={() => setShowNotes(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                    </div>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Jot down your thoughts..."
                        className="w-full h-40 bg-black border border-white/10 rounded-xl p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-violet-500/50 placeholder-zinc-700"
                    />
                </div>
            )}

            {/* ── Submit Confirm Modal ──────────────────────────────────── */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Submit Exam?</h3>
                        </div>
                        <div className="space-y-2 text-sm text-zinc-400 mb-6">
                            <div className="flex justify-between"><span>Answered</span><span className="text-emerald-400 font-bold">{answeredCount}</span></div>
                            <div className="flex justify-between"><span>Not answered</span><span className="text-red-400 font-bold">{notAnswered}</span></div>
                            <div className="flex justify-between"><span>Flagged for review</span><span className="text-amber-400 font-bold">{flaggedCount}</span></div>
                        </div>
                        <p className="text-xs text-zinc-500 mb-5">Once submitted, you cannot change your answers.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 border border-white/10 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmitExam} disabled={submitting} className="flex-1 bg-red-500 hover:bg-red-600 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50">
                                {submitting ? "Submitting..." : "Submit Exam"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Calculator keys need to be accessible inside component
const CALC_KEYS = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","←","(", ")"]