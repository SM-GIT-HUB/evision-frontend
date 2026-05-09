import { useEffect, useState } from "react"

function useExamTimer(endTime, onExpire)
{
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {

        if (!endTime) {
            return;
        }

        function updateTimer()
        {
            const remaining =
                new Date(endTime).getTime() - Date.now();

            if (remaining <= 0)
            {
                setTimeLeft(0);

                if (onExpire) {
                    onExpire();
                }

                return;
            }

            setTimeLeft(remaining);
        }

        updateTimer();

        const interval =
            setInterval(updateTimer, 1000);

        return () => clearInterval(interval);

    }, [endTime, onExpire]);

    return timeLeft;
}

export default useExamTimer