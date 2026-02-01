import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DATABASE_URL, // Render provides this automatically
  {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
    
    // Optional: Verify PostgreSQL version
    const [result] = await sequelize.query("SELECT version();");
    console.log(`📊 PostgreSQL Version: ${result[0].version.split(' ')[1]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    console.error('Connection details:', {
      database: process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL not set',
      nodeEnv: process.env.NODE_ENV
    });
    return false;
  }
}

// Call test connection
testConnection();

export default sequelize;