const creators = [
  {name:'Yoga With Adriene', handle:'@yogawithadriene', niche:'Yoga & mindful movement', subs:'13.7M', views:'10.6M', eng:'4.8%', score:96, image:'assets/avatars/yoga-with-adriene.jpg', videoImage:'https://i.ytimg.com/vi/k2oe-PAHTR0/hqdefault.jpg', tags:['All levels','High trust'], prompt:'Channel signal', signal:'Gentle, accessible guidance turns a daily wellness habit into a welcoming community ritual.', videoTitle:'Yoga Morning Fresh · 35-minute practice', risk:'Established wellness partnerships · Review category exclusivity', why:'Adriene’s inclusive teaching style and broad wellness audience align strongly with an approachable hydration campaign. Her long-form routines also create natural product-use moments.'},
  {name:'Jeff Nippard', handle:'@JeffNippard', niche:'Evidence-based fitness', subs:'3M+', views:'4.1M', eng:'5.9%', score:93, image:'assets/avatars/jeff-nippard.jpg', videoImage:'https://i.ytimg.com/vi/k1Xr8rMK-Gw/hqdefault.jpg', tags:['Science-led','High intent'], prompt:'Channel signal', signal:'Research becomes practical training advice with clear visuals, tests, and specific takeaways.', videoTitle:'The most effective full-body workout for growth', risk:'High sponsor demand · Strong evidence-led brand fit', why:'Jeff’s audience actively seeks performance science and product evidence. The fit is strongest when messaging includes transparent ingredients and avoids broad wellness claims.'},
  {name:'Natacha Océane', handle:'@natachaoceane', niche:'Performance & wellbeing', subs:'1.63M', views:'1.4M', eng:'5.2%', score:91, image:'assets/avatars/natacha-oceane.jpg', videoImage:'https://i.ytimg.com/vi/m-im3XFx068/hqdefault.jpg', tags:['Performance','Experiment-led'], prompt:'Channel signal', signal:'Training experiments and athlete stories balance performance ambition with an approachable voice.', videoTitle:'I trained with the IronMan World Champion', risk:'Selective publishing cadence · Strong performance relevance', why:'Natacha combines sports science, personal experimentation, and candid storytelling. That creates a credible route to discuss hydration without turning the content into a product lecture.'},
  {name:'Caroline Girvan', handle:'@CarolineGirvan', niche:'Strength & home fitness', subs:'4M+', views:'2.2M', eng:'5.5%', score:89, image:'assets/avatars/caroline-girvan.jpg', videoImage:'https://i.ytimg.com/vi/-ZToTce0sWM/hqdefault.jpg', tags:['Program-led','High intent'], prompt:'Channel signal', signal:'Structured training programs give viewers a clear plan, a shared challenge, and a reason to return.', videoTitle:'40-minute leg workout · IRON PRO', risk:'Premium training ecosystem · Review category overlap', why:'Caroline’s program-led content reaches committed home-training audiences. Peakline fits naturally around session preparation and recovery when the message stays practical.'},
  {name:'Pick Up Limes', handle:'@PickUpLimes', niche:'Plant-based wellness', subs:'4.37M', views:'1.1M', eng:'5.7%', score:87, image:'assets/avatars/pick-up-limes.jpg', videoImage:'https://i.ytimg.com/vi/xNzZqVUl28E/hqdefault.jpg', tags:['Nutrition','Cinematic'], prompt:'Channel signal', signal:'Calm, beautifully produced food stories make nutrition feel useful rather than prescriptive.', videoTitle:'Simple plant-based habits for everyday energy', risk:'Premium production bar · Strong clean-label fit', why:'The channel pairs nutrition credibility with polished storytelling. Peakline fits best as part of a broader routine instead of a direct-response product demonstration.'},
  {name:'Chloe Ting', handle:'@ChloeTing', niche:'Home fitness', subs:'26.1M', views:'1.28M', eng:'4.4%', score:85, image:'assets/avatars/chloe-ting.jpg', videoImage:'https://i.ytimg.com/vi/4I-dymlpGOQ/hqdefault.jpg', tags:['Global reach','Workout series'], prompt:'Channel signal', signal:'Structured challenges give a global audience an easy reason to return and participate together.', videoTitle:'20-minute full-body HIIT · no jumping', risk:'High campaign volume · Excellent global scale', why:'Chloe offers exceptional reach and repeat participation. Campaign creative should prioritize a simple routine moment and localized claims for an international audience.'},
  {name:'Blogilates', handle:'@blogilates', niche:'Pilates & lifestyle', subs:'11M', views:'572K', eng:'4.9%', score:82, image:'assets/avatars/blogilates.jpg', videoImage:'https://i.ytimg.com/vi/86PciGuG7Sk/hqdefault.jpg', tags:['Pilates','Founder-led'], prompt:'Channel signal', signal:'Energetic classes, product-building stories, and a recognizable host-led format drive loyalty.', videoTitle:'25-minute complete leg workout', risk:'Founder-owned product ecosystem · Check conflicts', why:'Cassey’s founder-led audience responds to energy and participation. Brand fit is promising, though product-category conflicts should be reviewed before outreach.'}
];

