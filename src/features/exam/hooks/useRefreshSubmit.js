import { useEffect } from "react"

function useRefreshSubmit({ enabled, submitExam })
{
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function handleUnload()
        {
            submitExam({
                silent: true,
                showError: false
            });
        }

        window.addEventListener(
            "unload",
            handleUnload
        )

        return () => {
            window.removeEventListener(
                "unload",
                handleUnload
            )
        }

    }, [enabled, submitExam])
}

export default useRefreshSubmit