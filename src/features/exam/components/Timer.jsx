
function formatTime(ms)
{
    const totalSeconds = Math.floor(ms / 1000);

    const hours =
        String(Math.floor(totalSeconds / 3600)).padStart(2, "0");

    const minutes =
        String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");

    const seconds =
        String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
}

function Timer({ timeLeft })
{
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3">
            <p className="text-sm text-zinc-500">
                Time Left
            </p>

            <h2 className="text-2xl font-bold mt-1">
                {formatTime(timeLeft)}
            </h2>
        </div>
    )
}

export default Timer