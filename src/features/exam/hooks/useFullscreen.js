/* eslint-disable react-hooks/exhaustive-deps */
// import toast from "react-hot-toast"
import { useEffect, useRef } from "react"

function useFullscreen({ enabled, onViolation }) {
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const startViolationInterval = () => {
            if (!intervalRef.current) {
                // Initial check after 3 seconds, then repeats every 3 seconds
                intervalRef.current = setInterval(() => {
                    if (!document.fullscreenElement) {
                        onViolation();
                    } else {
                        stopViolationInterval();
                    }
                }, 3000)
            }
        };

        const stopViolationInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                startViolationInterval();
            } else {
                stopViolationInterval();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        
        // Check initial state
        if (!document.fullscreenElement) startViolationInterval();

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            stopViolationInterval();
        };
    }, [enabled])
}

export default useFullscreen