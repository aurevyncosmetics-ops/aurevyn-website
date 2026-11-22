(()=>{
const fine=matchMedia('(pointer:fine)').matches,rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const bar=document.createElement('div');bar.className='m-progress';document.body.appendChild(bar);
const upd=()=>{const h=document.documentElement;bar.style.transform='scaleX('+(h.scrollTop/((h.scrollHeight-h.clientHeight)||1))+')'};
addEventListener('scroll',upd,{passive:true});upd();
const hero=document.querySelector('.hero-slider');
if(hero&&!rm){const s=document.createElement('div');s.className='m-scene';
 s.innerHTML='<i class="m-orb o1"></i><i class="m-orb o2"></i><i class="m-orb o3"></i><i class="m-ring"></i><i class="m-ring r2"></i>';hero.appendChild(s);
 hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));hero.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))})}
if(fine&&!rm){
 const g=document.createElement('div');g.className='m-glow';document.body.appendChild(g);
 let cur=null;
 document.addEventListener('pointermove',e=>{
  g.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
  const c=e.target.closest&&e.target.closest('.product-card,.category-card');
  if(cur&&cur!==c){cur.style.transform='';cur.classList.remove('m-tilt')}
  cur=c;if(c){const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
   c.classList.add('m-tilt');c.style.transform='perspective(900px) rotateX('+((.5-y)*10)+'deg) rotateY('+((x-.5)*12)+'deg) scale(1.02)';
   c.style.setProperty('--gx',x*100+'%');c.style.setProperty('--gy',y*100+'%')}
  const b=e.target.closest&&e.target.closest('.btn-primary,.btn-checkout,.add-to-cart');
  if(b){const r=b.getBoundingClientRect();b.style.setProperty('--tx',((e.clientX-r.left-r.width/2)*.18)+'px');b.style.setProperty('--ty',((e.clientY-r.top-r.height/2)*.28)+'px')}
 });
 document.addEventListener('pointerout',e=>{
  const c=e.target.closest&&e.target.closest('.m-tilt');if(c&&!c.contains(e.relatedTarget)){c.style.transform='';c.classList.remove('m-tilt')}
  const b=e.target.closest&&e.target.closest('.btn-primary,.btn-checkout,.add-to-cart');if(b&&!b.contains(e.relatedTarget)){b.style.removeProperty('--tx');b.style.removeProperty('--ty')}
 });
}
const sel='.section-header,.product-card,.category-card,.features-banner>*,.flash-sale-section .container>*,.home-reviews-section .container>*,.footer-col';
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('m-in');io.unobserve(e.target)}}),{threshold:.12});
const tag=root=>root.querySelectorAll&&root.querySelectorAll(sel).forEach(el=>{if(el.dataset.mr)return;el.dataset.mr=1;
 el.style.setProperty('--d',([].indexOf.call(el.parentNode.children,el)%6)*70+'ms');el.classList.add('m-reveal');io.observe(el)});
tag(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)tag(n.parentNode||n)}))).observe(document.body,{childList:true,subtree:true});
})();
