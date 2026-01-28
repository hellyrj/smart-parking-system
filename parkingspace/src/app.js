import 'dotenv/config'; // ✅ Fixed typo
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import parkingSessionRoutes from "./routes/parkingSessionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
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
app.use("/api/sessions" , parkingSessionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// API 404 (JSON ONLY)
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// ================= FRONTEND ===================
app.use(express.static(path.join(__dirname, "..", "public")));

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;