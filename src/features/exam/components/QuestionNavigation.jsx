
function QuestionNavigation({
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers
})
{
    return (
        <div className="flex gap-3 flex-wrap">

            {
                questions.map((question, index) => {

                    const answered =
                        answers[question._id]?.response !== undefined &&
                        answers[question._id]?.response !== "";

                    return (
                        <button
                            key={question._id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`
                                w-12 h-12 rounded-xl border transition
                                ${currentQuestionIndex === index
                                    ? "bg-white text-black border-white"
                                    : answered
                                        ? "bg-zinc-800 border-zinc-700"
                                        : "bg-zinc-950 border-zinc-800"
                                }
                            `}
                        >
                            {index + 1}
                        </button>
                    )
                })
            }

        </div>
    )
}

export default QuestionNavigation