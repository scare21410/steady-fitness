const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function browser(){
 let now=0, callback, store=new Map();
 class Element {
  constructor(id){this.id=id;this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.style={};this.attrs={};this.listeners={};this.tagName='BUTTON';this.classList={add(){},remove(){},toggle(){}};}
  addEventListener(t,cb){this.listeners[t]=cb}
  setAttribute(k,v){this.attrs[k]=v}
  getClientRects(){return [1]}
  focus(){doc.activeElement=this}
  showModal(){this.open=true}
  close(){this.open=false}
  click(){if(!this.disabled)this.listeners.click?.({target:this,preventDefault(){}})}
 }
 const html=fs.readFileSync(__dirname+'/index.html','utf8'), els={};
 for(const m of html.matchAll(/id="([^"]+)"/g))els[m[1]]=new Element(m[1]);
 els.rounds.tagName='SELECT';
 const brand=new Element('brand');
 const durationButtons=[40,50,60].map(n=>{const e=new Element('duration'+n);e.dataset={minutes:String(n)};return e});
 const doc={hidden:false,body:new Element('body'),activeElement:null,documentElement:new Element('root'),listeners:{},getElementById:id=>els[id],querySelector:s=>s==='.brand'?brand:null,querySelectorAll:s=>s==='[data-minutes]'?durationButtons:[],addEventListener(t,cb){this.listeners[t]=cb}};
 const win={Activities:require('./activities.js'),Workout:require('./workout.js'),scrollTo(){}};
 const context={fetch:async ()=>({ok:true,json:async ()=>JSON.parse(fs.readFileSync(__dirname+'/workout-config.json','utf8'))}),window:win,document:doc,navigator:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>now},setInterval:cb=>{callback=cb;return 1},clearInterval:()=>{callback=null},setTimeout:cb=>cb(),Date,Set,console};
 await vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
 return {els,doc,store,advance(ms){now+=ms;callback?.()}};
}
test('player freezes both timers while paused and resumes without losing time',async ()=>{
 const b=await browser(),e=b.els;e.start.click();assert.equal(e['exercise-timer'].textContent,'00:10');b.advance(10000);assert.equal(e['exercise-name'].textContent,'Easy march');b.advance(30000);assert.equal(e['exercise-timer'].textContent,'01:30');assert.equal(e['overall-left'].textContent,'39:30');e.pause.click();b.advance(60000);assert.equal(e['exercise-timer'].textContent,'01:30');assert.equal(e['overall-left'].textContent,'39:30');assert.equal(e.pause.textContent,'Resume');e.pause.click();b.advance(10000);assert.equal(e['exercise-timer'].textContent,'01:20');assert.equal(e['overall-left'].textContent,'39:20');
});
test('finishing reps early rests within the same minute and moves on exactly at 60 seconds',async ()=>{
 const b=await browser(),e=b.els;e.start.click();b.advance(10000);b.advance(480000);assert.equal(e['exercise-name'].textContent,'Kettlebell deadlift');assert.equal(e['exercise-timer'].textContent,'01:00');assert.equal(e['rep-target'].textContent,'4 controlled reps');assert.equal(e['overall-percent'].textContent,'20%');
 b.advance(15000);e['reps-done'].click();assert.equal(e['exercise-name'].textContent,'Rest & reset');assert.equal(e['exercise-timer'].textContent,'00:45');assert.equal(e['overall-left'].textContent,'31:45');
 b.advance(44000);assert.equal(e['exercise-name'].textContent,'Rest & reset');assert.equal(e['exercise-timer'].textContent,'00:01');b.advance(1000);assert.equal(e['exercise-name'].textContent,'Goblet squat');assert.equal(e['exercise-timer'].textContent,'01:00');assert.equal(e['rep-target'].textContent,'3 controlled reps · Bodyweight is welcome');assert.equal(e['reps-done'].hidden,false);
 e.pause.click();e.next.click();assert.equal(e['exercise-name'].textContent,'Supported row · Left arm');assert.equal(e.pause.textContent,'Resume');assert.equal(e['overall-left'].textContent,'30:00');e.previous.click();assert.equal(e['exercise-name'].textContent,'Goblet squat');assert.equal(e['overall-left'].textContent,'31:00');
});
test('hiding the page pauses automatically; ending records active time and returns to plan',async ()=>{
 const b=await browser(),e=b.els;e.start.click();b.advance(10000);b.advance(60000);b.doc.hidden=true;b.doc.listeners.visibilitychange();assert.equal(e.pause.textContent,'Resume');e.finish.click();assert.equal(e['exit-dialog'].open,true);e['end-confirm'].click();assert.equal(e.complete.hidden,false);assert.ok(e['completion-stats'].innerHTML.includes('01:00'));assert.equal(JSON.parse(b.store.get('steady-history')).length,1);e.again.click();assert.equal(e.setup.hidden,false);
});
test('reaching the end completes and stops the clock',async ()=>{const b=await browser(),e=b.els;e.start.click();b.advance(10000);b.advance(2400000);assert.equal(e.complete.hidden,false);assert.ok(e['completion-copy'].textContent.includes('reached the end'));assert.ok(e['completion-stats'].innerHTML.includes('40:00'))});
test('warm-up screens use their own illustrations and shoulder/push-up intervals',async ()=>{
 const b=await browser(),e=b.els;e.start.click();e.pause.click();e.next.click();
 assert.equal(e['exercise-name'].textContent,'Easy march');assert.ok(e['exercise-picture'].innerHTML.includes('assets/warmup.png'));
 e.next.click();assert.equal(e['exercise-name'].textContent,'Practise your hip hinge');assert.ok(e['exercise-picture'].innerHTML.includes('assets/warmup.png'));
 e.next.click();assert.equal(e['exercise-name'].textContent,'Chair sit-to-stand');assert.ok(e['exercise-picture'].innerHTML.includes('Chair sit-to-stand'));assert.ok(!e['exercise-picture'].innerHTML.includes('assets/exercises.png'));
 e.next.click();assert.equal(e['exercise-name'].textContent,'Shoulder rolls');assert.equal(e['exercise-timer'].textContent,'00:30');assert.ok(e['exercise-picture'].innerHTML.includes('assets/warmup.png'));
 e.next.click();assert.equal(e['exercise-name'].textContent,'Easy wall push-ups');assert.equal(e['exercise-timer'].textContent,'00:30');assert.ok(e['exercise-picture'].innerHTML.includes('assets/exercises.png'));
 e.next.click();assert.equal(e['exercise-name'].textContent,'Practise your deadlift');assert.equal(e['overall-left'].textContent,'33:00');
});

