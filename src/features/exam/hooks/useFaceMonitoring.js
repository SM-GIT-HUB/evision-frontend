/* eslint-disable react-hooks/exhaustive-deps */
import * as faceapi from "face-api.js"

import { useEffect, useRef } from "react"

function useFaceMonitoring({
    enabled,
    videoRef,
    onViolation
})
{
    const intervalRef = useRef(null);

    const modelsLoadedRef = useRef(false);

    const violationLockRef = useRef(false);

    const missingFaceCountRef = useRef(0);
    const faceAwayCountRef = useRef(0);

    useEffect(() => {

        if (!enabled) {
            return;
        }

        let mounted = true;

        async function loadModels()
        {
            //
            // prevent reloading models
            //
            if (modelsLoadedRef.current) {
                return;
            }

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                faceapi.nets.faceLandmark68Net.loadFromUri("/models")
            ])

            modelsLoadedRef.current = true;
        }

        async function detectFaces()
        {
            try {

                const video = videoRef.current;

                if (
                    !video ||
                    video.readyState !== 4
                ) {
                    return;
                }

                const detections =
                    await faceapi
                        .detectAllFaces(
                            video,
                            new faceapi.TinyFaceDetectorOptions({
                                inputSize: 224,
                                scoreThreshold: 0.5
                            })
                        )
                        .withFaceLandmarks();

                //
                // NO FACE
                //
                if (detections.length === 0)
                {
                    missingFaceCountRef.current++;

                    if (missingFaceCountRef.current >= 3)
                    {
                        triggerViolation();
                        missingFaceCountRef.current = 0;
                    }

                    return;
                }

                missingFaceCountRef.current = 0;

                //
                // MULTIPLE FACES
                //
                if (detections.length > 1)
                {
                    missingFaceCountRef.current++;

                    if (missingFaceCountRef.current >= 2)
                    {
                        triggerViolation();
                        missingFaceCountRef.current = 0;
                    }

                    return;
                }

                const detection = detections[0];

                const landmarks = detection.landmarks;

                const nose = landmarks.getNose();

                const jaw = landmarks.getJawOutline();

                const leftJaw = jaw[0];

                const rightJaw = jaw[16];

                const faceCenterX =
                    (leftJaw.x + rightJaw.x) / 2;

                const noseTip = nose[6];

                //
                // LOOKING AWAY
                //
                const faceWidth =
                Math.abs(rightJaw.x - leftJaw.x);

                const deviation =
                    Math.abs(noseTip.x - faceCenterX);

                const normalizedDeviation =
                    deviation / faceWidth;

                if (normalizedDeviation > 0.32)
                {
                    faceAwayCountRef.current++;

                    if (faceAwayCountRef.current >= 3)
                    {
                        triggerViolation();
                        faceAwayCountRef.current = 0;
                    }
                }
                else
                {
                    faceAwayCountRef.current = 0;
                }

            }
            catch(err) {
                console.log(err);
            }
        }

        function triggerViolation()
        {
            if (violationLockRef.current) {
                return;
            }

            violationLockRef.current = true;

            onViolation();

            setTimeout(() => {
                violationLockRef.current = false;
            }, 5000);
        }

        async function initialize()
        {
            await loadModels();

            if (!mounted) {
                return;
            }

            //
            // wait until video becomes ready
            //
            const waitForVideo = setInterval(() => {

                const video = videoRef.current;

                if (
                    video &&
                    video.readyState === 4
                )
                {
                    clearInterval(waitForVideo);

                    intervalRef.current =
                        setInterval(detectFaces, 3000);
                }

            }, 500);

        }

        initialize();

        return () => {

            mounted = false;

            if (intervalRef.current)
            {
                clearInterval(intervalRef.current);
            }
        }

    }, [enabled])
}

export default useFaceMonitoring