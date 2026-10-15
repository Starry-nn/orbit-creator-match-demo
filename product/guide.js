// Highlights belong to the actual controls. No floating highlight rectangles or
// animation-frame tracking: native document/dialog scrolling owns positioning.
export function createGuide({ getState, navigate, toast, closeDialog }) {
  let current = null,
    owner = null,
    timer = null,
    frame = null,
    targets = [],
    coach = null;
  const selected = (s) =>
    s.data?.creators.filter((c) => c.decision === "selected") || [];
  const multiple = (s) => selected(s).length >= 2;
  const field = (name) => `#campaignForm [name="${name}"]`;
  const value = (selector) => document.querySelector(selector)?.value.trim();
  const inDialog = (selector) =>
    Boolean(document.querySelector(`#detail[open] ${selector}`));
  const steps = [
    {
      id: "create",
      view: "home",
      target: '[data-view="create"]',
      title: "Start with a real campaign",
      copy: "Create a campaign for your brand or client.",
      done: (s) => s.view === "create",
    },
    {
      id: "name",
      view: "create",
      target: field("name"),
      label: true,
      title: "Name the campaign",
      copy: "Use a name your team will recognize in the workspace.",
      next: true,
      validate: () => Boolean(value(field("name"))),
    },
    {
      id: "brand",
      view: "create",
      target: field("brand"),
      label: true,
      title: "Add the brand or product",
      copy: "This gives Gemini the context for each recommendation.",
      next: true,
      validate: () => Boolean(value(field("brand"))),
    },
    {
      id: "goal",
      view: "create",
      target: field("goal"),
      label: true,
      title: "Choose the outcome",
      copy: "Awareness, consideration and conversion need different creator strengths.",
      next: true,
    },
    {
      id: "audience",
      view: "create",
      target: field("audience"),
      label: true,
      title: "Describe the target audience",
      copy: "Include who you want to reach and what matters to them.",
      next: true,
      validate: () => Boolean(value(field("audience"))),
    },
    {
      id: "budget",
      view: "create",
      target: field("budgetMax"),
      label: true,
      title: "Set the budget range",
      copy: "Add the maximum campaign budget in USD. Creator rates still need direct confirmation.",
      next: true,
      validate: () => Number(value(field("budgetMax"))) > 0,
    },
    {
      id: "format",
      view: "create",
      target: field("format"),
      label: true,
      title: "Choose the YouTube format",
      copy: "Shorts, dedicated videos and long-form integrations call for different creative plans.",
      next: true,
    },
    {
      id: "category",
      view: "create",
      target: field("category"),
      label: true,
      title: "Give discovery a starting point",
      copy: "Add a category, such as technology, travel or beauty. You can refine keywords below.",
      next: true,
      validate: () => Boolean(value(field("category"))),
    },
    {
      id: "save",
      view: "create",
      target: '#campaignForm button[type="submit"]',
      title: "Save your campaign brief",
      copy: "Save these inputs to your workspace. You can edit advanced criteria after the walkthrough.",
      done: (s) => s.view === "discover" && Boolean(s.data),
    },
    {
      id: "batch-size",
      view: "discover",
      target: "#discoveryBatch",
      label: true,
      title: "Choose a small first batch",
      copy: "Start with up to 2 creators. Each uses up to 2 public videos; more batches require another click and may incur API charges.",
      next: true,
    },
    {
      id: "discover",
      view: "discover",
      target: "#discover",
      title: "Find and analyze creators",
      copy: "Run discovery from this brief. Actual YouTube and Gemini connections are required; analysis progress appears on this page.",
      done: (s) =>
        Boolean(s.data?.creators.some((c) => c.analysis)) &&
        !["queued", "running"].includes(s.data?.job?.status),
    },
    {
      id: "profile",
      view: "discover",
      target: ".profile .identity",
      title: "Review the creator",
      copy: "Read the channel, public metrics and video evidence. You keep control of the decision.",
      next: true,
    },
    {
      id: "fit",
      view: "discover",
      target: ".discover .fit",
      title: "Understand the fit estimate",
      copy: "Gemini compares public videos with your campaign brief. This is an AI estimate, not a guarantee of campaign performance.",
      next: true,
    },
    {
      id: "evidence",
      view: "discover",
      target: ".discover .evidence a:first-child",
      title: "Check the source video",
      copy: "Each evidence link opens the source on YouTube at the cited timestamp. Review the context before making a decision.",
      when: (s) =>
        Boolean(
          s.data?.creators.find((c) => c.id === s.current)?.analysis?.evidence
            ?.length,
        ),
      next: true,
    },
    {
      id: "pass",
      view: "discover",
      target: ".decision-controls .pass",
      title: "Try a left swipe or Pass",
      copy: "Pass removes this creator from the queue. The next step will bring them back with Undo.",
      event: "passed",
      swipe: true,
    },
    {
      id: "undo",
      view: "discover",
      target: "#undo",
      title: "Undo your last decision",
      copy: "The left arrow restores the creator and their previous decision.",
      event: "undo",
    },
    {
      id: "defer",
      view: "discover",
      target: '[data-decision="deferred"]',
      title: "Save for later",
      copy: "The right clock moves this creator to the end of the queue. It does not add them to Selected.",
      event: "deferred",
    },
    {
      id: "select",
      view: "discover",
      target: '[data-decision="selected"]',
      title: "Select your finalists",
      copy: "Swipe right or Select to choose creators for review. Choose two if available so you can compare them.",
      swipe: true,
      done: (s) =>
        selected(s).length >= Math.min(2, s.data?.creators.length || 2) ||
        Boolean(
          selected(s).length &&
          !s.data?.creators.some((c) =>
            ["pending", "deferred"].includes(c.decision),
          ),
        ),
    },
    {
      id: "selected",
      view: "discover",
      target: '.nav a[href="#selected"]',
      title: "Open Selected",
      copy: "Your selected creators stay here with their notes and supporting evidence.",
      done: (s) => s.view === "selected",
    },
    {
      id: "pick",
      view: "selected",
      target: "[data-compare]",
      title: "Choose creators to compare",
      copy: "Use the checkboxes to choose any two or more creators. Photos open details without changing your selection.",
      when: multiple,
      done: (s) => s.compare.size >= 2,
    },
    {
      id: "compare",
      view: "selected",
      target: "#compare",
      title: "Compare side by side",
      copy: "Review content fit, public performance, format and risks together.",
      when: multiple,
      done: (s) => s.view === "compare",
    },
    {
      id: "batch",
      view: "compare",
      target: "#batchDrafts",
      title: "Prepare personalized outreach",
      copy: "Gemini drafts an email for each creator you chose. Nothing is sent yet.",
      when: multiple,
      done: (s) => s.view === "inbox" && Boolean(s.data?.messages.length),
    },
    {
      id: "single-detail",
      view: "selected",
      target: "[data-detail]",
      title: "Open your selected creator",
      copy: "With one creator available, review their details before preparing outreach.",
      when: (s) => !multiple(s),
      done: () => inDialog("#creatorEdit"),
    },
    {
      id: "single-draft",
      view: "selected",
      target: "#detail [data-draft]",
      title: "Draft an outreach email",
      copy: "Gemini uses the campaign and this creator’s evidence. Nothing is sent yet.",
      when: (s) => !multiple(s),
      done: (s) => s.view === "inbox" && Boolean(s.data?.messages.length),
    },
    {
      id: "email-open",
      view: "inbox",
      target: "[data-message]",
      title: "Review an email draft",
      copy: "Open a draft to review the recipient, subject, message and attachments.",
      done: () => inDialog("#messageEdit"),
    },
    {
      id: "recipient",
      view: "inbox",
      target: '#messageEdit [name="recipient"]',
      label: true,
      title: "Confirm the business contact",
      copy: "Enter a verified contact email. Orbit does not invent creator email addresses.",
      next: true,
      skip: "Add contact later",
      validate: () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          value('#messageEdit [name="recipient"]') || "",
        ),
    },
    {
      id: "email-body",
      view: "inbox",
      target: '#messageEdit [name="body"]',
      label: true,
      title: "Make the message yours",
      copy: "Read and edit the message. You can manage campaign attachments after the walkthrough.",
      next: true,
    },
    {
      id: "email-save",
      view: "inbox",
      target: '#messageEdit button[type="submit"]',
      title: "Save the reviewed draft",
      copy: "Your edits and chosen attachments stay with this email.",
      event: "email-saved",
    },
    {
      id: "email-send",
      view: "inbox",
      target: "#sendMessage",
      title: "You approve every send",
      copy: "Use Approve & send only when the recipient and message are ready. You can also keep this as a draft and continue.",
      skip: "Keep as draft",
      event: "email-sent",
      onSkip: () => {
        closeDialog();
        navigate("inbox");
      },
    },
    {
      id: "workspace",
      view: "inbox",
      target: '.nav a[href="#workspace"]',
      title: "Open the campaign workspace",
      copy: "Creator stages, briefs, tasks and files stay together here.",
      done: (s) => s.view === "workspace",
    },
    {
      id: "creator-detail",
      view: "workspace",
      target: "[data-detail]",
      title: "Open a selected creator",
      copy: "Generate a brief using this creator’s actual analyzed video evidence.",
      done: () => inDialog("#creatorEdit"),
    },
    {
      id: "brief-generate",
      view: "workspace",
      target: "#detail [data-brief]",
      title: "Generate the AI creator brief",
      copy: "Gemini turns the campaign and video evidence into editable creative direction and guardrails.",
      done: () => inDialog("#briefEdit"),
    },
    {
      id: "brief-review",
      view: "workspace",
      target: '#briefEdit [name="objective"]',
      label: true,
      title: "Review the campaign objective",
      copy: "Read the generated direction and edit it to match the partnership.",
      next: true,
    },
    {
      id: "brief-messages",
      view: "workspace",
      target: '#briefEdit [name="messages"]',
      label: true,
      title: "Check the key messages",
      copy: "Keep approved product facts and remove anything the creator should not claim. Use one message per line.",
      next: true,
    },
    {
      id: "brief-guardrails",
      view: "workspace",
      target: '#briefEdit [name="guardrails"]',
      label: true,
      title: "Check the brand guardrails",
      copy: "Review the restrictions before approval. AI-generated direction still needs your judgment.",
      next: true,
    },
    {
      id: "brief-save",
      view: "workspace",
      target: '#briefEdit button[type="submit"]',
      title: "Save the reviewed brief",
      copy: "Save your edits before downloading or approving this version.",
      event: "brief-saved",
    },
    {
      id: "brief-export",
      view: "workspace",
      target: "#exportBrief",
      title: "Export the reviewed brief",
      copy: "Download the saved version as a PDF. The brief stays open until you close it.",
      event: "brief-exported",
    },
    {
      id: "brief-close",
      view: "workspace",
      target: "#detail [data-close]",
      title: "Close when you are ready",
      copy: "Your saved brief remains available in Campaign.",
      done: () => !document.querySelector("#detail[open]"),
    },
    {
      id: "brief-open",
      view: "workspace",
      target: "[data-brief]",
      title: "Reopen the saved brief",
      copy: "Return to the creator brief for the final approval.",
      done: () => inDialog("#briefEdit"),
    },
    {
      id: "brief-approve",
      view: "workspace",
      target: "#approveBrief",
      title: "Approve the saved direction",
      copy: "Review the messaging, deliverables and disclosures. Approval updates the creator’s campaign stage.",
      event: "brief-approved",
    },
    {
      id: "finish",
      view: "workspace",
      title: "Your campaign is ready to manage",
      copy: "You have created a real brief, reviewed creators, prepared outreach and approved a creator brief. Add tasks and files as the partnership progresses.",
      finish: true,
    },
  ];
  const storageKey = () => `orbit-guide-v1:${getState().me?.user.id}`;
  function save() {
    localStorage.setItem(storageKey(), current || "dismissed");
  }
  function clean() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    document
      .querySelectorAll(".guide-target")
      .forEach((t) => t.classList.remove("guide-target"));
    document.querySelector("#guideCoach")?.remove();
    targets = [];
    coach = null;
  }
  function activeSteps() {
    const s = getState();
    return steps.filter((step) => !step.when || step.when(s));
  }
  function step() {
    return steps.find((s) => s.id === current);
  }
  function next() {
    const all = activeSteps(),
      index = all.findIndex((s) => s.id === current);
    current = all[index + 1]?.id || null;
    save();
    update();
  }
  function exit() {
    clean();
    current = null;
    document.body.classList.remove("guide-active");
    save();
  }
  function start() {
    current = "create";
    owner = getState().me.user.id;
    save();
    if (document.querySelector("#detail[open]")) closeDialog();
    navigate("home");
    update();
  }
  function notice() {
    const s = getState();
    if (!s.me || document.querySelector("#guideWelcome")) return;
    const saved = localStorage.getItem(storageKey());
    if (!saved && s.view === "home" && !s.campaigns.length) {
      const banner = document.createElement("section");
      banner.className = "panel guide-welcome";
      banner.id = "guideWelcome";
      banner.innerHTML =
        '<img src="../assets/brands/orbit.svg" alt=""><div><h2>Your first creator campaign</h2><p>A guided walkthrough, using your own brief and real creator data.</p><div class="actions"><button class="btn primary" id="startGuide">Start guided setup</button><button class="text-btn" id="dismissGuide">Explore on my own</button></div></div>';
      document.querySelector(".heading")?.after(banner);
      banner.querySelector("#startGuide").onclick = start;
      banner.querySelector("#dismissGuide").onclick = () => {
        localStorage.setItem(storageKey(), "dismissed");
        banner.remove();
      };
    }
  }
  function focusTargets() {
    if (!coach?.isConnected || !targets[0]?.isConnected) return;
    const target = targets[0],
      modal = target.closest("dialog");
    if (target.closest(".nav")) return;
    // A native dialog cannot scroll its last action above the coach unless it
    // has enough trailing space. Size that space from the actual coach instead
    // of assuming a fixed height (copy and mobile navigation change it).
    if (modal)
      modal.style.setProperty(
        "--guide-reserve",
        `${Math.max(240, window.innerHeight - coach.getBoundingClientRect().top + 48)}px`,
      );
    target.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
    const rect = target.getBoundingClientRect(),
      coachRect = coach.getBoundingClientRect();
    const top = modal ? modal.getBoundingClientRect().top + 75 : 20;
    const bottom = coachRect.top - 20;
    if (rect.bottom > bottom || rect.top < top) {
      const delta = rect.top + rect.height / 2 - (top + bottom) / 2;
      if (modal) modal.scrollTop += delta;
      else window.scrollBy({ top: delta, behavior: "instant" });
    }
  }
  function update() {
    const s = getState();
    if (!s.me) {
      clean();
      current = null;
      owner = null;
      document.body.classList.remove("guide-active");
      return;
    }
    if (owner !== s.me.user.id) {
      owner = s.me.user.id;
      const saved = localStorage.getItem(storageKey());
      current = steps.some((step) => step.id === saved) ? saved : null;
      if (current) {
        // Forms, checkbox picks and native dialogs are ephemeral. Resume from
        // their real entry point after a reload rather than highlighting a
        // control inside a dialog that no longer exists.
        if (step().view === "create") current = "name";
        if (["compare", "batch", "pick"].includes(current))
          current = multiple(s) ? "pick" : "single-detail";
        if (current === "single-draft") current = "single-detail";
        if (
          ["recipient", "email-body", "email-save", "email-send"].includes(
            current,
          )
        )
          current = "email-open";
        if (current.startsWith("brief-")) current = "creator-detail";
        save();
        if (s.view !== step().view) {
          queueMicrotask(() => navigate(step().view));
          return;
        }
      }
    }
    clean();
    if (!current) {
      document.body.classList.remove("guide-active");
      notice();
      return;
    }
    let item = step(),
      count = 0;
    while (item?.done?.(s) && count++ < steps.length) {
      const all = activeSteps(),
        index = all.findIndex((v) => v.id === current);
      current = all[index + 1]?.id || "finish";
      item = step();
      save();
    }
    if (!item) return exit();
    document.body.classList.add("guide-active");
    const discoveryOptions = document.querySelector(".discovery-options");
    if (discoveryOptions) discoveryOptions.open = item.id === "batch-size";
    const all = activeSteps();
    targets = item.target
      ? [...document.querySelectorAll(item.target)].filter(
          (t) => t.getClientRects().length && !t.closest("#guideCoach"),
        )
      : [];
    if (item.label) targets = targets.map((t) => t.closest("label") || t);
    // Prefer the empty-state action over an off-screen duplicate on Home.
    if (item.id === "create") targets = targets.slice(-1);
    targets.forEach((t) => t.classList.add("guide-target"));
    coach = document.createElement("section");
    coach.id = "guideCoach";
    coach.dataset.step = current;
    coach.className = "guide-coach";
    coach.setAttribute("role", "region");
    coach.setAttribute("aria-label", "Guided setup");
    const index = all.findIndex((v) => v.id === current);
    coach.innerHTML = `<header><span>GUIDED SETUP · ${index + 1}/${all.length}</span><button type="button" class="guide-exit" aria-label="Exit guided setup">×</button></header><h2></h2><p></p><div class="actions"></div>`;
    coach.querySelector("h2").textContent = item.title;
    coach.querySelector("p").textContent = item.copy;
    const actions = coach.querySelector(".actions");
    const button = (label, fn) => {
      const b = document.createElement("button");
      b.className = "btn";
      b.type = "button";
      b.textContent = label;
      b.onclick = fn;
      actions.appendChild(b);
    };
    if (item.finish)
      button("Finish walkthrough", () => {
        exit();
        toast("Guided setup complete");
      });
    else if (item.next)
      button("Continue →", () => {
        if (item.validate && !item.validate()) {
          toast("Complete the highlighted field to continue");
          targets[0]?.querySelector("input,textarea,select")?.focus();
          return;
        }
        next();
      });
    else {
      const hint = document.createElement("small");
      hint.textContent = targets.length
        ? "Use the highlighted control to continue"
        : "Waiting for the required view or data. You can exit and resume later.";
      actions.appendChild(hint);
    }
    if (item.skip)
      button(item.skip, () => {
        const after = item.onSkip;
        next();
        after?.();
      });
    if (!targets.length && !item.finish && s.view !== item.view)
      button(
        `Return to ${item.view === "discover" ? "Discover" : item.view}`,
        () => navigate(item.view),
      );
    coach.querySelector(".guide-exit").onclick = exit;
    const modal = document.querySelector("#detail[open]");
    (modal || document.body).appendChild(coach);
    frame = requestAnimationFrame(() => {
      focusTargets();
      timer = setTimeout(focusTargets, 100);
    });
  }
  function allowed(target) {
    const download = target.closest?.("a[download]");
    if (
      current === "brief-export" &&
      /^\/api\/briefs\/[a-f0-9-]{36}\/export$/.test(
        download?.getAttribute("href") || "",
      )
    )
      return true;
    return (
      Boolean(target.closest?.("#guideCoach")) ||
      targets.some((t) => t === target || t.contains(target)) ||
      (step()?.swipe && target.closest?.("#swipeSurface"))
    );
  }
  document.addEventListener(
    "click",
    (event) => {
      if (current && !allowed(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (!current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        exit();
      }
      if (event.key === "Tab") {
        const parent = document.querySelector("#detail[open]") || document;
        const focusable = [
          ...parent.querySelectorAll(
            ".guide-target:is(button,input,textarea,select,a),.guide-target :is(button,input,textarea,select,a),#guideCoach button",
          ),
        ].filter((t) => t.getClientRects().length && !t.disabled);
        if (!focusable.length) return;
        const index = focusable.indexOf(document.activeElement),
          nextIndex = event.shiftKey
            ? index <= 0
              ? focusable.length - 1
              : index - 1
            : (index + 1) % focusable.length;
        event.preventDefault();
        focusable[nextIndex].focus();
      }
    },
    true,
  );
  document.addEventListener(
    "wheel",
    (event) => {
      if (
        current &&
        step()?.id !== "pick" &&
        !event.target.closest?.("textarea,#guideCoach")
      )
        event.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener(
    "touchmove",
    (event) => {
      if (
        current &&
        step()?.id !== "pick" &&
        !event.target.closest?.("textarea,#guideCoach") &&
        !(step()?.swipe && event.target.closest?.("#swipeSurface"))
      )
        event.preventDefault();
    },
    { passive: false },
  );
  window.visualViewport?.addEventListener("resize", () => {
    if (current) {
      clearTimeout(timer);
      timer = setTimeout(focusTargets, 120);
    }
  });
  return {
    update,
    start,
    exit,
    notify(name) {
      if (current && step()?.event === name) next();
    },
  };
}
