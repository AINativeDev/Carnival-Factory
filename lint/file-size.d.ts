export const MAX_LINES: number;
export function countLines(text: string): number;
export function sizeLimits(): {
  files: string[];
  rules: {
    'max-lines': ['error', { max: number; skipBlankLines: boolean; skipComments: boolean }];
  };
}[];
