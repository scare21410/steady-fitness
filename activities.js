(function(root){
'use strict';
// Retain the original key and records when promoting the workout player to a tracker.
var STORAGE_KEY='steady-history';
function normalize(entry,index){
 var record=Object.assign({},entry);
 record.id=record.id||'legacy-'+index;
 record.activityType=record.activityType||'kettlebell';
 record.durationSeconds=record.durationSeconds===undefined?record.seconds:record.durationSeconds;
 record.status=record.status||(record.early?'partial':'completed');
 record.startedAt=record.startedAt||null;
 record.endedAt=record.endedAt||null;
 record.source=record.source||'guided-workout';
 record.details=record.details||{plannedMinutes:record.planned||null};
 return record;
}
function list(storage){
 var raw=storage.getItem(STORAGE_KEY);
 if(raw===null)return [];
 var records=JSON.parse(raw);
 if(!Array.isArray(records)||records.some(function(x){return !x||typeof x!=='object'||Array.isArray(x)}))throw Error('Activity history is not a valid list.');
 return records.map(normalize);
}
function append(storage,input){
 if(!input||typeof input.activityType!=='string'||!input.activityType.trim())throw Error('Activity type is required.');
 if(!Number.isInteger(input.durationSeconds)||input.durationSeconds<0)throw Error('Duration must be a nonnegative number of seconds.');
 if(['completed','partial'].indexOf(input.status)<0)throw Error('Activity status is required.');
 var records=list(storage);
 var record=Object.assign({},input);
 record.id=record.id||'activity-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 records.push(record);
 storage.setItem(STORAGE_KEY,JSON.stringify(records));
 return record;
}
var api={storageKey:STORAGE_KEY,list:list,append:append};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Activities=api;
})(typeof window!=='undefined'?window:this);
