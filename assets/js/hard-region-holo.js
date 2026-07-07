/* hard-region-holo.js — strategium holograms: each node of the hard-region map
   projects its real structure (baked PubChem/parametric data in hr-holo-data.js;
   device assemblies generated parametrically below). Monochrome zone-hue light,
   additive in dark theme, plotted ink in light. Hard five always on; bench/disc
   holograms appear only while their zone is tour-lit or the node is hover-picked.
   Fully severable: imported by hard-region-3d.js after the entrance; any failure
   here leaves the terrain untouched. Two draw calls total (atoms, bonds).
   H2 examine mode: ex(i)/unx() — hologram enlarges (hard ×3.5, bench/disc ×2)
   over a base ring with a respawn stutter; panel captions + roster copy live
   here. Camera flight / dim easing / exit routing stay in the main module. */
import { D } from './hr-holo-data.js';
const M=Math,N=19,NR=N+1;   // +1 uniform slot: the examine base ring
/* node order = main module's BENCH(8) + DISC(6) + HARD(5) */
const KEYS=['bz','nacl','cu111','caf','spn','heu','asp','si',
  'sto','mof','fcc','sod','mos2','lco','@mea','@ely','@fet','pfoa','@core'];
const TWEAK={ bz: 0.8,caf: 0.95,asp: 0.95,mof: 1.1,sod: 1.05,'@mea': 1.1,'@ely': 1.1,'@fet': 1.05 };
const SC=[0.036,0.036,0.048],RISE=[0.05,0.05,0.036],LIFT=[0.012,0.012,0.055];   // per zone class
/* examine panel data — node order above. CAP: structure caption (real data);
   CP: roster-spec one-line copy, verbatim (bench 8 + disc 6; hard use .why) */
const CAP=['C₆H₆ · benzene · PubChem 241','NaCl · Fm3̄m · rock salt','Cu(111) + *CO',
  'C₈H₁₀N₄O₂ · caffeine · PubChem 2519','MgAl₂O₄ · Fd3̄m · spinel','Cu₂MnAl · L2₁ Heusler',
  'C₉H₈O₄ · aspirin · PubChem 2244','Si · Fd3̄m · diamond cubic',
  'SrTiO₃ · Pm3̄m · ABX₃','MOF-5 · Zn₄O(BDC)₃','fcc supercell · random occupancy',
  'sodalite · SOD cage','MoS₂ · 1H monolayer','LiCoO₂ · R3̄m layered',
  'MEA · membrane | catalyst | GDL','MEA · O₂ evolution · exploded stack',
  'FET · source | drain | channel + probe','PFOA · C₈HF₁₅O₂ · helical −CF₂− backbone',
  'core–shell nanoparticle · ligand shell'];
const CP=['134k small organic molecules, 13 DFT properties each. the first benchmark every molecular model meets.',
  '150k+ inorganic crystals with computed properties, one API call away. the reference atlas of crystal space.',
  '1.3M DFT relaxations of adsorbate–catalyst surfaces. adsorption ML at industrial scale.',
  '119M compounds, one download away. T³ screens 123M of these against device twins — raw material, not the bottleneck.',
  '3.5M computed compounds and the prototype encyclopedia. crystal space, enumerated.',
  '1.2M DFT formation energies. thermodynamic stability is a table lookup.',
  'DFT trajectories of ten small molecules — the standard MLIP training set. potentials arrive pre-benchmarked here.',
  '13 standard tasks for crystal property prediction; leaderboards near saturation. progress here is measured, not discovered.',
  'high-throughput synthesis and large optoelectronic datasets. the screening playbook is established — no longer the hard part.',
  'hundreds of thousands of structures in CoRE-MOF and hMOF; GCMC screening is routine. a vast design space with a charted pipeline.',
  'CALPHAD plus high-throughput DFT settle phase stability at scale. composition space yields to enumeration.',
  '~250 known frameworks, millions hypothesized, one curated atlas (IZA). templated synthesis is codified — the first step out of the lowlands.',
  'C2DB and friends catalog thousands of monolayers. the isolated flake is charted; the device around it is not.',
  'decades of curated electrochemistry, routine HT-DFT screening. intercalation chemistry has its playbook.'];

/* ---------- shaders: slow rotation about the vertical axis + faint bob;
   per-structure anchor/scale in uT[] (static), hue×alpha in uC[] (per frame) ---------- */
