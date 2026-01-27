import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Keyboard, Trophy, Users, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import WalletButton from './WalletButton';

export default function Layout() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { path: '/', label: 'Home', icon: Keyboard },
        { path: '/lobby', label: 'Play', icon: Users },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Keyboard className="w-6 h-6 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold gradient-text">Type Arena</h1>
                                <p className="text-[10px] text-gray-400 -mt-1">Powered by Linera</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Wallet & Mobile Menu */}
                        <div className="flex items-center gap-3">
                            <WalletButton />
                            <button
                                className="md:hidden p-2 rounded-lg hover:bg-white/5"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <motion.nav
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden border-t border-white/10 py-4 px-4"
                    >
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            );
                        })}
                    </motion.nav>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="glass mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span>Sub-second finality on Linera</span>
                        </div>
                        <div className="text-gray-500 text-sm">
                            Built for WaveHack · Type Arena © 2024
                        </div>
                        <div className="text-[10px] text-gray-800 opacity-20 hover:opacity-100 transition-opacity">
                            Config: {import.meta.env.VITE_LINERA_NODE_URL ? 'Direct' : 'Proxy'} | {import.meta.env.VITE_LINERA_GRAPHQL_URL?.slice(0, 20)}...
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
