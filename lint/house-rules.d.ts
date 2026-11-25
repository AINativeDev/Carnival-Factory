type Restriction = { name: string; message: string };
type PropertyRestriction = { object?: string; property: string; message: string };
type ImportPattern = { regex: string; message: string };

export const ESCAPE: string;
export const squareGlobals: Restriction[];
export const squareProperties: PropertyRestriction[];
export function importRule(
  depth: number,
  test?: boolean,
  up?: number,
): ['error', { patterns: ImportPattern[] }];
export const NESTED_DEPTH: number;
export const SQUARE_FOLDERS: string[];
export const UP: Record<string, number>;
export const LEVEL_DATA: string;
export const levelData: { selector: string; message: string }[];
