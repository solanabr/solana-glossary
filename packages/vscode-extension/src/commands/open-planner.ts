import * as vscode from "vscode";

import { GlossaryOSClient } from "../api/glossary-os-client";
import { PlannerPanel } from "../panels/planner-panel";
import { detectLocale } from "../utils/locale-detector";

export async function openPlannerCommand(
  context: vscode.ExtensionContext,
): Promise<void> {
  const goal = await vscode.window.showInputBox({
    prompt: "What do you want to build or learn on Solana?",
    placeHolder: "I want to build a DeFi app with swaps and liquidity pools",
  });

  if (!goal?.trim()) return;

  const level = await vscode.window.showQuickPick(
    [
      { label: "Beginner", detail: "Still learning Solana basics" },
      { label: "Intermediate", detail: "Comfortable building simple programs" },
      { label: "Advanced", detail: "Need architecture or workflow guidance" },
    ],
    {
      placeHolder: "Select your current Solana level",
      ignoreFocusOut: true,
    },
  );

  const levelPrefix = level ? `Current level: ${level.label}. ` : "";

  const client = new GlossaryOSClient();
  const result = await client.planLearning({
    goal: `${levelPrefix}${goal}`,
    locale: detectLocale(),
  });

  PlannerPanel.createOrShow(context.extensionUri, result);
}
