import prisma from "../lib/db.js";
import type { Conversation, Message } from "@prisma/client";

// Type definitions
type ConversationMode = "chat" | "tool" | "agent";
type MessageRole = "user" | "assistant" | "system" | "tool";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

interface FormattedMessage {
  role: MessageRole;
  content: string;
}

interface MessageWithParsedContent extends Omit<Message, "content"> {
  content: string | Record<string, unknown>;
}

export class ChatService {
  /**
   * Create a new conversation
   * @param userId - User ID
   * @param mode - chat, tool, or agent
   * @param title - Optional conversation title
   */
  async createConversation(
    userId: string,
    mode: ConversationMode = "chat",
    title: string | null = null
  ): Promise<Conversation> {
    return await prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} conversation`,
      },
    });
  }

  /**
   * Get or create a conversation for user
   * @param userId - User ID
   * @param conversationId - Optional conversation ID
   * @param mode - chat, tool, or agent
   */
  async getOrCreateConversation(
    userId: string,
    conversationId: string | null = null,
    mode: ConversationMode = "chat"
  ): Promise<Conversation | ConversationWithMessages> {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (conversation) return conversation;
    }

    // Create new conversation if not found or not provided
    return await this.createConversation(userId, mode);
  }

  /**
   * Add a message to conversation
   * @param conversationId - Conversation ID
   * @param role - user, assistant, system, tool
   * @param content - Message content
   */
  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string | Record<string, unknown>
  ): Promise<Message> {
    // Convert content to JSON string if it's an object
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }

  /**
   * Get conversation messages
   * @param conversationId - Conversation ID
   */
  async getMessages(conversationId: string): Promise<MessageWithParsedContent[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Parse JSON content back to objects if needed
    return messages.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content),
    }));
  }

  /**
   * Get all conversations for a user
   * @param userId - User ID
   */
  async getUserConversations(userId: string): Promise<
    (Conversation & {
      messages: Message[];
    })[]
  > {
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Delete a conversation
   * @param conversationId - Conversation ID
   * @param userId - User ID (for security)
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<{ count: number }> {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  /**
   * Update conversation title
   * @param conversationId - Conversation ID
   * @param title - New title
   */
  async updateTitle(
    conversationId: string,
    title: string
  ): Promise<Conversation> {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Helper to parse content (JSON or string)
   */
  parseContent(content: string): string | Record<string, unknown> {
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return content;
    }
  }

  /**
   * Format messages for AI SDK
   * @param messages - Database messages
   */
  formatMessagesForAI(messages: MessageWithParsedContent[]): FormattedMessage[] {
    return messages.map((msg) => ({
      role: msg.role as MessageRole,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }
}