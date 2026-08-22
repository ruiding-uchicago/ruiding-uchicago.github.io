/* hard-region-3d.js — the hard region, extruded: WebGL2 hololith terrain over
   the live 2D phase diagram. Same seeded field(), levels, nodes. No deps. */
const M=Math,RAF=requestAnimationFrame;
const NOW=()=>performance.now();

/* ---------- ported from hard-region.js (seed 20260610) ---------- */
function makeNoise(seed) {
  var p=new Uint8Array(512),s=seed >>> 0||1,i,j,t;
  function rnd() { s=(s*1664525+1013904223) >>> 0;return s/4294967296;}
  for (i=0;i<256;i++) p[i]=i;
  for (i=255;i>0;i--) { j=(rnd()*(i+1))|0;t=p[i];p[i]=p[j];p[j]=t;}
  for (i=0;i<256;i++) p[256+i]=p[i];
  function fade(t) { return t*t*t*(t*(t*6-15)+10);}
  function lp(t,a,b) { return a+t*(b-a);}
  function grad(h, x, y) {   // the 2D map's 8-case gradient switch, condensed
    h &= 7;
    return h<4?(h&2?-x:x)+(h&1?-y:y):h<6?(h&1?-x:x):(h&1?-y:y);
  }
  return function (x,y) {
    var X=M.floor(x)&255,Y=M.floor(y)&255;
    x-=M.floor(x);y-=M.floor(y);
    var u=fade(x),v=fade(y),a=p[X]+Y,b=p[X+1]+Y;
    return lp(v,lp(u,grad(p[a],x,y),grad(p[b],x-1,y)),
      lp(u,grad(p[a+1],x,y-1),grad(p[b+1],x-1,y-1)));
  };
}
const noise=makeNoise(20260610);
function fbm(x,y) {
  var v=0,amp=1,f=1,n=0;
  for (var o=0;o<4;o++) { v+=amp*noise(x*f,y*f);n+=amp;amp*=0.5;f*=2;}
  return v/n*0.5+0.5;
}
function smooth(a,b,x) {
  x=M.min(1,M.max(0,(x-a)/(b-a)));
  return x*x*(3-2*x);
}
function field(u,v) {
  return fbm(u*3.1+7,v*3.1+3)*(0.28+0.92*smooth(0.18,0.95,(u+v)/2));
}
/* node data — as in hard-region.js */
const BENCH=[   // hi: holo/vex slot (fixed 8-slot idx, see hGi)
  { u: 0.045, v: 0.055, label: 'PubChem', s:'R', hi: 3 },
  { u: 0.100, v: 0.115, label: 'QM9', s:'R', hi: 0 },
  { u: 0.045, v: 0.175, label: 'MD17', m: 1, s:'R', hi: 6 },
  { u: 0.105, v: 0.215, label: 'ANI-1x', m: 1, s:'L' },
  { u: 0.048, v: 0.252, label: 'SPICE', m: 1, s:'R' },
  { u: 0.105, v: 0.292, label: 'PCQM4Mv2', m: 1, s:'L' },
  { u: 0.175, v: 0.295, label: 'Materials Project', s:'R', hi: 1 },
  { u: 0.245, v: 0.045, label: 'AFLOW', s:'R', hi: 4 },
  { u: 0.180, v: 0.075, label: 'COD', m: 1, s:'R' },
  { u: 0.262, v: 0.110, label: 'MatBench', m: 1, s:'L', hi: 7 },
  { u: 0.178, v: 0.145, label: 'ICSD', m: 1, s:'R' },
  { u: 0.250, v: 0.180, label: 'OQMD', m: 1, s:'R', hi: 5 },
  { u: 0.180, v: 0.215, label: 'CSD', m: 1, s:'R' },
  { u: 0.255, v: 0.250, label: 'OMat24', m: 1, s:'L' },
  { u: 0.325, v: 0.080, label: 'OC20', s:'R', hi: 2 },
  { u: 0.345, v: 0.155, label: 'OC22', m: 1, s:'L' }];
/* rings: [name,up,cx,cy,rw,rh] */
const RINGS=[
  ['small molecules',1,0.075,0.1735,0.055,0.1435],
  ['pure crystals',1,0.2185,0.17,0.0685,0.15],
  ['simple surfaces',-1,0.335,0.1175,0.035,0.0625]];
const DISC=[
  { u: 0.375, v: 0.335, label: 'perovskites' },
  { u: 0.510, v: 0.400, label: 'MOFs' },
  { u: 0.565, v: 0.530, label: 'alloys' },
  { u: 0.365, v: 0.205, label: 'zeolites' },
  { u: 0.470, v: 0.465, label: '2D materials' },
  { u: 0.450, v: 0.270, label: 'battery cathodes' }];
const HARD=[   // disp: short on-map form; label (full name) still drives #hr-info
  { u: 0.67, v: 0.78, label: 'fuel cell membrane electrode assembly', disp: 'fuel cell MEA', dx: -10, dy: 4,
    why: 'Catalyst, ionomer, membrane and GDL all couple. One data point means building and testing a full assembly.' },
  { u: 0.80, v: 0.90, label: 'water electrolyzer membrane electrode assembly', disp: 'water electrolyzer MEA', dx: -10, dy: 4,
    why: 'Same coupling as fuel cells, plus degradation that only shows up after hundreds of hours.' },
  { u: 0.94, v: 0.71, label: 'FET sensors', dx: -10, dy: 4,
    why: 'Response depends on probe, channel, geometry and the water matrix at once. Published curves are rarely comparable.' },
  { u: 0.80, v: 0.68, label: 'water pollutant sensing / adsorption composite membranes', disp: 'water pollutant sensing membranes', dx: -10, dy: 4,
    why: 'ppt-level targets in real matrices full of competing ions. Public datasets: nearly none.' },
  { u: 0.97, v: 0.83, label: 'multimetallic oxides', dx: -10, dy: 4,
    why: 'Long synthesis-structure-property chains, dozens of coupled variables, no standard descriptors.' }];
const hGi=(cls,i,n)=>cls==='hard'?14+i:cls==='disc'?8+i:(n.hi!=null?n.hi:-1);
let CAP=null;   // #hr-info captions, lazy-shared with hard-region.js
import('/assets/js/hard-region-captions.js').then(m=>{ CAP=m;}).catch(()=>{});
const nodeOf=(cls,i)=>cls==='hard'?HARD[i]:cls==='disc'?DISC[i]:BENCH[i];
const capFor=(cls,n)=>cls==='hard'||cls==='ring'?n.why:CAP&&CAP[cls==='disc'?'DISC_CAP':'BENCH_CAP'][n.label];

/* ---------- world: x = complexity, y = data cost (depth), z = difficulty ---------- */
const HW = 1.0, HD = 0.625;   // half width / half depth of the footprint
const HS = 1.1;               // z per field unit → peak ≈ 0.55 × map width
const HMAX = 0.8;             // R8 bake scale (field max is 0.788)
const PZ = -0.045, PM = 0.16;   // plinth z and margin beyond the footprint
const TXW=256,TXH=160,GN=129,GM=81,FOV0=0.52;
const AZ0 = -0.44, POL0 = 0.645, R0 = 3.42, TG0 = [-0.02, -0.075, 0.375];   // hero pose (D-R1 reframe)
/* entrance: near-top-down long lens fits the map depth */
const POLE=1.32,FOVE=0.36,ENT_R=HD*M.sin(POLE)/M.tan(FOVE/2),ENT_END=2.75;
const POSE = [   // tour poses: lowlands / foothills / massif+bullets / hero
  [-0.02,0.44,R0*0.78,-0.15,-0.18,0.12],
  [-0.14,0.60,R0*0.85,-0.02,0.02,0.24],
  [-0.88,0.37,R0*0.865,0.50,0.42,0.26],
  [AZ0,POL0,R0,...TG0]];
