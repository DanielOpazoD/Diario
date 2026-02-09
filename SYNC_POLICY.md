# Sync Policy

## Versioning

- Each patient record uses `updatedAt` as version.
- Last-write-wins by `updatedAt` is the default.

## Conflicts

- If both local and remote changed, remote wins when newer.
- Local edits are retried on next incremental sync.

## Retries

- Sync retries up to 3 attempts with exponential backoff.

## Next steps

- Add per-field merge rules for high-risk fields.
- Add audit log metadata on updates.
