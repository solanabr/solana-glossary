export interface ToolMetadata {
  kind: "primitive" | "composed" | "workflow";
  purpose: string;
  whenToUse: string[];
  outputs: string[];
  constraints: string[];
  nextTools: string[];
  deterministicSignals?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  metadata: ToolMetadata;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}