const wx=u=>(u*2-1)*HW,wy=v=>(v*2-1)*HD;
const clamp01=x=>x<0?0:x>1?1:x;
const ss=(a,b,x)=>{ x=clamp01((x-a)/(b-a));return x*x*(3-2*x);};
const eoExpo=t=>t>=1?1:1-M.pow(2,-10*t);
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- mat4 (column major) ---------- */
function mPersp(o, fov, asp, n, f, sx) {   // sx: entrance-only anisotropic stretch
  const t=1/M.tan(fov/2),d=1/(n-f);
  o.set([t/asp*sx,0,0,0,0,t,0,0,0,0,(f+n)*d,-1,0,0,2*f*n*d,0]);
}
function mLook(o, e, c) {   // up is +z; camera x stays in the ground plane
  let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];
  let l=M.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
  let xx=-zy,xy=zx;
  l=M.hypot(xx,xy)||1;xx/=l;xy/=l;
  const yx=-zz*xy,yy=zz*xx,yz=zx*xy-zy*xx;
  o.set([xx,yx,zx,0,xy,yy,zy,0,0,yz,zz,0,
    -(xx*e[0]+xy*e[1]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]);
}
function mMul(o,a,b) {
  for (let c=0;c<4;c++) for (let r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
}

/* ---------- shaders ---------- */
const IGN = `float ign(vec2 p){return fract(52.9829189*fract(0.06711056*p.x+0.00583715*p.y));}`;
const TERR_VS = `#version 300 es
in vec3 aPos;uniform mat4 uMVP;uniform vec3 uDim;uniform float uLift,uPz;out vec2 vUV;out vec3 vW;
void main(){vec3 w=vec3((aPos.x*2.-1.)*uDim.x,(aPos.y*2.-1.)*uDim.y,mix(uPz,aPos.z*uDim.z,uLift));
vUV=aPos.xy;vW=w;gl_Position=uMVP*vec4(w,1.);}`;
/* one program, 4 passes: 0 body, 1 glow skin (dark), 2 plinth, 3 entrance ring */
const TERR_FS = `#version 300 es
precision highp float;
in vec2 vUV;in vec3 vW;uniform sampler2D uH;uniform vec3 uDim;uniform vec2 uTexel;
uniform vec3 uEye,uSun,uTeal,uChamp,uCrim,uBase,uFog,uPlate,uInk;
uniform float uHMax,uPass,uGlow,uBodyA,uFillA,uTime,uClip,uSkinA,uRL,uRA,uXd;uniform vec4 uScan[4];out vec4 o;
float hf(vec2 uv){return texture(uH,uv).r*uHMax;}
${IGN}
void main(){
 float inside=step(abs(vUV.x-.5),.5)*step(abs(vUV.y-.5),.5);
 float h=hf(clamp(vUV,0.,1.));float e=1.5;
 if(uPass<1.5&&h>uClip)discard;
 float sk=uSkinA*exp(-abs(h-uClip)*46.);
 float hx=hf(vUV+vec2(uTexel.x*e,0.))-hf(vUV-vec2(uTexel.x*e,0.));
 float hy=hf(vUV+vec2(0.,uTexel.y*e))-hf(vUV-vec2(0.,uTexel.y*e));
 vec3 n=normalize(vec3(-hx*uDim.z/(4.*e*uTexel.x*uDim.x),-hy*uDim.z/(4.*e*uTexel.y*uDim.y),1.));
 float lam=max(dot(n,uSun),0.);float shade=.30+.85*lam;
 float t=clamp(((vUV.x+vUV.y)*.5-.18)/.77,0.,1.);t=t*t*(3.-2.*t);
 vec3 ramp=mix(uTeal,uChamp,smoothstep(.10,.52,t));ramp=mix(ramp,uCrim,smoothstep(.52,.88,t));
 float tl=(h-.26)/.10;float fw=max(fwidth(tl),1e-4);float dl=abs(fract(tl+.5)-.5);
 float steep=smoothstep(.12,.70,1.-n.z);
 float line=(1.-smoothstep(0.,fw*mix(.9,1.9,steep),dl))*step(-.45,tl)*step(tl,6.45)*inside;
 float flare=0.;
 for(int i=0;i<4;i++){if(uScan[i].w<.01)continue;float age=uTime-uScan[i].z;
  vec2 d2=(vUV-uScan[i].xy)*vec2(2.*uDim.x,2.*uDim.y);
  flare+=(1.-smoothstep(0.,.085,abs(length(d2)-(.05+1.05*age))))*exp(-age*2.1)*uScan[i].w;}
 float fog=exp(-max(vW.z,0.)*2.8);
 float fres=pow(1.-max(dot(n,normalize(uEye-vW)),0.),3.);
 float mw=smoothstep(.12,.38,t)*(1.-smoothstep(.50,.74,t));
 vec3 col;float A=1.;
 if(uPass<.5){
  line*=mix(.5,1.,steep);
  if(uGlow>.5){col=uBase*.55+ramp*shade*(.36+.18*mw)+uChamp*mw*.065+ramp*line*.30;
   col=mix(col,uFog,fog*.72);col+=ramp*sk*.85;A=uBodyA;}
  else{col=uBase*(.84+.19*shade);col=mix(col,ramp,.05+.08*shade);col=mix(col,uFog,fog*.45);
   vec3 ink=mix(uTeal*.62,uCrim,smoothstep(.28,.72,t));col=mix(col,ink,line*.88);
   col=mix(col,uCrim,min(flare*.55,.85)*(.35+.65*line));col=mix(col,uCrim,sk*.4);A=uBodyA;}
 }else if(uPass<1.5){
  col=ramp*(uFillA+line*mix(.5,1.,steep)*.62)+uCrim*fres*.28+(ramp+.5*uCrim)*flare*(.3+line*1.25);
  col*=1.-fog*.65;col+=ramp*sk*.5;
 }else if(uPass<2.5){
  vec2 g=abs(fract(vUV*24.)-.5);vec2 gw=fwidth(vUV*24.);
  float grid=max(1.-smoothstep(0.,gw.x*.9,g.x),1.-smoothstep(0.,gw.y*.9,g.y));
  float fl=(1.-smoothstep(0.,fw*.95,dl))*step(-.45,tl)*step(tl,6.45)*inside;
  col=uPlate;col=mix(col,ramp,.09*inside);col=mix(col,uInk,grid*.35);col=mix(col,uInk,fl*(.8+uRA));
 }else{
  float ln=(1.-smoothstep(0.,max(fwidth(h)*2.3,1e-4),abs(h-uRL)))*inside*uRA;
  col=ramp*ln;A=ln;
 }
 col=mix(col,uGlow>.5?vec3(0.):uBase,uXd);
 col+=(ign(gl_FragCoord.xy)-.5)*(2./255.);
 o=vec4(col,A);}`;
const LINE_VS = `#version 300 es
in vec3 aPos;in vec4 aCol;in float aS;uniform mat4 uMVP;out vec4 vC;out float vS;
void main(){vC=aCol;vS=aS;gl_Position=uMVP*vec4(aPos,1.);}`;
const LINE_FS = `#version 300 es
precision highp float;
in vec4 vC;in float vS;uniform float uDash,uTime,uA;out vec4 o;
void main(){if(uDash>.5&&fract(vS-uTime)>.45)discard;float a=vC.a*uA;o=vec4(vC.rgb*a,a);}`;
const PT_VS = `#version 300 es
in vec3 aP;in float aPh;uniform mat4 uMVP;
uniform float uSize,uTime,uShape,uDPR,uClip,uStg;uniform int uHot,uSel;
out float vTw;out float vB;out float vE;
void main(){
 float tw=uShape>1.5?(.65+.35*sin(uTime*1.5625+aPh)):1.;
 float b=(gl_VertexID==uHot||gl_VertexID==uSel)?1.:0.;
 vE=smoothstep(0.,.05,uClip-aP.z*.9091-float(gl_VertexID)*uStg);
 vTw=tw;vB=b;gl_Position=uMVP*vec4(aP,1.);
 gl_PointSize=uSize*uDPR*(1.+.3*b)*(uShape>1.5?(.8+.25*tw):1.);}`;
const PT_FS = `#version 300 es
precision highp float;
in float vTw;in float vB;in float vE;uniform vec3 uCol;uniform float uShape,uA,uGlow;out vec4 o;
void main(){
 vec2 p=gl_PointCoord*2.-1.;float r=length(p);float a;
 if(uShape<.5)a=1.-smoothstep(.5,.72,r);
 else if(uShape<1.5)a=1.-smoothstep(.52,.72,abs(p.x)+abs(p.y));
 else if(uShape<2.5){a=(1.-smoothstep(.14,.30,r))+exp(-r*3.2)*(.30+.55*vTw)*(.35+.65*uGlow);}
 else a=1.-smoothstep(.06,.18,abs(r-.6));
 a*=uA*(uShape>1.5?(.55+.45*vTw):1.)*(1.+.5*vB)*vE;
 if(a<.004)discard;a=min(a,1.);o=vec4(uCol*a,a);}`;

/* ---------- module state (singleton) ---------- */
let S=null;
const mP=new Float32Array(16),mV=new Float32Array(16),mVP=new Float32Array(16);
/* GL/DOM shorthands */
const CE=t=>document.createElement(t);
const AH=e=>e.setAttribute('aria-hidden','true');
const AL=(p,n)=>S.gl.getAttribLocation(p,n);
const SCR=new Float32Array(6);
const F1=(l,v)=>S.gl.uniform1f(l,v);
const U3=(l,c)=>S.gl.uniform3f(l,c[0],c[1],c[2]);
const MVPU=P=>S.gl.uniformMatrix4fv(P.uMVP,false,mVP);
const BB=b=>S.gl.bindBuffer(S.gl.ARRAY_BUFFER,b);
const BD=(b,d)=>{ BB(b);S.gl.bufferData(S.gl.ARRAY_BUFFER,d,S.gl.DYNAMIC_DRAW);};
const DE=()=>S.gl.drawElements(S.gl.TRIANGLES,S.nIdx,S.gl.UNSIGNED_SHORT,0);
const BFP=()=>S.gl.blendFunc(S.gl.ONE,S.dark?S.gl.ONE:S.gl.ONE_MINUS_SRC_ALPHA);

function compile(gl,vs,fs) {
  const sh=(ty,src)=>{
    const s=gl.createShader(ty);
    gl.shaderSource(s,src);gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const p=gl.createProgram();
  gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  const o={ p },n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for (let i=0;i<n;i++) {
    const inf=gl.getActiveUniform(p,i);
    o[inf.name.replace('[0]', '')] = gl.getUniformLocation(p, inf.name);
  }
  return o;
}
function cssColor(s,fb) {
  s = (s || '').trim();
  let m=/^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const n=parseInt(m[1],16);
    return [(n >> 16&255)/255,(n >> 8&255)/255,(n&255)/255,1];
  }
  m=/^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const a=m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return [a[0]/255,a[1]/255,a[2]/255,a.length>3?a[3]:1];
  }
  return fb.concat(1);
}
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

