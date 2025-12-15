import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chat.services';
import { AIService } from '../cli/ai/google.service';
import type { CoreMessage } from 'ai';

const router = Router();
const chatService = new ChatService();

// Lazy initialization of AI service to avoid import-time errors
let aiService: AIService | null = null;
const getAIService = () => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

// Type definitions
type ConversationMode = "chat" | "tool" | "agent";
type MessageRole = "user" | "assistant" | "system" | "tool";

interface CreateConversationRequest {
  userId: string;
  mode?: ConversationMode;
  title?: string;
}

interface AddMessageRequest {
  conversationId: string;
  role: MessageRole;
  content: string;
}

interface StreamChatRequest {
  conversationId: string;
  message: string;
}

/**
 * Get all conversations for a user
 * GET /api/chat/conversations/:userId
 */
router.get('/conversations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const conversations = await chatService.getUserConversations(userId);
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
    });
  }
});

/**
 * Create a new conversation
 * POST /api/chat/conversations
 */
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { userId, mode = 'chat', title } = req.body as CreateConversationRequest;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const conversation = await chatService.createConversation(userId, mode, title);
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create conversation' 
    });
  }
});

/**
 * Get a specific conversation with messages
 * GET /api/chat/conversations/:conversationId/messages
 */
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch messages' 
    });
  }
});

/**
 * Add a message to conversation
 * POST /api/chat/messages
 */
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId, role, content } = req.body as AddMessageRequest;
    
    if (!conversationId || !role || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId, role, and content are required' 
      });
    }

    const message = await chatService.addMessage(conversationId, role, content);
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add message' 
    });
  }
});

/**
 * Stream chat response
 * POST /api/chat/stream
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { conversationId, message } = req.body as StreamChatRequest;
    
    if (!conversationId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId and message are required' 
      });
    }

    // Save user message
    await chatService.addMessage(conversationId, 'user', message);

    // Get conversation history
    const dbMessages = await chatService.getMessages(conversationId);
    const aiMessages = chatService.formatMessagesForAI(dbMessages);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Stream AI response
    await getAIService().sendMessage(
      aiMessages as CoreMessage[],
      (chunk: string) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    );

    // Save assistant response
    await chatService.addMessage(conversationId, 'assistant', fullResponse);

    // Update conversation title if first message
    const messageCount = dbMessages.length;
    if (messageCount === 1) {
      const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
      await chatService.updateTitle(conversationId, title);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', content: fullResponse })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming chat:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Failed to stream chat' 
    })}\n\n`);
    res.end();
  }
});

/**
 * Delete a conversation
 * DELETE /api/chat/conversations/:conversationId
 */
router.delete('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    await chatService.deleteConversation(conversationId, userId);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete conversation' 
    });
  }
});

/**
 * Update conversation title
 * PATCH /api/chat/conversations/:conversationId/title
 */
router.patch('/conversations/:conversationId/title', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    const conversation = await chatService.updateTitle(conversationId, title);
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error updating title:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update title' 
    });
  }
});

export default router;
