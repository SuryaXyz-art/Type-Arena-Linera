import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types for Linera integration
interface LineraContextType {
    isConnected: boolean;
    isConnecting: boolean;
    chainId: string | null;
    owner: string | null;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    executeOperation: (operation: any) => Promise<any>;
    queryState: (query: string) => Promise<any>;
}

const LineraContext = createContext<LineraContextType | null>(null);

interface LineraProviderProps {
    children: ReactNode;
}

export function LineraProvider({ children }: LineraProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [chainId, setChainId] = useState<string | null>(null);
    const [owner, setOwner] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<any>(null);

    const APP_ID = import.meta.env.VITE_TYPE_ARENA_APP_ID || '';
    const NODE_URL = import.meta.env.VITE_LINERA_NODE_URL || '/node-proxy';

    const connect = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            // Dynamic import for @linera/client
            const module = await import('@linera/client') as any;
            const LineraClient = module.LineraClient || module.default?.LineraClient || module.default;

            if (!LineraClient) {
                throw new Error('Failed to import LineraClient');
            }

            const lineraClient = new LineraClient({
                nodeUrl: NODE_URL,
            });

            await lineraClient.connect();

            const walletInfo = await lineraClient.getWalletInfo();

            setClient(lineraClient);
            setChainId(walletInfo.chainId);
            setOwner(walletInfo.owner);
            setIsConnected(true);
        } catch (err: any) {
            console.error('Failed to connect to Linera:', err);
            setError(err.message || 'Failed to connect to wallet');

            // For development/demo: use mock data
            if (import.meta.env.DEV) {
                console.log('Using development mode with mock wallet');
                const mockChainId = 'dev_' + Math.random().toString(36).substring(7);
                const mockOwner = 'User:' + Math.random().toString(36).substring(2, 10);
                setChainId(mockChainId);
                setOwner(mockOwner);
                setIsConnected(true);
                setError(null);
            }
        } finally {
            setIsConnecting(false);
        }
    }, [NODE_URL]);

    const disconnect = useCallback(() => {
        if (client) {
            client.disconnect?.();
        }
        setClient(null);
        setChainId(null);
        setOwner(null);
        setIsConnected(false);
        setError(null);
    }, [client]);

    const executeOperation = useCallback(async (operation: any) => {
        if (!client && !import.meta.env.DEV) {
            throw new Error('Not connected to Linera');
        }

        if (import.meta.env.DEV && !client) {
            // Mock operation execution for development
            console.log('Mock operation:', operation);
            return { success: true, mock: true };
        }

        try {
            const result = await client.executeOperation(APP_ID, operation);
            return result;
        } catch (err: any) {
            console.error('Operation failed:', err);
            throw err;
        }
    }, [client, APP_ID]);

    const queryState = useCallback(async (query: string) => {
        if (!client && !import.meta.env.DEV) {
            throw new Error('Not connected to Linera');
        }

        if (import.meta.env.DEV && !client) {
            // Mock query response for development
            console.log('Mock query:', query);
            return null;
        }

        try {
            const result = await client.query(APP_ID, query);
            return result;
        } catch (err: any) {
            console.error('Query failed:', err);
            throw err;
        }
    }, [client, APP_ID]);

    const value: LineraContextType = {
        isConnected,
        isConnecting,
        chainId,
        owner,
        error,
        connect,
        disconnect,
        executeOperation,
        queryState,
    };

    return (
        <LineraContext.Provider value={value}>
            {children}
        </LineraContext.Provider>
    );
}

export function useLinera(): LineraContextType {
    const context = useContext(LineraContext);
    if (!context) {
        throw new Error('useLinera must be used within a LineraProvider');
    }
    return context;
}
