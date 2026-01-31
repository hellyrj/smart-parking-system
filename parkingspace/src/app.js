import 'dotenv/config';
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import parkingSessionRoutes from "./routes/parkingSessionRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= API ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/sessions", parkingSessionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});

// ================= API 404 (JSON ONLY) =================
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// ================= ERROR HANDLER ==============
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Check for required environment variables
if (!process.env.JWT_SECRET && process.env.NETLIFY_DEV !== 'true') {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// ================= EXPORT FOR SERVERLESS =================
// This is the serverless function handler
export default app;

// ================= LOCAL DEVELOPMENT =================
// Only start HTTP server if running locally
if (process.env.NETLIFY_DEV === 'true' || 
    process.env.NODE_ENV === 'development' ||
    process.argv.includes('--local')) {
  
  import('http').then(({ createServer }) => {
    import('ws').then(({ WebSocketServer }) => {
      import('path').then((path) => {
        import('url').then(({ fileURLToPath }) => {
          
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          
          const server = createServer(app);
          
          // ================= WEBSOCKET SETUP (LOCAL ONLY) =================
          const wss = new WebSocketServer({ server });
          
          wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');
            
            ws.on('message', (message) => {
              console.log('WebSocket message:', message.toString());
              
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
          
          // ================= FRONTEND (LOCAL ONLY) ===================
          app.use(express.static(path.join(__dirname, "..", "public")));
          
          // Serve uploads statically
          app.use('/uploads', express.static(path.join(__dirname, "..", "uploads")));
          
          app.get(/.*/, (req, res) => {
            res.sendFile(path.join(__dirname, "..", "public", "index.html"));
          });
          
          const PORT = process.env.PORT || 3000;
          
          server.listen(PORT, () => {
            console.log(`🚀 Local server running on http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
          });
          
        });
      });
    });
  }).catch(err => {
    console.error('Error starting local server:', err);
  });
}