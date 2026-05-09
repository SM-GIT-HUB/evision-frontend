import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { useParams, Navigate } from "react-router-dom"

import { getResults } from "../api/exam-api"
import useAuthStore from "../store/auth-store"
import LoadingSpinner from "../components/LoadingSpinner"

function ResultsPage()
{
    const { id } = useParams();

    const { isAuthenticated } = useAuthStore();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchResults()
        {
            try {
                const response = await getResults(id);
                setResults(response.data || []);
            }
            catch(err) {
                toast.error(err.response?.data?.message || "Failed to fetch results");
            }
            finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [id])

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">

            <div className="max-w-4xl mx-auto">

                <div>
                    <h1 className="text-5xl font-bold">
                        Exam Results
                    </h1>

                    <p className="text-zinc-400 mt-3">
                        Candidates ranked from highest to lowest score.
                    </p>
                </div>

                {
                    results.length === 0 &&
                    <p className="mt-10 text-zinc-500">
                        No results found
                    </p>
                }

                <div className="mt-10 space-y-4">

                    {
                        results.map((result, index) => (

                            <div
                                key={result._id || index}
                                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
                            >

                                <div>
                                    <p className="text-lg font-semibold">
                                        #{index + 1}
                                    </p>

                                    <p className="text-zinc-300 mt-1">
                                        {result.email}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        {result.totalScore}
                                    </p>

                                    <p className="text-zinc-500 text-sm">
                                        marks
                                    </p>
                                </div>

                            </div>
                        ))
                    }

                </div>

            </div>

        </div>
    )
}

export default ResultsPage