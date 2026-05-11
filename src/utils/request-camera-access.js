
export async function requestCameraAccess()
{
    try {

        const permission = await navigator.permissions.query({
            name: "camera"
        })

        //
        // already granted
        //
        if (permission.state === "granted") {
            return;
        }

        //
        // ask permission
        //
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })

        //
        // immediately stop stream
        //
        stream.getTracks().forEach(track => track.stop());
    }
    catch(err) {
        console.log("Camera permission not granted", err);
    }
}