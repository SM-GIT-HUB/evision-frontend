import { useState } from "react";

import {
    loadAnswers,
    saveAnswers
} from "../utils/exam-storage";

function useExamAnswers(examId)
{
    const [answers, setAnswers] = useState(() => {
        return loadAnswers(examId);
    });

    function updateAnswer(questionId, response)
    {
        setAnswers(prev => {

            const updated = {
                ...prev,
                [questionId]: {
                    questionId,
                    response
                }
            };

            saveAnswers(examId, updated);

            return updated;
        })
    }

    return {
        answers,
        updateAnswer
    }
}

export default useExamAnswers;