/* hues from CSS custom props; re-read on scheme change */
function readColors() {
  const cs=getComputedStyle(document.documentElement);
  const g=(n,fb)=>cssColor(cs.getPropertyValue(n),fb).slice(0,3);
  const ink4 = cssColor(cs.getPropertyValue('--color-border-strong'), [0.5, 0.5, 0.5]);
  const dark = S.dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const bg = g('--color-bg-secondary', dark ? [0.09, 0.07, 0.07] : [0.95, 0.93, 0.89]);
  S.col={
    bg, teal: g('--color-accent-teal', [0.37, 0.6, 0.6]),
    champ: g('--color-accent', [0.84, 0.78, 0.62]),
    crim: g('--color-primary', [0.9, 0.28, 0.3]),
    ink: mixc(bg, ink4, ink4[3]),   // border composited over bg
    plate: dark?mixc(bg,[0,0,0],0.45):mixc(bg,[0.35,0.28,0.2],0.12),
    fog: dark?mixc(bg,[0,0,0],0.35):mixc(bg,[1,1,1],0.4)
  };
  if (S.gl&&S.buf&&!S.gl.isContextLost()) { BD(S.buf.lineCol,lineGeom().col);paintArcs();paintRings();}
}

/* ---------- geometry ---------- */
const nodeZ=(n,lift)=>field(n.u,n.v)*HS+lift;
function lineGeom() {   // plinth rim, footprint rim, axes/ticks, z ruler, stems
  const P=[],C=[],col=S.col,dark=S.dark;
  const seg=(a,b,c)=>{ P.push(...a,...b);C.push(...c,...c);};
  const rim=[...col.ink,dark?0.75:0.9],dim=[...col.ink,dark?0.4:0.55];
  [[HW+PM,HD+PM,rim],[HW,HD,dim]].forEach(([w,d,c])=>{
    seg([-w,-d,PZ],[w,-d,PZ],c);seg([w,-d,PZ],[w,d,PZ],c);
    seg([w,d,PZ],[-w,d,PZ],c);seg([-w,d,PZ],[-w,-d,PZ],c);
  });
  for (let i = 1; i < 4; i++) {   // quarter ticks on both front edges
    seg([wx(i/4),-HD,PZ],[wx(i/4),-HD-0.05,PZ],dim);
    seg([-HW,wy(i/4),PZ],[-HW-0.05,wy(i/4),PZ],dim);
  }
  seg([-HW, -HD, PZ], [-HW, -HD, 0.86 * HS], dim);   // z ruler, ticked at the 7 LEVELS
  for (let i=0;i<7;i++) seg([-HW,-HD,(0.26+i*0.1)*HS],[-HW-0.04,-HD,(0.26+i*0.1)*HS],dim);
  const stem=(n,c,lift)=>seg([wx(n.u),wy(n.v),nodeZ(n,lift)],[wx(n.u),wy(n.v),PZ],c);
  const tA=dark?0.4:0.55;
  BENCH.forEach(n=>stem(n,[...col.teal,tA],0.012));
  DISC.forEach(n=>stem(n,[...col.champ,tA],0.012));
  HARD.forEach(n => stem(n, [...col.crim, dark ? 0.55 : 0.7], 0.055));   // beacon pylons
  return { pos: new Float32Array(P),col: new Float32Array(C) };
}
function buildArcs() {   // expedition arcs: lowlands → beacons, draped on the field
  const paths=[[BENCH[0],HARD[3],0.10],[BENCH[1],HARD[2],-0.14]],N=44;
  const P=new Float32Array(N*6),T=new Float32Array(N*2),Sv=new Float32Array(N*2);
  let k=0;
  paths.forEach(([a, b, off]) => {   // bowed quadratic in (u,v), lifted
    const mu=(a.u+b.u)/2-(b.v-a.v)*off,mv=(a.v+b.v)/2+(b.u-a.u)*off;
    let len=0,pu=0,pv=0;
    for (let i=0;i<N;i++,k++) {
      const t=i/(N-1),u=lerp(lerp(a.u,mu,t),lerp(mu,b.u,t),t),v=lerp(lerp(a.v,mv,t),lerp(mv,b.v,t),t);
      if (i) len+=M.hypot(u-pu,v-pv);
      pu=u;pv=v;
      P.set([wx(u),wy(v),field(u,v)*HS+0.022],k*3);
      T[k] = t; Sv[k] = len * 16;   // dash-space arc length
    }
  });
  S.arcN=k;S.arcP=P;S.arcT=T;S.arcS=Sv;
}
function paintArcs() {   // theme pass: arc ink champagne→crimson
  const c=S.col,aA=S.dark?0.62:0.7,AC=new Float32Array(S.arcN*4);
  for (let i=0;i<S.arcN;i++) AC.set([...mixc(c.champ,c.crim,ss(0.25,0.92,S.arcT[i])),aA],i*4);
  BD(S.buf.arcCol,AC);
}
const ringPt=(g,t)=>{const u=g[2]+g[4]*M.cos(t),v=g[3]+g[5]*M.sin(t);return [wx(u),wy(v),field(u,v)*HS+0.02];};
function buildRings() {
  const N=48,P=[];
  RINGS.forEach(g=>{ for (let i=0;i<N;i+=2) P.push(...ringPt(g,i/N*M.PI*2),...ringPt(g,(i+1)/N*M.PI*2));});
  S.ringP=new Float32Array(P);S.ringN=P.length/3;
}
function paintRings() {
  const c=S.col,AC=new Float32Array(S.ringN*4);
  for (let i=0;i<S.ringN;i++) AC.set([...c.teal,0.55],i*4);
  BD(S.buf.ringCol,AC);
}

