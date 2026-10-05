(function(){
'use strict';

const W=960,H=540,GR=452,GND=H-72;
const CV=document.getElementById('c'),cx=CV.getContext('2d',{alpha:false});
const hud=document.getElementById('hud'),hpEl=document.getElementById('hp'),statEl=document.getElementById('stat');
const pad=document.getElementById('pad');
const ui=document.getElementById('ui'),playBtn=document.getElementById('play');
const overEl=document.getElementById('over'),ores=document.getElementById('ores'),ost=document.getElementById('ost'),reBtn=document.getElementById('re');
const bL=document.getElementById('l'),bR=document.getElementById('r'),bA=document.getElementById('a'),bD=document.getElementById('d');

const DANGER='#ff2d6f',WARN='#ffc400',INK='#000000',RIM='#F2DCC0';
const HEROES=[
 {n:'RIKA',r:'la hoja',spd:216,jp:530,hp:5,w:19,h:45,dash:590,sp:'blade',
  acc:.34,brk:.34,air:.09,dsh:12,thru:1,
  ja:'まだ名前を覚えている。…絶対に、消させはしない。',
  es:'Aún recuerdo su nombre... No dejaré que me lo borren.'},
 {n:'GORO',r:'el yunque',spd:158,jp:435,hp:8,w:31,h:47,dash:515,sp:'anvil',
  acc:.17,brk:.10,air:.05,dsh:26,thru:1,push:1,
  ja:'俺がこの扉を作った。最後に、俺が閉める。',
  es:'Yo puse estas puertas. Yo las cerraré por última vez.'},
 {n:'REN',r:'el relampago',spd:278,jp:565,hp:4,w:16,h:47,dash:775,sp:'bolt',
  acc:.46,brk:.26,air:.14,dsh:8,ch:3,cm:26,zz:1,ffc:1,
  ja:'誰も行かねえなら…俺が行く。',
  es:'Si nadie va... iré yo.'},
 {n:'YUI',r:'el eco',spd:228,jp:505,hp:5,w:18,h:45,dash:665,sp:'echo',
  acc:.28,brk:.22,air:.09,dsh:0,rng:1,tp:150,
  ja:'もう、誰かの残響にはなりたくない。',
  es:'Ya no quiero ser el eco de nadie más.'}
];

const ARCH=[
 {k:'doble',label:'EL DOBLE',lvl:1,hp:2,sp:128,s:16,sk:'twin',teach:'te copia el movimiento'},
 {k:'lanzador',label:'LANZADOR',lvl:2,hp:2,sp:62,s:18,sk:'arc',teach:'el suelo es peligroso'},
 {k:'agresor',label:'EL AGRESOR',lvl:3,hp:3,sp:148,s:19,sk:'stick',teach:'te acosa sin parar'},
 {k:'blindado',label:'BLINDADO',lvl:4,hp:6,sp:82,s:24,sk:'block',guard:3,teach:'3 golpes o un dash rompen la guardia'},
 {k:'resucitado',label:'RESUCITADO',lvl:5,hp:3,sp:112,s:18,sk:'broken',teach:'soltar tiene castigo'},
 {k:'mimetico',label:'EL MIMETICO',lvl:6,hp:5,sp:138,s:20,sk:'echo',teach:'copia tu forma y tus golpes'}
];

let AC=null,sfxG=null,musG=null,nb=null;
function makeNoise(){
 const len=AC.sampleRate*.6,b=AC.createBuffer(1,len,AC.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
 return b;
}
function boot(){
 if(AC)return;
 const C=window.AudioContext||window.webkitAudioContext;
 if(!C)return;
 AC=new C();
 nb=makeNoise();
 sfxG=AC.createGain();sfxG.gain.value=.95;sfxG.connect(AC.destination);
 musG=AC.createGain();musG.gain.value=.34;musG.connect(AC.destination);
}
function nz(q,f0,f1,dur,vol,type){
 const t=AC.currentTime,s=AC.createBufferSource();s.buffer=nb;
 const f=AC.createBiquadFilter();f.type=type||'bandpass';f.Q.value=q;
 f.frequency.setValueAtTime(f0,t);
 f.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);
 const g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(vol,t+Math.min(.012,dur*.25));
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);g.connect(sfxG);s.start(t);s.stop(t+dur+.03);
}
function osc(f0,f1,dur,vol,type,dest){
 const t=AC.currentTime,o=AC.createOscillator();o.type=type||'sine';
 o.frequency.setValueAtTime(f0,t);
 o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 const g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(vol,t+Math.min(.012,dur*.25));
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(dest||sfxG);o.start(t);o.stop(t+dur+.03);
}
function vo(f0,f1,dur,vol,F1,F2){
 if(!AC)return;
 const t=AC.currentTime;
 const s=AC.createBufferSource();s.buffer=nb;s.loop=true;
 const o=AC.createOscillator();o.type='sawtooth';
 o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
 const b1=AC.createBiquadFilter();b1.type='bandpass';b1.Q.value=7;
 b1.frequency.setValueAtTime(F1,t);b1.frequency.linearRampToValueAtTime(F1*.6,t+dur);
 const b2=AC.createBiquadFilter();b2.type='bandpass';b2.Q.value=9;b2.frequency.value=F2;
 const m=AC.createGain();m.gain.value=.55;
 const g=AC.createGain();
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(vol,t+dur*.14);
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(b1);b1.connect(m);
 s.connect(b2);b2.connect(m);
 m.connect(g);g.connect(sfxG);
 o.start(t);s.start(t);o.stop(t+dur+.04);s.stop(t+dur+.04);
}
const VOI=[
 {atk:[520,235,.15,.21,780,1180],big:[300,115,.42,.27,520,760],die:[380,90,.5,.24,600,900]},
 {atk:[205,105,.19,.25,420,640],big:[148,68,.52,.31,300,470],die:[210,58,.55,.26,380,600]},
 {atk:[700,325,.12,.2,980,1500],big:[430,175,.38,.25,760,1180],die:[520,110,.4,.22,880,1400]},
 {atk:[430,295,.21,.17,700,1500],big:[258,148,.46,.21,560,1350],die:[340,120,.45,.19,620,1300]}
];
const EVO={
 
 doble:function(){vo(600,900,.1,.11,1100,1900);},
 lanzador:function(){vo(300,900,.23,.12,900,2100);},
 blindado:function(){if(!AC)return;osc(900,300,.12,.13,'square');nz(3,2600,900,.1,.12);},
 resucitado:function(){vo(150,68,.35,.17,340,520);},
 agresor:function(){vo(400,260,.14,.16,900,1400);}
};
const SFX={
 swing(){if(!AC)return;nz(1.1,1800,520,.12,.2);},
 hit(){if(!AC)return;nz(1.2,3400,300,.1,.42,'lowpass');osc(210,48,.14,.3);},
 kill(){if(!AC)return;osc(430,42,.38,.26,'sawtooth');nz(1,2000,190,.2,.14,'lowpass');},
 hurt(){if(!AC)return;osc(155,56,.24,.34,'square');nz(1,760,130,.14,.14,'lowpass');},
 dash(){if(!AC)return;nz(2.4,440,3000,.24,.4);},
 jump(){if(!AC)return;osc(230,540,.09,.12,'triangle');},
 land(){if(!AC)return;nz(1,540,150,.09,.2,'lowpass');},
 step(){if(!AC)return;nz(1,1000,380,.07,.1);},
 eTell(){if(!AC)return;nz(3.4,880,2500,.2,.13);},
 eDie(){if(!AC)return;osc(300,58,.26,.17,'sawtooth');},
 thund(){if(!AC)return;nz(.6,900,90,1.5,.3,'lowpass');osc(60,28,1.8,.2,'sine');},
 splat(){if(!AC)return;nz(1.4,2600,420,.16,.2);},
 rupture(){if(!AC)return;nz(.75,4200,700,.34,.34,'lowpass');osc(520,88,.3,.22,'sawtooth');osc(1400,420,.18,.14,'square');},
 swingV(){if(!AC)return;vo(VOI[hero].atk[0],VOI[hero].atk[1],VOI[hero].atk[2],VOI[hero].atk[3],VOI[hero].atk[4],VOI[hero].atk[5]);},
 ruptureV(){if(!AC)return;vo(VOI[hero].big[0],VOI[hero].big[1],VOI[hero].big[2],VOI[hero].big[3],VOI[hero].big[4],VOI[hero].big[5]);},
 dieV(){if(!AC)return;vo(VOI[hero].die[0],VOI[hero].die[1],VOI[hero].die[2],VOI[hero].die[3],VOI[hero].die[4],VOI[hero].die[5]);},
 evo:function(k){if(AC&&EVO[k])EVO[k]();}
};

const BPM=104,SPB=60/BPM,S16=SPB/4,MUS_VOL=.34;
const ROOTS=[55,55,65.41,49];
const SCALE=[0,3,5,7,10];
let mStep=0,mNext=0,musOn=false,musTimer=0,musGen=0;
function music(){
 if(!AC||!musG||!musOn)return;
 if(mNext<AC.currentTime)mNext=AC.currentTime+.04;
 while(mNext<AC.currentTime+.18){
  const t=mNext,bar=Math.floor(mStep/16)%4,root=ROOTS[bar],st=mStep%16;
  if(st===0||st===6||st===10){osc(root,.99*root,SPB*.42,.3,'sawtooth',musG);}
  if(st===4||st===12){osc(root*1.5,root*1.49,SPB*.3,.18,'square',musG);}
  if(st===0||st===8){kick(t);}
  if(st===4||st===12){snare(t);}
  if(st%2===0)hat(t,st%4===0?.1:.055);
  const n=SCALE[(mStep+bar)%5]+(bar>1?12:0);
  osc(root*4*Math.pow(2,n/12),root*4*Math.pow(2,n/12),S16*.9,.055,'square',musG);
  mStep++;mNext+=S16;
 }
 musTimer=setTimeout(music,70);
}
function startMusic(){
 if(!AC||!musG)return;
 musGen++;
 musOn=true;
 clearTimeout(musTimer);
 musG.gain.cancelScheduledValues(AC.currentTime);
 musG.gain.setValueAtTime(musG.gain.value,AC.currentTime);
 musG.gain.linearRampToValueAtTime(MUS_VOL,AC.currentTime+1.6);
 mStep=0;mNext=AC.currentTime+.08;
 musTimer=setTimeout(music,0);
}
function fadeOutMusic(){
 if(!AC||!musG)return;
 const gen=++musGen;
 musG.gain.cancelScheduledValues(AC.currentTime);
 musG.gain.setValueAtTime(musG.gain.value,AC.currentTime);
 musG.gain.linearRampToValueAtTime(0,AC.currentTime+1.1);
 setTimeout(()=>{if(gen===musGen){musOn=false;clearTimeout(musTimer);}},1150);
}
function kick(t){
 const o=AC.createOscillator();o.type='sine';
 o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.1);
 const g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.5,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.2);
 o.connect(g);g.connect(musG);o.start(t);o.stop(t+.22);
}
function snare(t){
 const s=AC.createBufferSource();s.buffer=nb;
 const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=1400;
 const g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(.2,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
 s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.16);
}
function hat(t,v){
 const s=AC.createBufferSource();s.buffer=nb;
 const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=7000;
 const g=AC.createGain();g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.05);
 s.connect(f);f.connect(g);g.connect(musG);s.start(t);s.stop(t+.07);
}

