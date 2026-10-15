import { isAbsolute } from "node:path";
import { restoreBackup } from "./recovery.mjs";

try {
  const args = process.argv.slice(2);
  if (
    args.length !== 4 ||
    args[0] !== "--from" ||
    args[2] !== "--to" ||
    !isAbsolute(args[1]) ||
    !isAbsolute(args[3])
  )
    throw new Error(
      "Usage: npm run restore -- --from /absolute/backup.sqlite --to /absolute/new-database.sqlite. Existing files are never overwritten.",
    );
  const result = await restoreBackup(
    args[1],
    args[3],
    process.env.ENCRYPTION_KEY,
  );
  console.log(`Restored and verified: ${result.filename}`);
  console.log(JSON.stringify(result.counts));
  console.log(
    "Old sessions and outstanding login/reset/invitation tokens were removed. Check the restored data before switching DATABASE_PATH and starting the service. Reconcile drafts and interrupted sends with Gmail Sent before generating replacement outreach; they are never retried automatically.",
  );
} catch (error) {
  const message = error.message || "";
  console.error(
    /^(Usage:|Destination or|Source and|Choose a regular|Database integrity|Database relationships|This file is|The original ENCRYPTION_KEY)/.test(
      message,
    )
      ? message
      : "Restore failed. Check the backup file, directory permissions and free disk space. Existing data was not overwritten.",
  );
  process.exitCode = 1;
}
