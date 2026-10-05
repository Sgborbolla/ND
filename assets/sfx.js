// ND — banco de sonido sintetizado en runtime.
//
// Todo se genera con WebAudio: ni un solo fichero de audio aparte de las
// voces japonesas (assets/voice/*.mp3). Cero descargas, cero peso,
// funciona offline en Win10/11 y Android 10+.
//
// Voces: assets/voice/lines.js + tools/fetch_voice.sh

// ===================================================================
// AMBIENTE CONTINUO (bucles con LFO y ruido filtrado)
// ===================================================================

function ambInit(){
 if(amb)return;
 amb={};
 var ctx=AC;

 // ---- Lluvia: ruido rosa + paso alto, con modulacion de densidad ----
 var rn=makeNoise();
 var rs=ctx.createBufferSource();rs.buffer=rn;rs.loop=true;
 var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1150;hp.Q.value=.5;
 var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6200;
 var rg=ctx.createGain();rg.gain.value=0;
 var rlfo=ctx.createOscillator();rlfo.frequency.value=.13;
 var rlg=ctx.createGain();rlg.gain.value=430;
 rlfo.connect(rlg);rlg.connect(hp.frequency);
 rs.connect(hp);hp.connect(lp);lp.connect(rg);rg.connect(ambG);
 rs.start();rlfo.start();
 amb.rain=rg;amb.rainLp=lp;

 // ---- Gotasgow downrateIndividual en charcos: repique aleatorio ----
 var pl=ctx.createGain();pl.gain.value=0;pl.connect(ambG);
 amb.puddle=pl;

 // ---- Viento: ruido muy grave, con deriva lenta de frecuencia ----
 var wn=makeNoise();
 var ws=ctx.createBufferSource();ws.buffer=wn;ws.loop=true;
 var wf=ctx.createBiquadFilter();wf.type='bandpass';wf.frequency.value=220;wf.Q.value=1.4;
 var wg=ctx.createGain();wg.gain.value=0;
 var wlfo=ctx.createOscillator();wlfo.frequency.value=.07;
 var wlg=ctx.createGain();wlg.gain.value=110;
 wlfo.connect(wlg);wlg.connect(wf.frequency);
 ws.connect(wf);wf.connect(wg);wg.connect(ambG);
 ws.start();wlfo.start();
 amb.wind=wg;

 // ---- Zumbido de ciudad / reactores: dos osciladores graves ----
 var dz=ctx.createGain();dz.gain.value=0;dz.connect(ambG);
 var d1=ctx.createOscillator();d1.type='sawtooth';d1.frequency.value=47;
 var d2=ctx.createOscillator();d2.type='sine';d2.frequency.value=70.5;
 var dlp=ctx.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=180;
 d1.connect(dlp);d2.connect(dlp);dlp.connect(dz);
 d1.start();d2.start();
 amb.drone=dz;amb.droneF=dlp;

 // ---- Lluvia lejana del relampago: se sube con cada trueno ----
 var fn=makeNoise();
 var fs=ctx.createBufferSource();fs.buffer=fn;fs.loop=true;
 var fp=ctx.createBiquadFilter();fp.type='lowpass';fp.frequency.value=260;fp.Q.value=.9;
 var fg=ctx.createGain();fg.gain.value=0;
 fs.connect(fp);fp.connect(fg);fg.connect(ambG);
 fs.start();
 amb.rumble=fg;amb.rumbleF=fp;

 ambG.connect(sfxG);
}

let amb=null,ambG=null,ambOn=false;

// Volume objetivo por ambiente (se suben con la distancia del relampago)
function ambSet(on){
 if(!AC||!on)return;
 ambInit();
 ambOn=on;
 var t=AC.currentTime;
 amb.rain.gain.setTargetAtTime(on?.075:0,t,1.4);
 amb.wind.gain.setTargetAtTime(on?.05:0,t,2.2);
 amb.drone.gain.setTargetAtTime(on?.028:0,t,3);
 amb.puddle.gain.setTargetAtTime(on?.02:0,t,1.8);
}