function resize(){
 const s=Math.min(innerWidth/W,innerHeight/H),d=Math.min(devicePixelRatio||1,2);
 CV.style.width=W*s+'px';CV.style.height=H*s+'px';
 CV.width=Math.round(W*d);CV.height=Math.round(H*d);
 cx.setTransform(d,0,0,d,0,0);
}
addEventListener('resize',resize);resize();

function silo(g,s,x,y,w,h,t){
 g.fillStyle=t;
 if(s==='blade'){
  g.beginPath();g.arc(x,y-h*.52,w*.5,0,7);g.fill();
  g.fillRect(x-w*.5,y-h*.52,w,h*.52);
  g.save();g.translate(x+w*.62,y-h*.18);g.rotate(-.55);
  g.fillRect(0,-1.5,w*2.1,3);g.restore();
 }else if(s==='anvil'){
  g.beginPath();g.arc(x,y-h*.56,w*.5,0,7);g.fill();
  g.fillRect(x-w*.5,y-h*.56,w,h*.56);
  g.fillRect(x-w*1.2,y-h*.96,w*2.4,h*.3);
 }else if(s==='bolt'){
  g.beginPath();g.arc(x,y-h*.52,w*.5,0,7);g.fill();
  g.fillRect(x-w*.34,y-h*.42,w*.68,h*.42);
  g.beginPath();g.moveTo(x-w*.5,y);g.lineTo(x+w*.5,y);
  g.lineTo(x+w*.26,y+h*.12);g.lineTo(x-w*.34,y+h*.12);g.closePath();g.fill();
}else if(s==='echo'){
   g.beginPath();g.arc(x,y-h*.54,w*.46,0,7);g.fill();
   g.beginPath();g.moveTo(x-w*.52,y);g.lineTo(x+w*.52,y);
   g.lineTo(x+w*.3,y+h*.07);g.lineTo(x-w*.3,y+h*.07);g.closePath();g.fill();
   g.save();g.translate(x+w*.34,y-h*.44);g.rotate(-.12);
   g.fillRect(-w*.3,-h*.035,w*1.5,h*.07);
   g.fillRect(w*1.2,-h*.025,w*.62,h*.05);
   g.fillRect(-w*.44,-h*.06,w*.26,h*.12);
   g.restore();
  }else if(s==='stick'){
  g.fillRect(x-w*.34,y-h,w*.68,h);
  g.beginPath();g.arc(x,y-h,w*.5,0,7);g.fill();
 }else if(s==='twin'){
  g.fillRect(x-w*.9,y-h*.86,w*.4,h*.86);
  g.fillRect(x+w*.5,y-h*.86,w*.4,h*.86);
  g.beginPath();g.arc(x-w*.7,y-h*.86,w*.3,0,7);g.fill();
  g.beginPath();g.arc(x+w*.7,y-h*.86,w*.3,0,7);g.fill();
 }else if(s==='arc'){
  g.beginPath();g.arc(x,y-h*.7,w*.5,Math.PI,0);g.fill();
  g.fillRect(x-w*.5,y-h*.5,w,h*.5);
  g.beginPath();g.arc(x+w*.55,y-h*.62,w*.3,0,7);g.fill();
 }else if(s==='block'){
  g.fillRect(x-w*.7,y-h*.8,w*1.4,h*.8);
  g.fillRect(x-w*.95,y-h*.95,w*1.9,h*.24);
  g.fillRect(x-w*.5,y-h*.28,w,h*.1);
 }else if(s==='broken'){
  g.fillRect(x-w*.3,y-h,w*.6,h);
  g.beginPath();g.arc(x,y-h,w*.44,0,7);g.fill();
  g.beginPath();g.moveTo(x+w*.3,y-h*.6);g.lineTo(x+w*.8,y-h*.2);
  g.lineTo(x+w*.34,y-h*.1);g.closePath();g.fill();
 }else if(s==='core'){
  g.beginPath();g.arc(x,y-h*.5,w*.62,0,7);g.fill();
  for(let i=0;i<7;i++){const a=i/7*6.283;g.fillRect(x+Math.cos(a)*w*.62-2,y-h*.5+Math.sin(a)*w*.62-2,4,4);}
  g.fillRect(x-w*.16,y-h*.34,w*.32,h*.34);
 }
}

