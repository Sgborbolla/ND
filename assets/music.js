// ND — musica. Sintetizada en tiempo real con WebAudio.
//
// El juego no es mudo: esto genera bajo, percusion, arpegio, pad, lead
// y una capa de tension que entra en combate. Todo en el mismo motor que
// los SFX, sin ficheros de audio.
//
// Tecla: Am pentatonica menor [0,3,5,7,10]. 4 compases, roots porcompas.

var BPM=104,SPB=60/BPM,S16=SPB/4,S64=SPB;

// Roots por hero: Rika/Goro graves, Ren alto y tenso, Yui suspendido.
var MUS={
 roots:[[55,55,65.41,49],[49,49,58.27,55],[65.41,65.41,73.42,61.74],[55,58.27,49,55]],
 lead:0,          // 0..3 Which hero plays
 lvl:0,           // intensity: 0 calm, 1 combat
 tension:0        // layer of high strings, only in combat
};

function musInit(){
 if(!AC||!musG)return;
 musG.gain.value=0;
 // Pad: two detuned sawtooths through a lowpass, one per track
 musPad={};
 for(var i=0;i<4;i++){
  var o1=AC.createOscillator();o1.type='sawtooth';
  var o2=AC.createOscillator();o2.type='sawtooth';
  var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=2.2;
  var g=AC.createGain();g.gain.value=0;
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(musG);
  o1.start();o2.start();
  musPad[i]={o1:o1,o2:o2,f:f,g:g};
 }
}

// Ajusta el pad cuando cambia de compas o de nivel de intensidad.
function musChord(root,bar,when){
 if(!musPad)return;
 for(var i=0;i<4;i++){
  var p=musPad[i],v=bar===i?.052:.02;
  p.o1.frequency.setTargetAtTime(root,v*1.6,when||AC.currentTime);
  p.o2.frequency.setTargetAtTime(root*1.006,v*1.6,when||AC.currentTime);
  p.f.frequency.setTargetAtTime(300+MUS.lvl*900,(when||AC.currentTime),.5);
  p.g.gain.setTargetAtTime(v*.7+MUS.lvl*v,(when||AC.currentTime),.35);
 }
}

// Intensidad: 0 exploracion, 1 combate. Sube la percusion y el pad.
function musSetLevel(l){
 MUS.lvl=l;
 if(!AC||!musG)return;
 musG.gain.setTargetAtTime(MUS_VOL*(.72+l*.5),AC.currentTime,.8);
}

function musNote(f0,dur,vol,type,when,dest){
 var o=AC.createOscillator();o.type=type||'square';
 o.frequency.setValueAtTime(f0,when);
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,when);
 g.gain.exponentialRampToValueAtTime(vol,when+.012);
 g.gain.exponentialRampToValueAtTime(.0001,when+dur);
 o.connect(g);g.connect(dest||musG);
 o.start(when);o.stop(when+dur+.03);
}

// Lead melódico: frases cortas, no una linea continua.
var LEAD_PHRASES=[
 [0,3,7,5],[2,7,10,7],[0,5,7,10],[3,5,3,0]
];
function musLead(t,root,bar,st,lvl){
 if(lvl<.5)return;
 // solo entra en combate y en ciertos pasos
 if(st%8!==0&&st%8!==6)return;
 var ph=LEAD_PHRASES[(mStep+bar)%4];
 var i=(st/2)|0;
 var n=ph[i%ph.length];
 var f=root*4*Math.pow(2,n/12);
 musNote(f,.11,.045,'square',t);
 if(st%8===6)musNote(f*2,.07,.028,'triangle',t+.06);
}

function music(){
 if(!AC||!musG||!musOn)return;
 if(mNext<AC.currentTime)mNext=AC.currentTime+.04;
 var lvl=MUS.lvl;
 while(mNext<AC.currentTime+.18){
  var t=mNext,bar=Math.floor(mStep/16)%4;
  var roots=MUS.roots[MUS.lead]||MUS.roots[0];
  var root=roots[bar],st=mStep%16;

  // --- Bajo ---
  if(st===0||st===6||st===10)
   musNote(root,SPB*.4,.3,'sawtooth',t);
  if(st===4||st===12)musNote(root*1.5,SPB*.28,.17,'square',t);

  // --- Bateria ---
  if(st===0||st===8)musKick(t);
  if(st===4||st===12)musSnare(t);
  // charles extra en combate
  if(lvl>.5){
   if(st===2||st===7||st===11||st===15)musHat(t,.03);
   if(st===14)musHat(t,.05);
  } else if(st%2===0)musHat(t,st%4===0?.075:.04);

  // --- Arpegio ---
  var sc=SCALE[(mStep+bar)%5]+(bar>1?12:0);
  var af=root*4*Math.pow(2,sc/12);
  musNote(af,S16*.85,lvl>.5?.06:.045,'square',t);

  // --- Pad: cambia en el cambio de compas ---
  if(st===0)musChord(root,bar,t);

  // --- Lead en combate ---
  musLead(t,root,bar,st,lvl);

  // --- Capa de tension: cuerdas altas solo en combate ---
  if(lvl>.75&&st===0){
   musNote(root*8,S64*.9,.016,'sawtooth',t);
   musNote(root*8*1.5,S64*.7,.012,'sawtooth',t+S64*.5);
  }

  mStep++;mNext+=S16;
 }
 musTimer=setTimeout(music,70);
}

// --- Percusión ---
function musKick(t){
 var o=AC.createOscillator();o.type='sine';
 o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.1);
 var g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.5,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.2);
 o.connect(g);g.connect(musG);o.start(t);o.stop(t+.22);
}
function musSnare(t){
 var s=AC.createBufferSource();s.buffer=nb;
 var f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=1400;
 var g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.2,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
 s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.16);
}
function musHat(t,v){
 var s=AC.createBufferSource();s.buffer=nb;
 var f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=7000;
 var g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.05);
 s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.07);
}

// --- Arranque / parada ---
function startMusic(){
 if(!AC||!musG)return;
 musInit();
 musGen++;musOn=true;
 clearTimeout(musTimer);
 musG.gain.cancelScheduledValues(AC.currentTime);
 musG.gain.setValueAtTime(musG.gain.value,AC.currentTime);
 musG.gain.linearRampToValueAtTime(MUS_VOL*(.72+MUS.lvl*.5),AC.currentTime+1.6);
 mStep=0;mNext=AC.currentTime+.08;
 musTimer=setTimeout(music,0);
}
function fadeOutMusic(){
 if(!AC||!musG)return;
 var gen=++musGen;
 musG.gain.cancelScheduledValues(AC.currentTime);
 musG.gain.setValueAtTime(musG.gain.value,AC.currentTime);
 musG.gain.linearRampToValueAtTime(0,AC.currentTime+1.1);
 setTimeout(function(){if(gen===musGen){musOn=false;clearTimeout(musTimer);}},1150);
}