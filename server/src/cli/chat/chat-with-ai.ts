import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, intro, outro } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google.service.js";
import { ChatService } from "../../services/chat.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import type { Conversation, Message, User } from "@prisma/client";
import type { CoreMessage } from "ai";

// Type definitions
type ConversationMode = "chat" | "tool" | "agent";
type MessageRole = "user" | "assistant" | "system" | "tool";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

interface DisplayMessage {
  role: string;
  content: string;
}

// Configure marked to use terminal renderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const terminalExtension = (markedTerminal as any)({
  // Styling options for terminal output
  code: chalk.cyan,
  blockquote: chalk.gray.italic,
  heading: chalk.green.bold,
  firstHeading: chalk.magenta.underline.bold,
  hr: chalk.reset,
  listitem: chalk.reset,
  list: chalk.reset,
  paragraph: chalk.reset,
  strong: chalk.bold,
  em: chalk.italic,
  codespan: chalk.yellow.bgBlack,
  del: chalk.dim.gray.strikethrough,
  link: chalk.blue.underline,
  href: chalk.blue.underline,
});
marked.use(terminalExtension);

// Initialize services
const aiService = new AIService();
const chatService = new ChatService();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Display a stylish welcome banner
 */
function displayWelcomeBanner(): void {
  const bannerContent = `${chalk.bold.magenta("🤖 BOTBYTE AI")}
${chalk.dim("Your Intelligent CLI Companion")}

${chalk.dim("Powered by")} ${chalk.yellow("Google Gemini")} ${chalk.dim("• Streaming • Markdown")}`;

  const box = boxen(bannerContent, {
    padding: 1,
    margin: 1,
    borderStyle: "double",
    borderColor: "cyan",
    title: chalk.bold.cyan("✨ Welcome"),
    titleAlignment: "center",
  });
  console.log(box);
}

/**
 * Display help information
 */
function displayHelp(): void {
  const helpContent = `${chalk.yellow("•")} Type your message and press ${chalk.bold("Enter")}
${chalk.yellow("•")} Type ${chalk.bold.green('"exit"')} or ${chalk.bold.green('"quit"')} to end session
${chalk.yellow("•")} Type ${chalk.bold.green('"clear"')} to clear the screen
${chalk.yellow("•")} Type ${chalk.bold.green('"help"')} to show this message
${chalk.yellow("•")} Press ${chalk.bold.red("Ctrl+C")} to quit anytime
${chalk.yellow("•")} Responses support ${chalk.bold("Markdown")} formatting`;

  const helpBox = boxen(helpContent, {
    padding: 1,
    borderStyle: "round",
    borderColor: "yellow",
    dimBorder: true,
    title: chalk.bold.yellow("📖 Commands & Tips"),
    titleAlignment: "left",
  });
  console.log(helpBox);
}

/**
 * Get user from stored token
 */
async function getUserFromToken(): Promise<User> {
  const token = await getStoredToken();

  if (!token?.accessToken) {
    throw new Error("Not authenticated. Please run 'botbyte login' first.");
  }

  const spinner = yoctoSpinner({ 
    text: chalk.cyan("🔐 Authenticating..."),
    color: "cyan"
  }).start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.accessToken },
      },
    },
  });

  if (!user) {
    spinner.error(chalk.red("User not found"));
    throw new Error("User not found. Please login again.");
  }

  spinner.success(chalk.green(`Welcome back, ${chalk.bold(user.name || user.email)}! 👋`));
  return user;
}

/**
 * Initialize or load a conversation
 */
async function initConversation(
  userId: string,
  conversationId: string | null = null,
  mode: ConversationMode = "chat"
): Promise<ConversationWithMessages | Conversation> {
  const spinner = yoctoSpinner({ 
    text: chalk.cyan("📂 Loading conversation..."),
    color: "cyan"
  }).start();

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );

  spinner.success(chalk.green("Conversation ready"));

  // Display conversation info using boxen
  const sessionInfo = `${chalk.dim("Title:")} ${chalk.white(conversation.title.slice(0, 45))}
${chalk.dim("Mode:")}  ${chalk.cyan(conversation.mode)}
${chalk.dim("ID:")}    ${chalk.gray(conversation.id.slice(0, 24))}...`;

  const sessionBox = boxen(sessionInfo, {
    padding: 1,
    borderStyle: "round",
    borderColor: "cyan",
    title: chalk.bold.cyan("💬 Chat Session"),
    titleAlignment: "left",
  });
  console.log(sessionBox);

  // Display existing messages if any
  const conversationWithMessages = conversation as ConversationWithMessages;
  if (conversationWithMessages.messages?.length > 0) {
    console.log(chalk.yellow.bold("📜 Previous Messages"));
    console.log(chalk.gray("─".repeat(60)));
    displayMessages(conversationWithMessages.messages);
    console.log(chalk.gray("─".repeat(60)));
    console.log();
  }

  return conversation;
}

/**
 * Display messages in a styled format
 */
