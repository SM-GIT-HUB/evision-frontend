import { useState } from "react"
import toast from "react-hot-toast"
import { BarChart2, ChevronDown, Loader2 } from "lucide-react"
import { getSelectionBoard, updateCandidateStatus } from "../api/selection-api"

const STATUS_COLORS = {
    pending:     "bg-zinc-800 text-zinc-400 border-zinc-700",
    shortlisted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    selected:    "bg-green-500/20 text-green-400 border-green-500/30",
    rejected:    "bg-red-500/20 text-red-400 border-red-500/30",
}

function SelectionSection({ exams })
{
    const [selectedExamId, setSelectedExamId] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null); // id of row being updated

    async function loadBoard(examId)
    {
        if (!examId) return;
        setSelectedExamId(examId);
        setLoading(true);
        try {
            const res = await getSelectionBoard(examId);
            setCandidates(res.data || []);
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Failed to load selection board");
        }
        finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(selectionId, status)
    {
        setUpdating(selectionId);
        try {
            await updateCandidateStatus(selectionId, { status });
            setCandidates(prev =>
                prev.map(c => c._id === selectionId ? { ...c, status } : c)
            );
            toast.success(`Status updated to "${status}"`);
        }
        catch(err) {
            toast.error(err.response?.data?.message || "Update failed");
        }
        finally {
            setUpdating(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart2 size={20} className="text-yellow-400" />
                    Selection Board
                </h2>

                <select
                    id="selection-exam-picker"
                    className="bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-2 rounded-xl outline-none cursor-pointer"
                    value={selectedExamId}
                    onChange={(e) => loadBoard(e.target.value)}
                >
                    <option value="">— Pick an exam —</option>
                    {exams.map(exam => (
                        <option key={exam._id} value={exam._id}>
                            {exam.title}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedExamId && (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-sm">
                    Select an exam above to view candidates and manage their selection status.
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-zinc-500" />
                </div>
            )}

            {!loading && selectedExamId && candidates.length === 0 && (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-sm">
                    No submissions yet for this exam.
                </div>
            )}

            {!loading && candidates.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950">
                                <th className="text-left px-5 py-3 text-zinc-400 font-medium">Rank</th>
                                <th className="text-left px-5 py-3 text-zinc-400 font-medium">Candidate</th>
                                <th className="text-center px-5 py-3 text-zinc-400 font-medium">Exam Score</th>
                                <th className="text-center px-5 py-3 text-zinc-400 font-medium">Interview Score</th>
                                <th className="text-center px-5 py-3 text-zinc-400 font-medium">Total</th>
                                <th className="text-center px-5 py-3 text-zinc-400 font-medium">Status</th>
                                <th className="text-center px-5 py-3 text-zinc-400 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((c, idx) => (
                                <tr
                                    key={c._id}
                                    className="border-b border-zinc-900 hover:bg-zinc-950/50 transition"
                                >
                                    <td className="px-5 py-4 text-zinc-400 font-mono">#{idx + 1}</td>
                                    <td className="px-5 py-4">
                                        <div className="font-medium">{c.candidateId?.name || "—"}</div>
                                        <div className="text-zinc-500 text-xs">{c.candidateEmail}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center font-mono">{c.assessmentScore ?? "—"}</td>
                                    <td className="px-5 py-4 text-center font-mono">
                                        {c.interviewScore != null ? c.interviewScore : <span className="text-zinc-600">—</span>}
                                    </td>
                                    <td className="px-5 py-4 text-center font-mono font-semibold">{c.totalScore}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[c.status]}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="relative inline-block">
                                            {updating === c._id ? (
                                                <Loader2 size={16} className="animate-spin text-zinc-500 mx-auto" />
                                            ) : (
                                                <select
                                                    className="bg-zinc-900 border border-zinc-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none cursor-pointer appearance-none pr-6"
                                                    value={c.status}
                                                    onChange={(e) => handleStatusChange(c._id, e.target.value)}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="selected">Selected ✓</option>
                                                    <option value="rejected">Rejected ✗</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default SelectionSection