let rain=[],drops=[],city=[],lightT=4,lightF=0,hero=0;
function buildRain(){
 rain=[];for(let i=0;i<130;i++)rain.push({x:Math.random()*W,y:Math.random()*H,
  v:520+Math.random()*420,l:8+Math.random()*16,a:.14+Math.random()*.3});
}
function h1(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);}
function winLevel(ph,duty){
 const e=Math.max(duty*.32,1e-4);
 if(ph<duty)return ph<e?ph/e:1;
 const s=Math.max((1-duty)*.32,1e-4),u=(ph-duty)/s;
 return u<1?1-u:0;
}
function buildCity(){
 city=[];let x=-40;
 while(x<W+80){
  const w=34+Math.random()*72,h=110+Math.random()*250;
  const b={x:x,w:w,h:h,brk:Math.random()*.7,lit:Math.random()<.42,wins:[]};
  const sx=(w-10)/4,ww=(w-10)/6,sy=h*.6/4;
  for(let i=0;i<3;i++)for(let j=0;j<4;j++){
   const k=city.length*23+i*7+j*3+1;
   b.wins.push({x:5+j*sx,y:12+i*sy,w:ww,
    per:2.2+h1(k)*5.6,ph:h1(k+7),duty:.32+h1(k+13)*.52});
  }
  city.push(b);
  x+=w+6+Math.random()*16;
 }
 buildRain();
}
let camT=0;
function sky(g,sy,alpha){
 const sk=g.createLinearGradient(0,0,0,GR);
 sk.addColorStop(0,'#150E2B');sk.addColorStop(.36,'#4A2247');
 sk.addColorStop(.70,'#A84A38');sk.addColorStop(1,'#F0A65A');
 g.fillStyle=sk;g.globalAlpha=alpha===undefined?1:alpha;g.fillRect(0,0,W,GR);
 g.globalAlpha=1;
 return sk;
}
function glowDisc(g,x,y,r,c1,c2){
 const gl=g.createRadialGradient(x,y,4,x,y,r);
 gl.addColorStop(0,c1);gl.addColorStop(1,c2);
 g.fillStyle=gl;g.fillRect(0,0,W,GR);
}
function drawCity(g,par,off,tint,a){
 g.save();g.globalAlpha=a;
 g.fillStyle=tint;
 g.translate(off,0);
 for(const b of city){
  const bx=b.x-camT*par;
  const wrap=((bx%(W+240))+W+240)%(W+240)-120;
  g.fillRect(wrap,GR-b.h,b.w,b.h);
  g.beginPath();
  g.moveTo(wrap,GR-b.h);g.lineTo(wrap+b.w,GR-b.h);
  g.lineTo(wrap+b.w*.5,GR-b.h-8-b.brk*22);g.closePath();g.fill();
if(b.lit&&b.wins){
    g.fillStyle='rgba(255,190,110,1)';
    const ts=perf*.001;
    for(const s of b.wins){
     const v=winLevel((ts/s.per+s.ph)%1,s.duty);
     if(v<=0)continue;
     g.globalAlpha=a*(.08+v*.16);
     g.fillRect(wrap+s.x,GR-b.h+s.y,s.w,4);
    }
    g.globalAlpha=a;
    g.fillStyle=tint;
   }
  }
  g.restore();
}
function rainPass(g,n,a,len,wind){
 g.strokeStyle='rgba(160,255,140,'+a+')';g.lineWidth=1.2;
 g.beginPath();
 for(let i=0;i<drops.length;i+=n){
  const d=drops[i];
  g.moveTo(d.x,d.y);g.lineTo(d.x+wind*len,d.y+len);
 }
 g.stroke();
}
function updateRain(dt,spd){
 for(const d of rain){
  d.y+=d.v*dt*(spd||1);d.x-=110*dt*(spd||1);
  if(d.y>GR+20){d.y=-20;d.x=Math.random()*(W+140);d.v=520+Math.random()*420;}
  if(d.x<-30)d.x=W+30;
 }
}
function paintTitle(t){
 const g=cx;
 g.fillStyle='#100926';g.fillRect(0,0,W,H);
 sky(g);
 glowDisc(g,W*.72-camT*.04,GR-70,300,'rgba(255,190,120,.55)','rgba(255,90,60,0)');
 g.fillStyle='rgba(255,206,150,.85)';g.beginPath();g.arc(W*.72-camT*.04,GR-70,26,0,7);g.fill();
 drawCity(g,.10,0,'#2C2543',.75);
 g.fillStyle='rgba(200,120,90,.1)';g.fillRect(0,GR-190,W,190);
 drawCity(g,.24,0,'#221B38',.9);
 drawCity(g,.46,0,'#1E1734',1);
 g.fillStyle='#100926';g.fillRect(0,GR,W,H-GR);
 const fg=g.createLinearGradient(0,GR,0,H);
 fg.addColorStop(0,'rgba(255,140,70,.16)');fg.addColorStop(1,'rgba(0,0,0,.6)');
 g.fillStyle=fg;g.fillRect(0,GR,W,H-GR);
 drops=rain;
 rainPass(g,3,.22,7,1);
 for(const d of rain){}
 g.strokeStyle='rgba(170,255,150,.16)';g.lineWidth=1.1;g.beginPath();
 for(let i=1;i<rain.length;i+=4){
  const d=rain[i];g.moveTo(d.x,d.y);g.lineTo(d.x-4,d.y+16);
 }
 g.stroke();
 if(lightF>0){
  g.fillStyle='rgba(210,235,255,'+(lightF*.5)+')';g.fillRect(0,0,W,H);
 }
 g.save();g.translate(-camT*.5,0);
 const hx=W*.24,hy=GR;
 g.fillStyle='rgba(255,150,70,.3)';
 silo(g,HEROES[hero].sp,hx+3,hy,HEROES[hero].w+4,HEROES[hero].h+3,'rgba(255,150,70,.28)');
 silo(g,HEROES[hero].sp,hx,hy,HEROES[hero].w,HEROES[hero].h,INK);
 const wv=Math.sin(t*.0022)*6;
 g.fillStyle=INK;
 g.beginPath();g.moveTo(hx-14,hy-30);g.quadraticCurveTo(hx-30,hy-14+wv,hx-24,hy+2);g.closePath();g.fill();
 g.restore();
 const vg=g.createRadialGradient(W/2,H*.46,H*.24,W/2,H*.46,H*.98);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(6,3,10,.86)');
 g.fillStyle=vg;g.fillRect(0,0,W,H);
 g.textAlign='center';
g.fillStyle='#F2DCC0';g.font='900 62px system-ui';setSpace(g,22);
  g.shadowColor='rgba(255,150,70,.6)';g.shadowBlur=34;
  g.fillText('ND',W/2,H*.36);
  g.shadowBlur=0;
  g.fillStyle='rgba(242,220,192,.62)';g.font='700 12px system-ui';setSpace(g,8);
  g.fillText('NIPPON DESTRUCTION',W/2,H*.36+34);
  g.font='600 9px system-ui';g.fillStyle='rgba(242,220,192,.4)';setSpace(g,3);
  g.fillText('ELIGE HEROE',W/2,H*.60);
 const bw=88,bh=104,gap=10;
 const tot=HEROES.length*bw+(HEROES.length-1)*gap,sx=W/2-tot/2;
 for(let i=0;i<HEROES.length;i++){
  const x=sx+i*(bw+gap),y=H*.63;
  const on=i===hero;
  g.fillStyle=on?'rgba(242,220,192,.1)':'rgba(20,12,24,.42)';
  g.strokeStyle=on?'#F2DCC0':'rgba(242,220,192,.2)';g.lineWidth=on?2:1;
  g.beginPath();rr(g,x,y,bw,bh,7);g.fill();g.stroke();
  silo(g,HEROES[i].sp,x+bw/2,y+bh-26,HEROES[i].w,HEROES[i].h,on?'#F2DCC0':'rgba(242,220,192,.5)');
  g.fillStyle=on?'#F2DCC0':'rgba(242,220,192,.5)';
  g.font='800 10px system-ui';setSpace(g,2);
  g.fillText(HEROES[i].n,x+bw/2,y+bh-9);
  g.font='600 7px system-ui';g.fillStyle='rgba(242,220,192,.4)';setSpace(g,1);
  g.fillText(HEROES[i].r,x+bw/2,y+bh+14);
 }
 g.textAlign='left';setSpace(g,0);
}

