import { DatabaseSync, backup } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { decrypt } from "./providers.mjs";

const tables = [
  "users",
  "workspaces",
  "members",
  "campaigns",
  "creators",
  "decisions",
  "briefs",
  "messages",
  "jobs",
  "integrations",
  "sessions",
  "oauth_states",
  "recovery_tokens",
  "invitations",
  "tasks",
  "files",
  "message_files",
  "activities",
  "reviews",
];
const recoveryColumns = {
  users: ["id", "email", "password"],
  campaigns: ["id", "workspace_id", "brief"],
  creators: ["id", "campaign_id", "data", "decision"],
  sessions: ["hash", "user_id", "expires_at"],
  integrations: ["user_id", "gmail_tokens"],
  jobs: ["status", "updated_at"],
  messages: ["status", "error"],
  files: ["campaign_id", "data"],
};

function inspect(db) {
  db.exec("PRAGMA trusted_schema=OFF; PRAGMA foreign_keys=ON;");
  const check = db.prepare("PRAGMA integrity_check").all();
  if (check.length !== 1 || Object.values(check[0])[0] !== "ok")
    throw new Error(
      "Database integrity check failed. Restore was not performed.",
    );
  const present = new Set(
    db
      .prepare("SELECT name FROM sqlite_schema WHERE type='table'")
      .all()
      .map((row) => row.name),
  );
  if (tables.some((name) => !present.has(name)))
    throw new Error("This file is not a complete Orbit product database.");
  for (const [table, required] of Object.entries(recoveryColumns)) {
    const columns = new Set(
      db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .map((column) => column.name),
    );
    if (required.some((name) => !columns.has(name)))
      throw new Error("This file is not a complete Orbit product database.");
  }
  if (db.prepare("PRAGMA foreign_key_check").all().length)
    throw new Error(
      "Database relationships are inconsistent. Restore was not performed.",
    );
  return Object.fromEntries(
    ["users", "campaigns", "creators", "briefs", "messages", "files"].map(
      (name) => [
        name,
        db.prepare(`SELECT count(*) AS count FROM ${name}`).get().count,
      ],
    ),
  );
}

function readSource(filename) {
  const path = resolve(filename);
  if (!lstatSync(path).isFile())
    throw new Error(
      "Choose a regular SQLite file, not a directory or symbolic link.",
    );
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec("PRAGMA trusted_schema=OFF; BEGIN;");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function reserve(filename) {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    try {
      lstatSync(filename + suffix);
      throw new Error(
        "Destination or SQLite sidecar already exists. Choose a new, empty destination; existing data is never overwritten.",
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const fd = openSync(filename, "wx", 0o600);
  try {
    return fstatSync(fd);
  } finally {
    closeSync(fd);
  }
}

function removeReserved(filename, owned) {
  try {
    const current = lstatSync(filename);
    if (
      current.ino === owned.ino &&
      current.dev === owned.dev &&
      current.isFile()
    )
      unlinkSync(filename);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function createBackup(source, directory) {
  const db = readSource(source);
  let filename, owned;
  try {
    inspect(db);
    filename = resolve(
      directory,
      `orbit-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.sqlite`,
    );
    owned = reserve(filename);
    await backup(db, filename);
    const copy = readSource(filename);
    let counts;
    try {
      counts = inspect(copy);
    } finally {
      copy.close();
    }
    return { filename, counts };
  } catch (error) {
    if (owned) removeReserved(filename, owned);
    throw error;
  } finally {
    db.close();
  }
}

export async function restoreBackup(source, destination, encryptionKey) {
  const filename = resolve(destination);
  if (resolve(source) === filename)
    throw new Error("Source and destination must be different files.");
  const db = readSource(source);
  let owned, restored;
  try {
    inspect(db);
    // Decryption never prints credentials or calls Gmail. A lost key cannot be
    // silently replaced while claiming saved connections have been recovered.
    for (const row of db
      .prepare("SELECT gmail_tokens FROM integrations")
      .all()) {
      try {
        decrypt(row.gmail_tokens, encryptionKey);
      } catch {
        throw new Error(
          "The original ENCRYPTION_KEY is required to restore saved Gmail connections. No destination was created.",
        );
      }
    }
    owned = reserve(filename);
    await backup(db, filename);
    restored = new DatabaseSync(filename);
    restored.exec("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;");
    try {
      for (const table of [
        "sessions",
        "oauth_states",
        "recovery_tokens",
        "invitations",
      ])
        restored.exec(`DELETE FROM ${table}`);
      restored
        .prepare(
          "UPDATE jobs SET status='interrupted',updated_at=? WHERE status IN ('queued','running')",
        )
        .run(new Date().toISOString());
      restored.exec(
        "UPDATE messages SET status='unknown',error='Restored before delivery confirmation. Check Gmail Sent before taking further action.' WHERE status='sending'",
      );
      restored.exec(
        "UPDATE messages SET status='stale',error='Restored from backup. Check Gmail Sent before generating any replacement outreach.' WHERE status='draft'",
      );
      restored.exec("COMMIT;");
    } catch (error) {
      restored.exec("ROLLBACK;");
      throw error;
    }
    const counts = inspect(restored);
    restored.close();
    restored = null;
    return { filename, counts };
  } catch (error) {
    restored?.close();
    if (owned) removeReserved(filename, owned);
    throw error;
  } finally {
    db.close();
  }
}
