
function ExamFinishedPage()
{
    return (
        <div className="
            min-h-screen bg-black text-white
            flex items-center justify-center px-6
        ">

            <div className="
                max-w-xl w-full bg-zinc-950 border border-zinc-800
                rounded-3xl p-10 text-center
            ">

                <h1 className="text-5xl font-bold">
                    Exam Submitted
                </h1>

                <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
                    Your responses have been submitted successfully.
                    Thank you for participating.
                </p>

            </div>

        </div>
    )
}

export default ExamFinishedPage