/* Application élève */
(function(){
const S=window.NSA_STORE, A=window.NSA_AUDIO, pic=window.PICTO, ico=window.ICO, CT=window.NSA_CONTENT;
const app=document.getElementById('app');
const $=s=>app.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

const ST={screen:'login',weeks:[],week:null,act:null,step:0,t0:0,tmp:{},prenom:S.ls('prenom')||'',appareil:S.ls('appareil')};
if(!ST.appareil){ ST.appareil=S.uid().slice(0,12); S.ls('appareil',ST.appareil); }
const resKey=n=>'res-s'+n;
const getRes=n=>S.ls(resKey(n))||{};

let toastT; function toast(m){ let t=document.getElementById('toast'); if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);} t.innerHTML=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3000);}

/* ---------- sons ---------- */
const key=(suffix)=>`s${ST.week.n}-${ST.act.id}-${suffix}`;
function playKey(k,text,btn){ if(btn){btn.classList.remove('on');void btn.offsetWidth;btn.classList.add('on');}
  A.play(k,text).then(r=>{ if(r==='aucun') toast("Pas de voix française sur ce téléphone. Lisez la phrase."); }); }

/* ---------- gabarits ---------- */
function header(a){
  return `<div class="bar"><button class="back" data-go="week" aria-label="Retour">${ico.back}</button>
   <div style="min-width:0;display:grid;gap:4px"><div class="chips"><span class="chip lvl">${esc(ST.week.niveau||'A1.1')}</span><span class="chip">${esc(a.comp)}</span></div>
   <h1 style="font-size:1.2rem">${esc(a.titre)}</h1></div></div>`;
}
function consigne(text,k){ return `<div class="consigne"><button class="spk" data-key="${esc(k||key('c'))}" data-text="${esc(text)}" aria-label="Écouter la consigne">${ico.spk}</button><p>${esc(text)}</p></div>`; }
const listen=(label,i,text)=>`<button class="btn ghost" data-key="${esc(key(String(i+1)))}" data-text="${esc(text)}">${ico.spk} ${label}</button>`;
const prog=(n,i)=>`<div class="prog">${Array.from({length:n},(_,k)=>`<i class="${k<i?'d':''}"></i>`).join('')}</div>`;
function stars(score,total){const n=total?Math.round(score/total*3):0;return `<span class="stars" aria-label="${n} étoiles sur 3">${[0,1,2].map(k=>`<span class="${k<n?'on':''}">${ico.star}</span>`).join('')}</span>`;}
const model=t=>t?`<div class="model"><b>Exemple :</b> ${esc(t)}</div>`:'';
const fbOk=t=>{ $('#fb').innerHTML=`<div class="fb ok">${ico.check} ${esc(t)}</div>`; };
function fbKo(t){ const f=$('#fb'); f.innerHTML=`<div class="fb ko" title="Toucher pour réécouter">${esc(t)}</div>`; A.speakFR(t); f.firstChild.onclick=()=>A.speakFR(t); }

/* ---------- résultats ---------- */
function judge(ok,q,given){ ST.tmp.total++; if(ok) ST.tmp.score++; ST.tmp.answers.push({q,given:String(given),ok}); }
function nextStep(n){ ST.step++; if(ST.step>=n) finish(); else render(); }
function finish(extra){
  const a=ST.act,t=ST.tmp,w=ST.week;
  const duree=Math.max(1,Math.round((Date.now()-ST.t0)/1000));
  const r=getRes(w.n); r[a.id]={score:t.score,total:t.total,duree}; S.ls(resKey(w.n),r);
  S.queue({eleve:ST.prenom,appareil:ST.appareil,semaine:w.n,activite:a.id,titre:a.titre,score:t.score,total:t.total,duree_s:duree,reponses:t.answers},extra&&extra.audio);
  ST.screen='bravo'; render();
}

