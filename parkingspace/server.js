// server.js - Root entry point for Render
import app from './src/app.js';
import { createServer } from 'http';

const PORT = process.env.PORT || 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});