import fs from 'node:fs';
import path from 'node:path';

const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const readFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const output = [];

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        return;
      }
      if (!entry.isFile()) return;
      const extension = path.extname(entry.name);
      if (!SCRIPT_EXTENSIONS.has(extension)) return;
      if (entry.name.endsWith('.d.ts')) return;
      output.push(nextPath);
    });
  };

  walk(dir);
  return output;
};

const scanFiles = (label, root, pattern, ignoreFiles = []) => {
  const files = readFiles(root);
  const matches = [];
  files.forEach((file) => {
    if (ignoreFiles.some((matcher) => matcher.test(file))) return;
    const contents = fs.readFileSync(file, 'utf-8');
    if (!pattern.test(contents)) return;
    contents.split('\n').forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push(`${path.relative(process.cwd(), file)}:${index + 1}:${line}`);
      }
    });
  });
  if (matches.length > 0) {
    process.stderr.write(`\n[boundary] ${label}\n`);
    process.stderr.write(`${matches.join('\n')}\n`);
    return true;
  }
  return false;
};

const checks = [
  {
    label: 'features/core should not import services',
    root: 'src',
    pattern: /@services\//,
    include: ['core', 'features'],
  },
  {
    label: 'use-cases should not import core or features',
    root: 'src/use-cases',
    pattern: /@core\/|@features\//,
  },
  {
    label: 'use-cases should not import store implementation',
    root: 'src/use-cases',
    pattern: /@core\/stores\//,
  },
  {
    label: 'domain should not import core, features, or services',
    root: 'src/domain',
    pattern: /@core\/|@features\/|@services\//,
  },
  {
    label: 'data adapters should not import core or features',
    root: 'src/data/adapters',
    pattern: /@core\/|@features\//,
  },
  {
    label: 'core stores should not import features or services',
    root: 'src/core/stores',
    pattern: /@features\/|@services\//,
  },
  {
    label: 'features should not import data adapters directly',
    root: 'src/features',
    pattern: /@data\/adapters\//,
  },
  {
    label: 'reports feature should not import app state directly',
    root: 'src/features/reports',
    pattern: /@core\/app\/state\//,
    ignoreFiles: [/[/\\]host[/\\]reportHost\.ts$/],
  },
];

let hasViolations = false;

checks.forEach(({ label, root, pattern, include, ignoreFiles }) => {
  if (include) {
    include.forEach((subdir) => {
      const fullRoot = path.join(root, subdir);
      if (scanFiles(label, fullRoot, pattern, ignoreFiles)) hasViolations = true;
    });
    return;
  }
  if (scanFiles(label, root, pattern, ignoreFiles)) hasViolations = true;
});

if (hasViolations) process.exit(1);
