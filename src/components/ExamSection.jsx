import ExamCard from "./ExamCard"

function ExamSection({ title, exams, type, role })
{
    return (
        <section>

            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
                {title}
                <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {exams.length}
                </span>
            </h2>

            {
                exams.length === 0 &&
                <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-sm">
                    {role === "examiner" && type === "upcoming"
                        ? "No upcoming exams. Create one above!"
                        : "No exams found."
                    }
                </div>
            }

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {
                    exams.map((exam) => (
                        <ExamCard
                            key={exam._id}
                            exam={exam}
                            type={type}
                            role={role}
                        />
                    ))
                }

            </div>

        </section>
    )
}

export default ExamSection