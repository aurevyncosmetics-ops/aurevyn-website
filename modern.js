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

/* hero: hide the 3D lipstick scene while the lookbook video slide is showing */
(()=>{const hs=document.querySelector('.hero-slider');if(!hs)return;
const upd=()=>{const a=hs.querySelector('.slide.active');hs.dataset.video=a&&a.classList.contains('slide-video')?'1':'0'};
new MutationObserver(upd).observe(hs,{subtree:true,attributes:true,attributeFilter:['class']});upd()})();

/* keep the hero video paused while the intro splash is showing (saves phone CPU) */
(()=>{const v=document.querySelector('.hero-video'),de=document.documentElement;if(!v||!de.classList.contains('m-splash-busy'))return;
v.pause();const mo=new MutationObserver(()=>{if(!de.classList.contains('m-splash-busy')){mo.disconnect();v.play().catch(()=>{})}});mo.observe(de,{attributes:true,attributeFilter:['class']})})();

/* ===== Search suggestions, recently viewed, mobile bottom nav, lazy images, product schema ===== */
(()=>{
const LS='aurevynRecent';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prods=()=>{try{return products}catch(e){return[]}};
const money=n=>'PKR '+Number(n).toLocaleString();
const recent=()=>{try{return JSON.parse(localStorage.getItem(LS)||'[]')}catch(e){return[]}};
function remember(id){id=Number(id);if(!id)return;try{localStorage.setItem(LS,JSON.stringify([id].concat(recent().filter(x=>x!==id)).slice(0,8)))}catch(e){}}
// remember products opened in quick view or on the product page
const oqv=window.openQuickView;if(typeof oqv==='function')window.openQuickView=function(id){remember(id);return oqv.apply(this,arguments)};
const pid=new URLSearchParams(location.search).get('id');if(pid&&/product\.html$/.test(location.pathname))remember(pid);

// ---------- live search suggestions ----------
const box=document.createElement('div');box.className='m-suggest';box.setAttribute('role','listbox');document.body.appendChild(box);
let input=null,idx=-1,items=[];
function place(){if(!input)return;const r=input.getBoundingClientRect(),w=Math.max(r.width,Math.min(420,innerWidth-16));
 box.style.width=w+'px';box.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';box.style.top=(r.bottom+8)+'px'}
function row(p,q){const name=esc(p.name);let h=name;if(q){const i=p.name.toLowerCase().indexOf(q);if(i>=0)h=esc(p.name.slice(0,i))+'<mark>'+esc(p.name.slice(i,i+q.length))+'</mark>'+esc(p.name.slice(i+q.length))}
 return '<a class="ms-row" role="option" href="product.html?id='+p.id+'"><img src="'+esc(p.image)+'" alt="" loading="lazy"><span class="ms-info"><b>'+h+'</b><em>'+esc(p.category||'')+'</em></span><span class="ms-price">'+money(p.price)+'</span></a>'}
function render(){
 const q=(input.value||'').trim().toLowerCase(),all=prods();let html='',list=[];
 if(!q){const rec=recent().map(id=>all.find(p=>p.id===id)).filter(Boolean).slice(0,5);
  if(rec.length){list=rec;html='<div class="ms-title">Recently viewed</div>'+rec.map(p=>row(p,'')).join('')}
  else{list=all.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,4);html='<div class="ms-title">Popular picks</div>'+list.map(p=>row(p,'')).join('')}}
 else{list=all.filter(p=>(p.name+' '+(p.category||'')+' '+((p.tags||[]).join(' '))).toLowerCase().includes(q)).slice(0,6);
  html=list.length?list.map(p=>row(p,q)).join('')+'<a class="ms-all" href="shop.html?search='+encodeURIComponent(input.value.trim())+'">View all results for “'+esc(input.value.trim())+'” &rsaquo;</a>':'<div class="ms-empty">No products found for “'+esc(input.value.trim())+'”. Try another word.</div>'}
 box.innerHTML=html;items=[].slice.call(box.querySelectorAll('.ms-row'));idx=-1;place();box.classList.add('open')}
function close(){box.classList.remove('open');idx=-1}
['global-search-desktop','global-search-mobile'].forEach(id=>{const el=document.getElementById(id);if(!el)return;
 el.setAttribute('autocomplete','off');
 el.addEventListener('focus',()=>{input=el;render()});el.addEventListener('input',()=>{input=el;render()});
 el.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!items.length)return;idx=(idx+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((r,i)=>r.classList.toggle('on',i===idx));items[idx].scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'&&idx>=0){e.preventDefault();items[idx].click()}
  else if(e.key==='Escape')close()})});
