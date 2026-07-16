/* hard-region-vex.js — the Magos walks the table: Vitruvius, the site's pixel
   tech-priest, dimension-lifted to a chunky voxel figure patrolling the
   hololith terrain. The one REAL entity on the table: opaque, sun-lit, in his
   own sprite palette (magos_pixel_pet.html PAL) — never a projection.
   Severable: imported by hard-region-3d.js after the entrance; any failure is
   a silent no-op. One VBO, ≤2 draw calls (body; teleport column, additive).
   Walks to the cursor, wanders toward the survey probe's ping site when idle,
   stands by the examined node, TELEPORTS on map click (noise-ordered
   per-voxel dissolve + light column), and clicking him opens the chat.
   His SERVO-SKULL familiar (the page pet's bone drone, voxelized) rides the
   same mesh as rigid group 7: it orbits his shoulder on a ~6 s drift, springs
   after him when he walks, faces his heading with a slow scan sweep, dissolves
   and re-forms with him, and clicking it also opens the chat. */
const M=Math,PI2=M.PI*2,HPI=M.PI/2;
/* ---------- the voxel Vex: palette + 5 depth slices (front y0 → back y4),
   each 21 rows (z20 top → z0 feet) × 13 cols (x0 staff-side → x12) ---------- */
const PAL={V:[26,9,16],M:[38,38,46],E:[255,42,0],q:[57,230,201],D:[90,14,18],
  R:[143,22,22],r:[186,42,34],G:[32,32,43],g:[61,61,76],L:[110,110,130],
  S:[168,168,188],O:[122,87,18],Y:[200,148,28],y:[242,200,75],o:[216,100,28],
  C:[255,90,31],W:[232,229,210],x:[70,255,126],w:[184,176,154],F:[150,28,10]};
const SL=[`
.............
.............
.YyY.........
..Y..........
.YYY.........
.....rRRRr...
.....rRRRr...
.....REVqR...
.....R...R...
....grRRRrO..
.....YRRRYW..
.....RRYRRW..
.....RRRRR...
.....GGyGG...
.....RRYRR...
.....RRYRR...
....rRRYRRr..
....rRRYRRr..
.............
.............
.....LL..LL..`,`
.............
..y..........
.yYy.........
..Y....r.....
.YYY..rRr....
..g..RRRRR...
..g..RVVVR...
..g..RVVVR...
..g..RMMMR...
..gRgRRRRRg..
..gY.RRRRRR..
..g..RRRRRR..
..g..RRRRRL..
..g..GGGGG...
..g..RRRRR...
..g..RRRRR...
..g.RRRRRRR..
..g.RRRRRRR..
..g..gg.gg...
..g..gg.gg...
..Y..gg.gg...`,`
.............
.............
.YyY.........
..S....r.....
.YYY..rRr....
.....RRRRD...
.....RVVVR...
.....RVVVR...
.....RVVVR...
....gRRRRRg..
.....RRRRRR..
.....RRRRRR..
.....RRRRR...
.....GGGGG...
.....RRRRD...
.....RRRRD...
....RRRRRRD..
....RRRRRRD..
.....gg.gg...
.....gg.gg...
.....gg.gg...`,`
.............
.............
.............
.............
.............
.....DRRRD...
.....RRDRR...
.....RRDRR...
.....RRDRR...
....goRDRRg..
.....RRDRR...
.....RRDRR...
.....RRDRR...
.....GGGGG...
.....RDRRD...
.....RDRRD...
....RRDRRDR..
....RRDRRDR..
.............
.............
.............`,`
.............
.............
.............
.............
.............
.............
.........C...
.....x...L...
.....ggLgg...
......GgG....
......gog....
......GgG....
.............
.............
.............
.............
.............
.....RDRRD...
.............
.............
.............`];
/* servo-skull familiar: 4 depth slices (front y0 → back y3), 5 rows (z28 top
   → z24) × 5 cols. Bone dome W/w, recessed sockets (V dead, F dim ember),
   nasal shadow + 1-voxel jaw stub, 1-voxel antenna mast. */
