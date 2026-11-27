/**
 * Stands in for the canvas in the tests and writes down what was drawn on it,
 * so the show can be drawn in Node and two moments of it compared.
 */
export class DrawingLog {
  readonly calls: string[] = [];
  private note(name: string, args: readonly unknown[]) {
    this.calls.push(`${name}(${args.map(String).join(',')})`);
  }
  set fillStyle(value: unknown) {
    this.note('fillStyle', [value === this ? 'gradient' : value]);
  }
  set strokeStyle(value: unknown) {
    this.note('strokeStyle', [value]);
  }
  set globalAlpha(value: number) {
    this.note('globalAlpha', [value]);
  }
  set lineWidth(value: number) {
    this.note('lineWidth', [value]);
  }
  /** A gradient's colour stops go in the log too: the log stands in for the gradient as well. */
  createLinearGradient = (...args: unknown[]) => {
    this.note('createLinearGradient', args);
    return this;
  };
  addColorStop = (...args: unknown[]) => {
    this.note('addColorStop', args);
  };
  save = () => {
    this.note('save', []);
  };
  restore = () => {
    this.note('restore', []);
  };
  translate = (...args: unknown[]) => {
    this.note('translate', args);
  };
  scale = (...args: unknown[]) => {
    this.note('scale', args);
  };
  rotate = (...args: unknown[]) => {
    this.note('rotate', args);
  };
  beginPath = () => {
    this.note('beginPath', []);
  };
  closePath = () => {
    this.note('closePath', []);
  };
  moveTo = (...args: unknown[]) => {
    this.note('moveTo', args);
  };
  lineTo = (...args: unknown[]) => {
    this.note('lineTo', args);
  };
  arc = (...args: unknown[]) => {
    this.note('arc', args);
  };
  ellipse = (...args: unknown[]) => {
    this.note('ellipse', args);
  };
  fill = () => {
    this.note('fill', []);
  };
  stroke = () => {
    this.note('stroke', []);
  };
  clip = () => {
    this.note('clip', []);
  };
  fillRect = (...args: unknown[]) => {
    this.note('fillRect', args);
  };
  fillText = (...args: unknown[]) => {
    this.note('fillText', args);
  };
  arcTo = (...args: unknown[]) => {
    this.note('arcTo', args);
  };
  rect = (...args: unknown[]) => {
    this.note('rect', args);
  };
  roundRect = (...args: unknown[]) => {
    this.note('roundRect', args);
  };
  quadraticCurveTo = (...args: unknown[]) => {
    this.note('quadraticCurveTo', args);
  };
  setLineDash = (...args: unknown[]) => {
    this.note('setLineDash', args);
  };
  createRadialGradient = (...args: unknown[]) => {
    this.note('createRadialGradient', args);
    return this;
  };
  measureText = (text: string) => ({ width: text.length * 10 });
  /** The words written so far, in order. */
  get texts(): string[] {
    return this.calls
      .filter((call) => call.startsWith('fillText('))
      .map((call) => call.slice(9, call.indexOf(',')));
  }
}
