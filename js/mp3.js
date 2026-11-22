/* Conversion d'un enregistrement en MP3 (lisible sur tous les téléphones) : silence coupé, volume normalisé. */
window.toMp3=async function(blob){
  try{
    const AC=window.AudioContext||window.webkitAudioContext; const ctx=new AC();
    const buf=await new Promise((res,rej)=>{ blob.arrayBuffer().then(ab=>{ const p=ctx.decodeAudioData(ab,res,rej); if(p&&p.then) p.then(res,rej); },rej); });
    const n=buf.length, sr=buf.sampleRate, mono=new Float32Array(n);
    for(let c=0;c<buf.numberOfChannels;c++){ const d=buf.getChannelData(c); for(let i=0;i<n;i++) mono[i]+=d[i]/buf.numberOfChannels; }
    let peak=0; for(let i=0;i<n;i++){ const v=Math.abs(mono[i]); if(v>peak) peak=v; }
    const th=Math.max(0.02,peak*0.08); let a=0,b=n-1; while(a<n&&Math.abs(mono[a])<th) a++; while(b>a&&Math.abs(mono[b])<th) b--;
    a=Math.max(0,a-Math.round(sr*0.08)); b=Math.min(n-1,b+Math.round(sr*0.25));
    const part=mono.subarray(a,b+1), out=22050, len=Math.max(1,Math.round(part.length*out/sr));
    const off=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,len,out);
    const src=off.createBuffer(1,part.length,sr); src.getChannelData(0).set(part);
    const node=off.createBufferSource(); node.buffer=src; node.connect(off.destination); node.start(0);
    const r=await off.startRendering(); const f=r.getChannelData(0); const gain=peak>0?Math.min(4,0.9/peak):1;
    const pcm=new Int16Array(f.length); for(let i=0;i<f.length;i++){ const v=Math.max(-1,Math.min(1,f[i]*gain)); pcm[i]=v<0?v*32768:v*32767; }
    const enc=new lamejs.Mp3Encoder(1,out,64), chunks=[];
    for(let i=0;i<pcm.length;i+=1152){ const m=enc.encodeBuffer(pcm.subarray(i,i+1152)); if(m.length) chunks.push(new Uint8Array(m)); }
    const e=enc.flush(); if(e.length) chunks.push(new Uint8Array(e)); ctx.close&&ctx.close();
    return new Blob(chunks,{type:'audio/mpeg'});
  }catch(err){ console.warn('conversion mp3 impossible',err); return blob; }
};
