import { useEffect } from "react";

function useBeforeUnload(enabled = true)
{
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function handleBeforeUnload(e)
        {
            e.preventDefault();

            e.returnValue =
                "Refreshing will automatically submit your exam.";

            return e.returnValue;
        }

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        )

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            )
        }

    }, [enabled])
}

export default useBeforeUnload;