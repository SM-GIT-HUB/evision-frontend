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
    fullScore: "",
    // Coding specific
    difficulty: "Medium",
    examples: [{ input: "", output: "", explanation: "" }],
    testCases: [{ input: "", expected: "" }],
    hints: [""],
    starterCode: { javascript: "", python: "", java: "", cpp: "" }
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

    function setCodingArray(qIdx, field, subIdx, subField, value) {
        setQuestions(prev => {
            const updated = [...prev]
            const arr = [...updated[qIdx][field]]
            if (subField === null) {
                arr[subIdx] = value
            } else {
                arr[subIdx] = { ...arr[subIdx], [subField]: value }
            }
            updated[qIdx] = { ...updated[qIdx], [field]: arr }
            return updated
        })
    }

    function addCodingArrayItem(qIdx, field, emptyObj) {
        setQuestions(prev => {
            const updated = [...prev]
            updated[qIdx] = { ...updated[qIdx], [field]: [...updated[qIdx][field], emptyObj] }
            return updated
        })
    }

    function removeCodingArrayItem(qIdx, field, subIdx) {
        setQuestions(prev => {
            const updated = [...prev]
            if (updated[qIdx][field].length <= 1) return prev
            updated[qIdx] = { ...updated[qIdx], [field]: updated[qIdx][field].filter((_, i) => i !== subIdx) }
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
                if (q.type === "coding") {
                    if (!q.difficulty) return toast.error(`Question ${i + 1}: difficulty is required`)
                    if (q.examples.some(ex => !ex.input.trim() || !ex.output.trim())) {
                        return toast.error(`Question ${i + 1}: all examples must have input and output`)
                    }
                    if (q.testCases.some(tc => !tc.input.trim() || !tc.expected.trim())) {
                        return toast.error(`Question ${i + 1}: all test cases must have input and expected output`)
                    }
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
                sampleAnswer: q.type === "theory" ? q.sampleAnswer.trim() : undefined,
                difficulty: q.type === "coding" ? q.difficulty : undefined,
                examples: q.type === "coding" ? q.examples.filter(e => e.input && e.output) : undefined,
                testCases: q.type === "coding" ? q.testCases.filter(t => t.input && t.expected) : undefined,
                hints: q.type === "coding" ? q.hints.filter(h => h.trim()) : undefined,
                starterCode: q.type === "coding" ? q.starterCode : undefined
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
        <div style={{ padding: "32px 36px", maxWidth: 760, margin: "0 auto" }}>

            <button onClick={() => navigate("/my-drives")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"var(--text-2)", fontSize:13, cursor:"pointer", marginBottom:20, padding:0 }}>
                <ArrowLeft size={15} /> My Drives
            </button>

            <h1 style={{ fontSize:24, fontWeight:700, margin:"0 0 4px" }}>Create a New Drive</h1>
            <p style={{ color:"var(--text-3)", fontSize:13.5, margin:"0 0 28px" }}>Set up your hiring drive — eligibility, questions, and pipeline config.</p>

            {/* Step Progress */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28 }}>
                    {STEPS.map((s, i) => {
                        const Icon = s.icon
                        const active = step === s.id
                        const done = step > s.id
                        return (
                            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
                                <div style={{
                                    display:"flex", alignItems:"center", gap:6,
                                    padding:"6px 12px", borderRadius:9,
                                    fontSize:12, fontWeight:600, whiteSpace:"nowrap",
                                    background: active ? "var(--primary)" : done ? "rgba(5,150,105,0.15)" : "var(--card)",
                                    color: active ? "white" : done ? "#6ee7b7" : "var(--text-3)",
                                    border: `1px solid ${active ? "transparent" : done ? "rgba(5,150,105,0.3)" : "var(--border)"}`
                                }}>
                                    {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                                    {s.label}
                                </div>
                                {i < STEPS.length - 1 && <div style={{ flex:1, height:1, background: done ? "rgba(5,150,105,0.3)" : "var(--border)" }} />}
                            </div>
                        )
                    })}
                </div>

            <div className="card">

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

                            <div style={{ background:"rgba(124,58,237,0.05)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"var(--text-3)" }}>
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
                                <QuestionCard 
                                    key={idx} q={q} idx={idx} onUpdate={setQ} onOptionUpdate={setOption} onRemove={removeQuestion}
                                    setCodingArray={setCodingArray} addCodingArrayItem={addCodingArrayItem} removeCodingArrayItem={removeCodingArrayItem}
                                />
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

                            <div style={{ background:"rgba(124,58,237,0.05)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"var(--text-3)" }}>
                                Clicking <strong style={{ color:"var(--text-1)" }}>Publish Drive</strong> will create the drive, save all questions, and make it visible to candidates immediately.
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{ display:"flex", gap:10, marginTop:28 }}>
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" style={{ flex:1, justifyContent:"center", padding:"11px 0" }}>
                                <ArrowLeft size={15} /> Back
                            </button>
                        )}

                        {step < 4 ? (
                            <button onClick={nextStep} className="btn btn-primary" style={{ flex:1, justifyContent:"center", padding:"11px 0", fontSize:14 }}>
                                Continue <ArrowRight size={15} />
                            </button>
                        ) : (
                            <button onClick={handleCreateDrive} disabled={loading} className="btn" style={{ flex:1, justifyContent:"center", padding:"11px 0", fontSize:14, background:"white", color:"black", opacity: loading ? 0.6 : 1 }}>
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <><CheckCircle2 size={16} /> Publish Drive</>}
                            </button>
                        )}
                    </div>
                </div>

        </div>
    )
}

// ── Question Card ──────────────────────────────────────────────────────────────
function QuestionCard({ 
    q, idx, onUpdate, onOptionUpdate, onRemove,
    setCodingArray, addCodingArrayItem, removeCodingArrayItem 
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div style={{ border:"1px solid var(--border)", borderRadius:12, background:"rgba(255,255,255,0.01)", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--text-3)" }}>Q{idx+1}</span>
                    <select value={q.type} onChange={e => onUpdate(idx, "type", e.target.value)}
                        style={{ fontSize:12, background:"var(--card)", border:"1px solid var(--border)", borderRadius:7, padding:"3px 8px", color:"var(--text-1)", outline:"none" }}>
                        <option value="mcq">MCQ</option>
                        <option value="theory">Theory</option>
                        <option value="coding">Coding</option>
                    </select>
                    <span style={{ fontSize:12, color:"var(--text-3)" }}>
                        {q.questionText ? q.questionText.slice(0,40) + (q.questionText.length > 40 ? "..." : "") : "Untitled question"}
                    </span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setCollapsed(c => !c)} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", padding:4 }}>
                        <ChevronDown size={16} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition:"transform 0.2s" }} />
                    </button>
                    <button onClick={() => onRemove(idx)} style={{ background:"none", border:"none", color:"rgba(239,68,68,0.5)", cursor:"pointer", padding:4 }}>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div style={{ padding:"0 18px 18px", borderTop:"1px solid var(--border)" }}>
                    <textarea rows={3} placeholder="Enter your question..." value={q.questionText}
                        onChange={e => onUpdate(idx, "questionText", e.target.value)}
                        className={inputCls + " resize-none"} style={{ marginTop:14 }} />

                    {q.type === "mcq" && (
                        <div style={{ marginTop:14 }}>
                            <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px", fontWeight:600 }}>Options</p>
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                {q.options.map((op, opIdx) => (
                                    <div key={opIdx} style={{ display:"flex", alignItems:"center", gap:10 }}>
                                        <div onClick={() => onUpdate(idx, "correctOption", opIdx)}
                                            style={{
                                                width:26, height:26, borderRadius:"50%", flexShrink:0, cursor:"pointer",
                                                display:"flex", alignItems:"center", justifyContent:"center",
                                                fontSize:11, fontWeight:700, transition:"all 0.15s",
                                                border: `2px solid ${q.correctOption === opIdx ? "#059669" : "#3f3f46"}`,
                                                background: q.correctOption === opIdx ? "#059669" : "transparent",
                                                color: q.correctOption === opIdx ? "white" : "#52525b"
                                            }}>
                                            {String.fromCharCode(65 + opIdx)}
                                        </div>
                                        <input type="text" placeholder={`Option ${String.fromCharCode(65 + opIdx)}`}
                                            value={op} onChange={e => onOptionUpdate(idx, opIdx, e.target.value)}
                                            className={inputCls} style={{ flex:1 }} />
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize:11, color:"var(--text-3)", marginTop:8 }}>Click the circle to mark the correct answer.</p>
                        </div>
                    )}

                    {q.type === "theory" && (
                        <div style={{ marginTop:14 }}>
                            <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px", fontWeight:600 }}>Sample Answer</p>
                            <textarea rows={3} placeholder="Ideal answer / key points..."
                                value={q.sampleAnswer} onChange={e => onUpdate(idx, "sampleAnswer", e.target.value)}
                                className={inputCls + " resize-none"} />
                        </div>
                    )}

                    {q.type === "coding" && (
                        <div style={{ marginTop:14, display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px", fontWeight:600 }}>Difficulty</p>
                                <select value={q.difficulty} onChange={e => onUpdate(idx, "difficulty", e.target.value)} className={inputCls} style={{ width: 140 }}>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin: 0, fontWeight:600 }}>Examples</p>
                                    <button onClick={() => addCodingArrayItem(idx, "examples", { input: "", output: "", explanation: "" })} className="text-[10px] text-violet-400 font-bold hover:underline">+ Add Example</button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {q.examples.map((ex, exIdx) => (
                                        <div key={exIdx} style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>Example {exIdx + 1}</span>
                                                <button onClick={() => removeCodingArrayItem(idx, "examples", exIdx)} className="text-red-500/50 hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                <input placeholder="Input" value={ex.input} onChange={e => setCodingArray(idx, "examples", exIdx, "input", e.target.value)} className={inputCls} />
                                                <input placeholder="Output" value={ex.output} onChange={e => setCodingArray(idx, "examples", exIdx, "output", e.target.value)} className={inputCls} />
                                                <input placeholder="Explanation (Optional)" value={ex.explanation} onChange={e => setCodingArray(idx, "examples", exIdx, "explanation", e.target.value)} className={inputCls} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin: 0, fontWeight:600 }}>Hidden Test Cases</p>
                                    <button onClick={() => addCodingArrayItem(idx, "testCases", { input: "", expected: "" })} className="text-[10px] text-violet-400 font-bold hover:underline">+ Add Test Case</button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {q.testCases.map((tc, tcIdx) => (
                                        <div key={tcIdx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <input placeholder="Input" value={tc.input} onChange={e => setCodingArray(idx, "testCases", tcIdx, "input", e.target.value)} className={inputCls} style={{ flex: 1 }} />
                                            <input placeholder="Expected Output" value={tc.expected} onChange={e => setCodingArray(idx, "testCases", tcIdx, "expected", e.target.value)} className={inputCls} style={{ flex: 1 }} />
                                            <button onClick={() => removeCodingArrayItem(idx, "testCases", tcIdx)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <p style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin: 0, fontWeight:600 }}>Hints</p>
                                    <button onClick={() => addCodingArrayItem(idx, "hints", "")} className="text-[10px] text-violet-400 font-bold hover:underline">+ Add Hint</button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {q.hints.map((hint, hIdx) => (
                                        <div key={hIdx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <input placeholder={`Hint ${hIdx + 1}`} value={hint} onChange={e => setCodingArray(idx, "hints", hIdx, null, e.target.value)} className={inputCls} style={{ flex: 1 }} />
                                            <button onClick={() => removeCodingArrayItem(idx, "hints", hIdx)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop:14 }}>
                        <label style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, display:"block", marginBottom:6 }}>Marks</label>
                        <input type="number" min="1" placeholder="e.g. 10" value={q.fullScore}
                            onChange={e => onUpdate(idx, "fullScore", e.target.value)} className={inputCls} style={{ width:120 }} />
                    </div>
                </div>
            )}
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{label}</label>
            {children}
        </div>
    )
}

function ReviewCard({ title, children }) {
    return (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:18 }}>
            <h3 style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 14px" }}>{title}</h3>
            <div>{children}</div>
        </div>
    )
}

function Row({ l, v }) {
    return (
        <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid var(--border)" }}>
            <span style={{ fontSize:12.5, color:"var(--text-3)" }}>{l}</span>
            <span style={{ fontSize:12.5, color:"var(--text-1)", fontWeight:600 }}>{String(v)}</span>
        </div>
    )
}

const inputCls = "field-input"
