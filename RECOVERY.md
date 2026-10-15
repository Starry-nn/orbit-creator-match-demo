# Orbit backup and recovery

These tools operate on database files. They do not provision cloud storage, send
emails, rotate credentials, switch the running service, or prove hosted recovery.
Use the same application version as the backup, or verify its migrations separately.

## Create a backup

Run `npm run backup` from the application directory. `DATABASE_PATH` selects the
source. `BACKUP_DIRECTORY` selects the output directory; if omitted, backups go in
a `backups` directory beside the database. In the Render container, that default
is `/var/lib/orbit/backups`, on the persistent disk rather than the image filesystem.

The tool uses the SQLite backup API with a pinned read snapshot, including committed
WAL data. It checks database integrity, required recovery tables/columns and foreign
keys, then validates the copied file. Names contain timestamps and random IDs;
existing files are not overwritten. Newly created backup files have mode `0600`.
Output contains the filename and record counts, not tokens or email content.

Keep another copy off the application host, in private storage with access controls
and retention appropriate to customer data. A backup on the same disk does not
protect against loss of that disk or hosting account. No off-host destination or
automatic schedule has been configured yet. Backups contain personal data and
password hashes; treat the whole file as confidential, even though Gmail tokens
are encrypted. Keep the original `ENCRYPTION_KEY` in a separate password/secret store.

## Restore into a new file

1. Stop public traffic and the application process. Preserve the current database
   and all its SQLite sidecars; do not overwrite or delete them as part of recovery.
2. Make the chosen backup available as a regular local file. Use a new destination
   filename with no existing `-wal`, `-shm` or `-journal` files.
3. Configure the original `ENCRYPTION_KEY` securely in the environment if the backup
   contains Gmail connections. Never paste it into a command argument or shared log.
4. Run the explicit command below, replacing both example paths:

   ```sh
   npm run restore -- --from /absolute/backup.sqlite --to /absolute/new-database.sqlite
   ```

   Relative paths, identical paths, existing targets/sidecars and source symlinks
   are refused. Integrity/schema/relationship checks and token decryption happen
   before creating the destination. A wrong/missing key leaves no destination.
   Restoration uses SQLite's backup API and does not modify the input database.
5. The restored copy removes sessions, OAuth states, password-reset tokens and
   outstanding invitations. Every user must sign in again; issue new invitations
   or password-reset links as needed. Running jobs become `interrupted`. Email
   sends lacking confirmation become `unknown`; saved drafts become `stale`.
   They are never sent automatically. Known `sent`/`responded` history is retained.
6. **Reconcile with Gmail before any replacement outreach.** An email that was a
   draft at backup time may have been sent later. The restored database cannot
   reconstruct those later events, so regenerating and sending immediately can
   duplicate outreach. Verify recipients, provider history and attachments manually.
7. Review point-in-time effects on passwords, members and revoked access. A restore
   can bring back an older password or membership. Revoke outdated access and reset
   affected credentials before reopening the service, especially after an incident.
8. Point an isolated test instance at the new file using `DATABASE_PATH`. Check
   `/healthz`, sign-in, account isolation, campaigns, decisions, notes, attachments,
   briefs, mail states and tasks. Check the record counts against the snapshot.
   Do not run two application processes against one database.
9. Only after the checks pass, configure the production service's `DATABASE_PATH`
   to the verified copy and start one instance. Keep the prior files and backup
   recoverable under the retention policy. Switching back is a separate deliberate
   recovery operation; this script never performs it automatically.

Avoid copying just the live `.sqlite` file while the application is running; its
newest committed data may still be in WAL. Use the backup tool instead. For a large
database, plan the backup window and monitor disk space and WAL growth.

## Verification and outstanding release gates

`npm test` includes an isolated WAL recovery drill. It restores actual registration
and sign-in, private campaign data, selected creator notes and attachment bytes;
checks another account cannot access them; verifies token decryption, invalidated
sessions, cleared outstanding tokens, quarantined drafts and interrupted jobs; and
tests the CLI, no-overwrite/sidecar guards, wrong keys, invalid schema and broken
foreign keys. Fixtures use no real provider credentials and send no emails.

These tests do not prove Render disk permissions, off-host storage, scheduled backup
delivery, backup retention, recovery time, live Gmail state or a hosted restore.
Perform that drill on the actual infrastructure before accepting customer data.