// El trueno acerca la lluvia: el ambiente responde al relampago.
function ambFlash(dist){
 if(!AC||!ambOn||!amb)return;
 var t=AC.currentTime;
 var k=Math.max(0,1-dist);
 amb.rumble.gain.setTargetAtTime(.16*k,t,.09);
 amb.rumble.gain.setTargetAtTime(.012,t+.5+dist*1.6,1.1);
 amb.rumbleF.frequency.setTargetAtTime(120+340*k,t,.12);
 amb.rain.gain.setTargetAtTime(.075+.09*k,t,.07);
 amb.rain.gain.setTargetAtTime(.075,t+.4+dist,1.5);
 amb.drone.gain.setTargetAtTime(.028+.05*k,t,.1);
 amb.drone.gain.setTargetAtTime(.028,t+.6+dist,1.4);
 amb.wind.gain.setTargetAtTime(.05+.07*k,t,.12);
 amb.wind.gain.setTargetAtTime(.05,t+.7+dist,1.6);
}

// Charco: splash corto y brillante. n = numero de gotas.
function puddle(x,y,n){
 if(!AC||!ambOn)return;
 var t=AC.currentTime;
 for(var i=0;i<n;i++){
  var d=(Math.random()-.5)*.09;
  var o=AC.createOscillator();o.type='sine';
  var f0=760+Math.random()*1500;
  o.frequency.setValueAtTime(f0,t+d);
  o.frequency.exponentialRampToValueAtTime(f0*.28,t+d+.055);
  var g=AC.createGain();
  g.gain.setValueAtTime(.0001,t+d);
  g.gain.exponentialRampToValueAtTime(.05+Math.random()*.05,t+d+.004);
  g.gain.exponentialRampToValueAtTime(.0001,t+d+.075);
  o.connect(g);g.connect(ambG);
  o.start(t+d);o.stop(t+d+.11);
 }
 // salpicadura fina encima
 nz(2.2,4200,1300,.09,.035,'highpass');
}

// Pisada mojada. wet = 0..1 segun el suelo.
function stepWet(wet){
 if(!AC)return;
 nz(1.6,700+Math.random()*260,150,.075,.05,'lowpass');
 if(wet>.2)puddle(0,0,1+Math.floor(wet*3));
}

// ===================================================================
// SFX DE COMBATE (todo sintetizado)
// ===================================================================

// Puerta / porton: chirrido metalico + golpe de cierre.
function sfxDoor(open){
 if(!AC)return;
 var t=AC.currentTime;
 if(open){
  // chirrido: sierra con filtro que sube
  var o=AC.createOscillator();o.type='sawtooth';
  o.frequency.setValueAtTime(120,t);
  o.frequency.exponentialRampToValueAtTime(430,t+.55);
  var f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=11;
  var g=AC.createGain();
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(.09,t+.08);
  g.gain.exponentialRampToValueAtTime(.0001,t+.6);
  o.connect(f);f.connect(g);g.connect(sfxG);
  o.start(t);o.stop(t+.64);
  nz(1.4,900,340,.5,.03,'bandpass');
 }else{
  // golpe seco + cola grave
  osc(140,42,.3,.3,'sine');
  nz(.9,2600,300,.22,.24,'lowpass');
  var r=AC.createOscillator();r.type='sine';
  r.frequency.setValueAtTime(74,t);r.frequency.exponentialRampToValueAtTime(31,t+.5);
  var rg=AC.createGain();
  rg.gain.setValueAtTime(.16,t);rg.gain.exponentialRampToValueAtTime(.0001,t+.55);
  r.connect(rg);rg.connect(sfxG);r.start(t);r.stop(t+.58);
 }
}