/* ---------- GL build (also used on context-restore) ---------- */
function buildGL() {
  const gl=S.gl;
  S.prog={ terr: compile(gl,TERR_VS,TERR_FS),line: compile(gl,LINE_VS,LINE_FS),pt: compile(gl,PT_VS,PT_FS) };
  const d = new Uint8Array(TXW * TXH);   // bake field() into a 256×160 R8 texture
  for (let j=0;j<TXH;j++) for (let i=0;i<TXW;i++)
    d[j*TXW+i]=M.max(0,M.min(255,M.round(field(i/(TXW-1),j/(TXH-1))/HMAX*255)));
  const t=S.tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,TXW,TXH,0,gl.RED,gl.UNSIGNED_BYTE,d);
  const TP=(a,b)=>gl.texParameteri(gl.TEXTURE_2D,a,b);
  TP(gl.TEXTURE_MIN_FILTER,gl.LINEAR);TP(gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  TP(gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);TP(gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const vtx = new Float32Array(GN * GM * 3);   // 129×81 grid
  let k=0;
  for (let j=0;j<GM;j++) for (let i=0;i<GN;i++) {
    vtx[k++]=i/(GN-1);vtx[k++]=j/(GM-1);vtx[k++]=field(i/(GN-1),j/(GM-1));
  }
  const idx=new Uint16Array((GN-1)*(GM-1)*6);
  k=0;
  for (let j=0;j<GM-1;j++) for (let i=0;i<GN-1;i++) {
    const a=j*GN+i,b=a+GN;
    idx[k++]=a;idx[k++]=a+1;idx[k++]=b;idx[k++]=a+1;idx[k++]=b+1;idx[k++]=b;
  }
  S.nIdx=idx.length;
  const vbo=data=>{
    const b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    return b;
  };
  if (!S.arcP) buildArcs();
  if (!S.ringP) buildRings();
  const lines=lineGeom(),um=PM/(2*HW),vm=PM/(2*HD),pzu=PZ/HS;
  S.buf={
    terr: vbo(vtx),
    plate: vbo(new Float32Array([-um,-vm,pzu,1+um,-vm,pzu,-um,1+vm,pzu,1+um,1+vm,pzu])),
    linePos: vbo(lines.pos),lineCol: vbo(lines.col),
    bench: vbo(ptData(BENCH,0.012)),disc: vbo(ptData(DISC,0.012)),hard: vbo(ptData(HARD,0.055)),
    probePt: vbo(new Float32Array(4)),probeLn: vbo(new Float32Array(14)),
    arcPos: vbo(S.arcP),arcS: vbo(S.arcS),arcCol: gl.createBuffer(),
    ringPos: vbo(S.ringP),ringCol: gl.createBuffer(),
    terrIdx: gl.createBuffer()
  };
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.buf.terrIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
  S.nLine=lines.pos.length/3;
  paintArcs();
  paintRings();
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
}
function ptData(arr,lift) {
  const d=new Float32Array(arr.length*4);
  arr.forEach((n,i)=>{ d.set([wx(n.u),wy(n.v),nodeZ(n,lift),i*1.7],i*4);});
  return d;
}

/* ---------- camera ---------- */
function updMatrices() {
  const c=S.cam,cp=M.cos(c.pol),tg=S.target;
  S.eye=[tg[0]+c.r*M.sin(c.az)*cp,tg[1]-c.r*M.cos(c.az)*cp,tg[2]+c.r*M.sin(c.pol)];
  mPersp(mP,S.fov,S.W/M.max(1,S.H),0.1,12,S.str);
  mLook(mV,S.eye,tg);
  mMul(mVP,mP,mV);
}
function project(x,y,z) {
  const m=mVP,w=m[3]*x+m[7]*y+m[11]*z+m[15];
  return {
    x: ((m[0]*x+m[4]*y+m[8]*z+m[12])/w*0.5+0.5)*S.W,
    y: (0.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/w*0.5)*S.H,w
  };
}

/* ---------- auto-survey probe (ported) ---------- */
function arnd() { S.auto.seed=(S.auto.seed*1664525+1013904223) >>> 0;return S.auto.seed/4294967296;}
const probeOn=now=>S.visible&&S.entDone&&!S.drag&&S.ex<0&&(now-S.lastUserT>4000);
const fmt=(u,v)=>'CX '+u.toFixed(2)+' · COST '+v.toFixed(2)+' · DIFF '+field(u,v).toFixed(2);
function advanceAuto(now,dt) {
  const a=S.auto;
  if (!probeOn(now)) return;
  if (!a.init) {
    a.init=true;
    a.u=0.25;a.v=0.30;a.tu=a.u;a.tv=a.v;
    a.nextMove=0;a.nextPing=now+2500;
  }
  if (now>a.nextMove) {
    if (arnd() < 0.6) { a.tu = 0.6 + 0.34 * arnd(); a.tv = 0.55 + 0.4 * arnd(); }   // bias hard
    else { a.tu=0.05+0.9*arnd();a.tv=0.05+0.9*arnd();}
    a.nextMove=now+2600+1600*arnd();
  }
  const k = 1 - M.pow(0.955, dt / 33.33);   // the 2D map's 0.045/frame at 30fps
  a.u+=(a.tu-a.u)*k;a.v+=(a.tv-a.v)*k;
  if (now>a.nextPing) {
    spawnScan(a.u,a.v,0.45);
    a.nextPing=now+3200+1800*arnd();
  }
}

/* ---------- odradek click-scans ---------- */
function spawnScan(u,v,w) {
  if (S.scans.length>=4) S.scans.shift();
  S.scans.push({ u,v,t0: (NOW()-S.t0)/1000,w });
}
function stamp(u,v) {
  const el = CE('span');
  el.className = 'hr3d-stamp';
  AH(el);
  el.textContent = fmt(u, v);
  S.labelsEl.appendChild(el);
  const st={ el,u,v,z: field(u,v)*HS+0.06 };
  S.stamps.push(st);
  if (S.stamps.length>4) S.stamps.shift().el.remove();
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
  setTimeout(()=>{
    const i=S.stamps.indexOf(st);
    if (i>=0) S.stamps.splice(i,1);
    el.remove();
  },3100);
}

/* ---------- terrain raycast ---------- */
function pickTerrain(px,py) {
  const e=S.eye,tg=S.target;
  let fx=tg[0]-e[0],fy=tg[1]-e[1],fz=tg[2]-e[2];
  let l=M.hypot(fx,fy,fz);fx/=l;fy/=l;fz/=l;
  let rx = fy, ry = -fx;   // right = fwd × +z
  l=M.hypot(rx,ry)||1;rx/=l;ry/=l;
  const ux = ry * fz, uy = -rx * fz, uz = rx * fy - ry * fx;   // up = right × fwd
  const th=M.tan(FOV0/2),asp=S.W/M.max(1,S.H);
  const nx=(px/S.W*2-1)*th*asp,ny=(1-py/S.H*2)*th;
  let dx=fx+rx*nx+ux*ny,dy=fy+ry*nx+uy*ny,dz=fz+uz*ny;
  l=M.hypot(dx,dy,dz);dx/=l;dy/=l;dz/=l;
  const at=t=>{
    const u=((e[0]+dx*t)/HW+1)/2,v=((e[1]+dy*t)/HD+1)/2;
    return (u<0||u>1||v<0||v>1)?null:{ u,v,d: (e[2]+dz*t)-field(u,v)*HS };
  };
  for (let t=0.2;t<8;t+=0.035) {
    const s=at(t);
    if (s && s.d <= 0) {   // crossed the surface: bisect
      let lo=t-0.035,hi=t;
      for (let i=0;i<12;i++) {
        const m=(lo+hi)/2,sm=at(m);
        if (sm&&sm.d<=0) hi=m;else lo=m;
      }
      return at(hi)||s;
    }
  }
  return null;
}

/* ---------- nodes / labels ---------- */
function eachNode(fn) {
  BENCH.forEach((n, i) => fn(n, 'bench', i, 0.012));
  DISC.forEach((n, i) => fn(n, 'disc', i, 0.012));
  HARD.forEach((n, i) => fn(n, 'hard', i, 0.055));
}
function nearestNode(px,py) {
  let best=null,bd=196;
  S.nodePx.forEach(n=>{
    if (n.w<=0) return;
    const d=(n.x-px) ** 2+(n.y-py) ** 2;
    if (d<bd) { bd=d;best=n;}
  });
  return best;
}
function selectHard(i) {
  S.sel=i;
  if (S.info) {
    S.info.hidden=false;
    S.info.querySelector('strong').textContent = HARD[i].label;
    S.info.querySelector('p').textContent = HARD[i].why;
  }
}
function hoverInfo(cls,n) {   // hover/tap caption; S.ex (examine) owns the panel instead; S.sel keeps a hard click sticky
  if (!S.info || S.ex>=0) return;
  if (!cls) { if (S.sel<0) S.info.hidden=true; return;}
  S.info.hidden=false;
  S.info.classList.remove('hr-examine');
  const c=S.info.querySelector('.hr-cap');
  if (c) c.textContent='';
  S.info.querySelector('strong').textContent=n.label;
  S.info.querySelector('p').textContent=capFor(cls,n)||'';
}
function exEnter(cls,i) {   // examine any node; full ceremony = hard five
  const hd=cls==='hard',n=hd?HARD[i]:cls==='disc'?DISC[i]:BENCH[i],gi=hGi(cls,i,n);
  S.lastUserT=NOW();
  if (!S.holo || gi<0) {   // severed: no hologram
    if (hd) { selectHard(i);return;}
    hoverInfo(cls,n);
    S.sel=-1;spawnScan(n.u,n.v,1);stamp(n.u,n.v);
    return;
  }
  const wasH=S.ex>=14;
  S.ex=gi;S.sel=hd?i:-1;
  S.holo.ex(gi);
  S.fig.classList.toggle('hr3d-exd',hd);
  if (hd) S.fly=[AZ0,0.5,1.55,wx(n.u),wy(n.v),nodeZ(n,0.055)+0.17];   // close-up
  else if (wasH) S.fly=POSE[3];
}
function exExit() {   // Esc / click-away
  if (S.ex<0) return;
  if (S.ex>=14) S.fly=POSE[3];
  S.ex=-1;S.sel=-1;S.lastUserT=NOW();
  if (S.holo) S.holo.unx();
  S.fig.classList.remove('hr3d-exd');
}
const tf3=(el,x,y,shift)=>{
  el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(' + shift + ')';
};
const LBL3 = { 0: [-8, -40], 1: [-10, 46], 3: [-10, 40], 4: [-10, -8] };
function updateLabels(now) {
  if (S.sel >= 0 && S.info && S.info.hidden) S.sel = -1;   // 2D idle retired the why-card
  const px=[],rc=[],mid=project(S.target[0],S.target[1],S.target[2]).w;
  const fade = w => clamp01((w - mid) / 1.1);   // far side of the massif
  const ent = (h, i, stg) => S.entDone ? 1 : ss(0, 0.05, S.clipF - h - i * stg);   // skin-clip ignite
  eachNode((n,cls,i,lift)=>{
    const p=project(wx(n.u),wy(n.v),nodeZ(n,lift));
    px.push({ cls,i,x: p.x,y: p.y,w: p.w });
    const el = S.spans[cls][i], hd = cls === 'hard', o = hd ? (LBL3[i] || [n.dx, n.dy]) : [8, 3];
    tf3(el, p.x + o[0], p.y + o[1] + el._ty, hd ? '-100%,-50%' : '0,-50%');
    const mv = !n.m || (S.overN && S.overN.cls === cls && S.overN.i === i) ||   // minor label: hover pick / examine
      (S.ex >= 0 && S.ex === hGi(cls, i, n)) ? 1 : 0;
    const a=(mv*(1-0.72*fade(p.w))*(p.w>0?1:0) *
      ent(field(n.u, n.v), i, hd ? 0.09 : 0.04)).toFixed(2);
    el.style.opacity=a;
    if (hd) el.classList.toggle('hot', i === S.hot || i === S.sel);
    const w = (hd ? (n.disp || n.label) : n.label).length * 7.7;   // rect: ch·len wide, one line high
    if (+a > 0.02) rc.push({ el,x: p.x+o[0]-(hd?w:0),y: p.y+o[1]-9,w,h: 18,p: hd?1:2 });
  });
  S.nodePx=px;
  if (!S.entT0) return;   // 2D owns the shared captions pre-entrance
  S.zones.forEach(z => {
    if (!z.el) return;
    const p=project(wx(z.u),wy(z.v),field(z.u,z.v)*HS+0.04);
    z.el.style.left = p.x.toFixed(1) + 'px'; z.el.style.top = p.y.toFixed(1) + 'px';
    z.el.style.opacity=(1-0.5*fade(p.w)).toFixed(2);
    const rightAnchored=z.el.classList.contains('hard'),s=(z.el.classList.contains('lit')&&!rightAnchored)?1.22:1,W=z.w*s,H=z.h*s;
    if (p.w>0) rc.push({ x: rightAnchored?p.x-W:p.x-W/2,y: p.y-H/2,w: W,h: H,p: 0 });
  });
  /* de-collide: zone titles anchor; hard, then disc/bench yield; damped */
  rc.sort((a,b)=>a.p-b.p);
  for (let j=0;j<rc.length;j++) {
    const B=rc[j];
    if (!B.el) continue;
    let ty=0;
    for (let i=0;i<j;i++) {
      const A=rc[i],by=B.y+ty;
      if (B.x<A.x+A.w+5&&A.x<B.x+B.w+5&&by<A.y+A.h+3&&A.y<by+B.h+3)
        ty+=by+B.h/2>=A.y+A.h/2?A.y+A.h+3-by:A.y-3-by-B.h;
    }
    B.y+=ty;   // later labels dodge the resolved spot
    B.el._ty+=(ty-B.el._ty)*0.2;
  }
  const ax = (el, x, y, z) => {   // axis captions on projected anchors
    if (!el) return;
    const p=project(x,y,z);
    el.style.left = p.x.toFixed(1) + 'px'; el.style.top = p.y.toFixed(1) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
    el.style.opacity=(S.entDone?0.75*(1-0.85*fade(p.w)):0).toFixed(2);
  };
  ax(S.axisX,wx(0.74),-HD-0.10,PZ);
  ax(S.axisY,-HW-0.12,wy(0.40),PZ);
  const pz=project(-HW,-HD,0.72*HS);
  tf3(S.zcap, pz.x+10, pz.y, '0,-50%');
  const dh=M.abs(S.cam.az-AZ0)+M.abs(S.cam.pol-POL0);   // z caption at hero only
  S.zcap.style.opacity=((S.entDone||S.entT>2.2?0.8:0)*(1-0.85*fade(pz.w))*(1-ss(0.3,0.6,dh))).toFixed(2);
  const pr = probeOn(now) && S.auto.init;   // readout: probe or live hover
  const hv = !pr&&S.pointerOver&&!S.drag&&!S.overN&&!S.overV&&S.entDone&&S.hov;
  S.readout.style.opacity = pr||hv ? '1' : '0';
  if (pr||hv) {
    const a=hv?S.hov:S.auto;
    const p=hv?{ x: S.hx,y: S.hy }:project(wx(a.u),wy(a.v),field(a.u,a.v)*HS+0.02);
    let lx=p.x+16,ly=p.y-14;
    if (lx>S.W-178) lx=p.x-190;
    if (ly<14) ly=p.y+22;
    tf3(S.readout, lx, ly, '0,0');
    if (hv||(S.frame&7)===0) S.readout.textContent=fmt(a.u,a.v);
  }
  S.stamps.forEach(st=>{
    const p=project(wx(st.u),wy(st.v),st.z);
    tf3(st.el, p.x + 14, p.y - 14, '0,-100%');
  });
}

/* ---------- render ---------- */
function draw(now) {
  const gl=S.gl,col=S.col,dark=S.dark,tSec=(now-S.t0)/1000;
  const T=S.prog.terr,L=S.prog.line,dA=1-0.4*S.exDim;   // examine dim
  updMatrices();
  gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
  gl.clearColor(col.bg[0],col.bg[1],col.bg[2],1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  for (let i = 0; i < 4; i++) {   // pack scan uniforms (0 = slot off)
    const s=S.scans[i],on=s&&(tSec-s.t0)<2.2;
    S.scanArr.set(on?[s.u,s.v,s.t0,s.w]:[0,0,0,0],i*4);
  }
  gl.useProgram(T.p);
  MVPU(T);
  gl.uniform3f(T.uDim,HW,HD,HS);gl.uniform2f(T.uTexel,1/TXW,1/TXH);
  gl.uniform3fv(T.uEye,S.eye);gl.uniform3fv(T.uSun,S.sun);
  U3(T.uTeal,col.teal);U3(T.uChamp,col.champ);U3(T.uCrim,col.crim);
  U3(T.uBase,col.bg);U3(T.uFog,col.fog);U3(T.uPlate,col.plate);U3(T.uInk,col.ink);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.tex);gl.uniform1i(T.uH,0);
  F1(T.uHMax,HMAX);F1(T.uGlow,dark?1:0);F1(T.uBodyA,dark?0.66:0.93);
  F1(T.uFillA,0.22);F1(T.uTime,tSec);F1(T.uClip,S.clipF);F1(T.uSkinA,S.skinA);F1(T.uXd,S.exDim*0.4);
  F1(T.uLift,1);F1(T.uPz,PZ+0.004);
  gl.uniform4fv(T.uScan,S.scanArr);
  /* plinth: flat contour map + grid */
  gl.uniform1f(T.uPass,2);
  F1(T.uRA, S.entr ? 0.5 : 0);   // entrance: flat-map ink brightens
  gl.depthMask(true);gl.disable(gl.BLEND);
  bindAttr(T.p, 'aPos', S.buf.plate, 3);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.enable(gl.BLEND);gl.depthMask(false);
  if (S.entr) {   // entrance laminae: lifted isoline pass per level
    gl.uniform1f(T.uPass,3);
    BFP();
    bindAttr(T.p, 'aPos', S.buf.terr, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.buf.terrIdx);
    for (let i=0;i<7;i++) {
      if (S.rA[i]<0.01) continue;
      F1(T.uRL,0.26+i*0.1);F1(T.uRA,S.rA[i]);F1(T.uLift,S.rLift[i]);
      DE();
    }
    F1(T.uLift,1);
  }
  /* rims, axes, z ruler, stems/pylons — staged in */
  gl.useProgram(L.p);
  MVPU(L);F1(L.uDash,0);F1(L.uA,dA);
  gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  bindAttr(L.p, 'aPos', S.buf.linePos, 3);
  bindAttr(L.p, 'aCol', S.buf.lineCol, 4);
  gl.drawArrays(gl.LINES,0,S.entDone?S.nLine:S.entT<1.42?28:S.entT<2.0?44:S.nLine);
  /* terrain body */
  gl.useProgram(T.p);
  gl.uniform1f(T.uPass,0);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(true);
  bindAttr(T.p, 'aPos', S.buf.terr, 3);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.buf.terrIdx);
  DE();
  if (dark) {   // hololith glow skin — dark theme only, additive, same depth
    gl.uniform1f(T.uPass,1);
    gl.depthMask(false);gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.ONE,gl.ONE);
    DE();
    gl.depthFunc(gl.LESS);
  }
  gl.useProgram(L.p);
  MVPU(L);
  gl.depthMask(false);
  if (S.entDone) {   // expedition arcs: dashes march upward
    BFP();
    F1(L.uDash,1);F1(L.uTime,tSec*0.5);
    bindAttr(L.p, 'aPos', S.buf.arcPos, 3);
    bindAttr(L.p, 'aCol', S.buf.arcCol, 4);
    bindAttr(L.p, 'aS', S.buf.arcS, 1);
    gl.drawArrays(gl.LINE_STRIP,0,44);gl.drawArrays(gl.LINE_STRIP,44,44);
    F1(L.uDash,0);
    const sl = AL(L.p, 'aS');
    gl.disableVertexAttribArray(sl);gl.vertexAttrib1f(sl,0);
    bindAttr(L.p, 'aPos', S.buf.ringPos, 3);
    bindAttr(L.p, 'aCol', S.buf.ringCol, 4);
    gl.drawArrays(gl.LINES,0,S.ringN);
  }
  if (probeOn(now) && S.auto.init) {   // survey probe: scan column + surface reticle
    const a=S.auto,hz=field(a.u,a.v)*HS,X=wx(a.u),Y=wy(a.v);
    const cA=dark?0.5:0.55,c=col.crim;
    BFP();
    SCR.set([X,Y,PZ,X,Y,hz+0.30]);BD(S.buf.probeLn,SCR);
    bindAttr(L.p, 'aPos', S.buf.probeLn, 3);
    const lc = AL(L.p, 'aCol');
    gl.disableVertexAttribArray(lc);
    gl.vertexAttrib4f(lc,c[0]*cA,c[1]*cA,c[2]*cA,cA);
    gl.drawArrays(gl.LINES,0,2);
    SCR.set([X,Y,hz+0.008,0]);BD(S.buf.probePt,SCR);
    drawPoints(S.buf.probePt,1,3,22,c,0.85,0);
  }
  /* node classes: teal circles, champagne diamonds, crimson beacons */
  drawPoints(S.buf.bench,BENCH.length,0,9,col.teal,0.95*dA,0.04);
  drawPoints(S.buf.disc,DISC.length,1,11,col.champ,0.95*dA,0.04);
  drawPoints(S.buf.hard,HARD.length,2,30,col.crim,dA,0.09);
  if (S.holo) S.holo.d(tSec);
  if (S.vex) { try { S.vex.d(tSec);} catch (e) { S.vex=null;} }   // severed on first fault
  gl.depthMask(true);
}
function drawPoints(buf,n,shape,size,c,alpha,stg) {
  const gl=S.gl,Q=S.prog.pt;
  gl.useProgram(Q.p);
  MVPU(Q);
  F1(Q.uSize,size);F1(Q.uTime,(S.nowMs-S.t0)/1000);F1(Q.uShape,shape);
  F1(Q.uDPR,S.dpr);F1(Q.uA,alpha);F1(Q.uGlow,S.dark?1:0);
  F1(Q.uClip, S.clipF); F1(Q.uStg, stg);   // entrance ignite stagger
  gl.uniform1i(Q.uHot,shape===2?S.hot:-1);
  gl.uniform1i(Q.uSel,shape===2?S.sel:-1);
  U3(Q.uCol,c);
  gl.depthMask(false);
  BFP();
  BB(buf);
  const lp = AL(Q.p, 'aP'), lh = AL(Q.p, 'aPh');
  gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,3,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(lh);gl.vertexAttribPointer(lh,1,gl.FLOAT,false,16,12);
  gl.drawArrays(gl.POINTS,0,n);
}
function bindAttr(p,name,buf,size) {
  const gl=S.gl,l=AL(p,name);
  if (l<0) return;
  BB(buf);
  gl.enableVertexAttribArray(l);
  gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);
}

