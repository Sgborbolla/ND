'use strict';
const fs=require('fs'),path=require('path');
const SRC=process.env.ND_SRC||'/storage/emulated/0/silueta/nd.js';

// ---- banco de pruebas: expone internals sin tocar el archivo real ----
let src=fs.readFileSync(SRC,'utf8');
const hook=`window.__T={get P(){return P},set P(v){P=v},get E(){return E},set E(v){E=v},
 get PJ(){return PJ},get MODE(){return MODE},set MODE(v){MODE=v},
 get wv(){return wv},set wv(v){wv=v},get lvl(){return lvl},set lvl(v){lvl=v},
 get kil(){return kil},get ARCH(){return ARCH},
 get musOn(){try{return musOn}catch(e){return null}},get cam(){return cam},get hero(){return hero},
 start:start,gameOver:gameOver,spawn:spawn,hurt:hurt,update:update,HEROES:HEROES};`;
const tail='})();';
if(src.trim().slice(-tail.length)!==tail)throw new Error('no encuentro el cierre del IIFE');
src=src.trimEnd().slice(0,-tail.length)+hook+'\n'+tail;

// ---- doubles minimos: canvas, audio, DOM, timers ----
const CTXLOG=[];
function mkGrad(){return{addColorStop(){}};}
function mkCtx(){
 const rec=n=>CTXLOG.push(n);
 const c={createLinearGradient:()=>{rec('createLinearGradient');return mkGrad();},
  createRadialGradient:()=>{rec('createRadialGradient');return mkGrad();},
  canvas:{width:0,height:0}};
 const methods=['fillRect','clearRect','beginPath','arc','fill','stroke','moveTo','lineTo','closePath',
  'ellipse','roundRect','fillText','strokeText','translate','scale','save','restore','rotate',
  'quadraticCurveTo','bezierCurveTo','rect','clip','setTransform','resetTransform','drawImage','putImageData'];
 for(const m of methods)c[m]=function(){rec(m);};
 c.translate=function(x,y){rec(x<0?'CAM':'translate');};
 return c;
}
const ctx=mkCtx();
const params=new Map([['c',null]]);
const callsLog=[];
function mkEl(id){
 const el={id,style:{},dataset:{},textContent:'',innerHTML:'',
  classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},contains(c){return this._s.has(c)}},
  _h:{},
  width:0,height:0};
 el.addEventListener=function(t,f){(this._h[t]=this._h[t]||[]).push(f)};
 el.removeEventListener=function(){};
 el.getBoundingClientRect=()=>({left:0,top:0,width:960,height:540});
 el.getContext=()=>ctx;
 return el;
}
const els={};
for(const id of['c','hud','hp','stat','pad','ui','play','tips','over','ores','ost','re','l','r','a','d'])els[id]=mkEl(id);
params.set('c',els.c);

global.document={getElementById:id=>els[id]||null,
 createElement:()=>mkEl('tmp'),body:mkEl('body')};
global.window=global;
Object.defineProperty(global,'navigator',{value:{maxTouchPoints:0},configurable:true,writable:true});
global.innerWidth=960;global.innerHeight=540;
global.devicePixelRatio=2;
global.addEventListener=function(t,f){(global.__win||(global.__win={}))[t]=(global.__win[t]||[]).concat(f)};
global.removeEventListener=function(){};

// audio fake
const AUDIO={osc:0,buf:0};
function mkParam(v){return{value:v===undefined?1:v,
 setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}};}
global.AudioContext=function(){
 const self=this;
 this.sampleRate=8000;
 this.state='running';
 this.destination={};
 this._t=0;
 Object.defineProperty(this,'currentTime',{get(){return self._t;}});
 this.resume=()=>{};
 this.createGain=()=>({gain:mkParam(1),connect(){}});
 this.createBuffer=(ch,len)=>({getChannelData:()=>new Float32Array(len)});
 this.createBufferSource=()=>{AUDIO.buf++;return{buffer:null,loop:false,connect(){},start(){},stop(){}}};
 this.createOscillator=()=>{AUDIO.osc++;return{type:'sine',frequency:mkParam(440),connect(){},start(){},stop(){}}};
 this.createBiquadFilter=()=>({type:'',Q:mkParam(1),frequency:mkParam(1000),connect(){}});
};

