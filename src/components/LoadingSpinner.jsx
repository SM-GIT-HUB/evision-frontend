
function LoadingSpinner()
{
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">

            <div className="w-14 h-14 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />

        </div>
    )
}

export default LoadingSpinner