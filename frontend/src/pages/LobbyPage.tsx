import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, Play, RefreshCw, Search, Loader2 } from 'lucide-react';
import { useLinera } from '../contexts/LineraContext';

interface Room {
    id: string;
    host: string;
    playerCount: number;
    maxPlayers: number;
    status: 'Lobby' | 'InProgress' | 'Finished';
    rounds: number;
}

export default function LobbyPage() {
    const { isConnected, owner, executeOperation, queryState, connect } = useLinera();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [createForm, setCreateForm] = useState({
        maxPlayers: 4,
        rounds: 3,
    });

    // Mock rooms for development
    useEffect(() => {
        if (import.meta.env.DEV) {
            setRooms([
                { id: 'room_abc123', host: 'Player_xyz', playerCount: 2, maxPlayers: 4, status: 'Lobby', rounds: 3 },
                { id: 'room_def456', host: 'TypeMaster', playerCount: 3, maxPlayers: 4, status: 'Lobby', rounds: 5 },
                { id: 'room_ghi789', host: 'SpeedDemon', playerCount: 4, maxPlayers: 4, status: 'InProgress', rounds: 3 },
            ]);
        }
    }, []);

    const fetchRooms = async () => {
        if (!isConnected) return;
        setLoading(true);
        try {
            const result = await queryState(`
        query {
          activeRooms {
            roomId
            host
            playerCount
            maxPlayers
            status
            totalRounds
          }
        }
      `);
            if (result?.activeRooms) {
                setRooms(result.activeRooms.map((r: any) => ({
                    id: r.roomId,
                    host: r.host,
                    playerCount: r.playerCount,
                    maxPlayers: r.maxPlayers,
                    status: r.status,
                    rounds: r.totalRounds,
                })));
            }
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const createRoom = async () => {
        if (!isConnected) {
            await connect();
            return;
        }
        setCreating(true);
        try {
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await executeOperation({
                CreateRoom: {
                    room_id: roomId,
                    max_players: createForm.maxPlayers,
                    rounds: createForm.rounds,
                },
            });
            setShowCreateModal(false);
            navigate(`/game/${roomId}`);
        } catch (err) {
            console.error('Failed to create room:', err);
            // For demo, navigate anyway
            if (import.meta.env.DEV) {
                const mockRoomId = `room_${Date.now()}`;
                navigate(`/game/${mockRoomId}`);
            }
        } finally {
            setCreating(false);
        }
    };

    const joinRoom = async (roomId: string) => {
        if (!isConnected) {
            await connect();
            return;
        }
        navigate(`/game/${roomId}`);
    };

    const filteredRooms = rooms.filter(
        (room) =>
            room.status === 'Lobby' &&
            (room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.host.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center glass p-12 rounded-2xl"
                >
                    <Users className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Connect to Enter the Arena</h2>
                    <p className="text-gray-400 mb-8">
                        Connect your Linera wallet to create or join typing battles
                    </p>
                    <button onClick={connect} className="btn-primary text-lg">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Game Lobby</h1>
                    <p className="text-gray-400">Find a room or create your own arena</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRooms}
                        disabled={loading}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Room
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search rooms by ID or host..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12"
                />
            </div>

            {/* Room List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                        <p className="text-gray-400 mt-4">Loading rooms...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 glass rounded-xl"
                    >
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Open Rooms</h3>
                        <p className="text-gray-400 mb-6">Be the first to create a room!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Create Room
                        </button>
                    </motion.div>
                ) : (
                    filteredRooms.map((room, index) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{room.host}'s Arena</h3>
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                                        Open
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {room.playerCount}/{room.maxPlayers} players
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {room.rounds} rounds
                                    </span>
                                    <span className="font-mono text-xs text-gray-500">
                                        {room.id.slice(0, 16)}...
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => joinRoom(room.id)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Join
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass p-6 rounded-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-6">Create Room</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Max Players</label>
                                <div className="flex gap-2">
                                    {[2, 4, 6, 8].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setCreateForm({ ...createForm, maxPlayers: num })}
                                            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${createForm.maxPlayers === num
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Rounds</label>
                                <div className="flex gap-2">
                                    {[1, 3, 5, 7].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setCreateForm({ ...createForm, rounds: num })}
                                            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${createForm.rounds === num
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createRoom}
                                disabled={creating}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Create
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
