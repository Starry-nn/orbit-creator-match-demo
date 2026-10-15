import { createGuide } from "./guide.js";
const el = document.querySelector("#product"),
  dialog = document.querySelector("#detail");
const state = {
  me: null,
  campaigns: [],
  campaignId: null,
  data: null,
  view: "home",
  compare: new Set(),
  current: null,
  busy: false,
  poll: null,
  formDraft: {},
  authMode: "login",
};
const guide = createGuide({
  getState: () => state,
  navigate,
  toast,
  closeDialog,
});
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const fmt = (value) =>
  value === null || value === undefined
    ? "Not public"
    : Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Not set";
const logo = '<img src="../assets/brands/orbit.svg" alt="">';
const gemini =
  '<span class="badge"><img src="../assets/brands/gemini.svg" alt="">Gemini video analysis</span>';
const youtube =
  '<span class="badge"><img src="../assets/brands/youtube.svg" alt="">YouTube public data</span>';
const selected = () =>
  state.data?.creators.filter((c) => c.decision === "selected") || [];
const queue = () =>
  state.data?.creators
    .filter((c) => ["pending", "deferred"].includes(c.decision))
    .sort((a, b) => {
      if (a.decision !== b.decision) return a.decision === "deferred" ? 1 : -1;
      if (a.decision === "deferred")
        return String(a.deferred_at).localeCompare(String(b.deferred_at));
      return (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1);
    }) || [];
const creatorById = (id) => state.data?.creators.find((c) => c.id === id);
const status = (value) =>
  `<span class="status ${["sent", "approved", "unknown"].includes(value) ? value : ""}">${escape(value)}</span>`;
const field = (label, name, value = "", type = "text", extra = "") =>
  `<label class="label">${escape(label)}<input name="${escape(name)}" type="${type}" value="${escape(value)}" ${extra}></label>`;
const area = (label, name, value = "", extra = "") =>
  `<label class="label ${extra}">${escape(label)}<textarea name="${escape(name)}">${escape(value)}</textarea></label>`;
const choice = (label, name, values, value = "") =>
  `<label class="label">${escape(label)}<select name="${escape(name)}">${values.map(([v, l]) => `<option value="${escape(v)}" ${v === value ? "selected" : ""}>${escape(l)}</option>`).join("")}</select></label>`;