/* ---------- entrance: the contours lift ---------- */
function entCam(eT) {   // camera + skin clip + ring lifts during the entrance
  const c=S.cam,e=ss(0,1,(eT-0.32)/1.5),l=ss(0,1,(eT-1.30)/1.15);
  c.pol=lerp(POLE,POL0,e);S.fov=lerp(FOVE,FOV0,e);
  S.str = lerp(HD * M.sin(POLE) * S.W / (M.max(1, S.H) * HW), 1, e);   // flat start matches the stretched 2D map
  c.az=lerp(0,AZ0,l);c.r=lerp(ENT_R,R0,l);c.azv=c.polv=0;
  S.target=[TG0[0]*l,TG0[1]*l,TG0[2]*l];
  const sk = (eT - 1.42) / 0.95;   // skin sweep: lowlands → past the summit
  S.clipF=ss(0,1,sk)*1.02;
  S.skinA=ss(0,0.08,sk)*(1-ss(0.9,1,sk));
  const aB=S.dark?1.25:0.95,fin=ss(0,0.25,eT);
  for (let i = 0; i < 7; i++) {   // rings rise lowest-first, fade under the skin
    S.rLift[i]=eoExpo(clamp01((eT-0.42-i*0.075)/0.80));
    S.rA[i]=aB*fin*(1-ss(0,0.06,S.clipF-(0.26+i*0.1)));
  }
}

