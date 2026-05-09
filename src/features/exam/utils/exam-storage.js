
export function getExamStorageKey(examId)
{
    return `exam_answers_${examId}`;
}

export function loadAnswers(examId)
{
    try {
        const key = getExamStorageKey(examId);

        const data = localStorage.getItem(key);

        if (!data) {
            return {};
        }

        return JSON.parse(data);
    }
    catch {
        return {};
    }
}

export function saveAnswers(examId, answers)
{
    const key = getExamStorageKey(examId);

    localStorage.setItem(
        key,
        JSON.stringify(answers)
    );
}

export function clearAnswers(examId)
{
    const key = getExamStorageKey(examId);

    localStorage.removeItem(key);
}