import ExamCard from "./ExamCard"

function ExamSection({ title, exams, type, role })
{
    return (
        <section className="mt-16">

            <h2 className="text-3xl font-bold">
                {title}
            </h2>

            {
                exams.length === 0 &&
                <p className="mt-6 text-zinc-500">
                    No exams found
                </p>
            }

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">

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