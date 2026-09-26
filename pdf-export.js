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
    const pages=[[]], page=pages[0], gap=18, colW=(CONTENT_W-gap)/2, right=MARGIN+colW+gap;
    page.push(rectCmd(0,704,PAGE_W,88,BLUE));
    page.push(textCmd('ORBIT  /  CREATOR CAMPAIGN BRIEF',MARGIN,762,8,true,[1,1,1]));
    page.push(textCmd(ascii(data.campaign||'Campaign'),MARGIN,735,20,true,[1,1,1]));
    page.push(textCmd(`Brand: ${data.brand||'Peakline'}   |   Creator: ${data.creator||'Creator'}`,MARGIN,714,8,false,[.90,.93,1]));

    const block=(x,top,width,title,items,options={})=>{
      const size=options.size||7.4, leading=options.leading||9.4, pad=options.pad||11;
      let cursor=top-pad-12, commands=[];
      commands.push(textCmd(title.toUpperCase(),x+pad,top-pad,7.3,true,BLUE));
      items.forEach(item=>{
        if(item.label){
          commands.push(textCmd(`${item.label}:`,x+pad,cursor,size,true,INK));
          cursor-=leading;
          wrap(item.value||'',size,width-pad*2).slice(0,item.lines||3).forEach(line=>{commands.push(textCmd(line,x+pad,cursor,size,false,MUTED));cursor-=leading;});
        } else {
          wrap(`${item.bullet?'• ':''}${item.bullet||item.text||''}`,size,width-pad*2).slice(0,item.lines||2).forEach(line=>{commands.push(textCmd(line,x+pad,cursor,size,false,MUTED));cursor-=leading;});
        }
        cursor-=3;
      });
      const height=Math.max(options.minHeight||0,top-cursor+5);
      page.push(rectCmd(x,top-height,width,height,options.fill||PALE));
      page.push(...commands);
      return top-height-10;
    };

    const objectiveTop=687, objectiveH=54;
    page.push(rectCmd(MARGIN,objectiveTop-objectiveH,CONTENT_W,objectiveH,INK));
    page.push(textCmd('CAMPAIGN OBJECTIVE',MARGIN+14,objectiveTop-17,7.3,true,MINT));
    wrap(data.objective||'',9.2,CONTENT_W-28).slice(0,2).forEach((line,index)=>page.push(textCmd(line,MARGIN+14,objectiveTop-35-index*11,9.2,true,[1,1,1])));

    let leftY=620, rightY=620;
    leftY=block(MARGIN,leftY,colW,'Partnership',[
      {label:'Product',value:data.product||'Peakline Hydration',lines:1},
      {label:'Audience',value:data.audience||'',lines:2},
      {label:'Format',value:data.format||'',lines:2},
      {label:'Estimated fee',value:data.compensation||'',lines:2},
      {label:'Why this creator',value:data.creatorFit||'',lines:3}
    ]);
    leftY=block(MARGIN,leftY,colW,'Deliverables',(data.deliverables||[]).slice(0,4).map(bullet=>({bullet,lines:2})));
    leftY=block(MARGIN,leftY,colW,'Creative direction',[
      {label:'Scene',value:data.scene||'',lines:3},
      {label:'Opening',value:data.opening||'',lines:3},
      {label:'Tone',value:data.tone||'',lines:2}
    ]);
    leftY=block(MARGIN,leftY,colW,'Timeline',[
      {label:'Draft',value:data.draftDue||'June 6, 2026',lines:1},
      {label:'Feedback',value:data.feedback||'One consolidated round within two business days',lines:2},
      {label:'Go-live',value:data.goLive||'June 18, 2026',lines:1}
    ]);

    rightY=block(right,rightY,colW,'Messages and CTA',[
      ...(data.messages||[]).slice(0,3).map(bullet=>({bullet,lines:2})),
      {label:'CTA',value:data.cta||'',lines:3}
    ]);
    rightY=block(right,rightY,colW,'Brand guardrails',[
      {label:'Must include',value:data.mustInclude||'',lines:3},
      {label:'Avoid',value:data.avoid||'',lines:3},
      {label:'Disclosure',value:data.disclosure||'',lines:3}
    ],{fill:[.985,.963,.958]});
    rightY=block(right,rightY,colW,'Rights and terms',[
      {label:'Usage',value:data.usage||'',lines:3},
      {label:'Exclusivity',value:data.exclusivity||'',lines:3}
    ]);
    rightY=block(right,rightY,colW,'Evidence',[
      {label:'YouTube analysis',value:data.evidence||'',lines:3},
      {label:'Timestamp',value:data.timestamp||'',lines:2},
      {text:'AI recommendations require human review. Public data only.',lines:2}
    ]);

    page.push(lineCmd(MARGIN,38,MARGIN+CONTENT_W,38));
    page.push(textCmd('Human approval required  |  Paid promotion disclosure required',MARGIN,23,7,false,MUTED));
    page.push(textCmd('1 / 1',PAGE_W-MARGIN-20,23,7,true,MUTED));

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
