// prisma/seed.ts
import { PrismaClient, Role, Priority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo org
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Organization',
    },
  });

  const adminHash = await bcrypt.hash('Admin123', 12);
  const managerHash = await bcrypt.hash('Manager123', 12);
  const memberHash = await bcrypt.hash('Member123', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      passwordHash: adminHash,
      role: Role.ADMIN,
      orgId: org.id,
    },
  });

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      name: 'Demo Manager',
      passwordHash: managerHash,
      role: Role.MANAGER,
      orgId: org.id,
    },
  });

  // Member
  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: {
      email: 'member@demo.com',
      name: 'Demo Member',
      passwordHash: memberHash,
      role: Role.MEMBER,
      orgId: org.id,
    },
  });

  // Project
  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Alpha Project',
      description: 'Demo project for testing',
      orgId: org.id,
      createdById: admin.id,
    },
  });

  // Tasks
  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Setup CI pipeline',
        description: 'Configure GitHub Actions for automated testing',
        priority: Priority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: manager.id,
        projectId: project.id,
        orgId: org.id,
        createdById: admin.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Write unit tests',
        description: 'Add tests for auth and task modules',
        priority: Priority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeId: member.id,
        projectId: project.id,
        orgId: org.id,
        createdById: manager.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Design database schema',
        description: 'Draft ERD and index strategy',
        priority: Priority.HIGH,
        status: TaskStatus.DONE,
        assigneeId: admin.id,
        projectId: project.id,
        orgId: org.id,
        createdById: admin.id,
        completedAt: new Date(),
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  ADMIN   → admin@demo.com   / Admin123');
  console.log('  MANAGER → manager@demo.com / Manager123');
  console.log('  MEMBER  → member@demo.com  / Member123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
