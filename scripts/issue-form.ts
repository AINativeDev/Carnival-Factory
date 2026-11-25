/**
 * Reading an issue form's body, as GitHub writes it under each field's
 * `### <label>` heading. The Elf Engineer badge and the advent calendar both
 * read their requests this way, so it lives apart from either.
 */

/** The value under a `### <label>` heading of an issue form's body, or undefined when it's empty. */
export function formField(body: string, label: string): string | undefined {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.trim() === `### ${label}`);
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('### '));
  const value = (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
  return value && value !== '_No response_' ? value : undefined;
}
