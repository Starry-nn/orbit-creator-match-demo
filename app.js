const creators = [
  {name:'Yoga With Adriene', handle:'@yogawithadriene', niche:'Yoga & mindful movement', subs:'13.7M', views:'10.6M', eng:'4.8%', score:96, image:'assets/avatars/yoga-with-adriene.jpg', videoImage:'https://i.ytimg.com/vi/k2oe-PAHTR0/hqdefault.jpg', tags:['All levels','High trust'], prompt:'Channel signal', signal:'Gentle, accessible guidance turns a daily wellness habit into a welcoming community ritual.', videoTitle:'Yoga Morning Fresh · 35-minute practice', risk:'Established wellness partnerships · Review category exclusivity', why:'Adriene’s inclusive teaching style and broad wellness audience align strongly with an approachable hydration campaign. Her long-form routines also create natural product-use moments.'},
  {name:'Jeff Nippard', handle:'@JeffNippard', niche:'Evidence-based fitness', subs:'3M+', views:'4.1M', eng:'5.9%', score:93, image:'assets/avatars/jeff-nippard.jpg', videoImage:'https://i.ytimg.com/vi/k1Xr8rMK-Gw/hqdefault.jpg', tags:['Science-led','High intent'], prompt:'Channel signal', signal:'Research becomes practical training advice with clear visuals, tests, and specific takeaways.', videoTitle:'The most effective full-body workout for growth', risk:'High sponsor demand · Strong evidence-led brand fit', why:'Jeff’s audience actively seeks performance science and product evidence. The fit is strongest when messaging includes transparent ingredients and avoids broad wellness claims.'},
  {name:'Natacha Océane', handle:'@natachaoceane', niche:'Performance & wellbeing', subs:'1.63M', views:'1.4M', eng:'5.2%', score:91, image:'assets/avatars/natacha-oceane.jpg', videoImage:'https://i.ytimg.com/vi/m-im3XFx068/hqdefault.jpg', tags:['Performance','Experiment-led'], prompt:'Channel signal', signal:'Training experiments and athlete stories balance performance ambition with an approachable voice.', videoTitle:'I trained with the IronMan World Champion', risk:'Selective publishing cadence · Strong performance relevance', why:'Natacha combines sports science, personal experimentation, and candid storytelling. That creates a credible route to discuss hydration without turning the content into a product lecture.'},
  {name:'Caroline Girvan', handle:'@CarolineGirvan', niche:'Strength & home fitness', subs:'4M+', views:'2.2M', eng:'5.5%', score:89, image:'assets/avatars/caroline-girvan.jpg', videoImage:'https://i.ytimg.com/vi/-ZToTce0sWM/hqdefault.jpg', tags:['Program-led','High intent'], prompt:'Channel signal', signal:'Structured training programs give viewers a clear plan, a shared challenge, and a reason to return.', videoTitle:'40-minute leg workout · IRON PRO', risk:'Premium training ecosystem · Review category overlap', why:'Caroline’s program-led content reaches committed home-training audiences. NovaFuel fits naturally around session preparation and recovery when the message stays practical.'},
  {name:'Pick Up Limes', handle:'@PickUpLimes', niche:'Plant-based wellness', subs:'4.37M', views:'1.1M', eng:'5.7%', score:87, image:'assets/avatars/pick-up-limes.jpg', videoImage:'https://i.ytimg.com/vi/xNzZqVUl28E/hqdefault.jpg', tags:['Nutrition','Cinematic'], prompt:'Channel signal', signal:'Calm, beautifully produced food stories make nutrition feel useful rather than prescriptive.', videoTitle:'Simple plant-based habits for everyday energy', risk:'Premium production bar · Strong clean-label fit', why:'The channel pairs nutrition credibility with polished storytelling. NovaFuel fits best as part of a broader routine instead of a direct-response product demonstration.'},
  {name:'Chloe Ting', handle:'@ChloeTing', niche:'Home fitness', subs:'26.1M', views:'1.28M', eng:'4.4%', score:85, image:'assets/avatars/chloe-ting.jpg', videoImage:'https://i.ytimg.com/vi/4I-dymlpGOQ/hqdefault.jpg', tags:['Global reach','Workout series'], prompt:'Channel signal', signal:'Structured challenges give a global audience an easy reason to return and participate together.', videoTitle:'20-minute full-body HIIT · no jumping', risk:'High campaign volume · Excellent global scale', why:'Chloe offers exceptional reach and repeat participation. Campaign creative should prioritize a simple routine moment and localized claims for an international audience.'},
  {name:'Blogilates', handle:'@blogilates', niche:'Pilates & lifestyle', subs:'11M', views:'572K', eng:'4.9%', score:82, image:'assets/avatars/blogilates.jpg', videoImage:'https://i.ytimg.com/vi/86PciGuG7Sk/hqdefault.jpg', tags:['Pilates','Founder-led'], prompt:'Channel signal', signal:'Energetic classes, product-building stories, and a recognizable host-led format drive loyalty.', videoTitle:'25-minute complete leg workout', risk:'Founder-owned product ecosystem · Check conflicts', why:'Cassey’s founder-led audience responds to energy and participation. Brand fit is promising, though product-category conflicts should be reviewed before outreach.'}
];

