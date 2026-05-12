import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts"

import {
    Trophy,
    BarChart3,
    FileText
} from "lucide-react"

import ExamCard from "./ExamCard"

const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#ef4444"
];

function ExamSection({ title, exams, type, role })
{
    const showAnalytics =
        role === "student" &&
        type === "past";

    const percentages =
        exams.map(exam => {

            if (!exam.fullMarks) {
                return 0;
            }

            return (
                (exam.score / exam.fullMarks) * 100
            );
        });

    const averageScore =
        percentages.length > 0
        ?
        percentages.reduce((a, b) => a + b, 0)
        / percentages.length
        :
        0;

    const highestScore =
        percentages.length > 0
        ?
        Math.max(...percentages)
        :
        0;

    const distribution = [
        {
            name: "90%+",
            value:
                percentages.filter(p => p >= 90).length
        },
        {
            name: "75-89%",
            value:
                percentages.filter(
                    p => p >= 75 && p < 90
                ).length
        },
        {
            name: "50-74%",
            value:
                percentages.filter(
                    p => p >= 50 && p < 75
                ).length
        },
        {
            name: "<50%",
            value:
                percentages.filter(
                    p => p < 50
                ).length
        }
    ];

    return (
        <section className="mt-12">

            <h2 className="text-4xl font-bold tracking-tight">
                {title}
            </h2>

            {
                showAnalytics &&
                <div className="
                    mt-8
                    grid
                    grid-cols-1
                    lg:grid-cols-2
                    xl:grid-cols-4
                    gap-4
                ">

                    {/* Exams Written */}
                    <div className="
                        bg-[#09090B]
                        border border-violet-500/20
                        rounded-2xl
                        p-4
                        relative overflow-hidden
                    ">

                        <div className="
                            absolute inset-0
                            bg-violet-500/5
                        " />

                        <div className="relative z-10">

                            <div className="
                                w-11 h-11
                                rounded-2xl
                                bg-violet-500/20
                                flex items-center justify-center
                            ">
                                <FileText className="text-violet-400" />
                            </div>

                            <p className="
                                text-zinc-400
                                mt-4
                            ">
                                Exams Written
                            </p>

                            <h2 className="
                                text-3xl
                                font-bold
                                mt-2
                            ">
                                {exams.length}
                            </h2>

                        </div>

                    </div>

                    {/* Average Score */}
                    <div className="
                        bg-[#09090B]
                        border border-emerald-500/20
                        rounded-2xl
                        p-4
                        relative overflow-hidden
                    ">

                        <div className="
                            absolute inset-0
                            bg-emerald-500/5
                        " />

                        <div className="relative z-10">

                            <div className="
                                w-11 h-11
                                rounded-2xl
                                bg-emerald-500/20
                                flex items-center justify-center
                            ">
                                <BarChart3 className="text-emerald-400" />
                            </div>

                            <p className="
                                text-zinc-400
                                mt-4
                            ">
                                Average Score
                            </p>

                            <h2 className="
                                text-3xl
                                font-bold
                                mt-2
                            ">
                                {averageScore.toFixed(1)}%
                            </h2>

                        </div>

                    </div>

                    {/* Highest Score */}
                    <div className="
                        bg-[#09090B]
                        border border-blue-500/20
                        rounded-2xl
                        p-4
                        relative overflow-hidden
                    ">

                        <div className="
                            absolute inset-0
                            bg-blue-500/5
                        " />

                        <div className="relative z-10">

                            <div className="
                                w-11 h-11
                                rounded-2xl
                                bg-blue-500/20
                                flex items-center justify-center
                            ">
                                <Trophy className="text-blue-400" />
                            </div>

                            <p className="
                                text-zinc-400
                                mt-4
                            ">
                                Highest Score
                            </p>

                            <h2 className="
                                text-3xl
                                font-bold
                                mt-2
                            ">
                                {highestScore.toFixed(1)}%
                            </h2>

                        </div>

                    </div>

                    {/* Distribution */}
                    <div className="
                        bg-[#09090B]
                        border border-zinc-800
                        rounded-2xl
                        p-4
                    ">

                        <h2 className="
                            text-lg
                            font-semibold
                        ">
                            Score Distribution
                        </h2>

                        <div className="
                            mt-4
                            flex items-center
                            gap-6
                        ">

                            <div className="w-40 h-40 shrink-0">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <PieChart>

                                        <Pie
                                            data={distribution}
                                            dataKey="value"
                                            innerRadius={38}
                                            outerRadius={58}
                                            paddingAngle={3}
                                        >

                                            {
                                                COLORS.map((color, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={color}
                                                    />
                                                ))
                                            }

                                        </Pie>

                                        <Tooltip />

                                    </PieChart>

                                </ResponsiveContainer>

                            </div>

                            <div className="
                                flex-1
                                space-y-3
                            ">

                                {
                                    distribution.map((item, index) => (

                                        <div
                                            key={item.name}
                                            className="
                                                flex items-center
                                                justify-between
                                                text-sm
                                            "
                                        >

                                            <div className="
                                                flex items-center gap-2
                                            ">

                                                <div
                                                    className="
                                                        w-2.5 h-2.5
                                                        rounded-full
                                                    "
                                                    style={{
                                                        backgroundColor:
                                                            COLORS[index]
                                                    }}
                                                />

                                                <span className="text-zinc-400">
                                                    {item.name}
                                                </span>

                                            </div>

                                            <span className="font-medium text-zinc-200">
                                                {item.value}
                                            </span>

                                        </div>
                                    ))
                                }

                            </div>

                        </div>

                    </div>

                </div>
            }

            {
                exams.length === 0 &&
                <p className="mt-4 text-zinc-500">
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