const VS=pt=>`#version 300 es
in vec3 aP;in vec2 aM;uniform mat4 uVP;uniform vec4 uT[${NR}],uC[${NR}];
uniform float uTm,uK;out vec4 vC;
void main(){
 int i=int(aM.x+.5);vec4 t=uT[i],c=uC[i];
 float g=uTm*.785+float(i)*2.4,cg=cos(g),sg=sin(g);
 vec3 p=vec3(aP.x*cg-aP.y*sg,aP.x*sg+aP.y*cg,aP.z)*t.w;
 p.z+=t.w*.05*sin(uTm*.8+float(i)*1.3);
 gl_Position=uVP*vec4(t.xyz+p,1.);
 float k=.6+.4*aM.y/3.;
 vC=vec4(c.rgb*${pt?'k':'.92'},c.a${pt?'*(.5+.5*k)':''});
 ${pt?'gl_PointSize=clamp((.11+.065*aM.y)*t.w*uK/max(gl_Position.w,.3),1.4,26.)*step(.003,c.a);':''}
}`;
const FS_PT=`#version 300 es
precision mediump float;in vec4 vC;uniform float uGl;out vec4 o;
void main(){
 vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);
 float a=1.-smoothstep(.32,.8,r);
 if(uGl>.5)a=a*.62+exp(-r*3.4)*.34;
 a*=vC.a;if(a<.006)discard;o=vec4(vC.rgb*a,a);}`;
const FS_LN=`#version 300 es
precision mediump float;in vec4 vC;uniform float uGl;out vec4 o;
void main(){
 float a=vC.a*(uGl>.5?.48:.85);
 if(a<.006)discard;o=vec4(vC.rgb*a,a);}`;

/* ---------- parametric device assemblies (normalized to unit radius below) ---------- */
function box(L,c,h) {   // wireframe box → 12 segments
  const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
    .map(s=>[c[0]+s[0]*h[0],c[1]+s[1]*h[1],c[2]+s[2]*h[2]]);
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
    .forEach(e=>L.push(v[e[0]],v[e[1]]));
}
function rect(L,z,hx,hy) {   // flat plate → 4 segments
  const v=[[-hx,-hy,z],[hx,-hy,z],[hx,hy,z],[-hx,hy,z]];
  for (let k=0;k<4;k++) L.push(v[k],v[(k+1)%4]);
}
function mea() {   // exploded MEA: GDL / catalyst layer / membrane / CL / GDL
  const A=[],L=[];
  box(L,[0,0,-0.62],[0.72,0.52,0.13]);box(L,[0,0,0.62],[0.72,0.52,0.13]);
  rect(L,-0.3,0.6,0.44);rect(L,0.3,0.6,0.44);
  box(L,[0,0,0],[0.84,0.6,0.045]);                      // membrane, proud edges
  for (let k=0;k<6;k++)                                 // catalyst dots on both CLs
    A.push([-0.45+k*0.18,k%2?-0.2:0.22,k%2?-0.3:0.3,2]);
  return { A,L };
}
function ely() {   // electrolyzer variant: same stack + O2 bubbles rising
  const g=mea();
  [[0.3,0.2,0.9,1],[-0.25,-0.15,1.0,0],[0.05,-0.3,1.12,1],[-0.4,0.25,1.2,0],[0.18,0.05,1.3,0]]
    .forEach(b=>g.A.push(b));
  return g;
}
function fet() {   // chip: substrate, source/drain pads, channel, probe molecule
  const A=[],L=[];
  box(L,[0,0,-0.5],[0.9,0.62,0.16]);
  box(L,[-0.58,0,-0.2],[0.26,0.4,0.13]);box(L,[0.58,0,-0.2],[0.26,0.4,0.13]);
  L.push([-0.32,-0.14,-0.24],[0.32,-0.14,-0.24],[-0.32,0.14,-0.24],[0.32,0.14,-0.24]);
  const pr=[[0,0,0.28,3],[0.16,0.08,0.44,1],[-0.14,0.1,0.42,1],[0,-0.16,0.46,1]];
  pr.forEach(p=>A.push(p));
  for (let k=1;k<4;k++) L.push(pr[0].slice(0,3),pr[k].slice(0,3));
  L.push([0,0,0.28],[0,0,-0.2]);                        // probe → channel
  return { A,L };
}
function core() {   // core–shell nanoparticle + ligand shell
  const A=[[0,0,0,3]],L=[],r=0.62,t=(1+M.sqrt(5))/2;
  [[0,1,t],[0,-1,t],[0,1,-t],[0,-1,-t],[1,t,0],[-1,t,0],[1,-t,0],[-1,-t,0],[t,0,1],[-t,0,1],[t,0,-1],[-t,0,-1]]
    .forEach(v=>{ const s=0.3/M.hypot(v[0],v[1],v[2]);A.push([v[0]*s,v[1]*s,v[2]*s,2]);});
  for (let ax=0;ax<3;ax++) for (let k=0;k<18;k++) {   // 3 orthogonal shell rings
    const p=j=>{ const a=(k+j)/18*2*M.PI,u=M.cos(a)*r,v=M.sin(a)*r;
      return ax<1?[u,v,0]:ax<2?[u,0,v]:[0,u,v];};
    L.push(p(0),p(1));
  }
  for (let k=0;k<8;k++) {   // ligands
    const a=k/8*2*M.PI,z=k%2?0.55:-0.55,q=M.sqrt(1-z*z);
    const d=[M.cos(a)*q,M.sin(a)*q,z];
    L.push(d.map(x=>x*r),d.map(x=>x*0.92));A.push([d[0]*0.97,d[1]*0.97,d[2]*0.97,0]);
  }
  return { A,L };
}
const DEV={ '@mea': mea,'@ely': ely,'@fet': fet,'@core': core };

