(function(){var g=function(k){try{return sessionStorage.getItem(k)||"";}catch(e){return "";}};
var ref=g("mlw_cs_ref"),name=g("mlw_cs_name"),sum=g("mlw_cs_summary");
if(ref){document.getElementById("ty-ref").textContent=ref;}
var tag=(name?name+", ":"")+(ref?"booking reference "+ref:"consultation booking");
var m=document.getElementById("ty-mail");if(m)m.href="mailto:masterlegalwork@gmail.com?subject="+encodeURIComponent("Documents for consultation: "+tag)+"&body="+encodeURIComponent("Dear Sir,\n\nPlease find attached the documents for my consultation ("+tag+").\n\nRegards,\n"+(name||""));
var w=document.getElementById("ty-wa");if(w)w.href="https://wa.me/919872206969?text="+encodeURIComponent("Documents for consultation: "+tag+"\n(attaching the documents here)"+(sum?"\n\n"+sum:""));;
var handoff = /[?&]handoff=1(?:&|$)/.test(location.search), confirmed = !handoff && ref && g("mlw_cs_confirmed") === ref;
var h=document.getElementById("ty-handoff"),s=document.getElementById("ty-sent"),u=document.getElementById("ty-unconfirmed");
if(h)h.hidden=!handoff;if(s)s.hidden=!confirmed;if(u)u.hidden=!!(handoff||confirmed);
if(handoff){
var body="Consultation request"+(ref?" "+ref:"")+"\n\n"+(sum||"");var a=document.getElementById("ho-wa");if(a)a.href="https://wa.me/919872206969?text="+encodeURIComponent(body);
var b=document.getElementById("ho-mail");if(b)b.href="mailto:masterlegalwork@gmail.com?subject="+encodeURIComponent("Consultation request: "+tag)+"&body="+encodeURIComponent(body);}})();
