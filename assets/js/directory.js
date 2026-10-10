/* VC directory: copy-link buttons (no dependencies) */
(function(){document.querySelectorAll("[data-copylink]").forEach(function(b){b.addEventListener("click",function(){var t=b.getAttribute("data-copylink");function ok(){var o=b.textContent;b.textContent="Copied";b.classList.add("ok");setTimeout(function(){b.textContent=o;b.classList.remove("ok");},1600);}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){});}else{var a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy");ok();}catch(e){}a.remove();}});});})();
/* print-friendly view button */
document.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-print]"); if (b) { ev.preventDefault(); window.print(); } });
