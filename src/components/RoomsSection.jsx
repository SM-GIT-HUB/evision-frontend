import { Video, Clock, CalendarDays, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

function RoomsSection({ upcomingRooms, pastRooms, role })
{
    const navigate = useNavigate();
    const isExaminer = role === "examiner";

    return (
        <div className="space-y-10">

            {/* Upcoming Interviews */}
            <div>
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                    <Video size={20} className="text-violet-400" />
                    Upcoming Interviews
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {upcomingRooms.length}
                    </span>
                </h2>

                {upcomingRooms.length === 0 ? (
                    <EmptyState
                        message={isExaminer ? "No upcoming interviews. Schedule one!" : "No upcoming interviews scheduled for you."}
                        actionLabel={isExaminer ? "Schedule Interview" : null}
                        onAction={isExaminer ? () => navigate("/room/create") : null}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingRooms.map(room => (
                            <RoomCard key={room._id} room={room} upcoming />
                        ))}
                    </div>
                )}
            </div>

            {/* Past Interviews */}
            {pastRooms.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-zinc-400">
                        <Clock size={20} />
                        Past Interviews
                        <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                            {pastRooms.length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastRooms.map(room => (
                            <RoomCard key={room._id} room={room} upcoming={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function RoomCard({ room, upcoming })
{
    const navigate = useNavigate();

    const formatDate = (d) => new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    return (
        <div className={`
            border rounded-2xl p-5 flex flex-col gap-4 transition
            ${upcoming
                ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                : "border-zinc-900 bg-black opacity-70"
            }
        `}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="font-semibold text-base">{room.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">ID: {room.roomId}</p>
                </div>
                {upcoming ? (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">Live Soon</span>
                ) : (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">Ended</span>
                )}
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                    <User size={12} />
                    <span>Participant: <span className="text-white">{room.participantEmail}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarDays size={12} />
                    <span>{formatDate(room.startTime)} → {formatDate(room.endTime)}</span>
                </div>
                {room.interviewScore != null && (
                    <div className="flex items-center gap-2">
                        <span className="text-violet-400 font-medium">Score: {room.interviewScore}</span>
                    </div>
                )}
            </div>

            {upcoming && (
                <button
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="w-full mt-auto bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                    <Video size={15} />
                    Join Interview
                </button>
            )}
        </div>
    )
}

function EmptyState({ message, actionLabel, onAction })
{
    return (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
            <Video size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">{message}</p>
            {actionLabel && (
                <button
                    onClick={onAction}
                    className="mt-4 bg-zinc-900 border border-zinc-700 text-white px-5 py-2 rounded-xl text-sm hover:border-zinc-500 transition"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

export default RoomsSection
