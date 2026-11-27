/**
 * A Stryker ignorer (stryker.config.mjs): leaves `import.meta.glob(...)` alone.
 * Vite reads its pattern at build time and needs it written out as a string,
 * so a mutant there can't even be parsed; and what it finds is the folders on
 * disk, which no test could change.
 */
import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin';

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'import-meta-glob', {
    shouldIgnore(path) {
      const callee = path.isCallExpression() ? path.node.callee : undefined;
      return callee?.type === 'MemberExpression' &&
        callee.object.type === 'MetaProperty' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'glob'
        ? "Vite needs import.meta.glob's pattern written out as a string"
        : undefined;
    },
  }),
];
