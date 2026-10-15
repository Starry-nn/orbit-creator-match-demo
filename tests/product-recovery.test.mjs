import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/index.mjs";
import { createBackup, restoreBackup } from "../server/recovery.mjs";
import { decrypt, encrypt } from "../server/providers.mjs";
import { openStore } from "../server/store.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const key = "ab".repeat(32); // Synthetic test key, never an external credential.
async function start(app) {
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${app.server.address().port}`;
}
async function call(base, path, method = "GET", data, cookie = "") {
  const response = await fetch(base + path, {
    method,
    headers: {
      cookie,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

test("WAL backup restores actual account access, private data and safe interrupted states", async () => {
  const directory = mkdtempSync(join(tmpdir(), "orbit-recovery-"));
  const source = join(directory, "live.sqlite"),
    destination = join(directory, "restored.sqlite");
  const config = {
    database: source,
    appUrl: "http://localhost",
    encryptionKey: key,
  };
  const app = createApp(config);
  let restored;
  try {
    const base = await start(app);
    const account = await call(base, "/api/auth/register", "POST", {
      name: "Recovery Tester",
      email: "recovery@example.com",
      password: "Long secure backup test password",
    });
    assert.equal(account.status, 201);
    const cookie = account.cookie;
    const me = (await call(base, "/api/me", "GET", undefined, cookie)).body;
    const campaign = await call(
      base,
      "/api/campaigns",
      "POST",
      {
        workspaceId: me.workspaces[0].id,
        name: "Restore me",
        brand: "Test",
        goal: "Awareness",
        audience: "Developers",
      },
      cookie,
    );
    assert.equal(campaign.status, 201);
    const campaignId = campaign.body.campaignId,
      creatorId = randomUUID(),
      fileId = randomUUID();
    const data = {
      channelId: "UC-recovery-fixture",
      name: "Recovery Creator",
      videos: [],
    };
    app.store.run(
      "INSERT INTO creators (id,campaign_id,channel_id,data,decision,note,created_at) VALUES (?,?,?,?,?,?,?)",
      creatorId,
      campaignId,
      data.channelId,
      JSON.stringify(data),
      "selected",
      "Snapshot note",
      new Date().toISOString(),
    );
    const blob = Buffer.from("Approved campaign text — 完整附件\n".repeat(200));
    app.store.run(
      "INSERT INTO files VALUES (?,?,?,?,?,?)",
      fileId,
      campaignId,
      me.user.id,
      "campaign.txt",
      blob,
      new Date().toISOString(),
    );
    for (const status of ["draft", "sending", "sent"])
      app.store.run(
        "INSERT INTO messages (id,creator_id,user_id,subject,body,status,created_at) VALUES (?,?,?,?,?,?,?)",
        randomUUID(),
        creatorId,
        me.user.id,
        status,
        "Synthetic email body",
        status,
        new Date().toISOString(),
      );
    app.store.run(
      "INSERT INTO integrations VALUES (?,?,?,?)",
      me.user.id,
      encrypt({ refresh_token: "fixture-only-token" }, key),
      "controlled@example.com",
      new Date().toISOString(),
    );
    app.store.run(
      "INSERT INTO jobs (id,campaign_id,status,created_at,updated_at) VALUES (?,?,?,?,?)",
      randomUUID(),
      campaignId,
      "running",
      new Date().toISOString(),
      new Date().toISOString(),
    );
    app.store.run(
      "INSERT INTO oauth_states VALUES (?,?,?)",
      "old-oauth",
      me.user.id,
      Date.now() + 60000,
    );
    app.store.run(
      "INSERT INTO recovery_tokens VALUES (?,?,?)",
      "old-reset",
      me.user.id,
      Date.now() + 60000,
    );
    app.store.run(
      "INSERT INTO invitations VALUES (?,?,?,?,?)",
      "old-invite",
      me.workspaces[0].id,
      "invitee@example.com",
      "editor",
      Date.now() + 60000,
    );
    assert.ok(
      statSync(source + "-wal").size > 0,
      "Fixture must exercise uncheckpointed WAL data",
    );
    const snapshot = await createBackup(source, join(directory, "backups"));
    assert.equal(snapshot.counts.campaigns, 1);
    assert.equal(snapshot.counts.files, 1);
    if (process.platform !== "win32")
      assert.equal(statSync(snapshot.filename).mode & 0o777, 0o600);
    // Changes after the snapshot must not leak into a restored point-in-time copy.
    app.store.run(
      "UPDATE creators SET note='After snapshot' WHERE id=?",
      creatorId,
    );
    const recovery = await restoreBackup(snapshot.filename, destination, key);
    assert.deepEqual(recovery.counts, snapshot.counts);
    if (process.platform !== "win32")
      assert.equal(statSync(destination).mode & 0o777, 0o600);
    restored = createApp({ ...config, database: destination });
    const restoredBase = await start(restored);
    assert.equal(
      (await call(restoredBase, "/api/me", "GET", undefined, cookie)).status,
      401,
      "Old sessions must not be revived",
    );
    const login = await call(restoredBase, "/api/auth/login", "POST", {
      email: "recovery@example.com",
      password: "Long secure backup test password",
    });
    assert.equal(login.status, 200);
    const state = (
      await call(
        restoredBase,
        `/api/campaigns/${campaignId}`,
        "GET",
        undefined,
        login.cookie,
      )
    ).body;
    assert.equal(state.creators[0].note, "Snapshot note");
    assert.equal(state.creators[0].decision, "selected");
    assert.deepEqual(state.messages.map((m) => m.status).sort(), [
      "sent",
      "stale",
      "unknown",
    ]);
    assert.equal(state.job.status, "interrupted");
    for (const table of ["oauth_states", "recovery_tokens", "invitations"])
      assert.equal(
        restored.store.one(`SELECT count(*) AS count FROM ${table}`).count,
        0,
      );
    assert.deepEqual(
      decrypt(
        restored.store.one("SELECT gmail_tokens FROM integrations")
          .gmail_tokens,
        key,
      ),
      { refresh_token: "fixture-only-token" },
    );
    const attachment = await fetch(`${restoredBase}/api/files/${fileId}`, {
      headers: { cookie: login.cookie },
    });
    assert.equal(attachment.status, 200);
    assert.deepEqual(Buffer.from(await attachment.arrayBuffer()), blob);
    const outsider = await call(restoredBase, "/api/auth/register", "POST", {
      name: "Outsider",
      email: "outsider-recovery@example.com",
      password: "Another secure testing password",
    });
    assert.equal(
      (
        await call(
          restoredBase,
          `/api/campaigns/${campaignId}`,
          "GET",
          undefined,
          outsider.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(`${restoredBase}/api/files/${fileId}`, {
          headers: { cookie: outsider.cookie },
        })
      ).status,
      404,
    );
    assert.equal(
      app.store.one("SELECT note FROM creators WHERE id=?", creatorId).note,
      "After snapshot",
      "Restore must not modify the live source",
    );
  } finally {
    if (restored) await restored.close();
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("recovery refuses overwrite, sidecars, symlinks, wrong keys and invalid databases", async () => {
  const directory = mkdtempSync(join(tmpdir(), "orbit-recovery-guards-"));
  const source = join(directory, "source.sqlite");
  const store = openStore(source);
  try {
    const snapshot = await createBackup(source, join(directory, "backups"));
    const existing = join(directory, "existing.sqlite");
    writeFileSync(existing, "Existing user data");
    await assert.rejects(
      restoreBackup(snapshot.filename, existing),
      /already exists/,
    );
    assert.equal(readFileSync(existing, "utf8"), "Existing user data");
    await assert.rejects(
      restoreBackup(snapshot.filename, snapshot.filename),
      /different files/,
    );
    const sidecarTarget = join(directory, "sidecar.sqlite");
    writeFileSync(sidecarTarget + "-wal", "Pending write-ahead data");
    await assert.rejects(
      restoreBackup(snapshot.filename, sidecarTarget),
      /sidecar already exists/,
    );
    assert.equal(existsSync(sidecarTarget), false);
    assert.equal(
      readFileSync(sidecarTarget + "-wal", "utf8"),
      "Pending write-ahead data",
    );
    const linked = join(directory, "linked.sqlite");
    symlinkSync(snapshot.filename, linked);
    await assert.rejects(
      restoreBackup(linked, join(directory, "link-copy.sqlite")),
      /symbolic link/,
    );
    const invalid = join(directory, "invalid.sqlite");
    writeFileSync(invalid, "Not a database");
    await assert.rejects(
      restoreBackup(invalid, join(directory, "invalid-copy.sqlite")),
    );
    assert.equal(existsSync(join(directory, "invalid-copy.sqlite")), false);
    const unrelated = join(directory, "other.sqlite");
    const other = new DatabaseSync(unrelated);
    other.exec("CREATE TABLE unrelated (id INTEGER)");
    other.close();
    await assert.rejects(
      restoreBackup(unrelated, join(directory, "other-copy.sqlite")),
      /not a complete Orbit/,
    );
    // Synthetic rows meet the real foreign keys before testing key validation.
    store.run(
      "INSERT INTO users VALUES (?,?,?,?,?)",
      "fixture-user",
      "fixture@example.com",
      "Fixture",
      "not-a-real-password",
      new Date().toISOString(),
    );
    store.run(
      "INSERT INTO integrations VALUES (?,?,?,?)",
      "fixture-user",
      encrypt({ refresh_token: "fixture" }, key),
      "fixture@example.com",
      new Date().toISOString(),
    );
    const encrypted = await createBackup(source, join(directory, "backups"));
    for (const missingOrWrong of [undefined, "cd".repeat(32)]) {
      const target = join(directory, "wrong-key.sqlite");
      await assert.rejects(
        restoreBackup(encrypted.filename, target, missingOrWrong),
        /original ENCRYPTION_KEY/,
      );
      assert.equal(existsSync(target), false);
    }
    const [first, second] = await Promise.all([
      createBackup(source, join(directory, "backups")),
      createBackup(source, join(directory, "backups")),
    ]);
    assert.notEqual(first.filename, second.filename);
    assert.equal(first.counts.users, 1);
    assert.equal(second.counts.users, 1);
    const command = fileURLToPath(
      new URL("../server/restore.mjs", import.meta.url),
    );
    const usage = spawnSync(process.execPath, [command], { encoding: "utf8" });
    assert.equal(usage.status, 1);
    assert.match(usage.stderr, /Usage:/);
    const target = join(directory, "cli-restored.sqlite");
    const failed = spawnSync(
      process.execPath,
      [command, "--from", encrypted.filename, "--to", target],
      {
        encoding: "utf8",
        env: { ...process.env, ENCRYPTION_KEY: "cd".repeat(32) },
      },
    );
    assert.equal(failed.status, 1);
    assert.equal(existsSync(target), false);
    assert.match(failed.stderr, /original ENCRYPTION_KEY/);
    const cli = spawnSync(
      process.execPath,
      [command, "--from", encrypted.filename, "--to", target],
      { encoding: "utf8", env: { ...process.env, ENCRYPTION_KEY: key } },
    );
    assert.equal(cli.status, 0, cli.stderr);
    assert.match(cli.stdout, /Restored and verified:/);
    assert.equal(cli.stdout.includes(key), false);
    assert.equal(cli.stdout.includes("refresh_token"), false);
    const before = readFileSync(target);
    const refused = spawnSync(
      process.execPath,
      [command, "--from", encrypted.filename, "--to", target],
      { encoding: "utf8", env: { ...process.env, ENCRYPTION_KEY: key } },
    );
    assert.equal(refused.status, 1);
    assert.deepEqual(readFileSync(target), before);
    const backupCommand = fileURLToPath(
      new URL("../server/backup.mjs", import.meta.url),
    );
    const cliBackup = spawnSync(process.execPath, [backupCommand], {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_PATH: source,
        BACKUP_DIRECTORY: join(directory, "cli-backups"),
      },
    });
    assert.equal(cliBackup.status, 0, cliBackup.stderr);
    assert.match(cliBackup.stdout, /Verified database backup created:/);
    const defaultLocation = spawnSync(process.execPath, [backupCommand], {
      encoding: "utf8",
      env: { ...process.env, DATABASE_PATH: source, BACKUP_DIRECTORY: "" },
    });
    assert.equal(defaultLocation.status, 0, defaultLocation.stderr);
    assert.ok(
      defaultLocation.stdout.includes(join(directory, "backups")),
      "Default backups must live beside DATABASE_PATH, not in the image workdir",
    );
    store.db.exec("ALTER TABLE jobs RENAME COLUMN status TO wrong_status");
    await assert.rejects(
      restoreBackup(source, join(directory, "malformed-copy.sqlite"), key),
      /not a complete Orbit/,
    );
    assert.equal(existsSync(join(directory, "malformed-copy.sqlite")), false);
    store.db.exec(
      "ALTER TABLE jobs RENAME COLUMN wrong_status TO status; PRAGMA foreign_keys=OFF;",
    );
    store.run(
      "INSERT INTO members VALUES (?,?,?)",
      "missing-workspace",
      "fixture-user",
      "editor",
    );
    await assert.rejects(
      restoreBackup(source, join(directory, "broken-relations.sqlite"), key),
      /relationships are inconsistent/,
    );
    assert.equal(existsSync(join(directory, "broken-relations.sqlite")), false);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
