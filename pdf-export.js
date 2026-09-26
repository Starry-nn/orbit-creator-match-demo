(function(root){
  'use strict';

  const PAGE_W=612, PAGE_H=792, MARGIN=48, CONTENT_W=516;
  const BLUE=[0.192,0.361,0.961], INK=[0.125,0.129,0.141], MUTED=[0.40,0.44,0.51], MINT=[0.271,0.780,0.608], PALE=[0.955,0.963,0.992];

  function ascii(value=''){
    return String(value)
      .replace(/[–—]/g,'-').replace(/×/g,'x').replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
      .replace(/…/g,'...').replace(/→/g,'->').replace(/≤/g,'<=').replace(/[^ -~\n]/g,'');
  }
  function esc(value){ return ascii(value).replace(/([\\()])/g,'\\$1'); }
  function color(rgb,stroke=false){ return `${rgb.map(v=>Number(v).toFixed(3)).join(' ')} ${stroke?'RG':'rg'}`; }
  function wrap(text,size,width=CONTENT_W){
    const max=Math.max(12,Math.floor(width/(size*.53))), words=ascii(text).split(/\s+/), lines=[];
    let line='';
    words.forEach(word=>{
      const next=line?`${line} ${word}`:word;
      if(next.length<=max){ line=next; return; }
      if(line) lines.push(line);
      if(word.length<=max){ line=word; return; }
      for(let i=0;i<word.length;i+=max) lines.push(word.slice(i,i+max));
      line='';
    });
    if(line) lines.push(line);
    return lines.length?lines:[''];
  }
  function textCmd(text,x,y,size=10,bold=false,rgb=INK){
    return `BT /${bold?'F2':'F1'} ${size} Tf ${color(rgb)} 1 0 0 1 ${x} ${y} Tm (${esc(text)}) Tj ET`;
  }
  function rectCmd(x,y,w,h,rgb){ return `q ${color(rgb)} ${x} ${y} ${w} ${h} re f Q`; }
  function lineCmd(x1,y1,x2,y2,rgb=[.88,.89,.93]){ return `q ${color(rgb,true)} 0.7 w ${x1} ${y1} m ${x2} ${y2} l S Q`; }

  function createCreatorBriefPdf(data){
    const pages=[];
    let page, y;
    const startPage=()=>{
      page=[]; pages.push(page);
      page.push(rectCmd(0,716,PAGE_W,76,BLUE));
      page.push(textCmd('ORBIT  /  CREATOR CAMPAIGN BRIEF',MARGIN,758,9,true,[1,1,1]));
      page.push(textCmd(ascii(data.campaign||'Campaign'),MARGIN,733,20,true,[1,1,1]));
      page.push(textCmd(`Brand: ${data.brand||'Peakline'}   |   Creator: ${data.creator||'Creator'}`,MARGIN,710,9,false,MUTED));
      y=684;
    };
    const ensure=height=>{ if(y-height<52) startPage(); };
    const paragraph=(value,{size=9,color:rgb=MUTED,bold=false,indent=0,leading=13}={})=>{
      const lines=wrap(value,size,CONTENT_W-indent);
      ensure(lines.length*leading+4);
      lines.forEach(line=>{page.push(textCmd(line,MARGIN+indent,y,size,bold,rgb));y-=leading;});
      y-=4;
    };
    const section=(title,content=[])=>{
      ensure(38);
      page.push(textCmd(title.toUpperCase(),MARGIN,y,8,true,BLUE)); y-=9;
      page.push(lineCmd(MARGIN,y,MARGIN+CONTENT_W,y)); y-=17;
      content.forEach(item=>{
        if(typeof item==='string') paragraph(item);
        else if(item.label){
          ensure(18);
          page.push(textCmd(`${item.label}:`,MARGIN,y,9,true,INK));
          const labelWidth=Math.min(150,item.label.length*5.2+10);
          const lines=wrap(item.value,9,CONTENT_W-labelWidth);
          page.push(textCmd(lines[0]||'',MARGIN+labelWidth,y,9,false,MUTED)); y-=13;
          lines.slice(1).forEach(line=>{page.push(textCmd(line,MARGIN+labelWidth,y,9,false,MUTED));y-=13;});
          y-=2;
        } else if(item.bullet) paragraph(`- ${item.bullet}`,{indent:10});
      });
      y-=8;
    };

    startPage();
    ensure(86);
    page.push(rectCmd(MARGIN,y-66,CONTENT_W,66,INK));
    page.push(textCmd('CAMPAIGN OBJECTIVE',MARGIN+16,y-21,8,true,MINT));
    wrap(data.objective||'',10,CONTENT_W-32).slice(0,3).forEach((line,index)=>page.push(textCmd(line,MARGIN+16,y-40-index*13,10,index===0,[1,1,1])));
    y-=86;

    section('Partnership overview',[
      {label:'Product',value:data.product||'Peakline Hydration'},
      {label:'Audience',value:data.audience||'Active women ages 25-40 in the United States'},
      {label:'Creator fit',value:data.creatorFit||''},
      {label:'Recommended format',value:data.format||''}
    ]);
    section('Deliverables', (data.deliverables||[]).map(bullet=>({bullet})));
    section('Creative direction',[
      {label:'Recommended scene',value:data.scene||''},
      {label:'Opening direction',value:data.opening||''},
      {label:'Tone',value:data.tone||''}
    ]);
    section('Key messages and call to action',[
      ...(data.messages||[]).map(bullet=>({bullet})),
      {label:'CTA',value:data.cta||''}
    ]);
    section('Brand requirements and guardrails',[
      {label:'Must include',value:data.mustInclude||''},
      {label:'Do not claim',value:data.avoid||''},
      {label:'Disclosure',value:data.disclosure||''}
    ]);
    section('Timeline and approvals',[
      {label:'Draft due',value:data.draftDue||'June 6, 2026'},
      {label:'Feedback window',value:data.feedback||'One consolidated feedback round within two business days'},
      {label:'Go-live',value:data.goLive||'June 18, 2026'},
      {label:'Approval',value:'Brand approval is required before publication. Creator retains final control of their authentic voice.'}
    ]);
    section('Usage rights and commercial terms',[
      {label:'Usage',value:data.usage||'30 days of paid digital usage; organic reposting on brand-owned channels'},
      {label:'Exclusivity',value:data.exclusivity||'Review hydration and sports nutrition category conflicts before contracting'},
      {label:'Compensation',value:data.compensation||'$12,000-$15,000 estimated; final fee subject to creator negotiation'}
    ]);
    section('Evidence used by Orbit',[
      {label:'YouTube signals',value:data.evidence||'12 recent public uploads, visual frames, audio/transcript, content themes, cadence, and public performance'},
      {label:'Timestamp proof',value:data.timestamp||''},
      'AI-generated recommendations require human review. Public data only; no private creator analytics are represented.'
    ]);
    section('Reference and compliance notes',[
      'YouTube Creator Partnerships campaign inquiries commonly include campaign goals, deliverables, talking points, calls to action, product information, and commercial terms.',
      'Branded content must use YouTube paid promotion disclosure tools and comply with applicable advertising, community, and legal requirements.',
      'Reference: support.google.com/youtube/answer/9385307 and support.google.com/youtube/answer/17596007'
    ]);

    pages.forEach((commands,index)=>{
      commands.push(lineCmd(MARGIN,38,MARGIN+CONTENT_W,38));
      commands.push(textCmd(`Orbit brief v1.0  |  ${data.creator||'Creator'}  |  Human approval required`,MARGIN,23,7,false,MUTED));
      commands.push(textCmd(`${index+1} / ${pages.length}`,PAGE_W-MARGIN-24,23,7,true,MUTED));
    });

    const objects=[];
    objects[0]='<< /Type /Catalog /Pages 2 0 R >>';
    const kids=pages.map((_,i)=>`${5+i*2} 0 R`).join(' ');
    objects[1]=`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
    objects[2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    pages.forEach((commands,index)=>{
      const pageId=5+index*2, contentId=pageId+1, stream=commands.join('\n');
      objects[pageId-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId-1]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    let pdf='%PDF-1.4\n%Orbit\n', offsets=[0];
    objects.forEach((object,index)=>{offsets[index+1]=pdf.length;pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
    const xref=pdf.length;
    pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset=>{pdf+=`${String(offset).padStart(10,'0')} 00000 n \n`;});
    pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new TextEncoder().encode(pdf);
  }

  function downloadCreatorBrief(data){
    const bytes=createCreatorBriefPdf(data), blob=new Blob([bytes],{type:'application/pdf'}), url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=`Orbit_${ascii(data.campaign||'Campaign').replace(/[^A-Za-z0-9]+/g,'_')}_${ascii(data.creator||'Creator').replace(/[^A-Za-z0-9]+/g,'_')}_Brief.pdf`;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return link.download;
  }

  const api={createCreatorBriefPdf,downloadCreatorBrief};
  root.OrbitPDF=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