const initialScreen = new URLSearchParams(window.location.search).get('mode') === 'workspace' ? 'home' : 'welcome';
const state = {screen:initialScreen, onboardingStep:1, tourActive:false, tourStep:0, creator:0, lastAction:null, pool:3, formStep:1, compareSelection:[0,1], reviewComplete:false};
const app = document.querySelector('#app');
const nav = document.querySelector('.tabbar');
const phone = document.querySelector('.phone');
const deviceButtons = document.querySelectorAll('[data-device]');
const viewButtons = document.querySelectorAll('[data-demo-view]');
let tourSpotlightFrame=null;

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
const compareDetails = [
  {audience:'Broad wellness',fee:'$12–15K',role:'Trust & habit',risk:'Review'},
  {audience:'High-intent fitness',fee:'$18–22K',role:'Proof & detail',risk:'Low'},
  {audience:'Performance wellness',fee:'$9–12K',role:'Experiment story',risk:'Low'},
  {audience:'Home strength',fee:'$14–18K',role:'Program integration',risk:'Review'},
  {audience:'Plant-based wellness',fee:'$10–14K',role:'Lifestyle story',risk:'Low'},
  {audience:'Global fitness',fee:'$20–25K',role:'Scaled routine',risk:'Review'},
  {audience:'Pilates lifestyle',fee:'$12–16K',role:'Community energy',risk:'Conflict'}
];

const tourSteps = [
  {screen:'home', target:'[data-tour="create"]', kicker:'Campaign setup', title:'Start with the brief.', copy:'Create the campaign Orbit will use to rank creators.'},
  {screen:'create', target:'#tourGoal', kicker:'Campaign goal', title:'Choose the outcome.', copy:'Start with the job the creator partnership needs to do.'},
  {screen:'create', target:'#tourAudience', kicker:'Target audience', title:'Choose the audience.', copy:'Set the people this campaign must reach and influence.'},
  {screen:'create', target:'#tourBudget', kicker:'Creator budget', title:'Set the investment range.', copy:'Orbit uses budget to balance reach, fit and creator mix.'},
  {screen:'create', target:'#nextStep', coach:'top', kicker:'Gemini analysis', title:'Review the match criteria.', copy:'Gemini combines the goal, audience, budget and brand guardrails.'},
  {screen:'match', target:'.profile-snapshot', action:'continue', kicker:'Creator snapshot', title:'Read the creator signal.', copy:'Start with campaign fit, audience scale, average views, engagement, and the creator’s strongest content signals.'},
  {screen:'match', target:'#swipeGuide', action:'swipe-demo', kicker:'Gesture controls', title:'Swipe to make the call.', copy:'Drag the profile left to pass or right to shortlist. Use touch, a mouse, or a trackpad.'},
  {screen:'match', target:'.match-memo', action:'expand-evidence', kicker:'Gemini fit analysis', title:'Here’s why Gemini sees a strong fit.', copy:'Gemini connects the campaign brief to creator signals, performance, momentum, and brand safety. Expand this section for the evidence and sources.'},
  {screen:'match', target:'[data-nav="pool"]', coach:'top', kicker:'Shortlist saved', title:'Open your shortlist.', copy:'Your creator decision is saved with its supporting context. Open Shortlist to review and compare candidates.'},
  {screen:'pool', target:'[data-tour="compare"]', coach:'top', kicker:'Shortlist review', title:'Compare finalists.', copy:'Swipe right to select or left to remove with a mouse or trackpad, then compare fit, cost and risk.'},
  {screen:'compare', target:'[data-tour="outreach"]', coach:'top', kicker:'Activation', title:'Prepare outreach.', copy:'Move the approved pairing into a personalized conversation.'},
  {screen:'messages', target:'[data-open-chat="0"]', kicker:'Outreach', title:'Open the reply.', copy:'Track status and keep the creator conversation in one place.'},
  {screen:'chat', target:'#send', coach:'top', kicker:'AI creator brief', title:'Send the next step.', copy:'Confirm interest, then let Orbit tailor the campaign brief.'},
  {screen:'brief', target:'#approve', coach:'top', kicker:'Creator brief', title:'Approve the tailored brief.', copy:'Creator signals become specific guidance, claims and deliverables.'},
  {screen:'workspace', target:null, kicker:'Tour complete', title:'The campaign is moving.', copy:'You have gone from client brief to an activation-ready workspace.'}
];

