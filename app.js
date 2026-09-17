const creators = [
  {name:'Maya Moves', handle:'@MayaMoves', niche:'Fitness science', subs:'842K', views:'186K', eng:'6.8%', score:94, image:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85', videoImage:'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=85', tags:['Evidence-led','High trust'], prompt:'The comment I never get tired of…', quote:'“I finally understand what my body needs — without feeling talked down to.”', videoTitle:'What actually changes when you train in the heat?', risk:'Low sponsor density · No competing hydration partner in 180 days', why:'Maya’s last 12 videos over-index with women 25–34, your priority audience. Her product integrations average 41 seconds and preserve 92% of baseline retention.'},
  {name:'Devon Trains', handle:'@DevonTrains', niche:'Strength & nutrition', subs:'1.2M', views:'244K', eng:'5.4%', score:91, image:'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85', videoImage:'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=85', tags:['Performance','Story-led'], prompt:'My audience shows up for…', quote:'Real training weeks — missed reps, small wins, and the meals between them.', videoTitle:'I changed one recovery habit for 30 days', risk:'Medium sponsor density · Strong category sentiment', why:'Devon has strong topical overlap with recovery and hydration, plus three comparable sponsorships with above-channel-average comment sentiment.'},
  {name:'Nia Outdoors', handle:'@NiaOutdoors', niche:'Adventure wellness', subs:'515K', views:'132K', eng:'7.1%', score:88, image:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85', videoImage:'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=85', tags:['Outdoor','Community'], prompt:'The story behind the channel…', quote:'Adventure should feel possible before it feels impressive.', videoTitle:'A beginner’s guide to all-day trail energy', risk:'Low sponsor density · Outdoor seasonality improves fit', why:'Nia reaches active lifestyle audiences with unusually high saves and repeat viewers. Her low sponsor density supports stronger brand recall.'}
];

const state = {screen:'home', creator:0, lastAction:null, pool:3, formStep:1, selectedCompare:2};
const app = document.querySelector('#app');
const nav = document.querySelector('.tabbar');

const appHeader = () => `<header class="topline"><div class="brand"><span class="brandmark"></span>Orbit</div><div class="avatar">AC</div></header>`;
const pageTitle = (title, back='home') => `<div class="screen-title"><button class="back" data-go="${back}" aria-label="Go back">←</button><h2>${title}</h2></div>`;

const screens = {
  home: () => `${appHeader()}
    <section class="hero"><span class="spark">✦</span><span class="eyebrow">AI creator matching</span><h1>Find the signal in the scroll.</h1><p>Turn one campaign brief into a ranked, explainable creator shortlist.</p><button class="primary" data-go="create">Create campaign →</button></section>
    <div class="section-head"><h3>Live campaign</h3><button data-go="workspace">Open workspace</button></div>
    <article class="campaign-card" data-go="match"><div class="row"><div><span class="eyebrow">NovaFuel</span><h3>Summer Performance Launch</h3></div><span class="status">● Matching</span></div><div class="progress"><span style="width:68%"></span></div><div class="row"><small>136 creators analyzed</small><small>18 shortlisted</small></div></article>
    <div class="section-head"><h3>This week</h3></div><div class="metric-row"><div class="metric"><strong>42</strong><span>new matches</span></div><div class="metric"><strong>8</strong><span>replies</span></div><div class="metric"><strong>3</strong><span>briefs ready</span></div></div>
    <div class="section-head"><h3>Recent</h3><button>See all</button></div><article class="campaign-card"><div class="row"><div><h3>Mindful Morning</h3><p>Wellness · $35K budget</p></div><strong>12 saved</strong></div></article>`,

  create: () => `${pageTitle('Create campaign')}<div class="stepper">${[1,2,3].map(i=>`<span class="${i<=state.formStep?'on':''}"></span>`).join('')}</div>${state.formStep===1?`
    <span class="eyebrow">Step 1 of 3 · Foundation</span><h1>What are we making happen?</h1>
    <label>Campaign name</label><input value="NovaFuel Summer Launch" />
    <label>Brand / product</label><input value="NovaFuel Electrolyte Mix" />
    <label>Primary goal</label><div class="chips"><button class="chip selected">Awareness</button><button class="chip">Conversions</button><button class="chip">Product launch</button><button class="chip">Content rights</button></div>
    <label>Campaign description</label><textarea>Launch NovaFuel to active women who want clean, science-backed hydration without the wellness hype.</textarea>
    <label>Already have a brief?</label><div class="upload"><div><strong>↑ Upload campaign brief</strong><br><span>PDF, DOCX, or Google Doc</span></div></div>`:state.formStep===2?`
    <span class="eyebrow">Step 2 of 3 · Audience</span><h1>Who should the creator move?</h1>
    <label>Target audience</label><input value="Women 25–40, US, fitness & outdoors" />
    <label>Total creator budget</label><select><option>$25,000 – $50,000</option></select>
    <label>Creator size</label><div class="chips"><button class="chip">Micro 10–100K</button><button class="chip selected">Mid 100K–1M</button><button class="chip selected">Macro 1M+</button></div>
    <label>Content style</label><div class="chips"><button class="chip selected">Educational</button><button class="chip selected">Story-led</button><button class="chip">Comedy</button><button class="chip">Cinematic</button></div>
    <label>Keywords</label><input value="hydration, endurance, recovery, clean label" />`: `
    <span class="eyebrow">Step 3 of 3 · Guardrails</span><h1>Teach Orbit your taste.</h1>
    <label>Brand guidelines</label><textarea>Evidence-first. Optimistic, direct, never preachy. Show the product used naturally during training.</textarea>
    <label>Must avoid</label><textarea>Medical claims, rapid weight loss, extreme diets, competitor comparisons.</textarea>
    <label>Industry exclusions</label><div class="chips"><button class="chip selected">Gambling</button><button class="chip selected">Alcohol</button><button class="chip">Fast fashion</button></div>
    <div class="ai-note" style="margin-top:16px"><strong>✦ Ready to analyze</strong><br>Orbit will scan recent YouTube content, audience fit, performance consistency, brand safety, and comparable sponsorships.</div>`}
    <div class="form-actions"><button class="secondary" id="prevStep">${state.formStep===1?'Save draft':'Back'}</button><button class="primary blue" id="nextStep">${state.formStep===3?'Find creators ✦':'Continue'}</button></div>`,

  match: () => { const c=creators[state.creator%creators.length]; return `<div class="discover-top"><button class="campaign-switch"><span>NovaFuel launch</span>⌄</button><span class="counter">${state.creator+1} of 136</span></div>
    <article class="profile-stream" id="creatorCard">
      <section class="profile-hero" style="background-image:url('${c.image}')"><div class="hero-shade"></div><button class="more" aria-label="More creator options">•••</button><div class="profile-name"><span class="active-dot"></span><h1>${c.name}</h1><p>${c.handle} · ${c.niche}</p></div><button class="content-pick" data-pick="Profile introduction" aria-label="Shortlist profile introduction">＋</button></section>
      <section class="profile-facts"><div><strong>${c.subs}</strong><small>SUBSCRIBERS</small></div><div><strong>${c.views}</strong><small>AVG. VIEWS</small></div><div><strong>${c.eng}</strong><small>ENGAGEMENT</small></div><div class="fit-pill"><strong>${c.score}%</strong><small>AI MATCH</small></div></section>
      <section class="profile-prompt"><span class="prompt-label">${c.prompt}</span><blockquote>${c.quote}</blockquote><button class="content-pick dark" data-pick="Creator voice and community" aria-label="Shortlist creator prompt">＋</button></section>
      <section class="video-story" style="background-image:url('${c.videoImage}')"><div class="video-overlay"><span class="video-kicker">RECENT VIDEO · 312K VIEWS</span><h2>${c.videoTitle}</h2><span class="watch">▶ 12:08</span></div><button class="content-pick" data-pick="Recent content performance" aria-label="Shortlist recent video">＋</button></section>
      <section class="match-memo"><div class="memo-top"><span class="ai-star">✦</span><div><span class="eyebrow">Orbit match memo</span><h2>Why you two make sense.</h2></div></div><p>${c.why}</p><div class="evidence-row"><span>Audience overlap <b>96</b></span><span>Brand fit <b>93</b></span><span>Content momentum <b>89</b></span></div><button class="evidence-toggle" id="reasonButton">See the evidence <span>↓</span></button><div class="evidence-detail" id="reasonDetail"><p><strong>Based on:</strong> 12 recent videos, 3.8K audience comments, sponsor history, retention benchmarks, and brand-safety signals.</p></div><button class="content-pick blue" data-pick="AI match evidence" aria-label="Shortlist AI match reason">＋</button></section>
      <section class="safety-card"><div><span class="eyebrow">Collaboration read</span><h3>${c.risk}</h3></div><span class="safety-mark">✓</span></section>
      <p class="end-note">That’s the full picture on ${c.name}.<br><span>Choose what happens next.</span></p>
    </article>
    <div class="profile-actions"><button class="action undo" data-action="undo" aria-label="Undo">↶</button><button class="decision pass-decision" data-action="pass" aria-label="Pass"><span>×</span>Pass</button><button class="decision shortlist-decision" data-pick="Full creator profile" aria-label="Shortlist"><span>＋</span>Shortlist</button><button class="action save" data-action="save" aria-label="Save">☆</button></div>`},

  profile: () => { const c=creators[state.creator%creators.length]; return `${pageTitle(c.name,'match')}<div class="creator-photo" style="height:225px;border-radius:22px;background-image:url('${c.image}')"><div class="match-orbit"><strong>${c.score}%</strong><small>MATCH</small></div></div>
    <div class="section-head"><h3>Channel snapshot</h3><span class="status">Brand safe</span></div><div class="metric-row"><div class="metric"><strong>${c.subs}</strong><span>subscribers</span></div><div class="metric"><strong>${c.eng}</strong><span>engagement</span></div><div class="metric"><strong>+18%</strong><span>90d growth</span></div></div>
    <div class="section-head"><h3>AI content read</h3></div><div class="brief-section"><h3>Science without the lecture</h3><p>Recent videos translate sports science into practical routines. The tone is curious, credible, and avoids exaggerated claims.</p><div class="chips"><span class="chip selected">Recovery</span><span class="chip selected">Hydration</span><span class="chip">Training</span></div></div>
    <div class="section-head"><h3>Performance consistency</h3></div><div class="campaign-card"><svg viewBox="0 0 320 70" width="100%" height="70" aria-label="Video view performance trend"><path d="M0 57 C35 42 45 50 73 31 S125 50 155 26 S208 35 233 15 S285 31 320 8" fill="none" stroke="#315cf5" stroke-width="4" stroke-linecap="round"/><path d="M0 60H320" stroke="#e3e7ef"/></svg><div class="row"><small>Last 12 videos</small><strong>+23% vs. baseline</strong></div></div>
    <button class="primary blue" style="width:100%" data-action="shortlist">Add to shortlist</button>`},

  pool: () => `${appHeader()}<span class="eyebrow">Creators pool</span><h1>Your human decision layer.</h1><div class="filter-row"><button class="chip selected">All 18</button><button class="chip">Shortlisted 8</button><button class="chip">Saved 10</button><button class="chip">Match 90%+</button></div>
    ${creators.map((c,i)=>`<article class="creator-list-item" data-go="profile"><input class="check" type="checkbox" ${i<2?'checked':''} onclick="event.stopPropagation()"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${c.subs} subs · ${c.niche}</p></div><span class="score">${c.score}%</span></article>`).join('')}
    <div class="section-head"><h3>Internal notes</h3></div><textarea placeholder="Add a note for your team…">Maya is first choice; check exclusivity window before outreach.</textarea><div class="compare-bar"><span><strong>2 selected</strong><br><small>Ready to compare</small></span><button data-go="compare">Compare →</button></div>`,

  compare: () => `${pageTitle('Compare creators','pool')}<span class="eyebrow">Side by side</span><h1>Two strong fits. Different strengths.</h1><div class="compare-grid"><div></div><div><strong>Maya</strong><br><span class="score">94%</span></div><div><strong>Devon</strong><br><span class="score">91%</span></div><div class="label">Audience fit</div><div>Excellent<br>68% women</div><div>Strong<br>54% women</div><div class="label">Avg. views</div><div>186K</div><div>244K</div><div class="label">Engagement</div><div>6.8%</div><div>5.4%</div><div class="label">Sponsor density</div><div>Low</div><div>Medium</div><div class="label">Best at</div><div>Trust & education</div><div>Scale & energy</div></div>
    <div class="ai-note" style="margin-top:14px"><strong>✦ Orbit’s take</strong><br>Maya is the better lead partner for credibility. Devon adds reach as a second voice if budget allows.</div><button class="primary blue" style="width:100%;margin-top:14px" data-go="messages">Start outreach</button>`,

  messages: () => `${appHeader()}<span class="eyebrow">Outreach</span><h1>Move from match to yes.</h1><div class="filter-row"><button class="chip selected">All</button><button class="chip">Responded 4</button><button class="chip">Follow-up 3</button></div>${creators.map((c,i)=>`<article class="thread" data-open-chat="${i}"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${i===0?'I’d love to hear more about the launch!':'Campaign fit, timing, and next steps…'}</p></div><div><time>${i===0?'9:18':'Tue'}</time><br><span class="status">${i===0?'Responded':i===1?'Delivered':'Follow-up'}</span></div></article>`).join('')}<button class="secondary" style="width:100%;margin-top:16px" id="draft">✦ Draft personalized outreach</button>`,

  chat: () => `${pageTitle('Maya Moves','messages')}<div class="chat"><div class="status">● Interested</div><div class="bubble">Hi Maya — your evidence-led approach to recovery feels like a natural fit for NovaFuel’s summer launch.</div><div class="bubble me">We’re planning one integrated YouTube feature plus 30-day usage rights. Budget range is $12–15K.</div><div class="bubble">I’d love to hear more about the launch! Mid-June could work for me.</div><div class="ai-note"><strong>✦ Suggested reply</strong><br>Great — I’ll send over a personalized brief with the creative direction and timeline.</div></div><div class="chatbox"><input value="Great — I’ll send over the brief." aria-label="Message"><button id="send">↑</button></div>`,

  workspace: () => `${appHeader()}<span class="eyebrow">Campaign workspace</span><h1>Summer Performance</h1><section class="workspace-summary"><div class="row"><div><small>CAMPAIGN HEALTH</small><h2 style="margin:5px 0">On track</h2></div><strong style="color:var(--mint)">72%</strong></div><p>2 creators interested · 1 brief approved · 3 items need attention</p></section><div class="section-head"><h3>Pipeline</h3><button>View board</button></div><div class="stage"><span class="stage-dot done">✓</span><div><strong>Discovery</strong><p class="muted" style="margin:2px 0;font-size:10px">18 creators shortlisted</p></div></div><div class="stage-line"></div><div class="stage"><span class="stage-dot done">✓</span><div><strong>Outreach</strong><p class="muted" style="margin:2px 0;font-size:10px">8 sent · 4 responded</p></div></div><div class="stage-line"></div><div class="stage"><span class="stage-dot">3</span><div><strong>Creator briefs</strong><p class="muted" style="margin:2px 0;font-size:10px">1 approved · 2 drafts</p></div></div>
    <div class="section-head"><h3>Needs attention</h3></div><article class="task-card" data-go="brief"><span class="stage-dot">✦</span><div><strong>Maya’s AI brief is ready</strong><p>Review creator-specific guidance and approve.</p></div></article><article class="task-card"><span class="stage-dot" style="background:#fff2df;color:#b16e00">!</span><div><strong>Follow up with Devon</strong><p>No response in 4 days.</p></div></article>`,

  brief: () => `${pageTitle('AI creator brief','workspace')}<span class="eyebrow">Draft for Maya Moves</span><h1>NovaFuel, made for the long run.</h1><div class="ai-note"><strong>✦ Personalized from 12 recent videos</strong><br>Guidance reflects Maya’s teaching style, audience questions, and strongest-performing formats.</div><div class="section-head"><h3>Objective</h3><button>Edit</button></div><section class="brief-section"><p>Introduce NovaFuel as the clean, evidence-led hydration habit that supports consistent training through summer.</p></section><section class="brief-section"><h3>Deliverables</h3><ul><li>1 × 60–90 sec YouTube integration</li><li>Product visible within first 4 minutes</li><li>30-day paid usage rights</li></ul></section><section class="brief-section"><h3>Creator-specific direction</h3><p>Use your “test it with me” format. Compare how you feel before and after a warm-weather run; explain electrolytes on a whiteboard, then return to the real-world result.</p></section><section class="brief-section"><h3>Must say / must avoid</h3><p><strong>Include:</strong> zero added sugar, third-party tested.<br><strong>Avoid:</strong> medical outcomes or guaranteed performance claims.</p></section><div class="form-actions"><button class="secondary">Export</button><button class="primary blue" id="approve">Approve brief</button></div>`
};

function render() {
  app.innerHTML = screens[state.screen]();
  app.scrollTop = 0;
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.nav===state.screen || (state.screen==='profile'&&b.dataset.nav==='match') || (state.screen==='compare'&&b.dataset.nav==='pool') || (state.screen==='chat'&&b.dataset.nav==='messages') || (state.screen==='brief'&&b.dataset.nav==='workspace')));
  bind();
}

