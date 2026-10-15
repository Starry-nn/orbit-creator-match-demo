import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, readConfig } from "../server/index.mjs";
import { extractDocument } from "../server/documents.mjs";
import { zipSync, strToU8 } from "fflate";
import { PDFParse } from "pdf-parse";
import {
  encrypt,
  decrypt,
  makeProviders,
  durationSeconds,
  createMimeMessage,
} from "../server/providers.mjs";

test("deployment origin follows Render and allows an explicit custom domain", () => {
  assert.equal(readConfig({}).appUrl, "http://127.0.0.1:4180");
  assert.equal(
    readConfig({ RENDER_EXTERNAL_URL: "https://orbit-test.onrender.com/" })
      .appUrl,
    "https://orbit-test.onrender.com",
  );
  assert.equal(
    readConfig({
      APP_URL: "https://orbit.example/",
      RENDER_EXTERNAL_URL: "https://orbit-test.onrender.com",
    }).appUrl,
    "https://orbit.example",
  );
});

const fixture = {
  channelId: "UCabcdefghijklmnopqrstuv",
  name: "Test creator",
  handle: "@test",
  image: "https://yt3.ggpht.com/avatar.jpg",
  description: "A channel about testing",
  subscribers: 50000,
  averageViews: 10000,
  engagement: 4,
  fetchedAt: new Date().toISOString(),
  videos: [
    {
      id: "abcdefghijk",
      title: "A test video",
      description: "Review",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      duration: 600,
      views: 10000,
      likes: 400,
      comments: 10,
      thumbnail: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
    },
  ],
};
const analysis = {
  summary: "Campaign aligned",
  visual: "Desk setup",
  audio: "Detailed explanation",
  format: "Mid-roll",
  scores: { content: 90, visual: 85, message: 88, safety: 92 },
  score: 89,
  topics: ["Technology"],
  risks: [],
  audienceCaveat: "Audience data unavailable",
  evidence: [
    {
      videoId: "abcdefghijk",
      seconds: 62,
      observation: "Product demonstration",
      modality: "both",
    },
  ],
  videoIds: ["abcdefghijk"],
  model: "test-model",
  analyzedAt: new Date().toISOString(),
};
const brief = {
  title: "Partnership",
  objective: "Awareness",
  scene: "Desk setup",
  opening: "A helpful opening",
  tone: "Informative",
  deliverables: ["One video"],
  messages: ["Approved message"],
  guardrails: ["No unsupported claims"],
  disclosure: "Paid promotion",
  timeline: "To be confirmed",
  rights: "To be confirmed",
  evidence: "01:02 demonstration",
};

