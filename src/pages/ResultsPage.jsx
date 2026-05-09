import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { ArrowLeft, Trophy, Medal, Award, BarChart2, Video } from "lucide-react"

import { getResults } from "../api/exam-api"
import { getSelectionBoard } from "../api/selection-api"
import useAuthStore from "../store/auth-store"
import LoadingSpinner from "../components/LoadingSpinner"

const RANK_META = [
    { icon: Trophy, cls: "text-yellow-400" },   // #1
    { icon: Medal,  cls: "text-zinc-300" },      // #2
    { icon: Award,  cls: "text-orange-400" },    // #3
]

function ResultsPage()
{
    const { id: examId } = useParams();
    const navigate       = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [results,   setResults]   = useState([]);
    const [selection, setSelection] = useState([]); // examiner view: selection board
    const [loading,   setLoading]   = useState(true);
    const [tab,       setTab]       = useState("scores"); // scores | selection

    const isExaminer = user?.role === "examiner";

    useEffect(() => {
        async function fetchAll()
        {
            try {
                const [resRes, selRes] = await Promise.allSettled([
                    getResults(examId),
                    isExaminer ? getSelectionBoard(examId) : Promise.resolve(null)
                ]);

                if (resRes.status === "fulfilled") {
                    setResults(resRes.value.data || []);
                }

                if (selRes.status === "fulfilled" && selRes.value) {
                    setSelection(selRes.value.data || []);
                }
            }
            catch(err) {
                toast.error(err.response?.data?.message || "Failed to fetch results");
            }
            finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, [examId, isExaminer])

    if (!isAuthenticated)  return <Navigate to="/" replace />;
    if (loading)           return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Exam Results</h1>
                        <p className="text-zinc-400 mt-2">
                            {results.length} candidate{results.length !== 1 ? "s" : ""} submitted
                        </p>
                    </div>

                    {isExaminer && (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                            <TabBtn label="Scores"           value="scores"    active={tab === "scores"}    onClick={() => setTab("scores")}    icon={<BarChart2 size={14} />} />
                            <TabBtn label="Selection Board"  value="selection" active={tab === "selection"} onClick={() => setTab("selection")} icon={<Video size={14} />} />
                        </div>
                    )}
                </div>

                {/* Scores Tab */}
                {tab === "scores" && (
                    <>
                        {results.length === 0 ? (
                            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                                No submissions yet for this exam.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {results.map((result, index) => {
                                    const rankMeta = RANK_META[index];
                                    const RankIcon = rankMeta?.icon;

                                    return (
                                        <div
                                            key={result._id || index}
                                            className={`
                                                border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition
                                                ${index === 0
                                                    ? "border-yellow-500/30 bg-yellow-500/5"
                                                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                                                }
                                            `}
                                        >
                                            {/* Rank */}
                                            <div className="w-10 flex-shrink-0 text-center">
                                                {RankIcon ? (
                                                    <RankIcon size={22} className={rankMeta.cls} />
                                                ) : (
                                                    <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
                                                )}
                                            </div>

                                            {/* Candidate */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{result.email}</p>
                                                {result.submittedAt && (
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        Submitted: {new Date(result.submittedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Score */}
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-2xl font-bold ${index === 0 ? "text-yellow-400" : "text-white"}`}>
                                                    {result.totalScore}
                                                </p>
                                                {result.fullMarks > 0 && (
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        / {result.fullMarks} marks
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Selection Board Tab (examiner) */}
                {tab === "selection" && isExaminer && (
                    <>
                        {selection.length === 0 ? (
                            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                                No selection data yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 text-left">
                                            <th className="px-5 py-3 font-medium">Rank</th>
                                            <th className="px-5 py-3 font-medium">Candidate</th>
                                            <th className="px-5 py-3 font-medium text-center">Exam</th>
                                            <th className="px-5 py-3 font-medium text-center">Interview</th>
                                            <th className="px-5 py-3 font-medium text-center">Total</th>
                                            <th className="px-5 py-3 font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selection.map((c, idx) => (
                                            <tr key={c._id} className="border-b border-zinc-900 hover:bg-zinc-950/50">
                                                <td className="px-5 py-4 text-zinc-500 font-mono">#{idx + 1}</td>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium">{c.candidateId?.name || "—"}</p>
                                                    <p className="text-xs text-zinc-500">{c.candidateEmail}</p>
                                                </td>
                                                <td className="px-5 py-4 text-center font-mono">{c.assessmentScore ?? "—"}</td>
                                                <td className="px-5 py-4 text-center font-mono">{c.interviewScore ?? "—"}</td>
                                                <td className="px-5 py-4 text-center font-mono font-semibold">{c.totalScore}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <StatusBadge status={c.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status })
{
    const map = {
        pending:     "bg-zinc-800 text-zinc-400 border-zinc-700",
        shortlisted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        selected:    "bg-green-500/20 text-green-400 border-green-500/30",
        rejected:    "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] || map.pending}`}>
            {status}
        </span>
    );
}

function TabBtn({ label, active, onClick, icon })
{
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
                ${active
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

export default ResultsPage