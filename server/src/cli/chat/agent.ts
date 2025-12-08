import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, confirm } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { AIService } from "../ai/google.service.js";
import { ChatService } from "../../services/chat.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { generateApplication } from "../../config/ai-agent.js";
import type { Conversation, Message, User } from "@prisma/client";

// Type definitions
type ConversationMode = "chat" | "tool" | "agent";
type MessageRole = "user" | "assistant" | "system" | "tool";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// Initialize services
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
 * Initialize or load an agent conversation
 */
async function initConversation(
  userId: string,
  conversationId: string | null = null
): Promise<Conversation | ConversationWithMessages> {
  const spinner = yoctoSpinner({
    text: chalk.cyan("📂 Loading conversation..."),
    color: "cyan"
  }).start();

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    "agent" as ConversationMode
  );

  spinner.success(chalk.green("Conversation ready"));
  
  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` +
    `${chalk.gray("ID:")} ${conversation.id}\n` +
    `${chalk.gray("Mode:")} ${chalk.magenta("Agent (Code Generator)")}\n` +
    `${chalk.cyan("Working Directory:")} ${process.cwd()}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "🤖 Agent Mode",
      titleAlignment: "center",
    }
  );
  
  console.log(conversationInfo);
  
  return conversation;
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
 * Main agent loop for generating applications
 */
async function agentLoop(conversation: Conversation | ConversationWithMessages): Promise<void> {
  const helpContent = `${chalk.cyan.bold("💡 What can the agent do?")}

${chalk.yellow("•")} Generate complete applications from descriptions
${chalk.yellow("•")} Create all necessary files and folders
${chalk.yellow("•")} Include setup instructions and commands
${chalk.yellow("•")} Generate production-ready code

${chalk.green.bold("📝 Examples:")}
${chalk.white('• "Build a todo app with React and Tailwind"')}
${chalk.white('• "Create a REST API with Express and MongoDB"')}
${chalk.white('• "Make a weather app using OpenWeatherMap API"')}

${chalk.dim('Type "exit" or "quit" to end the session')}`;

  const helpBox = boxen(helpContent, {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💡 Agent Instructions",
    }
  );
  
  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.magenta("🤖 What would you like to build?"),
      placeholder: "Describe your application...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description cannot be empty";
        }
        if (value.trim().length < 10) {
          return "Please provide more details (at least 10 characters)";
        }
      },
    });

    if (isCancel(userInput)) {
      console.log(chalk.yellow("\n👋 Agent session cancelled\n"));
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("\n👋 Agent session ended\n"));
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 Your Request",
      titleAlignment: "left",
    });
    console.log(userBox);

    // Save user message
    await saveMessage(conversation.id, "user", userInput);

    try {
      // Generate application using structured output
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd()
      );

      if (result && result.success) {
        // Save successful generation details
        const responseMessage = `Generated application: ${result.folderName}\n` +
          `Files created: ${result.files.length}\n` +
          `Location: ${result.appDir}\n\n` +
          `Setup commands:\n${result.commands.join('\n')}`;
        
        await saveMessage(conversation.id, "assistant", responseMessage);

        // Ask if user wants to generate another app
        const continuePrompt = await confirm({
          message: chalk.cyan("Would you like to generate another application?"),
          initialValue: false,
        });

        if (isCancel(continuePrompt) || !continuePrompt) {
          console.log(chalk.yellow("\n👋 Great! Check your new application.\n"));
          break;
        }

      } else {
        throw new Error("Generation returned no result");
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      const errorBox = boxen(
        `${chalk.red.bold("❌ Error:")} ${chalk.red(errorMessage)}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "red",
          title: chalk.bold.red("Generation Failed"),
          titleAlignment: "left",
        }
      );
      console.log(errorBox);
      
      await saveMessage(conversation.id, "assistant", `Error: ${errorMessage}`);
      
      const retry = await confirm({
        message: chalk.cyan("🔄 Would you like to try again?"),
        initialValue: true,
      });

      if (isCancel(retry) || !retry) {
        break;
      }
    }
  }
}

/**
 * Start the agent chat session
 */
export async function startAgentChat(conversationId: string | null = null): Promise<void> {
  try {
    console.clear();
    
    const bannerContent = `${chalk.bold.magenta("🤖 BOTBYTE AI")} ${chalk.dim("- Agent Mode")}

${chalk.dim("Autonomous Application Generator")}
${chalk.dim("Powered by")} ${chalk.yellow("Google Gemini")}`;

    const bannerBox = boxen(bannerContent, {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "magenta",
      title: chalk.bold.magenta("✨ Welcome"),
      titleAlignment: "center",
    });
    console.log(bannerBox);
    
    intro(chalk.bold.magenta("🚀 Starting Agent Mode..."));

    const user = await getUserFromToken();
    
    // Warning about file system access
    const shouldContinue = await confirm({
      message: chalk.yellow("⚠️  The agent will create files and folders in the current directory. Continue?"),
      initialValue: true,
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode cancelled"));
      process.exit(0);
    }
    
    const conversation = await initConversation(user.id, conversationId);
    await agentLoop(conversation);
    
    outro(chalk.green.bold("✨ Thanks for using Botbyte AI Agent Mode!"));
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    const errorContent = `${chalk.red.bold("❌ Error:")} ${chalk.red(errorMessage)}

${chalk.dim("Troubleshooting:")}
${chalk.dim("  •")} Make sure you're logged in: ${chalk.cyan("botbyte login")}
${chalk.dim("  •")} Check your internet connection
${chalk.dim("  •")} Try again: ${chalk.cyan("botbyte agent")}`;

    const errorBox = boxen(errorContent, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      title: chalk.bold.red("Error"),
      titleAlignment: "center",
    });
    console.log(errorBox);
    process.exit(1);
  }
}