/* ---------- frame loop ---------- */
function tick(now) {
  if (!S||!S.running) return;
  S.raf=0;
  const dt=M.min(100,now-(S.lastT||now));
  S.lastT=now;S.nowMs=now;S.frame++;
  const c=S.cam;
  if (S.entr || S.showAt) {   // entrance owns the camera; input fast-forwards it
    const eT=S.entr?(now-S.entT0)/1000:0;
    entCam(eT);
    if (S.entr) {
      S.entT=eT;
      if (eT>=ENT_END) { S.entr=false;S.entDone=true;S.entT=9;S.clipF=9;S.skinA=0;S.lastUserT=now;loadHolo();}
    }
  } else {
    if (!S.drag) { c.az += c.azv; c.pol += c.polv; c.azv *= 0.9; c.polv *= 0.9; }   // damped inertia
    if (S.fly) {   // examine/return flight; a drag cancels it
      const p=S.fly,k=1-M.exp(-dt/380);
      let d=M.abs(p[0]-c.az)+M.abs(p[1]-c.pol)+M.abs(p[2]-c.r);
      c.az+=(p[0]-c.az)*k;c.pol+=(p[1]-c.pol)*k;c.r+=(p[2]-c.r)*k;
      c.azv=c.polv=0;
      for (let i=0;i<3;i++) { d+=M.abs(p[3+i]-S.target[i]);S.target[i]+=(p[3+i]-S.target[i])*k;}
      if (d<0.005) S.fly=null;
    } else if (probeOn(now)&&!S.pointerOver) {   // tour camera: never moves under a parked cursor
      let z=-1;
      for (let i = 0; i < 3; i++) if (S.zones[i].el && S.zones[i].el.classList.contains('lit')) z = i;
      const p=POSE[z<0?3:z],k=1-M.exp(-dt/380);
      c.az+=(p[0]-c.az)*k;c.pol+=(p[1]-c.pol)*k;c.r+=(p[2]-c.r)*k;
      c.azv=c.polv=0;
      for (let i=0;i<3;i++) S.target[i]+=(p[3+i]-S.target[i])*k;
    }
    c.az = M.min(AZ0 + 0.96, M.max(AZ0 - 0.96, c.az));   // ±55° around the hero pose
    c.pol = M.min(1.187, M.max(0.314, c.pol));   // 18°–68°
    c.r=M.min(R0*1.5,M.max(lerp(R0*0.75,0.9,S.exDim),c.r));   // examine relaxes the close clamp
  }
  S.exDim+=((S.ex>=14?1:0)-S.exDim)*(1-M.exp(-dt/240));   // hard-five ceremony dim
  advanceAuto(now,dt);
  draw(now);
  if (!S.shown) {   // first good frame → schedule the reveal
    if (S.gl.getError()!==S.gl.NO_ERROR) { teardown();return;}
    S.shown=true;
    S.showAt=now+(window.__HR3D_FAST?250:1600);   // same-session re-entry skips the hold
    try { sessionStorage.setItem('hr3d-played','1');} catch (e) {}
  }
  if (S.showAt&&now>=S.showAt) {
    S.showAt=0;S.entr=true;S.entT0=window.__HR3D_FAST?-1e9:now;S.entT=0;
    S.fig.classList.add('hr3d-on');
  }
  updateLabels(now);
  S.raf=RAF(tick);
}
function loadHolo() {   // strategium holograms + vex: separate hulls, failure = silent no-op
  const HB=BENCH.filter(n=>n.hi!=null).sort((a,b)=>a.hi-b.hi);
  const c={ B: HB,D: DISC,H: HARD,wx,wy,field,HS,mVP };
  ['holo','vex'].forEach(n=>import('/assets/js/hard-region-'+n+'.js')
    .then(m=>{ try { if (S&&S.entDone&&!S[n]) S[n]=m.mk(S,c);} catch (e) {} })
    .catch(()=>{}));
}
function setRunning(on) {
  if (!S) return;
  on=on&&S.visible&&!document.hidden&&!S.lost;
  if (on===S.running) return;
  S.running=on;
  if (on&&!S.raf) { S.lastT=0;S.raf=RAF(tick);}
  if (!on&&S.raf) { cancelAnimationFrame(S.raf);S.raf=0;}
}

