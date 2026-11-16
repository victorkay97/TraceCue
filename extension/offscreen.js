import {chunkKey,chunkPrefix,metaKey,describeRecovery} from "./recording-keys.js";
// Every MediaRecorder timeslice is saved locally to IndexedDB before Stop.
// A crash may truncate playback, but captured segments are not solely in RAM.
let active=null,heartbeat=null;
const openDb=()=>new Promise((resolve,reject)=>{
  const req=indexedDB.open("tracecue-videos",1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("recordings"))req.result.createObjectStore("recordings");};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
async function dbWrite(key,value,remove=false){
  const db=await openDb();
  try{await new Promise((resolve,reject)=>{
    const tx=db.transaction("recordings","readwrite");
    const store=tx.objectStore("recordings");
    if(remove)store.delete(key);else store.put(value,key);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
async function dbRead(key){
  const db=await openDb();
  try{return await new Promise((resolve,reject)=>{
    const req=db.transaction("recordings","readonly").objectStore("recordings").get(key);
    req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
  });}finally{db.close();}
}
async function segmentList(id){
  const db=await openDb(),prefix=chunkPrefix(id);
  try{return await new Promise((resolve,reject)=>{
    const values=[];
    const cursor=db.transaction("recordings","readonly").objectStore("recordings")
      .openCursor(IDBKeyRange.bound(prefix,prefix+"\uffff"));
    cursor.onsuccess=()=>{
      const item=cursor.result;
      if(!item){resolve(values);return;}
      if(item.value instanceof Blob&&item.value.size)
        values.push({key:item.key,blob:item.value});
      item.continue();
    };
    cursor.onerror=()=>reject(cursor.error);
  });}finally{db.close();}
}
async function cleanup(id,parts){
  const db=await openDb();
  try{await new Promise((resolve,reject)=>{
    const tx=db.transaction("recordings","readwrite");
    const store=tx.objectStore("recordings");
    for(const part of parts)store.delete(part.key);
    store.delete(metaKey(id));
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
async function begin(streamId,id){
  if(active)throw Error("Another capture is already active");
  // Preserve the MIME type in durable metadata, before capture.
  const stream=await navigator.mediaDevices.getUserMedia({
    audio:false,video:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:streamId}}
  });
  const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?
    "video/webm;codecs=vp9":"video/webm";
  let recorder;
  try{
    recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:1250000});
    const startedAt=Date.now();
    await dbWrite(metaKey(id),{startedAt,mimeType,complete:false,updatedAt:startedAt});
    active={stream,recorder,id,mimeType,sequence:0,queue:Promise.resolve(),writeError:null};
    recorder.ondataavailable=event=>{
      if(!event.data?.size)return;
      const item=active;
      if(!item||item.id!==id)return;
      const key=chunkKey(id,item.sequence++);
      item.queue=item.queue.then(()=>dbWrite(key,event.data))
        .catch(error=>{item.writeError=error;});
    };
    recorder.start(1000);
    heartbeat=setInterval(()=>{
      chrome.runtime.sendMessage({target:"background",kind:"heartbeat"}).catch(()=>{});
    },20000);
    return {ok:true,startedAt};
  }catch(error){
    stream.getTracks().forEach(track=>track.stop());
    active=null;throw error;
  }
}
async function finalize(id,{interrupted=false}={}){
  const metadata=await dbRead(metaKey(id));
  const parts=await segmentList(id);
  const already=await dbRead(id);
  if(already instanceof Blob&&already.size){
    if(parts.length)await cleanup(id,parts);
    return {...describeRecovery({chunks:parts.length,bytes:already.size,hasFinal:true}),
      ok:true,bytes:already.size,interrupted:false};
  }
  if(!parts.length)return {ok:false,error:"No durable video segments found"};
  const blob=new Blob(parts.map(item=>item.blob),{type:metadata?.mimeType||"video/webm"});
  await dbWrite(id,blob);
  await cleanup(id,parts);
  return {...describeRecovery({chunks:parts.length,bytes:blob.size,hasFinal:false}),
    ok:true,bytes:blob.size,interrupted};
}
async function finish(id){
  const item=active;
  if(!item||item.id!==id)return {ok:false,error:"No active capture for this session. Try Recover."};
  try{
    await new Promise((resolve,reject)=>{
      item.recorder.onstop=resolve;
      item.recorder.onerror=e=>reject(e.error||Error("Recorder stopped unexpectedly"));
      if(item.recorder.state!=="inactive")item.recorder.stop();else resolve();
    });
    await item.queue;
    if(item.writeError)throw item.writeError;
    return await finalize(id,{interrupted:false});
  }finally{
    clearInterval(heartbeat);heartbeat=null;
    item.stream.getTracks().forEach(track=>track.stop());
    if(active===item)active=null;
  }
}
async function recover(id){
  if(active?.id===id)throw Error("Cannot recover a recording still in progress");
  return finalize(id,{interrupted:true});
}
chrome.runtime.onMessage.addListener((msg,_sender,respond)=>{
  if(msg?.target!=="offscreen")return;
  const task=msg.action==="start-video"?begin(msg.streamId,msg.id):
    msg.action==="stop-video"?finish(msg.id):
    msg.action==="recover-video"?recover(msg.id):
    Promise.resolve({ok:false,error:"Unknown recording command"});
  task.then(respond,error=>respond({ok:false,error:String(error?.message||error)}));
  return true;
});
