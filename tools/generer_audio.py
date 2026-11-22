"""Génère les fichiers audio (voix française de synthèse) : python3 tools/generer_audio.py MODELE.onnx
Écrit audio/<id>.mp3 et audio/manifest.json (texte -> fichier). Ne régénère que les phrases nouvelles."""
import json, sys, subprocess, hashlib, wave, os
from piper import PiperVoice
from piper.config import SynthesisConfig
root=os.path.join(os.path.dirname(__file__),'..'); out=os.path.join(root,'audio')
model=sys.argv[1]; v=PiperVoice.load(model,config_path=model+'.json')
textes=json.loads(subprocess.check_output(['node',os.path.join(root,'tools/textes.js')]))
man_path=os.path.join(out,'manifest.json'); man=json.load(open(man_path)) if os.path.exists(man_path) else {}
cfg=SynthesisConfig(length_scale=1.15,noise_scale=0.6,noise_w_scale=0.7)
for t in textes:
    fid=hashlib.sha1(t.encode()).hexdigest()[:12]+'.mp3'
    if man.get(t)==fid and os.path.exists(os.path.join(out,fid)): continue
    wav='/tmp/_nsa.wav'
    with wave.open(wav,'wb') as w: v.synthesize_wav(t,w,syn_config=cfg)
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',wav,'-af','apad=pad_dur=0.15','-ac','1','-b:a','64k',os.path.join(out,fid)],check=True)
    man[t]=fid
man={t:man[t] for t in textes if t in man}
for f in os.listdir(out):
    if f.endswith('.mp3') and f not in man.values(): os.remove(os.path.join(out,f))
json.dump(man,open(man_path,'w'),ensure_ascii=False,indent=0)
print(len(man),'phrases')
