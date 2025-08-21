import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding chat data...');

  // Create test users if they don't exist
  const testUsers = [
    {
      email: 'alice@example.com',
      name: 'Alice Johnson'
    },
    {
      email: 'bob@example.com',
      name: 'Bob Smith'
    },
    {
      email: 'carol@example.com',
      name: 'Carol Davis'
    },
    {
      email: 'dave@example.com',
      name: 'Dave Wilson'
    }
  ];

  const users = [];
  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      const hashedPassword = await hash('password123', 12);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          emailVerified: new Date()
        }
      });
      users.push(user);
      console.log(`✅ Created user: ${user.name}`);
    } else {
      users.push(existingUser);
      console.log(`ℹ️  User already exists: ${existingUser.name}`);
    }
  }

  // Create test conversations
  const conversations = [
    {
      name: 'Project Alpha Team',
      type: 'GROUP' as const,
      participants: [users[0].id, users[1].id, users[2].id]
    },
    {
      name: null,
      type: 'DIRECT' as const,
      participants: [users[0].id, users[1].id]
    },
    {
      name: 'Design Discussion',
      type: 'GROUP' as const,
      participants: [users[1].id, users[2].id, users[3].id]
    },
    {
      name: null,
      type: 'DIRECT' as const,
      participants: [users[0].id, users[3].id]
    }
  ];

  const createdConversations = [];
  for (const conversationData of conversations) {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: conversationData.type,
        participants: {
          every: {
            userId: { in: conversationData.participants }
          }
        }
      }
    });

    if (!existingConversation) {
      const conversation = await prisma.conversation.create({
        data: {
          name: conversationData.name,
          type: conversationData.type,
          participants: {
            create: conversationData.participants.map(userId => ({
              userId,
              role: 'MEMBER'
            }))
          }
        }
      });
      createdConversations.push(conversation);
      console.log(`✅ Created ${conversationData.type} conversation: ${conversationData.name || 'Direct Message'}`);
    } else {
      createdConversations.push(existingConversation);
      console.log(`ℹ️  Conversation already exists: ${conversationData.name || 'Direct Message'}`);
    }
  }

  // Create test messages
  const messages = [
    // Project Alpha Team messages
    {
      conversationId: createdConversations[0].id,
      senderId: users[0].id,
      content: "Hey team! I've been working on the new feature for Project Alpha. Anyone want to review the initial mockups?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      conversationId: createdConversations[0].id,
      senderId: users[1].id,
      content: "I'd love to see them! Can you share the Figma link?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5) // 1.5 hours ago
    },
    {
      conversationId: createdConversations[0].id,
      senderId: users[2].id,
      content: "Just finished reviewing the backend API. Everything looks good to proceed!",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      conversationId: createdConversations[0].id,
      senderId: users[0].id,
      content: "Perfect! Let's schedule a team meeting tomorrow to discuss the next steps.",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },

    // Direct message between Alice and Bob
    {
      conversationId: createdConversations[1].id,
      senderId: users[0].id,
      content: "Hi Bob! How's the new project going?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
    },
    {
      conversationId: createdConversations[1].id,
      senderId: users[1].id,
      content: "Going great! Just finished the first sprint. Want to grab coffee later?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5) // 2.5 hours ago
    },
    {
      conversationId: createdConversations[1].id,
      senderId: users[0].id,
      content: "Absolutely! How about 3 PM at the usual spot?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },

    // Design Discussion messages
    {
      conversationId: createdConversations[2].id,
      senderId: users[1].id,
      content: "What do you think about the new color scheme for the dashboard?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
    },
    {
      conversationId: createdConversations[2].id,
      senderId: users[2].id,
      content: "I love the new palette! Much more modern and accessible.",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      conversationId: createdConversations[2].id,
      senderId: users[3].id,
      content: "Agreed! The contrast ratios are much better now.",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 20) // 20 minutes ago
    },

    // Direct message between Alice and Dave
    {
      conversationId: createdConversations[3].id,
      senderId: users[0].id,
      content: "Dave, can you help me with the database migration?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1 hour ago
    },
    {
      conversationId: createdConversations[3].id,
      senderId: users[3].id,
      content: "Of course! What's the issue you're running into?",
      type: 'TEXT' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 50) // 50 minutes ago
    }
  ];

  for (const messageData of messages) {
    const message = await prisma.message.create({
      data: messageData
    });
    console.log(`✅ Created message: "${messageData.content.substring(0, 50)}..."`);
  }

  // Create some threads for threaded conversations
  const threads = [
    {
      conversationId: createdConversations[0].id,
      name: "Feature Review Discussion",
      type: 'TOPIC' as const,
      messages: [
        {
          senderId: users[1].id,
          content: "I have some concerns about the user flow in the new feature.",
          type: 'TEXT' as const,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1)
        },
        {
          senderId: users[0].id,
          content: "What specific issues are you seeing?",
          type: 'TEXT' as const,
          createdAt: new Date(Date.now() - 1000 * 60 * 55)
        },
        {
          senderId: users[1].id,
          content: "The onboarding steps feel too long. We might lose users.",
          type: 'TEXT' as const,
          createdAt: new Date(Date.now() - 1000 * 60 * 50)
        }
      ]
    }
  ];

  for (const threadData of threads) {
    const thread = await prisma.thread.create({
      data: {
        conversationId: threadData.conversationId,
        name: threadData.name,
        type: threadData.type
      }
    });

    for (const messageData of threadData.messages) {
      await prisma.message.create({
        data: {
          ...messageData,
          conversationId: threadData.conversationId,
          threadId: thread.id
        }
      });
    }
    console.log(`✅ Created thread: "${threadData.name}"`);
  }

  console.log('🎉 Chat seeding completed successfully!');
  console.log(`📊 Created ${users.length} users, ${createdConversations.length} conversations, and ${messages.length} messages`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding chat data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 