const screens = {
  welcome: () => `<section class="welcome-shell">
    <header class="welcome-brand"><div class="brand"><span class="brandmark"></span>Orbit</div><span class="welcome-tag">For creator teams</span></header>
    <div class="welcome-copy"><span class="eyebrow">Your first campaign</span><h1>Find the signal.<br>Move while it matters.</h1><p>One brief in. A ready-to-review creator shortlist out.</p></div>
    <div class="orbit-demo" aria-label="Brief becomes a creator shortlist"><div class="orbit-line one"></div><div class="orbit-line two"></div><div class="brief-node"><span>BRIEF</span><strong>Peakline</strong></div><img class="orbit-face face-one" src="${creators[0].image}" alt="Yoga With Adriene"><img class="orbit-face face-two" src="${creators[1].image}" alt="Jeff Nippard"><img class="orbit-face face-three" src="${creators[2].image}" alt="Natacha Océane"><span class="fit-chip">96 fit</span></div>
    <div class="welcome-actions"><button class="primary blue" id="startOnboarding">Start first campaign</button><button class="welcome-skip" id="skipOnboarding">Returning? Open sample workspace</button></div>
    <div class="brand-badges welcome-sources">${geminiBadge('Gemini reasoning')}${youtubeBadge('YouTube signals')}</div>
  </section>`,

  onboarding: () => `<section class="onboarding-shell">
    <header class="onboarding-top"><button class="onboarding-back" id="onboardingBack" aria-label="Previous step">←</button><div class="mini-brand"><span class="brandmark"></span>Orbit</div><span>${state.onboardingStep}/3</span></header>
    <div class="onboarding-progress"><i class="${state.onboardingStep>=1?'on':''}"></i><i class="${state.onboardingStep>=2?'on':''}"></i><i class="${state.onboardingStep>=3?'on':''}"></i></div>
    ${state.onboardingStep===1?`<div class="onboarding-copy"><span class="eyebrow">Start here</span><h1>Bring the brief.</h1><p>Orbit turns campaign requirements into match criteria.</p></div><section class="brief-file"><span class="file-mark">PDF</span><div><strong>Peakline_launch_brief.pdf</strong><small>Goal · audience · budget · guardrails</small></div><span class="file-check">✓</span></section><div class="onboarding-bottom"><button class="primary blue" id="onboardingNext"><img class="button-icon invert" src="assets/brands/gemini.svg" alt=""> Analyze sample brief</button><small>Sample data · no upload needed</small></div>`:state.onboardingStep===2?`<div class="onboarding-copy"><span class="eyebrow">Brief understood</span><h1>Here’s the signal.</h1><p>Review the criteria before Orbit ranks creators.</p></div><section class="signal-sheet"><div class="brand-badges">${geminiBadge('Extracted with Gemini')}</div><article><span>Goal</span><strong>Credible product education</strong></article><article><span>Audience</span><strong>Active women · 25–40</strong></article><article><span>Creative</span><strong>Evidence-led · optimistic</strong></article><article><span>Avoid</span><strong>Medical or guaranteed claims</strong></article></section><div class="onboarding-bottom"><button class="primary blue" id="onboardingNext">Rank creators →</button></div>`:`<div class="onboarding-copy"><span class="eyebrow">First recommendation</span><h1>Your top match.</h1></div><section class="first-match"><img src="${creators[0].image}" alt="Yoga With Adriene"><div class="first-match-score"><strong>96</strong><small>FIT</small></div><div><h2>Yoga With Adriene</h2><p>Trust-led wellness · 13.7M</p><div class="chips"><span class="chip selected">Audience</span><span class="chip selected">Brand safe</span></div></div></section><section class="match-proof"><div><span>12</span><small>videos checked</small></div><div><span>4.8%</span><small>engagement</small></div><div><span>Low</span><small>risk</small></div></section><div class="onboarding-bottom"><button class="primary blue" id="onboardingNext">Build first shortlist</button></div>`}
  </section>`,

  transition: () => `<section class="transition-shell"><div class="transition-mark"><span class="brandmark"></span><i></i></div><span class="eyebrow">First shortlist ready</span><h1>Now let the campaign move.</h1><div class="transition-stats"><div><strong>7</strong><span>ranked</span></div><div><strong>3</strong><span>shortlisted</span></div><div><strong>1</strong><span>brief ready</span></div></div><p>Jump ahead to a live campaign after six weeks in Orbit.</p><button class="primary" id="fastForward">Fast-forward 6 weeks →</button></section>`,

  home: () => `${appHeader()}
    <div class="mature-heading"><div><span class="eyebrow">Tuesday · Sep 23</span><h1>Morning, Alex.</h1></div><button data-go="create" data-tour="create" aria-label="Create campaign">＋</button></div>
    <section class="focus-card" data-go="pool"><div class="row"><span class="focus-label">NEEDS YOU</span><span class="status warning">Due today</span></div><h2>Approve 4 creator picks</h2><p>Peakline · Summer Training</p><button>Review shortlist →</button></section>
    <div class="home-glance"><article><strong>4</strong><span>replies</span></article><article><strong>2</strong><span>drafts</span></article><article><strong>14h</strong><span>saved</span></article></div>
    <div class="section-head compact-head"><h3>Active campaign</h3><button data-go="workspace">Open</button></div>
    <article class="campaign-card" data-go="workspace"><div class="row"><div><span class="eyebrow">Peakline Hydration · US</span><h3>Summer Training Launch</h3></div><span class="status">● In outreach</span></div><div class="progress"><span style="width:58%"></span></div><div class="row"><small>8 of 12 creator slots</small><small>$31.5K of $45K committed</small></div></article>
    <div class="section-head compact-head"><h3>Up next</h3></div><section class="home-queue"><button data-go="review"><span class="queue-dot coral"></span><div><strong>Review Adriene’s draft</strong><small>2 claims flagged</small></div><b>›</b></button><button data-go="messages"><span class="queue-dot mint"></span><div><strong>Reply to Jeff</strong><small>Rate received</small></div><b>›</b></button></section>`,

  create: () => `${pageTitle('Create campaign')}<div class="stepper">${[1,2,3,4].map(i=>`<span class="${i<=state.formStep?'on':''}"></span>`).join('')}</div>${state.formStep===1?`
    <div class="wizard-head"><span class="eyebrow">1 of 4 · Goal</span><button id="sampleBrief">Use sample brief</button></div><h1>What should this campaign achieve?</h1><p class="wizard-help">Pick one. You can fine-tune everything later.</p>
    <div class="choice-stack"><button class="choice-card selected" id="tourGoal"><span>◉</span><div><strong>Launch a product</strong><small>Build awareness and explain what makes it different.</small></div></button><button class="choice-card"><span>○</span><div><strong>Grow awareness</strong><small>Reach more of the right audience.</small></div></button><button class="choice-card"><span>○</span><div><strong>Drive action</strong><small>Generate trials, sign-ups, or sales.</small></div></button></div>`:state.formStep===2?`
    <span class="eyebrow">2 of 4 · Audience</span><h1>Who are you trying to reach?</h1><p class="wizard-help">Choose a starting point. Orbit will infer the rest.</p>
    <div class="chips large"><button class="chip selected" id="tourAudience">Active women 25–40</button><button class="chip">Everyday athletes</button><button class="chip">Wellness beginners</button><button class="chip">Endurance runners</button></div><label>Optional detail</label><input value="US audience interested in fitness, outdoors, and clean-label products" />`:state.formStep===3?`
    <span class="eyebrow">3 of 4 · Budget</span><h1>What can you invest in creators?</h1><p class="wizard-help">A range is enough for the first match.</p>
    <div class="choice-stack"><button class="choice-card"><span>○</span><div><strong>Under $15K</strong><small>Focused test with micro creators.</small></div></button><button class="choice-card selected" id="tourBudget"><span>◉</span><div><strong>$25K–$50K</strong><small>Balanced reach and creator variety.</small></div></button><button class="choice-card"><span>○</span><div><strong>$50K+</strong><small>Multiple creators and larger channels.</small></div></button></div>`:`
    <span class="eyebrow">4 of 4 · Brief intelligence</span><h1>Review what Orbit will match.</h1><p class="wizard-help">Gemini extracted the criteria below from the campaign inputs and attached brief.</p>
    <div class="chips large"><button class="chip selected">Evidence-led</button><button class="chip selected">Optimistic</button><button class="chip selected">Story-first</button><button class="chip">Comedy</button><button class="chip">Cinematic</button></div>
    <div class="campaign-summary"><span class="ai-star">✦</span><div><strong>Peakline · Summer Training Launch</strong><p>Product launch · Active women 25–40 · $25K–$50K</p></div></div>
    <section class="brief-extract"><div class="brand-badges">${geminiBadge('Brief parsed with Gemini')}</div><div class="extract-grid"><div><span>Primary goal</span><strong>Credible product education</strong></div><div><span>Best-fit audience</span><strong>Active women 25–40</strong></div><div><span>Match weights</span><strong>Audience 35 · Content 30</strong></div><div><span>Guardrails</span><strong>No medical or guaranteed claims</strong></div></div><button class="text-action" id="editCriteria">Edit extracted criteria</button></section>
    <div class="upload compact"><div><strong>＋ Replace client brief</strong><br><span>PDF, DOCX, or shared document</span></div></div>`}
    <div class="form-actions"><button class="secondary" id="prevStep">${state.formStep===1?'Save draft':'Back'}</button><button class="primary blue" id="nextStep">${state.formStep===4?'Find creators ✦':'Continue'}</button></div>`,

  match: () => { const c=creators[state.creator%creators.length], fit=fitSignals(c); return `<div class="discover-top"><button class="campaign-switch"><span>Peakline · Summer Training</span>⌄</button><span class="counter">${state.creator%creators.length+1} of 7 samples</span></div>
    <div class="web-side-guides" aria-hidden="true"><div class="web-side-guide pass-guide"><span>×</span><strong>Pass</strong><small>Swipe left · ← key</small></div><div class="web-side-guide shortlist-guide"><span>☆</span><strong>Shortlist</strong><small>Swipe right · → key</small></div></div>
    <article class="profile-stream" id="creatorCard">
      <div class="swipe-stamp skip" aria-hidden="true">PASS</div><div class="swipe-stamp keep" aria-hidden="true">SHORTLIST</div>
      <section class="profile-hero" style="background-image:url('${c.image}')"><div class="hero-shade"></div><button class="more" aria-label="More creator options">•••</button></section>
      <section class="profile-identity"><div class="profile-name"><div class="profile-title"><span class="active-dot"></span><h1>${c.name}</h1></div><p>${c.handle}<span aria-hidden="true"> · </span>${c.niche}</p></div><button class="content-pick" data-pick="Profile introduction" aria-label="Shortlist profile introduction">＋</button></section>
      <div class="swipe-guide" id="swipeGuide"><span>← Pass</span><strong>Swipe the profile</strong><span>Shortlist →</span></div>
      <div class="profile-actions"><button class="action undo" data-action="undo" aria-label="Undo">↶</button><button class="decision pass-decision" data-action="pass" aria-label="Pass"><span>×</span>Pass</button><button class="decision shortlist-decision" id="tourShortlist" data-pick="Full creator profile" aria-label="Shortlist"><span>＋</span>Shortlist</button><button class="action save" data-action="save" aria-label="Save">☆</button></div>
      <section class="profile-snapshot" aria-label="Creator stats">
        <div class="profile-fit"><div><span class="snapshot-label">Campaign fit</span><strong>${c.score}<small>/100</small></strong></div><span class="fit-verdict">Top match</span></div>
        <div class="snapshot-stats"><div><strong>${c.subs}</strong><small>Subscribers</small></div><div><strong>${c.views}</strong><small>Avg. views</small></div><div><strong>${c.eng}</strong><small>Engagement</small></div></div>
        <div class="snapshot-detail"><span aria-hidden="true">◎</span><div><small>Creator category</small><strong>${c.niche}</strong></div></div>
        <div class="snapshot-detail"><span aria-hidden="true">✦</span><div><small>Strongest signals</small><strong>${c.tags.join(' · ')}</strong></div></div>
      </section>
      <section class="profile-prompt"><span class="prompt-label">Content fit</span><div class="signal-copy">${c.signal}</div><button class="content-pick dark" data-pick="Creator voice and community" aria-label="Shortlist creator prompt">＋</button></section>
      <section class="video-story" style="background-image:url('${c.videoImage}')"><div class="video-overlay"><span class="video-kicker"><img src="assets/brands/youtube.svg" alt=""> PUBLIC YOUTUBE VIDEO</span><h2>${c.videoTitle}</h2><span class="watch">▶ Review source</span></div><button class="content-pick" data-pick="Recent content performance" aria-label="Shortlist recent video">＋</button></section>
      <section class="match-memo"><div class="brand-badges memo-badges">${geminiBadge('Gemini fit analysis')}${youtubeBadge('12 uploads checked')}</div><div class="memo-top"><span class="ai-star">✦</span><div><span class="eyebrow">Explainable fit</span><h2>Why this creator fits the brief.</h2></div></div><p>${c.why}</p><div class="evidence-row"><span>Audience fit · 35% weight <b>${fit.audience}</b></span><span>Content alignment · 30% <b>${fit.brand}</b></span><span>Momentum · 20% <b>${fit.momentum}</b></span><span>Brand safety · 15% <b>${fit.safety}</b></span></div><button class="evidence-toggle" id="reasonButton">Review evidence and sources <span>↓</span></button><div class="evidence-detail" id="reasonDetail"><p><strong>Evidence:</strong> campaign brief v3, public channel metadata, and 12 recent YouTube uploads. Updated Sep 18. Public sponsorship signals require human verification.</p></div><button class="content-pick blue" data-pick="AI match evidence" aria-label="Shortlist AI match reason">＋</button></section>
      <section class="safety-card"><div><span class="eyebrow">Collaboration read</span><h3>${c.risk}</h3></div><span class="safety-mark">✓</span></section>
      <p class="end-note">Review complete for ${c.name}.<br><span>Pass, save, or add to the client shortlist.</span></p>
    </article><div class="web-action-dock"><button data-action="pass">× <span>Pass</span></button><button data-action="undo" aria-label="Undo">↶</button><button data-action="save">☆ <span>Save</span></button><button class="primary-dock" data-action="shortlist">☆ <span>Shortlist</span></button></div>`},

  profile: () => { const c=creators[state.creator%creators.length], fit=fitSignals(c); return `${pageTitle(c.name,'match')}<div class="brand-badges profile-sources">${geminiBadge('Gemini analysis')}${youtubeBadge('Public channel data')}</div><div class="creator-photo" style="height:225px;border-radius:22px;background-image:url('${c.image}')"><div class="match-orbit"><strong>${c.score}</strong><small>FIT</small></div></div>
    <div class="section-head"><h3>Channel snapshot</h3><span class="status">Brand safe</span></div><div class="metric-row"><div class="metric"><strong>${c.subs}</strong><span>subscribers</span></div><div class="metric"><strong>${c.eng}</strong><span>engagement</span></div><div class="metric"><strong>+18%</strong><span>90d growth</span></div></div>
    <div class="section-head"><h3>Explainable fit score</h3><span class="score">${c.score}/100</span></div><section class="score-breakdown"><div><span>Audience fit <small>35%</small></span><div><i style="width:${fit.audience}%"></i></div><b>${fit.audience}</b></div><div><span>Content alignment <small>30%</small></span><div><i style="width:${fit.brand}%"></i></div><b>${fit.brand}</b></div><div><span>Momentum <small>20%</small></span><div><i style="width:${fit.momentum}%"></i></div><b>${fit.momentum}</b></div><div><span>Brand safety <small>15%</small></span><div><i style="width:${fit.safety}%"></i></div><b>${fit.safety}</b></div></section>
    <div class="section-head"><h3>Recent content evidence</h3></div><section class="evidence-list"><article><img src="assets/brands/youtube.svg" alt=""><div><strong>12 recent uploads analyzed</strong><small>Titles, descriptions, topics, cadence and public performance</small></div></article><article><span>↗</span><div><strong>+23% vs. channel baseline</strong><small>Recent view performance is trending above the prior period</small></div></article><article><span>◎</span><div><strong>${c.signal}</strong><small>Recurring content pattern identified by Gemini</small></div></article></section>
    <div class="section-head"><h3>Content fit</h3></div><div class="brief-section"><h3>${c.tags[0]} · ${c.tags[1]}</h3><p>${c.why}</p><div class="chips"><span class="chip selected">Recovery</span><span class="chip selected">Hydration</span><span class="chip">Training</span></div></div>
    <button class="primary blue" style="width:100%" data-action="shortlist">Add to shortlist</button>`},

  pool: () => `${appHeader()}<span class="eyebrow">Shortlist review</span><h1>Build the client shortlist.</h1><div class="swipe-tip"><span>↔</span><div><strong>Swipe to build your comparison</strong><small>Mouse or trackpad: right to select · left to remove</small></div></div><div class="filter-row"><button class="chip selected">7 sample profiles</button><button class="chip">Client-ready 4</button><button class="chip">Saved 3</button><button class="chip">Fit 90+</button></div>
    ${creators.map((c,i)=>`<article class="creator-list-item ${state.compareSelection.includes(i)?'is-selected':''}" data-index="${i}" data-go="profile"><span class="list-swipe-state remove">REMOVE</span><span class="list-swipe-state select">SELECT</span><input class="check" type="checkbox" ${state.compareSelection.includes(i)?'checked':''} aria-label="Compare ${c.name}"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${c.subs} subs · ${c.niche}</p></div><span class="score">Fit ${c.score}</span></article>`).join('')}
    <div class="section-head"><h3>Review note</h3></div><textarea placeholder="Add a note for your team…">Adriene is the strongest trust fit; confirm wellness category exclusivity before client review.</textarea><div class="compare-bar"><span><strong id="compareCount">${state.compareSelection.length} selected</strong><br><small>Compare fit, cost & risk</small></span><button data-go="compare" data-tour="compare">Compare →</button></div>`,

  compare: () => { const picks=(state.compareSelection.length===2?state.compareSelection:[0,1]).map(i=>({creator:creators[i],details:compareDetails[i]})); return `${pageTitle('Compare finalists','pool')}<span class="eyebrow">Client review</span><h1>Choose the right role for each creator.</h1><div class="compare-grid"><div></div>${picks.map(p=>`<div><strong>${p.creator.name.split(' ')[0]}</strong><br><span class="score">Fit ${p.creator.score}</span></div>`).join('')}<div class="label">Audience</div>${picks.map(p=>`<div>${p.details.audience}</div>`).join('')}<div class="label">Est. fee</div>${picks.map(p=>`<div>${p.details.fee}</div>`).join('')}<div class="label">Content role</div>${picks.map(p=>`<div>${p.details.role}</div>`).join('')}<div class="label">Conflict risk</div>${picks.map(p=>`<div>${p.details.risk}</div>`).join('')}<div class="label">Client status</div><div>Ready</div><div>Ready</div></div>
    <div class="ai-note" style="margin-top:14px"><div class="brand-badges">${geminiBadge('Gemini recommendation')}</div><strong>Lead with ${picks[0].creator.name} for ${picks[0].details.role.toLowerCase()}.</strong><br>Use ${picks[1].creator.name} as the complementary partner if budget allows. Human approval is still required.</div><button class="primary blue" style="width:100%;margin-top:14px" data-go="messages" data-tour="outreach">Prepare outreach</button>`},

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
  app.dataset.screen = state.screen;
  app.scrollTop = 0;
  const introMode = ['welcome','onboarding','transition'].includes(state.screen);
  nav.classList.toggle('hidden', introMode);
  app.classList.toggle('intro-mode', introMode);
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.nav===state.screen || (state.screen==='profile'&&b.dataset.nav==='match') || (state.screen==='compare'&&b.dataset.nav==='pool') || (state.screen==='chat'&&b.dataset.nav==='messages') || (['brief','review'].includes(state.screen)&&b.dataset.nav==='workspace')));
  viewButtons.forEach(b=>b.classList.toggle('active',b.dataset.demoView===state.screen));
  bind();
  renderTour();
}

