import express from "express";
import authRoutes from "./routes/authRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from the 'public' directory
// Assuming your app.js is in /backend and public is in /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use("/auth", authRoutes);

// Catch-all route for SPA
// Serve index.html for any unknown routes (except /auth routes)
app.get(/.*/,(req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/auth')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Serve the frontend HTML
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server with better error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '..', 'public')}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
        console.error(`   Run: PORT=3001 npm start`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;
