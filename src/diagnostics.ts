import * as vscode from 'vscode';
import { parseFormatErrors } from './parser';

const DTAG_MODE: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error;
const WARN_MODE: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Warning;

const diagnosticCollection = vscode.languages.createDiagnosticCollection('dtag');

export function activateDiagnostics(context: vscode.ExtensionContext): void {
	// Run diagnostics when a .dtag document is opened or changed
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(doc => {
			if (doc.languageId === 'dtag') {
				validateDocument(doc);
			}
		}),
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document.languageId === 'dtag') {
				validateDocument(event.document);
			}
		}),
		vscode.workspace.onDidCloseTextDocument(doc => {
			if (doc.languageId === 'dtag') {
				diagnosticCollection.delete(doc.uri);
			}
		})
	);

	// Also validate any already-open .dtag documents
	for (const doc of vscode.workspace.textDocuments) {
		if (doc.languageId === 'dtag') {
			validateDocument(doc);
		}
	}
}

export function deactivateDiagnostics(): void {
	diagnosticCollection.dispose();
}

function validateDocument(doc: vscode.TextDocument): void {
	const text = doc.getText();
	const parseErrors = parseFormatErrors(text, 20);

	const diagnostics: vscode.Diagnostic[] = parseErrors.map(e => {
		const line = doc.lineAt(e.line);
		const range = new vscode.Range(e.line, 0, e.line, line.text.length);
		const severity = e.message.startsWith('WARN') ? WARN_MODE : DTAG_MODE;
		const diag = new vscode.Diagnostic(range, e.message, severity);
		diag.source = 'dtag';
		return diag;
	});

	diagnosticCollection.set(doc.uri, diagnostics);
}
