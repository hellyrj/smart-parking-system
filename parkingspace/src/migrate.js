import { sequelize } from "./models/index.js";

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected & all tables synced!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
})();
