import * as vscode from "vscode";

import type { CopilotAnswer } from "../api/types";
import { generateCopilotHtml } from "./webview-html";

export class CopilotPanel {
  private static panels = new Map<string, CopilotPanel>();

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  static show(options: {
    panelId: string;
    title: string;
    extensionUri: vscode.Uri;
    answer: CopilotAnswer;
    sourceText?: string;
  }) {
    const existing = CopilotPanel.panels.get(options.panelId);
    if (existing) {
      existing.panel.reveal(vscode.ViewColumn.Beside);
      existing.update(options.title, options.answer, options.sourceText ?? "", options.extensionUri);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      options.panelId,
      options.title,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(options.extensionUri, "media")],
      },
    );

    const instance = new CopilotPanel(panel);
    CopilotPanel.panels.set(options.panelId, instance);
    instance.update(options.title, options.answer, options.sourceText ?? "", options.extensionUri);
  }

  private update(title: string, answer: CopilotAnswer, sourceText: string, extensionUri: vscode.Uri) {
    this.panel.title = title;
    this.panel.webview.html = generateCopilotHtml(title, answer, sourceText, this.panel.webview, extensionUri);
  }

  private dispose() {
    CopilotPanel.panels.delete(this.panel.viewType);
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }
}
