/* Master Legal Work, court calculators. All dates are handled as local calendar dates. */
(function(){
  "use strict";
  var d=document;
  if(!d.getElementById("lim-art"))return;
  function $(id){return d.getElementById(id)}
  function parse(v){if(!v)return null;var p=v.split("-");return new Date(+p[0],+p[1]-1,+p[2])}
  function addDays(dt,n){var x=new Date(dt);x.setDate(x.getDate()+n);return x}
  function addMonths(dt,m){var x=new Date(dt.getFullYear(),dt.getMonth()+m,1),last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(dt.getDate(),last));return x}
  function fmt(dt){return dt.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
  function money(n){return "\u20B9"+n.toLocaleString("en-IN",{maximumFractionDigits:2,minimumFractionDigits:2})}
  function sundayNote(dt){return dt.getDay()===0?" This is a Sunday; see Section 4.":""}

  /* Limitation Act, 1963: commonly used articles. p = [years, months, days]. */
  var ART=[
   ["Suit for money lent (Article 19)",[3,0,0],"from the date the loan is made"],
   ["Suit for arrears of rent (Article 52)",[3,0,0],"from the date the arrears become due"],
   ["Suit for specific performance (Article 54)",[3,0,0],"from the date fixed for performance, or, if none, the date the plaintiff has notice of refusal"],
   ["Suit for declaration (Article 58)",[3,0,0],"from the date the right to sue first accrues"],
   ["Suit for possession on prior possession (Article 64)",[12,0,0],"from the date of dispossession"],
   ["Suit for possession on title (Article 65)",[12,0,0],"from the date the defendant's possession becomes adverse"],
   ["Suit for which no period is provided (Article 113)",[3,0,0],"from the date the right to sue accrues"],
   ["Appeal from a decree to the High Court (Article 116(a))",[0,0,90],"from the date of the decree"],
   ["Appeal from a decree to any other court (Article 116(b))",[0,0,30],"from the date of the decree"],
   ["Criminal appeal to the High Court (Article 115(b)(i))",[0,0,60],"from the date of the sentence or order"],
   ["Criminal appeal to any other court (Article 115(b)(ii))",[0,0,30],"from the date of the sentence or order"],
   ["Restoration of a suit dismissed in default (Article 122)",[0,0,30],"from the date of dismissal"],
   ["Setting aside an ex parte decree (Article 123)",[0,0,30],"from the date of the decree, or of knowledge where summons was not duly served"],
   ["Revision (Article 131)",[0,0,90],"from the date of the decree or order"],
   ["Execution of a decree (Article 136)",[12,0,0],"from the date the decree becomes enforceable"],
   ["Application for which no period is provided (Article 137)",[3,0,0],"from the date the right to apply accrues"],
   ["Consumer complaint (Section 69, Consumer Protection Act, 2019)",[2,0,0],"from the date the cause of action arises"],
   ["Challenge to an arbitral award (Section 34(3), Arbitration Act)",[0,3,0],"from the date of receiving the award; a further 30 days may be allowed on sufficient cause"]
  ];
  var sel=$("lim-art");
  ART.forEach(function(a,i){var o=d.createElement("option");o.value=i;o.textContent=a[0];sel.appendChild(o)});
  function lim(){
    var a=ART[+sel.value], dt=parse($("lim-date").value), ex=Math.max(0,parseInt($("lim-excl").value||"0",10)||0);
    $("lim-from").textContent="Time runs "+a[2]+".";
    var p=a[1], label=(p[0]?p[0]+(p[0]>1?" years":" year"):"")+(p[1]?p[1]+" months":"")+(p[2]?p[2]+" days":"");
    if(!dt){$("lim-out").textContent="Choose a date";$("lim-sub").textContent="Period: "+label+".";return}
    var end=addDays(addMonths(dt,p[0]*12+p[1]),p[2]+ex);
    $("lim-out").textContent=fmt(end);
    $("lim-sub").textContent="Period: "+label+(ex?", plus "+ex+" excluded days":"")+"."+sundayNote(end);
  }

  /* Section 187(3) BNSS: the remand day is day one. */
  function db(){
    var n=+$("db-type").value, dt=parse($("db-date").value);
    if(!dt){$("db-out").textContent="Choose a date";$("db-sub").textContent="";return}
    var last=addDays(dt,n-1), right=addDays(dt,n);
    $("db-out").textContent=fmt(right);
    $("db-sub").textContent="Day "+n+" of custody is "+fmt(last)+". If no police report is filed by then, the right arises the next day.";
  }

  /* Section 479 BNSS */
  function ut(){
    var y=Math.max(0,+$("ut-y").value||0), m=Math.max(0,+$("ut-m").value||0), dt=parse($("ut-date").value), total=y*12+m;
    function point(frac){
      var months=total*frac, whole=Math.floor(months), days=Math.round((months-whole)*30.4375);
      return addDays(addMonths(dt,whole),days);
    }
    if(!dt||!total){$("ut-out1").textContent=$("ut-out2").textContent=total?"Choose a date":"Enter the maximum sentence";return}
    $("ut-out1").textContent=fmt(point(1/3));
    $("ut-out2").textContent=fmt(point(1/2));
  }

  /* Interest */
  function intr(){
    var P=+$("in-p").value||0, r=(+$("in-r").value||0)/100, a=parse($("in-a").value), b=parse($("in-b").value), c=+$("in-c").value;
    if(!a||!b||b<=a){$("in-out").textContent=a&&b?"The end date must be after the start date":"Choose dates";$("in-sub").textContent="";return}
    var days=Math.round((b-a)/864e5), t=days/365, I=c?P*(Math.pow(1+r/c,c*t)-1):P*r*t;
    $("in-out").textContent=money(I);
    $("in-sub").textContent=days+" days. Total with principal: "+money(P+I)+".";
  }

  [["lim-art",lim],["lim-date",lim],["lim-excl",lim],["db-type",db],["db-date",db],["ut-y",ut],["ut-m",ut],["ut-date",ut],
   ["in-p",intr],["in-r",intr],["in-a",intr],["in-b",intr],["in-c",intr]].forEach(function(x){var e=$(x[0]);e.addEventListener("input",x[1]);e.addEventListener("change",x[1])});
  var today=new Date(), iso=function(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0")};
  $("in-b").value=iso(today); $("in-a").value=iso(addMonths(today,-12));
  lim();db();ut();intr();

  /* Tabs highlight the calculator in view */
  var tabs=d.querySelectorAll(".calc-tabs a");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)tabs.forEach(function(t){t.classList.toggle("on",t.getAttribute("href")==="#"+e.target.id)})})},{rootMargin:"-40% 0px -55% 0px"});
    d.querySelectorAll(".calc").forEach(function(c){io.observe(c)});
  }
  tabs.forEach(function(t){t.addEventListener("click",function(e){var el=d.getElementById(t.getAttribute("href").slice(1));if(el){e.preventDefault();el.scrollIntoView({behavior:"smooth",block:"start"})}})});
})();
