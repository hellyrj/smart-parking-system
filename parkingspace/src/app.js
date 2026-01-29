import 'dotenv/config'; // ✅ Fixed typo
import express from "express";
import { createServer } from 'http';
import { WebSocketServer } from 'ws'; // Use ES module import
import authRoutes from "./routes/authRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import parkingSessionRoutes from "./routes/parkingSessionRoutes.js";
import WebSocket from 'ws';
import driverRoutes from "./routes/driverRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= API ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/sessions" , parkingSessionRoutes)
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= CREATE HTTP SERVER =================
const server = createServer(app);

// ================= WEBSOCKET SETUP =================
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Handle WebSocket connections for real-time updates
  ws.on('message', (message) => {
    console.log('WebSocket message:', message.toString());
    
    // Echo back for testing
    ws.send(JSON.stringify({
      type: 'echo',
      message: 'Received: ' + message.toString()
    }));
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connected successfully',
    timestamp: new Date().toISOString()
  }));
});

// Optional: Broadcast function to send to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
}

// ================= API 404 (JSON ONLY) =================
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// ================= FRONTEND ===================
app.use(express.static(path.join(__dirname, "..", "public")));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, "..", "uploads")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ================= ERROR HANDLER ==============
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Fixed typo: console.exit -> process.exit
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// ================= SERVER =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Export for use in other files if needed
export { wss, broadcast, app, server };