import { sequelize, User } from "./models/index.js";
import bcrypt from 'bcrypt';

async function migrate() {
  try {
    console.log('🔄 Starting migration...');
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');
    
    // Check if admin exists
    const adminExists = await User.findOne({ where: { email: 'admin@parking.com' } });
    
    if (!adminExists) {
      // Create default admin
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await User.create({
        email: 'admin@parking.com',         
        password: hashedPassword,
        role: 'admin',
        verification_status: 'verified',     
        phone_number: '+1234567890'          
      });
      
      console.log('👑 Default admin created:');
      console.log('📧 Email: admin@parking.com');
      console.log('🔑 Password: Admin@123');
      console.log('⚠️  CHANGE THESE CREDENTIALS IN PRODUCTION!');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create default owner
    const ownerExists = await User.findOne({ where: { email: 'owner@parking.com' } });
    if (!ownerExists) {
      const hashedPassword = await bcrypt.hash('Owner@123', 10);
      await User.create({
        email: 'owner@parking.com',
        password: hashedPassword,
        role: 'owner',
        verification_status: 'verified',
        phone_number: '+1234567891'
      });
      console.log('✅ Default owner created');
    }
    
    // Create default user
    const userExists = await User.findOne({ where: { email: 'user@example.com' } });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('User@123', 10);
      await User.create({
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        verification_status: 'verified',
        phone_number: '+1234567892'
      });
      console.log('✅ Default user created');
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n=== DEFAULT LOGINS ===');
    console.log('Admin: admin@parking.com / Admin@123');
    console.log('Owner: owner@parking.com / Owner@123');
    console.log('User: user@example.com / User@123');
    console.log('====================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

migrate();