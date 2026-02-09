import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';

const readFiles = (dir) => {
  const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
  return fg.sync(patterns, { cwd: dir, absolute: true, ignore: ['**/*.d.ts'] });
};

const scanFiles = (label, root, pattern) => {
  const files = readFiles(root);
  const matches = [];
  files.forEach((file) => {
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
    label: 'domain should not import core, features, or services',
    root: 'src/domain',
    pattern: /@core\/|@features\/|@services\//,
  },
];

let hasViolations = false;

checks.forEach(({ label, root, pattern, include }) => {
  if (include) {
    include.forEach((subdir) => {
      const fullRoot = path.join(root, subdir);
      if (scanFiles(label, fullRoot, pattern)) hasViolations = true;
    });
    return;
  }
  if (scanFiles(label, root, pattern)) hasViolations = true;
});

if (hasViolations) process.exit(1);
