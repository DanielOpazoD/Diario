import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { createRequire } from 'module';
import ts from 'typescript';
import { legacyPathMap, legacyPrefixMap } from './legacyPaths.js';

const require = createRequire(import.meta.url);
const Module = require('module');

const projectRoot = process.cwd();
const srcRoot = path.resolve(projectRoot, 'src');
const aliasRoots = {
  '@core/': path.join(srcRoot, 'core/'),
  '@features/': path.join(srcRoot, 'features/'),
  '@use-cases/': path.join(srcRoot, 'use-cases/'),
  '@shared/': path.join(srcRoot, 'shared/'),
  '@services/': path.join(srcRoot, 'services/'),
  '@data/': path.join(srcRoot, 'data/'),
  '@domain/': path.join(srcRoot, 'domain/'),
};

const resolveFile = (candidate) => {
  const withExt = path.extname(candidate) ? [candidate] : [
    `${candidate}.ts`,
    `${candidate}.tsx`,
    `${candidate}.js`,
    `${candidate}.jsx`,
  ];
  for (const file of withExt) {
    if (fs.existsSync(file)) return file;
  }
  for (const file of withExt) {
    const indexFile = file.replace(/\.(ts|tsx|js|jsx)$/, '/index.$1');
    if (fs.existsSync(indexFile)) return indexFile;
  }
  return null;
};

const resolveAlias = (id) => {
  for (const [alias, root] of Object.entries(aliasRoots)) {
    if (id.startsWith(alias)) {
      const relative = id.slice(alias.length);
      const resolved = resolveFile(path.join(root, relative));
      if (resolved) return resolved;
    }
  }
  return null;
};