const keys={},tch={l:0,r:0,a:0,d:0,u:0};
addEventListener('keydown',e=>{
 keys[e.code]=1;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();
 if((e.code==='Enter'||e.code==='KeyR')&&(MODE==='title'||MODE==='over'))start();
});
addEventListener('keyup',e=>{keys[e.code]=0;});
function bind(el,k){
 const on=x=>{tch[k]=1;el.classList.add('on');if(x&&x.cancelable)x.preventDefault();};
 const off=x=>{tch[k]=0;el.classList.remove('on');if(x&&x.cancelable)x.preventDefault();};
 el.addEventListener('touchstart',on,{passive:false});
 el.addEventListener('touchend',off,{passive:false});
 el.addEventListener('touchcancel',off,{passive:false});
 el.addEventListener('mousedown',on);
 el.addEventListener('mouseup',off);
 el.addEventListener('mouseleave',off);
}
bind(bL,'l');bind(bR,'r');bind(bA,'a');bind(bD,'d');

const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;

let MODE='title';
let P=null,E=null,PJ=null,F=null,SH=null,GH=null,RG=null,cam=0,tr=0,hs=0,ss=0,last=0,wv=0,kil=0,lvl=1,dead=0,perf=0;
function start(){
 boot();
 if(AC&&AC.state==='suspended')AC.resume();
 startMusic();
 const c=HEROES[hero];
 P={x:130,y:GND,vx:0,vy:0,hp:c.hp,mh:c.hp,fc:1,onG:true,at:0,ct:0,ifr:0,sq:1,trail:[],gait:0,ru:0,zz:0,
  dsh:0,dashHit:0,ch:c.ch||1,cmx:c.ch||1,cm:c.cm||40};
 E=[];PJ=[];F=[];SH=[];GH=[];RG=[];wv=0;kil=0;lvl=1;dead=0;cam=0;tr=0;hs=0;ss=0;
 ui.style.display='none';
 overEl.style.display='none';
 hud.style.display='flex';
 pad.style.display=TOUCH?'block':'none';
 MODE='play';
 last=performance.now();
 spawn();
}
function gameOver(){
 MODE='over';
 sfx('dieV');
 overEl.style.display='flex';
 ores.textContent='OLEADA '+wv;
 ost.textContent=kil+' BAJAS · '+HEROES[hero].n;
 if(AC&&musG){
  musG.gain.cancelScheduledValues(AC.currentTime);
  musG.gain.setValueAtTime(musG.gain.value,AC.currentTime);
  musG.gain.linearRampToValueAtTime(0,AC.currentTime+1.1);
 }
 fadeOutMusic();
}
function spawn(){
 lvl=Math.min(6,1+Math.floor(wv/2));
 const a=ARCH[lvl-1];
 const n=Math.min(3+wv,13);
 for(let i=0;i<n;i++){
  E.push(mk(a,W+40+i*46+rnd()*40));
 }
 if(lvl>=4&&n>4)E.push(mk(ARCH[2],W+300));
}
function mk(a,x){
 const e={t:a.k,a:a,x:x,y:GND,hp:a.hp,mhp:a.hp,sp:a.sp,s:a.s,at:0,cd:60+rnd()*40,
  fl:1,wob:rnd()*6.3,gait:0,live:0,mir:0,armor:!!a.guard,
  guard:a.guard||0,sc:0,stun:0,
  phase:'walk',burn:0,slo:1,dhit:0};
 return e;
}
function rnd(){return Math.random();}
function sfx(k,a){if(!AC)return;if(k==='evo'){SFX.evo(a);return;}if(SFX[k])SFX[k]();}

