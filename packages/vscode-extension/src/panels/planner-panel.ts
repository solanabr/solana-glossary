import * as vscode from "vscode";

import type { PlanLearningResult } from "../api/types";
import { CopilotPanel } from "./copilot-panel";

export class PlannerPanel {
  static createOrShow(extensionUri: vscode.Uri, result: PlanLearningResult) {
    CopilotPanel.show({
      panelId: "solanaGlossaryPlanner",
      title: result.title,
      extensionUri,
      answer: result,
      sourceText: result.goal,
    });
  }
}
