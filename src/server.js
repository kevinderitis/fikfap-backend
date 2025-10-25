import http from 'http';
import './config/env.js';
import './config/db.js';
import app from './app.js';
import { mountSockets } from './sockets/index.js';

const server = http.createServer(app);
mountSockets(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API running on :${PORT}`));
