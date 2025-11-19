import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';

import { authLimiter, writeLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import commentRoutes from './routes/comment.routes.js';
import followRoutes from './routes/follow.routes.js';
import discoverRoutes from './routes/discover.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notifRoutes from './routes/notif.routes.js';
import reportRoutes from './routes/report.routes.js';
import storageRoutes from './routes/storage.routes.js';
import streamWebhookRoutes from './routes/stream.webhook.routes.js';
import imageRoutes from './routes/image.routes.js';

const app = express();

const raw = process.env.ALLOWED_ORIGINS || '*';
const allowlist = raw
    .split(',')
    .map(s => s.trim().replace(/^https?:\/\//i, '').replace(/\/$/, ''))
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // curl/postman
        const host = origin.replace(/^https?:\/\//i, '').replace(/\/$/, '');
        if (allowlist.includes('*') || allowlist.includes(host)) return cb(null, true);
        return cb(new Error(`CORS: origin no permitido: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
    maxAge: 86400,
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        const host = origin.replace(/^https?:\/\//i, '').replace(/\/$/, '');
        if (allowlist.includes('*') || allowlist.includes(host)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin'); // buena práctica
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Length, ETag');
        }
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});


app.use('/_internal', streamWebhookRoutes);

app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(morgan('combined'));

app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authLimiter, authRoutes);
app.use('/profile', profileRoutes);
app.use('/users', userRoutes);
app.use('/videos', writeLimiter, videoRoutes);
app.use('/videos', writeLimiter, interactionRoutes);
app.use('/', writeLimiter, commentRoutes);
app.use('/', writeLimiter, followRoutes);
app.use('/discover', discoverRoutes);
app.use('/messages', chatRoutes);
app.use('/', notifRoutes);
app.use('/', reportRoutes);
app.use('/storage', storageRoutes);
app.use('/images', writeLimiter, imageRoutes);

app.use(errorHandler);

export default app;