function displayMessages(messages: DisplayMessage[]): void {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      console.log();
      console.log(chalk.blue.bold("  👤 You:"));
      console.log(chalk.white(`     ${msg.content}`));
    } else if (msg.role === "assistant") {
      console.log();
      console.log(chalk.green.bold("  🤖 Assistant:"));
      const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      const rendered = marked.parse(content);
      const renderedStr = typeof rendered === "string" ? rendered : "";
      // Indent the rendered content
      const indentedContent = renderedStr
        .split("\n")
        .map((line) => `     ${line}`)
        .join("\n");
      console.log(indentedContent);
    }
  });
}

/**
 * Save a message to the conversation
 */
async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
): Promise<Message> {
  return await chatService.addMessage(conversationId, role, content);
}

/**
 * Get AI response with streaming
 */
async function getAIResponse(conversationId: string): Promise<string> {
  const spinner = yoctoSpinner({
    text: chalk.cyan("🧠 AI is thinking..."),
    color: "cyan",
  }).start();

  const dbMessages = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages);

  let fullResponse = "";
  let isFirstChunk = true;

  try {
    const result = await aiService.sendMessage(
      aiMessages as CoreMessage[],
      (chunk: string) => {
        // Stop spinner on first chunk and show header
        if (isFirstChunk) {
          spinner.stop();
          console.log();
          console.log(chalk.green.bold("  🤖 Assistant:"));
          console.log(chalk.gray("  " + "─".repeat(56)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
        // Stream the chunk directly (raw text, not markdown yet)
        process.stdout.write(chalk.white(chunk));
      }
    );

    // Clear the raw output and render markdown
    console.log("\n");
    console.log(chalk.gray("  " + "─".repeat(56)));
    
    // Render final markdown version
    const renderedMarkdown = marked.parse(fullResponse);
    const renderedStr = typeof renderedMarkdown === "string" ? renderedMarkdown : "";
    if (renderedStr.trim() !== fullResponse.trim()) {
      console.log(chalk.dim("\n  📝 Formatted Response:"));
      const indentedMarkdown = renderedStr
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");
      console.log(indentedMarkdown);
    }
    console.log();

    return result.content;
  } catch (error) {
    spinner.error(chalk.red("Failed to get AI response"));
    throw error;
  }
}

/**
 * Update conversation title based on first message
 */
async function updateConversationTitle(
  conversationId: string,
  userInput: string,
  messageCount: number
): Promise<void> {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}

/**
 * Main chat loop
 */
async function chatLoop(conversation: Conversation | ConversationWithMessages): Promise<void> {
  displayHelp();

  let messageCount = 0;
  const conversationWithMessages = conversation as ConversationWithMessages;
  if (conversationWithMessages.messages) {
    messageCount = conversationWithMessages.messages.length;
  }

  while (true) {
    console.log();
    const userInput = await text({
      message: chalk.blue.bold("💬 You"),
      placeholder: "Type your message... (or 'exit' to quit)",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    // Handle cancellation (Ctrl+C)
    if (isCancel(userInput)) {
      console.log();
      console.log(chalk.yellow("👋 Chat session ended. Goodbye!"));
      console.log();
      process.exit(0);
    }

    // Handle exit command
    const input = userInput.toLowerCase().trim();
    if (input === "exit" || input === "quit" || input === "q") {
      console.log();
      console.log(chalk.yellow("👋 Chat session ended. See you next time!"));
      console.log();
      break;
    }

    // Handle help command
    if (input === "help" || input === "?") {
      displayHelp();
      continue;
    }

    // Handle clear command
    if (input === "clear" || input === "cls") {
      console.clear();
      displayWelcomeBanner();
      continue;
    }

    // Save user message
    await saveMessage(conversation.id, "user", userInput);
    messageCount++;

    // Get AI response with streaming
    const aiResponse = await getAIResponse(conversation.id);

    // Save AI response
    await saveMessage(conversation.id, "assistant", aiResponse);
    messageCount++;

    // Update title if first exchange
    await updateConversationTitle(conversation.id, userInput, Math.ceil(messageCount / 2));
  }
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Start the chat session
 */
export async function startChat(
  mode: ConversationMode = "chat",
  conversationId: string | null = null
): Promise<void> {
  try {
    console.clear();
    displayWelcomeBanner();
    
    intro(chalk.bold.cyan("🚀 Starting Botbyte AI Chat..."));

    const user = await getUserFromToken();
    const conversation = await initConversation(user.id, conversationId, mode);
    await chatLoop(conversation);

    outro(chalk.green("✨ Thanks for chatting with Botbyte AI!"));
  } catch (error: unknown) {
    console.log();
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    const errorContent = `${chalk.red.bold("❌ Error:")} ${chalk.red(errorMessage)}

${chalk.dim("Troubleshooting:")}
${chalk.dim("  •")} Make sure you're logged in: ${chalk.cyan("botbyte login")}
${chalk.dim("  •")} Check your internet connection
${chalk.dim("  •")} Try again: ${chalk.cyan("botbyte chat")}`;

    const errorBox = boxen(errorContent, {
      padding: 1,
      borderStyle: "round",
      borderColor: "red",
      title: chalk.bold.red("Error"),
      titleAlignment: "center",
    });
    console.log(errorBox);
    process.exit(1);
  }
}