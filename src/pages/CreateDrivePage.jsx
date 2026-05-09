import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
    ArrowLeft, ArrowRight, Building2, Settings, HelpCircle,
    Eye, Plus, Trash2, CheckCircle2, Loader2, ChevronDown
} from "lucide-react"
import useAuthStore from "../store/auth-store"
import { createDrive, addDriveQuestions, publishDrive } from "../api/drive-api"

const STEPS = [
    { id: 1, label: "Drive Details",  icon: Building2 },
    { id: 2, label: "Eligibility",    icon: Settings },
    { id: 3, label: "Questions",      icon: HelpCircle },
    { id: 4, label: "Review",         icon: Eye },
]

const EMPTY_Q = () => ({
    type: "mcq",
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    sampleAnswer: "",
    fullScore: ""
})

export default function CreateDrivePage() {
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuthStore()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [createdDriveId, setCreatedDriveId] = useState(null)

    // Step 1: Drive Details
    const [drive, setDrive] = useState({
        title: "",
        company: "",
        description: "",
        applicationDeadline: "",
        examDate: "",
        examDuration: 90,
        passingMarks: 0,
        pipeline: {
            shortlistCount: 0,
            selectionCount: 0,
            examWeight: 60,
            interviewWeight: 40
        }
    })

    // Step 2: Eligibility
    const [eligibility, setEligibility] = useState({
        minCGPA: "",
        passingYear: "",
        branches: "",   // comma separated string → parsed to array
        skills: ""
    })

    // Step 3: Questions
    const [questions, setQuestions] = useState([EMPTY_Q()])

    if (!isAuthenticated || user?.role !== "examiner") return <Navigate to="/" replace />

    // ── Helpers ────────────────────────────────────────────────────────────────
    function setDriveField(field, value) {
        setDrive(prev => ({ ...prev, [field]: value }))
    }

    function setPipelineField(field, value) {
        setDrive(prev => ({ ...prev, pipeline: { ...prev.pipeline, [field]: value } }))
    }

    function setQ(idx, field, value) {
        setQuestions(prev => {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], [field]: value }
            return updated
        })
    }

    function setOption(qIdx, opIdx, value) {
        setQuestions(prev => {
            const updated = [...prev]
            const opts = [...updated[qIdx].options]
            opts[opIdx] = value
            updated[qIdx] = { ...updated[qIdx], options: opts }
            return updated
        })
    }

    function addQuestion() {
        setQuestions(prev => [...prev, EMPTY_Q()])
    }

    function removeQuestion(idx) {
        if (questions.length === 1) return toast.error("At least one question required")
        setQuestions(prev => prev.filter((_, i) => i !== idx))
    }

    // ── Validation ─────────────────────────────────────────────────────────────
    function validateStep() {
        if (step === 1) {
            if (!drive.title.trim()) return toast.error("Drive title is required")
            if (!drive.applicationDeadline) return toast.error("Application deadline is required")
        }
        if (step === 3) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                if (!q.questionText.trim()) return toast.error(`Question ${i + 1}: text is required`)
                if (!q.fullScore) return toast.error(`Question ${i + 1}: marks are required`)
                if (q.type === "mcq") {
                    if (q.options.some(o => !o.trim())) return toast.error(`Question ${i + 1}: all 4 MCQ options required`)
                }
                if (q.type === "theory" && !q.sampleAnswer.trim()) {
                    return toast.error(`Question ${i + 1}: sample answer required`)
                }
            }
        }
        return true
    }

    function nextStep() {
        if (validateStep() === true) setStep(s => s + 1)
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    async function handleCreateDrive() {
        setLoading(true)
        try {
            // Step A: Create Drive
            const eligObj = {
                minCGPA: eligibility.minCGPA ? Number(eligibility.minCGPA) : 0,
                passingYear: eligibility.passingYear ? Number(eligibility.passingYear) : null,
                branches: eligibility.branches ? eligibility.branches.split(",").map(s => s.trim()).filter(Boolean) : [],
                skills: eligibility.skills ? eligibility.skills.split(",").map(s => s.trim()).filter(Boolean) : []
            }

            const driveRes = await createDrive({
                title: drive.title,
                company: drive.company,
                description: drive.description,
                applicationDeadline: drive.applicationDeadline || null,
                examDate: drive.examDate || null,
                examDuration: Number(drive.examDuration),
                passingMarks: Number(drive.passingMarks),
                eligibility: eligObj,
                pipeline: {
                    shortlistCount: Number(drive.pipeline.shortlistCount),
                    selectionCount: Number(drive.pipeline.selectionCount),
                    examWeight: Number(drive.pipeline.examWeight) / 100,
                    interviewWeight: Number(drive.pipeline.interviewWeight) / 100
                }
            })
            const driveId = driveRes.data._id
            setCreatedDriveId(driveId)

            // Step B: Add Questions
            const formattedQs = questions.map(q => ({
                type: q.type,
                questionText: q.questionText.trim(),
                fullScore: Number(q.fullScore),
                options: q.type === "mcq" ? q.options : undefined,
                correctOption: q.type === "mcq" ? Number(q.correctOption) : undefined,
                sampleAnswer: q.type === "theory" ? q.sampleAnswer.trim() : undefined
            }))

            await addDriveQuestions(driveId, formattedQs)

            // Step C: Publish Drive
            await publishDrive(driveId)

            toast.success("🎉 Drive created & published! Candidates can now apply.")
            navigate("/drives")
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create drive")
        } finally {
            setLoading(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-3xl mx-auto">

                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition">
                    <ArrowLeft size={16} /> Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-2">Create a New Drive</h1>
                <p className="text-zinc-500 text-sm mb-8">Set up your hiring drive — eligibility, questions, and pipeline config.</p>

                {/* Step Progress */}
                <div className="flex items-center gap-2 mb-10">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon
                        const active = step === s.id
                        const done = step > s.id
                        return (
                            <div key={s.id} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                                    active ? "bg-violet-600 text-white" :
                                    done ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" :
                                    "bg-zinc-900 text-zinc-500 border border-zinc-800"
                                }`}>
                                    {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                                    <span className="hidden sm:block">{s.label}</span>
                                    <span className="sm:hidden">{s.id}</span>
                                </div>
                                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${done ? "bg-emerald-600/30" : "bg-zinc-800"}`} />}
                            </div>
                        )
                    })}
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">

                    {/* ── Step 1: Drive Details ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-semibold mb-6">Drive Details</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Drive Title *">
                                    <input value={drive.title} onChange={e => setDriveField("title", e.target.value)}
                                        placeholder="e.g. TCS NQT 2025" className={inputCls} />
                                </Field>
                                <Field label="Company Name">
                                    <input value={drive.company} onChange={e => setDriveField("company", e.target.value)}
                                        placeholder="e.g. TCS" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="Description">
                                <textarea rows={3} value={drive.description} onChange={e => setDriveField("description", e.target.value)}
                                    placeholder="Describe the drive, role, and what candidates should expect..."
                                    className={inputCls + " resize-none"} />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Application Deadline *">
                                    <input type="datetime-local" value={drive.applicationDeadline}
                                        onChange={e => setDriveField("applicationDeadline", e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Exam Date">
                                    <input type="datetime-local" value={drive.examDate}
                                        onChange={e => setDriveField("examDate", e.target.value)} className={inputCls} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Exam Duration (min)">
                                    <input type="number" min="15" value={drive.examDuration}
                                        onChange={e => setDriveField("examDuration", e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Passing Marks">
                                    <input type="number" min="0" value={drive.passingMarks}
                                        onChange={e => setDriveField("passingMarks", e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Shortlist Top N">
                                    <input type="number" min="0" value={drive.pipeline.shortlistCount}
                                        onChange={e => setPipelineField("shortlistCount", e.target.value)}
                                        placeholder="0 = all" className={inputCls} />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Eligibility ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-semibold mb-2">Eligibility Criteria</h2>
                            <p className="text-zinc-500 text-sm mb-6">Candidates not meeting these will be auto-rejected on application.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Min CGPA (0 = no limit)">
                                    <input type="number" step="0.1" min="0" max="10" value={eligibility.minCGPA}
                                        onChange={e => setEligibility(p => ({ ...p, minCGPA: e.target.value }))}
                                        placeholder="e.g. 7.5" className={inputCls} />
                                </Field>
                                <Field label="Passing Year (blank = any)">
                                    <input type="number" value={eligibility.passingYear}
                                        onChange={e => setEligibility(p => ({ ...p, passingYear: e.target.value }))}
                                        placeholder="e.g. 2025" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="Allowed Branches (comma-separated, blank = all)">
                                <input value={eligibility.branches}
                                    onChange={e => setEligibility(p => ({ ...p, branches: e.target.value }))}
                                    placeholder="CS, IT, ECE, EE" className={inputCls} />
                            </Field>

                            <Field label="Required Skills (comma-separated, blank = none)">
                                <input value={eligibility.skills}
                                    onChange={e => setEligibility(p => ({ ...p, skills: e.target.value }))}
                                    placeholder="JavaScript, DSA, Python" className={inputCls} />
                            </Field>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
                                💡 Leave fields blank to make the drive open to everyone.
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Questions ── */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Question Bank</h2>
                                <button onClick={addQuestion}
                                    className="flex items-center gap-2 text-sm px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 rounded-xl hover:bg-violet-600/30 transition">
                                    <Plus size={14} /> Add Question
                                </button>
                            </div>

                            {questions.map((q, idx) => (
                                <QuestionCard key={idx} q={q} idx={idx} onUpdate={setQ} onOptionUpdate={setOption} onRemove={removeQuestion} />
                            ))}
                        </div>
                    )}

                    {/* ── Step 4: Review ── */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-6">Review & Publish</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <ReviewCard title="Drive">
                                    <Row l="Title" v={drive.title} />
                                    <Row l="Company" v={drive.company || "—"} />
                                    <Row l="Deadline" v={drive.applicationDeadline ? new Date(drive.applicationDeadline).toLocaleDateString() : "—"} />
                                    <Row l="Duration" v={`${drive.examDuration} min`} />
                                    <Row l="Passing Marks" v={drive.passingMarks} />
                                    <Row l="Shortlist Top" v={drive.pipeline.shortlistCount || "All"} />
                                </ReviewCard>
                                <ReviewCard title="Eligibility">
                                    <Row l="Min CGPA" v={eligibility.minCGPA || "None"} />
                                    <Row l="Year" v={eligibility.passingYear || "Any"} />
                                    <Row l="Branches" v={eligibility.branches || "All"} />
                                    <Row l="Skills" v={eligibility.skills || "None"} />
                                </ReviewCard>
                            </div>

                            <ReviewCard title={`Questions (${questions.length})`}>
                                {questions.map((q, i) => (
                                    <div key={i} className="flex items-start justify-between py-2 border-b border-zinc-800 last:border-0">
                                        <div>
                                            <span className="text-xs text-zinc-500 mr-2">Q{i + 1}</span>
                                            <span className="text-sm">{q.questionText.slice(0, 60)}{q.questionText.length > 60 ? "..." : ""}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                q.type === "mcq" ? "bg-blue-500/20 text-blue-400" :
                                                q.type === "theory" ? "bg-amber-500/20 text-amber-400" :
                                                "bg-violet-500/20 text-violet-400"
                                            }`}>{q.type}</span>
                                            <span className="text-xs text-zinc-500">{q.fullScore} marks</span>
                                        </div>
                                    </div>
                                ))}
                            </ReviewCard>

                            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 text-sm text-zinc-400">
                                Clicking <strong className="text-white">Publish Drive</strong> will create the drive, save all questions, and make it visible to candidates immediately.
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex-1 border border-zinc-700 py-3 rounded-xl font-medium hover:bg-zinc-900 transition flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Back
                            </button>
                        )}

                        {step < 4 ? (
                            <button onClick={nextStep}
                                className="flex-1 bg-violet-600 py-3 rounded-xl font-semibold hover:bg-violet-500 transition flex items-center justify-center gap-2">
                                Continue <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button onClick={handleCreateDrive} disabled={loading}
                                className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-60">
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Publishing...</>
                                    : <><CheckCircle2 size={18} /> Publish Drive</>
                                }
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

// ── Question Card ──────────────────────────────────────────────────────────────
function QuestionCard({ q, idx, onUpdate, onOptionUpdate, onRemove }) {
    const [collapsed, setCollapsed] = useState(false)
    const total_qs = "Q" + (idx + 1)

    return (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500">{total_qs}</span>
                    <select value={q.type} onChange={e => onUpdate(idx, "type", e.target.value)}
                        className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 outline-none text-white">
                        <option value="mcq">MCQ</option>
                        <option value="theory">Theory</option>
                        <option value="coding">Coding</option>
                    </select>
                    <span className="text-xs text-zinc-600">
                        {q.questionText ? q.questionText.slice(0, 40) + (q.questionText.length > 40 ? "..." : "") : "Untitled question"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCollapsed(c => !c)} className="text-zinc-500 hover:text-white transition p-1">
                        <ChevronDown size={16} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => onRemove(idx)} className="text-red-500/60 hover:text-red-400 transition p-1">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div className="px-5 pb-5 space-y-4 border-t border-zinc-800">
                    <div className="pt-4">
                        <textarea rows={3} placeholder="Enter your question..." value={q.questionText}
                            onChange={e => onUpdate(idx, "questionText", e.target.value)}
                            className={inputCls + " resize-none"} />
                    </div>

                    {/* MCQ Options */}
                    {q.type === "mcq" && (
                        <div className="space-y-2">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Options</p>
                            {q.options.map((op, opIdx) => (
                                <div key={opIdx} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold cursor-pointer transition ${
                                        q.correctOption === opIdx
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : "border-zinc-700 text-zinc-600 hover:border-emerald-500/50"
                                    }`} onClick={() => onUpdate(idx, "correctOption", opIdx)}>
                                        {String.fromCharCode(65 + opIdx)}
                                    </div>
                                    <input type="text" placeholder={`Option ${String.fromCharCode(65 + opIdx)}`}
                                        value={op} onChange={e => onOptionUpdate(idx, opIdx, e.target.value)}
                                        className={inputCls + " flex-1"} />
                                </div>
                            ))}
                            <p className="text-xs text-zinc-600">Click the circle to mark the correct answer.</p>
                        </div>
                    )}

                    {/* Theory Sample Answer */}
                    {q.type === "theory" && (
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-2">Sample Answer</p>
                            <textarea rows={3} placeholder="Ideal answer / key points..."
                                value={q.sampleAnswer} onChange={e => onUpdate(idx, "sampleAnswer", e.target.value)}
                                className={inputCls + " resize-none"} />
                        </div>
                    )}

                    <Field label="Marks for this question">
                        <input type="number" min="1" placeholder="e.g. 10" value={q.fullScore}
                            onChange={e => onUpdate(idx, "fullScore", e.target.value)} className={inputCls + " w-32"} />
                    </Field>
                </div>
            )}
        </div>
    )
}

// ── Small components ───────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">{label}</label>
            {children}
        </div>
    )
}

function ReviewCard({ title, children }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">{title}</h3>
            <div className="space-y-1">{children}</div>
        </div>
    )
}

function Row({ l, v }) {
    return (
        <div className="flex justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
            <span className="text-xs text-zinc-500">{l}</span>
            <span className="text-xs text-white font-medium">{String(v)}</span>
        </div>
    )
}

const inputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition text-white"
