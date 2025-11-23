import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { createRequire } from 'module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

export function loadTsModule(tsPath, overrides = {}) {
  const absolutePath = path.resolve(tsPath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const importMetaPreface = 'const importMeta = { env: {} };\n';
  const sanitizedSource = importMetaPreface + source.replace(/import\.meta/g, 'importMeta');
  const { outputText } = ts.transpileModule(sanitizedSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  });

  const module = { exports: {} };
  const localRequire = createRequire(absolutePath);
  if (!localRequire.extensions['.ts']) {
    localRequire.extensions['.ts'] = (moduleInstance, filename) => {
      const tsSource = fs.readFileSync(filename, 'utf8');
      const compiled = ts.transpileModule(tsSource, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
        fileName: filename,
      });
      moduleInstance._compile(compiled.outputText, filename);
    };
  }
  const sandbox = {
    module,
    exports: module.exports,
    require: localRequire,
    console,
    globalThis,
    window: overrides.window ?? globalThis,
    localStorage: overrides.localStorage ?? globalThis.localStorage,
    sessionStorage: overrides.sessionStorage ?? globalThis.sessionStorage,
    fetch: overrides.fetch ?? globalThis.fetch,
    FormData: overrides.FormData ?? globalThis.FormData,
    Blob: overrides.Blob ?? globalThis.Blob,
    URL: overrides.URL ?? globalThis.URL,
    Date: overrides.Date ?? globalThis.Date,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };

  Object.assign(sandbox, overrides);

  vm.runInNewContext(outputText, sandbox, { filename: absolutePath });
  return sandbox.module.exports;
}
