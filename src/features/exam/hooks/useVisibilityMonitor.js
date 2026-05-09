import { useEffect } from "react"

function useVisibilityMonitor({ enabled, onHidden })
{
    useEffect(() => {

        if (!enabled) {
            return;
        }

        function handleVisibility()
        {
            if (document.hidden)
            {
                onHidden();
            }
        }

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        )

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            )
        }

    }, [enabled, onHidden])
}

export default useVisibilityMonitor