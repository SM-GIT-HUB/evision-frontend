import { useState, useEffect, useCallback } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import toast from "react-hot-toast"
import useAuthStore from "../../../store/auth-store"
import { io } from "socket.io-client"
import {
    ShieldCheck, Play, Save, RotateCcw, ChevronRight,
    CheckCircle2, XCircle as XCircleIcon, Clock, Loader2, Sun, Maximize2,
    ChevronDown, FileCode2
} from "lucide-react"
import { getAssessmentQuestions, runCode, submitAssessment } from "../../../api/drive-api"

// ── Tab Detection ─────────────────────────────────────────
function useTabDetection({ enabled, onViolation }) {
    useEffect(() => {
        if (!enabled) return
        const fn = () => { if (document.hidden) onViolation() }
        document.addEventListener("visibilitychange", fn)
        return () => document.removeEventListener("visibilitychange", fn)
    }, [enabled, onViolation])
}

// ── Language configs ──────────────────────────────────────
const LANGUAGES = [
    { id: "javascript", label: "JavaScript (Node.js)", monaco: "javascript" },
    { id: "python",     label: "Python 3",             monaco: "python" },
    { id: "java",       label: "Java",                 monaco: "java" },
    { id: "cpp",        label: "C++",                  monaco: "cpp" },
]

const STARTERS = {
    javascript: `function solution(/* params */) {\n    // Write your solution here\n    \n}\n\nconsole.log(solution());`,
    python:     `def solution():\n    # Write your solution here\n    pass\n\nprint(solution())`,
    java:       `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
    cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
}

// ── Timer ─────────────────────────────────────────────────
function TimerDisplay({ timeLeft }) {
    const h = Math.floor(timeLeft / 3600)
    const m = Math.floor((timeLeft % 3600) / 60)
    const s = timeLeft % 60
    const isLow = timeLeft < 300
    return (
        <span className={`font-mono text-xl font-black tracking-widest ${isLow ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
    )
}

// ── Sample problem (would come from props/API in real use) ─
const SAMPLE_PROBLEM = {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    testCases: [
        { id: 1, input: "nums = [2,7,11,15], target = 9", expected: "[0,1]", status: null },
        { id: 2, input: "nums = [3,2,4], target = 6",     expected: "[1,2]", status: null },
        { id: 3, input: "nums = [3,3], target = 6",       expected: "[0,1]", status: null },
    ],
    hints: [
        "A really brute force way would be to search for all possible pairs of numbers.",
        "Think about what we need to find for each number in the array.",
        "Can you use a hash map to achieve O(n) time complexity?",
    ]
}