function punch(f){if(hs<f)hs=f;}
function slow(t){if(ss<t)ss=t;}
function burst(x,y,n,s,life){
 for(let i=0;i<n;i++)F.push({x:x,y:y,s:s*(.6+Math.random()*.8),life:life,max:life,a:Math.random()*6.3,vx:(Math.random()-.5)*3,vy:-Math.random()*2});
}
function zone(x,y,r,t){
 PJ.push({x:x,y:y,r:r,t:t,max:t,warn:18,hit:0});
}
function strike(e,rng){
 const dx=e.x-P.x;
 if(e.armor){
  punch(3);tr+=.1;
  if(e.stun>0)return 0;
  e.guard--;
  burst(dx>0?e.x-e.s:e.x+e.s,e.y-e.s*.6,5,2,12);
  if(e.guard>0){sfx('evo',e.t);return 0;}
  e.guard=e.a.guard||0;e.stun=40;e.cd=Math.max(e.cd,52);
  punch(7);tr+=.24;sfx('hit');
  burst(e.x,e.y-e.s,12,3,18);
  hurt(e);return 1;
 }
 punch(rng?4:5);tr+=.17;sfx('hit');
 burst(e.x,e.y-e.s,10,2.8,16);
 hurt(e);return 1;
}
function rup(){
 sfx('rupture');sfx('ruptureV');
 punch(13);tr+=.42;slow(.3);
 burst(P.x+P.fc*30,P.y-HEROES[hero].h*.5,26,3.6,26);
}
function ripple(){
 RG.push({x:P.x,y:GND,r:22,max:150,l:150});
}
function hurt(e){
 if(e.hp<=0)return;
 e.hp--;burst(e.x,e.y-e.s,7,2.6,15);
 if(e.t==='resucitado'&&e.hp<=0){burst(e.x,e.y-e.s,14,3.2,20);}
 if(e.hp<=0){
  sfx('kill');sfx('eDie');sfx('evo',e.t);burst(e.x,e.y-e.s,18,3.4,24);punch(8);slow(.17);
  const i=E.indexOf(e);if(i>=0)E.splice(i,1);
  kil++;
  if(P.ch<P.cmx)P.ch++;
  if(e.t==='resucitado'||e.t==='blindado'){
   for(let i=0;i<2;i++){
    const c=mk(ARCH[0],e.x+(i?26:-26));
    c.hp=1;c.mhp=1;c.sp=130;E.push(c);
   }
  }
 }
}

