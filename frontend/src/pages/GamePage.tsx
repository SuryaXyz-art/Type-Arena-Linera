import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Trophy, ArrowLeft, Play, RotateCcw, Zap, Target, Timer } from 'lucide-react';
import { useLinera } from '../contexts/LineraContext';

// Sample prompts (these come from the contract's WORD_BANK in production)
const PROMPTS = [
    "The quick brown fox jumps over the lazy dog near the riverbank.",
    "Blockchain technology enables decentralized applications with trustless consensus.",
    "Linera microchains provide infinite horizontal scalability for web3 applications.",
    "Fast fingers and sharp minds compete in the ultimate typing arena showdown.",
    "Practice makes perfect when it comes to improving your typing speed.",
];

interface Player {
    id: string;
    name: string;
    wpm: number;
    accuracy: number;
    score: number;
    finished: boolean;
}

type GameStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export default function GamePage() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { isConnected, owner, executeOperation } = useLinera();
    const inputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<GameStatus>('waiting');
    const [countdown, setCountdown] = useState(3);
    const [prompt, setPrompt] = useState('');
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds] = useState(3);
    const [players, setPlayers] = useState<Player[]>([
        { id: '1', name: 'You', wpm: 0, accuracy: 0, score: 0, finished: false },
        { id: '2', name: 'SpeedTyper', wpm: 0, accuracy: 0, score: 0, finished: false },
    ]);

    // Calculate WPM and accuracy
    const calculateStats = useCallback(() => {
        if (!startTime || !prompt) return { wpm: 0, accuracy: 0, score: 0 };

        const timeElapsed = ((endTime || Date.now()) - startTime) / 1000 / 60; // minutes
        const wordsTyped = userInput.trim().split(/\s+/).length;
        const wpm = Math.round(wordsTyped / Math.max(timeElapsed, 0.01));

        let correct = 0;
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] === prompt[i]) correct++;
        }
        const accuracy = Math.round((correct / Math.max(userInput.length, 1)) * 100);
        const score = Math.round(wpm * Math.pow(accuracy / 100, 2));

        return { wpm, accuracy, score };
    }, [startTime, endTime, userInput, prompt]);

    // Start game
    const startGame = () => {
        setStatus('countdown');
        setCountdown(3);
        const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        setPrompt(randomPrompt);
        setUserInput('');
        setEndTime(null);

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setStatus('playing');
                    setStartTime(Date.now());
                    inputRef.current?.focus();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Handle typing
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (status !== 'playing') return;
        const value = e.target.value;
        setUserInput(value);

        // Check if completed
        if (value === prompt) {
            setEndTime(Date.now());
            setStatus('finished');
            const stats = calculateStats();

            // Update player stats
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === '1' ? { ...p, ...stats, finished: true } : p
                )
            );

            // Simulate opponent finishing
            setTimeout(() => {
                setPlayers((prev) =>
                    prev.map((p) =>
                        p.id === '2'
                            ? {
                                ...p,
                                wpm: Math.round(stats.wpm * (0.8 + Math.random() * 0.4)),
                                accuracy: Math.round(85 + Math.random() * 15),
                                score: Math.round(stats.score * (0.7 + Math.random() * 0.6)),
                                finished: true,
                            }
                            : p
                    )
                );
            }, 500);
        }
    };

    // Render typed text with coloring
    const renderTypedText = () => {
        return (
            <div className="font-mono text-xl leading-relaxed">
                {prompt.split('').map((char, index) => {
                    let className = 'typing-pending';
                    if (index < userInput.length) {
                        className = userInput[index] === char ? 'typing-correct' : 'typing-incorrect';
                    } else if (index === userInput.length) {
                        className = 'typing-current';
                    }
                    return (
                        <span key={index} className={`typing-char ${className}`}>
                            {char}
                        </span>
                    );
                })}
                {status === 'playing' && (
                    <span className="cursor-blink text-purple-400">|</span>
                )}
            </div>
        );
    };

    const stats = calculateStats();
    const isWinner = status === 'finished' && players.every(p => players[0].score >= p.score);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/lobby')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Lobby
                </button>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Room: {roomId?.slice(0, 12)}...</span>
                    <span>Round {currentRound}/{totalRounds}</span>
                </div>
            </div>

            {/* Game Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-8 mb-6"
            >
                {/* Waiting State */}
                <AnimatePresence mode="wait">
                    {status === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <Users className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold mb-4">Ready to Type?</h2>
                            <p className="text-gray-400 mb-8">
                                Click start when you're ready to begin the typing challenge
                            </p>
                            <button onClick={startGame} className="btn-primary text-lg flex items-center gap-2 mx-auto">
                                <Play className="w-5 h-5" />
                                Start Game
                            </button>
                        </motion.div>
                    )}

                    {/* Countdown */}
                    {status === 'countdown' && (
                        <motion.div
                            key="countdown"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="text-center py-16"
                        >
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-8xl font-bold gradient-text"
                            >
                                {countdown}
                            </motion.div>
                            <p className="text-gray-400 mt-4">Get ready...</p>
                        </motion.div>
                    )}

                    {/* Playing */}
                    {status === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Stats Bar */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-6">
                                    <div className="stat-card flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-400" />
                                        <div>
                                            <p className="text-2xl font-bold">{stats.wpm}</p>
                                            <p className="text-xs text-gray-400">WPM</p>
                                        </div>
                                    </div>
                                    <div className="stat-card flex items-center gap-2">
                                        <Target className="w-5 h-5 text-green-400" />
                                        <div>
                                            <p className="text-2xl font-bold">{stats.accuracy}%</p>
                                            <p className="text-xs text-gray-400">Accuracy</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-cyan-400" />
                                    <p className="text-xl font-mono">
                                        {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
                                    </p>
                                </div>
                            </div>

                            {/* Prompt Display */}
                            <div className="bg-dark-400 rounded-xl p-6 mb-6">
                                {renderTypedText()}
                            </div>

                            {/* Hidden Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={handleInput}
                                className="w-full text-lg font-mono"
                                placeholder="Start typing here..."
                                autoFocus
                            />

                            {/* Progress Bar */}
                            <div className="mt-4 h-2 bg-dark-400 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(userInput.length / prompt.length) * 100}%` }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Finished */}
                    {status === 'finished' && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            {isWinner && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                    className="mb-6"
                                >
                                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                                    <h2 className="text-3xl font-bold gradient-text">Victory!</h2>
                                </motion.div>
                            )}

                            {/* Results */}
                            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                                <div className="stat-card">
                                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-3xl font-bold">{stats.wpm}</p>
                                    <p className="text-gray-400">WPM</p>
                                </div>
                                <div className="stat-card">
                                    <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-3xl font-bold">{stats.accuracy}%</p>
                                    <p className="text-gray-400">Accuracy</p>
                                </div>
                                <div className="stat-card">
                                    <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <p className="text-3xl font-bold">{stats.score}</p>
                                    <p className="text-gray-400">Score</p>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="glass rounded-xl p-4 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Round Results</h3>
                                <div className="space-y-2">
                                    {players
                                        .sort((a, b) => b.score - a.score)
                                        .map((player, index) => (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-medium">{player.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span>{player.wpm} WPM</span>
                                                    <span>{player.accuracy}%</span>
                                                    <span className="font-bold text-purple-400">{player.score} pts</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button onClick={() => navigate('/lobby')} className="btn-secondary">
                                    Leave Room
                                </button>
                                <button onClick={startGame} className="btn-primary flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    Play Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Players Panel */}
            {(status === 'playing' || status === 'finished') && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4"
                >
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Players</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${player.finished ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'
                                    }`}
                            >
                                <span className="font-medium">{player.name}</span>
                                <div className="flex items-center gap-2 text-sm">
                                    {player.finished ? (
                                        <span className="text-green-400">Finished!</span>
                                    ) : (
                                        <span className="text-gray-400">Typing...</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
