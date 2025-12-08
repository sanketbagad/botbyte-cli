import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/login";
import prisma from "../../../lib/db";
import { select } from "@clack/prompts";
import { startChat } from "../../chat/chat-with-ai";
import { startToolChat } from "../../chat/tool";
import { startAgentChat } from "../../chat/agent";

const wakeUpAction = async () => {
  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.red("You must be logged in to wake up the AI service."));
    process.exit(1);
  }
  const spinner = yoctoSpinner({ text: "Waking up AI service..." });
  spinner.start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.accessToken },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  spinner.stop();

  if (!user) {
    console.log(chalk.red("Invalid session. Please log in again."));
    process.exit(1);
  }

  console.log(chalk.green(`Hello, ${user.name || user.email}!\n`));

  const choice = await select({
    message: "Select an option:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Simple chat with AI",
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools (Google Search, Code Execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI agent (Coming soon)",
      },
    ],
  });

  switch (choice) {
    case "chat":
      startChat("chat", user.id);
      break;
    case "tool":
      startToolChat(user.id);
      break;
    case "agent":
      startAgentChat(user.id);
        break;
  }
};

export const wakeUp = new Command("wakeup")
  .description("Wake up the AI service for interaction")
  .action(wakeUpAction);
