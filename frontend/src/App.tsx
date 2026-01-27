import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LineraProvider } from './contexts/LineraContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
    return (
        <LineraProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/lobby" element={<LobbyPage />} />
                        <Route path="/game/:roomId" element={<GamePage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </LineraProvider>
    );
}

export default App;
