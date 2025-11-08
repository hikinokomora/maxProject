// Admin seeding utility - creates default admin user on first startup
const bcrypt = require('bcrypt');
const prisma = require('./db');

const SALT_ROUNDS = 10;

/**
 * Seed admin user from environment variables
 * Called on server startup to ensure admin account exists
 */
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminName || !adminPassword) {
      console.warn('[Seed] ⚠️  Admin credentials not set in .env - skipping admin seed');
      console.warn('   Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD to create admin user');
      return;
    }

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existing) {
      console.log('[Seed] ✓ Admin user already exists:', adminEmail);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log('[Seed] ✅ Admin user created:', admin.email);
    console.log('[Seed] 📧 Email:', admin.email);
    console.log('[Seed] 👤 Name:', admin.name);
    console.log('[Seed] 🔐 Role:', admin.role);
    console.warn('[Seed] ⚠️  Remember to change the default password after first login!');
    
  } catch (error) {
    console.error('[Seed] ❌ Failed to seed admin user:', error.message);
  }
}

module.exports = { seedAdmin };
