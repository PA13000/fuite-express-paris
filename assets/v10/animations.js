/* Accueil ATC : une seule lecture pour chaque comparaison et le ruban continu. */
(function () {
 'use strict';
 if (!document.body.classList.contains('accueil-v10')) return;
 var reduce=matchMedia('(prefers-reduced-motion: reduce)'),records=[],frame=0,last=0,period=11200;
 var strip=null;
 var ease=function(p){return p*p*(3-2*p);};
 function position(t){var p=t%period;if(p<1300)return 100;if(p<3900)return 100*(1-ease((p-1300)/2600));if(p<9500)return 0;return 100*ease((p-9500)/1700);}
 function icon(paused){return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="'+(paused?'M8 5v14l11-7z':'M7 5h4v14H7zM14 5h4v14h-4z')+'"/></svg>';}
 function command(record,host,name){
  var b=document.createElement('button');b.type='button';b.className='v10-pause';b.innerHTML=icon(false);b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Mettre en pause '+name);host.appendChild(b);record.button=b;
  record.name=name;
  b.addEventListener('click',function(e){e.stopPropagation();if(record.paused&&record.input)alignTime(record);setPause(record,!record.paused);});
 }
 function setPause(record,value){record.paused=value;record.button.setAttribute('aria-pressed',String(value));record.button.setAttribute('aria-label',(value?'Reprendre ':'Mettre en pause ')+record.name);record.button.innerHTML=icon(value);schedule();}
 function alignTime(r){
  var value=Number(r.input.value),base=Math.floor(r.elapsed/period)*period;
  if(value>=99.95){r.elapsed=base;return;}if(value<=.05){r.elapsed=base+3900;return;}
  var low=0,high=1,wanted=1-value/100;
  for(var i=0;i<30;i++){var m=(low+high)/2;if(ease(m)<wanted)low=m;else high=m;}
  r.elapsed=base+1300+(low+high)/2*2600;
 }
 function paint(r,value){
  value=Math.max(0,Math.min(100,value));if(r.previous!==null&&Math.abs(r.previous-value)<.005)return;r.previous=value;
  r.input.value=value.toFixed(1);r.fig.style.setProperty(r.mobile?'--v6-pos':'--pos',value+'%');
  r.input.setAttribute('aria-valuetext','Avant '+Math.round(value)+' %, après '+Math.round(100-value)+' %');
  r.before.hidden=value<1;r.after.hidden=value>99;r.line.hidden=r.handle.hidden=value<1||value>99;
 }
 function cursor(fig){
  // V16 : trait et poignée dans un curseur pleine largeur déplacé par transform (aucun décalage de mise en page).
  var line=fig.querySelector(':scope > .comparateur__trait'),handle=fig.querySelector(':scope > .comparateur__poignee');
  if(!line||!handle)return;
  var c=document.createElement('span');c.className='comparateur__curseur';c.setAttribute('aria-hidden','true');
  fig.insertBefore(c,line);c.appendChild(line);c.appendChild(handle);
 }
 function bindFig(r,fig,mobile){
  if(!mobile)cursor(fig);
  r.fig=fig;r.mobile=mobile;r.input=fig.querySelector('input[type="range"]');r.input.step='.1';
  r.before=fig.querySelector(mobile?'.v6-comparaison-etiquette:not(.v6-comparaison-etiquette--apres)':'.comparateur__etiquette--avant');
  r.after=fig.querySelector(mobile?'.v6-comparaison-etiquette--apres':'.comparateur__etiquette--apres');
  r.line=fig.querySelector(mobile?'.v6-comparaison-trait':'.comparateur__trait');r.handle=fig.querySelector(mobile?'.v6-comparaison-poignee':'.comparateur__poignee');r.previous=null;
 }
 function gesture(r,fig){
  var input=fig.querySelector('input[type="range"]');
  function point(x){var box=fig.getBoundingClientRect();r.previous=null;paint(r,(x-box.left)/box.width*100);}
  fig.addEventListener('pointerdown',function(e){
   if(e.target.closest('.v10-pause')||e.button>0)return;
   r.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,mouse:e.pointerType==='mouse',horizontal:false};
   if(r.pointer.mouse){setPause(r,true);point(e.clientX);input.focus({preventScroll:true});fig.setPointerCapture(e.pointerId);e.preventDefault();}
  });
  fig.addEventListener('pointermove',function(e){
   if(!r.pointer||r.pointer.id!==e.pointerId)return;var dx=Math.abs(e.clientX-r.pointer.x),dy=Math.abs(e.clientY-r.pointer.y);
   if(r.pointer.mouse||r.pointer.horizontal||(dx>10&&dx>dy*1.4)){r.pointer.horizontal=true;setPause(r,true);point(e.clientX);if(e.pointerType!=='mouse')fig.setPointerCapture(e.pointerId);}
  });
  input.addEventListener('focus',function(){setPause(r,true);});input.addEventListener('keydown',function(){setPause(r,true);});
  input.addEventListener('input',function(){setPause(r,true);r.previous=null;paint(r,Number(input.value));});
 }
 function register(el){var r={el:el,elapsed:0,ratio:0,paused:false,previous:null,pointer:null};records.push(r);return r;}
 function setupComparisons(){
  document.querySelectorAll('.comparateur').forEach(function(fig){
   if(fig.closest('.comparaison[data-comparaison]'))return;
   var r=register(fig);bindFig(r,fig,false);command(r,fig,'la comparaison');gesture(r,fig);paint(r,reduce.matches?50:100);
  });
  document.querySelectorAll('.comparaison[data-comparaison]').forEach(function(zone){
   var tabs=Array.from(zone.querySelectorAll('.onglet'));if(!tabs.length)return;
   var r=register(zone),index=0,auto=false;
   function select(n){
    index=n;tabs.forEach(function(tab,i){var active=i===n;tab.setAttribute('aria-pressed',String(active));var id=tab.getAttribute('aria-controls');document.getElementById(id).hidden=!active;var note=zone.querySelector('[data-cadrage="'+id+'"]');if(note)note.hidden=!active;});
    bindFig(r,document.getElementById(tabs[n].getAttribute('aria-controls')),false);paint(r,reduce.matches?50:100);
   }
   r.change=function(n){if(n!==index){auto=true;tabs[n].click();auto=false;}};r.count=tabs.length;
   select(index);command(r,zone.querySelector('.comparaison__cadres'),'les avant/après');
   zone.querySelectorAll('.comparateur').forEach(function(fig){gesture(r,fig);});
   tabs.forEach(function(tab,n){tab.addEventListener('click',function(){select(n);if(!auto){r.elapsed=n*period;setPause(r,true);}});});
  });
  document.querySelectorAll('.v6-comparaison-mobile').forEach(function(fig){
   var r=register(fig);bindFig(r,fig,true);command(r,fig,'la comparaison');gesture(r,fig);paint(r,reduce.matches?50:100);
  });
 }
 function setupStrip(){
  var track=document.querySelector('.v10-ruban__piste'),win=document.querySelector('.v10-ruban__fenetre');if(!track)return;
  var first=track.querySelector('ul');first.querySelectorAll('a,img').forEach(function(el){el.draggable=false;});var clone=first.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.querySelectorAll('a').forEach(function(a){a.tabIndex=-1;});track.appendChild(clone);clone.hidden=reduce.matches;
  strip={el:win,track:track,first:first,clone:clone,offset:0,cycle:0,ratio:0,paused:false,hovered:false,pointer:null,dragged:false};
  command(strip,win,'les rubriques');
  function geometry(){strip.cycle=first.getBoundingClientRect().width+(parseFloat(getComputedStyle(track).gap)||0);}strip.geometry=geometry;geometry();window.addEventListener('resize',geometry,{passive:true});
  function move(dx){if(reduce.matches){win.scrollLeft+=dx;return;}strip.offset=(strip.offset+dx+strip.cycle)%strip.cycle;track.style.transform='translate3d('+(-strip.offset)+'px,0,0)';}
  first.addEventListener('focusin',function(e){setPause(strip,true);if(reduce.matches)return;var box=e.target.closest('li').getBoundingClientRect();move(box.left-win.getBoundingClientRect().left-24);});
  track.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){strip.hovered=true;}});
  track.addEventListener('pointerleave',function(){strip.hovered=false;schedule();});
  track.addEventListener('pointerdown',function(e){if(e.button>0)return;strip.dragged=false;strip.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,offset:strip.offset};});
  track.addEventListener('pointermove',function(e){
   if(!strip.pointer||strip.pointer.id!==e.pointerId||reduce.matches)return;var dx=e.clientX-strip.pointer.x,dy=e.clientY-strip.pointer.y;
   if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.4){strip.dragged=true;setPause(strip,true);strip.offset=(strip.pointer.offset-dx+strip.cycle)%strip.cycle;track.style.transform='translate3d('+(-strip.offset)+'px,0,0)';}
  });
  track.addEventListener('dragstart',function(e){e.preventDefault();});
  track.addEventListener('click',function(e){if(strip.dragged){if(e.detail!==0)e.preventDefault();strip.dragged=false;}},true);
  win.addEventListener('wheel',function(e){if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey){e.preventDefault();setPause(strip,true);move(e.shiftKey?e.deltaY:e.deltaX);}},{passive:false});
 }
 function schedule(){if(!frame&&!document.hidden&&!reduce.matches)frame=requestAnimationFrame(tick);}
 function tick(t){
  frame=0;var delta=last?Math.min(48,t-last):0;last=t;var active=false;
  var candidates=records.filter(function(r){return r.ratio>=.25&&!r.paused&&!r.pointer&&(!r.mobile||getComputedStyle(r.fig.querySelector('.v6-comparaison-controls')).display!=='none');});
  candidates.sort(function(a,b){return b.ratio-a.ratio;});
  if(candidates.length){var r=candidates[0];active=true;r.elapsed+=delta;if(r.change)r.change(Math.floor(r.elapsed/period)%r.count);paint(r,position(r.elapsed));}
  if(strip&&strip.ratio>=.25&&!strip.paused&&!strip.hovered&&!strip.pointer&&strip.cycle){active=true;strip.offset=(strip.offset+delta*.048)%strip.cycle;strip.track.style.transform='translate3d('+(-strip.offset)+'px,0,0)';}
  if(active)schedule();else last=0;
 }
 function stopFrame(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
 setupComparisons();setupStrip();
 if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){var r=records.find(function(r){return r.el===e.target;});if(!r&&strip&&e.target===strip.el)r=strip;if(r)r.ratio=e.isIntersecting?e.intersectionRatio:0;});schedule();},{threshold:[0,.25,.5,.75,1]});records.forEach(function(r){io.observe(r.el);});if(strip)io.observe(strip.el);
 }
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){window.addEventListener(type,function(){records.forEach(function(r){r.pointer=null;});if(strip)strip.pointer=null;schedule();},{passive:true});});
 document.addEventListener('visibilitychange',function(){stopFrame();if(!document.hidden)schedule();});
 reduce.addEventListener('change',function(){stopFrame();records.forEach(function(r){r.previous=null;paint(r,50);});if(strip){strip.clone.hidden=reduce.matches;strip.track.style.transform='none';strip.offset=0;strip.geometry();}if(!reduce.matches)schedule();});
 window.addEventListener('beforeprint',function(){stopFrame();records.forEach(function(r){r.previous=null;paint(r,50);});});
 schedule();
})();
