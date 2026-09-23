const creators = [
  {name:'Yoga With Adriene', handle:'@yogawithadriene', niche:'Yoga & mindful movement', subs:'13.7M', views:'10.6M', eng:'4.8%', score:96, image:'assets/avatars/yoga-with-adriene.jpg', videoImage:'https://i.ytimg.com/vi/k2oe-PAHTR0/hqdefault.jpg', tags:['All levels','High trust'], prompt:'Channel signal', signal:'Gentle, accessible guidance turns a daily wellness habit into a welcoming community ritual.', videoTitle:'Yoga Morning Fresh · 35-minute practice', risk:'Established wellness partnerships · Review category exclusivity', why:'Adriene’s inclusive teaching style and broad wellness audience align strongly with an approachable hydration campaign. Her long-form routines also create natural product-use moments.'},
  {name:'Jeff Nippard', handle:'@JeffNippard', niche:'Evidence-based fitness', subs:'3M+', views:'4.1M', eng:'5.9%', score:93, image:'assets/avatars/jeff-nippard.jpg', videoImage:'https://i.ytimg.com/vi/k1Xr8rMK-Gw/hqdefault.jpg', tags:['Science-led','High intent'], prompt:'Channel signal', signal:'Research becomes practical training advice with clear visuals, tests, and specific takeaways.', videoTitle:'The most effective full-body workout for growth', risk:'High sponsor demand · Strong evidence-led brand fit', why:'Jeff’s audience actively seeks performance science and product evidence. The fit is strongest when messaging includes transparent ingredients and avoids broad wellness claims.'},
  {name:'Natacha Océane', handle:'@natachaoceane', niche:'Performance & wellbeing', subs:'1.63M', views:'1.4M', eng:'5.2%', score:91, image:'assets/avatars/natacha-oceane.jpg', videoImage:'https://i.ytimg.com/vi/m-im3XFx068/hqdefault.jpg', tags:['Performance','Experiment-led'], prompt:'Channel signal', signal:'Training experiments and athlete stories balance performance ambition with an approachable voice.', videoTitle:'I trained with the IronMan World Champion', risk:'Selective publishing cadence · Strong performance relevance', why:'Natacha combines sports science, personal experimentation, and candid storytelling. That creates a credible route to discuss hydration without turning the content into a product lecture.'},
  {name:'Caroline Girvan', handle:'@CarolineGirvan', niche:'Strength & home fitness', subs:'4M+', views:'2.2M', eng:'5.5%', score:89, image:'assets/avatars/caroline-girvan.jpg', videoImage:'https://i.ytimg.com/vi/-ZToTce0sWM/hqdefault.jpg', tags:['Program-led','High intent'], prompt:'Channel signal', signal:'Structured training programs give viewers a clear plan, a shared challenge, and a reason to return.', videoTitle:'40-minute leg workout · IRON PRO', risk:'Premium training ecosystem · Review category overlap', why:'Caroline’s program-led content reaches committed home-training audiences. Peakline fits naturally around session preparation and recovery when the message stays practical.'},
  {name:'Pick Up Limes', handle:'@PickUpLimes', niche:'Plant-based wellness', subs:'4.37M', views:'1.1M', eng:'5.7%', score:87, image:'assets/avatars/pick-up-limes.jpg', videoImage:'https://i.ytimg.com/vi/xNzZqVUl28E/hqdefault.jpg', tags:['Nutrition','Cinematic'], prompt:'Channel signal', signal:'Calm, beautifully produced food stories make nutrition feel useful rather than prescriptive.', videoTitle:'Simple plant-based habits for everyday energy', risk:'Premium production bar · Strong clean-label fit', why:'The channel pairs nutrition credibility with polished storytelling. Peakline fits best as part of a broader routine instead of a direct-response product demonstration.'},
  {name:'Chloe Ting', handle:'@ChloeTing', niche:'Home fitness', subs:'26.1M', views:'1.28M', eng:'4.4%', score:85, image:'assets/avatars/chloe-ting.jpg', videoImage:'https://i.ytimg.com/vi/4I-dymlpGOQ/hqdefault.jpg', tags:['Global reach','Workout series'], prompt:'Channel signal', signal:'Structured challenges give a global audience an easy reason to return and participate together.', videoTitle:'20-minute full-body HIIT · no jumping', risk:'High campaign volume · Excellent global scale', why:'Chloe offers exceptional reach and repeat participation. Campaign creative should prioritize a simple routine moment and localized claims for an international audience.'},
  {name:'Blogilates', handle:'@blogilates', niche:'Pilates & lifestyle', subs:'11M', views:'572K', eng:'4.9%', score:82, image:'assets/avatars/blogilates.jpg', videoImage:'https://i.ytimg.com/vi/86PciGuG7Sk/hqdefault.jpg', tags:['Pilates','Founder-led'], prompt:'Channel signal', signal:'Energetic classes, product-building stories, and a recognizable host-led format drive loyalty.', videoTitle:'25-minute complete leg workout', risk:'Founder-owned product ecosystem · Check conflicts', why:'Cassey’s founder-led audience responds to energy and participation. Brand fit is promising, though product-category conflicts should be reviewed before outreach.'}
];