test('suitcase sides, changeover and rest share a single one-minute timer',async ()=>{const b=await browser(),e=b.els;e.start.click();b.advance(10000);b.advance(780000);assert.equal(e['exercise-name'].textContent,'Suitcase hold · Left hand');assert.equal(e['exercise-timer'].textContent,'01:00');assert.equal(e['reps-done'].hidden,true);b.advance(10000);assert.equal(e['exercise-name'].textContent,'Set down & switch');assert.equal(e['exercise-timer'].textContent,'00:50');b.advance(5000);assert.equal(e['exercise-name'].textContent,'Suitcase hold · Right hand');b.advance(10000);assert.equal(e['exercise-name'].textContent,'Rest & reset');assert.equal(e['exercise-timer'].textContent,'00:35');b.advance(35000);assert.equal(e['exercise-name'].textContent,'Kettlebell deadlift');assert.equal(e['exercise-timer'].textContent,'01:00')});
test('rep level changes targets without changing session timing',async ()=>{const b=await browser(),e=b.els;e['rep-level'].value='build';e['rep-level'].listeners.change.call(e['rep-level']);assert.ok(e['rep-summary'].textContent.includes('6 deadlifts'));assert.equal(e['start-time'].textContent,'40:00');e.start.click();b.advance(10000);b.advance(480000);assert.equal(e['rep-target'].textContent,'6 controlled reps');assert.equal(JSON.parse(b.store.get('steady-preferences')).level,'build')});
