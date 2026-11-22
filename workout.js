(function(root){
'use strict';
var config,moves=[],warmupMoves=[],levels=[];
var api={configure:configure,buildPlan:buildPlan,atTime:atTime,clock:clock};
function configure(input){
 function fail(message){throw Error('Workout configuration: '+message)}
 function integer(value,name,min){if(!Number.isInteger(value)||value<min)fail(name+' must be an integer of at least '+min)}
 function array(value,name){if(!Array.isArray(value)||!value.length)fail(name+' must be a non-empty array')}
 function text(value,name){if(typeof value!=='string'||!value.trim())fail(name+' must be non-empty text')}
 var c=JSON.parse(JSON.stringify(input));
 if(c.version!==1)fail('unsupported version');
 ['moves','warmupMoves','levels','warmup','strengthOrder','cooldown','sessions','roundOptions'].forEach(function(k){array(c[k],k)});
 integer(c.minuteSeconds,'minuteSeconds',1);if(c.minuteSeconds!==60)fail('strength slots must be 60 seconds');
 integer(c.countdownSeconds,'countdownSeconds',1);integer(c.holdSwitchSeconds,'holdSwitchSeconds',1);integer(c.minimumRestSeconds,'minimumRestSeconds',1);
 var ids=new Set();c.moves.concat(c.warmupMoves).forEach(function(m){text(m.id,'move id');if(ids.has(m.id))fail('duplicate move '+m.id);ids.add(m.id);['name','short','notes'].forEach(function(k){text(m[k],m.id+' '+k)});array(m.cues,m.id+' cues');m.cues.forEach(function(s){text(s,'cue')});if(typeof m.source!=='string'||!/^assets\/[\w.-]+\.(png|jpg|webp)$/.test(m.source))fail('illustration must be a local assets image');if(!Array.isArray(m.crop)||m.crop.length!==2)fail('illustration crop requires [top, height]');integer(m.crop[0],'crop top',0);integer(m.crop[1],'crop height',1);if(m.crop[0]+m.crop[1]>1536)fail('crop exceeds illustration height');if(m.frame){if(!Array.isArray(m.frame)||m.frame.length!==4)fail('frame requires [left, top, width, height]');m.frame.forEach(function(v,i){integer(v,'frame',i<2?0:1)});if(m.frame[0]+m.frame[2]>1024||m.frame[1]+m.frame[3]>1536)fail('frame exceeds illustration dimensions');}});
 var orderIds=new Set();c.strengthOrder.forEach(function(s){if(!c.moves.some(function(m){return m.id===s.move}))fail('unknown strength move '+s.move);if(s.type&&s.type!=='hold')fail('unknown strength slot type');if(s.side&&['Left','Right'].indexOf(s.side)<0)fail('side must be Left or Right');var key=s.move+':'+(s.side||'');if(orderIds.has(key))fail('duplicate strength slot '+key);orderIds.add(key)});
 function validateStep(s){integer(s.duration,'step duration',1);text(s.name,'step name');text(s.detail,'step detail');array(s.cues,'step cues');s.cues.forEach(function(x){text(x,'cue')});if(s.move&&!ids.has(s.move))fail('unknown illustration '+s.move)}
 c.warmup.concat(c.cooldown).forEach(validateStep);text(c.walking.name,'walking name');text(c.walking.detail,'walking detail');array(c.walking.cues,'walking cues');
 var levelIds=new Set();c.levels.forEach(function(l){text(l.id,'level id');text(l.label,'level label');if(levelIds.has(l.id))fail('duplicate level');levelIds.add(l.id);c.strengthOrder.forEach(function(s){integer(l[s.move],l.id+' '+s.move,1);if(s.type==='hold'&&l[s.move]*2+c.holdSwitchSeconds+c.minimumRestSeconds>c.minuteSeconds)fail('holds must leave the minimum recovery time')})});
 var minMinutes=Infinity;c.sessions.forEach(function(s){integer(s.minutes,'session minutes',1);integer(s.rounds,'session rounds',1);if(c.roundOptions.indexOf(s.rounds)<0)fail('session rounds not available');minMinutes=Math.min(minMinutes,s.minutes)});c.roundOptions.forEach(function(r){integer(r,'round options',1)});
 if(!c.defaults||!c.sessions.some(function(s){return s.minutes===c.defaults.minutes})||c.roundOptions.indexOf(c.defaults.rounds)<0||!levelIds.has(c.defaults.level))fail('defaults must match configured choices');
 var fixed=c.warmup.concat(c.cooldown).reduce(function(n,s){return n+s.duration},0);if(fixed+Math.max.apply(null,c.roundOptions)*c.strengthOrder.length*c.minuteSeconds>=minMinutes*60)fail('session too short for configured warm-up, rounds, and cool-down');
 config=c;moves=c.moves;warmupMoves=c.warmupMoves;levels=c.levels;api.config=c;api.moves=moves;api.warmupMoves=warmupMoves;api.levels=levels;return api;
}
function buildPlan(minutes,rounds,level){
 if(!config)throw Error('Load the workout configuration first.');
 var target=levels.find(function(l){return l.id===(level||config.defaults.level)});
 if(!target)throw Error('Choose a valid repetition level.');
 if(!config.sessions.some(function(s){return s.minutes===minutes})||config.roundOptions.indexOf(rounds)<0)throw Error('Choose a configured duration and round count.');
 var steps=[];
 function add(duration,phase,name,detail,cues,move,extra){steps.push(Object.assign({duration:duration,phase:phase,name:name,detail:detail,cues:cues||[],move:move||null,kind:'move'},extra||{}));}
 function configured(s,phase){add(s.duration,phase,s.name,s.detail,s.cues,s.move,{visual:s.visual})}
 config.warmup.forEach(function(s){configured(s,'Warm-up')});
 for(var round=1;round<=rounds;round++)config.strengthOrder.forEach(function(slot){
  var m=moves.find(function(x){return x.id===slot.move}),h=slot.type==='hold';
  var detail=h?target[m.id]+' seconds per hand · Rest for the remainder':target[m.id]+' controlled reps'+(slot.side?' · '+slot.side+' arm':m.id==='squat'?' · Bodyweight is welcome':'');
  add(config.minuteSeconds,'Strength',m.name+(slot.side?' · '+slot.side+' arm':''),detail,m.cues,m.id,{round:round,kind:'set',targetReps:h?null:target[m.id],holdSeconds:h?target[m.id]:null,switchSeconds:h?config.holdSwitchSeconds:null});
 });
 var warm=config.warmup.reduce(function(n,s){return n+s.duration},0),cool=config.cooldown.reduce(function(n,s){return n+s.duration},0),strength=rounds*config.strengthOrder.length*config.minuteSeconds;
 var walk=minutes*60-warm-strength-cool;
 add(walk,'Walk',config.walking.name,config.walking.detail,config.walking.cues,null,{visual:config.walking.visual});
 config.cooldown.forEach(function(s){configured(s,'Cool-down')});
 var start=0;steps.forEach(function(s){s.start=start;start+=s.duration;s.end=start});
 return {minutes:minutes,rounds:rounds,level:target.id,steps:steps,total:start,walk:walk,phases:[{name:'Warm-up',seconds:warm},{name:'Strength',seconds:strength},{name:'Walk',seconds:walk},{name:'Cool-down',seconds:cool}]};
}
function atTime(plan,seconds){var t=Math.max(0,Math.min(seconds,plan.total));var i=plan.steps.findIndex(function(s){return t<s.end});return i<0?{index:plan.steps.length,complete:true}:{index:i,step:plan.steps[i],remaining:plan.steps[i].end-t,complete:false};}
function clock(seconds){var n=Math.max(0,Math.ceil(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
if(typeof module!=='undefined'&&module.exports){module.exports=api;configure(require('./workout-config.json'));}else root.Workout=api;
})(typeof window!=='undefined'?window:this);