/* ---------- structure geometry: decode baked (Int8 ×120) or build device ---------- */
function b64(s) {
  const a=atob(s),n=a.length,o=new Float32Array(n);
  for (let i=0;i<n;i++) { const c=a.charCodeAt(i);o[i]=c>127?c-256:c;}
  return o;
}
function structGeom(key) {
  if (key[0] === '@') {
    const g=DEV[key](),r=1e-6,rr=p=>M.hypot(p[0],p[1],p[2]);
    const mr=M.max(...g.A.map(rr),...g.L.map(rr),r);
    g.A.forEach(p=>{ p[0]/=mr;p[1]/=mr;p[2]/=mr;});
    g.L.forEach(p=>{ p[0]/=mr;p[1]/=mr;p[2]/=mr;});
    return g;
  }
  const [p,b,s]=D[key].split('|'),P=b64(p),Bd=b64(b),A=[],L=[];
  for (let i=0;i<s.length;i++) A.push([P[i*3]/120,P[i*3+1]/120,P[i*3+2]/120,+s[i]]);
  for (let i=0;i<Bd.length;i+=2) {
    const u=A[Bd[i]<0?Bd[i]+256:Bd[i]],v=A[Bd[i+1]<0?Bd[i+1]+256:Bd[i+1]];
    L.push(u,v);
  }
  return { A,L };
}

