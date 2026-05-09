import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"

import useAuthStore from "../store/auth-store"
import { editExam } from "../api/exam-api"

const EMPTY_QUESTION = (type = "mcq") => ({
    type,
    questionText: "",
    options: ["", "", "", ""],
    correctOption: "",
    sampleAnswer: "",
    fullScore: ""
})

function EditExamPage()
{
    const navigate = useNavigate();
    const { id } = useParams();

    const { isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(false);

    const [selectedType, setSelectedType] = useState("change-time");

    const [timeData, setTimeData] = useState({
        startTime: "",
        endTime: ""
    })

    const [candidateData, setCandidateData] = useState("");

    const storageKey = `edit_exam_questions_${id}`;

    const [questions, setQuestions] = useState(() => {
        const existing = localStorage.getItem(storageKey);

        if (existing) {
            return JSON.parse(existing);
        }

        return [EMPTY_QUESTION()];
    })

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(questions));
    }, [questions, storageKey])

    function validateEmails(emails)
    {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emails.every(email => emailRegex.test(email));
    }

    function isQuestionEmpty(q)
    {
        return (
            !q.questionText &&
            !q.sampleAnswer &&
            !q.correctOption &&
            !q.fullScore &&
            q.options.every(op => !op)
        );
    }

    function ensureLastEmpty(updated)
    {
        const last = updated[updated.length - 1];

        const hasContent =
            last.questionText ||
            last.sampleAnswer ||
            last.correctOption ||
            last.fullScore ||
            last.options.some(op => op);

        if (hasContent)
        {
            updated.push(
                EMPTY_QUESTION(last.type)
            )
        }

        return updated;
    }

    function handleQuestionChange(index, field, value)
    {
        let updated = [...questions];

        updated[index][field] = value;

        updated = updated.filter((q, idx) => {
            if (idx === updated.length - 1) {
                return true;
            }

            return !isQuestionEmpty(q);
        })

        setQuestions(ensureLastEmpty(updated));
    }

    function handleOptionChange(questionIndex, optionIndex, value)
    {
        let updated = [...questions];

        updated[questionIndex].options[optionIndex] = value;

        updated = updated.filter((q, idx) => {
            if (idx === updated.length - 1) {
                return true;
            }

            return !isQuestionEmpty(q);
        })

        setQuestions(ensureLastEmpty(updated));
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleChangeTime()
    {
        try {
            const { startTime, endTime } = timeData;

            if (!startTime || !endTime) {
                return toast.error("All fields required");
            }

            if (new Date(startTime) < new Date()) {
                return toast.error("Start time must be future");
            }

            if (new Date(startTime) >= new Date(endTime)) {
                return toast.error("End time must be after start time");
            }

            setLoading(true);

            await editExam(id, {
                type: "change-time",
                startTime,
                endTime
            })

            toast.success("Schedule updated");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed");
        }
        finally {
            setLoading(false);
        }
    }

    async function handleAddCandidates()
    {
        try {
            const emails = candidateData
                .split(/[\s,]+/)
                .map(e => e.trim())
                .filter(Boolean);

            if (emails.length === 0) {
                return toast.error("Please enter emails");
            }

            if (!validateEmails(emails)) {
                return toast.error("Invalid email format");
            }

            setLoading(true);

            await editExam(id, {
                type: "add-candidates",
                eligibleCandidates: candidateData
            })

            toast.success("Candidates added");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed");
        }
        finally {
            setLoading(false);
        }
    }

    async function handleAddQuestions()
    {
        try {
            const filtered = questions.filter(q => q.questionText.trim());

            if (filtered.length === 0) {
                return toast.error("Please add at least one question");
            }

            for (const q of filtered)
            {
                if (!q.questionText || !q.fullScore) {
                    return toast.error("Question text and full score required");
                }

                if (q.type === "mcq")
                {
                    if (q.options.some(op => !op.trim())) {
                        return toast.error("All MCQ options required");
                    }

                    if (
                        q.correctOption === "" ||
                        Number(q.correctOption) < 0 ||
                        Number(q.correctOption) > 3
                    ) {
                        return toast.error("Correct option must be between 0 and 3");
                    }
                }

                if (q.type === "theory")
                {
                    if (!q.sampleAnswer.trim()) {
                        return toast.error("Sample answer required");
                    }
                }
            }

            setLoading(true);

            await editExam(id, {
                type: "add-question",
                questions: filtered.map(q => ({
                    type: q.type,
                    questionText: q.questionText,
                    options: q.type === "mcq" ? q.options : undefined,
                    correctOption: q.type === "mcq"
                        ? Number(q.correctOption)
                        : undefined,
                    sampleAnswer: q.type === "theory"
                        ? q.sampleAnswer
                        : undefined,
                    fullScore: Number(q.fullScore)
                }))
            })

            localStorage.removeItem(storageKey);

            toast.success("Questions added");
            navigate("/");
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">

            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
                >
                    ← Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-6">
                    Edit Exam
                </h1>

                <div className="flex gap-2 flex-wrap border-b border-zinc-800 pb-1 mb-8">

                    {[
                        { key: "change-time",     label: "📅 Change Schedule" },
                        { key: "add-candidates",  label: "👥 Add Candidates" },
                        { key: "add-question",    label: "❓ Add Questions" }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setSelectedType(key)}
                            className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition
                                ${
                                    selectedType === key
                                    ? "border-white text-white"
                                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            {label}
                        </button>
                    ))}

                </div>

                {
                    selectedType === "change-time" &&
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-5">
                        <h2 className="text-lg font-semibold mb-4">Update Schedule</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 uppercase tracking-wide block mb-2">New Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600 transition"
                                    value={timeData.startTime}
                                    onChange={(e) => setTimeData({ ...timeData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 uppercase tracking-wide block mb-2">New End Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600 transition"
                                    value={timeData.endTime}
                                    onChange={(e) => setTimeData({ ...timeData, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleChangeTime}
                            disabled={loading}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition disabled:opacity-60"
                        >
                            {loading ? "Updating..." : "Update Schedule"}
                        </button>
                    </div>
                }

                {
                    selectedType === "add-candidates" &&
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
                        <h2 className="text-lg font-semibold mb-4">Add New Candidates</h2>

                        <textarea
                            rows={6}
                            placeholder="alice@example.com, bob@example.com"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none focus:border-zinc-600 transition"
                            value={candidateData}
                            onChange={(e) => setCandidateData(e.target.value)}
                        />

                        <p className="text-zinc-500 text-xs mt-2">
                            Existing candidates won't receive duplicate emails.
                        </p>

                        <button
                            onClick={handleAddCandidates}
                            disabled={loading}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold mt-5 hover:bg-zinc-200 transition disabled:opacity-60"
                        >
                            {loading ? "Adding..." : "Add Candidates"}
                        </button>
                    </div>
                }

                {
                    selectedType === "add-question" &&
                    <div className="mt-10 space-y-8">

                        {
                            questions.map((q, index) => (

                                <div
                                    key={index}
                                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
                                >

                                    <div className="flex items-center justify-between">

                                        <h2 className="text-lg font-semibold">
                                            Question {index + 1}
                                        </h2>

                                        <select
                                            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 outline-none"
                                            value={q.type}
                                            onChange={(e) => handleQuestionChange(
                                                index,
                                                "type",
                                                e.target.value
                                            )}
                                        >
                                            <option value="mcq">mcq</option>
                                            <option value="theory">theory</option>
                                            <option value="coding">coding</option>
                                        </select>

                                    </div>

                                    <div className="mt-4 space-y-3">

                                        <textarea
                                            rows={3}
                                            placeholder="Question Text"
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
                                            value={q.questionText}
                                            onChange={(e) => handleQuestionChange(
                                                index,
                                                "questionText",
                                                e.target.value
                                            )}
                                        />

                                        <input
                                            type="number"
                                            placeholder="Full Score"
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                            value={q.fullScore}
                                            onChange={(e) => handleQuestionChange(
                                                index,
                                                "fullScore",
                                                e.target.value
                                            )}
                                        />

                                        {
                                            q.type === "mcq" &&
                                            <div className="space-y-4">

                                                {
                                                    q.options.map((op, opIndex) => (

                                                        <input
                                                            key={opIndex}
                                                            type="text"
                                                            placeholder={`Option ${opIndex}`}
                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                                            value={op}
                                                            onChange={(e) => handleOptionChange(
                                                                index,
                                                                opIndex,
                                                                e.target.value
                                                            )}
                                                        />
                                                    ))
                                                }

                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={3}
                                                    placeholder="Choose correct answer index (0 to 3)"
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
                                                    value={q.correctOption}
                                                    onChange={(e) => handleQuestionChange(
                                                        index,
                                                        "correctOption",
                                                        e.target.value
                                                    )}
                                                />

                                            </div>
                                        }

                                        {
                                            q.type === "theory" &&
                                            <textarea
                                                rows={4}
                                                placeholder="Sample Answer"
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none resize-none"
                                                value={q.sampleAnswer}
                                                onChange={(e) => handleQuestionChange(
                                                    index,
                                                    "sampleAnswer",
                                                    e.target.value
                                                )}
                                            />
                                        }

                                    </div>

                                </div>
                            ))
                        }

                        <button
                            onClick={handleAddQuestions}
                            disabled={loading}
                            className="w-full bg-white text-black py-4 rounded-2xl font-semibold"
                        >
                            {
                                loading ? "Submitting..." : "Submit Questions"
                            }
                        </button>

                    </div>
                }

            </div>

        </div>
    )
}

export default EditExamPage