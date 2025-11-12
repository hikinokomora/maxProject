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

async function seedAcademics() {
  try {
    // If there are groups already, skip
    const existingGroups = await prisma.group.count();
    if (existingGroups > 0) {
      console.log('[Seed] ✓ Academic data already present');
      return;
    }

    // Create institute, direction, group
    const inst = await prisma.institute.create({ data: { name: 'Институт информационных технологий', shortName: 'ИИТ' } });
    const dir = await prisma.direction.create({ data: { name: 'Информатика и вычислительная техника', code: '09.03.01', level: 'BACHELOR', instituteId: inst.id } });
    const grp = await prisma.group.create({ data: { name: 'ИВТ-101', course: 1, directionId: dir.id } });
    const teacher = await prisma.teacher.create({ data: { fullName: 'Петров П.П.', department: 'Кафедра программной инженерии' } });

    // Create a couple of lessons and attach to group and teacher
    const l1 = await prisma.lesson.create({ data: { weekday: 'Понедельник', startTime: '09:00', endTime: '10:30', subject: 'Математический анализ', room: '201', type: 'лекция' } });
    const l2 = await prisma.lesson.create({ data: { weekday: 'Понедельник', startTime: '10:45', endTime: '12:15', subject: 'Программирование', room: '305', type: 'практика' } });
    await prisma.group.update({ where: { id: grp.id }, data: { lessons: { connect: [{ id: l1.id }, { id: l2.id }] } } });
    await prisma.teacher.update({ where: { id: teacher.id }, data: { lessons: { connect: [{ id: l1.id }, { id: l2.id }] } } });

    // Seed a couple of events if none
    const eventsCount = await prisma.event.count();
    if (eventsCount === 0) {
      await prisma.event.createMany({ data: [
        { title: 'День открытых дверей', description: 'Приглашаем абитуриентов и их родителей', date: '2025-12-01', time: '10:00', location: 'Главный корпус, актовый зал', category: 'university' },
        { title: 'Научная конференция студентов', description: 'Итоги НИР', date: '2025-12-05', time: '14:00', location: 'Конференц-зал', category: 'academic' }
      ]});
    }

    console.log('[Seed] ✅ Academic data seeded');
  } catch (e) {
    console.warn('[Seed] Academic seed failed:', e.message);
  }
}

module.exports = { seedAdmin, seedAcademics };
