import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  const bcpass = bcryptjs.hashSync('123456', 10);

  // Delete old data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password: bcpass,
      role: 'admin',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: bcpass,
      role: 'user',
    },
  });

  // Create conversations
  const adminConv = await prisma.conversation.create({
    data: {
      userId: admin.id,
      title: 'Admin Chat',
    },
  });

  const userConv = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'General Discussion',
    },
  });

  // Create messages for adminConv
  await prisma.message.createMany({
    data: [
      {
        conversationId: adminConv.id,
        role: 'admin',
        content: 'Hello, how can I help you today?',
      },
      {
        conversationId: adminConv.id,
        role: 'user',
        content: 'I have a question about my account.',
      },
    ],
  });

  // Create messages for userConv
  await prisma.message.createMany({
    data: [
      {
        conversationId: userConv.id,
        role: 'user',
        content: 'Hi everyone, I am new here!',
      },
      {
        conversationId: userConv.id,
        role: 'admin',
        content: 'Welcome to the chat, John!',
      },
    ],
  });

  console.log('English seed data inserted!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