function update(dt){
 const c=HEROES[hero];
 const d=dt*60;
 const L=tc('l',['ArrowLeft','KeyA']),R=tc('r',['ArrowRight','KeyD']);
 const A=tc('a',['Space','KeyJ']),D=tc('d',['ShiftLeft','ShiftRight','KeyK']);
 const U=tc('u',['ArrowUp','KeyW']);
 P.at=Math.max(0,P.at-d);P.ifr=Math.max(0,P.ifr-d);P.ru=Math.max(0,P.ru-d);P.dsh=Math.max(0,P.dsh-d);
  if(P.ch<P.cmx){P.ct=Math.max(0,P.ct-d);if(P.ct<=0){P.ch++;}}
 P.sq+=(1-P.sq)*.24;
 if(P.y>=GND&&P.vy>90&&!P.onG){P.sq=.62;sfx('land');tr+=.16;}
 if(P.dsh<=0){
  const dir=(R?1:0)-(L?1:0);
  if(dir)P.fc=dir;
  P.vx+=(dir*c.spd-P.vx)*Math.min(1,(dir?(c.acc||.3):(P.onG?(c.brk||.2):(c.air||.085)))*d);
 }
if(A&&P.at===0){
   P.at=14;sfx('swing');sfx('swingV');
   if(c.rng){
    SH.push({x:P.x+P.fc*26,y:P.y-c.h*.5,vx:P.fc*8.2,l:72,r:P.ch<P.cmx?1:0});
   }else{
    const y=P.y-c.h*.5,Rr=68;
    let hitAny=false;
    for(let i=E.length-1;i>=0;i--){
     const e=E[i],dx=e.x-P.x,dy=e.y-y,dd=Math.sqrt(dx*dx+dy*dy);
     if(dd<Rr&&dx*P.fc>-20&&strike(e,0))hitAny=true;
    }
    if(hitAny&&P.ch<P.cmx)rup();
   }
  }
 if(D&&P.ch>0){
    P.ch--;P.ct=P.ct>0?P.ct:P.cm;P.ifr=22;P.ru=9;P.dashHit=0;P.dsh=c.dsh===undefined?12:c.dsh;
    if(c.tp){
     GH.push({x:P.x,y:P.y,l:28,max:28});
     const tdx=P.fc*c.tp,tdy=U?-c.tp*.6:0;
     P.x=Math.max(22,Math.min(W-22,P.x+tdx));
     P.y=Math.max(GND-c.tp*.6,Math.min(GND,P.y+tdy));
     burst(P.x-tdx*.45,P.y-c.h*.5-tdy*.45,16,2.8,20);
    }else{
     P.vx=P.fc*c.dash*(c.push?2.2:1);P.vy=U?-c.dash*.8:-c.dash*.17;P.onG=false;
    }
    P.sq=1.32;tr+=.22;sfx('dash');
    burst(P.x,P.y-c.h*.5,10,2.6,17);
   }
 if(P.onG&&Math.abs(P.vx)>50){
  P.gait+=Math.abs(P.vx)*dt;
  if(P.gait>33){P.gait=0;sfx('step');burst(P.x-P.fc*8,GND-3,3,2.4,15);}
 }
 P.vy+=1950*dt;
 P.x+=P.vx*dt;P.y+=P.vy*dt;
 if(P.y>=GND){P.y=GND;P.vy=0;P.onG=true;}else P.onG=false;
 P.x=Math.max(22,Math.min(W-22,P.x));
 if(P.y<-150){P.y=-150;P.vy=0;}
 P.zz=c.zz?Math.sin(P.gait*1.7)*(Math.abs(P.vx)>40?3.4:0):0;
 P.trail.unshift({x:P.x+P.zz,y:P.y});if(P.trail.length>11)P.trail.pop();
 if(!E.length){wv++;spawn();}
 for(let i=E.length-1;i>=0;i--){
  const e=E[i];
  e.cd=Math.max(0,e.cd-d);e.at=Math.max(0,e.at-d);e.sc=Math.max(0,e.sc-d);e.stun=Math.max(0,e.stun-d);
  e.live+=dt;e.wob+=.05;
   if(e.slo<1)e.slo=Math.min(1,e.slo+.018*d);
  const dx=P.x-e.x,dy=P.y-e.y,dd=Math.sqrt(dx*dx+dy*dy)||1;
  const near=dd<340;
  if(c.thru&&P.dsh>0&&!e.dhit&&Math.abs(dx)<e.s+c.w&&Math.abs(dy)<e.s*2.4){
   e.dhit=1;
   if(strike(e,0)){
    if(P.ch<P.cmx)P.ch++;
    if(c.push){e.x=Math.max(20,Math.min(W-20,e.x+P.fc*52));e.stun=Math.max(e.stun,28);}
    punch(6);tr+=.2;
    burst(e.x,e.y-e.s,14,3.4,22);
   }
   continue;
  }
  if(e.armor&&P.ifr>0&&!P.dashHit&&Math.abs(dx)<e.s+c.w&&Math.abs(dy)<e.s*2.2){
   P.dashHit=1;e.guard=0;e.stun=52;e.cd=Math.max(e.cd,62);
   punch(8);tr+=.3;sfx('hit');sfx('evo',e.t);
   burst(e.x,e.y-e.s,16,3.2,20);
   hurt(e);
   continue;
  }
  if(e.stun>0)continue;
  if(e.t==='doble'){
   e.mir+=(P.vx-e.mir)*Math.min(1,.05*d);
   e.x+=(Math.sign(e.mir||1)*e.sp)*dt*(e.slo||1);
   e.x=Math.max(20,Math.min(W-20,e.x));
   e.fl=Math.sign(e.mir||1);
   if(near&&Math.abs(e.mir)>60&&e.sc<=0){sfx('eTell');sfx('evo',e.t);e.sc=40;}
   if(dd<48&&P.ifr===0)takeHit(e);
   continue;
  }
  if(e.t==='lanzador'||e.t==='agresor'||e.t==='mimetico'){
   const mim=e.t==='mimetico';
   if(mim)e.mir+=(Math.abs(P.vx)-e.mir)*Math.min(1,.04*d);
   const want=mim?150:190;
   if(dd>want){e.x+=(dx/dd)*(e.sp+(mim?e.mir*.25:0))*dt*(e.slo||1);e.fl=Math.sign(dx)||1;}
   else if(e.cd<=0){
    e.cd=mim?38:74;e.phase='aim';e.at=mim?12:16;
   }
   if(e.at>0&&e.phase==='aim'){
    if(near&&e.sc<=0){sfx('eTell');sfx('evo',e.t);e.sc=44;}
    if(e.at<=1){zone(P.x+e.fl*40,GND,mim?52:40,mim?46:40);}
   }
   if(dd<44&&P.ifr===0)takeHit(e);
   continue;
  }
  if(dd>46){e.x+=(dx/dd)*e.sp*dt*(e.slo||1);e.fl=dy>0?1:-1;}
  else if(e.cd<=0){e.cd=64;e.at=11;if(near&&e.sc<=0){sfx('eTell');sfx('evo',e.t);e.sc=44;}}
  if(e.at>0&&dd<58&&P.ifr===0)takeHit(e);
 }
 for(let i=PJ.length-1;i>=0;i--){
  const z=PJ[i];
  if(z.warn>0){z.warn-=d;continue;}
  z.t-=d;
  if(P.ifr===0&&P.y-c.h*.5>z.y-z.r&&Math.abs(P.x-z.x)<z.r)takeHit(null);
  if(z.t<=0)PJ.splice(i,1);
 }
 for(let i=F.length-1;i>=0;i--){
  const q=F[i];q.life-=d;
  if(q.life<=0){F.splice(i,1);continue;}
q.x+=q.vx*d*.3;q.y+=q.vy*d*.3;q.vy+=.12*d;
  }
  for(let i=SH.length-1;i>=0;i--){
   const b=SH[i];b.x+=b.vx*d;b.l-=d;
   if(b.l<=0||b.x<-40||b.x>W+40){SH.splice(i,1);continue;}
   for(let j=E.length-1;j>=0;j--){
    const e=E[j];
    if(Math.abs(e.x-b.x)<e.s*1.7&&Math.abs(e.y-e.s*2-b.y)<e.s*2.6){
     if(strike(e,1)&&b.r){ripple();rup();}
     SH.splice(i,1);break;
    }
   }
  }
  for(let i=GH.length-1;i>=0;i--){const q=GH[i];q.l-=d;if(q.l<=0)GH.splice(i,1);}
  for(let i=RG.length-1;i>=0;i--){
   const q=RG[i];q.r+=3.6*d;q.l-=d;
   if(q.l<=0){RG.splice(i,1);continue;}
   for(const e of E)if(Math.abs(e.x-q.x)<q.r)e.slo=.34;
  }
  camT=Math.max(0,Math.min(W-440,P.x+P.fc*46-P.vx*.15-220));
 cam+=(camT-cam)*Math.min(1,.09*d);
 hpEl.textContent='VIDA '+pad2(Math.max(0,P.hp))+'/'+P.mh;
 statEl.textContent='OLEADA '+wv+' · '+ARCH[lvl-1].label+' · '+kil+' BAJAS';
}
function tc(k,list){
 if(tch[k])return true;
 for(let i=0;i<list.length;i++)if(keys[list[i]])return true;
 return false;
}
function takeHit(e){
 P.hp--;P.ifr=44;punch(9);tr+=.5;slow(.2);sfx('hurt');
 if(e&&EVO[e.t]&&Math.random()<.5)sfx('evo',e.t);
 burst(P.x,P.y-HEROES[hero].h*.5,12,3.2,19);
 if(P.hp<=0)gameOver();
}

