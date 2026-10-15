import { createBackup } from "./recovery.mjs";
import { dirname, join, resolve } from "node:path";

try {
  const source = process.env.DATABASE_PATH || "./data/orbit.sqlite";
  const result = await createBackup(
    source,
    process.env.BACKUP_DIRECTORY || join(dirname(resolve(source)), "backups"),
  );
  console.log(`Verified database backup created: ${result.filename}`);
  console.log(JSON.stringify(result.counts));
} catch {
  console.error(
    "Backup failed. Check the source database, directory permissions and available disk space. No completed backup is confirmed.",
  );
  process.exitCode = 1;
}
