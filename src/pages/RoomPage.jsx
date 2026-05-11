import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import { Play, Share2, MonitorUp, ChevronDown, CheckCircle2, AlertCircle, Send, Plus, Settings, Video, VideoOff, Mic, MicOff, MoreHorizontal, PhoneOff, SignalHigh, Pencil, Square, Circle, Type, Eraser, Undo2, Redo2, Trash2, MousePointer } from "lucide-react"
import Editor from "@monaco-editor/react"
import toast from "react-hot-toast"
import useAuthStore from "../store/auth-store"
import api from "../api/axios"

export default function RoomPage() {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { user } = useAuthStore();

    const [activeTab, setActiveTab] = useState("chat"); // chat | notes
    const [code, setCode] = useState(() => {
        return localStorage.getItem(`room-code-${roomId}`) || "# Start coding...\n\nprint(\"Hello World!\")"
    });
    
    // --- Phase 1 & 2 State (Chat & Sync) ---
    const socketRef = useRef(null);
    const isRemoteChange = useRef(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);
    const [isReconnecting, setIsReconnecting] = useState(false);

    // --- Phase 3 State (WebRTC) ---
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const offerCreated = useRef(false);

    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    // --- Phase 4 State (Code Execution) ---
    const [language, setLanguage] = useState("python");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState({ stdout: "", stderr: "" });

    // --- UI State (Resizer) ---
    // --- UI State (Resizer) ---
    const [topHeight, setTopHeight] = useState(60); // percentage
    const containerRef = useRef(null);

    // --- Custom Whiteboard State ---
    const canvasRef = useRef(null);
    const [drawings, setDrawings] = useState([]);
    const [undoStack, setUndoStack] = useState([]);
    const [tool, setTool] = useState("pencil"); // select | pencil | rect | circle | text | eraser
    const [brushColor, setBrushColor] = useState("#ffffff");
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // --- Timer State ---
    const [roomData, setRoomData] = useState(null);
    const [timeLeft, setTimeLeft] = useState("00h 00m 00s");
    const [isValidating, setIsValidating] = useState(true);
    const [roomError, setRoomError] = useState(null); // 'invalid' | 'expired' | 'not-started' | null
    const [errorDetails, setErrorDetails] = useState("");

    useEffect(() => {
        // Fetch room data
        async function fetchRoom() {
            try {
                const response = await api.get(`/room/${roomId}`);
                const room = response.data.data;
                
                if (!room) {
                    setRoomError("invalid");
                    setErrorDetails("The requested interview room details could not be found.");
                    setIsValidating(false);
                    return;
                }

                const now = Date.now();
                const startTime = new Date(room.startTime).getTime();
                const endTime = new Date(room.endTime).getTime();

                if (now > endTime) {
                    setRoomError("expired");
                    setErrorDetails(`This interview session has already expired. It closed on ${new Date(endTime).toLocaleString()}.`);
                } else if (now < startTime) {
                    setRoomError("not-started");
                    setErrorDetails(`This interview session has not started yet. It is scheduled to begin at ${new Date(startTime).toLocaleString()}.`);
                } else {
                    setRoomData(room);
                }
                setIsValidating(false);
            } catch (error) {
                console.error("Room validation error:", error);
                setRoomError("invalid");
                setErrorDetails("This interview session does not exist, or you do not have permission to join.");
                setIsValidating(false);
                toast.error("Failed to validate room credentials");
            }
        }
        fetchRoom();
    }, [roomId]);

    useEffect(() => {
        if (!roomData) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const end = new Date(roomData.endTime).getTime();
            const difference = end - now;
            if (difference <= 0) {
                clearInterval(interval);
                setTimeLeft("00h 00m 00s");
                return;
            }
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2,'0')}h ${minutes.toString().padStart(2,'0')}m ${seconds.toString().padStart(2,'0')}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [roomData]);

    useEffect(() => {
        // Scroll to bottom of chat
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        localStorage.setItem(`room-code-${roomId}`, code);
    }, [code, roomId]);

    // Socket & WebRTC Initialization
    useEffect(() => {
        if (!roomData) return;
        setIsReconnecting(true);
        const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true });
        socketRef.current = socket;

        // Code Sync
        socket.on("code-update", (incomingCode) => {
            isRemoteChange.current = true;
            setCode(incomingCode);
        });

        // Chat Sync
        socket.on("receive-chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Setup WebRTC FIRST, then join room
        setupWebRTC(socket).then(() => {
            socket.emit("join-room", roomId);
            setIsReconnecting(false);
        });

        socket.on("disconnect", () => setIsReconnecting(true));

        // Code Sync
        socket.on("code-update", (incomingCode) => {
            isRemoteChange.current = true;
            setCode(incomingCode);
        });

        // Chat Sync
        socket.on("receive-chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("code-update");
            socket.off("receive-chat-message");
            socket.off("peer-joined");
            socket.off("receive-offer");
            socket.off("receive-answer");
            socket.off("receive-ice-candidate");
            socket.off("peer-left");
            socket.disconnect();
            
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
                localStream.current = null;
            }
        };
    }, [roomId, roomData]);

    async function setupWebRTC(socket) {
        peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => { peerConnection.current.addTrack(track, stream); });
        } catch(err) {
            toast.error("Camera/Mic unavailable. Joining as viewer.");
            peerConnection.current.addTransceiver("video", { direction: "recvonly" });
            peerConnection.current.addTransceiver("audio", { direction: "recvonly" });
        }

        peerConnection.current.ontrack = (event) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        };

        peerConnection.current.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", peerConnection.current.iceConnectionState);
            if (
                peerConnection.current.iceConnectionState === "disconnected" ||
                peerConnection.current.iceConnectionState === "failed" ||
                peerConnection.current.iceConnectionState === "closed"
            ) {
                // If it remains disconnected for 6 seconds, clear the video
                setTimeout(() => {
                    if (
                        peerConnection.current && 
                        (peerConnection.current.iceConnectionState === "disconnected" ||
                         peerConnection.current.iceConnectionState === "failed" ||
                         peerConnection.current.iceConnectionState === "closed")
                    ) {
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    }
                }, 6000);
            }
        };

        socket.on("peer-joined", async () => {
            if (window.peerLeftTimeout) {
                clearTimeout(window.peerLeftTimeout);
                window.peerLeftTimeout = null;
            }
            if (offerCreated.current) return;
            offerCreated.current = true;
            try {
                // Use iceRestart to force clean reconnection on reconnect
                const offer = await peerConnection.current.createOffer({ iceRestart: true });
                await peerConnection.current.setLocalDescription(offer);
                socket.emit("offer", { roomId, offer });
            } catch (err) {
                console.error("Error creating offer:", err);
            }
        });

        socket.on("receive-offer", async (offer) => {
            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                socket.emit("answer", { roomId, answer });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        });

        socket.on("receive-answer", async (answer) => {
            try {
                if (peerConnection.current.signalingState !== "stable") {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (err) {
                console.error("Error handling answer:", err);
            }
        });

        socket.on("receive-ice-candidate", async (candidate) => {
            try { 
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)); 
            } catch(e) { 
                console.error("Error adding ice candidate:", e); 
            }
        });

        socket.on("peer-left", () => {
            console.log("Peer left room or briefly disconnected");
            // Give 5 seconds grace period for brief network disconnects / page refreshes
            window.peerLeftTimeout = setTimeout(() => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                offerCreated.current = false;
            }, 5000);
        });
    }

    const toggleMic = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraEnabled(videoTrack.enabled);
            }
        }
    };

    function handleCodeChange(value) {
        const updatedCode = value || "";
        setCode(updatedCode);
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }
        socketRef.current?.emit("code-change", { roomId, code: updatedCode });
    }

    function sendMessage(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const msgObj = {
            id: Date.now(),
            text: chatInput.trim(),
            senderRole: user?.role === "examiner" ? "Interviewer" : "Participant",
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };

        socketRef.current?.emit("chat-message", { roomId, message: msgObj });
        setMessages((prev) => [...prev, msgObj]);
        setChatInput("");
    }

    async function runCode() {
        if (!code.trim()) return toast.error("Write some code first!");
        setIsRunning(true);
        setOutput({ stdout: "Running code...\n", stderr: "" });
        try {
            const response = await api.post(`/room/${roomId}/execute`, {
                code,
                language
            });
            const result = response.data.data;
            setOutput({
                stdout: result.stdout || "",
                stderr: result.stderr || ""
            });
            toast.success("Code execution finished");
        } catch (error) {
            setOutput({ stdout: "", stderr: "Failed to execute code. Execution engine unavailable." });
            toast.error("Execution failed");
        } finally {
            setIsRunning(false);
        }
    }

    const handleDragStart = (e) => {
        e.preventDefault();
        const handleMouseMove = (moveEvent) => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newPercentage = ((moveEvent.clientY - containerRect.top) / containerRect.height) * 100;
            if (newPercentage >= 20 && newPercentage <= 80) {
                setTopHeight(newPercentage);
            }
        };
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // --- Custom Whiteboard Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;

        const resizeCanvas = () => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            redrawCanvas();
        };

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(parent);

        resizeCanvas();
        return () => resizeObserver.disconnect();
    }, [drawings, currentDrawing]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw tech dot grid
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        const gridSize = 20;
        for (let x = 0; x < canvas.width; x += gridSize) {
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        drawings.forEach(d => drawItem(ctx, d));
        if (currentDrawing) drawItem(ctx, currentDrawing);

        // Draw selection bounding box
        if (tool === "select" && selectedItemIndex !== null && selectedItemIndex < drawings.length) {
            const d = drawings[selectedItemIndex];
            ctx.strokeStyle = "#8b5cf6"; // Violet glow border
            ctx.fillStyle = "#8b5cf6";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);

            if (d.type === "rect") {
                ctx.strokeRect(d.x - 5, d.y - 5, d.w + 10, d.h + 10);
                ctx.setLineDash([]);
                // Draw bottom-right resize handle
                ctx.fillRect(d.x + d.w - 4, d.y + d.h - 4, 8, 8);
            } else if (d.type === "circle") {
                ctx.beginPath();
                ctx.arc(d.cx, d.cy, d.r + 5, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]);
                // Draw resize handle on bounding box perimeter
                ctx.fillRect(d.cx + d.r - 4, d.cy + d.r - 4, 8, 8);
            } else if (d.type === "text") {
                const textWidth = d.text.length * 9;
                ctx.strokeRect(d.x - 5, d.y - 18, textWidth + 10, 24);
                ctx.setLineDash([]);
            } else if (d.type === "pencil") {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                d.points.forEach(p => {
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.y > maxY) maxY = p.y;
                });
                if (minX !== Infinity) {
                    ctx.strokeRect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
                }
                ctx.setLineDash([]);
            }
        }
    };

    const findItemAt = (x, y) => {
        for (let i = drawings.length - 1; i >= 0; i--) {
            const d = drawings[i];
            if (d.type === "rect") {
                if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) {
                    return { item: d, index: i };
                }
            } else if (d.type === "circle") {
                const dist = Math.sqrt(Math.pow(x - d.cx, 2) + Math.pow(y - d.cy, 2));
                if (dist <= d.r) {
                    return { item: d, index: i };
                }
            } else if (d.type === "text") {
                const textWidth = d.text.length * 9;
                if (x >= d.x && x <= d.x + textWidth && y >= d.y - 15 && y <= d.y + 5) {
                    return { item: d, index: i };
                }
            } else if (d.type === "pencil") {
                for (let p of d.points) {
                    const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
                    if (dist < 15) {
                        return { item: d, index: i };
                    }
                }
            }
        }
        return null;
    };

    const drawItem = (ctx, d) => {
        ctx.strokeStyle = d.color;
        ctx.fillStyle = d.color;
        ctx.lineWidth = d.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (d.type === "pencil") {
            if (d.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(d.points[0].x, d.points[0].y);
            for (let i = 1; i < d.points.length; i++) {
                ctx.lineTo(d.points[i].x, d.points[i].y);
            }
            ctx.stroke();
        } else if (d.type === "rect") {
            ctx.beginPath();
            ctx.rect(d.x, d.y, d.w, d.h);
            ctx.stroke();
        } else if (d.type === "circle") {
            ctx.beginPath();
            ctx.arc(d.cx, d.cy, d.r, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (d.type === "text") {
            ctx.font = "bold 15px Inter, system-ui, sans-serif";
            ctx.fillText(d.text, d.x, d.y);
        }
    };

    const handleCanvasMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === "select") {
            // First check if clicked on selected item's resize handle
            if (selectedItemIndex !== null && selectedItemIndex < drawings.length) {
                const d = drawings[selectedItemIndex];
                let hx = 0, hy = 0;
                if (d.type === "rect") {
                    hx = d.x + d.w;
                    hy = d.y + d.h;
                } else if (d.type === "circle") {
                    hx = d.cx + d.r;
                    hy = d.cy + d.r;
                }

                if (hx && hy && Math.sqrt(Math.pow(x - hx, 2) + Math.pow(y - hy, 2)) < 15) {
                    setIsResizing(true);
                    lastMousePos.current = { x, y };
                    return;
                }
            }

            // Otherwise check if selecting a new shape
            const match = findItemAt(x, y);
            if (match) {
                setSelectedItemIndex(match.index);
                lastMousePos.current = { x, y };
                setIsDrawing(true);
            } else {
                setSelectedItemIndex(null);
            }
            return;
        }

        if (tool === "text") {
            const text = prompt("Enter text to write on board:");
            if (text) {
                setDrawings(prev => [...prev, { type: "text", x, y, text, color: brushColor, width: 2 }]);
                setUndoStack([]);
            }
            return;
        }

        setIsDrawing(true);
        if (tool === "pencil") {
            setCurrentDrawing({ type: "pencil", points: [{ x, y }], color: brushColor, width: 3 });
        } else if (tool === "rect") {
            setCurrentDrawing({ type: "rect", startX: x, startY: y, x, y, w: 0, h: 0, color: brushColor, width: 3 });
        } else if (tool === "circle") {
            setCurrentDrawing({ type: "circle", startX: x, startY: y, cx: x, cy: y, r: 0, color: brushColor, width: 3 });
        } else if (tool === "eraser") {
            setCurrentDrawing({ type: "pencil", points: [{ x, y }], color: "#000000", width: 25 });
        }
    };

    const handleCanvasMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === "select" && isResizing && selectedItemIndex !== null) {
            setDrawings(prev => {
                const copy = [...prev];
                const item = { ...copy[selectedItemIndex] };

                if (item.type === "rect") {
                    item.w = Math.max(10, x - item.x);
                    item.h = Math.max(10, y - item.y);
                } else if (item.type === "circle") {
                    const dist = Math.sqrt(Math.pow(x - item.cx, 2) + Math.pow(y - item.cy, 2));
                    item.r = Math.max(5, dist);
                }

                copy[selectedItemIndex] = item;
                return copy;
            });
            return;
        }

        if (tool === "select" && isDrawing && selectedItemIndex !== null) {
            const dx = x - lastMousePos.current.x;
            const dy = y - lastMousePos.current.y;
            lastMousePos.current = { x, y };

            setDrawings(prev => {
                const copy = [...prev];
                const item = { ...copy[selectedItemIndex] };

                if (item.type === "rect") {
                    item.x += dx;
                    item.y += dy;
                } else if (item.type === "circle") {
                    item.cx += dx;
                    item.cy += dy;
                } else if (item.type === "text") {
                    item.x += dx;
                    item.y += dy;
                } else if (item.type === "pencil") {
                    item.points = item.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                }

                copy[selectedItemIndex] = item;
                return copy;
            });
            return;
        }

        if (!isDrawing || !currentDrawing) return;

        if (tool === "pencil" || tool === "eraser") {
            setCurrentDrawing(prev => ({
                ...prev,
                points: [...prev.points, { x, y }]
            }));
        } else if (tool === "rect") {
            setCurrentDrawing(prev => ({
                ...prev,
                x: Math.min(prev.startX, x),
                y: Math.min(prev.startY, y),
                w: Math.abs(x - prev.startX),
                h: Math.abs(y - prev.startY)
            }));
        } else if (tool === "circle") {
            const r = Math.sqrt(Math.pow(x - currentDrawing.startX, 2) + Math.pow(y - currentDrawing.startY, 2));
            setCurrentDrawing(prev => ({
                ...prev,
                r
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        if (isResizing) {
            setIsResizing(false);
            return;
        }
        if (tool === "select") {
            setIsDrawing(false);
            return;
        }
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentDrawing) {
            setDrawings(prev => [...prev, currentDrawing]);
            setUndoStack([]);
            setCurrentDrawing(null);
        }
    };

    const handleUndo = () => {
        if (drawings.length === 0) return;
        const last = drawings[drawings.length - 1];
        setDrawings(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, last]);
    };

    const handleRedo = () => {
        if (undoStack.length === 0) return;
        const next = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setDrawings(prev => [...prev, next]);
    };

    const handleClear = () => {
        if (drawings.length === 0) return;
        setUndoStack(drawings);
        setDrawings([]);
    };

    const endInterview = () => {
        navigate("/dashboard");
    };

    if (isValidating) {
        return (
            <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">Verifying Session Credentials...</p>
                </div>
            </div>
        );
    }

    if (roomError) {
        return (
            <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center font-sans px-4">
                <div className="max-w-md w-full bg-[#0a0a0c] border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
                    {/* Glowing background blur effect */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl group-hover:bg-violet-600/20 transition-colors"></div>

                    {/* Alert Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
                        <AlertCircle size={28} />
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                        {roomError === "expired" ? "Interview Expired" : roomError === "not-started" ? "Not Started Yet" : "Invalid Session Link"}
                    </h2>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                        {errorDetails}
                    </p>

                    <button 
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#050505] text-zinc-100 flex flex-col font-sans overflow-hidden">
            {/* --- Top Header --- */}
            <header className="h-16 flex items-center justify-between px-6 shrink-0 relative z-50">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-white">Interview Room</h1>
                        
                    </div>
                    
                </div>

                <div className="flex items-center gap-4">
                    {isReconnecting && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm font-medium animate-pulse">
                            <AlertCircle size={16} /> Reconnecting...
                        </div>
                    )}
                    <div className="flex items-center bg-[#0e0e11] border border-white/5 px-4 py-2 rounded-xl text-sm font-medium text-zinc-300">
                        Time Left: <span className="text-white ml-2 font-mono">{timeLeft}</span>
                    </div>
                    <button 
                        onClick={endInterview}
                        className="flex items-center gap-2 px-5 py-2 bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl text-sm font-semibold transition-all"
                    >
                        <PhoneOff size={16} /> End Interview
                    </button>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-1 flex overflow-hidden p-4 pt-0 gap-4">
                
                {/* LEFT SIDEBAR: Videos & Participants */}
                <div className="w-[340px] flex flex-col gap-4 shrink-0">
                    
                    {/* Interviewer Video (Local if Examiner, Remote if Candidate) */}
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <video 
                            ref={user?.role === "examiner" ? localVideoRef : remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            muted={user?.role === "examiner"}
                            className={`w-full h-full object-cover ${user?.role === "examiner" ? "transform -scale-x-100" : ""}`} 
                        />
                        {(!user || (!localStream.current && user.role === "examiner")) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                <VideoOff size={32} className="text-zinc-600" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-violet-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
                            Interviewer {user?.role === "examiner" ? "(You)" : ""}
                        </div>
                        
                        {/* Only show controls on the local video */}
                        {user?.role === "examiner" && (
                            <div className="absolute bottom-3 left-3 flex gap-2">
                                <button onClick={toggleMic} className={`w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center border hover:bg-black/80 text-white ${micEnabled ? 'bg-black/60 border-white/10' : 'bg-red-500/80 border-red-500'}`}>
                                    {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                                </button>
                                <button onClick={toggleCamera} className={`w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center border hover:bg-black/80 text-white ${cameraEnabled ? 'bg-black/60 border-white/10' : 'bg-red-500/80 border-red-500'}`}>
                                    {cameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/80 text-white">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                        )}
                        
                        <div className="absolute bottom-3 right-3 text-emerald-500 drop-shadow-md">
                            <SignalHigh size={16} />
                        </div>
                    </div>

                    {/* Candidate Video (Local if Candidate, Remote if Examiner) */}
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <video 
                            ref={user?.role !== "examiner" ? localVideoRef : remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            muted={user?.role !== "examiner"}
                            className={`w-full h-full object-cover ${user?.role !== "examiner" ? "transform -scale-x-100" : ""}`} 
                        />
                        {(!user || (!localStream.current && user.role !== "examiner")) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                <VideoOff size={32} className="text-zinc-600" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-indigo-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
                            Candidate {user?.role !== "examiner" ? "(You)" : ""}
                        </div>

                        {/* Only show controls on the local video */}
                        {user?.role !== "examiner" && (
                            <div className="absolute bottom-3 left-3 flex gap-2">
                                <button onClick={toggleMic} className={`w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center border hover:bg-black/80 text-white ${micEnabled ? 'bg-black/60 border-white/10' : 'bg-red-500/80 border-red-500'}`}>
                                    {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                                </button>
                                <button onClick={toggleCamera} className={`w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center border hover:bg-black/80 text-white ${cameraEnabled ? 'bg-black/60 border-white/10' : 'bg-red-500/80 border-red-500'}`}>
                                    {cameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/80 text-white">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                        )}

                        <div className="absolute bottom-3 right-3 text-emerald-500 drop-shadow-md">
                            <SignalHigh size={16} />
                        </div>
                    </div>

                    {/* Participants List */}
                    <div className="flex-1 bg-[#0a0a0c] rounded-2xl border border-white/5 flex flex-col p-4">
                        <h3 className="text-sm font-bold text-white mb-4">Participants (2)</h3>
                        <div className="flex flex-col gap-4">
                            
                            {/* Local User */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                        {user?.role === "examiner" ? (
                                            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" alt="host" className="w-full h-full object-cover" />
                                        ) : (
                                            "You"
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">You ({user?.role === "examiner" ? "Interviewer" : "Candidate"})</span>
                                        {user?.role === "examiner" && (
                                            <span className="text-[10px] bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded font-bold">Host</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    {micEnabled ? <Mic size={14} className="text-emerald-500" /> : <MicOff size={14} className="text-red-500" />}
                                    {cameraEnabled ? <Video size={14} className="text-emerald-500" /> : <VideoOff size={14} className="text-red-500" />}
                                </div>
                            </div>
                            
                            {/* Remote User */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                        {user?.role !== "examiner" ? (
                                            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" alt="host" className="w-full h-full object-cover" />
                                        ) : (
                                            "P"
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white truncate max-w-[120px]">
                                            {user?.role === "examiner" ? (roomData?.participantEmail?.split("@")[0] || "Candidate") : "Interviewer"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Mic size={14} />
                                    <Video size={14} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Editor & Whiteboard (Resizable) */}
                <div ref={containerRef} className="flex-1 flex flex-col min-w-[500px] h-full relative">
                    
                    {/* TOP HALF: Editor & Output */}
                    <div style={{ height: `${topHeight}%` }} className="bg-[#0a0a0c] rounded-2xl border border-white/5 flex flex-col overflow-hidden shrink-0">
                        
                        {/* Editor Toolbar */}
                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-2 pr-4 bg-[#0a0a0c]">
                            <div className="flex items-center h-full">
                                <div className="h-full px-4 border-b-2 border-violet-500 flex items-center gap-2 bg-white/[0.02]">
                                    <span className="text-sm text-zinc-300">main.{language === "python" ? "py" : language === "javascript" ? "js" : language === "cpp" ? "cpp" : "java"}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 relative">
                                <select 
                                    className="appearance-none bg-black/40 border border-white/10 text-zinc-300 text-sm rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="python">Python 3</option>
                                    <option value="javascript">JavaScript (Node)</option>
                                    <option value="cpp">C++ (GCC)</option>
                                    <option value="java">Java</option>
                                </select>
                                <ChevronDown size={14} className="text-zinc-500 absolute right-3 pointer-events-none" />
                                
                                <button 
                                    onClick={runCode}
                                    disabled={isRunning}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg transition-all ${isRunning ? 'bg-violet-600/50 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/20'}`}
                                >
                                    {isRunning ? (
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <Play size={14} className="fill-white" />
                                    )}
                                    {isRunning ? 'Running...' : 'Run'}
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-[2] bg-[#050505] relative border-b border-white/5 p-4">
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : language === "java" ? "java" : "python"}
                                value={code}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    padding: { top: 16 },
                                    lineNumbersMinChars: 3,
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>

                        {/* Output Area */}
                        <div className="flex-[1] flex flex-col bg-[#0a0a0c]">
                            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">
                                <div className="flex items-center gap-6 h-full">
                                    <div className="h-full flex items-center text-sm font-semibold text-violet-400 border-b-2 border-violet-500">
                                        Output
                                    </div>
                                </div>
                                {output.stderr ? (
                                    <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                                        <AlertCircle size={14} /> Error
                                    </div>
                                ) : output.stdout ? (
                                    <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                                        <CheckCircle2 size={14} /> Success
                                    </div>
                                ) : null}
                            </div>
                            <div className="p-4 font-mono text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap">
                                {output.stderr ? (
                                    <span className="text-red-400">{output.stderr}</span>
                                ) : (
                                    output.stdout || <span className="text-zinc-600">Run code to see output...</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DRAG HANDLE (LEETCODE STYLE) */}
                    <div 
                        onMouseDown={handleDragStart}
                        className="h-3 my-1 w-full flex items-center justify-center cursor-row-resize hover:bg-white/5 rounded transition-colors group shrink-0"
                    >
                        <div className="w-16 h-1 bg-white/20 rounded-full group-hover:bg-violet-500 transition-colors"></div>
                    </div>

                    {/* BOTTOM HALF: Whiteboard */}
                    <div style={{ height: `calc(${100 - topHeight}% - 20px)` }} className={`bg-[#000000] rounded-2xl border border-white/5 flex flex-col overflow-hidden shrink-0 relative group/board`}>
                        {/* Floating Glass Whiteboard Toolbar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-2xl transition-all">
                            {/* Selection & Brush Tools */}
                            <button 
                                onClick={() => {
                                    setTool("select");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Selection Tool (Move shapes)"
                                className={`p-2 rounded-full transition-colors ${tool === "select" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <MousePointer size={15} />
                            </button>
                            <button 
                                onClick={() => {
                                    setTool("pencil");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Pencil Tool"
                                className={`p-2 rounded-full transition-colors ${tool === "pencil" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <Pencil size={15} />
                            </button>
                            <button 
                                onClick={() => {
                                    setTool("rect");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Rectangle Tool"
                                className={`p-2 rounded-full transition-colors ${tool === "rect" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <Square size={15} />
                            </button>
                            <button 
                                onClick={() => {
                                    setTool("circle");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Circle Tool"
                                className={`p-2 rounded-full transition-colors ${tool === "circle" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <Circle size={15} />
                            </button>
                            <button 
                                onClick={() => {
                                    setTool("text");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Text Tool"
                                className={`p-2 rounded-full transition-colors ${tool === "text" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <Type size={15} />
                            </button>
                            <button 
                                onClick={() => {
                                    setTool("eraser");
                                    setSelectedItemIndex(null);
                                }} 
                                title="Eraser Tool"
                                className={`p-2 rounded-full transition-colors ${tool === "eraser" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                            >
                                <Eraser size={15} />
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1.5"></div>

                            {/* Colors */}
                            {["#ffffff", "#a78bfa", "#34d399", "#f59e0b"].map((col) => (
                                <button
                                    key={col}
                                    onClick={() => {
                                        setBrushColor(col);
                                        if (tool === "eraser") setTool("pencil");
                                    }}
                                    className={`w-5 h-5 rounded-full border transition-all ${brushColor === col && tool !== "eraser" ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                                    style={{ backgroundColor: col }}
                                />
                            ))}

                            <div className="w-px h-5 bg-white/10 mx-1.5"></div>

                            {/* Undo / Redo / Trash */}
                            <button 
                                onClick={handleUndo} 
                                title="Undo"
                                className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                disabled={drawings.length === 0}
                            >
                                <Undo2 size={15} />
                            </button>
                            <button 
                                onClick={handleRedo} 
                                title="Redo"
                                className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                disabled={undoStack.length === 0}
                            >
                                <Redo2 size={15} />
                            </button>
                            <button 
                                onClick={handleClear} 
                                title="Clear Board"
                                className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                disabled={drawings.length === 0}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        {/* Whiteboard Interactive Canvas */}
                        <div className="flex-1 bg-black relative select-none cursor-crosshair">
                            <canvas 
                                ref={canvasRef}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                className="absolute inset-0 block"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: Chat & Notes */}
                <div className="w-[320px] bg-[#0a0a0c] rounded-2xl border border-white/5 flex flex-col overflow-hidden shrink-0">
                    <div className="h-14 border-b border-white/5 flex bg-[#0a0a0c]">
                        <button 
                            onClick={() => setActiveTab("chat")}
                            className={`flex-1 flex items-center justify-center text-sm font-semibold transition-colors border-b-2 ${activeTab === "chat" ? "border-violet-500 text-violet-400 bg-white/[0.02]" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                        >
                            Chat
                        </button>
                        <button 
                            onClick={() => setActiveTab("notes")}
                            className={`flex-1 flex items-center justify-center text-sm font-semibold transition-colors border-b-2 ${activeTab === "notes" ? "border-violet-500 text-violet-400 bg-white/[0.02]" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                        >
                            Notes
                        </button>
                    </div>

                    {activeTab === "chat" ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
                                <div className="text-center text-[10px] font-medium text-zinc-600 uppercase tracking-widest my-2 border-b border-white/5 pb-2">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                
                                {messages.length === 0 ? (
                                    <div className="text-center text-xs text-zinc-500 mt-4">No messages yet. Say hi!</div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className="flex gap-3">
                                            {msg.senderRole === "Interviewer" ? (
                                                <div className="w-7 h-7 rounded-full bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" alt="I" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-indigo-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">
                                                    P
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">{msg.senderRole}</span>
                                                    <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed bg-white/5 p-2.5 rounded-r-xl rounded-bl-xl border border-white/5">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            
                            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-[#0a0a0c]">
                                <div className="flex items-center gap-2 bg-[#050505] border border-white/10 rounded-xl p-1.5 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all">
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-white px-3 placeholder:text-zinc-600" 
                                    />
                                    <button type="submit" className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 transition-colors shrink-0 shadow-md">
                                        <Send size={14} className="ml-px" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-4 bg-[#0a0a0c]">
                            <textarea 
                                className="flex-1 bg-[#050505] border border-white/5 rounded-xl p-4 text-sm text-zinc-300 resize-none outline-none focus:border-violet-500/50"
                                placeholder="Write your interview notes here... These are private and only visible to you."
                            ></textarea>
                            <button className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all">
                                Save Notes
                            </button>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}