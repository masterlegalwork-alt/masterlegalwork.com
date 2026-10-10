/* Master Legal Work v2 — navigation, notices, reveal, filters, click-to-load video, PWA. No dependencies. */
(function(){"use strict";
var d=document,root=d.documentElement;if(!root.classList.contains("js"))root.classList.add("js");
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
/* menu */
var t=d.querySelector(".nav-toggle"),m=d.getElementById("menu");
if(t&&m){var set=function(o){m.classList.toggle("open",o);t.setAttribute("aria-expanded",o?"true":"false");t.textContent=o?"Close":"Menu";d.body.style.overflow=o?"hidden":"";};
t.addEventListener("click",function(){set(!m.classList.contains("open"));});
d.addEventListener("keydown",function(e){if(e.key==="Escape"){if(m.classList.contains("open")){set(false);t.focus();}closeAll();}});}
function closeAll(ex){d.querySelectorAll(".mnav li.open").forEach(function(li){if(li!==ex){li.classList.remove("open");var b=li.querySelector("button");if(b)b.setAttribute("aria-expanded","false");}});}
d.querySelectorAll(".mnav button[aria-controls]").forEach(function(b){b.addEventListener("click",function(ev){ev.stopPropagation();var li=b.parentNode,o=!li.classList.contains("open");closeAll(li);li.classList.toggle("open",o);b.setAttribute("aria-expanded",o?"true":"false");});});
d.addEventListener("click",function(e){if(!e.target.closest(".mnav"))closeAll();});
/* header + sticky CTA */
var h=d.querySelector(".site-header"),cta=d.querySelector(".sticky-cta");
var on=function(){var y=window.scrollY;if(h)h.classList.toggle("scrolled",y>24);if(cta)cta.classList.toggle("show",y>520);};
on();window.addEventListener("scroll",on,{passive:true});
/* BCI notice */
var n=d.getElementById("bci-notice"),K="mlw_notice_ack";
if(n){var ack=false;try{ack=localStorage.getItem(K)==="1";}catch(e){}
if(!ack){n.hidden=false;d.body.classList.add("modal-open");}var nb=n.querySelector("[data-agree]");if(nb){if(!ack)setTimeout(function(){nb.focus();},50);nb.addEventListener("click",function(){n.hidden=true;d.body.classList.remove("modal-open");try{localStorage.setItem(K,"1");}catch(e){}});}
n.addEventListener("keydown",function(e){if(e.key!=="Tab")return;var f=n.querySelectorAll("button,a[href]"),a0=f[0],a1=f[f.length-1];if(e.shiftKey&&d.activeElement===a0){e.preventDefault();a1.focus();}else if(!e.shiftKey&&d.activeElement===a1){e.preventDefault();a0.focus();}});}
/* reveal + restrained parallax */
var rv=d.querySelectorAll(".rv");
if(rv.length&&"IntersectionObserver" in window&&!RM){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target);}});},{rootMargin:"0px 0px -8% 0px"});rv.forEach(function(x){io.observe(x);});}
else rv.forEach(function(x){x.classList.add("in");});
if(!RM&&matchMedia("(min-width: 900px) and (hover: hover)").matches){var px=d.querySelectorAll("[data-parallax] img");if(px.length){var tick=false;var pf=function(){px.forEach(function(img){var r=img.parentNode.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=(r.top+r.height/2-innerHeight/2)/innerHeight;img.style.transform="scale(1.08) translate3d(0,"+(p*-28).toFixed(1)+"px,0)";});tick=false;};
window.addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(pf);}},{passive:true});pf();}}
/* filters: [data-filter-scope] containing .search input, .filters buttons[data-cat], items [data-item][data-cat][data-text] */
d.querySelectorAll("[data-filter-scope]").forEach(function(sc){
 var q=sc.querySelector(".search input"),bs=sc.querySelectorAll(".filters button[data-cat]"),items=sc.querySelectorAll("[data-item]"),cnt=sc.querySelector(".count"),cat="all";
 function run(){var s=(q&&q.value||"").toLowerCase().trim(),k=0;
  items.forEach(function(it){var ok=(cat==="all"||(" "+it.getAttribute("data-cat")+" ").indexOf(" "+cat+" ")>-1)&&(!s||(it.getAttribute("data-text")||it.textContent).toLowerCase().indexOf(s)>-1);it.classList.toggle("hidden-by-filter",!ok);if(ok)k++;});
  sc.querySelectorAll("[data-grp]").forEach(function(g){var any=g.querySelector("[data-item]:not(.hidden-by-filter)");g.classList.toggle("hidden-by-filter",!any);});
  if(cnt)cnt.textContent=k+(k===1?" result":" results");}
 bs.forEach(function(b){b.addEventListener("click",function(){cat=b.getAttribute("data-cat");bs.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});run();});});
 if(q)q.addEventListener("input",run);run();});
