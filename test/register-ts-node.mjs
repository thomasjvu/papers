// Keep this entry point compatible with existing Papers test commands.
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { resolve } from './resolve-aliases.mjs';

registerHooks({
  resolve,
  load(url, context, nextLoad) {
    if (!url.startsWith('file:') || !/\.tsx?$/.test(new URL(url).pathname)) {
      return nextLoad(url, context);
    }
    const fileName = fileURLToPath(url);
    const { outputText } = ts.transpileModule(readFileSync(fileName, 'utf8'), {
      fileName,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        useDefineForClassFields: true,
        inlineSourceMap: true,
        inlineSources: true,
      },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  },
});
