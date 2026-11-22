/* Pictogrammes provisoires, style ARASAAC (contour noir, aplats).
   Pour remplacer un dessin par un vrai pictogramme ARASAAC : déposer un fichier
   pictos/<clé>.png et l'ajouter à la liste PNG ci-dessous. */
(function(){
const K='stroke="#111" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
const skin='#f1c49b';
const PNG=[]; // ex. ['bonjour','merci']
function hand(x,y,open){ if(!open) return `<circle cx="${x}" cy="${y}" r="3.6" fill="${skin}" stroke="#111" stroke-width="2.2"/>`;
  return `<g stroke="#111" stroke-width="2" stroke-linecap="round" fill="${skin}"><path d="M${x-5} ${y+6} L${x-5} ${y-1} Q${x-5} ${y-4} ${x-2} ${y-4} L${x+3} ${y-4} Q${x+6} ${y-4} ${x+6} ${y} L${x+6} ${y+6} Q${x} ${y+10} ${x-5} ${y+6} Z"/>
   <path d="M${x-4} ${y-3} L${x-5} ${y-11} M${x-1} ${y-4} L${x-1} ${y-13} M${x+2} ${y-4} L${x+3} ${y-12} M${x+5} ${y-2} L${x+7} ${y-9} M${x-5} ${y+2} L${x-10} ${y-2}" fill="none" stroke-width="2.6"/></g>`; }
function fig(cx,col,o){ o=o||{}; const L=o.la||[cx-14,66],R=o.ra||[cx+14,66];
  const head = o.back ? `<circle cx="${cx}" cy="26" r="10" fill="#4a3426" ${K}/>`
    : `<circle cx="${cx}" cy="26" r="10" fill="${skin}" ${K}/><path d="M${cx-10} 24 Q${cx-9} 14 ${cx} 15 Q${cx+9} 14 ${cx+10} 24 Q${cx+4} 18 ${cx-10} 24 Z" fill="#4a3426" stroke="#111" stroke-width="2"/>
       ${o.long?`<path d="M${cx-10} 24 Q${cx-13} 40 ${cx-8} 44 M${cx+10} 24 Q${cx+13} 40 ${cx+8} 44" stroke="#4a3426" stroke-width="5" fill="none" stroke-linecap="round"/>`:''}
       <circle cx="${cx-3.6}" cy="26" r="1.5" fill="#111"/><circle cx="${cx+3.6}" cy="26" r="1.5" fill="#111"/><path d="M${cx-4} 30 Q${cx} 34 ${cx+4} 30" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const legs = o.walk ? `M${cx-5} 74 L${cx-10} 93 M${cx+5} 74 L${cx+8} 93` : `M${cx-5} 74 L${cx-5} 93 M${cx+5} 74 L${cx+5} 93`;
  return `<path d="${legs}" stroke="#111" stroke-width="4.5" stroke-linecap="round"/>
   <path d="M${cx-11} 75 L${cx-11} 47 Q${cx-11} 38 ${cx} 38 Q${cx+11} 38 ${cx+11} 47 L${cx+11} 75 Z" fill="${col}" ${K}/>
   <path d="M${cx-9} 44 L${L[0]} ${L[1]} M${cx+9} 44 L${R[0]} ${R[1]}" stroke="#111" stroke-width="4" stroke-linecap="round"/>
   ${hand(L[0],L[1],o.lo)}${hand(R[0],R[1],o.ro)}${head}`; }
const heart=(x,y,s)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 8 C-9 1 -9 -6 -4 -6 C-1 -6 0 -3 0 -3 C0 -3 1 -6 4 -6 C9 -6 9 1 0 8 Z" fill="#e2453c" ${K}/>`;
const one=(col,o)=>fig(50,col,o);
const arrow=(x,y)=>`<path d="M${x} ${y} H${x+22} M${x+14} ${y-8} L${x+22} ${y} L${x+14} ${y+8}" stroke="#e2453c" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const sm=(tx,ty,s,inner)=>`<g transform="translate(${tx} ${ty}) scale(${s})">${inner}</g>`;
const building=(x,y,w,h,col)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}" ${K}/>`;
const P={
  bonjour:`<circle cx="50" cy="11" r="6" fill="#ffc531" ${K}/><path d="M50 1v1.5M41 11h-1.5M59 11h1.5M43.5 4.5l1 1M56.5 4.5l-1 1" ${K}/>`
    +fig(25,'#3a7bd5',{la:[15,66],ra:[46,57]})+fig(75,'#2fa36b',{la:[54,57],ra:[85,66]})+`<ellipse cx="50" cy="57" rx="7" ry="4.5" fill="${skin}" ${K}/>`,
  aurevoir:`<rect x="3" y="20" width="34" height="76" fill="#b5835a" ${K}/><rect x="8" y="25" width="24" height="71" fill="#2f3342" stroke="#111" stroke-width="2"/>
    <path d="M32 25 L42 30 L42 92 L32 96 Z" fill="#c99a6c" ${K}/>`+sm(5,12,.82,fig(20,'#8a5cd6',{back:true,walk:true,la:[12,62],ra:[28,62]}))
    +fig(72,'#3a7bd5',{la:[62,68],ra:[88,22],ro:true})+`<path d="M95 8 Q100 18 95 28 M80 6 Q76 14 79 22" stroke="#3a7bd5" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  merci:fig(24,'#2fa36b',{la:[38,58],ra:[40,58]})
    +`<rect x="36" y="50" width="16" height="13" fill="#e2453c" ${K}/><path d="M44 50v13M36 56h16" stroke="#ffc531" stroke-width="3"/>`
    +fig(76,'#3a7bd5',{la:[73,50],ra:[88,66]})+heart(58,24,1.15)+heart(92,34,.8),
  nom:`<rect x="8" y="22" width="84" height="56" rx="6" fill="#e8f0ff" ${K}/><rect x="16" y="32" width="24" height="30" fill="#c9d6ee" ${K}/><circle cx="28" cy="42" r="5" fill="${skin}" stroke="#111" stroke-width="2.5"/><path d="M48 36h34M48 48h34M48 60h22" ${K}/>`,
  prenom:sm(6,6,.9,one('#2fa36b'))+`<rect x="54" y="6" width="42" height="22" rx="4" fill="#fff6cc" ${K}/><path d="M61 17h28" ${K}/>`,
  tel:`<rect x="30" y="8" width="40" height="84" rx="8" fill="#2a2f3a" ${K}/><rect x="35" y="18" width="30" height="58" fill="#9fd1ff" stroke="#111" stroke-width="2"/><circle cx="50" cy="84" r="3" fill="#fff"/>`,
  abc:`<text x="6" y="66" font-family="Lexend,sans-serif" font-weight="700" font-size="44" fill="#e2453c">A</text><text x="40" y="66" font-family="Lexend,sans-serif" font-weight="700" font-size="44" fill="#3a7bd5">b</text><text x="70" y="66" font-family="Lexend,sans-serif" font-weight="700" font-size="44" fill="#2fa36b">c</text>`,
  doigt:`<path d="M44 92 L44 40 Q44 32 50 32 Q56 32 56 40 L56 60 L70 62 Q78 64 76 74 L72 92 Z" fill="${skin}" ${K}/><path d="M14 30 Q30 4 46 22" stroke="#3a7bd5" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 8"/>`,
  crayon:`<g transform="rotate(-35 50 50)"><rect x="40" y="14" width="20" height="58" fill="#ffc531" ${K}/><path d="M40 72 L50 90 L60 72 Z" fill="#f1c49b" ${K}/><path d="M47 84 L50 90 L53 84 Z" fill="#111"/><rect x="40" y="8" width="20" height="8" fill="#e98aa3" ${K}/></g>`,
  carte:`<path d="M30 14 L58 10 L80 26 L76 48 L84 66 L66 86 L40 90 L28 72 L14 66 L18 44 L10 30 Z" fill="#cfe7c6" ${K}/><path d="M50 32 C42 32 38 38 38 44 C38 54 50 64 50 64 C50 64 62 54 62 44 C62 38 58 32 50 32 Z" fill="#e2453c" ${K}/><circle cx="50" cy="44" r="4" fill="#fff" stroke="#111" stroke-width="2"/>`,
  micro:`<rect x="38" y="10" width="24" height="46" rx="12" fill="#5b6475" ${K}/><path d="M28 44 Q28 68 50 68 Q72 68 72 44 M50 68 V84 M36 88 H64" ${K} fill="none"/>`,
  plus:`<path d="M50 20v60M20 50h60" stroke="#111" stroke-width="9" stroke-linecap="round"/>`,
  moins:`<path d="M20 50h60" stroke="#111" stroke-width="9" stroke-linecap="round"/>`,
  moi:fig(50,'#e98a3a',{la:[46,54],ra:[54,54]})+`<path d="M78 40 H62 M68 34 L62 40 L68 46" stroke="#e2453c" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  oreille:`<path d="M34 40 Q34 14 56 14 Q80 14 78 40 Q77 52 66 60 Q58 66 58 76 Q58 90 44 88 Q34 86 34 76" fill="${skin}" ${K}/><path d="M46 42 Q46 28 57 28 Q67 28 66 40 Q65 48 56 50" ${K} fill="none"/><path d="M84 30 Q92 42 84 54 M90 22 Q102 42 90 62" stroke="#3a7bd5" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  tu:sm(12,0,1,one('#3a7bd5'))+arrow(4,52),
  il:one('#3a7bd5'),
  elle:one('#8a5cd6',{long:true}),
  nous:sm(-6,18,.62,one('#3a7bd5'))+sm(50,18,.62,one('#2fa36b'))+sm(15,8,.7,one('#e98a3a')),
  vous:sm(22,18,.62,one('#3a7bd5'))+sm(52,18,.62,one('#2fa36b'))+arrow(0,52),
  ils:sm(-4,18,.62,one('#3a7bd5'))+sm(26,18,.62,one('#2fa36b'))+sm(56,18,.62,one('#e98a3a')),
  elles:sm(-4,18,.62,one('#8a5cd6',{long:true}))+sm(26,18,.62,one('#2fa36b',{long:true}))+sm(56,18,.62,one('#e98a3a',{long:true})),
  livre:`<path d="M50 26 Q32 16 10 20 V80 Q32 76 50 86 Q68 76 90 80 V20 Q68 16 50 26 Z" fill="#e8f0ff" ${K}/><path d="M50 26 V86" ${K}/>`,
  sac:`<path d="M28 38 Q28 18 50 18 Q72 18 72 38" ${K} fill="none"/><rect x="16" y="36" width="68" height="54" rx="10" fill="#2fa36b" ${K}/><rect x="34" y="54" width="32" height="18" rx="4" fill="#ffc531" ${K}/>`,
  maison:`<path d="M14 48 L50 16 L86 48" fill="none" ${K}/><rect x="22" y="46" width="56" height="44" fill="#f7d9a8" ${K}/><path d="M14 48 L50 16 L86 48 Z" fill="#e2453c" ${K}/><rect x="42" y="64" width="16" height="26" fill="#b5835a" ${K}/><rect x="28" y="54" width="10" height="10" fill="#9fd1ff" stroke="#111" stroke-width="2.5"/>`,
  adresse:`<path d="M14 48 L50 16 L86 48 Z" fill="#e2453c" ${K}/><rect x="22" y="46" width="56" height="44" fill="#f7d9a8" ${K}/><rect x="56" y="64" width="16" height="26" fill="#b5835a" ${K}/>
    <rect x="28" y="54" width="22" height="16" rx="3" fill="#2b62d9" ${K}/><text x="39" y="67" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="13" fill="#fff">8</text>`,
  ville:building(8,40,24,52,'#c9d6ee')+building(34,18,30,74,'#9fb6e0')+building(66,32,26,60,'#c9d6ee')
    +`<path d="M14 50h12M14 62h12M14 74h12M40 28h18M40 40h18M40 52h18M40 64h18M72 42h14M72 54h14M72 66h14" stroke="#111" stroke-width="2.5"/>`,
  alphabet:`<rect x="6" y="14" width="88" height="72" rx="8" fill="#fff6cc" ${K}/><text x="50" y="44" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="22" fill="#111">A B C</text><text x="50" y="72" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="22" fill="#111">D E F</text>`,
  mairie:`<path d="M50 10 V26" ${K}/><path d="M50 10 L66 14 L50 18 Z" fill="#2b62d9" stroke="#111" stroke-width="2"/><path d="M10 44 L50 26 L90 44 Z" fill="#d0d6e2" ${K}/><rect x="14" y="44" width="72" height="44" fill="#eef1f6" ${K}/>
    <path d="M26 50v32M40 50v32M60 50v32M74 50v32" stroke="#111" stroke-width="4"/><rect x="8" y="86" width="84" height="6" fill="#d0d6e2" ${K}/>`,
  metro:`<circle cx="50" cy="50" r="38" fill="#ffc531" ${K}/><text x="50" y="66" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="46" fill="#111">M</text>`,
  lycee:`<rect x="10" y="34" width="80" height="56" fill="#f7d9a8" ${K}/><path d="M6 36 L50 12 L94 36 Z" fill="#2fa36b" ${K}/><rect x="42" y="62" width="16" height="28" fill="#b5835a" ${K}/>
    <path d="M50 46 Q42 41 33 43 V55 Q42 53 50 58 Q58 53 67 55 V43 Q58 41 50 46 Z M50 46 V58" fill="#fff" stroke="#111" stroke-width="2.5"/>`,
  parc:`<path d="M6 90 H94" ${K}/><path d="M28 90 V62" stroke="#7a5230" stroke-width="7"/><circle cx="28" cy="48" r="20" fill="#56b36b" ${K}/><path d="M70 90 V68" stroke="#7a5230" stroke-width="6"/><circle cx="70" cy="56" r="15" fill="#7ccf73" ${K}/>`,
  oui:`<circle cx="50" cy="50" r="40" fill="#dff5ea" ${K}/><path d="M30 52 L45 66 L72 36" stroke="#168a5c" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  non:`<circle cx="50" cy="50" r="40" fill="#fde7e5" ${K}/><path d="M34 34 L66 66 M66 34 L34 66" stroke="#c8433d" stroke-width="9" stroke-linecap="round"/>`,
  epeler:fig(30,'#3a7bd5')+`<path d="M50 12 H94 V46 H64 L56 56 L58 46 H50 Z" fill="#fff" ${K}/><text x="72" y="35" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="16" fill="#111">A-B-C</text>`,
};
const ICO={
  spk:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.8 6a8.5 8.5 0 0 1 0 12"/></svg>',
  back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>',
  star:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9z"/></svg>',
  mic:(s=54)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  stop:(s=44)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  play:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  erase:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/></svg>',
  share:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/></svg>'
};
window.PICTO=function(k){
  if(PNG.includes(k)) return `<img src="pictos/${k}.png" alt="" style="width:100%;height:100%;object-fit:contain">`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${P[k]||P.livre}</svg>`;
};
window.PICTO_KEYS=Object.keys(P);
window.ICO=ICO;
})();