const state = {screen:'home', creator:0, lastAction:null, pool:3, formStep:1, selectedCompare:2};
const app = document.querySelector('#app');
const nav = document.querySelector('.tabbar');

const appHeader = () => `<header class="topline"><div class="brand"><span class="brandmark"></span>Orbit</div><div class="avatar">AC</div></header>`;
const pageTitle = (title, back='home') => `<div class="screen-title"><button class="back" data-go="${back}" aria-label="Go back">←</button><h2>${title}</h2></div>`;

const screens = {
  home: () => `${appHeader()}
    <section class="hero"><span class="spark">✦</span><span class="eyebrow">AI creator matching</span><h1>Find the signal in the scroll.</h1><p>Turn one campaign brief into a ranked, explainable creator shortlist.</p><div class="hero-actions"><button class="primary" data-go="create">Create campaign →</button><button class="hero-sample" id="sampleCampaign">Try sample</button></div></section>
    <div class="section-head"><h3>Live campaign</h3><button data-go="workspace">Open workspace</button></div>
    <article class="campaign-card" data-go="match"><div class="row"><div><span class="eyebrow">NovaFuel</span><h3>Summer Performance Launch</h3></div><span class="status">● Matching</span></div><div class="progress"><span style="width:68%"></span></div><div class="row"><small>136 creators analyzed</small><small>18 shortlisted</small></div></article>
    <div class="section-head"><h3>This week</h3></div><div class="metric-row"><div class="metric"><strong>42</strong><span>new matches</span></div><div class="metric"><strong>8</strong><span>replies</span></div><div class="metric"><strong>3</strong><span>briefs ready</span></div></div>
    <div class="section-head"><h3>Recent</h3><button>See all</button></div><article class="campaign-card"><div class="row"><div><h3>Mindful Morning</h3><p>Wellness · $35K budget</p></div><strong>12 saved</strong></div></article>`,

  create: () => `${pageTitle('Create campaign')}<div class="stepper">${[1,2,3,4].map(i=>`<span class="${i<=state.formStep?'on':''}"></span>`).join('')}</div>${state.formStep===1?`
    <div class="wizard-head"><span class="eyebrow">1 of 4 · Goal</span><button id="sampleBrief">Use sample brief</button></div><h1>What should this campaign achieve?</h1><p class="wizard-help">Pick one. You can fine-tune everything later.</p>
    <div class="choice-stack"><button class="choice-card selected"><span>◉</span><div><strong>Launch a product</strong><small>Build awareness and explain what makes it different.</small></div></button><button class="choice-card"><span>○</span><div><strong>Grow awareness</strong><small>Reach more of the right audience.</small></div></button><button class="choice-card"><span>○</span><div><strong>Drive action</strong><small>Generate trials, sign-ups, or sales.</small></div></button></div>`:state.formStep===2?`
    <span class="eyebrow">2 of 4 · Audience</span><h1>Who are you trying to reach?</h1><p class="wizard-help">Choose a starting point. Orbit will infer the rest.</p>
    <div class="chips large"><button class="chip selected">Active women 25–40</button><button class="chip">Everyday athletes</button><button class="chip">Wellness beginners</button><button class="chip">Endurance runners</button></div><label>Optional detail</label><input value="US audience interested in fitness, outdoors, and clean-label products" />`:state.formStep===3?`
    <span class="eyebrow">3 of 4 · Budget</span><h1>What can you invest in creators?</h1><p class="wizard-help">A range is enough for the first match.</p>
    <div class="choice-stack"><button class="choice-card"><span>○</span><div><strong>Under $15K</strong><small>Focused test with micro creators.</small></div></button><button class="choice-card selected"><span>◉</span><div><strong>$25K–$50K</strong><small>Balanced reach and creator variety.</small></div></button><button class="choice-card"><span>○</span><div><strong>$50K+</strong><small>Multiple creators and larger channels.</small></div></button></div>`:`
    <span class="eyebrow">4 of 4 · Creative fit</span><h1>What should the content feel like?</h1><p class="wizard-help">Your sample is ready. Change any signal before matching.</p>
    <div class="chips large"><button class="chip selected">Evidence-led</button><button class="chip selected">Optimistic</button><button class="chip selected">Story-first</button><button class="chip">Comedy</button><button class="chip">Cinematic</button></div>
    <div class="campaign-summary"><span class="ai-star">✦</span><div><strong>NovaFuel Summer Launch</strong><p>Product launch · Active women 25–40 · $25K–$50K</p></div></div><div class="upload compact"><div><strong>＋ Add a campaign brief</strong><br><span>Optional · Orbit can start without one</span></div></div>`}
    <div class="form-actions"><button class="secondary" id="prevStep">${state.formStep===1?'Save draft':'Back'}</button><button class="primary blue" id="nextStep">${state.formStep===4?'Find creators ✦':'Continue'}</button></div>`,

  match: () => { const c=creators[state.creator%creators.length]; return `<div class="discover-top"><button class="campaign-switch"><span>NovaFuel launch</span>⌄</button><span class="counter">${state.creator+1} of 136</span></div>
    <article class="profile-stream" id="creatorCard">
      <div class="swipe-stamp skip" aria-hidden="true">PASS</div><div class="swipe-stamp keep" aria-hidden="true">SHORTLIST</div>
      <section class="profile-hero" style="background-image:url('${c.image}')"><div class="hero-shade"></div><button class="more" aria-label="More creator options">•••</button></section>
      <section class="profile-identity"><div class="profile-name"><div class="profile-title"><span class="active-dot"></span><h1>${c.name}</h1></div><p>${c.handle}<span aria-hidden="true"> · </span>${c.niche}</p></div><button class="content-pick" data-pick="Profile introduction" aria-label="Shortlist profile introduction">＋</button></section>
      <div class="profile-actions"><button class="action undo" data-action="undo" aria-label="Undo">↶</button><button class="decision pass-decision" data-action="pass" aria-label="Pass"><span>×</span>Pass</button><button class="decision shortlist-decision" data-pick="Full creator profile" aria-label="Shortlist"><span>＋</span>Shortlist</button><button class="action save" data-action="save" aria-label="Save">☆</button></div>
      <section class="profile-facts"><div><strong>${c.subs}</strong><small>SUBSCRIBERS</small></div><div><strong>${c.views}</strong><small>AVG. VIEWS</small></div><div><strong>${c.eng}</strong><small>ENGAGEMENT</small></div><div class="fit-pill"><strong>${c.score}%</strong><small>AI MATCH</small></div></section>
      <section class="profile-prompt"><span class="prompt-label">${c.prompt}</span><div class="signal-copy">${c.signal}</div><button class="content-pick dark" data-pick="Creator voice and community" aria-label="Shortlist creator prompt">＋</button></section>
      <section class="video-story" style="background-image:url('${c.videoImage}')"><div class="video-overlay"><span class="video-kicker">PUBLIC YOUTUBE VIDEO</span><h2>${c.videoTitle}</h2><span class="watch">▶ View format</span></div><button class="content-pick" data-pick="Recent content performance" aria-label="Shortlist recent video">＋</button></section>
      <section class="match-memo"><div class="memo-top"><span class="ai-star">✦</span><div><span class="eyebrow">Orbit match memo</span><h2>Why you two make sense.</h2></div></div><p>${c.why}</p><div class="evidence-row"><span>Audience overlap <b>96</b></span><span>Brand fit <b>93</b></span><span>Content momentum <b>89</b></span></div><button class="evidence-toggle" id="reasonButton">See the evidence <span>↓</span></button><div class="evidence-detail" id="reasonDetail"><p><strong>Based on:</strong> 12 recent videos, 3.8K audience comments, sponsor history, retention benchmarks, and brand-safety signals.</p></div><button class="content-pick blue" data-pick="AI match evidence" aria-label="Shortlist AI match reason">＋</button></section>
      <section class="safety-card"><div><span class="eyebrow">Collaboration read</span><h3>${c.risk}</h3></div><span class="safety-mark">✓</span></section>
      <p class="demo-disclaimer">Public YouTube imagery · Performance and match metrics are illustrative demo data.</p><p class="end-note">That’s the full picture on ${c.name}.<br><span>Choose what happens next.</span></p>
    </article>`},

  profile: () => { const c=creators[state.creator%creators.length]; return `${pageTitle(c.name,'match')}<div class="creator-photo" style="height:225px;border-radius:22px;background-image:url('${c.image}')"><div class="match-orbit"><strong>${c.score}%</strong><small>MATCH</small></div></div>
    <div class="section-head"><h3>Channel snapshot</h3><span class="status">Brand safe</span></div><div class="metric-row"><div class="metric"><strong>${c.subs}</strong><span>subscribers</span></div><div class="metric"><strong>${c.eng}</strong><span>engagement</span></div><div class="metric"><strong>+18%</strong><span>90d growth</span></div></div>
    <div class="section-head"><h3>AI content read</h3></div><div class="brief-section"><h3>Science without the lecture</h3><p>Recent videos translate sports science into practical routines. The tone is curious, credible, and avoids exaggerated claims.</p><div class="chips"><span class="chip selected">Recovery</span><span class="chip selected">Hydration</span><span class="chip">Training</span></div></div>
    <div class="section-head"><h3>Performance consistency</h3></div><div class="campaign-card"><svg viewBox="0 0 320 70" width="100%" height="70" aria-label="Video view performance trend"><path d="M0 57 C35 42 45 50 73 31 S125 50 155 26 S208 35 233 15 S285 31 320 8" fill="none" stroke="#315cf5" stroke-width="4" stroke-linecap="round"/><path d="M0 60H320" stroke="#e3e7ef"/></svg><div class="row"><small>Last 12 videos</small><strong>+23% vs. baseline</strong></div></div>
    <button class="primary blue" style="width:100%" data-action="shortlist">Add to shortlist</button>`},

  pool: () => `${appHeader()}<span class="eyebrow">Creators pool</span><h1>Your human decision layer.</h1><div class="filter-row"><button class="chip selected">All 18</button><button class="chip">Shortlisted 8</button><button class="chip">Saved 10</button><button class="chip">Match 90%+</button></div>
    ${creators.map((c,i)=>`<article class="creator-list-item" data-go="profile"><input class="check" type="checkbox" ${i<2?'checked':''} onclick="event.stopPropagation()"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${c.subs} subs · ${c.niche}</p></div><span class="score">${c.score}%</span></article>`).join('')}
    <div class="section-head"><h3>Internal notes</h3></div><textarea placeholder="Add a note for your team…">Adriene is the strongest trust fit; check wellness category exclusivity before outreach.</textarea><div class="compare-bar"><span><strong>2 selected</strong><br><small>Ready to compare</small></span><button data-go="compare">Compare →</button></div>`,

  compare: () => `${pageTitle('Compare creators','pool')}<span class="eyebrow">Side by side</span><h1>Two strong fits. Different strengths.</h1><div class="compare-grid"><div></div><div><strong>Adriene</strong><br><span class="score">96%</span></div><div><strong>Jeff</strong><br><span class="score">93%</span></div><div class="label">Audience fit</div><div>Broad wellness</div><div>High-intent fitness</div><div class="label">Reach</div><div>13.7M</div><div>3M+</div><div class="label">Content mode</div><div>Guided routine</div><div>Evidence explainer</div><div class="label">Sponsor density</div><div>Medium</div><div>High</div><div class="label">Best at</div><div>Trust & habit</div><div>Proof & detail</div></div>
    <div class="ai-note" style="margin-top:14px"><strong>✦ Orbit’s take</strong><br>Adriene is the stronger trust-led launch partner. Jeff is better when ingredient evidence and performance education lead the brief.</div><button class="primary blue" style="width:100%;margin-top:14px" data-go="messages">Start outreach</button>`,

  messages: () => `${appHeader()}<span class="eyebrow">Outreach</span><h1>Move from match to yes.</h1><div class="filter-row"><button class="chip selected">All</button><button class="chip">Responded 4</button><button class="chip">Follow-up 3</button></div>${creators.map((c,i)=>`<article class="thread" data-open-chat="${i}"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${i===0?'I’d love to hear more about the launch!':'Campaign fit, timing, and next steps…'}</p></div><div><time>${i===0?'9:18':'Tue'}</time><br><span class="status">${i===0?'Responded':i===1?'Delivered':'Follow-up'}</span></div></article>`).join('')}<button class="secondary" style="width:100%;margin-top:16px" id="draft">✦ Draft personalized outreach</button>`,

  chat: () => `${pageTitle('Yoga With Adriene','messages')}<div class="chat"><div class="status">● Interested</div><div class="bubble">Hi Adriene — your welcoming approach to movement feels like a natural fit for NovaFuel’s summer launch.</div><div class="bubble me">We’re planning one integrated YouTube feature plus 30-day usage rights. Budget range is $12–15K.</div><div class="bubble">I’d love to hear more about the launch! Mid-June could work for our team.</div><div class="ai-note"><strong>✦ Suggested reply</strong><br>Great — I’ll send over a personalized brief with the creative direction and timeline.</div></div><div class="chatbox"><input value="Great — I’ll send over the brief." aria-label="Message"><button id="send">↑</button></div>`,

  workspace: () => `${appHeader()}<span class="eyebrow">Campaign workspace</span><h1>Summer Performance</h1><section class="workspace-summary"><div class="row"><div><small>CAMPAIGN HEALTH</small><h2 style="margin:5px 0">On track</h2></div><strong style="color:var(--mint)">72%</strong></div><p>2 creators interested · 1 brief approved · 3 items need attention</p></section><div class="section-head"><h3>Pipeline</h3><button>View board</button></div><div class="stage"><span class="stage-dot done">✓</span><div><strong>Discovery</strong><p class="muted" style="margin:2px 0;font-size:10px">18 creators shortlisted</p></div></div><div class="stage-line"></div><div class="stage"><span class="stage-dot done">✓</span><div><strong>Outreach</strong><p class="muted" style="margin:2px 0;font-size:10px">8 sent · 4 responded</p></div></div><div class="stage-line"></div><div class="stage"><span class="stage-dot">3</span><div><strong>Creator briefs</strong><p class="muted" style="margin:2px 0;font-size:10px">1 approved · 2 drafts</p></div></div>
    <div class="section-head"><h3>Needs attention</h3></div><article class="task-card" data-go="brief"><span class="stage-dot">✦</span><div><strong>Adriene’s AI brief is ready</strong><p>Review creator-specific guidance and approve.</p></div></article><article class="task-card"><span class="stage-dot" style="background:#fff2df;color:#b16e00">!</span><div><strong>Follow up with Jeff</strong><p>No response in 4 days.</p></div></article>`,

  brief: () => `${pageTitle('AI creator brief','workspace')}<span class="eyebrow">Draft for Yoga With Adriene</span><h1>NovaFuel, made for the long run.</h1><div class="ai-note"><strong>✦ Personalized from recent public videos</strong><br>Guidance reflects the channel’s welcoming teaching style and routine-led format.</div><div class="section-head"><h3>Objective</h3><button>Edit</button></div><section class="brief-section"><p>Introduce NovaFuel as the clean, evidence-led hydration habit that supports consistent movement through summer.</p></section><section class="brief-section"><h3>Deliverables</h3><ul><li>1 × 60–90 sec YouTube integration</li><li>Product visible within first 4 minutes</li><li>30-day paid usage rights</li></ul></section><section class="brief-section"><h3>Creator-specific direction</h3><p>Integrate NovaFuel into the setup or wind-down of a warm-weather practice. Keep the teaching calm, inclusive, and centered on consistency rather than performance pressure.</p></section><section class="brief-section"><h3>Must say / must avoid</h3><p><strong>Include:</strong> zero added sugar, third-party tested.<br><strong>Avoid:</strong> medical outcomes or guaranteed performance claims.</p></section><div class="form-actions"><button class="secondary">Export</button><button class="primary blue" id="approve">Approve brief</button></div>`
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
  app.querySelectorAll('.choice-stack').forEach(group=>group.querySelectorAll('.choice-card').forEach(card=>card.addEventListener('click',()=>{group.querySelectorAll('.choice-card').forEach(c=>{c.classList.remove('selected');c.querySelector('span').textContent='○'});card.classList.add('selected');card.querySelector('span').textContent='◉'})));
  const reasonButton=app.querySelector('#reasonButton'); if(reasonButton) reasonButton.onclick=()=>{app.querySelector('#reasonDetail').classList.toggle('open');reasonButton.classList.toggle('open')};
  const next=app.querySelector('#nextStep'); if(next) next.onclick=()=>{ if(state.formStep<4){state.formStep++;render()} else {toast('136 creators analyzed');setTimeout(()=>go('match'),400)} };
  const prev=app.querySelector('#prevStep'); if(prev) prev.onclick=()=>{ if(state.formStep>1){state.formStep--;render()} else toast('Draft saved') };
  const sampleCampaign=app.querySelector('#sampleCampaign'); if(sampleCampaign) sampleCampaign.onclick=()=>{state.formStep=4;go('create')};
  const sampleBrief=app.querySelector('#sampleBrief'); if(sampleBrief) sampleBrief.onclick=()=>{state.formStep=4;render();toast('Sample brief loaded')};
  app.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
  app.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>openDecision(b.dataset.pick)));
  app.querySelectorAll('[data-open-chat]').forEach(el=>el.addEventListener('click',()=>go('chat')));
  const draft=app.querySelector('#draft'); if(draft) draft.onclick=()=>toast('Personalized draft created');
  const send=app.querySelector('#send'); if(send) send.onclick=()=>toast('Message sent');
  const approve=app.querySelector('#approve'); if(approve) approve.onclick=()=>{toast('Brief approved');setTimeout(()=>go('workspace'),500)};
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
