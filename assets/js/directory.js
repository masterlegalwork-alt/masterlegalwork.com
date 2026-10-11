/* Progressive enhancement: every resource remains crawlable without JavaScript. */
(function(){
 'use strict';
 var query=document.getElementById('directory-query');
 if(!query)return;
 var items=Array.from(document.querySelectorAll('[data-directory-item]'));
 var groups=Array.from(document.querySelectorAll('.directory-group'));
 var count=document.getElementById('directory-count');
 var empty=document.getElementById('directory-empty');
 function update(){
  function normalise(value){return value.toLocaleLowerCase('en-IN').replace(/[-–—_/]/g,' ');}
  var terms=normalise(query.value).trim().split(/\s+/).filter(Boolean);
  var visible=0;
  items.forEach(function(item){
   var text=normalise(item.textContent+' '+(item.getAttribute('data-directory-search')||''));
   var match=terms.every(function(term){return text.indexOf(term)!==-1;});
   item.hidden=!match;if(match)visible++;
  });
  groups.forEach(function(group){group.hidden=!Array.from(group.querySelectorAll('[data-directory-item]')).some(function(item){return !item.hidden;});});
  count.textContent=visible+' '+(visible===1?'resource':'resources');empty.hidden=visible!==0;
 }
 query.addEventListener('input',update);
 update();
})();