function go(screen) { state.screen=screen; render(); }
function toast(message) { const t=document.querySelector('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1700); }
function clearTourUI() {
  if(tourSpotlightFrame) cancelAnimationFrame(tourSpotlightFrame);
  tourSpotlightFrame=null;
  document.querySelector('#tourLayer')?.remove();
  document.querySelector('.tour-target')?.classList.remove('tour-target');
  document.querySelector('.phone')?.classList.remove('tour-running');
}
function renderTour() {
  clearTourUI();
  if(!state.tourActive) return;
  const step=tourSteps[state.tourStep];
  if(!step || step.screen!==state.screen) return;
  const target=step.target?(app.querySelector(step.target) || phone.querySelector(step.target)):null;
  const layer=document.createElement('section');
  layer.id='tourLayer';
  layer.className=`tour-layer ${target?'':'tour-finish'}`;
  if(step.coach==='top') layer.classList.add('coach-top');
  layer.innerHTML=`${target?'<div class="tour-shades" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="tour-highlight" aria-hidden="true"></div>':'<div class="tour-shade" aria-hidden="true"></div>'}<article class="tour-coach"><div class="tour-orbit"><span class="brandmark"></span><i>${state.tourStep+1}</i></div><div class="tour-copy"><span>${step.kicker} · ${state.tourStep+1}/${tourSteps.length}</span><h2>${step.title}</h2><p>${step.copy}</p></div>${target?(step.action==='continue'?'<button id="tourContinue">Continue →</button>':`<small>${step.action==='swipe-demo'?'Swipe the profile to continue':step.action==='expand-evidence'?'Tap the analysis to expand':'Tap only the highlighted action'}</small>`):'<button id="finishTour">See the live workspace →</button>'}</article>`;
  document.querySelector('.phone').appendChild(layer);
  document.querySelector('.phone').classList.add('tour-running');
  if(target) {
    target.classList.add('tour-target');
    const positionSpotlight=()=>{
      if(!target.isConnected || !layer.isConnected) return;
      const phoneRect=phone.getBoundingClientRect(), rect=target.getBoundingClientRect(), gap=7;
      const left=Math.max(0,rect.left-phoneRect.left-gap), top=Math.max(0,rect.top-phoneRect.top-gap);
      const right=Math.min(phoneRect.width,rect.right-phoneRect.left+gap), bottom=Math.min(phoneRect.height,rect.bottom-phoneRect.top+gap);
      const shades=layer.querySelectorAll('.tour-shades i');
      shades[0].style.cssText=`left:0;top:0;width:100%;height:${top}px`;
      shades[1].style.cssText=`left:0;top:${top}px;width:${left}px;height:${Math.max(0,bottom-top)}px`;
      shades[2].style.cssText=`left:${right}px;top:${top}px;right:0;height:${Math.max(0,bottom-top)}px`;
      shades[3].style.cssText=`left:0;top:${bottom}px;right:0;bottom:0`;
      const highlight=layer.querySelector('.tour-highlight');
      const visible=right>left && bottom>top && rect.bottom>phoneRect.top && rect.top<phoneRect.bottom;
      highlight.style.cssText=`left:${left}px;top:${top}px;width:${Math.max(0,right-left)}px;height:${Math.max(0,bottom-top)}px;opacity:${visible?1:0}`;
    };
    const trackSpotlight=()=>{positionSpotlight();if(layer.isConnected)tourSpotlightFrame=requestAnimationFrame(trackSpotlight)};
    requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'center'}));
    tourSpotlightFrame=requestAnimationFrame(trackSpotlight);
    setTimeout(()=>{positionSpotlight();if(!step.coach && target.getBoundingClientRect().top>document.querySelector('.phone').getBoundingClientRect().top+430) layer.classList.add('coach-top')},380);
    if(!['swipe-demo','continue'].includes(step.action)) target.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        runTourAction();
      },{capture:true,once:true});
  }
  const finish=document.querySelector('#finishTour');
  if(finish) finish.onclick=()=>{state.tourActive=false;state.tourStep=0;go('transition')};
  const tourContinue=document.querySelector('#tourContinue');
  if(tourContinue) tourContinue.onclick=runTourAction;
}
function runTourAction() {
  const step=state.tourStep;
  if(step===0) { state.tourStep=1;state.formStep=1;go('create'); }
  else if(step===1) { state.tourStep=2;state.formStep=2;render();toast('Campaign goal set'); }
  else if(step===2) { state.tourStep=3;state.formStep=3;render();toast('Target audience set'); }
  else if(step===3) { state.tourStep=4;state.formStep=4;render();toast('Budget range set'); }
  else if(step===4) { state.tourStep=5;toast('7 creators ranked');setTimeout(()=>go('match'),350); }
  else if(step===5) { state.tourStep=6;render(); }
  else if(step===7) { app.querySelector('#reasonDetail')?.classList.add('open');app.querySelector('#reasonButton')?.classList.add('open');setTimeout(()=>{state.tourStep=8;render()},650); }
  else if(step===8) { state.pool++;document.querySelector('#poolBadge').textContent=state.pool;state.tourStep=9;toast('Added to shortlist');setTimeout(()=>go('pool'),350); }
  else if(step===9) { state.tourStep=10;go('compare'); }
  else if(step===10) { state.tourStep=11;go('messages'); }
  else if(step===11) { state.tourStep=12;go('chat'); }
  else if(step===12) { state.tourStep=13;toast('Message sent');setTimeout(()=>go('brief'),350); }
  else if(step===13) { state.tourStep=14;toast('Brief approved');setTimeout(()=>go('workspace'),420); }
}
function bind() {
  app.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>{
    if(el.dataset.go==='create' && !state.tourActive) state.formStep=1;
    go(el.dataset.go);
  }));
  const startOnboarding=app.querySelector('#startOnboarding'); if(startOnboarding) startOnboarding.onclick=()=>{state.tourActive=true;state.tourStep=0;state.creator=0;state.formStep=1;state.reviewComplete=false;go('home')};
  const skipOnboarding=app.querySelector('#skipOnboarding'); if(skipOnboarding) skipOnboarding.onclick=()=>{state.tourActive=false;go('home')};
  const onboardingBack=app.querySelector('#onboardingBack'); if(onboardingBack) onboardingBack.onclick=()=>{if(state.onboardingStep>1){state.onboardingStep--;render()}else go('welcome')};
  const onboardingNext=app.querySelector('#onboardingNext'); if(onboardingNext) onboardingNext.onclick=()=>{if(state.onboardingStep<3){state.onboardingStep++;render()}else go('transition')};
  const fastForward=app.querySelector('#fastForward'); if(fastForward) fastForward.onclick=()=>{app.querySelector('.transition-shell')?.classList.add('leaving');setTimeout(()=>go('home'),420)};
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
  app.querySelectorAll('.creator-list-item').forEach(bindShortlistSwipe);
}

