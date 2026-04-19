import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminCreatePage from './pages/AdminCreatePage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/admin" element={<AdminCreatePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}