// Trueno cercano / lejano. dist 0..1 (0 cerca).
function sfxThunder(dist){
 if(!AC)return;
 var t=AC.currentTime;
 var k=1-Math.min(1,dist);
 // 1. descarga instantanea (cerca) o sin pico (lejos)
 if(k>.4)nz(3.4,4200,700,.1+k*.2,.3*k,'lowpass');
 // 2. cuerpo: ruido filtrado con barrido grave
 var n=makeNoise();
 var s=AC.createBufferSource();s.buffer=n;
 var f=AC.createBiquadFilter();f.type='lowpass';
 f.frequency.setValueAtTime(90+k*260,t);
 f.frequency.exponentialRampToValueAtTime(38,t+1.2+k);
 f.Q.value=1.1;
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.3*k+.02,t+(k>.5?.02:.12));
 g.gain.exponentialRampToValueAtTime(.0001,t+1.1+dist*2);
 s.connect(f);f.connect(g);g.connect(sfxG);
 s.start(t);s.stop(t+1.3+dist*2);
 // 3. sub-bass que cae (el "drop")
 if(k>.25){
  var o=AC.createOscillator();o.type='sine';
  o.frequency.setValueAtTime(64*k+26,t);
  o.frequency.exponentialRampToValueAtTime(22,t+.9);
  var og=AC.createGain();
  og.gain.setValueAtTime(.0001,t);
  og.gain.exponentialRampToValueAtTime(.3*k,t+.05);
  og.gain.exponentialRampToValueAtTime(.0001,t+1);
  o.connect(og);og.connect(sfxG);o.start(t);o.stop(t+1.05);
 }
 // 4. eco en la ciudad
 if(k>.3){
  var d=AC.createDelay(1.2);d.delayTime.value=.28+dist*.5;
  var dg=AC.createGain();dg.gain.value=.2*k;
  g.connect(d);d.connect(dg);dg.connect(sfxG);
 }
 ambFlash(dist);
}

// Golpe seco de cuerpo a cuerpo.
function sfxHit(power){
 if(!AC)return;
 var t=AC.currentTime,p=power||1;
 nz(1.2,3400*p,300,.1,.42*p,'lowpass');
 osc(210*p,48,.14,.3*p);
 // chasquido de impacto
 osc(1800*p,600,.05,.16*p,'square');
}
// Quejido / dolor humano sintetizado: filtro de formantes.
function sfxMoan(p){
 if(!AC)return;
 var t=AC.currentTime;
 var o=AC.createOscillator();o.type='sawtooth';
 var f0=150+Math.random()*40;
 o.frequency.setValueAtTime(f0,t);
 o.frequency.linearRampToValueAtTime(f0*.72,t+.42);
 var f1=AC.createBiquadFilter();f1.type='bandpass';f1.frequency.value=620;f1.Q.value=8;
 var f2=AC.createBiquadFilter();f2.type='bandpass';f2.frequency.value=1180;f2.Q.value=11;
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.2,t+.05);
 g.gain.exponentialRampToValueAtTime(.0001,t+.45);
 o.connect(f1);f1.connect(g);
 o.connect(f2);f2.connect(g);
 g.connect(sfxG);
 o.start(t);o.stop(t+.5);
}

// Corte de katana: silbido filtrado + golpe de aire.
function sfxSlash(p){
 if(!AC)return;
 var t=AC.currentTime,p2=p||1;
 var n=makeNoise();
 var s=AC.createBufferSource();s.buffer=n;
 var f=AC.createBiquadFilter();f.type='bandpass';
 f.frequency.setValueAtTime(900,t);
 f.frequency.exponentialRampToValueAtTime(5200,t+.13);
 f.Q.value=2.4;
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.2*p2,t+.02);
 g.gain.exponentialRampToValueAtTime(.0001,t+.2);
 s.connect(f);f.connect(g);g.connect(sfxG);
 s.start(t);s.stop(t+.24);
 sfxHit(.8*p2);
}

