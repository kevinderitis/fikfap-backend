import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cors from 'cors';
import { authLimiter, writeLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import videoRoutes from './routes/video.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import commentRoutes from './routes/comment.routes.js';
import followRoutes from './routes/follow.routes.js';
import discoverRoutes from './routes/discover.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notifRoutes from './routes/notif.routes.js';
import reportRoutes from './routes/report.routes.js';
import storageRoutes from './routes/storage.routes.js';

const corsHeaders = {
    origin: '*', // no usar credentials con '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400,
};

const app = express();
app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(morgan('combined'));
app.use(cors(corsHeaders));
app.options('*', cors(corsHeaders));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authLimiter, authRoutes);
app.use('/profile', profileRoutes);
app.use('/videos', writeLimiter, videoRoutes);
app.use('/videos', writeLimiter, interactionRoutes);
app.use('/', writeLimiter, commentRoutes);
app.use('/', writeLimiter, followRoutes);
app.use('/discover', discoverRoutes);
app.use('/messages', chatRoutes);
app.use('/', notifRoutes);
app.use('/', reportRoutes);
app.use('/storage', storageRoutes);

app.use(errorHandler);
export default app;