test("production workflow persists state and isolates accounts", async () => {
  const directory = mkdtempSync(join(tmpdir(), "orbit-api-"));
  const config = {
    database: join(directory, "test.sqlite"),
    appUrl: "http://localhost",
    youtubeKey: "test",
    geminiKey: "test",
    encryptionKey: "ab".repeat(32),
    googleClientId: "client",
    googleClientSecret: "secret",
  };
  let sends = 0,
    sentAttachments = [];
  const providers = {
    discover: async () => [
      fixture,
      {
        ...fixture,
        channelId: "UCabcdefghijklmnopqrstu2",
        name: "Second creator",
      },
    ],
    importChannel: async () => fixture,
    analyze: async () => analysis,
    generateBrief: async () => brief,
    draftEmail: async () => ({
      subject: "Partnership proposal",
      body: "A personalized message",
    }),
    sendMail: async (tokens, recipient, subject, body, attachments) => {
      sends++;
      sentAttachments = attachments;
      return { data: { id: "gmail-id", threadId: "gmail-thread" }, tokens };
    },
    gmail: async (tokens) => ({
      data: {
        messages: [
          {
            id: "gmail-id",
            internalDate: String(Date.now() - 10000),
            labelIds: ["SENT"],
          },
          {
            id: "reply",
            internalDate: String(Date.now() + 1000),
            labelIds: ["INBOX"],
            snippet: "Interested",
          },
        ],
      },
      tokens,
    }),
  };
  let app = createApp(config, providers);
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  let base = `http://127.0.0.1:${app.server.address().port}`,
    cookie = "";
  const call = async (
    path,
    method = "GET",
    data,
    customCookie = cookie,
    headers = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        cookie: customCookie,
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const json = await response.json();
    return {
      status: response.status,
      json,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    assert.equal((await call("/api/me")).status, 401);
    const registered = await call("/api/auth/register", "POST", {
      name: "Owner",
      email: "owner@example.com",
      password: "a long secure test password",
    });
    assert.equal(registered.status, 201);
    cookie = registered.cookie;
    const me = (await call("/api/me")).json;
    const created = await call("/api/campaigns", "POST", {
      workspaceId: me.workspaces[0].id,
      name: "Test campaign",
      brand: "Test brand",
      goal: "Awareness",
      audience: "Developers",
      category: "Technology",
      budgetMin: 1000,
      budgetMax: 2000,
    });
    assert.equal(created.status, 201, JSON.stringify(created.json));
    const campaignId = created.json.campaignId;
    assert.equal(
      (
        await call("/api/campaigns", "POST", {
          workspaceId: me.workspaces[0].id,
          name: "x",
          brand: "x",
          goal: "x",
          audience: "x",
          budgetMin: 100,
          budgetMax: 1,
        })
      ).status,
      400,
    );
    const crossOrigin = await call("/api/campaigns", "POST", {}, cookie, {
      Origin: "https://evil.example",
    });
    assert.equal(crossOrigin.status, 403);
    const outsider = await call("/api/auth/register", "POST", {
      name: "Other",
      email: "other@example.com",
      password: "another long secure test password",
    });
    assert.equal(
      (
        await call(
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
        await call(
          "/api/campaigns",
          "POST",
          {
            workspaceId: me.workspaces[0].id,
            name: "x",
            brand: "x",
            goal: "x",
            audience: "x",
          },
          outsider.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await call(`/api/campaigns/${campaignId}/discover`, "POST", {})).status,
      202,
    );
    let snapshot;
    for (let attempt = 0; attempt < 100; attempt++) {
      snapshot = (await call(`/api/campaigns/${campaignId}`)).json;
      if (["completed", "partial", "failed"].includes(snapshot.job?.status))
        break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(snapshot.job.status, "completed");
    assert.equal(snapshot.creators.length, 2);
    const creatorId = snapshot.creators[0].id;
    assert.equal(
      (
        await call(
          `/api/creators/${creatorId}/decision`,
          "POST",
          { decision: "selected" },
          outsider.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(`/api/creators/${creatorId}/decision`, "POST", {
          decision: "selected",
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(`/api/campaigns/${campaignId}/undo`, "POST", {})).status,
      200,
    );
    snapshot = (await call(`/api/campaigns/${campaignId}`)).json;
    assert.equal(snapshot.creators[0].decision, "pending");
    await call(`/api/creators/${creatorId}/decision`, "POST", {
      decision: "selected",
    });
    await call(`/api/creators/${creatorId}`, "PATCH", {
      email: "creator@example.com",
      note: "A real internal note",
    });
    const generated = await call(
      `/api/creators/${creatorId}/brief`,
      "POST",
      {},
    );
    assert.equal(generated.status, 201);
    const briefId = generated.json.briefId;
    assert.equal(
      (await call(`/api/briefs/${briefId}/approve`, "POST", {})).status,
      400,
    );
    assert.equal(
      (await call(`/api/briefs/${briefId}/approve`, "POST", { approve: true }))
        .status,
      200,
    );
    const pdfResponse = await fetch(`${base}/api/briefs/${briefId}/export`, {
      headers: { cookie },
    });
    assert.equal(pdfResponse.status, 200);
    const parser = new PDFParse({
      data: new Uint8Array(await pdfResponse.arrayBuffer()),
    });
    const pdfText = (await parser.getText()).text;
    await parser.destroy();
    assert.ok(pdfText.includes("Desk setup"));
    assert.ok(
      pdfText.includes(
        snapshot.creators.find((c) => c.id === creatorId).data.name,
      ),
    );
    assert.ok(!pdfText.includes("June 18"));
    const draft = await call(`/api/creators/${creatorId}/draft`, "POST", {});
    assert.equal(draft.status, 201);
    const messageId = draft.json.messageId;
    const attachedFile = await call(
      `/api/campaigns/${campaignId}/files`,
      "POST",
      {
        name: "approved-brief.txt",
        base64: Buffer.from("Approved collaboration details").toString(
          "base64",
        ),
      },
    );
    assert.equal(attachedFile.status, 201);
    const draftEdit = {
      recipient: "creator@example.com",
      subject: "Approved subject",
      body: "Approved body",
      fileIds: [attachedFile.json.fileId],
    };
    assert.equal(
      (await call(`/api/messages/${messageId}`, "PATCH", draftEdit)).status,
      200,
    );
    const otherCampaign = await call("/api/campaigns", "POST", {
      workspaceId: me.workspaces[0].id,
      name: "Other campaign",
      brand: "Other brand",
      goal: "Awareness",
      audience: "Other audience",
    });
    const unrelatedFile = await call(
      `/api/campaigns/${otherCampaign.json.campaignId}/files`,
      "POST",
      {
        name: "private.txt",
        base64: Buffer.from("Unrelated").toString("base64"),
      },
    );
    assert.equal(
      (
        await call(`/api/messages/${messageId}`, "PATCH", {
          ...draftEdit,
          fileIds: [unrelatedFile.json.fileId],
        })
      ).status,
      404,
    );
    assert.equal(
      (await call(`/api/campaigns/${campaignId}`)).json.messages[0]
        .attachments[0].id,
      attachedFile.json.fileId,
    );
    assert.equal(
      (await call(`/api/messages/${messageId}/send`, "POST", {})).status,
      400,
    );
    assert.equal(
      (await call(`/api/messages/${messageId}/send`, "POST", { approve: true }))
        .status,
      409,
    );
    const tokens = {
      refresh_token: "fake-refresh",
      access_token: "fake-access",
      expires_at: Date.now() + 3600000,
    };
    app.store.run(
      "INSERT INTO integrations VALUES (?,?,?,?)",
      me.user.id,
      encrypt(tokens, config.encryptionKey),
      "owner@example.com",
      new Date().toISOString(),
    );
    const results = await Promise.all([
      call(`/api/messages/${messageId}/send`, "POST", { approve: true }),
      call(`/api/messages/${messageId}/send`, "POST", { approve: true }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal(sends, 1);
    assert.equal(sentAttachments.length, 1);
    assert.equal(sentAttachments[0].name, "approved-brief.txt");
    assert.equal(
      Buffer.from(sentAttachments[0].data).toString(),
      "Approved collaboration details",
    );
    assert.equal(
      (await call(`/api/messages/${messageId}/sync`, "POST", {})).json.replies
        .length,
      1,
    );
    const task = await call(`/api/campaigns/${campaignId}/tasks`, "POST", {
      title: "Review draft",
      dueDate: "2026-11-01",
    });
    assert.equal(task.status, 201);
    assert.equal(
      (await call(`/api/tasks/${task.json.taskId}`, "PATCH", { done: true }))
        .status,
      200,
    );
    assert.equal((await call("/server/store.mjs")).status, 404);
    assert.equal((await call("/assets/..%2fserver%2fstore.mjs")).status, 404);
    const upload = await call(`/api/campaigns/${campaignId}/files`, "POST", {
      name: "brief.txt",
      base64: Buffer.from("A real campaign file").toString("base64"),
    });
    assert.equal(upload.status, 201);
    assert.equal(
      (
        await fetch(`${base}/api/files/${upload.json.fileId}`, {
          headers: { cookie: outsider.cookie },
        })
      ).status,
      404,
    );
    const file = await fetch(`${base}/api/files/${upload.json.fileId}`, {
      headers: { cookie },
    });
    assert.equal(await file.text(), "A real campaign file");
    await app.close();
    app = createApp(config, providers);
    await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
    snapshot = (await call(`/api/campaigns/${campaignId}`)).json;
    assert.equal(
      snapshot.creators.find((c) => c.id === creatorId).note,
      "A real internal note",
    );
    assert.equal(snapshot.messages[0].status, "responded");
    assert.equal(
      snapshot.messages[0].attachments[0].name,
      "approved-brief.txt",
    );
    assert.equal(snapshot.briefs[0].status, "approved");
    assert.equal(snapshot.tasks[0].done, 1);
    await call("/api/auth/logout", "POST", {});
    assert.equal((await call("/api/me")).status, 401);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Gmail MIME preserves UTF-8 body and attachment bytes without header injection", () => {
  const raw = createMimeMessage(
    "controlled@example.com",
    "Partnership\r\nInjected: value",
    "Hello — 你好",
    [{ name: 'brief"\r\n.pdf', data: Buffer.from([0, 1, 2, 254, 255]) }],
  );
  const decoded = Buffer.from(raw, "base64url").toString();
  assert.ok(decoded.includes("Content-Type: multipart/mixed;"));
  assert.ok(decoded.includes(Buffer.from("Hello — 你好").toString("base64")));
  assert.ok(
    decoded.includes(Buffer.from([0, 1, 2, 254, 255]).toString("base64")),
  );
  assert.ok(!decoded.includes("\r\nInjected:"));
  assert.ok(!decoded.includes('filename="brief"\r\n'));
  assert.throws(
    () =>
      createMimeMessage(
        "bad@example.com\r\nBcc: victim@example.com",
        "Subject",
        "Body",
      ),
    /Invalid email/,
  );
});

test("document import extracts text and rejects invalid or oversized files", async () => {
  assert.equal(
    await extractDocument(
      "brief.txt",
      Buffer.from("Campaign goal: launch").toString("base64"),
    ),
    "Campaign goal: launch",
  );
  const docx = zipSync({
    "word/document.xml": strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Brand guidelines</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  assert.equal(
    await extractDocument("brief.docx", Buffer.from(docx).toString("base64")),
    "Brand guidelines",
  );
  await assert.rejects(
    extractDocument("brief.pdf", Buffer.from("not a pdf").toString("base64")),
    /could not be read/,
  );
  await assert.rejects(
    extractDocument("brief.txt", "x".repeat(2_100_001)),
    /smaller/,
  );
});

test("missing API keys never produce fabricated discovery output", async () => {
  const providers = makeProviders({});
  await assert.rejects(providers.discover({}), /YouTube is not connected/);
  await assert.rejects(
    providers.analyze({}, fixture),
    /Gemini is not connected/,
  );
});

test("team invitations require a matching email and owners control membership", async () => {
  let invitationText = "";
  const app = createApp(
    {
      database: ":memory:",
      appUrl: "http://localhost",
      resendKey: "fixture",
      emailFrom: "team@example.com",
    },
    {
      sendTransactional: async (to, subject, body) => {
        invitationText = body;
      },
    },
  );
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const request = async (path, method = "GET", body, cookie = "") => {
    const r = await fetch(base + path, {
      method,
      headers: {
        cookie,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    const owner = await request("/api/auth/register", "POST", {
      name: "Owner",
      email: "owner@example.com",
      password: "long invitation test password",
    });
    const teammate = await request("/api/auth/register", "POST", {
      name: "Teammate",
      email: "colleague@example.com",
      password: "long invitation test password",
    });
    const ownerMe = await request("/api/me", "GET", undefined, owner.cookie);
    const workspaceId = ownerMe.data.workspaces[0].id;
    assert.equal(
      (
        await request(
          `/api/workspaces/${workspaceId}/invitations`,
          "POST",
          { email: "colleague@example.com" },
          owner.cookie,
        )
      ).status,
      201,
    );
    const token = /invite=([\w-]+)/.exec(invitationText)[1];
    assert.equal(
      (
        await request(
          "/api/invitations/accept",
          "POST",
          { token },
          owner.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/api/invitations/accept",
          "POST",
          { token },
          teammate.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          `/api/workspaces/${workspaceId}/members`,
          "GET",
          undefined,
          teammate.cookie,
        )
      ).data.members.length,
      2,
    );
    assert.equal(
      (
        await request(
          `/api/workspaces/${workspaceId}/invitations`,
          "POST",
          { email: "stranger@example.com" },
          teammate.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/api/invitations/accept",
          "POST",
          { token },
          teammate.cookie,
        )
      ).status,
      403,
    );
    const shared = await request(
      "/api/campaigns",
      "POST",
      {
        workspaceId,
        name: "Shared launch",
        brand: "Shared brand",
        goal: "Awareness",
        audience: "Developers",
      },
      owner.cookie,
    );
    assert.equal(shared.status, 201);
    assert.equal(
      (
        await request(
          `/api/campaigns/${shared.data.campaignId}`,
          "GET",
          undefined,
          teammate.cookie,
        )
      ).status,
      200,
    );
    const removalPath = `/api/workspaces/${workspaceId}/members`;
    assert.equal(
      (
        await request(
          removalPath,
          "DELETE",
          { userId: ownerMe.data.user.id },
          owner.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          removalPath,
          "DELETE",
          { userId: teammate.data.user.id },
          teammate.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          removalPath,
          "DELETE",
          { userId: teammate.data.user.id },
          owner.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          `/api/campaigns/${shared.data.campaignId}`,
          "GET",
          undefined,
          teammate.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await request(
          `/api/campaigns/${shared.data.campaignId}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).status,
      200,
    );
  } finally {
    await app.close();
  }
});
test("timestamp validation rejects invented video references", async () => {
  const bad = {
    ...analysis,
    evidence: [
      { videoId: "invented", seconds: 999999, observation: "Fake proof" },
    ],
  };
  const providers = makeProviders(
    { geminiKey: "test", geminiModel: "test" },
    async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(bad) }] } }],
        }),
        { status: 200 },
      ),
  );
  await assert.rejects(providers.analyze({}, fixture), /timestamps outside/);
});
test("encrypted tokens round-trip and reject tampering", () => {
  const key = "ab".repeat(32),
    value = encrypt({ refresh_token: "secret" }, key);
  assert.deepEqual(decrypt(value, key), { refresh_token: "secret" });
  assert.throws(() => decrypt(value, "cd".repeat(32)));
  assert.equal(durationSeconds("PT1H2M3S"), 3723);
});

test("late AI results cannot overwrite an edited campaign and stale edits are rejected", async () => {
  let finishAnalysis, markStarted;
  const started = new Promise((resolve) => (markStarted = resolve));
  const app = createApp(
    {
      database: ":memory:",
      appUrl: "http://localhost",
      youtubeKey: "fixture",
      geminiKey: "fixture",
    },
    {
      discover: async () => [fixture],
      analyze: async () => {
        markStarted();
        return new Promise((resolve) => (finishAnalysis = resolve));
      },
    },
  );
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  let cookie = "";
  const call = async (path, method = "GET", data) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        cookie,
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const body = await response.json();
    return {
      status: response.status,
      body,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    const registration = await call("/api/auth/register", "POST", {
      name: "Editor",
      email: "editor@example.com",
      password: "A long concurrent editing password",
    });
    cookie = registration.cookie;
    const me = (await call("/api/me")).body;
    const created = await call("/api/campaigns", "POST", {
      workspaceId: me.workspaces[0].id,
      name: "Original campaign",
      brand: "Original brand",
      goal: "Awareness",
      audience: "Developers",
    });
    const campaignId = created.body.campaignId;
    await call(`/api/campaigns/${campaignId}/discover`, "POST", {});
    await started;
    const before = (await call(`/api/campaigns/${campaignId}`)).body;
    const edited = await call(`/api/campaigns/${campaignId}`, "PATCH", {
      ...before.campaign.brief,
      brand: "Updated brand",
      revision: before.campaign.revision,
    });
    assert.equal(edited.status, 200);
    assert.equal(
      (
        await call(`/api/campaigns/${campaignId}`, "PATCH", {
          ...before.campaign.brief,
          revision: before.campaign.revision,
        })
      ).status,
      409,
    );
    finishAnalysis(analysis);
    for (let i = 0; app.activeJobs.size && i < 100; i++)
      await new Promise((resolve) => setTimeout(resolve, 5));
    const after = (await call(`/api/campaigns/${campaignId}`)).body;
    assert.equal(after.campaign.brief.brand, "Updated brand");
    assert.equal(after.creators[0].analysis, null);
    assert.equal(after.job.status, "partial");
    assert.match(after.job.failures, /requirements changed/);
    const c = after.creators[0];
    assert.equal(
      (
        await call(`/api/creators/${c.id}`, "PATCH", {
          note: "A teammate’s latest note",
          revision: c.revision,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call(`/api/creators/${c.id}`, "PATCH", {
          note: "A stale note",
          revision: c.revision,
        })
      ).status,
      409,
    );
    assert.equal(
      (await call(`/api/campaigns/${campaignId}`)).body.creators[0].note,
      "A teammate’s latest note",
    );
  } finally {
    finishAnalysis?.(analysis);
    for (let i = 0; app.activeJobs.size && i < 100; i++)
      await new Promise((resolve) => setTimeout(resolve, 5));
    await app.close();
  }
});