function updateCompareSelection(item, selected) {
  const index=Number(item.dataset.index), checkbox=item.querySelector('.check');
  state.compareSelection=selected?[...new Set([...state.compareSelection,index])].slice(-2):state.compareSelection.filter(i=>i!==index);
  app.querySelectorAll('.creator-list-item').forEach(row=>{const active=state.compareSelection.includes(Number(row.dataset.index));row.classList.toggle('is-selected',active);row.querySelector('.check').checked=active});
  checkbox.checked=selected;item.classList.toggle('is-selected',selected);
  const count=app.querySelector('#compareCount');if(count) count.textContent=`${state.compareSelection.length} selected`;
  toast(selected?'Selected for comparison':'Removed from comparison');
}
function bindShortlistSwipe(item) {
  const checkbox=item.querySelector('.check');
  checkbox.addEventListener('click',event=>{event.stopPropagation();updateCompareSelection(item,checkbox.checked)});
  let startX=0,startY=0,dx=0,tracking=false,horizontal=false,suppressClick=false;
  const reset=()=>{item.classList.remove('swiping');item.style.transform='';tracking=false;horizontal=false;dx=0};
  item.addEventListener('pointerdown',event=>{if(event.target.closest('input,button')) return;startX=event.clientX;startY=event.clientY;tracking=true});
  item.addEventListener('pointermove',event=>{if(!tracking)return;const mx=event.clientX-startX,my=event.clientY-startY;if(!horizontal&&Math.abs(my)>Math.abs(mx)+8){tracking=false;return}if(!horizontal&&Math.abs(mx)>10){horizontal=true;item.classList.add('swiping');item.setPointerCapture?.(event.pointerId)}if(!horizontal)return;event.preventDefault();dx=Math.max(-100,Math.min(100,mx));item.style.transform=`translateX(${dx}px)`});
  item.addEventListener('pointerup',event=>{if(horizontal){event.preventDefault();event.stopPropagation();suppressClick=true;const selected=dx>55?true:dx<-55?false:null;reset();if(selected!==null)updateCompareSelection(item,selected)}else reset()},{capture:true});
  item.addEventListener('click',event=>{if(!suppressClick)return;suppressClick=false;event.preventDefault();event.stopImmediatePropagation()},{capture:true});
  item.addEventListener('pointercancel',reset);
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
    if(decision && state.tourActive && tourSteps[state.tourStep]?.action==='swipe-demo') {
      state.tourStep=7;toast(decision==='pass'?'Swipe left passes':'Swipe right shortlists');render();return;
    }
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
document.addEventListener('keydown',event=>{
  if(!phone.classList.contains('browser-mode')||state.screen!=='match'||event.target.closest('input,textarea,select,[contenteditable]')) return;
  const action=event.key==='ArrowLeft'?'pass':event.key==='ArrowRight'?'shortlist':null;
  if(!action) return;
  event.preventDefault();act(action);
});
phone.addEventListener('click',event=>{
  if(!state.tourActive || event.target.closest('.tour-target, #finishTour, #tourContinue')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const coach=document.querySelector('.tour-coach');
  coach?.classList.remove('tour-nudge');
  requestAnimationFrame(()=>coach?.classList.add('tour-nudge'));
},true);
document.querySelector('#closeSheet').addEventListener('click',closeDecision);
document.querySelector('#sheetBackdrop').addEventListener('click',closeDecision);
document.querySelector('#decisionSheet').querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('selected')));
document.querySelector('#confirmDecision').addEventListener('click',()=>{state.pool++;document.querySelector('#poolBadge').textContent=state.pool;closeDecision();toast('Shortlisted with your note')});
deviceButtons.forEach(button=>button.addEventListener('click',()=>{
  const device=button.dataset.device;
  const compact=device==='pixel';
  const laptop=device==='laptop';
  document.documentElement.style.setProperty('--device-width',laptop?'1280px':compact?'360px':'393px');
  document.documentElement.style.setProperty('--device-height',laptop?'760px':compact?'800px':'852px');
  phone.classList.toggle('browser-mode',laptop);
  phone.setAttribute('aria-label',laptop?'Orbit creator partnership workspace in a browser':'Orbit creator partnership workspace on Google Pixel');
  deviceButtons.forEach(b=>b.classList.toggle('active',b===button));
}));
viewButtons.forEach(button=>button.addEventListener('click',()=>{
  state.tourActive=false;state.tourStep=0;go(button.dataset.demoView);
}));
const setFocusMode=enabled=>{
  document.body.classList.toggle('focus-mode',enabled);
  document.querySelector('#focusMode').setAttribute('aria-pressed',String(enabled));
};
document.querySelector('#focusMode').addEventListener('click',()=>setFocusMode(true));
document.querySelector('#focusExit').addEventListener('click',()=>setFocusMode(false));
render();
