import sequelize from "./src/config/db.js";
import User from "./src/models/User.js";
import bcrypt from "bcrypt";

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: "admin@parking.com" }
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    
    await User.create({
      email: "admin@parking.com",
      password: hashedPassword,
      role: "admin",
      verification_status: "verified"
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@parking.com");
    console.log("Password: Admin@123");
    
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    process.exit();
  }
};

seedAdmin();