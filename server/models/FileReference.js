import { prisma } from '../utils/prisma.js';

class FileReference {
  static async create(data) {
    return prisma.fileReference.create({
      data: {
        fileId: data.fileId,
        messageId: data.messageId,
        threadId: data.threadId,
        conversationId: data.conversationId,
        type: data.type || 'chat',
        metadata: data.metadata || {}
      }
    });
  }

  static async findByMessage(messageId) {
    return prisma.fileReference.findMany({
      where: { messageId },
      include: {
        file: true
      }
    });
  }

  static async findByThread(threadId) {
    return prisma.fileReference.findMany({
      where: { threadId },
      include: {
        file: true
      }
    });
  }

  static async findByConversation(conversationId) {
    return prisma.fileReference.findMany({
      where: { conversationId },
      include: {
        file: true
      }
    });
  }

  static async delete(id) {
    return prisma.fileReference.delete({
      where: { id }
    });
  }

  static async update(id, data) {
    return prisma.fileReference.update({
      where: { id },
      data
    });
  }
}

export default FileReference; 