/* toc highlight */
var toc=d.querySelectorAll(".toc a[href^='#']");
if(toc.length&&"IntersectionObserver" in window){var map={};toc.forEach(function(a){map[a.getAttribute("href").slice(1)]=a;});
 var to=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){toc.forEach(function(a){a.classList.remove("on");});var a=map[x.target.id];if(a)a.classList.add("on");}});},{rootMargin:"-30% 0px -60% 0px"});
 Object.keys(map).forEach(function(id){var el=d.getElementById(id);if(el)to.observe(el);});}
/* tabs */
d.querySelectorAll("[role=tablist]").forEach(function(tl){var tabs=tl.querySelectorAll("[role=tab]");tabs.forEach(function(tb){tb.addEventListener("click",function(){tabs.forEach(function(x){var s=x===tb;x.setAttribute("aria-selected",s?"true":"false");x.tabIndex=s?0:-1;var p=d.getElementById(x.getAttribute("aria-controls"));if(p)p.hidden=!s;});});});
 if(/Android|iPhone|iPad/i.test(navigator.userAgent)){var mob=tl.querySelector("[data-mobile]");if(mob)mob.click();}});
/* click-to-load video (youtube-nocookie) */
d.querySelectorAll(".vframe button[data-yt]").forEach(function(b){b.addEventListener("click",function(){var f=d.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(b.getAttribute("data-yt"))+"?autoplay=1&rel=0";f.title=b.getAttribute("data-title")||"Video";f.allow="accelerometer; encrypted-media; picture-in-picture; fullscreen";f.loading="lazy";b.parentNode.replaceChild(f,b);});});
/* today's date */
d.querySelectorAll("[data-today]").forEach(function(x){try{x.textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"});}catch(e){}});
/* PWA */
if("serviceWorker" in navigator&&location.protocol==="https:"){window.addEventListener("load",function(){var b=(window.MLW_CONFIG&&MLW_CONFIG.base)||"";navigator.serviceWorker.register(b+"/sw.js").catch(function(){});});}
})();
/* v3: hide "What's new" if the latest item is older than 48 hours (never show stale news as today's) */
(function(){var w=document.querySelector("[data-wnew]");if(!w)return;var d=Date.parse(w.getAttribute("data-date")||"");if(!d||Date.now()-d>48*3600*1000)w.hidden=true;})();
/* v3: copy address */
document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var t=b.getAttribute("data-copy"),done=function(){var o=b.textContent;b.textContent="Address copied";setTimeout(function(){b.textContent=o;},1800);};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,function(){});else{var a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy");done();}catch(e){}a.remove();}});});
/* v3: click-to-load maps (no Google request until asked) */
document.querySelectorAll("[data-map]").forEach(function(m){var b=m.querySelector("button");if(!b)return;b.addEventListener("click",function(){var f=document.createElement("iframe");f.src=m.getAttribute("data-map");f.title="Map";f.loading="lazy";f.referrerPolicy="no-referrer-when-downgrade";f.setAttribute("allowfullscreen","");m.innerHTML="";m.appendChild(f);m.classList.add("on");});});
/* v3: gentle, once-only install prompt: from the third page view, shown a single time, never on the booking form */
(function(){var K="mlw_pwa_asked",V="mlw_views";try{var n=+(localStorage.getItem(V)||0)+1;localStorage.setItem(V,n);}catch(e){return;}
 window.addEventListener("beforeinstallprompt",function(ev){ev.preventDefault();try{if(localStorage.getItem(K)||+localStorage.getItem(V)<3||/consultation/.test(location.pathname))return;localStorage.setItem(K,"1");}catch(e){return;}
  var bar=document.createElement("div");bar.className="pwa-bar";bar.setAttribute("role","region");bar.setAttribute("aria-label","Install");
  bar.innerHTML='<p>Keep cause lists, VC links and legal updates one tap away.</p><button type="button" class="btn-outline" data-i>Add to home screen</button><button type="button" class="pwa-x" data-x aria-label="Dismiss">Not now</button>';
  document.body.appendChild(bar);bar.querySelector("[data-i]").onclick=function(){ev.prompt();bar.remove();};bar.querySelector("[data-x]").onclick=function(){bar.remove();};});})();
/* Old single-page anchors (pre-v3 live site) -> v3 pages, only when the anchor no longer exists on the page. */
(function () { var m = {"#about": "chambers.html", "#team": "profile.html", "#gallery": "chambers.html", "#practice": "practice.html", "#contact": "contact.html", "#home": ""};
  var h = location.hash, b = (window.MLW_CONFIG && window.MLW_CONFIG.base) || "";
  if (h && m.hasOwnProperty(h) && /\/(index\.html)?$/.test(location.pathname) && !document.getElementById(h.slice(1))) location.replace(b + "/" + m[h]); })();
