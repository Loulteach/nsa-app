/* Touchers fiables : un bouton répond dès que le doigt se lève, même si le doigt a un peu glissé
   ou si l'élève appuie longtemps (sur téléphone, ces touchers étaient parfois ignorés). */
(function(){
let s=null, suppressUntil=0;
const SEL='button,[role="button"],.hit';
document.addEventListener('touchstart',e=>{
  if(e.touches.length>1){ s=null; return; }
  const t=e.touches[0], el=e.target.closest&&e.target.closest(SEL);
  s=(el&&!el.disabled)?{el,x:t.clientX,y:t.clientY,sy:window.scrollY,time:Date.now()}:null;
},{capture:true,passive:true});
document.addEventListener('touchmove',e=>{ if(!s) return; const t=e.touches[0];
  if(Math.hypot(t.clientX-s.x,t.clientY-s.y)>40) s=null; },{capture:true,passive:true});
document.addEventListener('touchcancel',()=>{ s=null; },{capture:true,passive:true});
document.addEventListener('touchend',e=>{
  const st=s; s=null; if(!st) return;
  const t=e.changedTouches[0];
  if(Math.hypot(t.clientX-st.x,t.clientY-st.y)>40 || Math.abs(window.scrollY-st.sy)>40 || Date.now()-st.time>3000) return;
  if(st.el.disabled||!st.el.isConnected) return;
  e.preventDefault(); /* pas de double clic ni de zoom */
  suppressUntil=Date.now()+700;
  if(window.NSA_AUDIO&&window.NSA_AUDIO.unlock) window.NSA_AUDIO.unlock();
  st.el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
},{capture:true,passive:false});
/* le clic « natif » qui suit parfois est ignoré pour ne pas compter deux fois */
document.addEventListener('click',e=>{ if(e.isTrusted&&Date.now()<suppressUntil){ e.stopPropagation(); e.preventDefault(); } },true);
})();
