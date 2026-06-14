/**
 * Parser for DTag (.dtag) definition files.
 *
 * Ported from Godot-DTag's parser.gd.
 * Performs line-by-line syntax validation mirroring the Godot editor's checks.
 */

export interface DTagError {
	line: number; // 0-based
	message: string;
}

/**
 * Validate a .dtag document and return an array of syntax errors/warnings.
 * @param text The full .dtag file content.
 * @param limit Max errors to return. -1 for unlimited.
 */
export function parseFormatErrors(text: string, limit = -1): DTagError[] {
	const lines = text.split('\n');
	const errors: DTagError[] = [];

	for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
		if (limit > 0 && errors.length >= limit) {
			return errors;
		}

		const rawLine = lines[lineIdx];
		const stripped = rawLine.trim();
		if (stripped.length === 0) continue;
		if (stripped.startsWith('#')) continue;

		const indentCount = getIndentCount(rawLine);
		if (rawLine.startsWith(' ')) {
			errors.push({ line: lineIdx, message: "ERROR: Can't begins with space." });
			continue;
		}

		// Split off comment first (but we need the raw line, handle via _parseLine logic)
		const parsed = parseLine(rawLine);
		let identifier = parsed.identifier;
		const redirectStr = parsed.redirect;

		// Track empty line gaps for the "far from previous level" warning
		const emptyLineGapRef = { count: 0, afterNonEmpty: false };

		if (indentCount > 0) {
			if (identifier.startsWith('@')) {
				// Domain with indent: find a valid parent domain
				let valid = false;
				for (let idx = lineIdx - 1; idx >= 0; idx--) {
					const result = checkIndentPrevDomain(lines, idx, indentCount, emptyLineGapRef);
					if (result.valid) {
						valid = true;
						break;
					}
					if (result.hasError) break;
				}
				if (!valid && !errors.some(e => e.line === lineIdx)) {
					errors.push({ line: lineIdx, message: 'ERROR: error indent level.' });
				}
			} else {
				// Tag with indent: find a parent domain
				const checkResult = checkIndentPrevTag(lines, lineIdx, indentCount, emptyLineGapRef);
				if (!checkResult.hasDomain && !errors.some(e => e.line === lineIdx)) {
					errors.push({ line: lineIdx, message: 'ERROR: this tag should be owned to a domain.' });
				}
			}
		}

		if (errors.some(e => e.line === lineIdx)) continue;

		// Validate identifier
		if (identifier.startsWith('@')) {
			identifier = identifier.substring(1).trim();
		}
		identifier = identifier.trim();
		if (!isValidIdentifier(identifier)) {
			errors.push({ line: lineIdx, message: `ERROR: "${identifier}" is not a valid identifier.` });
			continue;
		}

		// Validate redirect target identifiers
		if (redirectStr.length > 0) {
			const parts = redirectStr.trim().split('.');
			for (const id of parts) {
				if (!isValidIdentifier(id.trim())) {
					errors.push({ line: lineIdx, message: `ERROR: "${id}" is not a valid identifier.` });
					break;
				}
			}
		}

		// Warn about too many empty lines before this indented line
		if (!errors.some(e => e.line === lineIdx) && indentCount > 0 && emptyLineGapRef.count > 2) {
			errors.push({ line: lineIdx, message: 'WARN: this sub level line is far from previous level (more than 2 empty line).' });
		}
	}

	return errors;
}

function getIndentCount(text: string): number {
	let count = 0;
	for (const ch of text) {
		if (ch === '\t') count++;
		else break;
	}
	return count;
}

interface ParseLineResult {
	identifier: string;
	redirect: string;
	comment: string;
}

function parseLine(line: string): ParseLineResult {
	let text = line.trim();

	// Extract comment
	let comment = '';
	const commentIdx = text.indexOf('#');
	if (commentIdx >= 0) {
		let offset = 1;
		if (text.length >= commentIdx + 2 && text[commentIdx + 1] === '#') {
			offset = 2;
		}
		if (text.length >= commentIdx + 1) {
			comment = text.substring(commentIdx + offset).replace(/^ /, '');
		}
		text = text.substring(0, commentIdx);
	}

	// Extract redirect
	let redirect = '';
	const redirectIdx = text.indexOf('->');
	if ((commentIdx < 0 || redirectIdx < commentIdx) && redirectIdx >= 0) {
		redirect = text.substring(redirectIdx + 2).trim();
		text = text.substring(0, redirectIdx);
	}

	const identifier = text.trim();
	return { identifier, redirect, comment };
}

function isValidIdentifier(id: string): boolean {
	if (id.length === 0) return false;
	return /^[a-zA-Z_]\w*$/.test(id);
}

/**
 * Check if a previous line is a valid parent for an indented domain.
 * This mirrors the GDScript closure in parse_format_errors for domain lines.
 */
function checkIndentPrevDomain(
	lines: string[],
	idx: number,
	currentIndent: number,
	emptyGap: { count: number; afterNonEmpty: boolean }
): { valid: boolean; hasError: boolean } {
	const prev = lines[idx];
	const stripped = prev.trim();
	if (stripped.length === 0) {
		if (!emptyGap.afterNonEmpty) emptyGap.count++;
		return { valid: false, hasError: false };
	}
	if (stripped.startsWith('#')) return { valid: false, hasError: false };

	emptyGap.afterNonEmpty = true;
	const prevIndent = getIndentCount(prev);

	if (stripped.startsWith('@')) {
		const diff = currentIndent - prevIndent;
		if (diff === 0 || diff === 1) return { valid: true, hasError: false };
	} else {
		if (prevIndent === 0) {
			return { valid: false, hasError: true };
		}
	}
	return { valid: false, hasError: false };
}

/**
 * Check if a previous line is a valid parent for an indented tag.
 * This mirrors the GDScript closure in parse_format_errors for non-domain lines.
 */
function checkIndentPrevTag(
	lines: string[],
	lineIdx: number,
	currentIndent: number,
	emptyGap: { count: number; afterNonEmpty: boolean }
): { hasDomain: boolean } {
	let hasDomain = false;
	for (let idx = lineIdx - 1; idx >= 0; idx--) {
		const prev = lines[idx];
		const stripped = prev.trim();
		if (stripped.length === 0) {
			if (!emptyGap.afterNonEmpty) emptyGap.count++;
			continue;
		}
		if (stripped.startsWith('#')) continue;

		emptyGap.afterNonEmpty = true;
		const prevIndent = getIndentCount(prev);

		if (stripped.startsWith('@')) {
			if (currentIndent - prevIndent === 1) {
				hasDomain = true;
				break;
			}
		} else {
			if (currentIndent === prevIndent) {
				hasDomain = true;
				break;
			}
			if (prevIndent === 0) break;
		}
	}
	return { hasDomain };
}