/* ---------- module handle ---------- */
export function mk(S,ctx) {
  const gl=S.gl,F=(l,v)=>gl.uniform1f(l,v);
  const sh=(ty,src)=>{
    const s=gl.createShader(ty);
    gl.shaderSource(s,src);gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('holo shader');
    return s;
  };
  const prog=(vs,fs)=>{
    const p=gl.createProgram();
    gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('holo link');
    const o={ p };
    ['uVP','uT','uC','uTm','uK','uGl'].forEach(n=>o[n]=gl.getUniformLocation(p,n));
    return o;
  };
  const PT=prog(VS(1),FS_PT),LN=prog(VS(0),FS_LN);
  /* concatenate all 19 structures into one atom VBO + one bond VBO */
  const nodes=[...ctx.B,...ctx.D,...ctx.H];
  const uT=new Float32Array(NR*4),va=[],vl=[];
  nodes.forEach((nd,i)=>{
    const zc=i<8?0:i<14?1:2,key=KEYS[i];
    const g=structGeom(key),sc=SC[zc]*(TWEAK[key]||1);
    uT.set([ctx.wx(nd.u),ctx.wy(nd.v),
      ctx.field(nd.u,nd.v)*ctx.HS+LIFT[zc]+RISE[zc]+sc,sc],i*4);
    g.A.forEach(a=>va.push(a[0],a[1],a[2],i,a[3]));
    g.L.forEach(p=>vl.push(p[0],p[1],p[2],i));
  });
  for (let k=0;k<30;k++) {   // examine base ring: unit circle in slot N, tracks the examined node
    const r=j=>{ const a=(k+j)/30*2*M.PI;vl.push(M.cos(a),M.sin(a),-0.86,N);};
    r(0);r(1);
  }
  const buf=d=>{
    const b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);
    return b;
  };
  const bA=buf(va),bL=buf(vl),nA=va.length/5,nL=vl.length/4;
  gl.useProgram(PT.p);gl.uniform4fv(PT.uT,uT);
  gl.useProgram(LN.p);gl.uniform4fv(LN.uT,uT);
  const f=new Float32Array(N),born=new Float32Array(N),uC=new Float32Array(NR*4);
  const uT0=uT.slice(),exK=new Float32Array(N).fill(1);   // examine enlarge factors
  let lt=0,ringA=0,lq=14;
  const attr=(P,name,size,stride,off)=>{
    const l=gl.getAttribLocation(P.p,name);
    gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,stride,off);
  };
  return {
    d(t) {   // one CPU pass (fades/flicker/examine ease) + 2 draw calls, inside the main draw()
      const dt=M.min(0.1,(t-lt)||0);lt=t;
      const lit=z=>{ const e=S.zones[z]&&S.zones[z].el;return !!e&&e.classList.contains('lit');};
      const l0=lit(0),l1=lit(1),col=[S.col.teal,S.col.champ,S.col.crim];
      const ov=S.overN,oi=ov?(ov.cls==='bench'?ov.i:ov.cls==='disc'?8+ov.i:14+ov.i):-1;
      const q=S.ex>=0?S.ex:-1,xd=S.exDim||0,ek=1-M.exp(-dt*8);
      if (q>=0) lq=q;
      ringA+=((q>=0?0.55:0)-ringA)*ek;
      let mx=0,dirty=q>=0||ringA>0.002;
      for (let i=0;i<N;i++) {
        const zc=i<8?0:i<14?1:2;
        const on=zc===2||(zc?l1:l0)||i===oi||i===q;
        if (on&&f[i]<=0) born[i]=t;
        f[i]=M.min(1,M.max(0,f[i]+(on?dt:-dt)*4));   // ~250 ms fade
        const e=f[i]*f[i]*(3-2*f[i]),ft=t-born[i];
        let a=e*(ft<0.12?[0.25,0.85,0.4,1][(ft*33)|0]||1:1);   // hololith spawn stutter
        if (i===oi||i===q) a=M.min(1,a*1.3);   // brighten the picked/examined node
        else if (xd>0) a*=1-0.4*xd;            // hard ceremony dims the others
        exK[i]+=((i===q?(zc<2?2:3.5):1)-exK[i])*ek;
        if (M.abs(exK[i]-1)>0.002) dirty=true;
        const c=col[zc];
        uC.set([c[0],c[1],c[2],a*(S.dark?0.92:0.96)],i*4);
        if (a>mx) mx=a;
      }
      if (dirty) {   // rescale anchors (bottom edge stays put); ring rides the examined node
        for (let i=0;i<N;i++) {
          const b=i*4,w=uT0[b+3],k=exK[i];
          uT[b+3]=w*k;uT[b+2]=uT0[b+2]+w*(k-1);
        }
        const b=lq*4;
        uT.set([uT[b],uT[b+1],uT[b+2],uT[b+3]*1.14],N*4);
      }
      const rc=col[lq<8?0:lq<14?1:2];
      uC.set([rc[0],rc[1],rc[2],ringA*(S.dark?0.85:0.9)],N*4);
      if (mx<0.005&&ringA<0.004) return;   // nothing visible → zero GL work
      gl.blendFunc(gl.ONE,S.dark?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(LN.p);   // bonds/edges first, atom sprites on top
      gl.uniformMatrix4fv(LN.uVP,false,ctx.mVP);
      if (dirty) gl.uniform4fv(LN.uT,uT);
      gl.uniform4fv(LN.uC,uC);F(LN.uTm,t);F(LN.uGl,S.dark?1:0);
      gl.bindBuffer(gl.ARRAY_BUFFER,bL);
      attr(LN,'aP',3,16,0);attr(LN,'aM',1,16,12);
      gl.drawArrays(gl.LINES,0,nL);
      gl.useProgram(PT.p);
      gl.uniformMatrix4fv(PT.uVP,false,ctx.mVP);
      if (dirty) gl.uniform4fv(PT.uT,uT);
      gl.uniform4fv(PT.uC,uC);F(PT.uTm,t);F(PT.uGl,S.dark?1:0);
      F(PT.uK,S.H*S.dpr*0.5/M.tan(S.fov/2));
      gl.bindBuffer(gl.ARRAY_BUFFER,bA);
      attr(PT,'aP',3,20,0);attr(PT,'aM',2,20,12);
      gl.drawArrays(gl.POINTS,0,nA);
    },
    ex(gi) {   // enter/switch examine: respawn stutter + panel (label / caption / copy)
      born[gi]=lt;
      const I=S.info;
      if (!I) return;
      I.hidden=false;
      I.classList.toggle('hr-examine',gi>13);
      I.querySelector('strong').textContent=nodes[gi].label;
      let c=I.querySelector('.hr-cap');
      if (!c) {
        c=document.createElement('span');c.className='hr-cap';
        I.insertBefore(c,I.querySelector('p'));
      }
      c.textContent=CAP[gi];
      I.querySelector('p').textContent=gi>13?nodes[gi].why:CP[gi];
    },
    unx() {   // exit examine: hide + revert the panel to its plain variant
      const I=S.info;
      if (!I) return;
      I.hidden=true;
      I.classList.remove('hr-examine');
      const c=I.querySelector('.hr-cap');
      if (c) c.textContent='';
    },
    x() {   // teardown: called from the main module's destroy
      this.unx();
      gl.deleteBuffer(bA);gl.deleteBuffer(bL);
      gl.deleteProgram(PT.p);gl.deleteProgram(LN.p);
    }
  };
}
