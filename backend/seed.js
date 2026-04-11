const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create Alumni users
  const alumni1 = await prisma.user.upsert({
    where: { email: 'priya.sharma@google.com' },
    update: {},
    create: {
      role: 'ALUMNI',
      name: 'Priya Sharma',
      email: 'priya.sharma@google.com',
      department: 'Computer Science',
      verification_status: 'VERIFIED'
    }
  });

  const alumni2 = await prisma.user.upsert({
    where: { email: 'rahul.verma@microsoft.com' },
    update: {},
    create: {
      role: 'ALUMNI',
      name: 'Rahul Verma',
      email: 'rahul.verma@microsoft.com',
      department: 'Electrical Engineering',
      verification_status: 'VERIFIED'
    }
  });

  // Create a Student
  const student1 = await prisma.user.upsert({
    where: { email: 'stu1001@alumniconnect.edu' },
    update: {},
    create: {
      role: 'STUDENT',
      name: 'Alice Johnson',
      email: 'stu1001@alumniconnect.edu',
      department: 'Computer Science',
      verification_status: 'VERIFIED'
    }
  });

  // Create TNP Coordinator
  const tnp = await prisma.user.upsert({
    where: { email: 'tnp@alumniconnect.edu' },
    update: {},
    create: {
      role: 'TNP',
      name: 'TNP Coordinator',
      email: 'tnp@alumniconnect.edu',
      verification_status: 'VERIFIED'
    }
  });

  // Create schedule slots
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  await prisma.scheduleSlot.create({
    data: {
      alumni_id: alumni1.id,
      start_time: tomorrow,
      end_time: tomorrowEnd,
      status: 'OPEN'
    }
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  const dayAfterEnd = new Date(dayAfter);
  dayAfterEnd.setHours(15, 0, 0, 0);

  await prisma.scheduleSlot.create({
    data: {
      alumni_id: alumni2.id,
      start_time: dayAfter,
      end_time: dayAfterEnd,
      status: 'OPEN'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - Alumni: ${alumni1.name}, ${alumni2.name}`);
  console.log(`   - Student: ${student1.name}`);
  console.log(`   - TNP: ${tnp.name}`);
  console.log(`   - Schedule slots: 2 open`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
