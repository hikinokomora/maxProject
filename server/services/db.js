const { PrismaClient } = require('@prisma/client');

// Instantiate a single PrismaClient for the whole server
// SQLite DB path configured in prisma/schema.prisma (file:./data/app.db)
const prisma = new PrismaClient();

module.exports = prisma;
