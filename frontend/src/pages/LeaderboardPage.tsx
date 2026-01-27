import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Zap, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { useLinera } from '../contexts/LineraContext';

interface LeaderboardEntry {
    rank: number;
    player: string;
    gamesWon: number;
    gamesPlayed: number;
    averageWpm: number;
    averageAccuracy: number;
    bestWpm: number;
}

export default function LeaderboardPage() {
    const { queryState } = useLinera();
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([
        // Mock data for development
        { rank: 1, player: 'TypeMaster', gamesWon: 42, gamesPlayed: 50, averageWpm: 125, averageAccuracy: 98, bestWpm: 156 },
        { rank: 2, player: 'SpeedDemon', gamesWon: 38, gamesPlayed: 48, averageWpm: 118, averageAccuracy: 96, bestWpm: 142 },
        { rank: 3, player: 'KeyboardNinja', gamesWon: 35, gamesPlayed: 45, averageWpm: 112, averageAccuracy: 97, bestWpm: 138 },
        { rank: 4, player: 'FastFingers', gamesWon: 28, gamesPlayed: 40, averageWpm: 105, averageAccuracy: 94, bestWpm: 128 },
        { rank: 5, player: 'WordWarrior', gamesWon: 22, gamesPlayed: 35, averageWpm: 98, averageAccuracy: 95, bestWpm: 122 },
        { rank: 6, player: 'SwiftTyper', gamesWon: 18, gamesPlayed: 30, averageWpm: 92, averageAccuracy: 93, bestWpm: 115 },
        { rank: 7, player: 'QuickKeys', gamesWon: 15, gamesPlayed: 28, averageWpm: 88, averageAccuracy: 91, bestWpm: 108 },
        { rank: 8, player: 'RapidWriter', gamesWon: 12, gamesPlayed: 25, averageWpm: 82, averageAccuracy: 90, bestWpm: 102 },
    ]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const result = await queryState(`
        query {
          leaderboard(limit: 20) {
            player
            gamesWon
            gamesPlayed
            averageWpm
            averageAccuracy
            bestWpm
          }
        }
      `);
            if (result?.leaderboard) {
                setEntries(result.leaderboard.map((e: any, i: number) => ({
                    rank: i + 1,
                    ...e,
                })));
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-400" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-300" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
        }
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/30';
            case 2:
                return 'bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-gray-400/30';
            case 3:
                return 'bg-gradient-to-r from-amber-600/10 to-amber-700/5 border-amber-600/30';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        Leaderboard
                    </h1>
                    <p className="text-gray-400">Top typists on the Linera blockchain</p>
                </div>
                <button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Top WPM', value: '156', icon: Zap, color: 'text-yellow-400' },
                    { label: 'Avg Accuracy', value: '95%', icon: Target, color: 'text-green-400' },
                    { label: 'Total Games', value: '1,234', icon: TrendingUp, color: 'text-purple-400' },
                    { label: 'Active Players', value: '89', icon: Trophy, color: 'text-cyan-400' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-4 rounded-xl text-center"
                        >
                            <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-gray-400">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Leaderboard Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl overflow-hidden"
            >
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-7 gap-4 px-6 py-4 bg-white/5 text-sm font-semibold text-gray-400">
                    <div>Rank</div>
                    <div className="col-span-2">Player</div>
                    <div className="text-center">Won/Played</div>
                    <div className="text-center">Avg WPM</div>
                    <div className="text-center">Accuracy</div>
                    <div className="text-center">Best WPM</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/5">
                    {entries.map((entry, index) => (
                        <motion.div
                            key={entry.player}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`grid grid-cols-2 sm:grid-cols-7 gap-4 px-6 py-4 items-center border-l-2 ${getRankStyle(entry.rank)}`}
                        >
                            {/* Rank */}
                            <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                                <span className="sm:hidden text-sm text-gray-400">#{entry.rank}</span>
                            </div>

                            {/* Player (mobile: full width) */}
                            <div className="col-span-1 sm:col-span-2">
                                <p className="font-semibold">{entry.player}</p>
                                <p className="text-xs text-gray-400 sm:hidden">
                                    {entry.gamesWon}/{entry.gamesPlayed} wins
                                </p>
                            </div>

                            {/* Mobile Stats */}
                            <div className="col-span-2 sm:hidden grid grid-cols-3 gap-2 text-center text-sm">
                                <div>
                                    <p className="font-bold text-yellow-400">{entry.averageWpm}</p>
                                    <p className="text-xs text-gray-400">WPM</p>
                                </div>
                                <div>
                                    <p className="font-bold text-green-400">{entry.averageAccuracy}%</p>
                                    <p className="text-xs text-gray-400">Acc</p>
                                </div>
                                <div>
                                    <p className="font-bold text-cyan-400">{entry.bestWpm}</p>
                                    <p className="text-xs text-gray-400">Best</p>
                                </div>
                            </div>

                            {/* Desktop Stats */}
                            <div className="hidden sm:block text-center">
                                <span className="font-semibold">{entry.gamesWon}</span>
                                <span className="text-gray-400">/{entry.gamesPlayed}</span>
                            </div>
                            <div className="hidden sm:block text-center">
                                <span className="font-semibold text-yellow-400">{entry.averageWpm}</span>
                            </div>
                            <div className="hidden sm:block text-center">
                                <span className="font-semibold text-green-400">{entry.averageAccuracy}%</span>
                            </div>
                            <div className="hidden sm:block text-center">
                                <span className="font-semibold text-cyan-400">{entry.bestWpm}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-gray-400 text-sm"
            >
                <p>Rankings are stored immutably on the Linera blockchain</p>
                <p className="text-xs mt-1">Score = WPM × (Accuracy/100)²</p>
            </motion.div>
        </div>
    );
}