box.addEventListener('click',e=>{const a=e.target.closest('.ms-all');if(!a||!input)return;e.preventDefault();const q=input.value.trim();close();try{submitGlobalSearch(q)}catch(err){location.href=a.href}});
document.addEventListener('pointerdown',e=>{if(!box.contains(e.target)&&e.target!==input)close()});
addEventListener('resize',place);addEventListener('scroll',()=>{if(box.classList.contains('open'))place()},{passive:true});

// ---------- mobile bottom navigation ----------
const page=(location.pathname.split('/').pop()||'index.html');
const nav=document.createElement('nav');nav.className='m-bottomnav';nav.setAttribute('aria-label','Quick navigation');
nav.innerHTML='<a href="index.html" data-k="home"'+(page==='index.html'||page===''?' class="on"':'')+'><i class="fas fa-home"></i><span>Home</span></a>'
+'<a href="shop.html" data-k="shop"'+(page==='shop.html'?' class="on"':'')+'><i class="fas fa-store"></i><span>Shop</span></a>'
+'<button type="button" data-k="search"><i class="fas fa-search"></i><span>Search</span></button>'
+'<button type="button" data-k="wish"><i class="fas fa-heart"></i><span>Wishlist</span><b class="bn-badge" data-for="wishlist-count"></b></button>'
+'<button type="button" data-k="cart"><i class="fas fa-shopping-bag"></i><span>Cart</span><b class="bn-badge" data-for="cart-count"></b></button>';
document.body.appendChild(nav);document.body.classList.add('has-bottomnav');
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;e.stopPropagation();const k=b.dataset.k;
 try{if(k==='cart')toggleCart();else if(k==='wish')toggleWishlist();else if(k==='search'){toggleMobileSearch();setTimeout(()=>{const i=document.getElementById('global-search-mobile');i&&i.focus()},250)}}catch(err){}});
const sync=()=>nav.querySelectorAll('.bn-badge').forEach(b=>{const s=document.getElementById(b.dataset.for),n=s?parseInt(s.textContent,10)||0:0;b.textContent=n>99?'99+':n;b.style.display=n?'flex':'none'});
['cart-count','wishlist-count'].forEach(id=>{const s=document.getElementById(id);s&&new MutationObserver(sync).observe(s,{childList:true,characterData:true,subtree:true})});sync();

// ---------- lazy-load below-the-fold images ----------
const lazy=img=>{if(img.hasAttribute('loading')||img.closest('.hero-slider,#m-splash,header,.main-header'))return;img.loading='lazy';img.decoding='async'};
document.querySelectorAll('img').forEach(lazy);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==='IMG')lazy(n);n.querySelectorAll&&n.querySelectorAll('img').forEach(lazy)}))).observe(document.body,{childList:true,subtree:true});

// ---------- Product structured data (helps Google show price in search) ----------
if(pid&&/product\.html$/.test(location.pathname)){
 let tries=0;const t=setInterval(()=>{const p=prods().find(x=>String(x.id)===String(pid));
  if(p){clearInterval(t);const s=document.createElement('script');s.type='application/ld+json';
   s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:p.name,image:new URL(p.image,location.href).href,description:p.description||p.name,category:p.category,brand:{'@type':'Brand',name:'Aurevyn'},
    offers:{'@type':'Offer',priceCurrency:'PKR',price:String(p.price),url:location.href,availability:(p.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'),itemCondition:'https://schema.org/NewCondition'}});
   document.head.appendChild(s)}
  else if(++tries>40)clearInterval(t)},300)}
})();