// reloj virtual
let VT=0;
const timers=[];
let timerSeq=0;
global.setTimeout=function(fn,ms){const id=++timerSeq;timers.push({id,t:VT+(ms||0),fn});return id;};
global.clearTimeout=function(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);};
function flushTimers(){
 for(;;){
  timers.sort((a,b)=>a.t-b.t);
  if(!timers.length||timers[0].t>VT)break;
  const t=timers.shift();
  try{t.fn();}catch(e){console.error('TIMER ERR',e);}
 }
}
global.performance={now:()=>VT};
let rafCb=null;
global.requestAnimationFrame=cb=>{rafCb=cb;return 1;};

// ---- carga del juego con el hook ----
eval(src);

// ---- drivers ----
function step(dtMs){
 CTXLOG.length=0;
 VT+=dtMs;
 flushTimers();
 const cb=rafCb;rafCb=null;
 cb&&cb(VT);
 flushTimers();
}
function key(code,down){
 const hs=global.__win[down?'keydown':'keyup']||[];
 hs.forEach(f=>f({code,preventDefault(){}}));
}

// ---- asserts ----
let pass=0,fail=0;
function ok(name,cond,extra){
 if(cond){pass++;console.log('  ok   '+name);}
 else{fail++;console.log('  FAIL '+name+(extra!==undefined?'  -> '+JSON.stringify(extra):''));}
}
function section(s){console.log('\n== '+s+' ==');}

const T=global.__T;
const keyStart=c=>{key(c,true);key(c,false);};

// ============ 1. REINICIO ============
section('1. REINTENTAR tras muerte');
keyStart('Enter');
ok('title -> play',T.MODE==='play',T.MODE);
T.gameOver();
ok('gameOver -> over',T.MODE==='over',T.MODE);
ok('pantalla over visible',els.over.style.display==='flex',els.over.style.display);
els.re._h.click.forEach(f=>f({preventDefault(){},stopPropagation(){}}));
ok('REINTENTAR -> play',T.MODE==='play',T.MODE);
ok('over oculto tras reiniciar',els.over.style.display==='none',els.over.style.display);
ok('HUD visible',els.hud.style.display==='flex',els.hud.style.display);
ok('vida restaurada',T.P.hp===T.P.mh,[T.P.hp,T.P.mh]);
T.gameOver();T.start();
ok('start() directo tras over',T.MODE==='play',T.MODE);

// ============ 2. MUSICA ============
section('2.Bucles de musica');
function musicTimers(){
 // los timers de musica son los que reaparecen cada 70ms
 return timers.filter(t=>false).length;
}
function countMusic(){
 // cuenta cuantos timers pendientes invocan el loop de musica (cadencia 70ms)
 return timers.filter(t=>t.dt===70).length;
}
// rastreo real: envolvemos setTimeout para marcar los de 70ms
T.start();
step(16);step(16);step(16);
const before=timers.length;
for(let i=0;i<5;i++)step(16);
const during=timers.length;
ok('musica corre (hay timers vivos)',timers.length>0,timers.length);
T.gameOver();
for(let i=0;i<90;i++)step(16); // ~1.5s
ok('musica se detiene tras morir',T.musOn===false,T.musOn);
T.start();
step(16);
const after=timers.length;
ok('no se duplican bucles (<8 timers)',after<8,after);
for(let i=0;i<120;i++)step(16);
ok('sigue sonando tras reiniciar',T.musOn===true,T.musOn);
T.gameOver();
for(let i=0;i<90;i++)step(16);

