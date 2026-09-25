/* Self-contained 3D canvas renderer: no third-party scripts, tracking, or storage. */
(() => {
  const canvas=document.getElementById("scanner-3d");
  if(!canvas)return;
  const ctx=canvas.getContext("2d");
  const steps=[
    {id:"shell",label:"Снять внешний кожух",title:"Внешний кожух",soon:"Облицовочные панели МРТ"},
    {id:"table",label:"Выдвинуть стол",title:"Стол пациента",soon:"Направляющие стола"},
    {id:"rf",label:"Раскрыть RF-модуль",title:"Радиочастотный узел",items:[["Генераторная лампа 3CX800A7","3cx800a7"],["Генераторная лампа 3CPX1500A7","3cpx1500a7"]],tool:["Сервисный набор инструмента","titanium-tools"]},
    {id:"cryo",label:"Раскрыть криоблок",title:"Криосистема",items:[["Philips QCH Kit 1.5T","qch-kit"],["Адсорбер HC-8E","hc8e"]]}
  ];
  const active={shell:false,table:false,rf:false,cryo:false};
  const seen=new Set();
  const anim={shell:0,table:0,rf:0,cryo:0};
  const list=document.getElementById("model-steps"), status=document.getElementById("model-status"),popup=document.getElementById("model-popup");
  const hidePopup=()=>{popup.hidden=true};
  document.getElementById("model-popup-close").addEventListener("click",hidePopup);
  list.innerHTML=steps.map((s,i)=>`<button type="button" class="step-button" data-step="${s.id}" aria-pressed="false"><span class="step-number">0${i+1}</span><span class="step-label">${s.label}</span><small>＋</small></button>`).join("");
  list.addEventListener("click",event=>{
    const button=event.target.closest(".step-button");if(!button)return;
    const id=button.dataset.step;active[id]=!active[id];seen.add(id);
    document.querySelectorAll(".step-button").forEach(b=>{b.classList.toggle("active",active[b.dataset.step]);b.setAttribute("aria-pressed",active[b.dataset.step]);b.querySelector("small").textContent=active[b.dataset.step]?"−":"＋"});
    const count=seen.size;document.getElementById("progress-count").textContent=`${count} / 4`;
    document.getElementById("progress-fill").style.width=`${count*25}%`;
    const s=steps.find(item=>item.id===id);
    status.textContent=active[id]?`${s.title} открыт. ${count===4?'Все четыре узла исследованы.':(s.soon?'Планируемая позиция показана в окне на модели.':'Выберите карточку детали в окне на модели.')}`:`${s.title} собран. ${count===4?'Все четыре узла исследованы.':'Продолжайте исследование.'}`;
    if(active[id]){
      document.getElementById("model-popup-title").textContent=s.title;
      document.getElementById("model-popup-kicker").textContent=s.soon?"ПЛАНИРУЕМАЯ ПОЗИЦИЯ":"ДЕТАЛИ И ИНСТРУМЕНТЫ";
      document.getElementById("model-popup-content").innerHTML=s.soon?`<span class="model-popup-soon">${s.soon} · Скоро в наличии</span>`:`<div class="model-popup-links">${s.items.map(([name,slug])=>`<a href="product.html?id=${slug}">${name}<span>↗</span></a>`).join("")}${s.tool?`<span class="model-tool-label">ИНСТРУМЕНТ ДЛЯ СЕРВИСА</span><a href="product.html?id=${s.tool[1]}">${s.tool[0]}<span>↗</span></a>`:""}</div>`;
      popup.hidden=false;
    }else hidePopup();
  });
  document.getElementById("model-reset").addEventListener("click",()=>{
    for(const id of Object.keys(active))active[id]=false;
    seen.clear();document.querySelectorAll(".step-button").forEach(b=>{b.classList.remove("active");b.setAttribute("aria-pressed","false");b.querySelector("small").textContent="＋"});
    document.getElementById("progress-count").textContent="0 / 4";
    document.getElementById("progress-fill").style.width="0";
    status.textContent="Начните с любого узла.";hidePopup();
  });

  const faces=[];
  const addFace=(pts,color,group="core")=>faces.push({pts,color,group});
  function box(group,x,y,z,w,h,d,color){
    const X=x-w/2,U=x+w/2,Y=y-h/2,V=y+h/2,Z=z-d/2,W=z+d/2;
    addFace([[X,Y,W],[U,Y,W],[U,V,W],[X,V,W]],color,group);
    addFace([[U,Y,Z],[X,Y,Z],[X,V,Z],[U,V,Z]],color,group);
    addFace([[X,V,W],[U,V,W],[U,V,Z],[X,V,Z]],color,group);
    addFace([[X,Y,Z],[U,Y,Z],[U,Y,W],[X,Y,W]],color,group);
    addFace([[X,Y,Z],[X,Y,W],[X,V,W],[X,V,Z]],color,group);
    addFace([[U,Y,W],[U,Y,Z],[U,V,Z],[U,V,W]],color,group);
  }
  function ring(group,x,y,z,outer,inner,depth,color,innerColor=color){
    const n=44,zf=z+depth/2,zb=z-depth/2;
    for(let i=0;i<n;i++){
      const a=2*Math.PI*i/n,b=2*Math.PI*(i+1)/n;
      const ro1=[x+outer*Math.cos(a),y+outer*Math.sin(a)],ro2=[x+outer*Math.cos(b),y+outer*Math.sin(b)];
      const ri1=[x+inner*Math.cos(a),y+inner*Math.sin(a)],ri2=[x+inner*Math.cos(b),y+inner*Math.sin(b)];
      addFace([[...ro1,zf],[...ro2,zf],[...ri2,zf],[...ri1,zf]],color,group);
      addFace([[...ro2,zb],[...ro1,zb],[...ri1,zb],[...ri2,zb]],color,group);
      addFace([[...ro1,zb],[...ro2,zb],[...ro2,zf],[...ro1,zf]],color,group);
      addFace([[...ri2,zb],[...ri1,zb],[...ri1,zf],[...ri2,zf]],innerColor,group);
    }
  }
  function cylinder(group,x,y,z,r,h,color){
    const n=22,yt=y+h/2,yb=y-h/2;
    for(let i=0;i<n;i++){
      const a=2*Math.PI*i/n,b=2*Math.PI*(i+1)/n;
      const p=[x+r*Math.cos(a),z+r*Math.sin(a)],q=[x+r*Math.cos(b),z+r*Math.sin(b)];
      addFace([[p[0],yb,p[1]],[q[0],yb,q[1]],[q[0],yt,q[1]],[p[0],yt,p[1]]],color,group);
      addFace([[x,yt,z],[p[0],yt,p[1]],[q[0],yt,q[1]]],color,group);
    }
  }
  // A schematic open-bore scanner, patient table, and separate service modules.
  ring("core",0,.2,-.3,1.58,.82,1.25,"#b8d9d8","#4b8388");
  ring("core",0,.2,-.98,1.53,.86,.1,"#8bb8b9","#3f777d");
  ring("shell",0,.2,.43,1.71,.78,.28,"#e2f3ef","#7eb7b6");
  ring("shell",0,.2,.59,1.52,1.35,.06,"#f8ffff","#e8f3f1");
  box("core",0,-1.56,-.2,2.52,.31,1.62,"#789ea3");
  box("core",0,-1.84,-.2,1.91,.37,1.34,"#527a80");
  box("table",0,-.98,2.03,1.22,.15,4.2,"#ecf6f3");
  box("table",0,-1.15,2.03,1.45,.16,4.35,"#9ec6c7");
  box("table",0,-1.57,2.75,.66,.72,1.95,"#b4cdcc");
  box("table",0,-1.98,2.75,1.45,.14,2.25,"#78989e");
  box("table",0,-.87,3.72,.94,.12,.58,"#cce2dc");
  box("rf",2.22,-.39,-.56,.86,2.24,1.13,"#d7e9e6");
  box("rf",2.24,-.36,.04,.67,1.78,.08,"#4e9295");
  box("rf",2.22,-1.52,-.5,.93,.11,1.12,"#779ca0");
  cylinder("rf",2.03,-.5,.16,.09,.37,"#94d7d1");
  cylinder("rf",2.37,-.5,.16,.09,.37,"#94d7d1");
  box("cryo",-2.25,-.48,-.62,.78,1.76,.95,"#b6d0d0");
  cylinder("cryo",-2.25,-.09,-.07,.32,1.07,"#285b63");
  cylinder("cryo",-2.25,.49,-.07,.13,.17,"#adddd5");
  box("cryo",-2.25,-1.46,-.57,.89,.16,1.04,"#63888b");

  let yaw=-.38,pitch=.18,dragging=false,lastX=0,lastY=0,w=1,h=1,dpr=1;
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  window.addEventListener("resize",resize);resize();
  canvas.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener("pointermove",e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.007;pitch=Math.max(-.55,Math.min(.55,pitch+(e.clientY-lastY)*.005));lastX=e.clientX;lastY=e.clientY});
  canvas.addEventListener("pointerup",()=>dragging=false);canvas.addEventListener("pointercancel",()=>dragging=false);
  function transform(p,group){let [x,y,z]=p;const a=anim[group]||0;
    if(group==="shell"){x-=a*.38;z+=a*2.08}
    if(group==="table"){z+=a*1.22;y-=a*.08}
    if(group==="rf"){x+=a*1.42;z+=a*.2}
    if(group==="cryo"){x-=a*1.42;z+=a*.2}
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const rx=x*cy+z*sy,rz=-x*sy+z*cy;
    return [rx,y*cp-rz*sp,y*sp+rz*cp];
  }
  function project(p){const focal=10,depth=focal-p[2],scale=Math.min(w/8.5,h/6.2);return [w*.49+p[0]*scale*focal/depth,h*.56-p[1]*scale*focal/depth]}
  function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]}
  function shade(hex,amount){const a=rgb(hex);return `rgb(${a.map(v=>Math.min(255,Math.max(0,Math.round(v*amount)))).join(",")})`}
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function frame(){
    for(const id of Object.keys(anim))anim[id]+=(Number(active[id])-anim[id])*.09;
    ctx.clearRect(0,0,w,h);
    // Soft floor shadow anchors the schematic model.
    const g=ctx.createRadialGradient(w*.5,h*.78,10,w*.5,h*.78,w*.38);g.addColorStop(0,"rgba(1,21,25,.40)");g.addColorStop(1,"rgba(1,21,25,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(w*.5,h*.79,w*.41,h*.09,0,0,Math.PI*2);ctx.fill();
    const drawn=faces.map(face=>{const pts=face.pts.map(p=>transform(p,face.group));return {...face,points:pts,depth:pts.reduce((v,p)=>v+p[2],0)/pts.length}}).sort((a,b)=>a.depth-b.depth);
    for(const f of drawn){const pts=f.points;const v1=pts[1].map((n,i)=>n-pts[0][i]),v2=pts[2].map((n,i)=>n-pts[0][i]);const normal=cross(v1,v2);const len=Math.hypot(...normal)||1;const light=Math.max(0,(normal[0]*.35+normal[1]*.7+normal[2]*.6)/len);let brightness=.70+.35*light;if(f.group==="core")brightness*=.91;
      const poly=pts.map(project);ctx.beginPath();ctx.moveTo(...poly[0]);for(let i=1;i<poly.length;i++)ctx.lineTo(...poly[i]);ctx.closePath();ctx.fillStyle=shade(f.color,brightness);ctx.fill();ctx.strokeStyle="rgba(9,58,63,.16)";ctx.lineWidth=.55;ctx.stroke();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
