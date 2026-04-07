import * as vscode from "vscode";

import { COMMANDS } from "../config/constants";
import { debugErrorCommand } from "./debug-error";
import { explainSelectionCommand } from "./explain-selection";
import { generateFromCommentCommand } from "./generate-from-comment";
import { openPlannerCommand } from "./open-planner";
import { searchGlossaryCommand } from "./search-glossary";

export function registerAllCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.explainSelection, () => explainSelectionCommand(context)),
    vscode.commands.registerCommand(COMMANDS.debugError, (message?: string) => debugErrorCommand(context, message)),
    vscode.commands.registerCommand(COMMANDS.generateFromComment, () => generateFromCommentCommand()),
    vscode.commands.registerCommand(COMMANDS.openPlanner, () => openPlannerCommand(context)),
    vscode.commands.registerCommand(COMMANDS.searchGlossary, () => searchGlossaryCommand()),
  );
}