const state = {screen:'home', creator:0, lastAction:null, pool:3, formStep:1, selectedCompare:2, reviewComplete:false};
const app = document.querySelector('#app');
const nav = document.querySelector('.tabbar');

const appHeader = () => `<header class="topline"><div class="brand"><span class="brandmark"></span>Orbit</div><div class="avatar">AC</div></header>`;
const pageTitle = (title, back='home') => `<div class="screen-title"><button class="back" data-go="${back}" aria-label="Go back">←</button><h2>${title}</h2></div>`;
const geminiBadge = (label='Gemini analysis') => `<span class="source-badge gemini"><img src="assets/brands/gemini.svg" alt="">${label}</span>`;
const youtubeBadge = (label='YouTube public data') => `<span class="source-badge youtube"><img src="assets/brands/youtube.svg" alt="">${label}</span>`;
const fitSignals = creator => ({
  audience: creator.score,
  brand: Math.max(78, creator.score - 3),
  momentum: Math.max(76, creator.score - 7),
  safety: Math.max(80, creator.score - 1)
});

const screens = {
  home: () => `${appHeader()}
    <section class="hero"><span class="spark">✦</span><span class="eyebrow">Creator partnership OS</span><h1>Move from brief to booked.</h1><p>Build a defensible shortlist, manage outreach, and keep every creator activation on track.</p><div class="hero-actions"><button class="primary" data-go="create">New campaign →</button><button class="hero-sample" id="sampleCampaign">Open sample</button></div><div class="brand-badges hero-sources">${geminiBadge('Gemini reasoning')}${youtubeBadge('YouTube signals')}</div></section>
    <div class="section-head"><h3>Active campaign</h3><button data-go="workspace">View campaign</button></div>
    <article class="campaign-card" data-go="workspace"><div class="row"><div><span class="eyebrow">Peakline Hydration · US</span><h3>Summer Training Launch</h3></div><span class="status">● In outreach</span></div><div class="progress"><span style="width:58%"></span></div><div class="row"><small>8 of 12 creator slots</small><small>$31.5K of $45K committed</small></div></article>
    <article class="acceleration-mini" data-go="workspace"><div><span>AI-assisted planning</span><strong>14h</strong><small>estimated manual work avoided</small></div><span class="time-arrow">→</span><div><span>Time to shortlist</span><strong>12m</strong><small>from approved brief</small></div></article>
    <div class="section-head"><h3>Needs attention</h3></div><div class="metric-row"><div class="metric"><strong>3</strong><span>client approvals</span></div><div class="metric"><strong>4</strong><span>creator replies</span></div><div class="metric"><strong>2</strong><span>drafts due</span></div></div>
    <div class="section-head"><h3>Recent campaigns</h3><button>View all</button></div><article class="campaign-card"><div class="row"><div><span class="eyebrow">Aster Labs</span><h3>Morning Reset</h3><p>Completed · 6 creators</p></div><span class="status neutral">Report ready</span></div></article>`,

  create: () => `${pageTitle('Create campaign')}<div class="stepper">${[1,2,3,4].map(i=>`<span class="${i<=state.formStep?'on':''}"></span>`).join('')}</div>${state.formStep===1?`
    <div class="wizard-head"><span class="eyebrow">1 of 4 · Goal</span><button id="sampleBrief">Use sample brief</button></div><h1>What should this campaign achieve?</h1><p class="wizard-help">Pick one. You can fine-tune everything later.</p>
    <div class="choice-stack"><button class="choice-card selected"><span>◉</span><div><strong>Launch a product</strong><small>Build awareness and explain what makes it different.</small></div></button><button class="choice-card"><span>○</span><div><strong>Grow awareness</strong><small>Reach more of the right audience.</small></div></button><button class="choice-card"><span>○</span><div><strong>Drive action</strong><small>Generate trials, sign-ups, or sales.</small></div></button></div>`:state.formStep===2?`
    <span class="eyebrow">2 of 4 · Audience</span><h1>Who are you trying to reach?</h1><p class="wizard-help">Choose a starting point. Orbit will infer the rest.</p>
    <div class="chips large"><button class="chip selected">Active women 25–40</button><button class="chip">Everyday athletes</button><button class="chip">Wellness beginners</button><button class="chip">Endurance runners</button></div><label>Optional detail</label><input value="US audience interested in fitness, outdoors, and clean-label products" />`:state.formStep===3?`
    <span class="eyebrow">3 of 4 · Budget</span><h1>What can you invest in creators?</h1><p class="wizard-help">A range is enough for the first match.</p>
    <div class="choice-stack"><button class="choice-card"><span>○</span><div><strong>Under $15K</strong><small>Focused test with micro creators.</small></div></button><button class="choice-card selected"><span>◉</span><div><strong>$25K–$50K</strong><small>Balanced reach and creator variety.</small></div></button><button class="choice-card"><span>○</span><div><strong>$50K+</strong><small>Multiple creators and larger channels.</small></div></button></div>`:`
    <span class="eyebrow">4 of 4 · Brief intelligence</span><h1>Review what Orbit will match.</h1><p class="wizard-help">Gemini extracted the criteria below from the campaign inputs and attached brief.</p>
    <div class="chips large"><button class="chip selected">Evidence-led</button><button class="chip selected">Optimistic</button><button class="chip selected">Story-first</button><button class="chip">Comedy</button><button class="chip">Cinematic</button></div>
    <div class="campaign-summary"><span class="ai-star">✦</span><div><strong>Peakline · Summer Training Launch</strong><p>Product launch · Active women 25–40 · $25K–$50K</p></div></div>
    <section class="brief-extract"><div class="brand-badges">${geminiBadge('Brief parsed with Gemini')}</div><div class="extract-grid"><div><span>Primary goal</span><strong>Credible product education</strong></div><div><span>Best-fit audience</span><strong>Active women 25–40</strong></div><div><span>Match weights</span><strong>Audience 35 · Content 30</strong></div><div><span>Guardrails</span><strong>No medical or guaranteed claims</strong></div></div><button class="text-action" id="editCriteria">Edit extracted criteria</button></section>
    <div class="upload compact"><div><strong>＋ Replace client brief</strong><br><span>PDF, DOCX, or shared document</span></div></div>`}
    <div class="form-actions"><button class="secondary" id="prevStep">${state.formStep===1?'Save draft':'Back'}</button><button class="primary blue" id="nextStep">${state.formStep===4?'Find creators ✦':'Continue'}</button></div>`,

  match: () => { const c=creators[state.creator%creators.length], fit=fitSignals(c); return `<div class="discover-top"><button class="campaign-switch"><span>Peakline · Summer Training</span>⌄</button><span class="counter">${state.creator%creators.length+1} of 7 samples</span></div>
    <article class="profile-stream" id="creatorCard">
      <div class="swipe-stamp skip" aria-hidden="true">PASS</div><div class="swipe-stamp keep" aria-hidden="true">SHORTLIST</div>
      <section class="profile-hero" style="background-image:url('${c.image}')"><div class="hero-shade"></div><button class="more" aria-label="More creator options">•••</button></section>
      <section class="profile-identity"><div class="profile-name"><div class="profile-title"><span class="active-dot"></span><h1>${c.name}</h1></div><p>${c.handle}<span aria-hidden="true"> · </span>${c.niche}</p></div><button class="content-pick" data-pick="Profile introduction" aria-label="Shortlist profile introduction">＋</button></section>
      <div class="profile-actions"><button class="action undo" data-action="undo" aria-label="Undo">↶</button><button class="decision pass-decision" data-action="pass" aria-label="Pass"><span>×</span>Pass</button><button class="decision shortlist-decision" data-pick="Full creator profile" aria-label="Shortlist"><span>＋</span>Shortlist</button><button class="action save" data-action="save" aria-label="Save">☆</button></div>
      <section class="profile-facts"><div><strong>${c.subs}</strong><small>SUBSCRIBERS</small></div><div><strong>${c.views}</strong><small>AVG. VIEWS</small></div><div><strong>${c.eng}</strong><small>ENGAGEMENT</small></div><div class="fit-pill"><strong>${c.score}</strong><small>FIT SCORE</small></div></section>
      <section class="profile-prompt"><span class="prompt-label">Content fit</span><div class="signal-copy">${c.signal}</div><button class="content-pick dark" data-pick="Creator voice and community" aria-label="Shortlist creator prompt">＋</button></section>
      <section class="video-story" style="background-image:url('${c.videoImage}')"><div class="video-overlay"><span class="video-kicker"><img src="assets/brands/youtube.svg" alt=""> PUBLIC YOUTUBE VIDEO</span><h2>${c.videoTitle}</h2><span class="watch">▶ Review source</span></div><button class="content-pick" data-pick="Recent content performance" aria-label="Shortlist recent video">＋</button></section>
      <section class="match-memo"><div class="brand-badges memo-badges">${geminiBadge('Gemini fit analysis')}${youtubeBadge('12 uploads checked')}</div><div class="memo-top"><span class="ai-star">✦</span><div><span class="eyebrow">Explainable fit</span><h2>Why this creator fits the brief.</h2></div></div><p>${c.why}</p><div class="evidence-row"><span>Audience fit · 35% weight <b>${fit.audience}</b></span><span>Content alignment · 30% <b>${fit.brand}</b></span><span>Momentum · 20% <b>${fit.momentum}</b></span><span>Brand safety · 15% <b>${fit.safety}</b></span></div><button class="evidence-toggle" id="reasonButton">Review evidence and sources <span>↓</span></button><div class="evidence-detail" id="reasonDetail"><p><strong>Evidence:</strong> campaign brief v3, public channel metadata, and 12 recent YouTube uploads. Updated Sep 18. Public sponsorship signals require human verification.</p></div><button class="content-pick blue" data-pick="AI match evidence" aria-label="Shortlist AI match reason">＋</button></section>
      <section class="safety-card"><div><span class="eyebrow">Collaboration read</span><h3>${c.risk}</h3></div><span class="safety-mark">✓</span></section>
      <p class="end-note">Review complete for ${c.name}.<br><span>Pass, save, or add to the client shortlist.</span></p>
    </article>`},

  profile: () => { const c=creators[state.creator%creators.length], fit=fitSignals(c); return `${pageTitle(c.name,'match')}<div class="brand-badges profile-sources">${geminiBadge('Gemini analysis')}${youtubeBadge('Public channel data')}</div><div class="creator-photo" style="height:225px;border-radius:22px;background-image:url('${c.image}')"><div class="match-orbit"><strong>${c.score}</strong><small>FIT</small></div></div>
    <div class="section-head"><h3>Channel snapshot</h3><span class="status">Brand safe</span></div><div class="metric-row"><div class="metric"><strong>${c.subs}</strong><span>subscribers</span></div><div class="metric"><strong>${c.eng}</strong><span>engagement</span></div><div class="metric"><strong>+18%</strong><span>90d growth</span></div></div>
    <div class="section-head"><h3>Explainable fit score</h3><span class="score">${c.score}/100</span></div><section class="score-breakdown"><div><span>Audience fit <small>35%</small></span><div><i style="width:${fit.audience}%"></i></div><b>${fit.audience}</b></div><div><span>Content alignment <small>30%</small></span><div><i style="width:${fit.brand}%"></i></div><b>${fit.brand}</b></div><div><span>Momentum <small>20%</small></span><div><i style="width:${fit.momentum}%"></i></div><b>${fit.momentum}</b></div><div><span>Brand safety <small>15%</small></span><div><i style="width:${fit.safety}%"></i></div><b>${fit.safety}</b></div></section>
    <div class="section-head"><h3>Recent content evidence</h3></div><section class="evidence-list"><article><img src="assets/brands/youtube.svg" alt=""><div><strong>12 recent uploads analyzed</strong><small>Titles, descriptions, topics, cadence and public performance</small></div></article><article><span>↗</span><div><strong>+23% vs. channel baseline</strong><small>Recent view performance is trending above the prior period</small></div></article><article><span>◎</span><div><strong>${c.signal}</strong><small>Recurring content pattern identified by Gemini</small></div></article></section>
    <div class="section-head"><h3>Content fit</h3></div><div class="brief-section"><h3>${c.tags[0]} · ${c.tags[1]}</h3><p>${c.why}</p><div class="chips"><span class="chip selected">Recovery</span><span class="chip selected">Hydration</span><span class="chip">Training</span></div></div>
    <button class="primary blue" style="width:100%" data-action="shortlist">Add to shortlist</button>`},

  pool: () => `${appHeader()}<span class="eyebrow">Shortlist review</span><h1>Build the client shortlist.</h1><div class="filter-row"><button class="chip selected">7 sample profiles</button><button class="chip">Client-ready 4</button><button class="chip">Saved 3</button><button class="chip">Fit 90+</button></div>
    ${creators.map((c,i)=>`<article class="creator-list-item" data-go="profile"><input class="check" type="checkbox" ${i<2?'checked':''} onclick="event.stopPropagation()"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${c.subs} subs · ${c.niche}</p></div><span class="score">Fit ${c.score}</span></article>`).join('')}
    <div class="section-head"><h3>Review note</h3></div><textarea placeholder="Add a note for your team…">Adriene is the strongest trust fit; confirm wellness category exclusivity before client review.</textarea><div class="compare-bar"><span><strong>2 selected</strong><br><small>Compare fit, cost & risk</small></span><button data-go="compare">Compare →</button></div>`,

  compare: () => `${pageTitle('Compare finalists','pool')}<span class="eyebrow">Client review</span><h1>Choose the right role for each creator.</h1><div class="compare-grid"><div></div><div><strong>Adriene</strong><br><span class="score">Fit 96</span></div><div><strong>Jeff</strong><br><span class="score">Fit 93</span></div><div class="label">Audience</div><div>Broad wellness</div><div>High-intent fitness</div><div class="label">Est. fee</div><div>$12–15K</div><div>$18–22K</div><div class="label">Content role</div><div>Trust & habit</div><div>Proof & detail</div><div class="label">Conflict risk</div><div>Review</div><div>Low</div><div class="label">Client status</div><div>Ready</div><div>Ready</div></div>
    <div class="ai-note" style="margin-top:14px"><div class="brand-badges">${geminiBadge('Gemini recommendation')}</div><strong>Lead with Adriene for trust and daily habit.</strong><br>Use Jeff as the evidence-led supporting partner if budget allows. Human approval is still required.</div><button class="primary blue" style="width:100%;margin-top:14px" data-go="messages">Prepare outreach</button>`,

  messages: () => `${appHeader()}<span class="eyebrow">Outreach desk</span><h1>Keep outreach moving.</h1><div class="brand-badges page-badges">${geminiBadge('Personalized drafts')}</div><div class="filter-row"><button class="chip selected">All conversations</button><button class="chip">Needs reply 4</button><button class="chip">Follow-up 3</button></div>${creators.map((c,i)=>`<article class="thread" data-open-chat="${i}"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${i===0?'I’d love to hear more about the launch!':'Campaign fit, timing, and next steps…'}</p></div><div><time>${i===0?'9:18':'Tue'}</time><br><span class="status">${i===0?'Responded':i===1?'Delivered':'Follow-up'}</span></div></article>`).join('')}<button class="secondary" style="width:100%;margin-top:16px" id="draft"><img class="button-icon" src="assets/brands/gemini.svg" alt=""> Draft follow-up</button>`,

  chat: () => `${pageTitle('Yoga With Adriene','messages')}<div class="chat"><div class="status">● Interested</div><div class="bubble">Hi Adriene — your welcoming approach to movement feels like a natural fit for Peakline’s summer training launch.</div><div class="bubble me">We’re planning one integrated YouTube feature plus 30-day usage rights. Budget range is $12–15K.</div><div class="bubble">I’d love to hear more about the launch! Mid-June could work for our team.</div><div class="ai-note"><strong>✦ Suggested reply</strong><br>Great — I’ll send over the creator brief, review dates, and usage terms.</div></div><div class="chatbox"><input value="Great — I’ll send over the brief." aria-label="Message"><button id="send">↑</button></div>`,

  workspace: () => `${appHeader()}<span class="eyebrow">Peakline Hydration · US</span><h1>Summer Training Launch</h1><div class="campaign-meta"><span>Owner · A. Chen</span><span>Jun 3–Jul 26</span></div>
    <section class="workspace-summary"><div class="row"><small>NEXT MILESTONE</small><span class="status warning">Due today</span></div><h2>Client shortlist approval</h2><p>4 candidates are ready for client review. Two have unresolved category conflicts.</p><button class="workspace-cta" data-go="pool">Review shortlist →</button></section>
    <div class="workspace-kpis"><article><span>Budget committed</span><strong>$31.5K</strong><small>of $45K</small></article><article><span>Creators confirmed</span><strong>4</strong><small>of 8 target</small></article><article><span>Deliverables approved</span><strong>3</strong><small>of 12</small></article><article><span>Next publish</span><strong>Jun 18</strong><small>Adriene</small></article></div>
    <section class="acceleration-card"><div class="brand-badges">${geminiBadge('AI-assisted workflow')}${youtubeBadge('Public video evidence')}</div><div class="time-compare"><div><span>Manual estimate</span><strong>14h 20m</strong></div><i>→</i><div><span>Orbit run</span><strong>12m</strong></div></div><small>Estimated across creator research, scoring, brief drafting and first-pass review.</small></section>
    <div class="section-head"><h3>Needs action</h3><button>4 open</button></div>
    <article class="action-card urgent" data-go="pool"><span class="action-icon">1</span><div><strong>Resolve category conflict</strong><p>Yoga With Adriene · wellness exclusivity</p><small>Owner: Maya · Due today</small></div><span>›</span></article>
    <article class="action-card" data-go="brief"><span class="action-icon">2</span><div><strong>Send creator brief</strong><p>Client notes approved for Adriene</p><small>Owner: Alex · Due tomorrow</small></div><span>›</span></article>
    <article class="action-card urgent" data-go="review"><span class="action-icon">3</span><div><strong>Review creator draft</strong><p>Adriene · 2 claims need attention</p><small>Owner: Maya · Due tomorrow</small></div><span>›</span></article>
    <article class="action-card"><span class="action-icon">4</span><div><strong>Follow up on rate</strong><p>Jeff Nippard · no reply in 4 days</p><small>Owner: Sam · Due Sep 24</small></div><span>›</span></article>
    <div class="section-head"><h3>Creator pipeline</h3><button data-go="messages">Open outreach</button></div>
    <section class="pipeline-list"><article><img src="${creators[0].image}" alt="Yoga With Adriene"><div><strong>Yoga With Adriene</strong><small>Brief ready · $12–15K</small></div><span class="status">Interested</span></article><article><img src="${creators[1].image}" alt="Jeff Nippard"><div><strong>Jeff Nippard</strong><small>Rate pending · $18–22K</small></div><span class="status warning">Follow-up</span></article><article><img src="${creators[2].image}" alt="Natacha Océane"><div><strong>Natacha Océane</strong><small>Client review · $9–12K</small></div><span class="status neutral">Review</span></article></section>
    <div class="section-head"><h3>Campaign files</h3><button>View all</button></div><section class="file-list"><button><span>▤</span><div><strong>Client brief v3</strong><small>Updated today · PDF</small></div><b>›</b></button><button data-go="brief"><span>✦</span><div><strong>Creator brief · Adriene</strong><small>Ready to send</small></div><b>›</b></button><button data-go="review"><span>✓</span><div><strong>Draft review · Adriene</strong><small>2 claims need attention</small></div><b>›</b></button></section>`,

  brief: () => `${pageTitle('Creator brief','workspace')}<span class="eyebrow">Yoga With Adriene · Ready to send</span><h1>Hydration that keeps up.</h1><div class="brand-badges page-badges">${geminiBadge('Generated with Gemini')}${youtubeBadge('12 uploads referenced')}</div><div class="ai-note"><strong>Adapted from campaign requirements and creator evidence</strong><br>Routine-led integrations, calm teaching language and audience accessibility were recurring patterns in the public content reviewed.</div><div class="section-head"><h3>Why this direction</h3><button data-go="profile">View evidence</button></div><section class="trace-card"><div><span>Creator signal</span><strong>Warm, routine-led teaching</strong></div><i>→</i><div><span>Brief decision</span><strong>Use setup or wind-down</strong></div></section><div class="section-head"><h3>Objective</h3><button>Edit</button></div><section class="brief-section"><p>Introduce Peakline as the clean, evidence-led hydration habit that supports consistent movement through summer.</p></section><section class="brief-section"><h3>Deliverables</h3><ul><li>1 × 60–90 sec YouTube integration</li><li>Product visible within first 4 minutes</li><li>30-day paid usage rights</li></ul></section><section class="brief-section"><h3>Creator-specific direction</h3><p>Integrate Peakline into the setup or wind-down of a warm-weather practice. Keep the teaching calm, inclusive, and centered on consistency rather than performance pressure.</p></section><section class="brief-section"><h3>Must say / must avoid</h3><p><strong>Include:</strong> zero added sugar, third-party tested.<br><strong>Avoid:</strong> medical outcomes or guaranteed performance claims.</p></section><button class="secondary review-link" data-go="review"><img class="button-icon" src="assets/brands/gemini.svg" alt=""> Review a creator draft</button><div class="form-actions"><button class="secondary">Export</button><button class="primary blue" id="approve">Approve & send</button></div>`,

  review: () => `${pageTitle('Draft review','workspace')}<span class="eyebrow">Creation & engagement</span><h1>Check the draft against the brief.</h1><div class="brand-badges page-badges">${geminiBadge('Gemini review')}${youtubeBadge('YouTube deliverable')}</div><p class="wizard-help">Paste a creator script, title or description. Orbit checks campaign requirements, approved claims and creator-specific guidance.</p><label for="draftContent">Creator draft · Yoga With Adriene</label><textarea id="draftContent" class="draft-input">After a warm practice, Peakline helps prevent fatigue and keeps you performing at your best. It has zero added sugar and is the best hydration mix for every workout.</textarea>${state.reviewComplete?`<section class="review-summary"><div><span class="status warning">Needs changes</span><strong>2 claims need attention</strong><small>4 requirements passed · Human approval required</small></div><span class="review-score">82</span></section><section class="issue-list"><article class="issue-card pass"><span>✓</span><div><strong>Approved product fact</strong><p>“Zero added sugar” matches the approved claim sheet.</p></div></article><article class="issue-card warning"><span>!</span><div><strong>Unsupported performance claim</strong><p>“Helps prevent fatigue” implies a health or performance outcome not supported by the brief.</p><blockquote>Suggested: “fits naturally into my post-practice hydration routine.”</blockquote></div></article><article class="issue-card warning"><span>!</span><div><strong>Unsubstantiated comparison</strong><p>“The best hydration mix” requires comparative evidence.</p><blockquote>Suggested: “a simple hydration option for warm-weather movement.”</blockquote></div></article></section><div class="review-sources"><strong>Checked against</strong><span>Client brief v3</span><span>Approved claims sheet</span><span>Creator brief · Adriene</span></div><div class="review-actions"><button class="secondary" id="applyRewrite">Apply safe rewrite</button><button class="primary blue" id="sendReview">Send for approval</button></div>`:`<button class="primary blue run-review" id="runReview"><img class="button-icon invert" src="assets/brands/gemini.svg" alt=""> Analyze draft</button><p class="review-footnote">First-pass review only. Final legal and brand approval remains with the campaign team.</p>`}`
};

