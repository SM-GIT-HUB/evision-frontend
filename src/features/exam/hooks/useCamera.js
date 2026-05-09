/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react"

function useCamera({ enabled, onCameraDisconnected })
{
    const videoRef = useRef(null);

    const streamRef = useRef(null);

    const [cameraError, setCameraError] = useState("");

    useEffect(() => {

        if (!enabled) {
            return;
        }

        let mounted = true;

        async function startCamera()
        {
            //
            // prevent duplicate streams
            //

            try {
                if (streamRef.current)
                {
                    streamRef.current
                        .getTracks()
                        .forEach(track => track.stop());

                    streamRef.current = null;
                }

                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    })

                if (!mounted)
                {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;

                //
                // detect camera disconnect
                //
                stream.getVideoTracks().forEach(track => {

                    track.onended = () => {

                        streamRef.current = null;

                        if (onCameraDisconnected)
                        {
                            onCameraDisconnected();
                        }
                    }
                })

                if (videoRef.current)
                {
                    videoRef.current.srcObject = stream;

                    videoRef.current.onloadedmetadata = async () => {
                        try {
                            await videoRef.current.play();
                        }
                        catch(err) {
                            console.log(err);
                        }
                    }
                }
            }
            catch {
                setCameraError("Camera permission denied");
            }
        }

        startCamera();

        return () => {
            mounted = false;
        }

    }, [enabled])

    //
    // ACTUAL cleanup only on unmount
    //
    useEffect(() => {

        return () => {

            if (streamRef.current)
            {
                streamRef.current
                    .getTracks()
                    .forEach(track => track.stop());

                streamRef.current = null;
            }
        }

    }, [])

    return {
        videoRef,
        cameraError
    }
}

export default useCamera