/* ---------- interaction ---------- */
function engage() {
  if (S.eng) return;
  S.eng=true;
  S.fig.classList.add('hr3d-engaged');
  if (S.head) S.head.textContent = 'drag to orbit · scroll to zoom';
}
function disengage() {
  if (!S||!S.eng) return;
  S.eng=false;
  S.fig.classList.remove('hr3d-engaged');
  if (S.head) S.head.textContent=S.headText;
}
function setHot(i) { S.hot = i; }   // label class follows in updateLabels
function bindEvents() {
  const cv=S.canvas,fig=S.fig;
  const on=(t,ev,fn,opts)=>{
    t.addEventListener(ev,fn,opts);
    S.unbind.push(()=>t.removeEventListener(ev,fn,opts));
  };
  const xy=e=>{
    const r=cv.getBoundingClientRect();
    return { x: e.clientX-r.left,y: e.clientY-r.top };
  };
  on(fig, 'pointerenter', () => { S.pointerOver = true; });
  on(fig, 'pointerleave', () => {
    S.pointerOver=false;S.lastUserT=NOW();S.overN=null;
    disengage();setHot(-1);hoverInfo(null,null);
  });
  on(fig, 'pointerdown', () => engage(), true);   // first pointerdown engages wheel
  on(cv, 'pointerdown', e => {
    e.stopPropagation();   // keep the 2D map's click handler out
    if (e.button!==0) return;
    if (S.entr) S.entT0 = -1e9;   // input fast-forwards the entrance
    S.lastUserT=NOW();S.fly=null;   // hands-on stops flight
    S.drag=true;S.moved=0;S.downT=NOW();
    S.px=e.clientX;S.py=e.clientY;
    cv.style.cursor = '';
    cv.classList.add('hr3d-drag');
    try { cv.setPointerCapture(e.pointerId);} catch (err) {}
  });
  on(cv, 'pointermove', e => {
    if (S.drag) {
      const dx=e.clientX-S.px,dy=e.clientY-S.py;
      S.px=e.clientX;S.py=e.clientY;
      S.moved+=M.abs(dx)+M.abs(dy);
      S.cam.az-=dx*0.006;S.cam.pol+=dy*0.006;
      S.cam.azv=-dx*0.0027;S.cam.polv=dy*0.0027;
      S.lastUserT=NOW();
      return;
    }
    const p=xy(e),nn=nearestNode(p.x,p.y);
    setHot(nn && nn.cls === 'hard' ? nn.i : -1);
    S.overV=!!(S.vex&&S.vex.pk(p.x,p.y,S.hov));
    cv.style.cursor = nn||S.overV ? 'pointer' : '';
    S.lastUserT=NOW();S.overN=nn;S.hx=p.x;S.hy=p.y;   // hover = live measurement
    hoverInfo(nn?nn.cls:null, nn?nodeOf(nn.cls,nn.i):null);
    if (!nn&&(S.mvN=!S.mvN)) S.hov=pickTerrain(p.x,p.y);
  });
  on(cv, 'pointerup', e => {
    if (!S.drag) return;
    S.drag=false;
    cv.classList.remove('hr3d-drag');
    S.lastUserT=NOW();
    if (S.moved>=5||NOW()-S.downT>500) return;
    const p = xy(e), hit = pickTerrain(p.x, p.y);   // click: vex → node examine → odradek scan
    if (S.vex&&S.vex.pk(p.x,p.y,hit)) { S.vex.go();return;}
    const nn=nearestNode(p.x,p.y);
    if (nn) { exEnter(nn.cls,nn.i);return;}
    if (S.ex>=0) exExit();
    else { if (S.info) S.info.hidden=true;S.sel=-1;}
    if (hit) { S.hov=hit;spawnScan(hit.u,hit.v,1);stamp(hit.u,hit.v);if (S.vex) S.vex.tp(hit.u,hit.v);}
  });
  on(cv, 'pointercancel', () => { S.drag = false; cv.classList.remove('hr3d-drag'); });
  on(fig, 'wheel', e => {
    if (!S.eng) return;   // page scrolls until the figure is engaged
    e.preventDefault();
    S.fly=null;S.cam.r*=1+M.max(-80,M.min(80,e.deltaY))*0.0016;
    S.lastUserT=NOW();
  },{ passive: false });
  on(window, 'keydown', e => {   // Esc: examine first (capture beats splash), then wheel
    if (e.key!=='Escape') return;
    if (S.ex>=0) { exExit();e.stopPropagation();} else disengage();
  },true);
  on(document, 'visibilitychange', () => setRunning(true));
}

