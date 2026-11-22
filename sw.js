/* Service worker : l'application et les semaines marchent sans Internet. */
const VERSION='nsa-v9';
const SHELL=['./','index.html','css/app.css','js/config.js','js/store.js','js/pictos.js','js/content.js','js/audio.js','js/app.js',
  'fonts/lexend-latin.woff2','fonts/playwrite-fr.woff2','manifest.webmanifest','icons/icon-192.png','icons/icon-180.png',
  'weeks/index.json','weeks/semaine-1.json','weeks/semaine-2.json'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(async c=>{ await c.addAll(SHELL.concat(['audio/manifest.json']));
  try{ const m=await (await fetch('audio/manifest.json')).json(); await c.addAll([...new Set(Object.values(m))].map(f=>'audio/'+f)); }catch(e){} }).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!=='nsa-voix').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  if(u.origin!==location.origin){ // voix de la formatrice (Supabase) : cache d'abord
    if(u.pathname.includes('/storage/v1/object/public/voix/') && !u.pathname.endsWith('index.json')){
      e.respondWith(caches.open('nsa-voix').then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(r=>{ if(r.ok) c.put(e.request,r.clone()); return r; }))));
    }
    return;
  }
  if(u.pathname.endsWith('prof.html')||u.pathname.includes('/js/prof')) return;
  // réseau d'abord pour les contenus (mises à jour), cache sinon
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cl=r.clone(); caches.open(VERSION).then(c=>c.put(e.request,cl)); } return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));
});
