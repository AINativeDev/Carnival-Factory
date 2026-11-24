/**
 * Deterministic checks for prompt injection and hidden text, run on every
 * piece of text a participant controls: the issue, the pull request, and every
 * changed file. A hit doesn't prove bad intent, but it means a person looks
 * before anything merges, whatever any AI check said.
 *
 * Plain functions, so they can be tested on made-up text.
 */

export interface TextFinding {
  line: number;
  what: string;
}

/** Phrasing aimed at an AI reader rather than at people, case-insensitive. */
const MARKERS: [RegExp, string][] = [
  [
    /\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|the|your|these|those|system)\b[^.\n]{0,20}\b(instructions?|rules?|prompts?|guidelines?|checks?|policy|policies)\b/i,
    'tells the reader to ignore its instructions',
  ],
  [
    /\b(system|developer|hidden)\s+(prompt|message|instructions?)\b/i,
    'talks about a system prompt',
  ],
  [
    /\byou\s+are\s+(now\s+)?(an?\s+)?(ai|assistant|agent|language model|llm|chatgpt|claude|gpt|model)\b/i,
    'addresses an AI directly',
  ],
  [
    /\b(as|dear|hey|attention)\s+(an?\s+)?(ai|assistant|agent|llm|language model|reviewer|bot|claude|gpt)\b/i,
    'addresses an AI or reviewer directly',
  ],
  [
    /\b(act|behave|respond)\s+as\b|\bpretend\s+(to\s+be|you)\b|\brole-?play\b/i,
    'asks the reader to take on a role',
  ],
  [/\bnew\s+(instructions?|task|rules?|directive)\b/i, 'gives new instructions'],
  [
    /\b(approve|merge|accept|lgtm|ship)\b[^.\n]{0,30}\b(this|the|it|pr|pull request|change|request|booth)\b[^.\n]{0,20}\b(without|no need|skip|immediately|automatically|anyway)\b/i,
    'asks for approval without the checks',
  ],
  [
    /\b(do\s+not|don't|never)\s+(report|flag|mention|review|check|decline|reject)\b/i,
    'asks a check to look away',
  ],
  [
    /\b(label|add the label|apply)\s+[`'"]?(tessl|low-risk|accepted)\b/i,
    'asks for a decision label',
  ],
  [
    /<\/?\s*(system|instructions?|prompt|assistant|user|tool_?call|function_?call)\b[^>]*>/i,
    'contains prompt-style tags',
  ],
  [/\b(BEGIN|END)\s+(SYSTEM|INSTRUCTIONS?|PROMPT)\b/, 'contains prompt-style markers'],
  [
    /\b(tool[_ ]?call|function[_ ]?call|gh\s+pr\s+merge|gh\s+api|curl\s+-|rm\s+-rf)\b/i,
    'contains tool or shell commands',
  ],
];

/** Characters that change how text reads without being seen: Trojan Source and zero-width text. */
const HIDDEN_RANGES: [number, number][] = [
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
  [0x00ad, 0x00ad],
  [0x180e, 0x180e],
];
// Built from code points, so this file itself contains none of the characters it looks for.
const HIDDEN = new RegExp(
  `[${HIDDEN_RANGES.map(([from, to]) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`).join('')}]`,
);

/** A long run of base64, which can smuggle text past a reader. */
const BLOB = /[A-Za-z0-9+/]{160,}={0,2}/;

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** Injection phrasing in `text`, one finding per marker per line. */
export function injectionMarkers(text: string): TextFinding[] {
  const found: TextFinding[] = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [pattern, what] of MARKERS) {
      if (pattern.test(line)) found.push({ line: i + 1, what });
    }
  });
  return found;
}

/** Hidden characters, base64 blobs and HTML comments in `text`. */
export function hiddenCharacters(text: string, { allowHtmlComments = true } = {}): TextFinding[] {
  const found: TextFinding[] = [];
  const hidden = text.search(HIDDEN);
  if (hidden >= 0) {
    const code = text.codePointAt(hidden)!.toString(16).toUpperCase().padStart(4, '0');
    found.push({
      line: lineOf(text, hidden),
      what: `contains an invisible or text-direction character (U+${code})`,
    });
  }
  const blob = text.search(BLOB);
  if (blob >= 0) found.push({ line: lineOf(text, blob), what: 'contains a long encoded blob' });
  if (!allowHtmlComments) {
    const comment = text.indexOf('<!--');
    if (comment >= 0)
      found.push({ line: lineOf(text, comment), what: 'contains a hidden HTML comment' });
  }
  return found;
}

/**
 * Everything wrong with a participant's own words: an issue or pull request
 * body they wrote. HTML comments count here, because a form never adds one.
 */
export function scanParticipantText(text: string): TextFinding[] {
  return [...hiddenCharacters(text, { allowHtmlComments: false }), ...injectionMarkers(text)];
}
