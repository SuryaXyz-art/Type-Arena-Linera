import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Keyboard, Zap, Users, Trophy, ArrowRight, Timer, Target, Globe } from 'lucide-react';
import { useLinera } from '../contexts/LineraContext';

export default function HomePage() {
    const { isConnected, connect } = useLinera();

    const features = [
        {
            icon: Zap,
            title: 'Sub-Second Finality',
            description: 'Every keystroke counts with instant blockchain confirmations',
            color: 'from-yellow-400 to-orange-500',
        },
        {
            icon: Users,
            title: 'Real-Time Multiplayer',
            description: 'Compete against players worldwide with cross-chain sync',
            color: 'from-purple-400 to-pink-500',
        },
        {
            icon: Globe,
            title: 'Microchain Architecture',
            description: 'Each player has their own chain for infinite scalability',
            color: 'from-cyan-400 to-blue-500',
        },
        {
            icon: Trophy,
            title: 'On-Chain Leaderboards',
            description: 'Immutable rankings stored permanently on Linera',
            color: 'from-green-400 to-emerald-500',
        },
    ];

    const stats = [
        { label: 'WPM Record', value: '180+', icon: Timer },
        { label: 'Accuracy Goal', value: '100%', icon: Target },
        { label: 'Players Online', value: 'Live', icon: Users },
    ];

    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-center">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
                        >
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-sm text-gray-300">Powered by Linera Blockchain</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl sm:text-7xl font-extrabold mb-6"
                        >
                            <span className="gradient-text">Type Arena</span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
                        >
                            Real-time multiplayer typing competition on the blockchain.
                            <br />
                            <span className="text-purple-400">Race. Type. Dominate.</span>
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            {isConnected ? (
                                <Link to="/lobby" className="btn-primary text-lg flex items-center gap-2 glow-purple">
                                    Enter Arena
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <button onClick={connect} className="btn-primary text-lg flex items-center gap-2 glow-purple">
                                    Connect & Play
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                            <Link to="/leaderboard" className="btn-secondary text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                View Leaderboard
                            </Link>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-wrap justify-center gap-8 mt-16"
                        >
                            {stats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="stat-card flex items-center gap-3">
                                        <Icon className="w-8 h-8 text-purple-400" />
                                        <div className="text-left">
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-sm text-gray-400">{stat.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Why <span className="gradient-text">Type Arena</span>?
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Experience the future of competitive typing with blockchain-powered fairness and transparency
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass p-6 rounded-2xl hover:scale-105 transition-transform cursor-default group"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: 1, title: 'Connect Wallet', desc: 'Connect your Linera wallet to get started' },
                            { step: 2, title: 'Join or Create Room', desc: 'Find an open room or create your own arena' },
                            { step: 3, title: 'Type & Compete', desc: 'Race to type the prompt fastest and most accurately' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="relative"
                            >
                                <div className="text-8xl font-bold text-purple-500/10 absolute -top-4 -left-2">
                                    {item.step}
                                </div>
                                <div className="relative z-10 pt-8">
                                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
