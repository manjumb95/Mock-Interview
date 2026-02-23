import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import resumeRoutes from './routes/resume';
import interviewRoutes from './routes/interview';
import paymentRoutes from './routes/payment';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { VoiceService } from './services/voice.service';

const app = express();
const port = process.env.PORT || 8080;

// Connect Socket.io to Express HTTP Server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ["GET", "POST"]
    }
});

// Initialize Voice Service WebSocket listeners
VoiceService.setupSocket(io);

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port} with WebSockets enabled`);
});

export default app;