// --- Compatibilidad Win7 / Android antiguos ---
// roundRect() es Chrome 99+. Este helper cubre desde Canvas v1.
function rr(g,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);
 g.beginPath();
 g.moveTo(x+r,y);
 g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);
 g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);
 g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);
 g.closePath();
}
// padStart() es ES2017 (Chrome 57+).
function pad2(n){n=String(n);return n.length<2?'0'+n:n;}
// letterSpacing() en canvas es solo Chromium. Se detecta una vez.
var HASPACE=(function(){try{var t=document.createElement('canvas').getContext('2d');
 t.letterSpacing='2px';return t.letterSpacing==='2px';}catch(e){return false;}})();
function setSpace(g,px){
 if(HASPACE)g.letterSpacing=px+'px';
 else if(px==='0')g.letterSpacing='0px';
}
// Fallback: dibuja el texto letra a letra con tracking manual.
function trackText(g,txt,x,y,sp){
 if(HASPACE){g.fillText(txt,x,y);return;}
 var total=0,i;
 for(i=0;i<txt.length;i++)total+=g.measureText(txt[i]).width+sp;
 total-=sp;
 var cx2=g.textAlign==='center'?x-total/2:(g.textAlign==='right'?x-total:x);
 var prev=g.textAlign;g.textAlign='left';
 for(i=0;i<txt.length;i++){g.fillText(txt[i],cx2,y);cx2+=g.measureText(txt[i]).width+sp;}
 g.textAlign=prev;
}
function paintPlay(){
 const g=cx;
 g.fillStyle='#100926';g.fillRect(0,0,W,H);
 sky(g);
 const sx=(W*.7-cam*.05)%(W+400);
 glowDisc(g,sx,GND-70,290,'rgba(255,180,110,.5)','rgba(255,90,60,0)');
 g.fillStyle='rgba(255,206,150,.8)';g.beginPath();g.arc(sx,GND-70,24,0,7);g.fill();
 drawCity(g,.10,0,'#2C2543',.7);
 g.fillStyle='rgba(200,120,90,.09)';g.fillRect(0,GND-190,W,190);
 drawCity(g,.26,0,'#221B38',.88);
 drawCity(g,.48,0,'#1E1734',1);
 g.fillStyle='#100926';g.fillRect(0,GND,W,H-GND);
 const fg=g.createLinearGradient(0,GND,0,H);
 fg.addColorStop(0,'rgba(255,140,70,.16)');fg.addColorStop(1,'rgba(0,0,0,.6)');
 g.fillStyle=fg;g.fillRect(0,GND,W,H-GND);
 g.strokeStyle='rgba(255,196,128,.5)';g.lineWidth=1.4;
 g.beginPath();g.moveTo(0,GND+.7);g.lineTo(W,GND+.7);g.stroke();
 g.strokeStyle='rgba(160,255,140,.15)';g.lineWidth=1.1;g.beginPath();
 for(let i=1;i<rain.length;i+=4){const dr=rain[i];g.moveTo(dr.x,dr.y);g.lineTo(dr.x-4,dr.y+16);}
 g.stroke();
 if(lightF>0){g.fillStyle='rgba(210,235,255,'+(lightF*.42)+')';g.fillRect(0,0,W,H);}
 g.save();g.translate(-cam,0);
 for(const z of PJ){
  g.strokeStyle=z.warn>0?WARN:DANGER;
  g.globalAlpha=z.warn>0?(.35+.4*Math.sin(z.warn*.5)):.5;
  g.lineWidth=2.5;
  g.beginPath();g.ellipse(z.x,z.y-z.r*.15,z.r,z.r*.3,0,0,7);g.stroke();
  g.globalAlpha=1;
 }
 for(const e of E){
  const danger=e.at>0;
  g.globalAlpha=danger?.4:.95;
  const sq=1+Math.sin(e.wob)*.05;
  g.save();g.translate(e.x,e.y);g.scale(1,sq);g.translate(-e.x,-e.y);
  if(danger){
   g.shadowColor=DANGER;g.shadowBlur=18;
   silo(g,e.a.sk,e.x,e.y,e.s*2,e.s*2.1,DANGER);
  }else if(e.armor&&e.stun>0){
   g.shadowColor=WARN;g.shadowBlur=20;
   silo(g,e.a.sk,e.x,e.y,e.s*2,e.s*2.1,DANGER);
  }else if(e.armor&&e.guard<(e.a.guard||0)){
   g.shadowColor=WARN;g.shadowBlur=9;
   silo(g,e.a.sk,e.x,e.y,e.s*2,e.s*2.1,INK);
  }else if(e.t==='lanzador'){
   g.shadowColor=RIM;g.shadowBlur=12;
   silo(g,e.a.sk,e.x,e.y,e.s*2,e.s*2.1,INK);
  }else silo(g,e.a.sk,e.x,e.y,e.s*2,e.s*2.1,INK);
  g.restore();
 }
g.globalAlpha=1;
  for(let i=GH.length-1;i>=0;i--){
   const q=GH[i];
   g.globalAlpha=q.l/q.max*.42;
   silo(g,HEROES[hero].sp,q.x,q.y,HEROES[hero].w,HEROES[hero].h,INK);
  }
  for(let i=P.trail.length-1;i>=1;i--){
  const q=P.trail[i];
  g.globalAlpha=(1-i/P.trail.length)*.18;
  silo(g,HEROES[hero].sp,q.x,q.y,HEROES[hero].w,HEROES[hero].h,'#000');
 }
 g.globalAlpha=1;
 if(P.ru>0||P.ifr<=0||P.ifr%7<4){
  g.save();g.translate(P.x,P.y);g.scale(P.sq,2-P.sq);g.translate(-P.x,-P.y);
  g.shadowColor=P.ru>0?(HEROES[hero].ffc?'#FFC400':DANGER):RIM+'99';
  g.shadowBlur=P.ru>0?24:17;
  silo(g,HEROES[hero].sp,P.x+P.zz,P.y,HEROES[hero].w,HEROES[hero].h,INK);
  g.restore();
 }
 if(P.at>0){
  g.strokeStyle='rgba(255,228,180,.95)';g.lineWidth=8;g.lineCap='round';
  g.globalAlpha=P.at/14;
  g.beginPath();g.arc(P.x+P.fc*14,P.y-HEROES[hero].h*.5,48,-1.05*P.fc,1.05*P.fc,P.fc<0);
  g.stroke();g.globalAlpha=1;
 }
for(const q of F){
   g.globalAlpha=q.life/q.max;
   g.fillStyle=P.ru>0?(HEROES[hero].ffc?WARN:DANGER):'#100926';
   g.beginPath();g.arc(q.x,q.y,q.s*(q.life/q.max)+.5,0,7);g.fill();
  }
  g.globalAlpha=1;
  for(const b of SH){
   g.strokeStyle='#F2DCC0';g.lineWidth=2.2;g.lineCap='round';
   g.beginPath();g.moveTo(b.x-b.vx*.95,b.y+b.vx*.035);g.lineTo(b.x,b.y);g.stroke();
   g.beginPath();g.arc(b.x,b.y,2.6,0,7);g.fill();
   g.lineCap='butt';
  }
  for(const q of RG){
   g.strokeStyle=WARN;g.lineWidth=3;
   g.globalAlpha=Math.max(0,q.l/q.max)*.75;
   g.beginPath();g.ellipse(q.x,q.y,q.r,q.r*.3,0,0,7);g.stroke();
  }
  g.globalAlpha=1;
  g.restore();
 const vg=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.96);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(6,3,10,.85)');
 g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(P.cmx>1){
  for(let i=0;i<P.cmx;i++){
   g.fillStyle=i<P.ch?'#F2DCC0':'rgba(6,3,10,.55)';
   g.fillRect(16+i*20,H-16,14,7);
  }
  g.fillStyle='#F2DCC0';
  g.fillRect(16+(P.cmx-1-Math.min(1,P.ct/P.cm))*20,H-18,2,11);
 }else{
  g.fillStyle='rgba(6,3,10,.5)';g.fillRect(16,H-16,132,7);
  g.fillStyle='#F2DCC0';g.fillRect(16,H-16,130*Math.max(0,1-P.ct/P.cm),7);
 }
 g.fillStyle='rgba(242,220,192,.8)';g.font='800 9px system-ui';g.fillText('DASH',154,H-10);
}

