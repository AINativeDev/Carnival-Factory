/**
 * Makes text a participant controls safe to put in one of our own GitHub
 * comments or issues: an issue title, a file name, a string from a booth's
 * code. It removes hidden and control characters, keeps @mentions from pinging
 * anyone, stops Markdown and HTML from making links, images or headings, and
 * caps the length. What's left reads the same, as plain text.
 */
import { hiddenCharacters } from './injection-scan.ts';

/** Markdown and HTML punctuation that could change how the text renders. */
const MARKUP = /[\\`*_[\]()<>#!|~{}]/g;

export function safeInline(text: string, max = 120): string {
  let out = '';
  for (const char of text) {
    const code = char.codePointAt(0)!;
    // Control characters, including newlines: the text stays on one line.
    // Stryker disable next-line EqualityOperator: a space (0x20) becomes a space either way.
    if (code < 0x20 || code === 0x7f) {
      out += ' ';
      continue;
    }
    // Invisible and text-direction characters, found the same way the scan finds them.
    if (hiddenCharacters(char).length) continue;
    out += char;
  }
  out = out
    .replace(MARKUP, (c) => `\\${c}`)
    // "@name" pings name; a zero-width joiner would be hidden text, so use a full-width at sign.
    .replace(/@/g, String.fromCodePoint(0xff20))
    .replace(/\s+/g, ' ')
    .trim();
  const chars = [...out];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : out;
}
