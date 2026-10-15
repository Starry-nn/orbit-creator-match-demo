import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const source = process.env.DATABASE_PATH || "./data/orbit.sqlite";
const destination = resolve(process.env.BACKUP_DIRECTORY || "./data/backups");
mkdirSync(destination, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(source, { readOnly: true });
try {
  const filename = resolve(
    destination,
    `orbit-${new Date().toISOString().replaceAll(":", "-")}.sqlite`,
  );
  await backup(db, filename);
  console.log(`Consistent database backup created: ${filename}`);
} finally {
  db.close();
}
