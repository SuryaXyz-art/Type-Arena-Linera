import { motion } from 'framer-motion';
import { Wallet, LogOut, Loader2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useLinera } from '../contexts/LineraContext';

export default function WalletButton() {
    const { isConnected, isConnecting, chainId, owner, connect, disconnect, error } = useLinera();
    const [showDropdown, setShowDropdown] = useState(false);

    const formatAddress = (address: string) => {
        if (address.length <= 12) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isConnecting) {
        return (
            <button className="btn-secondary flex items-center gap-2 opacity-75 cursor-wait">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
            </button>
        );
    }

    if (isConnected && chainId) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-mono text-sm hidden sm:inline">
                        {formatAddress(chainId)}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-64 p-4 glass rounded-xl z-50"
                    >
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400">Chain ID</p>
                                <p className="font-mono text-sm text-white truncate">{chainId}</p>
                            </div>
                            {owner && (
                                <div>
                                    <p className="text-xs text-gray-400">Owner</p>
                                    <p className="font-mono text-sm text-white truncate">{owner}</p>
                                </div>
                            )}
                            <hr className="border-white/10" />
                            <button
                                onClick={() => {
                                    disconnect();
                                    setShowDropdown(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <button onClick={connect} className="btn-primary flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
        </button>
    );
}
