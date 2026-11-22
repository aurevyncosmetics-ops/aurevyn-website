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

/* ===== Fly-to-cart animation + image skeleton placeholders ===== */
(()=>{
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const qty=()=>{try{return cart.reduce((s,i)=>s+i.quantity,0)}catch(e){return 0}};
const cartIcon=()=>{const b=document.getElementById('cart-count');return b?(b.closest('.action-icon')||b.parentElement):null};
// ---------- fly to cart ----------
function sourceImg(name,id){
 let el=null;
 if(name==='addToCartFromQuickView')el=document.querySelector('#quick-view-body img');
 else if(name==='addToCartFromProductPage')el=document.querySelector('#product-detail-body img');
 else{const c=document.querySelector('.product-card[data-id="'+id+'"]');el=c&&c.querySelector('.product-image img')}
 return el||document.querySelector('#product-detail-body img,#quick-view-body img');
}
function bump(icon){
 icon.classList.remove('m-cart-bump');void icon.offsetWidth;icon.classList.add('m-cart-bump');
 const r=icon.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 for(let i=0;i<8;i++){const d=document.createElement('i');d.className='m-burst';d.style.left=cx+'px';d.style.top=cy+'px';document.body.appendChild(d);
  const a=i/8*Math.PI*2,dist=26+Math.random()*14;
  d.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(calc(-50% + '+Math.cos(a)*dist+'px),calc(-50% + '+Math.sin(a)*dist+'px)) scale(0)',opacity:0}],{duration:600,easing:'ease-out'}).onfinish=()=>d.remove()}
}
function fly(name,id){
 const icon=cartIcon();if(!icon)return;
 const img=sourceImg(name,id);
 if(rm||!img||!img.getBoundingClientRect().width){bump(icon);return}
 const s=img.getBoundingClientRect(),t=icon.getBoundingClientRect(),size=Math.min(110,Math.max(70,s.width*.5));
 const x0=s.left+s.width/2-size/2,y0=s.top+s.height/2-size/2,x1=t.left+t.width/2-size/2,y1=t.top+t.height/2-size/2;
 const clone=document.createElement('div');clone.className='m-fly';clone.style.cssText='width:'+size+'px;height:'+size+'px;background-image:url("'+img.currentSrc+'")';
 document.body.appendChild(clone);
 const mx=(x0+x1)/2,my=Math.min(y0,y1)-120;
 clone.animate([
  {transform:'translate('+x0+'px,'+y0+'px) scale(1) rotate(0deg)',opacity:1},
  {transform:'translate('+mx+'px,'+my+'px) scale(.75) rotate(160deg)',opacity:1,offset:.5},
  {transform:'translate('+x1+'px,'+y1+'px) scale(.12) rotate(340deg)',opacity:.6}
 ],{duration:900,easing:'cubic-bezier(.45,.05,.35,1)'}).onfinish=()=>{clone.remove();bump(icon)};
}
let busy=false;
['addToCart','addToCartWithShade','addToCartFromQuickView','addToCartFromProductPage'].forEach(n=>{
 const f=window[n];if(typeof f!=='function')return;
 window[n]=function(id){
  if(busy)return f.apply(this,arguments);
  const before=qty();busy=true;let r;try{r=f.apply(this,arguments)}finally{busy=false}
  if(qty()>before)fly(n,id);return r};
});
// ---------- image skeletons ----------
const SEL='.product-image img,.category-card img,.cart-item-image,#product-detail-body img,#quick-view-body img,.related-products img';
function wrap(img){return img.parentElement}
function arm(img){
 if(img.dataset.sk)return;img.dataset.sk=1;
 if(img.complete&&img.naturalWidth>0)return;
 const w=wrap(img);img.classList.add('m-img-loading');w&&w.classList.add('m-skel');
 const done=()=>{img.classList.remove('m-img-loading');w&&w.classList.remove('m-skel')};
 img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
}
const scan=root=>{(root.matches&&root.matches(SEL)?[root]:[]).concat([...(root.querySelectorAll?root.querySelectorAll(SEL):[])]).forEach(arm)};
scan(document);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{childList:true,subtree:true});
})();