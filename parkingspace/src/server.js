import app from "./app.js";
//import sequelize from "./config/db.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend + Frontend running on http://localhost:${PORT}`);
});