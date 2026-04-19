import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { sessionRoutes } from './routes/sessions';
import { playerRoutes } from './routes/players';
import { adminRoutes } from './routes/admin';
import { registerSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/sessions', sessionRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/admin', adminRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🐺 Serveur Loup-Garou démarré sur le port ${PORT}`);
});

export { io };