function render() {
  app.innerHTML = screens[state.screen]();
  app.scrollTop = 0;
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.nav===state.screen || (state.screen==='profile'&&b.dataset.nav==='match') || (state.screen==='compare'&&b.dataset.nav==='pool') || (state.screen==='chat'&&b.dataset.nav==='messages') || (['brief','review'].includes(state.screen)&&b.dataset.nav==='workspace')));
  bind();
}

function go(screen) { state.screen=screen; render(); }
function toast(message) { const t=document.querySelector('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1700); }
function bind() {
  app.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
  app.querySelectorAll('.chip').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('selected')));
  app.querySelectorAll('.choice-stack').forEach(group=>group.querySelectorAll('.choice-card').forEach(card=>card.addEventListener('click',()=>{group.querySelectorAll('.choice-card').forEach(c=>{c.classList.remove('selected');c.querySelector('span').textContent='○'});card.classList.add('selected');card.querySelector('span').textContent='◉'})));
  const reasonButton=app.querySelector('#reasonButton'); if(reasonButton) reasonButton.onclick=()=>{app.querySelector('#reasonDetail').classList.toggle('open');reasonButton.classList.toggle('open')};
  const next=app.querySelector('#nextStep'); if(next) next.onclick=()=>{ if(state.formStep<4){state.formStep++;render()} else {toast('7 sample profiles ranked');setTimeout(()=>go('match'),400)} };
  const prev=app.querySelector('#prevStep'); if(prev) prev.onclick=()=>{ if(state.formStep>1){state.formStep--;render()} else toast('Draft saved') };
  const sampleCampaign=app.querySelector('#sampleCampaign'); if(sampleCampaign) sampleCampaign.onclick=()=>{state.formStep=4;go('create')};
  const sampleBrief=app.querySelector('#sampleBrief'); if(sampleBrief) sampleBrief.onclick=()=>{state.formStep=4;render();toast('Sample brief loaded')};
  const editCriteria=app.querySelector('#editCriteria'); if(editCriteria) editCriteria.onclick=()=>toast('Criteria are ready to edit');
  app.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
  app.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>openDecision(b.dataset.pick)));
  app.querySelectorAll('[data-open-chat]').forEach(el=>el.addEventListener('click',()=>go('chat')));
  const draft=app.querySelector('#draft'); if(draft) draft.onclick=()=>toast('Personalized draft created');
  const send=app.querySelector('#send'); if(send) send.onclick=()=>toast('Message sent');
  const approve=app.querySelector('#approve'); if(approve) approve.onclick=()=>{toast('Brief approved');setTimeout(()=>go('workspace'),500)};
  const runReview=app.querySelector('#runReview'); if(runReview) runReview.onclick=()=>{state.reviewComplete=true;render();toast('Draft checked against 3 sources')};
  const applyRewrite=app.querySelector('#applyRewrite'); if(applyRewrite) applyRewrite.onclick=()=>{const draft=app.querySelector('#draftContent');draft.value='After a warm practice, Peakline fits naturally into my post-practice hydration routine. It has zero added sugar and is a simple hydration option for warm-weather movement.';toast('Safe rewrite applied')};
  const sendReview=app.querySelector('#sendReview'); if(sendReview) sendReview.onclick=()=>{toast('Sent for human approval');setTimeout(()=>go('workspace'),600)};
  const swipeCard=app.querySelector('#creatorCard'); if(swipeCard) bindSwipe(swipeCard);
}
function bindSwipe(card) {
  let startX=0, startY=0, dx=0, tracking=false, horizontal=false;
  const skip=card.querySelector('.swipe-stamp.skip');
  const keep=card.querySelector('.swipe-stamp.keep');
  const reset=()=>{card.classList.remove('dragging');card.style.transform='';skip.style.opacity='';keep.style.opacity='';tracking=false;horizontal=false;dx=0};
  card.addEventListener('pointerdown',event=>{
    if(event.target.closest('button, input, textarea, select')) return;
    startX=event.clientX;startY=event.clientY;tracking=true;horizontal=false;dx=0;
  });
  card.addEventListener('pointermove',event=>{
    if(!tracking) return;
    const moveX=event.clientX-startX, moveY=event.clientY-startY;
    if(!horizontal && Math.abs(moveY)>Math.abs(moveX)+8){tracking=false;return;}
    if(!horizontal && Math.abs(moveX)>10){horizontal=true;card.classList.add('dragging');card.setPointerCapture?.(event.pointerId);}
    if(!horizontal) return;
    event.preventDefault();dx=Math.max(-150,Math.min(150,moveX));
    card.style.transform=`translateX(${dx}px) rotate(${dx/28}deg)`;
    skip.style.opacity=dx<0?Math.min(1,Math.abs(dx)/75):0;
    keep.style.opacity=dx>0?Math.min(1,Math.abs(dx)/75):0;
  });
  const finish=()=>{
    if(!tracking && !horizontal) return;
    const decision=Math.abs(dx)>82?(dx<0?'pass':'shortlist'):null;
    reset();
    if(decision) act(decision);
  };
  card.addEventListener('pointerup',finish);
  card.addEventListener('pointercancel',reset);
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
  if(action==='undo') { if(state.creator>0) state.creator--; if(state.lastAction==='shortlist') state.pool=Math.max(0,state.pool-1); document.querySelector('#poolBadge').textContent=state.pool; state.lastAction=null; toast('Last choice undone'); render(); return; }
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
