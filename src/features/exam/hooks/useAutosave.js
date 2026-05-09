import toast from "react-hot-toast"
import { useEffect, useRef } from "react"

import { saveAnswers } from "../../../api/exam-api"

import { formatAnswersForSubmission } from "../utils/format-answers"

function useAutosave({ exam, examId, answers })
{
    const savingRef = useRef(false);

    useEffect(() => {
        if (!exam || !answers) {
            return;
        }

        const start =
            new Date(exam.startTime).getTime();

        const end =
            new Date(exam.endTime).getTime();

        const totalDuration =
            end - start;

        const interval = Math.min(5 * 60 * 1000, totalDuration / 12);

        async function autosave()
        {
            try {
                if (savingRef.current) {
                    return;
                }

                savingRef.current = true;

                const formattedAnswers =
                    formatAnswersForSubmission(answers);

                if (formattedAnswers.length === 0) {
                    return;
                }

                await saveAnswers(examId, {
                    examId,
                    answers: formattedAnswers
                })

            }
            catch(err) {
                toast.error(
                    err.response?.data?.message ||
                    "Autosave failed"
                )
            }
            finally {
                savingRef.current = false;
            }
        }

        const timer =
            setInterval(autosave, interval);

        return () => clearInterval(timer);

    }, [exam, examId, answers])
}

export default useAutosave;