const KS=[`
.....
.WWW.
W.W.W
.WwW.
..w..`,`
..g..
WWWWW
WVWFW
WWWWW
.....`,`
.....
WWWWW
WWWWW
WWWWW
.....`,`
.....
.WWW.
.WVW.
.....
.....`];
/* ---------- shaders: rigid-group mats, sun lambert, dissolve, column ---------- */
const VSH=`#version 300 es
in vec3 aP;in vec2 aM;in vec4 aC;in vec4 aX;
uniform mat4 uVP,uM[8];uniform vec3 uSun,uCol;uniform float uPh,uLt,uCA;
out vec4 vC;
const vec3 NR[6]=vec3[6](vec3(1,0,0),vec3(-1,0,0),vec3(0,1,0),vec3(0,-1,0),vec3(0,0,1),vec3(0,0,-1));
void main(){
 int g=int(aM.x+.5);
 float h=aX.w,k=g==6?1.:clamp((h-uPh*1.2)*5.+1.,0.,1.);
 vec3 dr=(vec3(fract(h*17.13),fract(h*7.71),fract(h*3.37))-.5)*.05;dr.z=abs(dr.z)*1.7;
 vec3 p=mix(aX.xyz+dr,aP,k);
 gl_Position=uVP*(uM[g]*vec4(p,1.));
 if(g==6){float f=aC.r*uCA;vC=vec4(uCol*f,f);}
 else if(aC.a>.5)vC=vec4(aC.rgb,k);
 else{vec3 n=normalize(mat3(uM[g])*NR[int(aM.y+.5)]);
  vC=vec4(aC.rgb*(mix(.38,.32,uLt)+mix(.80,.74,uLt)*max(dot(n,uSun),0.)),k);}
}`;
const FSH=`#version 300 es
precision mediump float;in vec4 vC;out vec4 o;
void main(){if(vC.a<.02)discard;o=vC;}`;
/* ---------- module handle ---------- */
export function mk(S,ctx){
  const gl=S.gl,F=(l,v)=>gl.uniform1f(l,v);
  const sh=(ty,src)=>{
    const s=gl.createShader(ty);
    gl.shaderSource(s,src);gl.compileShader(s);
    if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('vex shader');
    return s;
  };
  const p=gl.createProgram();
  gl.attachShader(p,sh(gl.VERTEX_SHADER,VSH));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FSH));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error('vex link');
  const U={};['uVP','uM','uSun','uCol','uPh','uLt','uCA'].forEach(n=>U[n]=gl.getUniformLocation(p,n));
  const lP=gl.getAttribLocation(p,'aP'),lM=gl.getAttribLocation(p,'aM'),
    lC=gl.getAttribLocation(p,'aC'),lX=gl.getAttribLocation(p,'aX');
  /* ---- bake: parse slices → solid grid → merged mesh of exposed faces.
     groups: 0 body+hood, 1 head, 2 leg L, 3 leg R, 4 staff arm, 5 pack,
     7 servo-skull (own frame, keyed at z24+ so lookups never cross) ---- */
  const VZ=0.0031,fr=v=>v-M.floor(v);
  const vox=new Map(),at=(x,y,z)=>vox.get(x+(y<<4)+(z<<7));
  const GRP=(x,y,z,c)=>'VMEq'.indexOf(c)>=0?1:y===4&&z>7?5:x<4?4:z<3?(x<8?2:3):0;
  SL.forEach((s,y)=>s.split('\n').filter(r=>r).forEach((row,ri)=>{
    for (let x=0;x<13;x++){
      const c=row[x];
      if (c&&c!=='.') vox.set(x+(y<<4)+((20-ri)<<7),{ c: PAL[c],e: c==='E'||c==='q',g: GRP(x,y,20-ri,c) });
    }
  }));
  KS.forEach((s,y)=>s.split('\n').filter(r=>r).forEach((row,ri)=>{
    for (let x=0;x<5;x++){
      const c=row[x];
      if (c&&c!=='.') vox.set(x+(y<<4)+((28-ri)<<7),{ c: PAL[c],e: c==='F',g: 7 });
    }
  }));
  const NRM=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const TAN=[[1,2],[1,2],[0,2],[0,2],[0,1],[0,1]];   // tangent axis ids per normal
  const AX=[[1,0,0],[0,1,0],[0,0,1]];
  const fp=[],cb=[],ix=[];
  let nv=0,vi=0;
  vox.forEach((vx,k)=>{
    const x=k&15,y=(k>>4)&7,z=k>>7,h=fr(M.sin(++vi*12.9898)*43758.5453);
    const jit=vx.e?1:0.93+0.12*fr(h*7.3);
    const sk=vx.g===7,Vz=sk?0.0045:VZ;   // the familiar bakes chunkier, centered on itself
    const cx=(x-(sk?2:7))*Vz,cy=(y-(sk?1.5:2))*Vz,cz=(sk?z-26:z+0.5)*Vz;
    for (let d=0;d<6;d++){
      const n=NRM[d],nb=at(x+n[0],y+n[1],z+n[2]);
      if (nb&&nb.g===vx.g) continue;   // faces survive across group seams
      const t1=AX[TAN[d][0]],t2=AX[TAN[d][1]];
      let oc=0;   // cheap AO: solid cells ringing the exposed face
      for (let e=0;e<4;e++){
        const t=e<2?t1:t2,s=e&1?-1:1;
        if (at(x+n[0]+t[0]*s,y+n[1]+t[1]*s,z+n[2]+t[2]*s)) oc++;
      }
      const shd=vx.e?1:jit*(1-0.07*oc);
      const c0=M.min(255,vx.c[0]*shd),c1=M.min(255,vx.c[1]*shd),c2=M.min(255,vx.c[2]*shd);
      for (let a=-1;a<2;a+=2) for (let b=-1;b<2;b+=2){
        fp.push(cx+(n[0]+t1[0]*a+t2[0]*b)*Vz*0.5,cy+(n[1]+t1[1]*a+t2[1]*b)*Vz*0.5,
          cz+(n[2]+t1[2]*a+t2[2]*b)*Vz*0.5,vx.g,d,cx,cy,cz,h);
        cb.push(c0,c1,c2,vx.e?255:0);
      }
      ix.push(nv,nv+1,nv+2,nv+1,nv+3,nv+2);nv+=4;
    }
  });
  const nBody=ix.length;
  /* teleport light column + ground ring (group 6, additive, world-sized) */
  const q4=(q,br)=>{
    q.forEach((v,j)=>{ fp.push(v[0],v[1],v[2],6,0,0,0,0,0.5);cb.push(br[j],br[j],br[j],0);});
    ix.push(nv,nv+1,nv+2,nv+1,nv+3,nv+2);nv+=4;
  };
  q4([[-0.005,0,0],[0.005,0,0],[-0.005,0,0.24],[0.005,0,0.24]],[235,235,20,20]);
  q4([[0,-0.005,0],[0,0.005,0],[0,-0.005,0.24],[0,0.005,0.24]],[235,235,20,20]);
  for (let s2=0;s2<8;s2++){
    const g2=(j,r)=>{ const a=(s2+j)/8*PI2;return [M.cos(a)*r,M.sin(a)*r,0.002];};
    q4([g2(0,0.012),g2(0,0.02),g2(1,0.012),g2(1,0.02)],[175,175,175,175]);
  }
  const nCol=ix.length-nBody;
  const buf=(tg,d)=>{
    const b=gl.createBuffer();
    gl.bindBuffer(tg,b);gl.bufferData(tg,d,gl.STATIC_DRAW);
    return b;
  };
  const bV=buf(gl.ARRAY_BUFFER,new Float32Array(fp)),
    bC=buf(gl.ARRAY_BUFFER,new Uint8Array(cb)),
    bI=buf(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix));
  /* ---- rigid-part mats (column major, pure rigid: normals reuse rotation) ---- */
  const uMA=new Float32Array(128),ID=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const rot=(a,ax)=>{
    const c=M.cos(a),s=M.sin(a);
    return ax?[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]:[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];
  };
  const piv=(m,x,y,z)=>{
    m[12]=x-m[0]*x-m[4]*y-m[8]*z;m[13]=y-m[1]*x-m[5]*y-m[9]*z;m[14]=z-m[2]*x-m[6]*y-m[10]*z;
    return m;
  };
  const mul=(g,a,b)=>{
    for (let c=0;c<4;c++) for (let r=0;r<4;r++)
      uMA[g*16+c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  };
  /* ---- state ---- */
  let u=0.30,v=0.32,tu=u,tv=v,yaw=0,hd=-HPI,ph=0,wk=0,he=0,uPh=0,colA=0;
  let kx=0,ky=0,kz=0;   // servo-skull spring position (world)
  let mode=2,tpT=0,swp=0,lt=0,st0=0,rt=0,dwell=0,tap=-9,hlT=-9,hlN=8,sd=11,frz=0;
  const rnd=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
  const cl=x=>x<0.06?0.06:x>0.94?0.94:x;
  const ss=(a,b,x)=>{ x=(x-a)/(b-a);x=x<0?0:x>1?1:x;return x*x*(3-2*x);};
  const KX=ctx.wx(1)-ctx.wx(0),KY=ctx.wy(1)-ctx.wy(0);
  const wpt=(a,b)=>{ const w=(a-u)*KX,d=(b-v)*KY;return M.hypot(w,d);};
  let dbg=0;
  try { dbg=sessionStorage.getItem('vex-dbg');} catch (e) {}
  const pj=(a,b,c)=>{
    const m=ctx.mVP,w=m[3]*a+m[7]*b+m[11]*c+m[15];
    return { x: ((m[0]*a+m[4]*b+m[8]*c+m[12])/w*0.5+0.5)*S.W,
      y: (0.5-(m[1]*a+m[5]*b+m[9]*c+m[13])/w*0.5)*S.H,w };
  };
  if (dbg) window.__hrVex={
    get st() { return { u,v,tu,tv,mode,yaw,ph,wk,uPh,colA,kx,ky,kz };},
    get scr() { return pj(ctx.wx(u),ctx.wy(v),ctx.field(u,v)*ctx.HS+0.03);},
    get scrK() { return pj(kx,ky,kz);},
    set frz(k) { frz=k;},
    set pose(o) { for (const k in o){ if (k==='u') u=o[k];else if (k==='v') v=o[k];
      else if (k==='yaw') yaw=o[k];else if (k==='ph') ph=o[k];else if (k==='wk') wk=o[k];} }
  };
  return {
    d(t) {   // behavior + ≤2 draw calls, inside the main draw()
      if (!st0){ st0=1;lt=t;tpT=t-0.5;}   // spawn: materialize on the table
      const dt=M.min(0.05,M.max(0.001,t-lt));
      lt=t;
      if (!frz){
        if (mode===2){   // teleport: dissolve out → column → dissolve in
          const T=t-tpT;
          if (T>=0.5&&!swp){   // swap sites; the familiar re-forms at his side
            swp=1;u=tu;v=tv;
            kx=ctx.wx(u)+0.02;ky=ctx.wy(v)+0.01;kz=ctx.field(u,v)*ctx.HS+0.048;
          }
          uPh=T<0.45?T/0.45:T<0.55?1:M.max(0,1-(T-0.55)/0.45);
          colA=ss(0.08,0.28,T)*(1-ss(0.5,0.78,T));
          wk=M.max(0,wk-dt*4);
          if (T>=1){ mode=1;uPh=0;colA=0;dwell=t+1.8;}
        } else {
          let fx=null;
          if (!S.drag){   // never retarget mid-orbit
            if (S.ex>=0){   // examine: stand by the node, face it
              fx=S.ex<8?ctx.B[S.ex]:S.ex<14?ctx.D[S.ex-8]:ctx.H[S.ex-14];
              tu=cl(fx.u-0.042);tv=cl(fx.v-0.042);
            } else if (S.pointerOver&&!S.overN&&!S.overV&&S.hov&&S.nowMs-S.lastUserT<5e3){
              if (t-rt>0.2){ tu=cl(S.hov.u);tv=cl(S.hov.v);rt=t;dwell=t+1.5;}
            } else if (S.nowMs-S.lastUserT>5e3&&t>=dwell){   // idle: wander to the probe's ping site
              if (S.auto&&S.auto.init){ tu=cl(S.auto.u+(rnd()-0.5)*0.14);tv=cl(S.auto.v+(rnd()-0.5)*0.14);}
              else { tu=0.25+0.5*rnd();tv=0.25+0.5*rnd();}
              dwell=t+9e9;
            }
          }
          const dx=(tu-u)*KX,dy=(tv-v)*KY,ds=M.hypot(dx,dy);
          if (ds>0.006){
            const sp=M.min(ds,0.13*dt);
            u+=dx/ds*sp/KX;v+=dy/ds*sp/KY;
            hd=M.atan2(dy,dx);wk=M.min(1,wk+dt*5);ph+=sp*75;
            if (ds-sp<=0.006){ dwell=t+1.5+1.5*rnd();tap=t;}   // staff tap on arrival
          } else {
            wk=M.max(0,wk-dt*5);
            if (fx) hd=M.atan2((fx.v-v)*KY,(fx.u-u)*KX);   // idle facing the exhibit
          }
          let da=hd+HPI-yaw;
          da-=PI2*M.round(da/PI2);
          yaw+=da*(1-M.exp(-dt*7));
          if (t>hlN){ hlT=t;hlN=t+7+6*rnd();}   // occasional head-look
        }
      }
      /* pose */
      const X=ctx.wx(u),Y=ctx.wy(v),Z=ctx.field(u,v)*ctx.HS;
      const sw=M.sin(ph)*0.5*wk,tk=M.max(0,1-(t-tap)*2.2);
      const arm=sw*0.32-M.sin(tk*6.28)*0.22*tk;
      let ht=0;
      if (t-hlT<1.2&&t-hlT>=0){   // glance at the operator
        let ra=M.atan2(S.eye[1]-Y,S.eye[0]-X)-hd;
        ra-=PI2*M.round(ra/PI2);
        ht=M.max(-0.45,M.min(0.45,ra));
      }
      he+=(ht-he)*(1-M.exp(-dt*16));
      const bz=rot(yaw+M.sin(t*1.4)*(1-wk)*0.04,0);
      bz[12]=X;bz[13]=Y;bz[14]=Z+M.abs(M.cos(ph))*0.0012*wk+M.sin(t*2.1)*0.0004*(1-wk);
      mul(0,bz,ID);
      mul(1,bz,piv(rot(he,0),0,0,0.0403));
      mul(2,bz,piv(rot(sw,1),-0.0047,0,0.0105));
      mul(3,bz,piv(rot(-sw,1),0.0047,0,0.0105));
      mul(4,bz,piv(rot(arm,1),-0.0109,0,0.0357));
      mul(5,bz,piv(rot(-sw*0.06,1),0,0.0062,0.0372));
      /* servo-skull: ~6 s orbit of his shoulder + own bob, soft-spring chase */
      const oa=t*1.05,ax2=X+M.cos(oa)*0.022,ay2=Y+M.sin(oa)*0.022;
      const az2=M.max(Z,ctx.field((kx-ctx.wx(0))/KX,(ky-ctx.wy(0))/KY)*ctx.HS)
        +0.048+M.sin(t*1.9+2.6)*0.0035;
      const kk=1-M.exp(-dt*4.5);
      kx+=(ax2-kx)*kk;ky+=(ay2-ky)*kk;kz+=(az2-kz)*(1-M.exp(-dt*6));
      const km=rot(yaw+M.sin(t*0.8)*0.3,0);   // follow his heading + slow scan sweep
      km[12]=kx;km[13]=ky;km[14]=kz;
      mul(7,km,ID);
      const cu=mode===2?tu:u,cv=mode===2?tv:v;   // column stands at the destination
      uMA.set(ID,96);uMA[108]=ctx.wx(cu);uMA[109]=ctx.wy(cv);uMA[110]=ctx.field(cu,cv)*ctx.HS;
      /* draw */
      gl.useProgram(p);
      gl.uniformMatrix4fv(U.uVP,false,ctx.mVP);
      gl.uniformMatrix4fv(U.uM,false,uMA);
      gl.uniform3fv(U.uSun,S.sun);
      const cc=S.col.crim;
      gl.uniform3f(U.uCol,cc[0],cc[1],cc[2]);
      F(U.uPh,uPh);F(U.uLt,S.dark?0:1);F(U.uCA,colA);
      gl.bindBuffer(gl.ARRAY_BUFFER,bV);
      const att=(l,n,o)=>{ gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,36,o);};
      att(lP,3,0);att(lM,2,12);att(lX,4,20);
      gl.bindBuffer(gl.ARRAY_BUFFER,bC);
      gl.enableVertexAttribArray(lC);gl.vertexAttribPointer(lC,4,gl.UNSIGNED_BYTE,true,4,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bI);
      if (uPh<0.98){   // the body: opaque, depth-written — occluded by the massif
        gl.disable(gl.BLEND);gl.depthMask(true);
        gl.drawElements(gl.TRIANGLES,nBody,gl.UNSIGNED_SHORT,0);
        gl.enable(gl.BLEND);
      }
      if (colA>0.004){
        gl.depthMask(false);
        gl.blendFunc(gl.ONE,S.dark?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES,nCol,gl.UNSIGNED_SHORT,nBody*2);
      }
    },
    tp(a,b) {   // map click = odradek scan → translocate to the sample site
      mode=2;tpT=lt;swp=0;tu=cl(a);tv=cl(b);
    },
    pk(px,py,oc) {   // screen-space hit: him (≈18px) or his skull (≈12px)
      if (mode===2||!S.entDone) return false;
      const E=S.eye;
      const hit=(gx,gy,gz,r2)=>{
        const s2=pj(gx,gy,gz);
        if (s2.w<=0||(s2.x-px)*(s2.x-px)+(s2.y-py)*(s2.y-py)>r2) return false;
        if (oc){   // occluded by nearer terrain
          const ox=ctx.wx(oc.u),oy=ctx.wy(oc.v),oz=ctx.field(oc.u,oc.v)*ctx.HS;
          if (M.hypot(ox-E[0],oy-E[1],oz-E[2])<M.hypot(gx-E[0],gy-E[1],gz-E[2])-0.05) return false;
        }
        return true;
      };
      return hit(ctx.wx(u),ctx.wy(v),ctx.field(u,v)*ctx.HS+0.03,324)||hit(kx,ky,kz,144);
    },
    go() {   // click on Vex: the chat, exactly like the page pet
      tap=lt;hlT=lt;
      try { const a=window.__askRui;if (a&&a.enabled) a.toggle();} catch (e) {}
    },
    x() {   // teardown from the main module's destroy
      try {
        gl.deleteBuffer(bV);gl.deleteBuffer(bC);gl.deleteBuffer(bI);gl.deleteProgram(p);
      } catch (e) {}
      if (window.__hrVex) delete window.__hrVex;
    }
  };
}