export default function CodingAssessmentPage() {
    const { id: driveId } = useParams()
    const { user, isAuthenticated } = useAuthStore()
    const [socket, setSocket] = useState(null)
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [problem, setProblem] = useState(null)
    const [lang, setLang]       = useState(LANGUAGES[0])
    const [code, setCode]       = useState("")
    const [activeTab, setActiveTab] = useState("problem") // problem | hints
    const [consoleTab, setConsoleTab] = useState("console") // console | results
    const [consoleOutput, setConsoleOutput] = useState([])
    const [testResults, setTestResults]     = useState([])
    const [running, setRunning]   = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [timeLeft, setTimeLeft] = useState(3600) // Default 60 mins
    const [showLangMenu, setShowLangMenu] = useState(false)
    const [tabWarnings, setTabWarnings] = useState(0)
    const TAB_LIMIT = 5

    // Fetch problem on mount
    useEffect(() => {
        async function fetchProblem() {
            try {
                const res = await getAssessmentQuestions(driveId)
                // Filter for first coding question
                const codingQ = res.data.find(q => q.type === "coding")
                if (codingQ) {
                    setProblem({
                        id: codingQ._id,
                        title: codingQ.questionText.split("\n")[0].replace("#", "").trim(),
                        difficulty: codingQ.difficulty || "Medium",
                        statement: codingQ.questionText,
                        examples: codingQ.examples || [],
                        testCases: (codingQ.testCases || []).map((t, i) => ({ ...t, id: i + 1, status: null })),
                        hints: codingQ.hints || []
                    })
                    setTestResults((codingQ.testCases || []).map((t, i) => ({ ...t, id: i + 1, status: null })))
                    
                    // If starter code exists for current lang
                    if (codingQ.starterCode && codingQ.starterCode[lang.id]) {
                        setCode(codingQ.starterCode[lang.id])
                    } else {
                        setCode(STARTERS[lang.id])
                    }
                } else {
                    toast.error("No coding question found for this assessment")
                    navigate("/my-applications")
                }
            } catch (err) {
                toast.error("Failed to load assessment questions")
                navigate("/my-applications")
            } finally {
                setLoading(false)
            }
        }
        if (isAuthenticated && driveId) fetchProblem()
    }, [driveId, isAuthenticated, navigate])

    // Countdown
    useEffect(() => {
        if (timeLeft <= 0 || submitted) return
        const id = setInterval(() => setTimeLeft(p => p - 1), 1000)
        return () => clearInterval(id)
    }, [timeLeft, submitted])

    // Auto-submit on time up
    useEffect(() => {
        if (timeLeft <= 0 && !submitted) {
            toast.error("Time is up! Assessment auto-submitted.")
            handleSubmit()
        }
    }, [timeLeft])

    // Live Proctoring Connection
    useEffect(() => {
        if (submitted) return

        const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true })
        setSocket(newSocket)

        newSocket.emit("join_exam", {
            userId: user?._id || user?.id,
            userName: user?.name,
            userEmail: user?.email,
            examId: driveId,
            examTitle: problem?.title || "Coding Assessment"
        })

        newSocket.on("force_submit", () => {
            toast.error("Your assessment was terminated by the proctor.")
            handleSubmit()
        })

        return () => {
            newSocket.emit("leave_exam")
            newSocket.disconnect()
        }
    }, [submitted, user, problem])

    useTabDetection({
        enabled: !submitted,
        onViolation: () => {
            setTabWarnings(v => {
                const n = v + 1
                toast.error(`Tab switch detected! Warning ${n}/${TAB_LIMIT}`, { id: "coding-tab" })
                if (socket) socket.emit("tab_violation")
                if (n >= TAB_LIMIT) handleSubmit()
                return n
            })
        }
    })

    function handleLangChange(l) {
        setLang(l)
        if (problem?.starterCode && problem.starterCode[l.id]) {
            setCode(problem.starterCode[l.id])
        } else {
            setCode(STARTERS[l.id])
        }
        setShowLangMenu(false)
    }

    function handleReset() {
        if (problem?.starterCode && problem.starterCode[lang.id]) {
            setCode(problem.starterCode[lang.id])
        } else {
            setCode(STARTERS[lang.id])
        }
        setConsoleOutput([])
        setTestResults(problem?.testCases.map(t => ({ ...t, status: null })) || [])
    }

    async function handleRun() {
        if (!problem) return
        setRunning(true)
        setConsoleTab("console")
        setConsoleOutput([{ type: "info", text: `> Running ${lang.label} via AI Evaluation...` }])
        
        try {
            const res = await runCode(driveId, {
                code,
                language: lang.id,
                questionId: problem.id
            })

            const { consoleOutput: aiConsole, error, testResults: aiResults } = res.data
            
            // Map console output
            const formattedConsole = aiConsole.map(text => ({ type: "out", text }))
            if (error) formattedConsole.push({ type: "err", text: error })
            setConsoleOutput(p => [...p, ...formattedConsole])

            // Map test results
            const updatedResults = problem.testCases.map((tc, i) => {
                const aiRes = aiResults[i] || {}
                return {
                    ...tc,
                    status: aiRes.passed ? "passed" : "failed",
                    actual: aiRes.actual || "N/A"
                }
            })
            setTestResults(updatedResults)
            setConsoleTab("results")
        } catch (err) {
            toast.error("AI Evaluation failed. Please try again.")
            setConsoleOutput(p => [...p, { type: "err", text: "> Evaluation Error: System offline or timeout." }])
        } finally {
            setRunning(false)
        }
    }

    async function handleSubmit() {
        if (submitted || !problem) return
        setRunning(true)
        try {
            await submitAssessment(driveId, {
                [problem.id]: { code, lang: lang.id }
            })
            setSubmitted(true)
            toast.success("Code submitted successfully!")
            navigate("/exam-finished", { replace: true })
        } catch (err) {
            toast.error("Failed to submit assessment")
        } finally {
            setRunning(false)
        }
    }

    if (loading) return (
        <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <p className="text-zinc-400 font-medium">Initializing secure coding environment...</p>
            </div>
        </div>
    )

    if (!isAuthenticated) return <Navigate to="/" replace />
    if (!problem) return null

    const passedCount = testResults.filter(t => t.status === "passed").length

    return (
        <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col overflow-hidden text-sm">

            {/* ── Top Bar ─────────────────────────────────────────── */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-5 shrink-0 bg-[#0d0d14]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                        <ShieldCheck size={16} className="text-black" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-lg tracking-tight">EVision</span>
                    <span className="text-zinc-600">|</span>
                    <span className="font-bold text-zinc-300">Coding Assessment</span>
                    <div className="flex items-center gap-1.5 text-emerald-400 ml-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold">Secure Session Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2">
                        <Clock size={13} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500 font-semibold">Time Left</span>
                        <TimerDisplay timeLeft={timeLeft} />
                    </div>

                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(v => !v)}
                            className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-white/20 transition-colors"
                        >
                            {lang.label} <ChevronDown size={12} />
                        </button>
                        {showLangMenu && (
                            <div className="absolute top-10 right-0 w-48 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => handleLangChange(l)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors
                                            ${l.id === lang.id ? "text-violet-400 bg-violet-500/10" : "text-zinc-300"}`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitted}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                    >
                        <Play size={13} fill="white" /> Submit Code
                    </button>
                </div>
            </header>

            {/* ── Main ─────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR — Question List */}
                <aside className="w-48 shrink-0 border-r border-white/5 bg-[#0d0d14] overflow-y-auto">
                    <div className="p-3 space-y-1">
                        {problem.testCases.map((_, i) => {
                            const tc = testResults[i]
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer
                                        ${i === 0 ? "bg-violet-500/20 border border-violet-500/30" : "hover:bg-white/5"}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                                        ${tc?.status === "passed" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                                        {tc?.status === "passed" ? <CheckCircle2 size={14} /> : i + 1}
                                    </div>
                                    <span className="text-xs text-zinc-400 font-semibold">Q{i + 1}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Tab warnings */}
                    {tabWarnings > 0 && (
                        <div className="mx-3 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-red-400">Tab switches: {tabWarnings}/{TAB_LIMIT}</p>
                        </div>
                    )}
                </aside>

                {/* CENTER — Code Editor */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
                    {/* Editor Toolbar */}
                    <div className="h-10 bg-[#0d0d14] border-b border-white/5 flex items-center gap-1 px-3">
                        <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5">
                            <FileCode2 size={12} className="text-violet-400" />
                            <span className="text-xs text-zinc-300 font-mono">main.{lang.id === "javascript" ? "js" : lang.id === "python" ? "py" : lang.id === "java" ? "java" : "cpp"}</span>
                            <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 cursor-pointer">
                                <XCircleIcon size={9} className="text-zinc-400" />
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors">
                                <Sun size={13} />
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors">
                                <Maximize2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={lang.monaco}
                            value={code}
                            onChange={v => setCode(v || "")}
                            theme="vs-dark"
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                minimap: { enabled: false },
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 12 },
                                renderLineHighlight: "gutter",
                                smoothScrolling: true,
                                cursorBlinking: "smooth",
                                bracketPairColorization: { enabled: true },
                                wordWrap: "off",
                                tabSize: 4,
                                contextmenu: false,
                            }}
                        />
                    </div>

                    {/* Console / Results Panel */}
                    <div className="h-48 border-t border-white/5 flex flex-col bg-[#080810]">
                        {/* Console Tab Bar */}
                        <div className="flex items-center border-b border-white/5 bg-[#0d0d14] px-3">
                            {["console", "results"].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setConsoleTab(t)}
                                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors capitalize
                                        ${consoleTab === t ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    {t === "results" ? `Test Results (${passedCount}/${testResults.length})` : "Console"}
                                </button>
                            ))}
                            <div className="ml-auto flex items-center gap-2 py-1.5">
                                <button
                                    onClick={handleRun}
                                    disabled={running}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 font-semibold text-xs transition-colors disabled:opacity-50"
                                >
                                    {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                                    Run Code
                                </button>
                                <button
                                    onClick={() => setCode(code)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 font-semibold text-xs transition-colors"
                                >
                                    <Save size={11} /> Save
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 font-semibold text-xs transition-colors"
                                >
                                    <RotateCcw size={11} /> Reset
                                </button>
                            </div>
                        </div>

                        {/* Console content */}
                        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                            {consoleTab === "console" ? (
                                consoleOutput.length === 0 ? (
                                    <p className="text-zinc-700">Run your code to see output here...</p>
                                ) : (
                                    consoleOutput.map((line, i) => (
                                        <div key={i} className={`leading-6
                                            ${line.type === "cmd" ? "text-zinc-500" :
                                              line.type === "out" ? "text-emerald-400" :
                                              "text-blue-400"}`}>
                                            {line.text}
                                        </div>
                                    ))
                                )
                            ) : (
                                <div className="space-y-2">
                                    {testResults.map((tc, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border
                                            ${tc.status === "passed" ? "bg-emerald-500/5 border-emerald-500/20" :
                                              tc.status === "failed" ? "bg-red-500/5 border-red-500/20" :
                                              tc.status === "running" ? "bg-blue-500/5 border-blue-500/20" :
                                              "bg-white/2 border-white/5"}`}>
                                            {tc.status === "passed" ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> :
                                             tc.status === "failed" ? <XCircleIcon size={13} className="text-red-400 shrink-0" /> :
                                             tc.status === "running" ? <Loader2 size={13} className="text-blue-400 animate-spin shrink-0" /> :
                                             <div className="w-3 h-3 rounded-full border border-zinc-600 shrink-0" />}
                                            <span className="text-zinc-400">Test Case {tc.id}</span>
                                            <span className="text-zinc-600 flex-1 truncate">{tc.input}</span>
                                            <span className={`font-semibold text-[11px] uppercase tracking-wide
                                                ${tc.status === "passed" ? "text-emerald-400" :
                                                  tc.status === "failed" ? "text-red-400" :
                                                  tc.status === "running" ? "text-blue-400" : "text-zinc-600"}`}>
                                                {tc.status || "pending"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL — Problem Statement */}
                <aside className="w-80 shrink-0 bg-[#0d0d14] overflow-y-auto">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        {["problem", "hints"].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px
                                    ${activeTab === t ? "border-violet-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                            >
                                {t === "problem" ? "Problem Statement" : "Hints"}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {activeTab === "problem" ? (
                            <>
                                {/* Title & Difficulty */}
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-base font-bold text-white">{problem.title}</h2>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide
                                        ${problem.difficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                          problem.difficulty === "Medium" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                                          "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                                        {problem.difficulty}
                                    </span>
                                </div>

                                {/* Statement */}
                                <p className="text-zinc-400 text-xs leading-relaxed mb-5 whitespace-pre-wrap">{problem.statement}</p>

                                {/* Examples */}
                                {problem.examples.map((ex, i) => (
                                    <div key={i} className="mb-4">
                                        <p className="text-xs font-bold text-white mb-2">Example {i + 1}:</p>
                                        <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-1.5 font-mono text-xs">
                                            <div><span className="text-zinc-500">Input:</span> <span className="text-zinc-300">{ex.input}</span></div>
                                            <div><span className="text-zinc-500">Output:</span> <span className="text-zinc-300">{ex.output}</span></div>
                                            {ex.explanation && <div><span className="text-zinc-500">Explanation:</span> <span className="text-zinc-400">{ex.explanation}</span></div>}
                                        </div>
                                    </div>
                                ))}

                                {/* Test Cases */}
                                <div className="mt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-white">Test Cases</h3>
                                        <button className="text-[10px] text-violet-400 font-semibold hover:text-violet-300">Custom Input</button>
                                    </div>
                                    <div className="space-y-2">
                                        {testResults.map((tc, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-xs
                                                ${tc.status === "passed" ? "bg-emerald-500/5 border-emerald-500/20" :
                                                  tc.status === "failed" ? "bg-red-500/5 border-red-500/20" :
                                                  tc.status === "running" ? "bg-blue-500/5 border-blue-500/20" :
                                                  "bg-white/2 border-white/5"}`}>
                                                {tc.status === "passed" ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> :
                                                 tc.status === "failed" ? <XCircleIcon size={13} className="text-red-400 shrink-0" /> :
                                                 tc.status === "running" ? <Loader2 size={13} className="text-blue-400 animate-spin shrink-0" /> :
                                                 <div className="w-3 h-3 rounded-full border border-zinc-600 shrink-0" />}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-zinc-500 truncate">{tc.input}</div>
                                                    <div className="text-zinc-400">Output: {tc.expected}</div>
                                                </div>
                                                <span className={`shrink-0 font-bold text-[10px] uppercase
                                                    ${tc.status === "passed" ? "text-emerald-400" :
                                                      tc.status === "failed" ? "text-red-400" :
                                                      tc.status === "running" ? "text-blue-400" : "text-zinc-600"}`}>
                                                    {tc.status || "pending"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-white mb-4">Hints</h3>
                                {problem.hints.map((hint, i) => (
                                    <details key={i} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                        <summary className="px-4 py-3 text-xs font-semibold text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors">
                                            Hint {i + 1}
                                        </summary>
                                        <div className="px-4 pb-3 text-xs text-zinc-500 leading-relaxed border-t border-white/5 pt-3">{hint}</div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}