function frame(now){
 requestAnimationFrame(frame);
 perf=now;
 let raw=(now-last)/1000;last=now;
 if(raw>.05)raw=.05;
 if(raw<=0)return;
 if(tr>0)tr=Math.max(0,tr-raw*2.2);
 if(lightT>0){
  lightT-=raw;
  if(lightT<=0){lightF=1;lightT=7+Math.random()*11;setTimeout(()=>{if(AC)SFX.thund();},420);}
 }
 if(lightF>0)lightF=Math.max(0,lightF-raw*3.4);
 updateRain(raw,MODE==='play'?1:.5);
 if(MODE==='title'){
  camT+=raw*7;
  if(camT>W)camT=0;
  paintTitle(now);
  return;
 }
 if(MODE!=='play')return;
 if(hs>0){hs--;paintPlay();return;}
 if(ss>0){ss-=raw;if(ss<=0)ss=0;}
 update(raw*(ss>0?.36:1));
 paintPlay();
}
function tapSel(x,y){
 const bw=88,bh=104,gap=10;
 const tot=HEROES.length*bw+(HEROES.length-1)*gap,sx=W/2-tot/2;
 const r=CV.getBoundingClientRect();
 const sc=W/r.width;
 const px=(x-r.left)*sc,py=(y-r.top)*sc;
 const by=H*.63;
 if(py<by-12||py>by+bh+22)return false;
 for(let i=0;i<HEROES.length;i++){
  const bx=sx+i*(bw+gap);
  if(px>=bx&&px<=bx+bw){hero=i;return true;}
 }
 return false;
}
CV.addEventListener('touchstart',e=>{
 if(MODE!=='title')return;
 const t=e.changedTouches[0];
 tapSel(t.clientX,t.clientY);
},{passive:true});
CV.addEventListener('mousedown',e=>{if(MODE==='title')tapSel(e.clientX,e.clientY);});

function fire(fn){
 fn();fn();
}
function go(e){
 if(e){e.preventDefault();e.stopPropagation();}
 if(MODE==='title'||MODE==='over')start();
}
playBtn.addEventListener('click',go);
playBtn.addEventListener('touchstart',go,{passive:false});
playBtn.addEventListener('pointerdown',go);
reBtn.addEventListener('click',go);
reBtn.addEventListener('touchstart',go,{passive:false});
reBtn.addEventListener('pointerdown',go);

buildCity();
MODE='title';
requestAnimationFrame(frame);
})();