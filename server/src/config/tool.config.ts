import { z } from "zod";

// Tool definition interface
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: z.ZodObject<any>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// Available tools
export const availableTools: ToolDefinition[] = [
  {
    id: "weather",
    name: "Weather",
    description: "Get current weather for a location",
    parameters: z.object({
      location: z.string().describe("City name or location"),
    }),
    execute: async (args) => {
      // Mock weather response
      return {
        location: args.location,
        temperature: Math.floor(Math.random() * 30) + 10,
        conditions: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][
          Math.floor(Math.random() * 4)
        ],
        humidity: Math.floor(Math.random() * 50) + 30,
      };
    },
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    parameters: z.object({
      expression: z.string().describe("Mathematical expression to evaluate"),
    }),
    execute: async (args) => {
      try {
        // Simple safe eval for basic math
        const expression = String(args.expression);
        // Only allow numbers and basic operators
        if (!/^[\d\s+\-*/().]+$/.test(expression)) {
          throw new Error("Invalid expression");
        }
        const result = Function(`"use strict"; return (${expression})`)();
        return { expression, result };
      } catch {
        return { error: "Invalid mathematical expression" };
      }
    },
  },
  {
    id: "datetime",
    name: "Date & Time",
    description: "Get current date and time information",
    parameters: z.object({
      timezone: z
        .string()
        .optional()
        .describe("Timezone (e.g., 'America/New_York')"),
    }),
    execute: async (args) => {
      const options: Intl.DateTimeFormatOptions = {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: (args.timezone as string) || "UTC",
      };
      const now = new Date();
      return {
        datetime: now.toLocaleString("en-US", options),
        timestamp: now.toISOString(),
        timezone: args.timezone || "UTC",
      };
    },
  },
  {
    id: "search",
    name: "Web Search",
    description: "Search the web for information (mock)",
    parameters: z.object({
      query: z.string().describe("Search query"),
    }),
    execute: async (args) => {
      // Mock search results
      return {
        query: args.query,
        results: [
          {
            title: `Result 1 for "${args.query}"`,
            snippet: "This is a mock search result...",
            url: "https://example.com/1",
          },
          {
            title: `Result 2 for "${args.query}"`,
            snippet: "Another mock search result...",
            url: "https://example.com/2",
          },
        ],
      };
    },
  },
  {
    id: "translate",
    name: "Translate",
    description: "Translate text between languages (mock)",
    parameters: z.object({
      text: z.string().describe("Text to translate"),
      targetLanguage: z.string().describe("Target language code (e.g., 'es', 'fr')"),
    }),
    execute: async (args) => {
      // Mock translation
      return {
        original: args.text,
        translated: `[Translated to ${args.targetLanguage}]: ${args.text}`,
        targetLanguage: args.targetLanguage,
      };
    },
  },
];

// State for enabled tools
let enabledToolIds: string[] = [];

/**
 * Get tool definition by ID
 */
export function getToolById(id: string): ToolDefinition | undefined {
  return availableTools.find((tool) => tool.id === id);
}

/**
 * Enable specific tools
 */
export function enableTools(toolIds: string[]): void {
  enabledToolIds = toolIds.filter((id) =>
    availableTools.some((tool) => tool.id === id)
  );
}

/**
 * Get currently enabled tools formatted for AI SDK
 */
export function getEnabledTools(): Record<string, {
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: z.ZodObject<any>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}> {
  const tools: Record<string, {
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: z.ZodObject<any>;
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }> = {};

  for (const id of enabledToolIds) {
    const tool = getToolById(id);
    if (tool) {
      tools[tool.id] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute,
      };
    }
  }

  return tools;
}

/**
 * Get names of enabled tools
 */
export function getEnabledToolNames(): string[] {
  return enabledToolIds
    .map((id) => getToolById(id)?.name)
    .filter((name): name is string => !!name);
}

/**
 * Reset tools (disable all)
 */
export function resetTools(): void {
  enabledToolIds = [];
}

/**
 * Check if any tools are enabled
 */
export function hasEnabledTools(): boolean {
  return enabledToolIds.length > 0;
}
