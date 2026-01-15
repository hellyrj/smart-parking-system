const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