const resolveTestPath = (tsPath) => {
  if (path.isAbsolute(tsPath)) return tsPath;
  const normalized = tsPath.replace(/^\.\//, '');
  if (legacyPathMap.has(normalized)) {
    const mapped = legacyPathMap.get(normalized);
    const resolved = resolveFile(path.join(srcRoot, mapped));
    if (resolved) return resolved;
  }
  for (const [prefix, mappedPrefix] of legacyPrefixMap.entries()) {
    if (normalized.startsWith(prefix)) {
      const mapped = normalized.replace(prefix, mappedPrefix);
      const resolved = resolveFile(path.join(srcRoot, mapped));
      if (resolved) return resolved;
    }
  }
  const direct = resolveFile(path.join(projectRoot, normalized));
  if (direct) return direct;
  const srcDirect = resolveFile(path.join(srcRoot, normalized));
  if (srcDirect) return srcDirect;
  return path.resolve(normalized);
};

export function loadTsModule(tsPath, overrides = {}) {
  const absolutePath = resolveTestPath(tsPath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const importMetaPreface = 'const importMeta = { env: {} };\n';
  const sanitizedSource = importMetaPreface + source.replace(/import\.meta/g, 'importMeta');
  const { outputText } = ts.transpileModule(sanitizedSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: absolutePath,
  });

  const module = { exports: {} };
  const localRequire = createRequire(absolutePath);
  const { require: overrideRequire, moduleStubs = {}, ...restOverrides } = overrides;
  const baseRequire = overrideRequire ?? localRequire;
  const resolveModuleStub = (request) => {
    const entries = Object.entries(moduleStubs);
    const exact = entries.find(([match]) => request === match);
    if (exact) return exact[1];
    const byName = entries.find(([match]) => !match.includes('/') && request.includes(match));
    if (byName) return byName[1];
    return undefined;
  };
  const ensureReactDefault = (value) => {
    if (value && typeof value === 'object' && !value.default) {
      return { ...value, default: value };
    }
    return value;
  };
  const attemptRequire = (fn, id) => {
    try {
      return { ok: true, value: fn(id) };
    } catch (error) {
      return { ok: false, error };
    }
  };
  const wrappedRequire = (id) => {
    const stub = resolveModuleStub(id);
    if (stub !== undefined) return stub;
    if (id.includes('pdfText')) {
      return { extractTextFromPdf: async () => '' };
    }
    if (id.includes('useAppStore') && overrides.useAppStore) {
      return { default: overrides.useAppStore };
    }
    if (id === 'react' && overrides.React) {
      return ensureReactDefault(overrides.React);
    }
    if (id === 'react/jsx-runtime' && overrides.React) {
      const create = overrides.React.createElement;
      const fragment = overrides.React.Fragment ?? 'Fragment';
      const build = (type, props) => {
        const children = props?.children;
        const childList = Array.isArray(children) ? children : children === undefined ? [] : [children];
        return create ? create(type, props, ...childList) : { type, props, children: childList };
      };
      return {
        Fragment: fragment,
        jsx: build,
        jsxs: build,
      };
    }
    if (overrideRequire) {
      const direct = attemptRequire(overrideRequire, id);
      if (direct.ok) {
        return id === 'react' ? ensureReactDefault(direct.value) : direct.value;
      }
    }
    const aliasResolved = resolveAlias(id);
    if (overrideRequire && aliasResolved) {
      const aliasAttempt = attemptRequire(overrideRequire, aliasResolved);
      if (aliasAttempt.ok) {
        return id === 'react' ? ensureReactDefault(aliasAttempt.value) : aliasAttempt.value;
      }
    }
    const resolved = aliasResolved ?? id;
    const value = baseRequire(resolved);
    return id === 'react' ? ensureReactDefault(value) : value;
  };
  const registerTs = (ext) => {
    if (!localRequire.extensions[ext]) {
      localRequire.extensions[ext] = (moduleInstance, filename) => {
        const tsSource = fs.readFileSync(filename, 'utf8');
        const compiled = ts.transpileModule(tsSource, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.ReactJSX,
          },
          fileName: filename,
        });
        moduleInstance._compile(compiled.outputText, filename);
      };
    }
  };

  registerTs('.ts');
  registerTs('.tsx');
  const sandbox = {
    module,
    exports: module.exports,
    require: wrappedRequire,
    console,
    globalThis,
    window: overrides.window ?? globalThis.window ?? {},
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

  Object.assign(sandbox, restOverrides);

  const originalResolveFilename = Module._resolveFilename;
  const originalLoad = Module._load;
  const previousGlobals = {
    fetch: globalThis.fetch,
    FormData: globalThis.FormData,
    Headers: globalThis.Headers,
    Blob: globalThis.Blob,
    window: globalThis.window,
    localStorage: globalThis.localStorage,
    fetchOverride: globalThis.__fetchOverride,
  };
  const shouldSetFetchOverride = overrides.fetch && String(tsPath).includes('geminiService');
  if (overrides.fetch) globalThis.fetch = overrides.fetch;
  if (overrides.FormData) globalThis.FormData = overrides.FormData;
  if (overrides.Headers) globalThis.Headers = overrides.Headers;
  if (overrides.Blob) globalThis.Blob = overrides.Blob;
  if (shouldSetFetchOverride) {
    globalThis.__fetchOverride = overrides.fetch;
  }
  if (!globalThis.window && (overrides.window || overrides.localStorage)) {
    globalThis.window = overrides.window ?? {};
  }
  if (globalThis.window && typeof globalThis.window.matchMedia !== 'function') {
    globalThis.window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
  }
  if (overrides.localStorage && !globalThis.localStorage) {
    globalThis.localStorage = overrides.localStorage;
  }
  Module._resolveFilename = function (request, parent, isMain, options) {
    const aliasResolved = resolveAlias(request);
    if (aliasResolved) {
      return originalResolveFilename.call(this, aliasResolved, parent, isMain, options);
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
  Module._load = function (request, parent, isMain) {
    if (typeof request === 'string') {
      const stub = resolveModuleStub(request);
      if (stub !== undefined) return stub;
    }
    if (typeof request === 'string' && request.includes('pdfText')) {
      return { extractTextFromPdf: async () => '' };
    }
    if (typeof request === 'string' && request.includes('shared/config/env')) {
      return {
        env: {
          firebase: {
            apiKey: '',
            authDomain: '',
            projectId: '',
            storageBucket: '',
            messagingSenderId: '',
            appId: '',
          },
          gemini: { apiKey: '' },
          flags: { isFirebaseConfigured: false, isGeminiConfigured: false },
        },
      };
    }
    if (request === 'react' && overrides.React) {
      return ensureReactDefault(overrides.React);
    }
    if (request === 'react/jsx-runtime' && overrides.React) {
      const create = overrides.React.createElement;
      const fragment = overrides.React.Fragment ?? 'Fragment';
      const build = (type, props) => {
        const children = props?.children;
        const childList = Array.isArray(children) ? children : children === undefined ? [] : [children];
        return create ? create(type, props, ...childList) : { type, props, children: childList };
      };
      return {
        Fragment: fragment,
        jsx: build,
        jsxs: build,
      };
    }
    const loaded = originalLoad.call(this, request, parent, isMain);
    if (request === 'react') {
      return ensureReactDefault(loaded);
    }
    return loaded;
  };

  try {
    vm.runInNewContext(outputText, sandbox, { filename: absolutePath });
  } finally {
    Module._resolveFilename = originalResolveFilename;
    Module._load = originalLoad;
    if (!overrides.fetch) {
      globalThis.fetch = previousGlobals.fetch;
    }
    globalThis.FormData = previousGlobals.FormData;
    globalThis.Headers = previousGlobals.Headers;
    globalThis.Blob = previousGlobals.Blob;
    if (!previousGlobals.window && !overrides.localStorage) {
      globalThis.window = previousGlobals.window;
    }
    if (!previousGlobals.localStorage && overrides.localStorage) {
      globalThis.localStorage = previousGlobals.localStorage;
    }
    if (!shouldSetFetchOverride) {
      globalThis.__fetchOverride = previousGlobals.fetchOverride;
    }
  }
  return sandbox.module.exports;
}
