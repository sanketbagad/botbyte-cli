import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, multiselect } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google.service.js";
import { ChatService } from "../../services/chat.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { 
  availableTools,
  getEnabledTools, 
  enableTools, 
  getEnabledToolNames,
  resetTools,
  type ToolDefinition
} from "../../config/tool.config.js";
import type { Conversation, Message, User } from "@prisma/client";

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

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

// Configure marked for terminal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const terminalExtension = (markedTerminal as any)({
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

const aiService = new AIService();
const chatService = new ChatService();

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
 * Select tools to enable for the chat session
 */
async function selectTools(): Promise<boolean> {
  const toolOptions = availableTools.map((tool: ToolDefinition) => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));

  const selectedTools = await multiselect({
    message: chalk.cyan("🛠️  Select tools to enable (Space to select, Enter to confirm):"),
    options: toolOptions,
    required: false,
  });

  if (isCancel(selectedTools)) {
    cancel(chalk.yellow("Tool selection cancelled"));
    process.exit(0);
  }

  // Enable selected tools
  enableTools(selectedTools as string[]);

  if (selectedTools.length === 0) {
    const noToolsBox = boxen(
      chalk.yellow("⚠️  No tools selected. AI will work without tools."),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        dimBorder: true,
      }
    );
    console.log(noToolsBox);
  } else {
    const toolsList = (selectedTools as string[])
      .map((id) => {
        const tool = availableTools.find((t: ToolDefinition) => t.id === id);
        return `  ${chalk.green("•")} ${tool?.name || id}`;
      })
      .join("\n");

    const toolsBox = boxen(
      `${chalk.green.bold("✅ Enabled tools:")}\n${toolsList}`,
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: chalk.bold.green("🛠️  Active Tools"),
        titleAlignment: "center",
      }
    );
    console.log(toolsBox);
  }

  return selectedTools.length > 0;
}

/**
 * Initialize or load a conversation
 */
async function initConversation(
  userId: string,
  conversationId: string | null = null,
  mode: ConversationMode = "tool"
): Promise<Conversation | ConversationWithMessages> {
  const spinner = yoctoSpinner({ 
    text: chalk.cyan("📂 Loading conversation..."),
    color: "cyan"
  }).start();
  
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );
  
  spinner.success("Conversation loaded");
  
  // Get enabled tool names for display
  const enabledToolNames = getEnabledToolNames();
  const toolsDisplay = enabledToolNames.length > 0 
    ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
    : `\n${chalk.gray("No tools enabled")}`;
  
  // Display conversation info in a box
  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Tool Calling Session",
      titleAlignment: "center",
    }
  );
  
  console.log(conversationInfo);
  
  // Display existing messages if any (type guard for ConversationWithMessages)
  const conversationWithMessages = conversation as ConversationWithMessages;
  if (conversationWithMessages.messages?.length > 0) {
    console.log(chalk.yellow.bold("\n📜 Previous messages:"));
    displayMessages(conversationWithMessages.messages);
  }
  
  return conversation;
}

/**
 * Display messages in a styled format
 */
function displayMessages(messages: DisplayMessage[]): void {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: chalk.bold.blue("👤 You"),
        titleAlignment: "left",
      });
      console.log(userBox);
    } else if (msg.role === "assistant") {
      const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      const renderedContent = marked.parse(content);
      const renderedStr = typeof renderedContent === "string" ? renderedContent : "";
      const assistantBox = boxen(renderedStr.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: chalk.bold.green("🤖 Assistant (with tools)"),
        titleAlignment: "left",
      });
      console.log(assistantBox);
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
 * Get AI response with streaming and tool support
 */
