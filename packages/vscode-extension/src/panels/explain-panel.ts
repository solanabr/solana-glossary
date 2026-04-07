import * as vscode from "vscode";

import type { ExplainCodeResult } from "../api/types";
import { CopilotPanel } from "./copilot-panel";

export class ExplainPanel {
  static createOrShow(extensionUri: vscode.Uri, result: ExplainCodeResult, sourceCode: string) {
    CopilotPanel.show({
      panelId: "solanaGlossaryExplain",
      title: result.title,
      extensionUri,
      answer: result,
      sourceText: sourceCode,
    });
  }
}
