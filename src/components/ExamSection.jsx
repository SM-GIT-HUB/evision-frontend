import ExamCard from "./ExamCard"

function ExamSection({ title, exams, type, role })
{
    return (
        <section className="mt-12">

            <h2 className="text-4xl font-bold tracking-tight">
                {title}
            </h2>

            {
                exams.length === 0 &&
                <p className="mt-6 text-zinc-500">
                    No exams found
                </p>
            }

            <div className="
                grid
                grid-cols-1
                lg:grid-cols-2
                xl:grid-cols-3
                gap-6
                mt-8
            ">

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