/* ---------- écrans ---------- */
function vLogin(){
  app.innerHTML=`
   <div class="center" style="display:grid;gap:10px;justify-items:center;padding-top:10px">
    <span class="pic" style="width:120px;height:120px">${pic('bonjour')}</span>
    <h1 style="font-size:1.6rem">Bonjour !</h1></div>
   <div class="consigne"><button class="spk" data-key="login" data-text="Écrivez votre prénom. Touchez la flèche." aria-label="Écouter">${ico.spk}</button><p>Écrivez votre prénom. Touchez la flèche.</p></div>
   <div class="field"><span class="pic">${pic('prenom')}</span><div style="display:grid;gap:4px"><label for="in-name">PRÉNOM</label>
     <input id="in-name" autocomplete="given-name" autocapitalize="words" value="${esc(ST.prenom)}"></div></div>
   <button class="btn" id="go" aria-label="Commencer">${ico.next}</button>`;
  const go=()=>{ const v=$('#in-name').value.trim(); if(!v){ fbKoLogin(); return; } ST.prenom=cap(v.split(/\s+/)[0]); S.ls('prenom',ST.prenom); route(); };
  function fbKoLogin(){ A.speakFR('Écrivez votre prénom.'); $('#in-name').classList.add('err'); }
  $('#go').onclick=go; $('#in-name').onkeydown=e=>{ if(e.key==='Enter') go(); };
}
function installBanner(){
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if(standalone) return '';
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(ios) return `<div class="banner"><b>Installer l'application</b><span>Touchez ${ico.share} en bas de l'écran, puis « Sur l'écran d'accueil ».</span></div>`;
  if(window._installEvt) return `<div class="banner"><b>Installer l'application</b><button class="btn small" id="inst">Installer</button></div>`;
  return '';
}
async function syncLine(){
  const el=$('#sync'); if(!el) return;
  if(!S.online()){ el.textContent=''; return; }
  const p=await S.pending();
  el.textContent = p ? `${p} résultat(s) en attente d'Internet` : 'Résultats envoyés à votre formatrice ✓';
}
function vHome(){
  app.innerHTML=`
   <div style="display:grid;gap:6px"><h1>Bonjour ${esc(ST.prenom)} !</h1><p class="muted">Choisissez votre semaine.</p></div>
   ${installBanner()}
   <div class="cards">${ST.weeks.map(w=>{const r=getRes(w.n);const d=Object.keys(r).length;return `
     <button class="card" data-week="${w.n}"><span class="pic" style="display:grid;place-items:center;font:700 1.6rem var(--f-body);color:var(--ink);background:var(--surface2)">${w.n}</span>
      <span class="txt"><b>Semaine ${w.n} · ${esc(w.titre)}</b><span class="muted" style="font-size:.85rem">Son ${esc(w.son)} · ${esc(w.verbes)}</span></span>
      ${d?`<span class="chip">${d} ✓</span>`:''}</button>`}).join('')}</div>
   <p class="sync" id="sync"></p>
   <button class="btn ghost small" id="chg">Je ne suis pas ${esc(ST.prenom)}</button>`;
  $('#chg').onclick=()=>{ ST.prenom=''; S.ls('prenom',''); ST.screen='login'; render(); };
  const ib=$('#inst'); if(ib) ib.onclick=()=>{ window._installEvt.prompt(); };
  syncLine();
}
function vWeek(){
  const w=ST.week, r=getRes(w.n), done=w.activites.filter(a=>r[a.id]).length;
  app.innerHTML=`
   <div class="bar"><button class="back" data-go="home" aria-label="Retour">${ico.back}</button>
    <div style="display:grid;gap:4px;min-width:0"><div class="chips"><span class="chip lvl">${esc(w.niveau)}</span><span class="chip">Semaine ${w.n}</span><span class="chip">Son : ${esc(w.son)}</span></div>
    <h1>${esc(w.titre)}</h1></div></div>
   <p class="muted">${esc(ST.prenom)} · ${done} / ${w.activites.length} activités</p>
   ${prog(w.activites.length,done)}
   <div class="cards">${w.activites.map(a=>{const x=r[a.id];return `
     <button class="card" data-act="${a.id}"><span class="pic">${pic(a.picto)}</span>
      <span class="txt"><b>${esc(a.titre)}</b><span class="chip" style="justify-self:start">${esc(a.comp)}</span></span>
      ${x?`<span style="display:grid;gap:4px;justify-items:end"><span class="done">${ico.check}</span>${stars(x.score,x.total)}</span>`:''}</button>`}).join('')}</div>
   ${done===w.activites.length?`<div class="fb ok">${ico.check} Bravo ! Toutes les activités sont faites.</div>`:''}
   <p class="sync" id="sync"></p>`;
  syncLine();
}
function vBravo(){
  const a=ST.act,r=getRes(ST.week.n)[a.id];
  app.innerHTML=`${header(a)}
   <div class="center" style="display:grid;gap:12px;justify-items:center;padding-top:20px">
    <span class="pic" style="width:120px;height:120px">${pic('bonjour')}</span>
    <p class="big">Bravo !</p><div style="transform:scale(1.8);margin:8px">${stars(r.score,r.total)}</div>
    <p class="muted">${r.score} / ${r.total}</p></div>
   <button class="btn" data-go="week" aria-label="Continuer">${ico.next}</button>`;
}

