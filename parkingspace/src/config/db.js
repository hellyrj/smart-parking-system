// src/config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Option 1: Using DATABASE_URL (Cleanest approach)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});
// Test connection with PostgreSQL-specific check
try {
  await sequelize.authenticate();
  console.log('✅ PostgreSQL connection established successfully.');
  
  // Optional: Verify PostgreSQL version
  const [result] = await sequelize.query("SELECT version();");
  console.log(`📊 PostgreSQL Version: ${result[0].version.split(' ')[1]}`);
} catch (error) {
  console.error('❌ Unable to connect to PostgreSQL:', error.message);
  console.error('Full error:', error);
}

export default sequelize;