function toast(message) {
  const n = document.querySelector("#notice");
  n.textContent = message;
  n.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => n.classList.remove("visible"), 5000);
}
async function api(path, method = "GET", payload) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: payload ? { "Content-Type": "application/json" } : {},
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && state.me) {
      state.me = null;
      renderAuth();
    }
    throw new Error(data.error || "Request failed");
  }
  return data;
}
async function perform(button, fn) {
  if (button.disabled) return;
  button.disabled = true;
  const label = button.textContent;
  const compact = button.classList.contains("circle");
  button.setAttribute("aria-busy", "true");
  if (!compact) button.textContent = "Working…";
  try {
    await fn();
  } catch (error) {
    toast(error.message);
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (!compact) button.textContent = label;
    }
  }
}
function closeDialog() {
  dialog.close();
  dialog.innerHTML = "";
  guide.update();
}
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeDialog();
  }
});
function modal(title, body) {
  dialog.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">${escape(title)}</h2><button class="circle" data-close aria-label="Close">×</button></header><div class="dialog-body">${body}</div>`;
  dialog.querySelector("[data-close]").onclick = closeDialog;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  bindDialog();
  guide.update();
}
function empty(title, copy, action = "") {
  return `<section class="empty">${logo}<h2>${title}</h2><p>${copy}</p><div class="actions">${action}</div></section>`;
}
function renderAuth(mode = state.authMode) {
  guide.update();
  state.authMode = mode;
  const reset = new URLSearchParams(location.search).get("reset");
  if (reset) mode = "reset";
  const titles = {
    login: "Welcome back",
    register: "Your next creator partnership starts here",
    recover: "Reset your password",
    reset: "Choose a new password",
  };
  el.innerHTML = `<main class="auth"><section class="auth-story"><div class="brand">${logo}Orbit</div><h1>Good partnerships<br>start with a good fit</h1><p>From a campaign brief to the creators, conversations and content that move it forward.</p><img class="orbit-sigil" src="../assets/brands/orbit.svg" alt=""><a href="../" class="muted">Explore the sample demo ↗</a></section><section class="auth-form"><form id="authForm" class="stack"><span class="eyebrow">Creator workspace</span><h1>${titles[mode]}</h1><div class="error hidden" id="authError" role="alert"></div>${mode === "register" ? field("Your name", "name", "", "text", 'required autocomplete="name"') : ""}${mode !== "reset" ? field("Work email", "email", "", "email", 'required autocomplete="email"') : ""}${!["recover"].includes(mode) ? field("Password", "password", "", "password", `required minlength="12" maxlength="256" autocomplete="${mode === "login" ? "current-password" : "new-password"}"`) : ""}<button class="btn primary" type="submit">${{ login: "Sign in", register: "Create workspace", recover: "Send reset link", reset: "Update password" }[mode]}</button><div class="actions spread">${mode === "login" ? '<button type="button" class="text-btn" data-auth="register">Create an account</button><button type="button" class="text-btn" data-auth="recover">Forgot password?</button>' : '<button type="button" class="text-btn" data-auth="login">Back to sign in</button>'}</div>${mode === "register" ? "<small>Use at least 12 characters. Your campaigns are private to your workspace.</small>" : ""}</form></section></main>`;
  el.querySelectorAll("[data-auth]").forEach(
    (b) => (b.onclick = () => renderAuth(b.dataset.auth)),
  );
  document.querySelector("#authForm").onsubmit = async (event) => {
    event.preventDefault();
    const button = event.submitter;
    const input = Object.fromEntries(new FormData(event.target));
    button.disabled = true;
    const error = document.querySelector("#authError");
    error.classList.add("hidden");
    try {
      if (mode === "recover") {
        const r = await api("/auth/recover", "POST", input);
        toast(r.message);
      } else if (mode === "reset") {
        await api("/auth/reset", "POST", { ...input, token: reset });
        history.replaceState(null, "", "/product/");
        renderAuth("login");
        toast("Password updated");
      } else {
        await api(`/auth/${mode}`, "POST", input);
        await load();
      }
    } catch (e) {
      error.textContent = e.message;
      error.classList.remove("hidden");
    } finally {
      button.disabled = false;
    }
  };
}
async function load() {
  const invitation = new URLSearchParams(location.search).get("invite");
  if (invitation) {
    await api("/me");
    await api("/invitations/accept", "POST", { token: invitation });
    history.replaceState(null, "", "/product/");
    toast("You joined the team workspace");
  }
  const [me, list] = await Promise.all([api("/me"), api("/campaigns")]);
  state.me = me;
  state.campaigns = list.campaigns;
  if (!state.campaignId) {
    const last = localStorage.getItem(`orbit-campaign:${me.user.id}`);
    if (state.campaigns.some((c) => c.id === last)) state.campaignId = last;
  }
  if (!state.campaignId && state.campaigns.length)
    state.campaignId = state.campaigns[0].id;
  if (state.campaignId)
    state.data = await api(`/campaigns/${state.campaignId}`);
  state.view = location.hash.slice(1) || "home";
  render();
  schedulePoll();
}
async function refresh() {
  if (state.campaignId)
    state.data = await api(`/campaigns/${state.campaignId}`);
  if (
    state.view !== "create" &&
    !document.activeElement?.matches("input,textarea,select")
  )
    render();
  schedulePoll();
}
function navigate(view) {
  if (dialog.open) closeDialog();
  state.view = view;
  location.hash = view;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
window.addEventListener("hashchange", () => {
  if (state.me && state.view !== location.hash.slice(1)) {
    state.view = location.hash.slice(1) || "home";
    render();
  }
});
function shell(body) {
  const nav = [
    ["home", "⌂", "Home"],
    ["discover", "✦", "Discover"],
    [
      "selected",
      "▣",
      `Selected${selected().length ? ` · ${selected().length}` : ""}`,
    ],
    ["inbox", '<img src="../assets/brands/gmail.svg" alt="">', "Inbox"],
    ["workspace", "⌁", "Campaign"],
    ["settings", "⚙", "Settings"],
  ];
  return `<div class="shell"><aside class="sidebar"><div class="brand">${logo}Orbit</div><nav class="nav" aria-label="Primary navigation">${nav.map(([view, icon, title]) => `<a href="#${view}" class="${state.view === view ? "active" : ""}" ${state.view === view ? 'aria-current="page"' : ""}><i aria-hidden="true">${icon}</i><span>${title}</span></a>`).join("")}</nav><div class="account"><strong>${escape(state.me.user.name)}</strong><small>${escape(state.me.user.email)}</small><button class="text-btn" id="logout">Sign out</button></div></aside><main class="main"><header class="topbar"><a class="mobile-brand" href="#home">${logo}Orbit</a><select id="campaignSwitcher" aria-label="Active campaign"><option value="">Choose a campaign</option>${state.campaigns.map((c) => `<option value="${c.id}" ${c.id === state.campaignId ? "selected" : ""}>${escape(c.name)}</option>`).join("")}</select><span class="status-line">Private workspace · ${escape(state.me.workspaces[0]?.name || "")}</span><a href="#settings" aria-label="Settings">Settings</a></header>${body}</main></div>`;
}
function heading(eyebrow, title, copy = "") {
  return `<header class="heading"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${copy ? `<p>${copy}</p>` : ""}</header>`;
}
function home() {
  return `${heading("Your workspace", `Hello, ${escape(state.me.user.name.split(" ")[0])}`, "Create a brief, review the evidence, and build your next creator partnership.")}<div class="actions spread"><h2>Campaigns</h2><button class="btn primary" data-view="create">＋ New campaign</button></div>${state.campaigns.length ? `<div class="campaign-list">${state.campaigns.map((c) => `<button class="campaign-card" data-campaign="${c.id}"><span class="eyebrow">${escape(c.brief.brand)}</span><strong>${escape(c.name)}</strong><small>${escape(c.brief.goal)} · ${escape(c.brief.format || "Format to be confirmed")}</small><small>Updated ${date(c.updated_at)} →</small></button>`).join("")}</div>` : empty("Start with your first campaign", "Add your goals, target audience, budget and YouTube format. Orbit keeps the brief and creator decisions together.", '<button class="btn primary" data-view="create">Create a campaign</button>')}`;
}
function campaignForm() {
  const b = state.formDraft;
  return `${heading("Campaign setup", "What are you looking for?", "A focused brief gives Gemini a clear basis for evaluating creators.")}<form id="campaignForm" class="panel stack"><div class="error hidden" id="formError" role="alert"></div><div class="grid">${field("Campaign name", "name", b.name, "text", 'required maxlength="200"')}${field("Brand / product", "brand", b.brand, "text", 'required maxlength="300"')}${choice(
    "Campaign goal",
    "goal",
    [
      ["Awareness", "Awareness"],
      ["Consideration", "Consideration"],
      ["Conversion", "Conversion"],
      ["Product launch", "Product launch"],
      ["Community engagement", "Community engagement"],
    ],
    b.goal,
  )}${field("Category", "category", b.category, "text", 'placeholder="e.g. Technology, beauty, travel"')}${area("Target audience", "audience", b.audience, "full")}${field("Minimum budget (USD)", "budgetMin", b.budgetMin || "", "number", 'min="0" step="1"')}${field("Maximum budget (USD)", "budgetMax", b.budgetMax || "", "number", 'min="0" step="1"')}${choice(
    "YouTube format",
    "format",
    [
      ["Long-form integration", "Long-form integration"],
      ["Dedicated video", "Dedicated video"],
      ["Shorts", "Shorts"],
      ["Livestream", "Livestream"],
      ["Mixed", "Mixed formats"],
    ],
    b.format,
  )}${choice(
    "Placement",
    "placement",
    [
      ["Mid-roll", "Mid-roll"],
      ["Pre-roll", "Pre-roll"],
      ["Dedicated story", "Dedicated story"],
      ["Shorts hook", "Shorts hook"],
      ["Flexible", "Flexible"],
    ],
    b.placement,
  )}${choice(
    "Target market",
    "country",
    [
      ["", "Any market"],
      ["US", "United States"],
      ["GB", "United Kingdom"],
      ["CA", "Canada"],
      ["AU", "Australia"],
      ["IN", "India"],
      ["DE", "Germany"],
      ["JP", "Japan"],
      ["BR", "Brazil"],
    ],
    b.country,
  )}${choice(
    "Content language",
    "language",
    [
      ["en", "English"],
      ["es", "Spanish"],
      ["fr", "French"],
      ["de", "German"],
      ["pt", "Portuguese"],
      ["ja", "Japanese"],
      ["ko", "Korean"],
      ["zh", "Chinese"],
    ],
    b.language,
  )}${field("Minimum subscribers", "minSubscribers", b.minSubscribers || "", "number", 'min="0"')}${field("Maximum subscribers", "maxSubscribers", b.maxSubscribers || "", "number", 'min="0"')}${field("Minimum recent average views", "minViews", b.minViews || "", "number", 'min="0"')}${field("Desired publish date", "deadline", b.deadline, "date")}${area("Search keywords", "keywords", b.keywords)}${area("Excluded topics / competing brands", "exclusions", b.exclusions)}${area("Brand guidelines and approved claims", "guidelines", b.guidelines, "full")}${area("Deliverables", "deliverables", b.deliverables)}${area("Usage rights / exclusivity", "rights", b.rights)}${area("Campaign brief", "description", b.description, "full")}</div><label class="label">Import an existing brief (TXT, PDF or DOCX)<input type="file" id="briefUpload" accept=".txt,.pdf,.docx"></label><small id="uploadHint">You can also paste the brief above. Review imported text before saving.</small><div class="actions"><button type="submit" class="btn primary">Save campaign →</button><button type="button" class="btn" data-view="home">Cancel</button></div></form>`;
}
function jobPanel() {
  const job = state.data?.job;
  if (!job) return "";
  const failures = JSON.parse(job.failures || "[]");
  return `<section class="progress" aria-live="polite"><strong>${{ queued: "Starting discovery", running: "Reviewing creator videos", completed: "Analysis complete", partial: "Some creators need another look", failed: "Discovery could not finish", interrupted: "Discovery was interrupted" }[job.status] || escape(job.status)}</strong><small>${job.completed} of ${job.total} creators processed</small>${["running", "queued"].includes(job.status) ? `<progress max="${job.total || 1}" value="${job.completed}"></progress>` : ""}${failures.map((f) => `<small>${escape(f.name || "")} ${escape(f.message)}</small>`).join("")}${["partial", "failed", "interrupted"].includes(job.status) ? '<button class="btn" id="retryAnalysis">Retry incomplete analysis</button>' : ""}</section>`;
}
function metrics(c) {
  return `<div class="metrics"><div><strong>${fmt(c.data.subscribers)}</strong><small>Subscribers</small></div><div><strong>${fmt(c.data.averageViews)}</strong><small>Recent avg views</small></div><div><strong>${c.data.engagement == null ? "Unknown" : `${c.data.engagement.toFixed(1)}%`}</strong><small>(Likes + comments) / views</small></div></div>`;
}
function analysis(c) {
  const a = c.analysis;
  if (!a)
    return `<h2>Analysis pending</h2><p class="muted">Run Gemini analysis to review this creator’s recent public videos.</p><button class="btn primary" id="retryAnalysis">Analyze imported creators</button>`;
  return `<div class="badges">${gemini}${youtube}</div><div class="fit"><div><span>Campaign fit</span><br><strong>${a.score}<small>/100</small></strong></div><span>AI estimate<br>Human review required</span></div><p>${escape(a.summary)}</p><section class="signal"><h3>Vision</h3><p>${escape(a.visual)}</p></section><section class="signal"><h3>Audio / speech</h3><p>${escape(a.audio)}</p></section><section class="signal"><h3>Recommended format</h3><p>${escape(a.format)}</p></section><section class="signal"><h3>Video evidence</h3><div class="evidence">${a.evidence
    .map((e) => {
      const video = c.data.videos.find((v) => v.id === e.videoId);
      return `<a href="https://www.youtube.com/watch?v=${encodeURIComponent(e.videoId)}&t=${e.seconds}" target="_blank" rel="noopener noreferrer">${video?.thumbnail ? `<img src="${escape(video.thumbnail)}" alt="" loading="lazy">` : ""}<div><b>${Math.floor(e.seconds / 60)}:${String(e.seconds % 60).padStart(2, "0")} · ${escape(e.modality || "Video")}</b><small>${escape(e.observation)}</small></div></a>`;
    })
    .join(
      "",
    )}</div></section><section class="signal"><h3>Review before outreach</h3><p>${a.risks.map(escape).join(" · ") || "No specific risks identified in this limited sample"}</p></section><p class="notes">${escape(a.audienceCaveat || "Audience demographics and creator rates are not public. Confirm them directly.")}<br>${a.videoIds.length} videos analyzed · ${escape(a.model)} · ${date(a.analyzedAt)}</p><button class="btn primary" data-brief="${c.id}">⚡ ${state.data.briefs.some((b) => b.creator_id === c.id) ? "Open" : "Generate"} AI Brief</button>`;
}
function discover() {
  if (!state.data)
    return empty(
      "Choose a campaign first",
      "Create a campaign to start finding relevant creators.",
      '<button class="btn primary" data-view="create">Create campaign</button>',
    );
  const candidates = queue();
  let c = creatorById(state.current);
  if (!c || !candidates.some((x) => x.id === c.id)) c = candidates[0];
  state.current = c?.id;
  return `${heading("Creator discovery", "Find your next partnership")}<div class="actions spread"><form id="importForm" class="actions"><input name="channel" aria-label="YouTube channel URL or handle" placeholder="@handle or YouTube channel URL" required><button class="btn" type="submit">Import channel</button></form><button class="btn primary" id="discover">Find creators ✦</button></div><p class="notes">YouTube channel location is not audience location. Review campaign fit with direct creator insights.</p>${jobPanel()}${c ? `<div class="discover" id="swipeSurface"><article class="profile"><div class="portrait"><img src="${escape(c.data.image)}" alt="${escape(c.data.name)}"></div><div class="identity"><h1>${escape(c.data.name)}</h1><p>${escape(c.data.handle)} · ${candidates.length} remaining</p></div><div class="decision-controls"><button class="circle" id="undo" aria-label="Undo last decision" title="Undo last decision">↶</button><button class="btn pass" data-decision="passed">× Pass</button><button class="btn primary" data-decision="selected">＋ Select</button><button class="circle" data-decision="deferred" aria-label="Save for later" title="Save for later">◷</button></div><p class="save-caption">Swipe left to pass · Swipe right to select</p>${metrics(c)}<div class="identity"><p>${escape(c.data.description.slice(0, 450))}</p><a href="https://www.youtube.com/channel/${encodeURIComponent(c.channel_id)}" target="_blank" rel="noopener">Open YouTube channel ↗</a><p class="notes">Public data fetched ${date(c.data.fetchedAt)} · ${c.data.videos.length} recent uploads</p></div></article><aside class="panel">${analysis(c)}</aside></div>` : empty(state.data.creators.length ? "You’ve reviewed every creator" : "Your discovery queue is empty", state.data.creators.length ? "Passed and selected creators stay out of the queue. Find more creators or undo your last decision." : "Find creators from your brief, or import a YouTube channel you already have in mind.", `<button class="btn" id="undo">Undo last decision</button><button class="btn primary" data-view="selected">Open selected</button>`)}`;
}
function selectedView() {
  const list = selected();
  return `${heading("Selected creators", "Build the client slate", "Choose two or more creators to compare. Open a photo or name for details.")}<div class="actions spread"><small>${list.length} creators selected</small>${list.length ? `<a class="btn" href="/api/campaigns/${state.campaignId}/export">Export CSV</a>` : ""}</div>${list.length ? `<div class="creator-grid">${list.map((c) => `<article class="creator-row"><input type="checkbox" aria-label="Compare ${escape(c.data.name)}" data-compare="${c.id}" ${state.compare.has(c.id) ? "checked" : ""}><button class="creator-open" data-detail="${c.id}"><img src="${escape(c.data.image)}" alt=""><div><strong>${escape(c.data.name)}</strong><small>${fmt(c.data.subscribers)} subscribers · ${escape(c.stage)}</small></div></button><span class="score">${c.analysis?.score ?? "—"}</span></article>`).join("")}</div><div class="compare-dock"><strong id="compareCount">${state.compare.size} selected to compare</strong><button class="btn" id="compare" ${state.compare.size < 2 ? "disabled" : ""}>Compare →</button></div>` : empty("Your client slate starts here", "Select creators in Discover. Saved-for-later creators stay in the discovery queue.", '<button class="btn primary" data-view="discover">Open Discover</button>')}`;
}
function compareView() {
  const picks = [...state.compare].map(creatorById).filter(Boolean);
  if (picks.length < 2) return selectedView();
  const rows = [
    ["Subscribers", (c) => fmt(c.data.subscribers)],
    ["Recent avg views", (c) => fmt(c.data.averageViews)],
    ["AI fit estimate", (c) => c.analysis?.score ?? "Not analyzed"],
    ["Best format", (c) => c.analysis?.format || "Not analyzed"],
    ["Visual evidence", (c) => c.analysis?.visual || "Not analyzed"],
    ["Audio / message fit", (c) => c.analysis?.audio || "Not analyzed"],
    ["Risks to review", (c) => c.analysis?.risks.join(" · ") || "Not analyzed"],
    ["Internal note", (c) => c.note || "No notes"],
    ["Stage", (c) => c.stage],
  ];
  return `${heading("Creator comparison", "Review your finalists")}<div class="compare-wrap"><table><thead><tr><th scope="col">Criteria</th>${picks.map((c) => `<th scope="col"><img src="${escape(c.data.image)}" alt="">${escape(c.data.name)}</th>`).join("")}</tr></thead><tbody>${rows.map(([label, fn]) => `<tr><th scope="row">${label}</th>${picks.map((c) => `<td>${escape(fn(c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="actions"><button class="btn" data-view="selected">Edit selection</button><button class="btn primary" id="batchDrafts">Prepare outreach for ${picks.length} creators</button></div>`;
}
function inbox() {
  const messages = state.data?.messages || [];
  return `${heading("Creator inbox", "Review before you send", "Personalized drafts stay here until you approve each email.")}<div class="badges"><span class="badge">${messages.filter((m) => m.status === "draft").length} drafts</span><span class="badge green">${messages.filter((m) => ["sent", "responded"].includes(m.status)).length} sent</span></div>${
    messages.length
      ? `<div class="stack">${messages
          .map((m) => {
            const c = creatorById(m.creator_id);
            return `<button class="message-row" data-message="${m.id}"><img src="${escape(c.data.image)}" alt=""><div><strong>${escape(c.data.name)}</strong><small>${escape(m.subject)}</small></div>${status(m.status)}</button>`;
          })
          .join("")}</div>`
      : empty(
          "No outreach drafts yet",
          "Open a selected creator and generate a personalized email. Add a verified business contact before sending.",
          '<button class="btn primary" data-view="selected">Open selected</button>',
        )
  }`;
}
function workspaceView() {
  if (!state.data)
    return empty(
      "No campaign yet",
      "Create a brief to start managing your creator partnerships.",
      '<button class="btn primary" data-view="create">Create campaign</button>',
    );
  const { tasks, activities, briefs } = state.data;
  return `${heading("Campaign workspace", escape(state.data.campaign.name), "Keep creator decisions, approvals and next steps in one place.")}<div class="badges"><span class="badge">${selected().length} selected</span><span class="badge">${briefs.filter((b) => b.status === "approved").length} approved briefs</span><span class="badge green">${tasks.filter((t) => t.done).length} of ${tasks.length} tasks complete</span></div><div class="workspace-grid"><div class="stack"><section class="panel"><h2>Next actions</h2><form id="taskForm" class="stack"><div class="grid">${field("Task", "title", "", "text", 'required maxlength="300"')}${field("Due date", "dueDate", "", "date")}</div><button class="btn" type="submit">Add task</button></form>${tasks.map((t) => `<label class="task"><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""}><div><strong>${escape(t.title)}</strong><small>${t.due_date ? `Due ${escape(t.due_date)}` : "No deadline"}</small></div></label>`).join("")}</section><section class="panel"><h2>Creator pipeline</h2>${
    selected()
      .map(
        (c) =>
          `<div class="task"><button class="creator-open" data-detail="${c.id}"><img src="${escape(c.data.image)}" alt=""><strong>${escape(c.data.name)}</strong></button>${status(c.stage)}</div>`,
      )
      .join("") || '<p class="muted">Selected creators will appear here.</p>'
  }</section></div><div class="stack"><section class="panel"><h2>Creator briefs</h2>${briefs.map((b) => `<div class="task"><button class="text-btn" data-brief="${b.creator_id}">${escape(creatorById(b.creator_id).data.name)}</button>${status(b.status)}</div>`).join("") || '<p class="muted">Generate a brief from a creator’s video evidence.</p>'}</section><section class="panel"><h2>Recent activity</h2>${activities.map((a) => `<div class="activity">${escape(a.description)}<small>${escape(a.name)} · ${date(a.created_at)}</small></div>`).join("") || '<p class="muted">Your campaign activity will appear here.</p>'}</section></div></div>`;
}
function settings() {
  const i = state.me.integrations;
  const row = (name, description, control) =>
    `<div class="integration"><div><strong>${name}</strong><small>${description}</small></div>${control}</div>`;
  return `${heading("Workspace settings", "Your connected tools")}<section class="panel">${row("YouTube Data API", i.youtube ? "Key configured · public channel and video data" : "Server API key required", status(i.youtube ? "configured" : "not configured"))}${row("Gemini", i.gemini ? "Key configured · model access is checked during analysis" : "Server API key required", status(i.gemini ? "configured" : "not configured"))}${row("Gmail", i.gmail ? escape(i.gmail.email) : "Connect your own account to send approved outreach and check replies", i.gmail ? '<button class="btn" id="disconnectGmail">Disconnect</button>' : i.gmailAvailable ? '<a class="btn primary" href="/api/google/connect">Connect Gmail</a>' : "<small>Google OAuth configuration required</small>")}${row("Account recovery", i.recovery ? "Email provider configured" : "Transactional email provider has not been configured", status(i.recovery ? "configured" : "not configured"))}${row(escape(state.me.user.name), escape(state.me.user.email), '<button class="btn" id="logout">Sign out</button>')}</section>`;
}
function render() {
  if (!state.me) return renderAuth();
  if (state.campaignId)
    localStorage.setItem(
      `orbit-campaign:${state.me.user.id}`,
      state.campaignId,
    );
  const views = {
    home,
    create: campaignForm,
    discover,
    selected: selectedView,
    compare: compareView,
    inbox,
    workspace: () => workspaceView() + filesSection(),
    settings: () => settings() + teamSettings(),
  };
  el.innerHTML = shell((views[state.view] || home)());
  bind();
  bindExtras();
  guide.update();
}
function filesSection() {
  if (!state.data) return "";
  return `<section class="panel"><div class="actions spread"><h2>Campaign files</h2><button class="btn" id="editCampaign">Edit campaign brief</button></div><form id="fileForm" class="inline-form"><label class="label">Upload brief or deliverable<input type="file" name="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" required></label><button class="btn" type="submit">Upload file</button></form><small>Up to 1.5 MB per file · 30 MB per campaign</small>${(state.data.files || []).map((file) => `<div class="task"><a href="/api/files/${file.id}">${escape(file.name)}</a><small>${date(file.created_at)}</small></div>`).join("")}</section>`;
}
function teamSettings() {
  const ws =
    state.me.workspaces.find(
      (w) => w.id === state.data?.campaign.workspace_id,
    ) || state.me.workspaces[0];
  return `<section class="panel"><h2>Your team</h2><p class="notes">Invite teammates to share campaigns, notes and approvals. Each teammate connects their own Gmail account.</p><form id="inviteForm" data-workspace="${ws.id}" class="inline-form">${field("Teammate email", "email", "", "email", "required")}<button class="btn primary" type="submit" ${ws.role === "owner" ? "" : "disabled"}>Send invitation</button></form><div id="members"></div></section>`;
}
async function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}
function bindExtras() {
  const edit = document.querySelector("#editCampaign");
  if (edit)
    edit.onclick = () => {
      state.editing = true;
      state.formDraft = {
        ...state.data.campaign.brief,
        revision: state.data.campaign.revision,
      };
      navigate("create");
    };
  const upload = document.querySelector("#fileForm");
  if (upload)
    upload.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        const file = upload.elements.file.files[0];
        if (file.size > 1_500_000)
          throw new Error("Use a file smaller than 1.5 MB");
        await api(`/campaigns/${state.campaignId}/files`, "POST", {
          name: file.name,
          base64: await fileBase64(file),
        });
        await refresh();
        toast("File saved");
      });
    };
  const invite = document.querySelector("#inviteForm");
  if (invite) {
    const replay = document.createElement("button");
    replay.className = "btn";
    replay.type = "button";
    replay.textContent = "Replay guided setup";
    replay.onclick = () => guide.start();
    invite.closest(".panel").after(replay);
    invite.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        const result = await api(
          `/workspaces/${invite.dataset.workspace}/invitations`,
          "POST",
          Object.fromEntries(new FormData(invite)),
        );
        toast(result.message);
      });
    };
    api(`/workspaces/${invite.dataset.workspace}/members`)
      .then((result) => {
        const area = document.querySelector("#members");
        if (area)
          area.innerHTML = result.members
            .map(
              (m) =>
                `<div class="task"><div><strong>${escape(m.name)}</strong><small>${escape(m.email)}</small></div>${status(m.role)}${m.role !== "owner" && state.me.workspaces.find((w) => w.id === invite.dataset.workspace)?.role === "owner" ? `<button type="button" class="text-btn" data-remove-member="${m.id}">Remove access</button>` : ""}</div>`,
            )
            .join("");
        area?.querySelectorAll("[data-remove-member]").forEach(
          (button) =>
            (button.onclick = () =>
              perform(button, async () => {
                await api(
                  `/workspaces/${invite.dataset.workspace}/members`,
                  "DELETE",
                  { userId: button.dataset.removeMember },
                );
                button.closest(".task").remove();
                toast(
                  "Workspace access removed. Existing campaign records are retained.",
                );
              })),
        );
      })
      .catch((e) => toast(e.message));
  }
}
function schedulePoll() {
  clearTimeout(state.poll);
  if (["queued", "running"].includes(state.data?.job?.status))
    state.poll = setTimeout(async () => {
      try {
        await refresh();
      } catch (e) {
        toast(e.message);
      }
    }, 2500);
}
async function discoverAction(analyzeOnly = false) {
  await api(`/campaigns/${state.campaignId}/discover`, "POST", { analyzeOnly });
  await refresh();
  toast("Discovery started. You can continue reviewing while analysis runs.");
}
async function decision(value) {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const current = state.current;
    await api(`/creators/${current}/decision`, "POST", { decision: value });
    const surface = document.querySelector("#swipeSurface");
    if (surface) {
      surface.dataset.swipe =
        value === "selected"
          ? "SELECTED"
          : value === "passed"
            ? "PASS"
            : "SAVED FOR LATER";
      surface.classList.add(value === "passed" ? "leave-left" : "leave-right");
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    state.current = null;
    await refresh();
    guide.notify(value);
    toast(
      value === "deferred"
        ? "Saved for later — moved to the end of the queue"
        : value === "selected"
          ? "Selected for client review"
          : "Passed — Undo restores your last decision",
    );
  } catch (e) {
    toast(e.message);
  } finally {
    state.busy = false;
  }
}
function bind() {
  el.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.view === "create") {
          state.editing = false;
          state.formDraft = {};
        }
        navigate(b.dataset.view);
      }),
  );
  el.querySelectorAll("[data-campaign]").forEach(
    (b) =>
      (b.onclick = () =>
        perform(b, async () => {
          state.campaignId = b.dataset.campaign;
          state.compare.clear();
          await refresh();
          navigate("workspace");
        })),
  );
  const switcher = document.querySelector("#campaignSwitcher");
  switcher.onchange = async () => {
    state.campaignId = switcher.value || null;
    state.compare.clear();
    state.current = null;
    if (state.campaignId) await refresh();
    else {
      state.data = null;
      render();
    }
  };
  const logout = document.querySelector("#logout");
  if (logout)
    logout.onclick = () =>
      perform(logout, async () => {
        await api("/auth/logout", "POST", {});
        clearTimeout(state.poll);
        Object.assign(state, { me: null, data: null, campaignId: null });
        state.compare.clear();
        location.hash = "";
        renderAuth();
      });
  const form = document.querySelector("#campaignForm");
  if (form) {
    if (state.editing)
      form.insertAdjacentHTML(
        "afterbegin",
        `<input type="hidden" name="revision" value="${escape(state.formDraft.revision)}">`,
      );
    form.insertAdjacentHTML(
      "afterbegin",
      choice(
        "Workspace",
        "workspaceId",
        state.me.workspaces.map((w) => [w.id, w.name]),
        state.formDraft.workspaceId ||
          state.data?.campaign.workspace_id ||
          state.me.workspaces[0].id,
      ),
    );
    form.oninput = () =>
      (state.formDraft = Object.fromEntries(new FormData(form)));
    form.onsubmit = async (e) => {
      e.preventDefault();
      await perform(e.submitter, async () => {
        const payload = {
          ...Object.fromEntries(new FormData(form)),
          workspaceId: form.elements.workspaceId.value,
        };
        const result = state.editing
          ? await api(`/campaigns/${state.campaignId}`, "PATCH", payload)
          : await api("/campaigns", "POST", payload);
        state.campaignId = result.campaignId || state.campaignId;
        state.editing = false;
        state.formDraft = {};
        await load();
        navigate("discover");
        toast("Campaign saved");
      });
    };
    document.querySelector("#briefUpload").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1_500_000) {
        toast("Use a file smaller than 1.5 MB");
        return;
      }
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () =>
            reject(new Error("The file could not be read"));
          reader.readAsDataURL(file);
        });
        const result = await api("/documents/extract", "POST", {
          filename: file.name,
          base64,
        });
        form.elements.description.value = result.text;
        state.formDraft = Object.fromEntries(new FormData(form));
        toast("Brief imported. Review it before saving.");
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const importForm = document.querySelector("#importForm");
  if (importForm)
    importForm.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        await api(
          `/campaigns/${state.campaignId}/import`,
          "POST",
          Object.fromEntries(new FormData(importForm)),
        );
        await refresh();
        toast("Channel imported from YouTube");
      });
    };
  const find = document.querySelector("#discover");
  if (find) find.onclick = () => perform(find, () => discoverAction());
  document
    .querySelectorAll("#retryAnalysis")
    .forEach((b) => (b.onclick = () => perform(b, () => discoverAction(true))));
  const undo = document.querySelector("#undo");
  if (undo)
    undo.onclick = () =>
      perform(undo, async () => {
        const result = await api(
          `/campaigns/${state.campaignId}/undo`,
          "POST",
          {},
        );
        state.current = result.creatorId;
        await refresh();
        toast("Last decision restored");
        guide.notify("undo");
      });
  el.querySelectorAll("[data-decision]").forEach(
    (b) => (b.onclick = () => decision(b.dataset.decision)),
  );
  el.querySelectorAll("[data-compare]").forEach(
    (c) =>
      (c.onchange = () => {
        c.checked
          ? state.compare.add(c.dataset.compare)
          : state.compare.delete(c.dataset.compare);
        document.querySelector("#compareCount").textContent =
          `${state.compare.size} selected to compare`;
        document.querySelector("#compare").disabled = state.compare.size < 2;
        guide.update();
      }),
  );
  const compare = document.querySelector("#compare");
  if (compare) compare.onclick = () => navigate("compare");
  el.querySelectorAll("[data-detail]").forEach(
    (b) => (b.onclick = () => showCreator(b.dataset.detail)),
  );
  el.querySelectorAll("[data-brief]").forEach(
    (b) => (b.onclick = () => perform(b, () => openBrief(b.dataset.brief))),
  );
  el.querySelectorAll("[data-message]").forEach(
    (b) => (b.onclick = () => showMessage(b.dataset.message)),
  );
  const batch = document.querySelector("#batchDrafts");
  if (batch)
    batch.onclick = () =>
      perform(batch, async () => {
        for (const creatorId of state.compare) {
          await api(`/creators/${creatorId}/draft`, "POST", {});
        }
        await refresh();
        navigate("inbox");
      });
  const taskForm = document.querySelector("#taskForm");
  if (taskForm)
    taskForm.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        await api(
          `/campaigns/${state.campaignId}/tasks`,
          "POST",
          Object.fromEntries(new FormData(taskForm)),
        );
        await refresh();
      });
    };
  el.querySelectorAll("[data-task]").forEach(
    (box) =>
      (box.onchange = async () => {
        try {
          await api(`/tasks/${box.dataset.task}`, "PATCH", {
            done: box.checked,
          });
          await refresh();
        } catch (e) {
          box.checked = !box.checked;
          toast(e.message);
        }
      }),
  );
  const disconnect = document.querySelector("#disconnectGmail");
  if (disconnect)
    disconnect.onclick = () =>
      perform(disconnect, async () => {
        await api("/google/disconnect", "POST", {});
        await load();
        toast("Gmail disconnected");
      });
  const surface = document.querySelector("#swipeSurface");
  if (surface) bindSwipe(surface);
}
function bindSwipe(surface) {
  let start = null;
  surface.onpointerdown = (e) => {
    if (e.target.closest("button,a,input,textarea,select") || e.button > 0)
      return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  surface.onpointermove = (e) => {
    if (!start || state.busy) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      surface.setPointerCapture?.(e.pointerId);
      surface.style.transform = `translateX(${Math.max(-60, Math.min(60, dx * 0.3))}px)`;
      surface.dataset.swipe = dx > 0 ? "SELECTED" : "PASS";
    }
  };
  surface.onpointerup = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    start = null;
    surface.style.transform = "";
    delete surface.dataset.swipe;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5)
      decision(dx > 0 ? "selected" : "passed");
  };
  surface.onpointercancel = () => {
    start = null;
    surface.style.transform = "";
    delete surface.dataset.swipe;
  };
}
document.addEventListener("keydown", (e) => {
  if (
    state.view !== "discover" ||
    dialog.open ||
    e.target.closest("input,textarea,select")
  )
    return;
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    decision(e.key === "ArrowLeft" ? "passed" : "selected");
  }
});
function showCreator(creatorId) {
  const c = creatorById(creatorId);
  if (!c) return;
  modal(
    c.data.name,
    `<div class="portrait"><img src="${escape(c.data.image)}" alt="${escape(c.data.name)}"></div>${metrics(c)}${analysis(c)}<form id="creatorEdit" data-id="${c.id}" class="stack">${area("Internal notes", "note", c.note)}${field("Business contact email (confirm with creator)", "email", c.contact_email, "email")}${choice(
      "Pipeline stage",
      "stage",
      [
        "Selected",
        "Contacted",
        "Responded",
        "Interested",
        "Declined",
        "Brief approved",
        "Live",
      ].map((x) => [x, x]),
      c.stage,
    )}<div class="actions"><button class="btn primary" type="submit">Save details</button><button class="btn" type="button" data-draft="${c.id}">Draft outreach</button><button class="btn danger" type="button" data-remove="${c.id}">Remove from selected</button></div></form>`,
  );
  dialog.querySelector("#creatorEdit").dataset.revision = c.revision;
}
async function openBrief(creatorId) {
  let brief = state.data.briefs.find((b) => b.creator_id === creatorId);
  if (!brief) {
    await api(`/creators/${creatorId}/brief`, "POST", {});
    await refresh();
    brief = state.data.briefs.find((b) => b.creator_id === creatorId);
  }
  const c = creatorById(creatorId);
  modal(
    `${c.data.name} · Creator brief`,
    `<div class="badges">${gemini}${status(brief.status)}</div><form id="briefEdit" data-id="${brief.id}" class="stack">${Object.entries(
      brief.content,
    )
      .map(([key, value]) =>
        area(
          key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          key,
          Array.isArray(value) ? value.join("\n") : value,
        ),
      )
      .join(
        "",
      )}<small>List fields use one item per line. Saving changes returns an approved brief to draft.</small><div class="actions"><button class="btn" type="submit">Save changes</button><button type="button" class="btn" id="exportBrief" data-id="${brief.id}">Download PDF</button><button type="button" class="btn primary" id="approveBrief" data-id="${brief.id}">Approve saved brief</button></div></form>`,
  );
  dialog.querySelector("#briefEdit").dataset.revision = brief.revision;
  if (brief.status === "needs review") {
    dialog
      .querySelector(".dialog-body")
      .insertAdjacentHTML(
        "afterbegin",
        '<div class="info-strip">Campaign requirements changed. Review and save this brief, or regenerate it after rerunning creator analysis.<button type="button" class="btn" id="regenerateBrief">Regenerate for updated campaign</button></div>',
      );
    const regenerate = dialog.querySelector("#regenerateBrief");
    regenerate.onclick = () =>
      perform(regenerate, async () => {
        await api(`/creators/${creatorId}/brief`, "POST", { replace: true });
        await refresh();
        await openBrief(creatorId);
      });
  }
  dialog
    .querySelector(".dialog-body")
    .insertAdjacentHTML(
      "beforeend",
      `<section class="signal"><h2>Review a creator draft</h2><form id="reviewForm" class="stack">${area("Creator script, title or description", "script", "")}<button class="btn primary" type="submit">Check against the brief</button></form><div id="reviewResult"></div><p class="notes">Gemini provides a first-pass check. Final brand and legal approval is still required.</p></section>`,
    );
  const reviewForm = dialog.querySelector("#reviewForm");
  reviewForm.onsubmit = (e) => {
    e.preventDefault();
    perform(e.submitter, async () => {
      const response = await api(
        `/creators/${creatorId}/review`,
        "POST",
        Object.fromEntries(new FormData(reviewForm)),
      );
      const result = response.result;
      dialog.querySelector("#reviewResult").innerHTML =
        `<h3>${escape(result.summary)}</h3>${result.issues.map((i) => `<section class="signal">${status(i.severity)}<p><strong>${escape(i.quote)}</strong><br>${escape(i.reason)}</p><small>${escape(i.suggestion)}</small></section>`).join("")}`;
      await refresh();
    });
  };
}
function showMessage(messageId) {
  const m = state.data.messages.find((x) => x.id === messageId);
  if (!m) return;
  modal(
    "Review outreach",
    `<div class="badges">${status(m.status)}</div>${m.error ? `<div class="error">${escape(m.error)}</div>` : ""}<form id="messageEdit" data-id="${m.id}" class="stack">${field("To", "recipient", m.recipient, "email", m.status === "draft" ? "" : "readonly")}${field("Subject", "subject", m.subject, "text", m.status === "draft" ? "" : "readonly")}${area("Message", "body", m.body)}${m.status === "draft" ? `<p class="notes">Review the contact, subject and message before sending. Sending uses your connected Gmail account.</p><div class="actions"><button class="btn" type="submit">Save draft</button><button type="button" class="btn primary" id="sendMessage" data-id="${m.id}">Approve & send email</button></div>` : `<div class="actions"><button class="btn" type="button" id="syncReplies" data-id="${m.id}">Check for replies</button></div><div id="replies"></div>`}</form>`,
  );
  dialog.querySelector("#messageEdit").dataset.revision = m.revision;
  const attachmentSection =
    m.status === "draft"
      ? `<fieldset><legend>Campaign attachments</legend>${(state.data.files || []).map((file) => `<label class="task"><input type="checkbox" name="fileIds" value="${file.id}" ${(m.attachments || []).some((a) => a.id === file.id) ? "checked" : ""}><span>${escape(file.name)}</span></label>`).join("") || "<small>Upload a file in Campaign to attach it here.</small>"}<small>Up to 4 files · 5 MB total. Attachments are saved with this draft.</small></fieldset>`
      : `<section><h3>Attachments</h3>${(m.attachments || []).map((file) => `<a href="/api/files/${file.id}">${escape(file.name)}</a>`).join("<br>") || "<small>No attachments</small>"}</section>`;
  dialog
    .querySelector("#messageEdit .actions")
    .insertAdjacentHTML("beforebegin", attachmentSection);
  if (m.status !== "draft") dialog.querySelector("textarea").readOnly = true;
  if (m.status !== "draft" && !m.thread_id) {
    dialog.querySelector("#syncReplies")?.remove();
    if (m.status === "stale") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn primary";
      button.textContent = "Generate a new draft";
      button.onclick = () =>
        perform(button, async () => {
          await api(`/creators/${m.creator_id}/draft`, "POST", {});
          closeDialog();
          await refresh();
        });
      dialog.querySelector(".actions").appendChild(button);
    }
  }
}
function emailPayload(form) {
  const fields = new FormData(form);
  return {
    ...Object.fromEntries(fields),
    fileIds: fields.getAll("fileIds"),
    revision: form.dataset.revision,
  };
}
function bindDialog() {
  dialog
    .querySelectorAll("[data-brief]")
    .forEach(
      (b) => (b.onclick = () => perform(b, () => openBrief(b.dataset.brief))),
    );
  const creatorForm = dialog.querySelector("#creatorEdit");
  if (creatorForm)
    creatorForm.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        const result = await api(
          `/creators/${creatorForm.dataset.id}`,
          "PATCH",
          {
            ...Object.fromEntries(new FormData(creatorForm)),
            revision: creatorForm.dataset.revision,
          },
        );
        creatorForm.dataset.revision = result.revision;
        await refresh();
        toast("Creator details saved");
      });
    };
  dialog.querySelectorAll("[data-draft]").forEach(
    (b) =>
      (b.onclick = () =>
        perform(b, async () => {
          await api(`/creators/${b.dataset.draft}/draft`, "POST", {});
          closeDialog();
          await refresh();
          navigate("inbox");
        })),
  );
  dialog.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () =>
        perform(b, async () => {
          await api(`/creators/${b.dataset.remove}/decision`, "POST", {
            decision: "passed",
          });
          state.compare.delete(b.dataset.remove);
          closeDialog();
          await refresh();
        })),
  );
  const briefForm = dialog.querySelector("#briefEdit");
  if (briefForm)
    briefForm.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        const existing = state.data.briefs.find(
          (b) => b.id === briefForm.dataset.id,
        );
        const content = Object.fromEntries(new FormData(briefForm));
        for (const key of Object.keys(content))
          if (Array.isArray(existing.content[key]))
            content[key] = content[key]
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean);
        const result = await api(`/briefs/${existing.id}`, "PATCH", {
          content,
          revision: briefForm.dataset.revision,
        });
        briefForm.dataset.revision = result.revision;
        await refresh();
        guide.notify("brief-saved");
        toast("Brief saved");
      });
    };
  const approve = dialog.querySelector("#approveBrief");
  if (approve)
    approve.onclick = () =>
      perform(approve, async () => {
        await api(`/briefs/${approve.dataset.id}/approve`, "POST", {
          approve: true,
          revision: briefForm.dataset.revision,
        });
        await refresh();
        closeDialog();
        navigate("workspace");
        guide.notify("brief-approved");
        toast("Saved brief approved");
      });
  const pdf = dialog.querySelector("#exportBrief");
  if (pdf)
    pdf.onclick = () => {
      const link = document.createElement("a");
      link.href = `/api/briefs/${pdf.dataset.id}/export`;
      link.download = "orbit-creator-brief.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      guide.notify("brief-exported");
    };
  const messageForm = dialog.querySelector("#messageEdit");
  if (messageForm)
    messageForm.onsubmit = (e) => {
      e.preventDefault();
      perform(e.submitter, async () => {
        const result = await api(
          `/messages/${messageForm.dataset.id}`,
          "PATCH",
          emailPayload(messageForm),
        );
        messageForm.dataset.revision = result.revision;
        await refresh();
        guide.notify("email-saved");
        toast("Draft saved");
      });
    };
  const send = dialog.querySelector("#sendMessage");
  if (send)
    send.onclick = () =>
      perform(send, async () => {
        const result = await api(
          `/messages/${send.dataset.id}`,
          "PATCH",
          emailPayload(messageForm),
        );
        messageForm.dataset.revision = result.revision;
        await api(`/messages/${send.dataset.id}/send`, "POST", {
          approve: true,
        });
        await refresh();
        closeDialog();
        guide.notify("email-sent");
        toast("Gmail confirmed your email was sent");
      });
  const sync = dialog.querySelector("#syncReplies");
  if (sync)
    sync.onclick = () =>
      perform(sync, async () => {
        const result = await api(
          `/messages/${sync.dataset.id}/sync`,
          "POST",
          {},
        );
        dialog.querySelector("#replies").innerHTML =
          result.replies
            .map(
              (r) =>
                `<p>${escape(r.snippet)}<br><small>${date(r.receivedAt)}</small></p>`,
            )
            .join("") || "<p>No new replies in this Gmail thread.</p>";
        await refresh();
      });
}
try {
  await load();
} catch (error) {
  if (error.message === "Sign in to continue") renderAuth();
  else {
    el.innerHTML = empty(
      "Your workspace is temporarily unavailable",
      escape(error.message),
      '<button class="btn" id="reload">Try again</button>',
    );
    document.querySelector("#reload").onclick = () => location.reload();
  }
}