/* ---------- DOM ---------- */
function buildDOM() {
  const fig=S.fig;
  const cv = S.canvas = CE('canvas');
  cv.className = 'hr3d-canvas';
  AH(cv);
  const base = document.getElementById('hr-canvas');
  (base&&base.nextSibling)?fig.insertBefore(cv,base.nextSibling):fig.appendChild(cv);
  const lay = S.labelsEl = CE('div');
  lay.className = 'hr3d-labels';
  S.spans={ bench: [],disc: [],hard: [] };
  const mk=(n,cls)=>{
    const el = CE('span');
    el.className = 'hr3d-n-' + cls + (n.s?' hr3d-n-sec':'');
    el.textContent = cls==='hard' ? (n.disp||n.label) : n.label;
    el._ty=0;   // damped de-collision offset
    const i=S.spans[cls].length;
    if (cls === 'hard') {
      el.tabIndex = 0;   // Tab cycles the five hard systems
      el.addEventListener('focus', () => exEnter('hard', i));
      el.addEventListener('click', e => { e.stopPropagation(); exEnter('hard', i); });
      el.addEventListener('mouseenter', () => hoverInfo('hard', HARD[i]));
      el.addEventListener('mouseleave', () => hoverInfo(null, null));
    } else {
      AH(el);
      el.addEventListener('mouseenter', () => hoverInfo(cls, nodeOf(cls, i)));
      el.addEventListener('mouseleave', () => hoverInfo(null, null));
    }
    lay.appendChild(el);
    S.spans[cls].push(el);
  };
  BENCH.forEach(n => mk(n, 'bench'));
  DISC.forEach(n => mk(n, 'disc'));
  HARD.forEach(n => mk(n, 'hard'));
  const sp=(cls,txt)=>{
    const el = CE('span');
    el.className=cls;
    AH(el);
    if (txt) el.textContent=txt;
    lay.appendChild(el);
    return el;
  };
  S.readout = sp('hr3d-readout');
  S.readout.style.opacity = '0';
  S.zcap = sp('hr3d-zcap', 'z: discovery difficulty');
  fig.appendChild(lay);
  /* save caption styles; then drive projected anchors */
  S.saved=[];
  const keep = el => { if (el) S.saved.push([el, el.getAttribute('style')]); return el; };
  const zEls = fig.querySelectorAll('.hr-label');
  S.zones=[   // w/h: de-collision box, anchored clear of the cluster
    { u: 0.26,v: 0.52,w: 210,h: 26,el: keep(zEls[0]) },
    { u: 0.32,v: 0.62,w: 220,h: 26,el: keep(zEls[1]) },
    { u: 0.965,v: 1.17,w: 260,h: 34,el: keep(zEls[2]) }];
  RINGS.forEach(g=>{   // ring caption
    const el=sp('hr3d-ring-lbl', g[0]);
    el.removeAttribute('aria-hidden');el.tabIndex=0;
    const show=()=>hoverInfo('ring',{ label: g[0],why: CAP&&CAP.RING_CAP[g[0]] });
    const hide=()=>{ if (!S.overN) hoverInfo(null,null);};
    el.addEventListener('mouseenter',show);el.addEventListener('focus',show);
    el.addEventListener('mouseleave',hide);el.addEventListener('blur',hide);
    S.zones.push({ u: g[2],v: g[3]+g[1]*(g[5]+0.03),w: 150,h: 24,el });
  });
  S.axisX = keep(fig.querySelector('.hr-axis-x'));
  S.axisY = keep(fig.querySelector('.hr-axis-y'));
  S.head = fig.querySelector('.hr-head');
  S.headText = S.head ? S.head.textContent : '';
  S.info = document.getElementById('hr-info');
  S.hadTab = fig.hasAttribute('tabindex');
  if (!S.hadTab) fig.tabIndex=0;
}
function resize() {
  if (!S) return;
  const r=S.fig.getBoundingClientRect();
  S.W=M.max(1,M.round(r.width));S.H=M.max(1,M.round(r.height));
  S.dpr=M.min(window.devicePixelRatio||1,1.5);
  S.canvas.width=M.round(S.W*S.dpr);S.canvas.height=M.round(S.H*S.dpr);
}
function bindObservers() {
  S.io=new IntersectionObserver(en=>{ S.visible=en[0].isIntersecting;setRunning(true);});
  S.io.observe(S.fig);
  S.ro = new ResizeObserver(resize);   // RO exists wherever WebGL2 does
  S.ro.observe(S.fig);
  const watch=(q,fn)=>{
    const mq=matchMedia(q);
    if (!mq.addEventListener) return;
    mq.addEventListener('change', fn);
    S.unbind.push(() => mq.removeEventListener('change', fn));
  };
  watch('(prefers-color-scheme: dark)', readColors);
  watch('(prefers-reduced-motion: reduce)', e => { if (e.matches) teardown(); });
}

/* ---------- lifecycle ---------- */
export function init(fig) {
  if (S||!fig||fig.__hr3d) return;
  fig.__hr3d=true;
  try {
    const l=M.hypot(-0.42,-0.55,0.72);
    S={
      fig,unbind: [],stamps: [],scans: [],scanArr: new Float32Array(16),
      nodePx: [],hot: -1,sel: -1,ex: -1,exDim: 0,fly: null,frame: 0,lost: false,
      cam: { az: AZ0,pol: POL0,r: R0,azv: 0,polv: 0 },
      target: TG0.slice(),fov: FOV0,str: 1,clipF: 0,skinA: 0,
      rLift: [0,0,0,0,0,0,0],rA: [0,0,0,0,0,0,0],entT: 0,
      sun: [-0.42/l,-0.55/l,0.72/l],
      auto: { seed: 7,init: false,u: 0,v: 0,tu: 0,tv: 0,nextMove: 0,nextPing: 0 },
      lastUserT: -1e9,pointerOver: false,drag: false,eng: false,
      visible: false,running: false,shown: false,
      t0: NOW(),nowMs: NOW()
    };
    buildDOM();
    resize();
    const gl = S.canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'low-power' });
    if (!gl) throw new Error('no webgl2');
    S.gl=gl;
    readColors();
    buildGL();
    const onLost=e=>{ e.preventDefault();S.lost=true;setRunning(false);};
    const onRestored=()=>{
      if (!S) return;
      if (S.restoredOnce) { teardown(); return; }   // one restore attempt only
      S.restoredOnce=true;
      try { buildGL();S.holo=S.vex=null;loadHolo();S.lost=false;setRunning(true);} catch (e) { teardown();}
    };
    const CV=S.canvas,AE=(t,f)=>{ CV.addEventListener(t,f);S.unbind.push(()=>CV.removeEventListener(t,f));};
    AE('webglcontextlost',onLost);AE('webglcontextrestored',onRestored);
    bindEvents();
    bindObservers();
  } catch (e) {
    console.warn('hr3d: falling back to 2D —', e && e.message);
    teardown();
  }
}
export function destroy() { teardown();}
function teardown() {
  if (!S) return;
  const st=S;S=null;
  try {
    if (st.raf) cancelAnimationFrame(st.raf);
    st.unbind.forEach(fn=>{ try { fn();} catch (e) {} });
    if (st.io) st.io.disconnect();
    if (st.ro) st.ro.disconnect();
    st.fig.classList.remove('hr3d-on', 'hr3d-engaged', 'hr3d-exd');
    if (st.head&&st.headText) st.head.textContent=st.headText;
    (st.saved || []).forEach(sv => {   // restore the 2D layout untouched
      sv[1] === null ? sv[0].removeAttribute('style') : sv[0].setAttribute('style', sv[1]);
    });
    if (!st.hadTab) st.fig.removeAttribute('tabindex');
    if (st.gl&&!st.gl.isContextLost()) {
      const gl=st.gl;
      if (st.holo) st.holo.x();
      if (st.vex) st.vex.x();
      Object.keys(st.buf||{}).forEach(k=>gl.deleteBuffer(st.buf[k]));
      Object.keys(st.prog||{}).forEach(k=>gl.deleteProgram(st.prog[k].p));
      if (st.tex) gl.deleteTexture(st.tex);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
    if (st.labelsEl) st.labelsEl.remove();
    if (st.canvas) st.canvas.remove();
    st.fig.__hr3d=false;
  } catch (e) { /* the 2D map is already whole underneath */ }
}
