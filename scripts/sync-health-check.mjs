import { readFileSync } from 'node:fs';

const file = 'src/services/firebase/firestoreSync.ts';
const content = readFileSync(file, 'utf-8');

const required = [
  'syncMeta',
  'updatedAt',
  'Conflict',
  'syncIncrementalPatientsToFirebase',
];

const missing = required.filter((token) => !content.includes(token));

if (missing.length > 0) {
  console.error('[sync-health] Missing tokens:', missing.join(', '));
  process.exit(1);
}
