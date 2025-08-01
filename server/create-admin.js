const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create admin user
async function createAdminUser() {
  try {
    const User = require('./models/User');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: passwordHash,
      role: 'admin',
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: AdminPass123!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Creating admin user...\n');
  
  await connectToDatabase();
  await createAdminUser();
  
  console.log('\n🎉 Admin user setup completed!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
}); 