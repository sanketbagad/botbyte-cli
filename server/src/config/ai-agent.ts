import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import { generateObject } from "ai";
import { z } from "zod";
import type { AIService } from "../cli/ai/google.service.js";

// Type definitions
interface FileEntry {
  path: string;
  content: string;
}

interface Application {
  folderName: string;
  description: string;
  files: FileEntry[];
  setupCommands: string[];
}

interface GenerationResult {
  folderName: string;
  appDir: string;
  files: string[];
  commands: string[];
  success: boolean;
}

/**
 * Zod schema for structured application generation
 */
const ApplicationSchema = z.object({
  folderName: z.string().describe("Kebab-case folder name for the application"),
  description: z.string().describe("Brief description of what was created"),
  files: z.array(
    z.object({
      path: z.string().describe("Relative file path (e.g., src/App.jsx)"),
      content: z.string().describe("Complete file content"),
    })
  ).describe("All files needed for the application"),
  setupCommands: z.array(z.string()).describe("Bash commands to setup and run (e.g., npm install, npm run dev)"),
});

/**
 * Console logging helper
 */
function printSystem(message: string): void {
  console.log(message);
}

/**
 * Display file tree structure
 */
function displayFileTree(files: FileEntry[], folderName: string): void {
  printSystem(chalk.cyan("\n📂 Project Structure:"));
  printSystem(chalk.white(`${folderName}/`));
  
  const filesByDir: Record<string, string[]> = {};
  
  files.forEach((file) => {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
    
    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(parts[parts.length - 1]);
  });
  
  Object.keys(filesByDir).sort().forEach((dir) => {
    if (dir) {
      printSystem(chalk.white(`├── ${dir}/`));
      filesByDir[dir].forEach((file) => {
        printSystem(chalk.white(`│   └── ${file}`));
      });
    } else {
      filesByDir[dir].forEach((file) => {
        printSystem(chalk.white(`├── ${file}`));
      });
    }
  });
}

/**
 * Create application files
 */
async function createApplicationFiles(
  baseDir: string,
  folderName: string,
  files: FileEntry[]
): Promise<string> {
  const appDir = path.join(baseDir, folderName);
  
  await fs.mkdir(appDir, { recursive: true });
  printSystem(chalk.cyan(`\n📁 Created directory: ${folderName}/`));
  
  for (const file of files) {
    const filePath = path.join(appDir, file.path);
    const fileDir = path.dirname(filePath);
    
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, file.content, "utf8");
    printSystem(chalk.green(`  ✓ ${file.path}`));
  }
  
  return appDir;
}

/**
 * Generate application using structured output
 */
export async function generateApplication(
  description: string,
  aiService: AIService,
  cwd: string = process.cwd()
): Promise<GenerationResult> {
  try {
    printSystem(chalk.cyan("\n🤖 Agent Mode: Generating your application...\n"));
    printSystem(chalk.gray(`Request: ${description}\n`));
    
    printSystem(chalk.magenta("🧠 Generating structured output...\n"));
    
    // Access the model from aiService - need to expose it or use a method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (aiService as any).model;
    
    const result = await generateObject({
      model,
      schema: ApplicationSchema,
      prompt: `Create a complete, production-ready application for: ${description}

CRITICAL REQUIREMENTS:
1. Generate ALL files needed for the application to run
2. Include package.json with ALL dependencies and correct versions (if needed)
3. Include README.md with setup instructions
4. Include configuration files (.gitignore, etc.) if needed
5. Write clean, well-commented, production-ready code
6. Include error handling and input validation
7. Use modern JavaScript/TypeScript best practices
8. Make sure all imports and paths are correct
9. NO PLACEHOLDERS - everything must be complete and working
10. For simple HTML/CSS/JS projects, you can skip package.json if not needed

Provide:
- A meaningful kebab-case folder name
- All necessary files with complete content
- Setup commands (for example: cd folder, npm install, npm run dev OR just open index.html)
- Make it visually appealing and functional`,
    });
    
    const application: Application = result.object;
    
    printSystem(chalk.green(`\n✅ Generated: ${application.folderName}\n`));
    printSystem(chalk.gray(`Description: ${application.description}\n`));
    
    if (!application.files || application.files.length === 0) {
      throw new Error("No files were generated");
    }
    
    printSystem(chalk.green(`Files: ${application.files.length}\n`));
    
    // Display file tree
    displayFileTree(application.files, application.folderName);
    
    // Create application directory and files
    printSystem(chalk.cyan("\n📝 Creating files...\n"));
    const appDir = await createApplicationFiles(cwd, application.folderName, application.files);
    
    // Display results
    printSystem(chalk.green.bold("\n✨ Application created successfully!\n"));
    printSystem(chalk.cyan(`📁 Location: ${chalk.bold(appDir)}\n`));
    
    // Display setup commands
    if (application.setupCommands && application.setupCommands.length > 0) {
      printSystem(chalk.cyan("📋 Next Steps:\n"));
      printSystem(chalk.white("```bash"));
      application.setupCommands.forEach((cmd: string) => {
        printSystem(chalk.white(cmd));
      });
      printSystem(chalk.white("```\n"));
    } else {
      printSystem(chalk.yellow("ℹ️  No setup commands provided\n"));
    }
    
    return {
      folderName: application.folderName,
      appDir,
      files: application.files.map((f: FileEntry) => f.path),
      commands: application.setupCommands || [],
      success: true,
    };
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    printSystem(chalk.red(`\n❌ Error generating application: ${errorMessage}\n`));
    if (errorStack) {
      printSystem(chalk.dim(errorStack + "\n"));
    }
    throw err;
  }
}