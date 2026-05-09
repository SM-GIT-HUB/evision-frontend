/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react"

function useFocusMonitor({ enabled, onViolation }) {
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const startViolationInterval = () => {
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    if (!document.hasFocus()) {
                        onViolation();
                    } else {
                        stopViolationInterval();
                    }
                }, 3000);
            }
        };

        const stopViolationInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const handleBlur = () => startViolationInterval();
        const handleFocus = () => stopViolationInterval();

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        // Check initial state
        if (!document.hasFocus()) startViolationInterval();

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            stopViolationInterval();
        };
    }, [enabled]);
}

export default useFocusMonitor