// ============ 3. BLINDADO MATABLE ============
section('3. BLINDADO: guardia rompible');
T.start();
const bi=T.ARCH.findIndex(a=>a.k==='blindado');
ok('blindado existe en ARCH',bi>=0,bi);
const bdef=T.ARCH[bi];
// fuerza oleada 7 => nivel 4
T.wv=6;
T.spawn();
const arm=E=>E.find(x=>x.armor);
ok('spawn de nivel 4 incluye blindado',!!arm(T.E),T.E.map(e=>e.t));
if(arm(T.E)){
 const e=arm(T.E);
 ok('guardia inicial = 3',e.guard===bdef.guard,[e.guard,bdef.guard]);
 const hp0=e.hp;
 // acercarse y golpear (tecla MANTENIDA durante el frame)
 let hits=0,guardSeen=e.guard,damaged=false;
 for(let k=0;k<40;k++){
  T.P.hp=99;T.P.x=e.x-30;T.P.fc=1;T.P.at=0;T.P.ct=40;
  key('Space',true);step(16);key('Space',false);
  hits++;
  if(e.guard<guardSeen)guardSeen=e.guard;
  if(e.hp<hp0){damaged=true;break;}
 }
 ok('la guardia baja con cada golpe',guardSeen<3,{guardSeen,hits});
 ok('al romper la guardia hace dano',damaged,{hp0,hp:e.hp,stun:e.stun,guard:e.guard,hits});
 // rematar: 3 golpes = 1 dmg, asi que 6 daunos en total -> 18 golpes
for(let k=0;k<9000&&T.E.indexOf(e)>=0;k++){
  T.P.hp=99;T.P.x=e.x-30;T.P.fc=1;T.P.at=0;T.P.ct=40;T.P.ifr=0;T.P.vx=0;
  key('Space',true);step(16);key('Space',false);
 }
 ok('BLINDADO muere a golpes (ya no es inmortal)',T.E.indexOf(e)<0,{hp:e.hp,vivos:T.E.length});
 // y tambien con dash-through, desde guardia llena
 {
  const e2=T.E.find(x=>x.armor);
  if(e2){
   const h0=e2.hp;
   e2.x=600; // el clamp del jugador lo deja fuera de alcance en x>938
   // el dash solo cuenta si hay solapamiento durante los i-frames
   for(let k=0;k<400&&T.E.indexOf(e2)>=0;k++){
    T.P.hp=99;T.P.x=580;T.P.fc=1;T.P.ct=0;T.P.at=0;T.P.ifr=0;T.P.vx=0;
    key('ShiftLeft',true);step(16);key('ShiftLeft',false);
   }
   ok('el dash atraviesa y rompe la guardia',T.E.indexOf(e2)<0||e2.hp<h0,{h0,hp:e2.hp,guard:e2.guard});
  }
 }
}

// ============ 4. SPAM DE TELERAFIA ============
section('4. Telegrafia: sin spam de audio');
T.start();
T.wv=2;T.spawn(); // nivel 2 => lanzador
for(let i=0;i<40;i++){T.P.x=300;step(16);}
const lz=T.E.find(e=>e.t==='lanzador');
ok('lanzador en pantalla',!!lz,T.E.map(e=>e.t));
if(lz){
 lz.x=T.P.x+150;lz.cd=0; // dentro de su rango de decision => entra en telegrafia
 const b0=AUDIO.buf+AUDIO.osc;
 for(let i=0;i<30;i++){T.P.hp=99;lz.x=T.P.x+150;step(16);}
 const b1=AUDIO.buf+AUDIO.osc;
 console.log('       (delta audio en 30 frames = '+(b1-b0)+')');
 ok('telegrafia no dispara audio cada frame',(b1-b0)<25,{delta:b1-b0,frames:30});
}

// ============ 5. ZONAS CON CAMARA ============
section('5. Zonas de peligro dentro de la camara');
T.start();
for(let i=0;i<30;i++){T.P.x=300;step(16);}
T.P.x=860; // forzar camara > 0
for(let i=0;i<80;i++){T.P.hp=99;step(16);}
ok('camara desplazada',T.cam>1,T.cam);
// inyecta una zona activa en coordenadas de mundo, junto al jugador
T.PJ.push({x:T.P.x+60,y:468,r:44,t:60,max:60,warn:0,hit:0});
ok('zona en mundo',T.PJ.length>0,T.PJ.length);
CTXLOG.length=0;
T.P.hp=99;step(16);
const iCam=CTXLOG.indexOf('CAM');
const iEll=CTXLOG.indexOf('ellipse');
ok('la zona se dibuja DESPUES del translate de camara',iCam>=0&&iEll>iCam,{iCam,iEll,log:CTXLOG.slice(0,14)});

// ============ 6. MIMETICO ============
section('6. Mimetico con comportamiento propio');
T.start();
T.wv=10;T.spawn();
const mim=T.E.find(e=>e.t==='mimetico');
ok('mimetico spawnea',!!mim,T.E.map(e=>e.t));
if(mim){
 const hp0=mim.hp;
 for(let k=0;k<600&&T.E.indexOf(mim)>=0;k++){
  T.P.hp=99;T.P.x=mim.x-28;T.P.fc=1;T.P.at=0;T.P.ct=40;
  key('Space',true);step(16);key('Space',false);
 }
 ok('mimetico es matable',T.E.indexOf(mim)<0||mim.hp<hp0,{hp:mim.hp,hp0});
}

// ============ 7. PROGRESION DE NIVELES ============
section('7. Progresion de olas');
T.start();
const seen=new Set();
for(let wv=1;wv<=12;wv++){
 T.wv=wv;T.spawn();
 seen.add(T.ARCH[T.lvl-1].label);
}
ok('cubren 6 arquetipos en 12 olas',seen.size===6,[...seen]);

console.log('\n────────────────────────────');
console.log('  ok: '+pass+'   FAIL: '+fail);
console.log('────────────────────────────');
process.exit(fail?1:0);