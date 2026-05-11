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
        <div className="
            min-h-screen
            bg-black
            text-white
            px-5 py-6
        ">

            <div className="max-w-4xl mx-auto">

                <div className="flex items-center gap-4">

                    <div className="
                        w-12 h-12
                        rounded-2xl
                        bg-violet-500/10
                        border border-violet-500/20
                        flex items-center justify-center
                    ">
                        <div className="
                            w-4 h-4
                            rounded-lg
                            bg-violet-400
                        " />
                    </div>

                    <div>

                        <h1 className="
                            text-3xl
                            font-bold
                            tracking-tight
                        ">
                            Edit Examination
                        </h1>

                        <p className="
                            text-sm
                            text-zinc-500
                            mt-1
                        ">
                            Manage schedules, candidates and questions.
                        </p>

                    </div>

                </div>

                <div className="
                    mt-8
                    inline-flex
                    items-center
                    gap-2
                    bg-zinc-950
                    border border-zinc-800
                    rounded-2xl
                    p-1.5
                ">
                    {
                        ["change-time", "add-candidates", "add-question"]
                        .map(type => (

                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`
                                    px-4 py-2
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    transition-all
                                    capitalize
                                    ${
                                        selectedType === type
                                        ?
                                        "bg-white text-black"
                                        :
                                        "text-zinc-400 hover:text-white"
                                    }
                                `}
                            >
                                {type.replace("-", " ")}
                            </button>
                        ))
                    }
                </div>

                {
                    selectedType === "change-time" &&
                    <div className="
                        mt-10
                        bg-[#09090B]
                        border border-zinc-800/80
                        rounded-2xl
                        p-5
                        space-y-4
                    ">

                        <input
                            type="datetime-local"
                            className="
                                w-full
                                bg-black
                                border border-zinc-800
                                rounded-xl
                                px-4 py-3
                                outline-none
                                text-zinc-200
                                focus:border-violet-500/60
                                transition
                            "
                            value={timeData.startTime}
                            onChange={(e) => setTimeData({
                                ...timeData,
                                startTime: e.target.value
                            })}
                        />

                        <input
                            type="datetime-local"
                            className="
                                w-full
                                bg-black
                                border border-zinc-800
                                rounded-xl
                                px-4 py-3
                                outline-none
                                text-zinc-200
                                focus:border-violet-500/60
                                transition
                            "
                            value={timeData.endTime}
                            onChange={(e) => setTimeData({
                                ...timeData,
                                endTime: e.target.value
                            })}
                        />

                        <button
                            onClick={handleChangeTime}
                            disabled={loading}
                            className="
                                w-full
                                bg-violet-500
                                hover:bg-violet-400
                                text-white
                                py-4
                                rounded-xl
                                font-semibold
                                transition
                            "
                        >
                            {
                                loading ? "Updating..." : "Update Schedule"
                            }
                        </button>

                    </div>
                }

                {
                    selectedType === "add-candidates" &&
                    <div className="
                        mt-10
                        bg-[#09090B]
                        border border-zinc-800/80
                        rounded-2xl
                        p-5
                    ">

                        <textarea
                            rows={4}
                            placeholder="a@gmail.com, b@gmail.com"
                            className="
                                w-full
                                bg-black
                                border border-zinc-800
                                rounded-xl
                                px-4 py-3
                                outline-none
                                resize-none
                                focus:border-emerald-500/60
                                transition
                            "
                            value={candidateData}
                            onChange={(e) => setCandidateData(e.target.value)}
                        />

                        <p className="text-zinc-500 text-sm mt-2">
                            Enter emails separated by commas.
                        </p>

                        <button
                            onClick={handleAddCandidates}
                            disabled={loading}
                            className="
                                w-full
                                bg-emerald-500
                                hover:bg-emerald-400
                                text-black
                                py-4
                                rounded-xl
                                font-semibold
                                mt-6
                                transition
                            "
                        >
                            {
                                loading ? "Adding..." : "Add Candidates"
                            }
                        </button>

                    </div>
                }

                {
                    selectedType === "add-question" &&
                    <div className="mt-10 space-y-7">

                        {
                            questions.map((q, index) => (

                                <div
                                    key={index}
                                    className="
                                        bg-[#09090B]
                                        border border-zinc-800/80
                                        rounded-2xl
                                        p-5
                                    "
                                >

                                    <div className="
                                        flex items-center justify-between
                                        gap-4
                                    ">

                                        <div>

                                            <p className="
                                                text-zinc-500
                                                text-sm
                                                mb-1
                                            ">
                                                Question
                                            </p>

                                            <h2 className="
                                                text-xl
                                                font-bold
                                                tracking-tight
                                            ">
                                                {index + 1}
                                            </h2>

                                        </div>

                                        <select
                                            className="
                                                bg-black
                                                border border-zinc-800
                                                rounded-xl
                                                px-5 py-3
                                                outline-none
                                                text-zinc-200
                                            "
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

                                    <div className="mt-7 space-y-5">

                                        <textarea
                                            rows={4}
                                            placeholder="Question Text"
                                            className="
                                                w-full
                                                bg-black
                                                border border-zinc-800
                                                rounded-xl
                                                px-4 py-3
                                                outline-none
                                                resize-none
                                                text-zinc-200
                                                focus:border-blue-500/60
                                                transition
                                            "
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
                                            className="
                                                w-full
                                                bg-black
                                                border border-zinc-800
                                                rounded-xl
                                                px-4 py-3
                                                outline-none
                                                text-zinc-200
                                                focus:border-blue-500/60
                                                transition
                                            "
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
                                                            placeholder={`Option ${opIndex + 1}`}
                                                            className="
                                                                w-full
                                                                bg-black
                                                                border border-zinc-800
                                                                rounded-xl
                                                                px-4 py-3
                                                                outline-none
                                                                text-zinc-200
                                                                focus:border-blue-500/60
                                                                transition
                                                            "
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
                                                    placeholder="Correct Option Index (0 - 3)"
                                                    className="
                                                        w-full
                                                        bg-black
                                                        border border-zinc-800
                                                        rounded-xl
                                                        px-4 py-3
                                                        outline-none
                                                        text-zinc-200
                                                        focus:border-blue-500/60
                                                        transition
                                                    "
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
                                                className="
                                                    w-full
                                                    bg-black
                                                    border border-zinc-800
                                                    rounded-xl
                                                    px-4 py-3
                                                    outline-none
                                                    resize-none
                                                    text-zinc-200
                                                    focus:border-blue-500/60
                                                    transition
                                                "
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
                            className="
                                w-full
                                bg-blue-500
                                hover:bg-blue-400
                                text-white
                                py-3
                                rounded-xl
                                text-base
                                font-semibold
                                transition-all
                            "
                        >
                            {
                                loading
                                ? "Submitting..."
                                : "Submit Questions"
                            }
                        </button>

                    </div>
                }

            </div>

        </div>
    )
}

export default EditExamPage