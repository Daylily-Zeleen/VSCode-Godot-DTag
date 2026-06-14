import * as vscode from 'vscode';
import { activateDiagnostics, deactivateDiagnostics } from './diagnostics';

export function activate(context: vscode.ExtensionContext): void {
	activateDiagnostics(context);
}

export function deactivate(): void {
	deactivateDiagnostics();
}
