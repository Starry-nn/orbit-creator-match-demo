import { createServer } from "node:http";
import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { openStore, id, now, parse } from "./store.mjs";
import { HttpError, makeProviders, encrypt, decrypt } from "./providers.mjs";
import { extractDocument } from "./documents.mjs";
import { briefPdf } from "./pdf.mjs";

const scrypt = promisify(scryptCallback);
const hash = (text) => createHash("sha256").update(text).digest("hex");
const campaignRevision = (record) =>
  hash(JSON.stringify([record.name, record.brief, record.updated_at]));
const creatorRevision = (record) =>
  hash(
    JSON.stringify([
      record.note,
      record.contact_email,
      record.stage,
      record.decision,
      record.deferred_at,
    ]),
  );
const briefRevision = (record) =>
  hash(JSON.stringify([record.content, record.status, record.updated_at]));
const messageRevision = (record) =>
  hash(
    JSON.stringify([
      record.recipient,
      record.subject,
      record.body,
      record.status,
      record.attachments?.map((a) => a.id).sort(),
    ]),
  );
function checkRevision(provided, expected) {
  if (provided !== undefined && provided !== expected)
    throw new HttpError(
      409,
      "This record changed since you opened it. Reload the latest version before saving; your unsaved text has been kept.",
    );
}
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const emailPattern = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const validId = (value) => /^[a-f\d-]{36}$/i.test(value || "");
const text = (value, max = 20000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const numeric = (value) =>
  Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
function requireValue(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${Buffer.from(await scrypt(password, salt, 64)).toString("hex")}`;
}
async function passwordMatches(password, stored) {
  const [salt, expected] = stored.split(":");
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(Buffer.from(expected, "hex"), actual);
}

export function readConfig(env = process.env) {
  return {
    port: Number(env.PORT || 4180),
    host: env.HOST || "127.0.0.1",
    production: env.NODE_ENV === "production",
    appUrl: env.APP_URL || "http://127.0.0.1:4180",
    database: env.DATABASE_PATH || "./data/orbit.sqlite",
    encryptionKey: env.ENCRYPTION_KEY,
    youtubeKey: env.YOUTUBE_API_KEY,
    geminiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || "gemini-2.5-flash",
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    resendKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
  };
}

function campaignInput(input) {
  const result = {};
  for (const key of [
    "name",
    "brand",
    "goal",
    "audience",
    "category",
    "keywords",
    "exclusions",
    "guidelines",
    "description",
    "language",
    "country",
    "format",
    "placement",
    "deadline",
    "rights",
    "deliverables",
  ])
    result[key] = text(input[key], key === "description" ? 30000 : 6000);
  for (const key of [
    "budgetMin",
    "budgetMax",
    "minSubscribers",
    "maxSubscribers",
    "minViews",
  ])
    result[key] = numeric(input[key]);
  requireValue(
    result.name && result.brand && result.goal && result.audience,
    "Campaign name, brand, goal and target audience are required",
  );
  requireValue(
    !result.budgetMax || result.budgetMax >= result.budgetMin,
    "Maximum budget must be at least the minimum budget",
  );
  requireValue(
    !result.maxSubscribers || result.maxSubscribers >= result.minSubscribers,
    "Maximum subscriber count must be at least the minimum",
  );
  return result;
}

export function createApp(config = readConfig(), suppliedProviders) {
  if (config.production) {
    requireValue(
      /^https:\/\//.test(config.appUrl),
      "Production APP_URL must use HTTPS",
      500,
    );
    requireValue(
      /^[a-f0-9]{64}$/i.test(config.encryptionKey || ""),
      "Production ENCRYPTION_KEY must contain 64 hex characters",
      500,
    );
  }
  const store = openStore(config.database);
  const provider = suppliedProviders || makeProviders(config);
  const activeJobs = new Set();
  const limits = new Map();
  function rateLimit(key, max, window = 60000) {
    const current = limits.get(key);
    if (!current || current.until < Date.now()) {
      limits.set(key, { count: 1, until: Date.now() + window });
      return;
    }
    if (++current.count > max)
      throw new HttpError(
        429,
        "Too many requests. Please wait before trying again.",
      );
  }
  function sessionUser(req) {
    const token = /(?:^|; )orbit_session=([^;]+)/.exec(
      req.headers.cookie || "",
    )?.[1];
    return token
      ? store.one(
          "SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires_at>?",
          hash(token),
          Date.now(),
        )
      : null;
  }
  function sessionCookie(res, userId) {
    const token = randomBytes(32).toString("base64url");
    store.run("DELETE FROM sessions WHERE expires_at<?", Date.now());
    store.run(
      "INSERT INTO sessions VALUES (?,?,?)",
      hash(token),
      userId,
      Date.now() + 7 * 86400000,
    );
    res.setHeader(
      "Set-Cookie",
      `orbit_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${config.production ? "; Secure" : ""}`,
    );
  }
  function workspace(userId, workspaceId) {
    const membership = store.one(
      "SELECT * FROM members WHERE workspace_id=? AND user_id=?",
      workspaceId,
      userId,
    );
    requireValue(membership, "Workspace not found", 404);
    return membership;
  }
  function campaign(userId, campaignId) {
    const record = store.one(
      "SELECT c.* FROM campaigns c JOIN members m ON m.workspace_id=c.workspace_id WHERE c.id=? AND m.user_id=?",
      campaignId,
      userId,
    );
    requireValue(record, "Campaign not found", 404);
    return {
      ...record,
      revision: campaignRevision(record),
      brief: parse(record.brief),
    };
  }
  function creator(userId, creatorId) {
    const record = store.one(
      "SELECT r.* FROM creators r JOIN campaigns c ON c.id=r.campaign_id JOIN members m ON m.workspace_id=c.workspace_id WHERE r.id=? AND m.user_id=?",
      creatorId,
      userId,
    );
    requireValue(record, "Creator not found", 404);
    return {
      ...record,
      revision: creatorRevision(record),
      data: parse(record.data),
      analysis: parse(record.analysis),
    };
  }
  function message(userId, messageId) {
    const record = store.one(
      "SELECT * FROM messages WHERE id=? AND user_id=?",
      messageId,
      userId,
    );
    requireValue(record, "Message not found", 404);
    creator(userId, record.creator_id);
    record.attachments = store.all(
      "SELECT f.id,f.name,length(f.data) size FROM message_files mf JOIN files f ON f.id=mf.file_id WHERE mf.message_id=?",
      record.id,
    );
    return { ...record, revision: messageRevision(record) };
  }
  function googleEnabled() {
    return Boolean(
      config.googleClientId &&
      config.googleClientSecret &&
      config.encryptionKey,
    );
  }
  function integration(userId) {
    const record = store.one(
      "SELECT * FROM integrations WHERE user_id=?",
      userId,
    );
    requireValue(record, "Connect Gmail in Settings before sending", 409);
    return {
      ...record,
      tokens: decrypt(record.gmail_tokens, config.encryptionKey),
    };
  }
  function saveTokens(userId, email, tokens) {
    store.run(
      "INSERT INTO integrations VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET gmail_tokens=excluded.gmail_tokens,email=excluded.email,updated_at=excluded.updated_at",
      userId,
      encrypt(tokens, config.encryptionKey),
      email,
      now(),
    );
  }
  function addCreator(campaignId, data) {
    const existing = store.one(
      "SELECT id FROM creators WHERE campaign_id=? AND channel_id=?",
      campaignId,
      data.channelId,
    );
    if (existing) {
      store.run(
        "UPDATE creators SET data=? WHERE id=?",
        JSON.stringify(data),
        existing.id,
      );
      return existing.id;
    }
    const creatorId = id();
    store.run(
      "INSERT INTO creators (id,campaign_id,channel_id,data,created_at) VALUES (?,?,?,?,?)",
      creatorId,
      campaignId,
      data.channelId,
      JSON.stringify(data),
      now(),
    );
    return creatorId;
  }
  async function runDiscovery(jobId, campaignRecord, userId, analyzeOnly) {
    activeJobs.add(jobId);
    try {
      store.run(
        "UPDATE jobs SET status='running',updated_at=? WHERE id=?",
        now(),
        jobId,
      );
      if (!analyzeOnly) {
        const found = await provider.discover(campaignRecord.brief);
        requireValue(
          campaign(userId, campaignRecord.id).revision ===
            campaignRecord.revision,
          "Campaign requirements changed during discovery. Run discovery again.",
          409,
        );
        store.transaction(() =>
          found.forEach((data) => addCreator(campaignRecord.id, data)),
        );
      }
      const records = store.all(
        "SELECT * FROM creators WHERE campaign_id=? AND analysis IS NULL",
        campaignRecord.id,
      );
      store.run(
        "UPDATE jobs SET total=?,updated_at=? WHERE id=?",
        records.length,
        now(),
        jobId,
      );
      const failures = [];
      for (let index = 0; index < records.length; index++) {
        const record = records[index];
        try {
          const analysis = await provider.analyze(
            campaignRecord.brief,
            parse(record.data),
          );
          requireValue(
            campaign(userId, campaignRecord.id).revision ===
              campaignRecord.revision,
            "Campaign requirements changed during analysis. Run analysis again.",
            409,
          );
          store.run(
            "UPDATE creators SET analysis=? WHERE id=?",
            JSON.stringify(analysis),
            record.id,
          );
        } catch (error) {
          failures.push({
            creatorId: record.id,
            name: parse(record.data).name,
            message: error.message,
          });
        }
        store.run(
          "UPDATE jobs SET completed=?,failures=?,updated_at=? WHERE id=?",
          index + 1,
          JSON.stringify(failures),
          now(),
          jobId,
        );
      }
      store.run(
        "UPDATE jobs SET status=?,updated_at=? WHERE id=?",
        failures.length ? "partial" : "completed",
        now(),
        jobId,
      );
      store.activity(
        campaignRecord.id,
        userId,
        `Discovery finished: ${records.length - failures.length} analyzed, ${failures.length} need retry`,
      );
    } catch (error) {
      store.run(
        "UPDATE jobs SET status='failed',failures=?,updated_at=? WHERE id=?",
        JSON.stringify([{ message: error.message }]),
        now(),
        jobId,
      );
    } finally {
      activeJobs.delete(jobId);
    }
  }
  const json = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  async function body(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 2_000_000) throw new HttpError(413, "Request is too large");
      chunks.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString() || "{}");
    } catch {
      throw new HttpError(400, "Invalid JSON request");
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (config.production)
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    try {
      if (path === "/healthz") {
        store.one("SELECT 1");
        return json(res, 200, { status: "ok", version: "1.0.0-alpha.1" });
      }
      if (!path.startsWith("/api/")) {
        let pathname = decodeURIComponent(path);
        if (pathname.endsWith("/")) pathname += "index.html";
        requireValue(
          !pathname
            .split("/")
            .some((segment) => segment === ".." || segment.startsWith(".")),
          "Not found",
          404,
        );
        requireValue(
          /^\/(product\/(?:index\.html|product\.(?:js|css))|assets\/[a-zA-Z0-9_./-]+|(?:index\.html|app\.js|styles\.css|pdf-export\.js))$/.test(
            pathname,
          ),
          "Not found",
          404,
        );
        const filename = resolve(root, `.${pathname}`);
        requireValue(filename.startsWith(root + sep), "Not found", 404);
        const info = await stat(filename).catch(() => null);
        requireValue(info?.isFile(), "Not found", 404);
        const types = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
          ".jpg": "image/jpeg",
          ".png": "image/png",
        };
        if (pathname.startsWith("/product/"))
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://yt3.ggpht.com https://yt3.googleusercontent.com https://i.ytimg.com data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
          );
        res.writeHead(200, {
          "Content-Type":
            types[extname(filename)] || "application/octet-stream",
          "Cache-Control":
            extname(filename) === ".html" ? "no-store" : "no-cache",
        });
        return res.end(await readFile(filename));
      }
      const ip = req.socket.remoteAddress || "unknown";
      rateLimit(`api:${ip}`, 500);
      if (!["GET", "HEAD"].includes(req.method)) {
        const origin = req.headers.origin;
        requireValue(
          !origin || origin === new URL(config.appUrl).origin,
          "Request origin is not allowed",
          403,
        );
        requireValue(
          String(req.headers["content-type"] || "").startsWith(
            "application/json",
          ),
          "Send JSON requests",
          415,
        );
      }
      const input = !["GET", "HEAD"].includes(req.method)
        ? await body(req)
        : {};
      const user = sessionUser(req);
      if (path === "/api/auth/register" && req.method === "POST") {
        rateLimit(`auth:${ip}`, 12, 3600000);
        const email = text(input.email, 254).toLowerCase(),
          name = text(input.name, 100),
          password = String(input.password || "");
        requireValue(
          emailPattern.test(email) &&
            name &&
            password.length >= 12 &&
            password.length <= 256,
          "Use your name, a valid email, and a password of 12–256 characters",
        );
        requireValue(
          !store.one("SELECT id FROM users WHERE email=?", email),
          "An account with this email already exists",
          409,
        );
        const userId = id(),
          workspaceId = id(),
          encoded = await passwordHash(password);
        store.transaction(() => {
          store.run(
            "INSERT INTO users VALUES (?,?,?,?,?)",
            userId,
            email,
            name,
            encoded,
            now(),
          );
          store.run(
            "INSERT INTO workspaces VALUES (?,?,?)",
            workspaceId,
            `${name}’s workspace`,
            now(),
          );
          store.run(
            "INSERT INTO members VALUES (?,?,?)",
            workspaceId,
            userId,
            "owner",
          );
        });
        sessionCookie(res, userId);
        return json(res, 201, { user: { id: userId, email, name } });
      }
      if (path === "/api/auth/login" && req.method === "POST") {
        rateLimit(`login:${ip}`, 20, 900000);
        const record = store.one(
          "SELECT * FROM users WHERE email=?",
          text(input.email, 254).toLowerCase(),
        );
        const password = String(input.password || "").slice(0, 256);
        const valid = record
          ? await passwordMatches(password, record.password)
          : await passwordMatches(
              password,
              `00000000000000000000000000000000:${"0".repeat(128)}`,
            );
        requireValue(record && valid, "Email or password is incorrect", 401);
        sessionCookie(res, record.id);
        return json(res, 200, {
          user: { id: record.id, name: record.name, email: record.email },
        });
      }
      if (path === "/api/auth/recover" && req.method === "POST") {
        rateLimit(`recover:${ip}`, 5, 3600000);
        requireValue(
          config.resendKey && config.emailFrom,
          "Password recovery email is not configured",
          503,
        );
        const record = store.one(
          "SELECT id,email FROM users WHERE email=?",
          text(input.email, 254).toLowerCase(),
        );
        if (record) {
          const token = randomBytes(32).toString("base64url");
          store.run(
            "INSERT INTO recovery_tokens VALUES (?,?,?)",
            hash(token),
            record.id,
            Date.now() + 1800000,
          );
          await provider.sendTransactional(
            record.email,
            "Reset your Orbit password",
            `Reset your password within 30 minutes: ${config.appUrl}/product/?reset=${token}`,
          );
        }
        return json(res, 200, {
          message: "If this email has an account, a reset link has been sent.",
        });
      }
      if (path === "/api/auth/reset" && req.method === "POST") {
        const record = store.one(
          "SELECT * FROM recovery_tokens WHERE hash=? AND expires_at>?",
          hash(String(input.token || "")),
          Date.now(),
        );
        requireValue(record, "Reset link is invalid or expired");
        requireValue(
          typeof input.password === "string" &&
            input.password.length >= 12 &&
            input.password.length <= 256,
          "Use a password of 12–256 characters",
        );
        const encoded = await passwordHash(input.password);
        store.transaction(() => {
          store.run(
            "UPDATE users SET password=? WHERE id=?",
            encoded,
            record.user_id,
          );
          store.run("DELETE FROM sessions WHERE user_id=?", record.user_id);
          store.run(
            "DELETE FROM recovery_tokens WHERE user_id=?",
            record.user_id,
          );
        });
        return json(res, 200, {
          message: "Password updated. Sign in to continue.",
        });
      }
      requireValue(user, "Sign in to continue", 401);
      if (path === "/api/auth/logout" && req.method === "POST") {
        const token = /(?:^|; )orbit_session=([^;]+)/.exec(
          req.headers.cookie || "",
        )?.[1];
        if (token) store.run("DELETE FROM sessions WHERE hash=?", hash(token));
        res.setHeader(
          "Set-Cookie",
          `orbit_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${config.production ? "; Secure" : ""}`,
        );
        return json(res, 200, { ok: true });
      }
      if (path === "/api/me" && req.method === "GET")
        return json(res, 200, {
          user,
          workspaces: store.all(
            "SELECT w.*,m.role FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE m.user_id=?",
            user.id,
          ),
          integrations: {
            youtube: Boolean(config.youtubeKey),
            gemini: Boolean(config.geminiKey),
            gmailAvailable: googleEnabled(),
            gmail:
              store.one(
                "SELECT email FROM integrations WHERE user_id=?",
                user.id,
              ) || null,
            recovery: Boolean(config.resendKey && config.emailFrom),
          },
        });
      if (path === "/api/documents/extract" && req.method === "POST") {
        rateLimit(`documents:${user.id}`, 30, 3600000);
        const extracted = await extractDocument(
          text(input.filename, 200),
          input.base64,
        );
        return json(res, 200, { text: extracted });
      }
      if (path === "/api/invitations/accept" && req.method === "POST") {
        const invitation = store.one(
          "SELECT * FROM invitations WHERE hash=? AND expires_at>?",
          hash(text(input.token, 200)),
          Date.now(),
        );
        requireValue(
          invitation && invitation.email === user.email,
          "Invitation is invalid, expired, or for a different email",
          403,
        );
        store.transaction(() => {
          store.run(
            "INSERT INTO members VALUES (?,?,?) ON CONFLICT(workspace_id,user_id) DO NOTHING",
            invitation.workspace_id,
            user.id,
            invitation.role,
          );
          store.run("DELETE FROM invitations WHERE hash=?", invitation.hash);
        });
        return json(res, 200, { ok: true });
      }
      const teamMatch =
        /^\/api\/workspaces\/([a-f\d-]{36})\/(members|invitations)$/.exec(path);
      if (teamMatch) {
        const membership = workspace(user.id, teamMatch[1]);
        if (teamMatch[2] === "members" && req.method === "GET")
          return json(res, 200, {
            members: store.all(
              "SELECT u.id,u.name,u.email,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=?",
              teamMatch[1],
            ),
          });
        requireValue(
          membership.role === "owner",
          "Only the workspace owner can manage teammates",
          403,
        );
        if (teamMatch[2] === "members" && req.method === "DELETE") {
          requireValue(validId(input.userId), "Choose a workspace member");
          const member = store.one(
            "SELECT m.role,u.email FROM members m JOIN users u ON u.id=m.user_id WHERE workspace_id=? AND user_id=?",
            teamMatch[1],
            input.userId,
          );
          requireValue(member, "Member not found", 404);
          requireValue(
            member.role !== "owner",
            "The workspace owner cannot be removed",
            409,
          );
          store.transaction(() => {
            store.run(
              "DELETE FROM members WHERE workspace_id=? AND user_id=?",
              teamMatch[1],
              input.userId,
            );
            store.run(
              "DELETE FROM invitations WHERE workspace_id=? AND email=?",
              teamMatch[1],
              member.email,
            );
          });
          return json(res, 200, { ok: true });
        }
        requireValue(
          req.method === "POST" && teamMatch[2] === "invitations",
          "Endpoint not found",
          404,
        );
        requireValue(
          config.resendKey && config.emailFrom,
          "Connect transactional email before inviting teammates",
          503,
        );
        const email = text(input.email, 254).toLowerCase();
        requireValue(emailPattern.test(email), "Enter a valid email");
        const token = randomBytes(32).toString("base64url");
        store.run(
          "INSERT INTO invitations VALUES (?,?,?,?,?)",
          hash(token),
          teamMatch[1],
          email,
          "editor",
          Date.now() + 7 * 86400000,
        );
        await provider.sendTransactional(
          email,
          `${user.name} invited you to Orbit`,
          `Join the creator workspace: ${config.appUrl}/product/?invite=${token}\nSign in or register with ${email}. This invitation expires in 7 days.`,
        );
        return json(res, 201, { message: "Invitation sent" });
      }
      if (path === "/api/campaigns" && req.method === "GET")
        return json(res, 200, {
          campaigns: store
            .all(
              "SELECT c.* FROM campaigns c JOIN members m ON m.workspace_id=c.workspace_id WHERE m.user_id=? ORDER BY c.updated_at DESC",
              user.id,
            )
            .map((row) => ({ ...row, brief: parse(row.brief) })),
        });
      if (path === "/api/campaigns" && req.method === "POST") {
        workspace(user.id, input.workspaceId);
        const brief = campaignInput(input),
          campaignId = id();
        store.run(
          "INSERT INTO campaigns VALUES (?,?,?,?,?,?)",
          campaignId,
          input.workspaceId,
          brief.name,
          JSON.stringify(brief),
          now(),
          now(),
        );
        return json(res, 201, { campaignId });
      }
      if (path === "/api/google/connect" && req.method === "GET") {
        requireValue(googleEnabled(), "Google OAuth is not configured", 503);
        const token = randomBytes(32).toString("base64url");
        store.run(
          "INSERT INTO oauth_states VALUES (?,?,?)",
          hash(token),
          user.id,
          Date.now() + 600000,
        );
        const params = new URLSearchParams({
          client_id: config.googleClientId,
          redirect_uri: `${config.appUrl}/api/google/callback`,
          response_type: "code",
          access_type: "offline",
          prompt: "consent",
          state: token,
          scope:
            "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
        });
        res.writeHead(302, {
          Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        });
        return res.end();
      }
      if (path === "/api/google/callback" && req.method === "GET") {
        const oauth = store.one(
          "SELECT * FROM oauth_states WHERE hash=? AND user_id=? AND expires_at>?",
          hash(url.searchParams.get("state") || ""),
          user.id,
          Date.now(),
        );
        requireValue(
          oauth && url.searchParams.has("code"),
          "Google connection expired or was declined",
        );
        store.run("DELETE FROM oauth_states WHERE hash=?", oauth.hash);
        const tokens = await provider.oauthToken({
          grant_type: "authorization_code",
          code: url.searchParams.get("code"),
          redirect_uri: `${config.appUrl}/api/google/callback`,
        });
        requireValue(
          tokens.refresh_token,
          "Google did not grant offline access. Reconnect Gmail.",
          502,
        );
        tokens.expires_at = Date.now() + tokens.expires_in * 1000;
        const profile = await provider.gmail(tokens, "profile");
        saveTokens(user.id, profile.data.emailAddress, profile.tokens);
        res.writeHead(302, { Location: "/product/#settings" });
        return res.end();
      }
      if (path === "/api/google/disconnect" && req.method === "POST") {
        store.run("DELETE FROM integrations WHERE user_id=?", user.id);
        return json(res, 200, { ok: true });
      }
      const match =
        /^\/api\/(campaigns|creators|messages|briefs|tasks|files)\/([\w-]+)(?:\/([\w-]+))?$/.exec(
          path,
        );
      requireValue(match, "Endpoint not found", 404);
      const [, resource, recordId, action] = match;
      requireValue(validId(recordId), "Record not found", 404);
      if (resource === "campaigns") {
        const c = campaign(user.id, recordId);
        if (!action && req.method === "GET")
          return json(res, 200, {
            campaign: c,
            creators: store
              .all(
                "SELECT * FROM creators WHERE campaign_id=? ORDER BY deferred_at IS NOT NULL,deferred_at,created_at",
                c.id,
              )
              .map((row) => ({
                ...row,
                revision: creatorRevision(row),
                data: parse(row.data),
                analysis: parse(row.analysis),
              })),
            briefs: store
              .all(
                "SELECT b.* FROM briefs b JOIN creators r ON r.id=b.creator_id WHERE r.campaign_id=?",
                c.id,
              )
              .map((row) => ({
                ...row,
                revision: briefRevision(row),
                content: parse(row.content),
              })),
            messages: store
              .all(
                "SELECT m.* FROM messages m JOIN creators r ON r.id=m.creator_id WHERE r.campaign_id=? AND m.user_id=? ORDER BY m.created_at DESC",
                c.id,
                user.id,
              )
              .map((row) => message(user.id, row.id)),
            tasks: store.all(
              "SELECT * FROM tasks WHERE campaign_id=? ORDER BY done,due_date",
              c.id,
            ),
            activities: store.all(
              "SELECT a.*,u.name FROM activities a JOIN users u ON u.id=a.user_id WHERE campaign_id=? ORDER BY created_at DESC LIMIT 50",
              c.id,
            ),
            files: store.all(
              "SELECT id,name,created_at FROM files WHERE campaign_id=? ORDER BY created_at DESC",
              c.id,
            ),
            reviews: store
              .all(
                "SELECT v.* FROM reviews v JOIN creators r ON r.id=v.creator_id WHERE r.campaign_id=? ORDER BY v.created_at DESC",
                c.id,
              )
              .map((v) => ({ ...v, result: parse(v.result) })),
            job: store.one(
              "SELECT * FROM jobs WHERE campaign_id=? ORDER BY created_at DESC LIMIT 1",
              c.id,
            ),
          });
        if (!action && req.method === "PATCH") {
          const brief = campaignInput(input);
          checkRevision(input.revision, c.revision);
          store.transaction(() => {
            store.run(
              "UPDATE campaigns SET name=?,brief=?,updated_at=? WHERE id=?",
              brief.name,
              JSON.stringify(brief),
              now(),
              c.id,
            );
            store.run(
              "UPDATE creators SET analysis=NULL WHERE campaign_id=?",
              c.id,
            );
            store.run(
              "UPDATE briefs SET status='needs review',updated_at=? WHERE creator_id IN (SELECT id FROM creators WHERE campaign_id=?)",
              now(),
              c.id,
            );
            store.run(
              "UPDATE messages SET status='stale',error='Campaign requirements changed. Generate a new outreach draft before sending.' WHERE status='draft' AND creator_id IN (SELECT id FROM creators WHERE campaign_id=?)",
              c.id,
            );
            store.activity(
              c.id,
              user.id,
              "Updated campaign requirements; existing analysis and drafts require review",
            );
          });
          return json(res, 200, {
            ok: true,
            revision: campaign(user.id, c.id).revision,
          });
        }
        if (action === "import" && req.method === "POST") {
          rateLimit(`import:${user.id}`, 20, 3600000);
          const data = await provider.importChannel(text(input.channel, 300));
          const creatorId = addCreator(c.id, data);
          store.activity(c.id, user.id, `Imported ${data.name}`);
          return json(res, 201, { creatorId });
        }
        if (action === "discover" && req.method === "POST") {
          requireValue(
            config.youtubeKey && config.geminiKey,
            "Connect YouTube and Gemini before running discovery",
            503,
          );
          rateLimit(`discover:${user.id}`, 10, 3600000);
          requireValue(
            !store.one(
              "SELECT id FROM jobs WHERE campaign_id=? AND status IN ('queued','running')",
              c.id,
            ),
            "Discovery is already running",
            409,
          );
          const jobId = id();
          store.run(
            "INSERT INTO jobs (id,campaign_id,status,created_at,updated_at) VALUES (?,?,?,?,?)",
            jobId,
            c.id,
            "queued",
            now(),
            now(),
          );
          setImmediate(() =>
            runDiscovery(jobId, c, user.id, Boolean(input.analyzeOnly)),
          );
          return json(res, 202, { jobId });
        }
        if (action === "undo" && req.method === "POST") {
          const decision = store.one(
            "SELECT * FROM decisions WHERE campaign_id=? AND user_id=? AND undone=0 ORDER BY id DESC LIMIT 1",
            c.id,
            user.id,
          );
          requireValue(decision, "No decision to undo", 409);
          const previous = parse(decision.previous);
          const latest = store.one(
            "SELECT id FROM decisions WHERE creator_id=? AND undone=0 ORDER BY id DESC LIMIT 1",
            decision.creator_id,
          );
          requireValue(
            latest?.id === decision.id,
            "A teammate has updated this creator. Review their latest decision before undoing.",
            409,
          );
          store.transaction(() => {
            store.run(
              "UPDATE creators SET decision=?,deferred_at=?,note=? WHERE id=?",
              previous.decision,
              previous.deferred_at,
              previous.note,
              decision.creator_id,
            );
            store.run("UPDATE decisions SET undone=1 WHERE id=?", decision.id);
          });
          return json(res, 200, { creatorId: decision.creator_id });
        }
        if (action === "tasks" && req.method === "POST") {
          const title = text(input.title, 300);
          requireValue(title, "Task title is required");
          const taskId = id();
          store.run(
            "INSERT INTO tasks VALUES (?,?,?,?,?,?)",
            taskId,
            c.id,
            title,
            text(input.dueDate, 10),
            0,
            now(),
          );
          return json(res, 201, { taskId });
        }
        if (action === "files" && req.method === "POST") {
          const filename = text(input.name, 200).replace(/[\r\n/\\]/g, "_");
          requireValue(
            /\.(pdf|docx|txt|png|jpe?g)$/i.test(filename),
            "Use PDF, DOCX, TXT, PNG or JPG",
          );
          requireValue(
            typeof input.base64 === "string" && input.base64.length < 2_000_000,
            "Use a file smaller than 1.5 MB",
            413,
          );
          const buffer = Buffer.from(input.base64, "base64");
          requireValue(
            buffer.length && buffer.length <= 1_500_000,
            "Invalid file",
            400,
          );
          const used = store.one(
            "SELECT COALESCE(SUM(length(data)),0) size FROM files WHERE campaign_id=?",
            c.id,
          ).size;
          requireValue(
            used + buffer.length <= 30_000_000,
            "Campaign file storage limit reached (30 MB)",
            413,
          );
          const fileId = id();
          store.run(
            "INSERT INTO files VALUES (?,?,?,?,?,?)",
            fileId,
            c.id,
            user.id,
            filename,
            buffer,
            now(),
          );
          store.activity(c.id, user.id, `Uploaded ${filename}`);
          return json(res, 201, { fileId });
        }
        if (action === "export" && req.method === "GET") {
          const rows = store.all(
            "SELECT * FROM creators WHERE campaign_id=? AND decision=?",
            c.id,
            "selected",
          );
          const cell = (value) => {
            let s = String(value ?? "");
            if (/^[=+@\-]/.test(s)) s = `'${s}`;
            return `"${s.replaceAll('"', '""')}"`;
          };
          const csv = [
            [
              "Creator",
              "Channel",
              "Subscribers",
              "Average views",
              "AI fit",
              "Stage",
              "Notes",
            ],
            ...rows.map((row) => {
              const d = parse(row.data),
                a = parse(row.analysis);
              return [
                d.name,
                d.channelId,
                d.subscribers,
                d.averageViews,
                a?.score,
                row.stage,
                row.note,
              ];
            }),
          ]
            .map((row) => row.map(cell).join(","))
            .join("\r\n");
          res.writeHead(200, {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="orbit-selected.csv"',
          });
          return res.end("\uFEFF" + csv);
        }
      }
      if (resource === "creators") {
        const r = creator(user.id, recordId),
          c = campaign(user.id, r.campaign_id);
        if (!action && req.method === "PATCH") {
          checkRevision(input.revision, r.revision);
          const note =
            typeof input.note === "string" ? text(input.note, 10000) : r.note;
          const contact =
            typeof input.email === "string"
              ? text(input.email, 254)
              : r.contact_email;
          requireValue(
            !contact || emailPattern.test(contact),
            "Enter a valid creator contact email",
          );
          const stages = [
            "Selected",
            "Contacted",
            "Responded",
            "Interested",
            "Declined",
            "Brief approved",
            "Live",
          ];
          const stage = stages.includes(input.stage) ? input.stage : r.stage;
          store.run(
            "UPDATE creators SET note=?,contact_email=?,stage=? WHERE id=?",
            note,
            contact,
            stage,
            r.id,
          );
          return json(res, 200, {
            ok: true,
            revision: creator(user.id, r.id).revision,
          });
        }
        if (action === "decision" && req.method === "POST") {
          requireValue(
            ["passed", "selected", "deferred"].includes(input.decision),
            "Invalid decision",
          );
          store.transaction(() => {
            store.run(
              "INSERT INTO decisions (campaign_id,creator_id,user_id,previous,created_at) VALUES (?,?,?,?,?)",
              c.id,
              r.id,
              user.id,
              JSON.stringify({
                decision: r.decision,
                deferred_at: r.deferred_at,
                note: r.note,
              }),
              now(),
            );
            store.run(
              "UPDATE creators SET decision=?,deferred_at=?,note=? WHERE id=?",
              input.decision,
              input.decision === "deferred" ? now() : null,
              typeof input.note === "string" ? text(input.note, 10000) : r.note,
              r.id,
            );
            store.activity(c.id, user.id, `${input.decision}: ${r.data.name}`);
          });
          return json(res, 200, { ok: true });
        }
        if (action === "brief" && req.method === "POST") {
          requireValue(
            r.analysis,
            "Analyze this creator before generating a brief",
            409,
          );
          rateLimit(`ai:${user.id}`, 30, 3600000);
          const existing = store.one(
            "SELECT * FROM briefs WHERE creator_id=?",
            r.id,
          );
          requireValue(
            !existing || input.replace === true,
            "A brief already exists. Open the saved brief or explicitly regenerate it.",
            409,
          );
          const content = await provider.generateBrief(
              c.brief,
              r.data,
              r.analysis,
            ),
            briefId = existing?.id || id();
          requireValue(
            campaign(user.id, c.id).revision === c.revision,
            "Campaign requirements changed while Gemini was drafting. Please regenerate.",
            409,
          );
          const latestBrief = store.one(
            "SELECT * FROM briefs WHERE creator_id=?",
            r.id,
          );
          requireValue(
            existing
              ? latestBrief &&
                  briefRevision(latestBrief) === briefRevision(existing)
              : !latestBrief,
            "This brief changed while Gemini was drafting. Open the saved version before replacing it.",
            409,
          );
          store.run(
            "INSERT INTO briefs VALUES (?,?,?,?,?) ON CONFLICT(creator_id) DO UPDATE SET content=excluded.content,status='draft',updated_at=excluded.updated_at",
            briefId,
            r.id,
            JSON.stringify(content),
            "draft",
            now(),
          );
          store.activity(c.id, user.id, `Generated brief for ${r.data.name}`);
          return json(res, 201, { briefId, content });
        }
        if (action === "draft" && req.method === "POST") {
          requireValue(
            r.decision === "selected",
            "Select this creator before drafting outreach",
            409,
          );
          requireValue(
            r.analysis,
            "Analyze this creator before drafting outreach",
            409,
          );
          rateLimit(`ai:${user.id}`, 30, 3600000);
          const draft = await provider.draftEmail(c.brief, r.data, r.analysis),
            messageId = id();
          requireValue(
            campaign(user.id, c.id).revision === c.revision,
            "Campaign requirements changed while Gemini was drafting. Please generate a new draft.",
            409,
          );
          store.run(
            "INSERT INTO messages (id,creator_id,user_id,recipient,subject,body,created_at) VALUES (?,?,?,?,?,?,?)",
            messageId,
            r.id,
            user.id,
            r.contact_email,
            draft.subject,
            draft.body,
            now(),
          );
          return json(res, 201, { messageId });
        }
        if (action === "review" && req.method === "POST") {
          const brief = store.one(
            "SELECT * FROM briefs WHERE creator_id=?",
            r.id,
          );
          requireValue(
            brief,
            "Generate a creator brief before reviewing a draft",
            409,
          );
          const script = text(input.script, 30000);
          requireValue(
            script.length >= 20,
            "Paste at least 20 characters of the creator draft",
          );
          rateLimit(`ai:${user.id}`, 30, 3600000);
          const result = await provider.gemini(
            'Check the draft against the campaign and creator brief. Return {summary:string,issues:[{severity:"pass"|"review"|"change",quote:string,reason:string,suggestion:string}]}. Identify unsupported product claims, missing disclosures and missing deliverables. This is a first-pass check; legal and brand approval are still required. Do not invent obligations.',
            { campaign: c.brief, brief: parse(brief.content), script },
          );
          requireValue(
            typeof result.summary === "string" &&
              Array.isArray(result.issues) &&
              result.issues.every(
                (i) =>
                  ["pass", "review", "change"].includes(i.severity) &&
                  ["quote", "reason", "suggestion"].every(
                    (k) => typeof i[k] === "string",
                  ),
              ),
            "Gemini returned an incomplete draft review",
            502,
          );
          const reviewId = id();
          store.run(
            "INSERT INTO reviews VALUES (?,?,?,?,?)",
            reviewId,
            r.id,
            script,
            JSON.stringify(result),
            now(),
          );
          return json(res, 201, { reviewId, result });
        }
      }
      if (resource === "messages") {
        const m = message(user.id, recordId),
          r = creator(user.id, m.creator_id);
        if (!action && req.method === "PATCH") {
          requireValue(m.status === "draft", "Only drafts can be edited", 409);
          checkRevision(input.revision, m.revision);
          let attachments = null;
          if (input.fileIds !== undefined) {
            requireValue(
              Array.isArray(input.fileIds) &&
                input.fileIds.length <= 4 &&
                input.fileIds.every(validId),
              "Select up to 4 campaign attachments",
            );
            const ids = [...new Set(input.fileIds)];
            attachments = ids.map((fileId) =>
              store.one(
                "SELECT id,length(data) size FROM files WHERE id=? AND campaign_id=?",
                fileId,
                r.campaign_id,
              ),
            );
            requireValue(
              attachments.every(Boolean),
              "An attachment is not part of this campaign",
              404,
            );
            requireValue(
              attachments.reduce((sum, f) => sum + f.size, 0) <= 5_000_000,
              "Attachments must total 5 MB or less",
              413,
            );
          }
          const recipient = text(input.recipient, 254);
          requireValue(
            !recipient || emailPattern.test(recipient),
            "Enter a valid recipient",
          );
          requireValue(
            text(input.subject, 300) && text(input.body),
            "Subject and message are required",
          );
          store.transaction(() => {
            store.run(
              "UPDATE messages SET recipient=?,subject=?,body=? WHERE id=?",
              recipient,
              text(input.subject, 300),
              text(input.body),
              m.id,
            );
            if (attachments !== null) {
              store.run("DELETE FROM message_files WHERE message_id=?", m.id);
              attachments.forEach((f) =>
                store.run("INSERT INTO message_files VALUES (?,?)", m.id, f.id),
              );
            }
          });
          return json(res, 200, {
            ok: true,
            revision: message(user.id, m.id).revision,
          });
        }
        if (action === "send" && req.method === "POST") {
          requireValue(input.approve === true, "Explicit approval is required");
          requireValue(
            emailPattern.test(m.recipient),
            "Enter a valid creator contact email",
          );
          const connected = integration(user.id);
          requireValue(
            m.status === "draft",
            "This email was already sent or requires delivery review",
            409,
          );
          requireValue(
            store.run(
              "UPDATE messages SET status='sending' WHERE id=? AND status='draft'",
              m.id,
            ).changes === 1,
            "Send is already in progress",
            409,
          );
          try {
            const attachments = store.all(
              "SELECT f.name,f.data FROM message_files mf JOIN files f ON f.id=mf.file_id WHERE mf.message_id=? AND f.campaign_id=?",
              m.id,
              r.campaign_id,
            );
            const result = await provider.sendMail(
              connected.tokens,
              m.recipient,
              m.subject,
              m.body,
              attachments,
            );
            requireValue(
              result.data.id,
              "Gmail did not return a send confirmation",
              502,
            );
            saveTokens(user.id, connected.email, result.tokens);
            store.run(
              "UPDATE messages SET status='sent',provider_id=?,thread_id=?,sent_at=?,error=NULL WHERE id=?",
              result.data.id,
              result.data.threadId || null,
              now(),
              m.id,
            );
            store.run("UPDATE creators SET stage='Contacted' WHERE id=?", r.id);
            store.activity(
              r.campaign_id,
              user.id,
              `Sent approved email to ${r.data.name}`,
            );
            return json(res, 200, { status: "sent" });
          } catch (error) {
            store.run(
              "UPDATE messages SET status='unknown',error=? WHERE id=?",
              "Send confirmation failed. Check Gmail Sent before retrying.",
              m.id,
            );
            throw error;
          }
        }
        if (action === "sync" && req.method === "POST") {
          requireValue(
            m.thread_id,
            "This email has no Gmail conversation yet",
            409,
          );
          const connected = integration(user.id);
          const result = await provider.gmail(
            connected.tokens,
            `threads/${encodeURIComponent(m.thread_id)}?format=metadata&metadataHeaders=From`,
          );
          saveTokens(user.id, connected.email, result.tokens);
          const replies = (result.data.messages || []).filter(
            (item) =>
              item.id !== m.provider_id &&
              !(item.labelIds || []).includes("SENT") &&
              Number(item.internalDate) > Date.parse(m.sent_at),
          );
          if (replies.length) {
            store.run(
              "UPDATE messages SET status='responded' WHERE id=?",
              m.id,
            );
            store.run("UPDATE creators SET stage='Responded' WHERE id=?", r.id);
          }
          return json(res, 200, {
            replies: replies.map((item) => ({
              snippet: item.snippet || "",
              receivedAt: new Date(Number(item.internalDate)).toISOString(),
            })),
          });
        }
      }
      if (resource === "briefs") {
        const b = store.one("SELECT * FROM briefs WHERE id=?", recordId);
        requireValue(b, "Brief not found", 404);
        const r = creator(user.id, b.creator_id);
        if (action === "export" && req.method === "GET") {
          const c = campaign(user.id, r.campaign_id);
          const pdf = await briefPdf(c.brief, r.data, {
            ...b,
            content: parse(b.content),
          });
          res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="orbit-creator-brief.pdf"',
            "Cache-Control": "no-store",
          });
          return res.end(pdf);
        }
        if (!action && req.method === "PATCH") {
          const previous = parse(b.content);
          checkRevision(input.revision, briefRevision(b));
          requireValue(
            typeof input.content === "object" &&
              input.content &&
              JSON.stringify(input.content).length < 100000 &&
              Object.keys(previous).every((key) =>
                Array.isArray(previous[key])
                  ? Array.isArray(input.content[key]) &&
                    input.content[key].every((item) => typeof item === "string")
                  : typeof input.content[key] === "string",
              ),
            "Invalid brief",
          );
          store.run(
            "UPDATE briefs SET content=?,status='draft',updated_at=? WHERE id=?",
            JSON.stringify(input.content),
            now(),
            b.id,
          );
          return json(res, 200, {
            ok: true,
            revision: briefRevision(
              store.one("SELECT * FROM briefs WHERE id=?", b.id),
            ),
          });
        }
        if (action === "approve" && req.method === "POST") {
          requireValue(input.approve === true, "Approval is required");
          checkRevision(input.revision, briefRevision(b));
          requireValue(
            b.status !== "needs review",
            "Campaign requirements changed. Save the reviewed brief or regenerate it before approval.",
            409,
          );
          store.run(
            "UPDATE briefs SET status='approved',updated_at=? WHERE id=?",
            now(),
            b.id,
          );
          store.run(
            "UPDATE creators SET stage='Brief approved' WHERE id=?",
            r.id,
          );
          store.activity(
            r.campaign_id,
            user.id,
            `Approved brief for ${r.data.name}`,
          );
          return json(res, 200, { ok: true });
        }
      }
      if (resource === "tasks" && req.method === "PATCH") {
        const task = store.one("SELECT * FROM tasks WHERE id=?", recordId);
        requireValue(task, "Task not found", 404);
        campaign(user.id, task.campaign_id);
        store.run(
          "UPDATE tasks SET done=? WHERE id=?",
          input.done ? 1 : 0,
          recordId,
        );
        return json(res, 200, { ok: true });
      }
      if (resource === "files" && req.method === "GET") {
        const file = store.one("SELECT * FROM files WHERE id=?", recordId);
        requireValue(file, "File not found", 404);
        campaign(user.id, file.campaign_id);
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          "Cache-Control": "no-store",
        });
        return res.end(Buffer.from(file.data));
      }
      throw new HttpError(404, "Endpoint not found");
    } catch (error) {
      if (!res.headersSent)
        json(res, error.status || 500, {
          error: error.status
            ? error.message
            : "An unexpected error occurred. Please retry.",
        });
      else res.end();
      if (!error.status)
        console.error("Orbit request failed:", error.name, error.message);
    }
  });
  server.requestTimeout = 200000;
  return {
    server,
    store,
    activeJobs,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      store.close();
    },
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const config = readConfig();
  const app = createApp(config);
  app.server.listen(config.port, config.host, () =>
    console.log(`Orbit listening at ${config.appUrl}/product/`),
  );
  process.once("SIGTERM", () => app.close().then(() => process.exit(0)));
}
