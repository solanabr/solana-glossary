import type { ToolDefinition } from "./types.js";
import { buildFeatureTool } from "./build-feature.js";
import { debugErrorTool } from "./debug-error.js";
import { explainCodeTool } from "./explain-code.js";
import { generateCodeTool } from "./generate-code.js";
import { multiContextTool } from "./multi-context.js";
import { planLearningTool } from "./plan-learning.js";
import { relatedTermsTool } from "./related-terms.js";
import { searchTermsTool } from "./search-terms.js";

export const tools: ToolDefinition[] = [
  searchTermsTool,
  relatedTermsTool,
  multiContextTool,
  explainCodeTool,
  debugErrorTool,
  generateCodeTool,
  planLearningTool,
  buildFeatureTool,
];

export function getTool(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}
