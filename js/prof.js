/* Espace formatrice : résultats des élèves et enregistrement de la voix des consignes. */
(function(){
const C=window.NSA_CONFIG||{}, S=window.NSA_STORE, A=window.NSA_AUDIO, ico=window.ICO, CT=window.NSA_CONTENT;
const app=document.getElementById('app'); const $=s=>app.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>s>=60?Math.round(s/60)+' min':s+' s';
const ST={tab:'res',weeks:[],week:1,rows:[],detail:null,voix:{},recKey:null,preview:null};
let toastT; function toast(m){ let t=document.getElementById('toast'); if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);} t.innerHTML=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3500);}

/* ---------- connexion ---------- */
let sess=S.ls('session');
async function auth(body,grant){
  const r=await fetch(`${C.supabaseUrl}/auth/v1/token?grant_type=${grant}`,{method:'POST',headers:{apikey:C.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json(); if(!r.ok) throw new Error(j.error_description||j.msg||'Connexion refusée');
  sess={token:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in-60)*1000,email:j.user&&j.user.email}; S.ls('session',sess); return sess;
}
async function token(){
  if(!sess) throw new Error('non connecté');
  if(Date.now()>sess.exp) await auth({refresh_token:sess.refresh},'refresh_token');
  return sess.token;
}
async function api(path,opt={}){
  const t=await token();
  const r=await fetch(C.supabaseUrl+path,Object.assign({},opt,{headers:Object.assign({apikey:C.supabaseAnonKey,Authorization:'Bearer '+t},opt.headers||{})}));
  if(r.status===401){ sess=null; S.ls('session',null); render(); throw new Error('Session expirée'); }
  return r;
}
function vLogin(msg){
  app.innerHTML=`<h1>Espace formatrice</h1>
   ${!S.online()?`<div class="fb ko">L'application n'est pas encore reliée à Supabase (fichier js/config.js).</div>`:''}
   <div class="panel"><label for="em">Adresse e-mail</label><input class="plain" id="em" type="email" autocomplete="username">
   <label for="pw">Mot de passe</label><input class="plain" id="pw" type="password" autocomplete="current-password">
   <button class="btn" id="go">Se connecter</button>${msg?`<div class="fb ko">${esc(msg)}</div>`:''}</div>`;
  $('#go').onclick=async()=>{ try{ await auth({email:$('#em').value.trim(),password:$('#pw').value},'password'); render(); }catch(e){ vLogin(e.message==='Invalid login credentials'?'E-mail ou mot de passe incorrect.':e.message); } };
}

/* ---------- résultats ---------- */
async function loadRows(){
  const r=await api(`/rest/v1/resultats?semaine=eq.${ST.week}&order=created_at.asc&select=*`);
  ST.rows=r.ok?await r.json():[];
}
function students(){
  const by={};
  ST.rows.forEach(r=>{ const k=r.eleve.toLowerCase()+'|'+r.appareil; (by[k]=by[k]||{eleve:r.eleve,appareil:r.appareil,acts:{},last:r.created_at});
    const s=by[k]; s.last=r.created_at; (s.acts[r.activite]=s.acts[r.activite]||[]).push(r); });
  return Object.values(by).sort((a,b)=>a.eleve.localeCompare(b.eleve,'fr'));
}
function weekObj(){ return ST.weekData; }
async function vRes(){
  app.innerHTML=tabs()+weekSelect()+`<p class="muted">Chargement des résultats…</p>`; bindTop();
  try{ await loadRows(); }catch(e){ return; }
  const w=weekObj(), list=students(), n=w.activites.length;
  if(ST.detail){ const s=list.find(x=>x.eleve+'|'+x.appareil===ST.detail); if(s) return vDetail(s,w); ST.detail=null; }
  app.innerHTML=tabs()+weekSelect()+`
   <p class="muted" style="font-size:.88rem">Touchez un élève pour voir ses réponses et écouter ses enregistrements. Le score retenu est la première tentative de chaque activité.</p>
   ${list.length?`<div style="overflow-x:auto"><table><thead><tr><th>Élève</th><th>Activités</th><th>Score</th><th>Temps</th><th>Dernière fois</th></tr></thead><tbody>
   ${list.map(s=>{ let sc=0,tt=0,tm=0; Object.values(s.acts).forEach(a=>{ sc+=a[0].score||0; tt+=a[0].total||0; a.forEach(x=>tm+=x.duree_s||0); });
     const d=Object.keys(s.acts).length;
     return `<tr class="row" data-k="${esc(s.eleve+'|'+s.appareil)}" tabindex="0"><td><b>${esc(s.eleve)}</b></td><td>${d === n?'<span class="pill ok">'+d+'/'+n+'</span>':'<span class="pill wait">'+d+'/'+n+'</span>'}</td>
       <td>${tt?Math.round(sc/tt*100)+' %':'–'}</td><td>${fmt(tm)}</td><td>${new Date(s.last).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</td></tr>`;}).join('')}
   </tbody></table></div>`:`<div class="panel">Aucun résultat pour la semaine ${ST.week} pour l'instant.</div>`}
   <button class="btn ghost small" id="refresh">Actualiser</button>`;
  bindTop();
  app.querySelectorAll('tr.row').forEach(r=>{ r.onclick=()=>{ ST.detail=r.dataset.k; vRes(); }; r.onkeydown=e=>{ if(e.key==='Enter') r.onclick(); }; });
  $('#refresh').onclick=vRes;
}
function vDetail(s,w){
  app.innerHTML=`<div class="bar"><button class="back" id="bk" aria-label="Retour">${ico.back}</button><div><h1>${esc(s.eleve)}</h1><p class="muted">Semaine ${w.n} · ${esc(w.titre)}</p></div></div>
   ${w.activites.map(a=>{ const tries=s.acts[a.id]; if(!tries) return `<div class="panel"><h3>${esc(a.titre)}</h3><span class="pill wait" style="justify-self:start">Pas encore fait</span></div>`;
     const r=tries[0], lastAudio=[...tries].reverse().find(x=>x.audio_path);
     return `<div class="panel"><div style="display:flex;justify-content:space-between;gap:8px"><h3>${esc(a.titre)}</h3><b>${r.score}/${r.total}</b></div>
      <div class="muted" style="font-size:.82rem">${fmt(r.duree_s||0)} · ${tries.length} tentative(s)</div>
      ${lastAudio?`<div data-audio="${esc(lastAudio.audio_path)}"><button class="btn ghost small" data-load>${ico.play} Écouter l'enregistrement</button></div>`:''}
      ${(r.reponses||[]).length&&!lastAudio?`<ul class="ans">${r.reponses.map(x=>`<li><span class="${x.ok?'k':'x'}">${x.ok?'✓':'✗'}</span><span>${esc(x.q)} : <b>${esc(x.given)}</b></span></li>`).join('')}</ul>`:''}
     </div>`; }).join('')}`;
  $('#bk').onclick=()=>{ ST.detail=null; vRes(); };
  app.querySelectorAll('[data-load]').forEach(b=>b.onclick=async()=>{
    const box=b.parentElement; b.disabled=true; b.textContent='Chargement…';
    try{ const r=await api(`/storage/v1/object/authenticated/eleves/${box.dataset.audio}`); if(!r.ok) throw 0;
      const url=URL.createObjectURL(await r.blob()); box.innerHTML=`<audio controls autoplay src="${url}" style="width:100%"></audio>`;
    }catch(e){ b.disabled=false; b.textContent="Impossible de charger l'enregistrement"; }
  });
}

/* ---------- ma voix ---------- */
let rec=null;
async function loadVoix(){ try{ const r=await fetch(A.pub('index.json')+'?t='+Date.now(),{cache:'no-store'}); ST.voix=r.ok?await r.json():{}; }catch(e){ ST.voix={}; } }
async function vVoix(){
  await loadVoix();
  const list=CT.audioList(weekObj()); const done=list.filter(x=>ST.voix[x.key]).length;
  let lastAct='';
  app.innerHTML=tabs()+weekSelect()+`
   <div class="banner"><b>${done} / ${list.length} phrases enregistrées</b><span>Touchez le bouton rouge, lisez la phrase, puis touchez-le à nouveau. Écoutez, puis touchez « Garder ». Les phrases non enregistrées sont lues par la voix de synthèse.</span></div>
   <div>${list.map(x=>{ const head=x.act!==lastAct?`<h3 style="margin:14px 0 2px;font-size:1rem">${x.actIndex}. ${esc(x.act)}</h3>`:''; lastAct=x.act;
     const has=!!ST.voix[x.key], recNow=ST.recKey===x.key&&rec, prev=ST.preview&&ST.preview.key===x.key;
     return head+`<div class="rec-row" data-k="${x.key}">
      <button class="round ${recNow?'red rec':'red'}" data-act="rec" aria-label="${recNow?'Arrêter':'Enregistrer'}">${recNow?ico.stop(20):ico.mic(22)}</button>
      <div style="min-width:0"><div style="font-weight:600">${esc(x.text)}</div><div class="muted" style="font-size:.78rem">${esc(x.role)} · ${has?'<span style="color:var(--ok)">votre voix ✓</span>':'voix de synthèse'}</div>
       ${prev?`<audio controls src="${ST.preview.url}" style="width:100%;margin-top:6px"></audio><div class="row2" style="margin-top:6px"><button class="btn small ghost" data-act="redo">Refaire</button><button class="btn small" data-act="keep">${ico.check} Garder</button></div>`:''}</div>
      <button class="round blue" data-act="play" aria-label="Écouter">${ico.play}</button></div>`; }).join('')}</div>`;
  bindTop();
  app.querySelectorAll('.rec-row').forEach(row=>{
    const k=row.dataset.k, item=list.find(x=>x.key===k);
    row.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{
      const act=b.dataset.act;
      if(act==='play'){ A.loadIndex().then(()=>A.play(k,item.text)); }
      if(act==='rec'){ if(rec&&ST.recKey===k){ rec.stop(); return; } if(rec) return; startRec(k); }
      if(act==='redo'){ ST.preview=null; startRec(k); }
      if(act==='keep'){ b.disabled=true; b.textContent='Envoi…'; try{ await save(k,ST.preview.blob); ST.preview=null; toast('Enregistré ✓'); }catch(e){ toast("L'envoi a échoué. Vérifiez Internet et réessayez."); } vVoix(); }
    });
  });
}
async function startRec(k){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||'';
    rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined); const chunks=[]; ST.recKey=k; ST.preview=null;
    rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
    rec.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); const blob=new Blob(chunks,{type:(rec.mimeType||mime||'audio/webm').split(';')[0]}); ST.preview={key:k,blob,url:URL.createObjectURL(blob)}; rec=null; ST.recKey=null; vVoix(); };
    rec.start(); vVoix();
  }catch(e){ toast("Le micro est bloqué. Autorisez le micro pour ce site dans les réglages."); }
}
async function save(k,blob){
  const ext=blob.type.includes('mp4')?'m4a':'webm', file=`${k}-${Date.now()}.${ext}`;
  let r=await api(`/storage/v1/object/voix/${file}`,{method:'POST',headers:{'Content-Type':blob.type,'cache-control':'max-age=31536000'},body:blob});
  if(!r.ok) throw new Error('upload');
  await loadVoix(); const old=ST.voix[k]; ST.voix[k]=file;
  r=await api(`/storage/v1/object/voix/index.json`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true','cache-control':'no-cache'},body:JSON.stringify(ST.voix)});
  if(!r.ok) throw new Error('index');
  if(old) api(`/storage/v1/object/voix/${old}`,{method:'DELETE'}).catch(()=>{});
}

/* ---------- commun ---------- */
const tabs=()=>`<div class="bar" style="justify-content:space-between"><h1>Espace formatrice</h1><button class="btn ghost small" id="out" style="width:auto">Déconnexion</button></div>
  <div class="tabs"><button id="t-res" aria-pressed="${ST.tab==='res'}">Résultats</button><button id="t-voix" aria-pressed="${ST.tab==='voix'}">Ma voix</button></div>`;
const weekSelect=()=>`<select class="plain" id="wk" aria-label="Semaine">${ST.weeks.map(w=>`<option value="${w.n}" ${w.n===ST.week?'selected':''}>Semaine ${w.n} · ${esc(w.titre)}</option>`).join('')}</select>`;
function bindTop(){
  const o=$('#out'); if(o) o.onclick=()=>{ sess=null; S.ls('session',null); render(); };
  const a=$('#t-res'), b=$('#t-voix'); if(a) a.onclick=()=>{ ST.tab='res'; ST.detail=null; render(); }; if(b) b.onclick=()=>{ ST.tab='voix'; render(); };
  const w=$('#wk'); if(w) w.onchange=async()=>{ ST.week=+w.value; ST.detail=null; await loadWeekData(); render(); };
}
async function loadWeekData(){ const r=await fetch(`weeks/semaine-${ST.week}.json`,{cache:'no-store'}); ST.weekData=await r.json(); }
function render(){ if(!sess||!S.online()) return vLogin(); if(ST.tab==='voix') vVoix(); else vRes(); }
(async function boot(){
  try{ ST.weeks=(await (await fetch('weeks/index.json',{cache:'no-store'})).json()).semaines; ST.week=ST.weeks[ST.weeks.length-1].n; await loadWeekData(); }catch(e){}
  render();
})();
})();
