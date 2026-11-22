/* AUREVYN — real 3D (three.js): rotating gold lipstick + sparkles in hero, floating 3D orbs in sections */
(()=>{
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(rm)return;
const hero=document.querySelector('.hero-slider');
(window.__threeP||(window.__threeP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='three.min.js?v=128';s.onload=()=>res(window.THREE);s.onerror=rej;document.head.appendChild(s)}))).then(()=>{try{init()}catch(e){console.warn('3D skipped',e)}}).catch(()=>{});
function init(){
 const de=document.documentElement;
 if(de.classList.contains('m-splash-busy')){const mo=new MutationObserver(()=>{if(!de.classList.contains('m-splash-busy')){mo.disconnect();init2()}});mo.observe(de,{attributes:true,attributeFilter:['class']});return}
 init2();
}
function init2(){
 // ---- floating gold orbs in page sections (parallax on scroll) ----
 const secs=[...document.querySelectorAll('#categories,#new-arrivals,#best-sellers,.home-reviews-section')];
 const orbs=[];
 secs.forEach((sec,i)=>{sec.classList.add('m-sec');for(let k=0;k<2;k++){const o=document.createElement('i');o.className='m-sec-orb';
  const sz=40+Math.random()*70;o.style.cssText='width:'+sz+'px;height:'+sz+'px;'+((i+k)%2?'right':'left')+':'+(2+Math.random()*6)+'%;top:'+(8+Math.random()*60)+'%';
  o.dataset.sp=(.05+Math.random()*.16)*(k?-1:1);sec.appendChild(o);orbs.push(o)}});
 const sc=()=>{const vh=innerHeight;orbs.forEach(o=>{const r=o.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;
  o.style.transform='translate3d(0,'+((r.top-vh/2)*o.dataset.sp)+'px,0) rotate('+(r.top*.05)+'deg)'})};
 addEventListener('scroll',sc,{passive:true});sc();
 if(!hero||!window.THREE)return;
 // ---- WebGL hero scene ----
 const T=THREE,cv=document.createElement('canvas');cv.className='m-gl';hero.appendChild(cv);
 const r=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(40,1,.1,100);cam.position.z=8;
 scene.add(new T.AmbientLight(0xffffff,.7));
 const d=new T.DirectionalLight(0xffffff,1.3);d.position.set(3,4,6);scene.add(d);
 const g1=new T.PointLight(0xffd27a,2.2,30);g1.position.set(-4,1,4);scene.add(g1);
 const g2=new T.PointLight(0xffffff,1.2,30);g2.position.set(4,-3,3);scene.add(g2);
 const M=(c,m,ro)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:ro});
 const gold=M(0xC9A24B,.85,.25),black=M(0x0c0c0c,.7,.28),red=M(0x8a1226,.3,.35);
 const L=new T.Group();
 const add=(geo,mat,y)=>{const m=new T.Mesh(geo,mat);m.position.y=y;L.add(m);return m};
 add(new T.CylinderGeometry(.62,.62,1.7,56),black,-1.15);
 add(new T.CylinderGeometry(.655,.655,.16,56),gold,-.2);
 add(new T.CylinderGeometry(.6,.6,1.05,56),gold,.4);
 add(new T.CylinderGeometry(.47,.47,.7,48),red,1.28);
 const tip=add(new T.SphereGeometry(.47,48,24,0,Math.PI*2,0,Math.PI/2),red,1.63);tip.scale.y=1.35;tip.rotation.z=.18;
 L.scale.setScalar(1.05);scene.add(L);
 // sparkles
 const N=140,pos=new Float32Array(N*3);for(let i=0;i<N*3;i++)pos[i]=(Math.random()-.5)*14;
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));
 const c2=document.createElement('canvas');c2.width=c2.height=64;const x2=c2.getContext('2d'),gr=x2.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.3,'rgba(255,230,160,.9)');gr.addColorStop(1,'rgba(255,230,160,0)');x2.fillStyle=gr;x2.fillRect(0,0,64,64);
 const pts=new T.Points(pg,new T.PointsMaterial({map:new T.CanvasTexture(c2),color:0xE6D3A3,size:.16,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));scene.add(pts);
 let mx=0,my=0,vis=true,w=0,h=0;
 hero.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();mx=(e.clientX-b.left)/b.width-.5;my=(e.clientY-b.top)/b.height-.5});
 new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(hero);
 const fit=()=>{w=hero.clientWidth;h=hero.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  const hw=Math.tan(T.MathUtils.degToRad(20))*8*cam.aspect;L.userData.x=w>700?hw*.62:hw*.7;L.userData.y=w>700?-.35:1.2;L.scale.setScalar(w>700?.95:.58)};
 new ResizeObserver(fit).observe(hero);fit();
 const clk=new T.Clock();
 (function loop(){requestAnimationFrame(loop);if(!vis||document.hidden||document.documentElement.classList.contains('m-splash-busy'))return;const t=clk.getElapsedTime();
  L.rotation.y=t*.7+mx*1.2;L.rotation.x=my*.5;L.rotation.z=Math.sin(t*.6)*.08;
  L.position.set(L.userData.x,L.userData.y+Math.sin(t*1.2)*.25-.1,0);
  pts.rotation.y=t*.04+mx*.2;pts.rotation.x=my*.15;g1.position.x=-4+Math.sin(t)*2;
  r.render(scene,cam)})();
}
})();