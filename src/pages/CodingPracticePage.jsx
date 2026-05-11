import { Code2, ExternalLink } from "lucide-react"

const PROBLEMS = [
    { title: "Two Sum",             difficulty: "Easy",   topic: "Arrays",       link: "https://leetcode.com/problems/two-sum/" },
    { title: "Binary Search",       difficulty: "Easy",   topic: "Search",       link: "https://leetcode.com/problems/binary-search/" },
    { title: "Valid Parentheses",   difficulty: "Easy",   topic: "Stack",        link: "https://leetcode.com/problems/valid-parentheses/" },
    { title: "Merge Intervals",     difficulty: "Medium", topic: "Arrays",       link: "https://leetcode.com/problems/merge-intervals/" },
    { title: "LRU Cache",           difficulty: "Medium", topic: "Design",       link: "https://leetcode.com/problems/lru-cache/" },
    { title: "Longest Substring",   difficulty: "Medium", topic: "Sliding Win",  link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { title: "Word Search",         difficulty: "Medium", topic: "Backtracking", link: "https://leetcode.com/problems/word-search/" },
    { title: "Trapping Rain Water", difficulty: "Hard",   topic: "Two Pointers", link: "https://leetcode.com/problems/trapping-rain-water/" },
    { title: "N-Queens",            difficulty: "Hard",   topic: "Backtracking", link: "https://leetcode.com/problems/n-queens/" },
    { title: "Median of Arrays",    difficulty: "Hard",   topic: "Binary Search",link: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
]

const DIFF_CFG = {
    Easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-yellow-400  bg-yellow-500/10  border-yellow-500/20",
    Hard:   "text-red-400     bg-red-500/10     border-red-500/20",
}

export default function CodingPracticePage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white">Coding Practice</h1>
                <p className="text-zinc-400 text-sm mt-1">Practice these problems to ace your coding assessments.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Easy",   count: PROBLEMS.filter(p => p.difficulty === "Easy").length,   color: "text-emerald-400" },
                    { label: "Medium", count: PROBLEMS.filter(p => p.difficulty === "Medium").length, color: "text-yellow-400" },
                    { label: "Hard",   count: PROBLEMS.filter(p => p.difficulty === "Hard").length,   color: "text-red-400" },
                ].map(s => (
                    <div key={s.label} className="bg-[#09090b] border border-white/5 rounded-2xl p-5 text-center">
                        <span className={`text-3xl font-black ${s.color}`}>{s.count}</span>
                        <p className="text-xs text-zinc-500 font-semibold mt-1 uppercase tracking-wide">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <tr>
                            <th className="text-left px-6 py-4">#</th>
                            <th className="text-left px-6 py-4">Problem</th>
                            <th className="text-left px-6 py-4">Topic</th>
                            <th className="text-left px-6 py-4">Difficulty</th>
                            <th className="text-left px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {PROBLEMS.map((p, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 text-zinc-600 font-mono text-xs">{String(i + 1).padStart(2, "0")}</td>
                                <td className="px-6 py-4 font-semibold text-white">{p.title}</td>
                                <td className="px-6 py-4 text-zinc-500 text-xs">{p.topic}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${DIFF_CFG[p.difficulty]}`}>
                                        {p.difficulty}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <a href={p.link} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-all font-medium">
                                        Solve <ExternalLink size={12} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