async function getAIResponse(conversationId: string): Promise<string> {
  const spinner = yoctoSpinner({ 
    text: chalk.cyan("🧠 AI is thinking with tools..."),
    color: "cyan" 
  }).start();

  const dbMessages = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages);

  const tools = getEnabledTools();
  
  let fullResponse = "";
  let isFirstChunk = true;
  const toolCallsDetected: ToolCall[] = [];
  
  try {
    // IMPORTANT: Pass tools in the streamText config
    const result = await aiService.sendMessage(
      aiMessages as Parameters<typeof aiService.sendMessage>[0], 
      (chunk: string) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          console.log(chalk.green.bold("🤖 Assistant:"));
          console.log(chalk.gray("─".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
        process.stdout.write(chalk.white(chunk));
      },
      tools,
      (toolCall: ToolCall) => {
        toolCallsDetected.push(toolCall);
      }
    );
    
    // Display tool calls if any
    if (toolCallsDetected.length > 0) {
      console.log("\n");
      const toolCallContent = toolCallsDetected
        .map((tc) => 
          `${chalk.cyan("🔧 Tool:")} ${chalk.bold(tc.toolName)}\n${chalk.gray("Args:")} ${JSON.stringify(tc.args, null, 2)}`
        )
        .join("\n\n");
      
      const toolCallBox = boxen(toolCallContent, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: chalk.bold.cyan("🛠️  Tool Calls"),
        titleAlignment: "left",
      });
      console.log(toolCallBox);
    }

    // Display tool results if any
    if (result.toolResults && result.toolResults.length > 0) {
      const toolResultContent = result.toolResults
        .map((tr) => 
          `${chalk.green("✅ Tool:")} ${chalk.bold(tr.toolName)}\n${chalk.gray("Result:")} ${JSON.stringify(tr.result, null, 2).slice(0, 200)}...`
        )
        .join("\n\n");
      
      const toolResultBox = boxen(toolResultContent, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        title: chalk.bold.green("📊 Tool Results"),
        titleAlignment: "left",
      });
      console.log(toolResultBox);
    }
    
    // Render markdown response
    console.log("\n");
    console.log(chalk.gray("─".repeat(60)));
    
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
  } catch (error: unknown) {
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
 * Main chat loop with tool support
 */
async function chatLoop(conversation: Conversation | ConversationWithMessages): Promise<void> {
  const enabledToolNames = getEnabledToolNames();
  
  const helpContent = `${chalk.yellow("•")} Type your message and press ${chalk.bold("Enter")}
${chalk.yellow("•")} AI has access to: ${enabledToolNames.length > 0 ? chalk.cyan(enabledToolNames.join(", ")) : chalk.gray("No tools")}
${chalk.yellow("•")} Type ${chalk.bold.green('"exit"')} or ${chalk.bold.green('"quit"')} to end session
${chalk.yellow("•")} Press ${chalk.bold.red("Ctrl+C")} to quit anytime`;

  const helpBox = boxen(helpContent, {
    padding: 1,
    margin: { bottom: 1 },
    borderStyle: "round",
    borderColor: "yellow",
    dimBorder: true,
    title: chalk.bold.yellow("📖 Commands & Tips"),
    titleAlignment: "left",
  });
  
  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("💬 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 You",
      titleAlignment: "left",
    });
    console.log(userBox);

    await saveMessage(conversation.id, "user", userInput);
    const messages = await chatService.getMessages(conversation.id);
    const aiResponse = await getAIResponse(conversation.id);
    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(conversation.id, userInput, messages.length);
  }
}

/**
 * Start the tool chat session
 */
export async function startToolChat(conversationId: string | null = null): Promise<void> {
  try {
    console.clear();
    
    const bannerContent = `${chalk.bold.magenta("🛠️  BOTBYTE AI")} ${chalk.dim("- Tool Calling Mode")}

${chalk.dim("Powered by")} ${chalk.yellow("Google Gemini")} ${chalk.dim("• Tools • Streaming")}`;

    const bannerBox = boxen(bannerContent, {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "cyan",
      title: chalk.bold.cyan("✨ Welcome"),
      titleAlignment: "center",
    });
    console.log(bannerBox);
    
    intro(chalk.bold.cyan("🚀 Starting Tool Chat..."));

    const user = await getUserFromToken();
    
    // Select tools
    await selectTools();
    
    const conversation = await initConversation(user.id, conversationId, "tool");
    await chatLoop(conversation);
    
    // Reset tools on exit
    resetTools();
    
    outro(chalk.green("✨ Thanks for using Botbyte AI with tools!"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    const errorContent = `${chalk.red.bold("❌ Error:")} ${chalk.red(errorMessage)}

${chalk.dim("Troubleshooting:")}
${chalk.dim("  •")} Make sure you're logged in: ${chalk.cyan("botbyte login")}
${chalk.dim("  •")} Check your internet connection
${chalk.dim("  •")} Try again: ${chalk.cyan("botbyte tool")}`;

    const errorBox = boxen(errorContent, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      title: chalk.bold.red("Error"),
      titleAlignment: "center",
    });
    console.log(errorBox);
    resetTools();
    process.exit(1);
  }
}