// Ruptura: destello metalico grave + onda.
function sfxRupture(power){
 if(!AC)return;
 var t=AC.currentTime,p=power||1;
 nz(.75,4200,700,.34,.34*p,'lowpass');
 osc(520,88,.3,.22*p,'sawtooth');
 osc(1400,420,.18,.14*p,'square');
 // capa grave que "[[sube]]"
 var o=AC.createOscillator();o.type='sine';
 o.frequency.setValueAtTime(40,t);
 o.frequency.exponentialRampToValueAtTime(180,t+.12);
 o.frequency.exponentialRampToValueAtTime(30,t+.5);
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.3*p,t+.04);
 g.gain.exponentialRampToValueAtTime(.0001,t+.55);
 o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+.6);
}
// Definitiva: mas grave, mas larga, con cola de sub-bass.
function sfxFinal(power){
 if(!AC)return;
 var t=AC.currentTime,p=power||1;
 sfxRupture(p*1.2);
 var o=AC.createOscillator();o.type='sine';
 o.frequency.setValueAtTime(90,t);
 o.frequency.exponentialRampToValueAtTime(34,t+1.1);
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t+.05);
 g.gain.exponentialRampToValueAtTime(.34*p,t+.1);
 g.gain.exponentialRampToValueAtTime(.0001,t+1.3);
 o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+1.35);
}

// Impacto sismico de Goro: golpe grave + ruido de escombros.
function sfxQuake(){
 if(!AC)return;
 var t=AC.currentTime;
 osc(88,26,.55,.42,'sine');
 var n=makeNoise();
 var s=AC.createBufferSource();s.buffer=n;
 var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=1.6;
 var g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.3,t+.02);
 g.gain.exponentialRampToValueAtTime(.0001,t+.7);
 s.connect(f);f.connect(g);g.connect(sfxG);
 s.start(t);s.stop(t+.75);
}

// Descarga / fuego / explosion.
function sfxBlast(){
 if(!AC)return;
 var t=AC.currentTime;
 nz(1.1,2400,120,.4,.3,'lowpass');
 osc(120,38,.4,.26,'sine');
 // cola de escombros
 for(var i=0;i<5;i++){
  var d=Math.random()*.4;
  nz(3,3000+Math.random()*3000,900,.08,.05,'highpass');
 }
}

// Teletransporte / desfasador: barrido inverso + ping cristalino.
function sfxWarp(){
 if(!AC)return;
 var t=AC.currentTime;
 var o=AC.createOscillator();o.type='square';
 o.frequency.setValueAtTime(1400,t);
 o.frequency.exponentialRampToValueAtTime(180,t+.28);
 var g=AC.createGain();
 g.gain.setValueAtTime(.14,t);
 g.gain.exponentialRampToValueAtTime(.0001,t+.3);
 o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+.34);
 nz(2.6,900,4200,.16,.09,'bandpass');
}

// Electricidad de Ren: crepita de banda estrecha.
function sfxZap(){
 if(!AC)return;
 var t=AC.currentTime;
 for(var i=0;i<4;i++){
  var d=Math.random()*.18;
  var n=makeNoise();
  var s=AC.createBufferSource();s.buffer=n;
  var f=AC.createBiquadFilter();f.type='bandpass';
  f.frequency.value=2600+Math.random()*4200;f.Q.value=12;
  var g=AC.createGain();
  g.gain.setValueAtTime(.0001,t+d);
  g.gain.exponentialRampToValueAtTime(.13,t+d+.006);
  g.gain.exponentialRampToValueAtTime(.0001,t+d+.05);
  s.connect(f);f.connect(g);g.connect(sfxG);
  s.start(t+d);s.stop(t+d+.07);
 }
 osc(2400,700,.1,.09,'square');
}

// Reloj / cronal de Yui.
function sfxClock(){
 if(!AC)return;
 var t=AC.currentTime;
 osc(1180,1180,.05,.12,'square');
 osc(880,880,.05,.09,'sine');
}

// Muerte de enemigo: caida sintetizada.
function sfxDie(){
 if(!AC)return;
 var t=AC.currentTime;
 osc(300,58,.26,.17,'sawtooth');
 nz(1,2000,190,.2,.14,'lowpass');
}