/* ---------- activités ---------- */
function vChoice(a){
  const it=a.items[ST.step], opts=it.opts||a.opts;
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   ${it.show?`<p class="word-big">${esc(it.show)}</p>`:''}
   ${listen(it.show?'Écouter le mot':'Écouter',ST.step,it.say)}
   <div class="grid" style="--n:${opts.length}">${opts.map(([k,l])=>`<button class="opt" data-k="${k}" aria-label="${esc(l)}">${pic(k)}</button>`).join('')}</div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.k===it.ans; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,it.show||it.say,(opts.find(o=>o[0]===b.dataset.k)||[])[1]); tried=true; }
    if(ok){ fbOk('C\'est juste !'); setTimeout(()=>nextStep(a.items.length),900); } else fbKo('Essayez encore.');
  });
}
function vSound(a){
  const it=a.items[ST.step], re=new RegExp(a.hl||'[a]','gi');
  const hl=w=>esc(w).replace(re,m=>`<span class="hl">${m}</span>`);
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   <div style="display:flex;gap:12px;align-items:center;justify-content:center"><span class="pic" style="width:90px;height:90px">${pic('oreille')}</span><div id="word" class="word-big muted" style="min-width:110px">?</div></div>
   ${listen('Écouter le mot',ST.step,it.w)}
   <div class="grid" style="--n:2"><button class="opt" data-k="1" aria-label="Oui">${pic('oui')}</button><button class="opt" data-k="0" aria-label="Non">${pic('non')}</button></div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const ok=(b.dataset.k==='1')===it.a; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,`« ${it.w} » : ${a.sonLabel} ?`,b.dataset.k==='1'?'oui':'non'); tried=true; }
    if(ok){ const wd=$('#word'); wd.innerHTML=hl(it.w); wd.classList.remove('muted'); fbOk(it.a?`Oui, on entend ${a.sonLabel}.`:`Non, pas de ${a.sonLabel}.`); setTimeout(()=>nextStep(a.items.length),1300); }
    else fbKo('Écoutez encore.');
  });
}
function vLetters(a){
  const it=a.items[ST.step], o=it.o;
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   ${it.t?`<div style="display:flex;justify-content:center"><div style="font:700 5rem/1 var(--f-body);background:var(--surface2);border-radius:18px;width:130px;height:130px;display:grid;place-items:center">${esc(it.t)}</div></div>`:''}
   ${it.say?listen('Écouter',ST.step,it.say):''}
   <div class="grid" style="--n:${o.length}">${o.map(l=>`<button class="opt txt" data-k="${esc(l)}">${esc(l)}</button>`).join('')}</div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.k===it.a; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,it.t?it.t+' → ?':'« '+it.say+' » → ?',b.dataset.k); tried=true; }
    if(ok){ fbOk(it.t?`${it.t} → ${it.a}`:`« ${it.say} » → ${it.a}`); setTimeout(()=>nextStep(a.items.length),900); }
    else fbKo(it.t?'Regardez bien. Essayez encore.':'Écoutez encore.');
  });
}
function vTrace(a){
  const init=(ST.prenom[0]||'A');
  const it=a.items[ST.step], cursive=it.style==='cursive';
  const ch=it.ch==='@initiale'?(cursive?init.toLowerCase():init.toUpperCase()):it.ch;
  const font=cursive?'400 {s}px "Playwrite FR Moderne", cursive':'700 {s}px Lexend, sans-serif';
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}
   <div class="seg" aria-hidden="true"><span class="${!cursive?'on':''}">Capitale</span><span class="${cursive?'on':''}">Cursive</span></div>
   <canvas class="trace" id="cv" width="320" height="320" aria-label="Zone pour tracer la lettre ${esc(ch)}"></canvas>
   <div class="row2"><button class="btn ghost" id="er">${ico.erase} Effacer</button><button class="btn" id="ok">${ico.check} Fini</button></div><div id="fb"></div>`;
  const cv=$('#cv'),ctx=cv.getContext('2d'),W=320,dy=cursive?-10:12,size=cursive?200:230;
  const g=document.createElement('canvas');g.width=g.height=W;const gc=g.getContext('2d');
  const u=document.createElement('canvas');u.width=u.height=W;const uc=u.getContext('2d');
  function draw(){ const f=font.replace('{s}',size);
    gc.clearRect(0,0,W,W);gc.font=f;gc.textAlign='center';gc.textBaseline='middle';gc.fillStyle='#000';gc.fillText(ch,W/2,W/2+dy);
    ctx.clearRect(0,0,W,W);ctx.strokeStyle='#e3e8f2';ctx.lineWidth=2;[W*.3,W*.7].forEach(y=>{ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(W-10,y);ctx.stroke();});
    ctx.globalAlpha=.18;ctx.drawImage(g,0,0);ctx.globalAlpha=1;
    ctx.save();ctx.font=f;ctx.textAlign='center';ctx.textBaseline='middle';ctx.setLineDash([3,7]);ctx.strokeStyle='#6a768f';ctx.lineWidth=2;ctx.strokeText(ch,W/2,W/2+dy);ctx.restore();
    ctx.drawImage(u,0,0); }
  (document.fonts&&document.fonts.load?document.fonts.load(font.replace('{s}','40')):Promise.resolve()).then(draw,draw); draw();
  let down=false,last=null;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*W/r.height];};
  cv.onpointerdown=e=>{down=true;last=pos(e);cv.setPointerCapture(e.pointerId);};
  cv.onpointermove=e=>{ if(!down) return; const p=pos(e); uc.strokeStyle='#2b62d9';uc.lineWidth=20;uc.lineCap='round';uc.beginPath();uc.moveTo(last[0],last[1]);uc.lineTo(p[0],p[1]);uc.stroke();last=p;draw(); };
  cv.onpointerup=cv.onpointercancel=()=>down=false;
  $('#er').onclick=()=>{ uc.clearRect(0,0,W,W); draw(); $('#fb').innerHTML=''; };
  $('#ok').onclick=()=>{
    const gd=gc.getImageData(0,0,W,W).data,ud=uc.getImageData(0,0,W,W).data; let gn=0,hit=0,un=0;
    for(let i=3;i<gd.length;i+=16){ const gi=gd[i]>60,ui=ud[i]>60; if(gi)gn++; if(ui)un++; if(gi&&ui)hit++; }
    if(un<20){ fbKo('Tracez avec votre doigt.'); return; }
    const cover=gn?hit/gn:0, prec=un?hit/un:0, ok=cover>.35&&prec>.45;
    judge(ok,`Tracer « ${ch} » (${cursive?'cursive':'capitale'})`,Math.round(cover*100)+' % de la lettre couverte');
    if(ok) fbOk('Bien tracé !'); else fbKo('Suivez bien les pointillés.');
    setTimeout(()=>nextStep(a.items.length),1100);
  };
}
function vOrder(a){
  const name=norm(ST.prenom)||'A';
  if(ST.step===0){
    if(!ST.tmp.tiles){ ST.tmp.tiles=shuffle(name.split('').map(c=>({c}))); ST.tmp.got=[]; ST.tmp.err=0; }
    const got=ST.tmp.got;
    app.innerHTML=`${header(a)}${prog(2,0)}${consigne(a.consigne)}${model(a.exemple)}
     <div class="slots">${name.split('').map((c,i)=>`<span class="slot ${i<got.length?'f':''}">${i<got.length?got[i]:''}</span>`).join('')}</div>
     <div class="tiles">${ST.tmp.tiles.map((t,k)=>`<button class="tile" data-k="${k}" ${t.used?'disabled':''}>${t.c}</button>`).join('')}</div><div id="fb"></div>`;
    app.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{
      const t=ST.tmp.tiles[+b.dataset.k];
      if(t.c===name[got.length]){ t.used=true; got.push(t.c);
        if(got.length===name.length){ judge(ST.tmp.err===0,'Remettre son prénom dans l\'ordre',ST.tmp.err?ST.tmp.err+' erreur(s) avant de réussir':'sans erreur'); ST.step=1; ST.tmp.tiles=null; }
        render(); }
      else { ST.tmp.err++; fbKo('Pas encore. Cherchez la lettre suivante.'); }
    });
  } else {
    const n=name.length, opts=shuffle([n-1,n,n+1].filter(x=>x>0).concat(n===1?[3]:[]));
    app.innerHTML=`${header(a)}${prog(2,1)}${consigne(a.consigne2,key('c2'))}
     <div class="slots">${name.split('').map(c=>`<span class="slot f">${c}</span>`).join('')}</div>
     <div class="grid" style="--n:${opts.length}">${opts.map(x=>`<button class="opt txt" data-k="${x}">${x}</button>`).join('')}</div><div id="fb"></div>`;
    let tried=false;
    app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ const ok=+b.dataset.k===n; b.classList.add(ok?'good':'bad');
      if(!tried){ judge(ok,'Nombre de lettres du prénom',b.dataset.k); tried=true; }
      if(ok){ fbOk(`${n} lettres.`); setTimeout(()=>finish(),900); } else fbKo('Comptez avec votre doigt. Essayez encore.'); });
  }
}
const CHECK={
  upper:v=>v.length>1&&v===v.toUpperCase()&&/[A-ZÀ-Ü]/.test(v),
  cap:v=>v.length>1&&v[0]===v[0].toUpperCase()&&/[A-Za-zÀ-ü]/.test(v[0]),
  tel:v=>/^0\d{9}$/.test(v.replace(/\D/g,'')),
  cp:v=>/^\d{5}$/.test(v.replace(/\s/g,'')),
  addr:v=>/^\d+\s*(bis|ter)?\s+\S+/i.test(v.trim()),
  any:v=>v.trim().length>0
};
function vForm(a){
  app.innerHTML=`${header(a)}${consigne(a.consigne)}${model(a.exemple)}
   <div class="panel" style="gap:12px">${a.fields.map(f=>`
    <div class="field"><span class="pic">${pic(f.picto)}</span><div style="display:grid;gap:4px"><label for="f-${f.k}">${esc(f.label)}</label>
     <input id="f-${f.k}" autocomplete="off" ${f.input==='tel'?'type="tel" inputmode="tel"':f.input==='numeric'?'inputmode="numeric"':''} ${f.check==='upper'?'autocapitalize="characters"':''} placeholder="${esc(f.placeholder||'')}"></div></div>`).join('')}</div>
   <button class="btn" id="ok">${ico.check} Je valide</button><div id="fb"></div>`;
  let first=true;
  $('#ok').onclick=()=>{
    const errs=[];
    a.fields.forEach(f=>{ const el=$('#f-'+f.k), v=el.value.trim(), ok=(CHECK[f.check]||CHECK.any)(v); el.classList.toggle('err',!ok);
      if(first) judge(ok,f.label,v||'(vide)'); if(!ok) errs.push(f.err); });
    first=false;
    if(!errs.length){ fbOk('Fiche complète !'); setTimeout(()=>finish(),900); } else fbKo(errs.join(' '));
  };
}
function vMath(a){
  const it=a.items[ST.step], r=it.op==='-'?it.x-it.y:it.x+it.y;
  if(!ST.tmp.opts) ST.tmp.opts=shuffle([r-1,r,r+1].filter(v=>v>=0).concat(r===0?[2]:[]));
  const opts=ST.tmp.opts;
  const row=(n,crossed)=>`<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;max-width:120px">${Array.from({length:n},(_,i)=>`<span style="width:36px;height:36px;display:block;opacity:${crossed&&i>=n-crossed?.3:1}">${pic('crayon')}</span>`).join('')}</div>`;
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   <div class="mapbox" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px">${row(it.x)}<span style="width:34px;height:34px;flex:none">${pic(it.op==='-'?'moins':'plus')}</span>${row(it.y)}</div>
   <p class="big" style="font-size:2.2rem">${it.x} ${it.op==='-'?'−':'+'} ${it.y} = ?</p>
   <div class="grid" style="--n:${opts.length}">${opts.map(o=>`<button class="opt txt" data-k="${o}">${o}</button>`).join('')}</div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ const ok=+b.dataset.k===r; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,`${it.x} ${it.op} ${it.y}`,b.dataset.k); tried=true; }
    if(ok){ fbOk(`${it.x} ${it.op==='-'?'−':'+'} ${it.y} = ${r}`); ST.tmp.opts=null; setTimeout(()=>nextStep(a.items.length),900); } else fbKo('Comptez encore.'); });
}
function vKeypad(a){
  const it=a.items[ST.step];
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   ${listen('Écouter le chiffre',ST.step,it.say)}
   <div class="grid" style="--n:5">${'1234567890'.split('').map(d=>`<button class="opt txt" style="font-size:1.9rem" data-k="${d}">${d}</button>`).join('')}</div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ const ok=b.dataset.k===it.a; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,`« ${it.say} »`,b.dataset.k); tried=true; }
    if(ok){ fbOk(`« ${it.say} » → ${it.a}`); setTimeout(()=>nextStep(a.items.length),900); } else fbKo('Écoutez encore.'); });
}
const FR=[[2.5,51.08],[4.2,50.1],[5.8,49.5],[8.2,49.0],[7.6,48.0],[7.5,47.5],[6.1,46.3],[7.0,45.7],[6.9,44.4],[7.5,43.8],[6.2,43.1],[5.3,43.25],[4.4,43.45],[3.1,42.45],[1.7,42.45],[-1.75,43.35],[-1.4,43.8],[-1.2,44.65],[-1.25,46.15],[-2.2,47.15],[-4.75,48.35],[-3.1,48.85],[-2.0,48.65],[-1.6,49.7],[-1.2,49.35],[0.15,49.5],[1.2,49.95],[1.6,50.75]];
const CITIES=[['Paris',2.35,48.86],['Lille',3.06,50.63],['Lyon',4.84,45.76],['Marseille',5.37,43.3],['Bordeaux',-0.58,44.84],['Brest',-4.49,48.39],['Toulouse',1.44,43.6]];
const pj=(lon,lat)=>[((lon+5.3)*0.69*22).toFixed(1),((51.6-lat)*22).toFixed(1)];
function vMap(a){
  const it=a.items[ST.step], found=ST.tmp.found;
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}
   ${listen('Écouter',ST.step,it.say)}
   <div class="mapbox"><svg viewBox="0 0 210 205" role="img" aria-label="Carte de France">
    <polygon points="${FR.map(p=>pj(...p).join(',')).join(' ')}" fill="#d8ecd0" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
    ${CITIES.map(([n,lo,la])=>{const [x,y]=pj(lo,la);return `<g class="hit" data-k="${n}" role="button" aria-label="Ville">
      <circle cx="${x}" cy="${y}" r="14" fill="transparent"/><circle class="dot" cx="${x}" cy="${y}" r="6.5" fill="${found&&n===it.a?'#168a5c':'#e2453c'}" stroke="#111" stroke-width="2"/>
      ${found&&n===it.a?`<text x="${x}" y="${y-11}" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="11" fill="#111">${n}</text>`:''}</g>`}).join('')}
   </svg></div><div id="fb"></div>`;
  if(found){ fbOk(`C'est ${it.a} !`); return; }
  let tried=false;
  app.querySelectorAll('.hit').forEach(c=>c.onclick=()=>{
    const ok=c.dataset.k===it.a;
    if(!tried){ judge(ok,'Toucher '+it.a,c.dataset.k); tried=true; }
    if(ok){ ST.tmp.found=true; render(); setTimeout(()=>{ ST.tmp.found=false; nextStep(a.items.length); },1300); }
    else { c.querySelector('.dot').setAttribute('fill','#999'); fbKo(`Ce n'est pas ${it.a}. Essayez encore.`); }
  });
}
function vPlan(a){
  const it=a.items[ST.step], found=ST.tmp.found;
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}${ST.step===0?model(a.exemple):''}
   ${listen('Écouter',ST.step,it.say)}
   <div class="mapbox"><svg viewBox="0 0 100 100" role="img" aria-label="Plan d'Aubervilliers">
    <rect x="0" y="0" width="100" height="100" fill="#f4f1e8"/>
    <path d="M0 47 H100 M48 0 V100" stroke="#fff" stroke-width="7"/><path d="M0 47 H100 M48 0 V100" stroke="#c9c2b0" stroke-width="1"/>
    ${a.places.map(p=>`<g class="hit" data-k="${p.k}" role="button" aria-label="Lieu"><rect x="${p.x-3}" y="${p.y-3}" width="32" height="32" rx="6" fill="${found&&p.k===it.a?'#dff5ea':'#fff'}" stroke="${found&&p.k===it.a?'#168a5c':'#c9c2b0'}" stroke-width="2"/>
      <g transform="translate(${p.x} ${p.y}) scale(.26)">${pic(p.k).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></g>`).join('')}
   </svg></div><div id="fb"></div>`;
  if(found){ fbOk(`Oui, ${it.say} !`); return; }
  let tried=false;
  app.querySelectorAll('.hit').forEach(c=>c.onclick=()=>{
    const ok=c.dataset.k===it.a;
    if(!tried){ judge(ok,'Toucher '+it.say,(a.places.find(p=>p.k===c.dataset.k)||{}).label); tried=true; }
    if(ok){ ST.tmp.found=true; render(); setTimeout(()=>{ ST.tmp.found=false; if(ST.step+1>=a.items.length&&a.info) toast(esc(a.info)); nextStep(a.items.length); },1300); }
    else fbKo('Essayez encore.');
  });
}
function vConj(a){
  const it=a.items[ST.step], pk=({"je":"moi","j'":"moi"})[it.p.toLowerCase()]||it.p.toLowerCase();
  const sent=fill=>`${esc(it.p)}${it.glue?'':' '}<span class="blank ${fill?'f':''}">${fill?esc(it.a):'&nbsp;'}</span> ${esc(it.b)}`;
  const order=[0,3,1,4,2,5].map(i=>a.table[i]);
  app.innerHTML=`${header(a)}${prog(a.items.length,ST.step)}${consigne(a.consigne)}
   <div class="model table-model"><b style="grid-column:1/-1">Je retiens : ${esc(a.verbe)}</b>${order.map(([p,v])=>`<span>${esc(p)}</span><b>${esc(v)}</b>`).join('')}</div>
   <div style="display:flex;gap:12px;align-items:center"><span class="pic" style="width:80px;height:80px">${pic(pk)}</span><p id="sent" class="sentence-fill">${sent(false)}</p></div>
   ${listen('Écouter la phrase',ST.step,CT.itemText(a,it))}
   <div class="grid" style="--n:${it.o.length}">${shuffle(it.o).map(o=>`<button class="opt word" data-k="${esc(o)}">${esc(o)}</button>`).join('')}</div><div id="fb"></div>`;
  let tried=false;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ const ok=b.dataset.k===it.a; b.classList.add(ok?'good':'bad');
    if(!tried){ judge(ok,it.p+(it.glue?'':' ')+'… '+it.b,b.dataset.k); tried=true; }
    if(ok){ $('#sent').innerHTML=sent(true); fbOk('C\'est juste !'); setTimeout(()=>nextStep(a.items.length),1000); } else fbKo('Regardez le tableau. Essayez encore.'); });
}
let rec=null, recInt=null;
function vRecord(a){
  const st=ST.tmp.rec||'idle';
  const epele=norm(ST.prenom).split('').join(', ');
  const fill=t=>t.replace('{prenom}',ST.prenom).replace('{epele}',epele);
  app.innerHTML=`${header(a)}${consigne(a.consigne)}
   <button class="btn ghost" data-key="${esc(key('ex'))}" data-text="${esc(a.exemple)}">${ico.spk} Écouter l'exemple</button>
   <div class="sentence">${a.phrase.map(([p,t])=>`<figure><span class="pic">${pic(p)}</span>${esc(fill(t))}</figure>`).join('')}</div>
   ${st==='idle'?`<button class="mic" id="mic" aria-label="Commencer l'enregistrement">${ico.mic()}</button><p class="center muted">Touchez le micro</p>`:''}
   ${st==='rec'?`<button class="mic rec" id="stop" aria-label="Arrêter">${ico.stop()}</button><p class="timer" id="tm">0:00</p>`:''}
   ${st==='done'?`<audio controls src="${ST.tmp.url}" style="width:100%"></audio>
     <div class="row2"><button class="btn ghost" id="redo">${ico.erase} Recommencer</button><button class="btn" id="send">${ico.check} J'envoie</button></div>`:''}
   <div id="fb"></div>`;
  if(st==='idle') $('#mic').onclick=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'';
      rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined); const chunks=[];
      rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
      rec.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); ST.tmp.blob=new Blob(chunks,{type:rec.mimeType||mime||'audio/webm'}); ST.tmp.url=URL.createObjectURL(ST.tmp.blob); ST.tmp.rec='done'; render(); };
      rec.start(); ST.tmp.t=Date.now(); ST.tmp.rec='rec'; render();
      recInt=setInterval(()=>{ const s=Math.floor((Date.now()-ST.tmp.t)/1000); const e=$('#tm'); if(e) e.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); if(s>=90) stopRec(); },250);
    }catch(e){ fbKo("Le micro est bloqué. Autorisez le micro dans les réglages du téléphone."); }
  };
  function stopRec(){ clearInterval(recInt); ST.tmp.dur=Math.round((Date.now()-ST.tmp.t)/1000); if(rec&&rec.state!=='inactive') rec.stop(); }
  if(st==='rec') $('#stop').onclick=stopRec;
  if(st==='done'){
    $('#redo').onclick=()=>{ ST.tmp.rec='idle'; render(); };
    $('#send').onclick=()=>{ ST.tmp.total=1; ST.tmp.score=1; ST.tmp.answers=[{q:a.titre,given:'Enregistrement de '+ST.tmp.dur+' s',ok:true}]; finish({audio:ST.tmp.blob}); };
  }
}
const VIEWS={choice:vChoice,sound:vSound,letters:vLetters,trace:vTrace,order:vOrder,form:vForm,math:vMath,keypad:vKeypad,map:vMap,plan:vPlan,conj:vConj,record:vRecord};

/* ---------- navigation ---------- */
async function loadWeek(n){
  try{ const r=await fetch(`weeks/semaine-${n}.json`); if(!r.ok) throw 0; return await r.json(); }catch(e){ return null; }
}
async function route(){
  if(!ST.prenom){ ST.screen='login'; return render(); }
  const m=location.hash.match(/semaine-(\d+)/);
  if(m){ const w=await loadWeek(+m[1]); if(w){ ST.week=w; ST.screen='week'; return render(); } }
  ST.screen='home'; render();
}
function render(){
  clearInterval(recInt);
  if(ST.screen==='login') vLogin(); else if(ST.screen==='home') vHome(); else if(ST.screen==='week') vWeek();
  else if(ST.screen==='bravo') vBravo(); else VIEWS[ST.act.type](ST.act);
  window.scrollTo(0,0);
}
app.addEventListener('click',e=>{
  const k=e.target.closest('[data-key]'); if(k){ playKey(k.dataset.key,k.dataset.text,k.classList.contains('spk')?k:null); return; }
  const g=e.target.closest('[data-go]'); if(g){ if(g.dataset.go==='home'){ history.replaceState(null,'',location.pathname); ST.screen='home'; render(); } else { ST.screen=g.dataset.go; render(); } return; }
  const w=e.target.closest('[data-week]'); if(w){ location.hash='semaine-'+w.dataset.week; return; }
  const c=e.target.closest('[data-act]'); if(c){ ST.act=ST.week.activites.find(a=>a.id===c.dataset.act); ST.step=0; ST.t0=Date.now(); ST.tmp={score:0,total:0,answers:[]}; ST.screen='act'; render(); }
});
window.addEventListener('hashchange',route);
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); window._installEvt=e; if(ST.screen==='home') render(); });
document.addEventListener('nsa-sync',()=>syncLine());
(async function boot(){
  try{ const r=await fetch('weeks/index.json'); ST.weeks=(await r.json()).semaines; }catch(e){ ST.weeks=[]; }
  route(); A.loadIndex(); S.flush();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
})();