function go(screen) { state.screen=screen; render(); }
function toast(message) { const t=document.querySelector('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1700); }
function bind() {
  app.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
  app.querySelectorAll('.chip').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('selected')));
  const reasonButton=app.querySelector('#reasonButton'); if(reasonButton) reasonButton.onclick=()=>{app.querySelector('#reasonDetail').classList.toggle('open');reasonButton.classList.toggle('open')};
  const next=app.querySelector('#nextStep'); if(next) next.onclick=()=>{ if(state.formStep<3){state.formStep++;render()} else {toast('136 creators analyzed');setTimeout(()=>go('match'),400)} };
  const prev=app.querySelector('#prevStep'); if(prev) prev.onclick=()=>{ if(state.formStep>1){state.formStep--;render()} else toast('Draft saved') };
  app.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
  app.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>openDecision(b.dataset.pick)));
  app.querySelectorAll('[data-open-chat]').forEach(el=>el.addEventListener('click',()=>go('chat')));
  const draft=app.querySelector('#draft'); if(draft) draft.onclick=()=>toast('Personalized draft created');
  const send=app.querySelector('#send'); if(send) send.onclick=()=>toast('Message sent');
  const approve=app.querySelector('#approve'); if(approve) approve.onclick=()=>{toast('Brief approved');setTimeout(()=>go('workspace'),500)};
}
function openDecision(context) {
  document.querySelector('#sheetContext').textContent=`Save ${context.toLowerCase()} as the reason your team should revisit this creator.`;
  document.querySelector('#decisionNote').value='';
  document.querySelector('#decisionSheet').classList.add('open');
  document.querySelector('#sheetBackdrop').classList.add('open');
}
function closeDecision() {
  document.querySelector('#decisionSheet').classList.remove('open');
  document.querySelector('#sheetBackdrop').classList.remove('open');
}
function act(action) {
  if(action==='undo') { if(state.creator>0) state.creator--; toast('Last choice undone'); render(); return; }
  const card=app.querySelector('#creatorCard');
  state.lastAction=action;
  if(action==='shortlist') { state.pool++; document.querySelector('#poolBadge').textContent=state.pool; }
  card?.classList.add(action==='pass'?'exit-left':'exit-right');
  toast(action==='pass'?'Passed — you can undo':action==='save'?'Saved for later':'Added to shortlist');
  setTimeout(()=>{state.creator++; render()},320);
}

nav.addEventListener('click',e=>{ const b=e.target.closest('[data-nav]'); if(b) go(b.dataset.nav); });
document.querySelector('#closeSheet').addEventListener('click',closeDecision);
document.querySelector('#sheetBackdrop').addEventListener('click',closeDecision);
document.querySelector('#decisionSheet').querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('selected')));
document.querySelector('#confirmDecision').addEventListener('click',()=>{state.pool++;document.querySelector('#poolBadge').textContent=state.pool;closeDecision();toast('Shortlisted with your note')});
render();
