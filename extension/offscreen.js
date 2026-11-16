// TraceCue video storage: extension-origin IndexedDB only. No uploads.
let active = null;
let heartbeatTimer = null;
const openDb = () => new Promise((resolve,reject) => {
  const request = indexedDB.open("tracecue-videos",1);
  request.onupgradeneeded = () => request.result.createObjectStore("recordings");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
async function storeVideo(id,blob) {
  const db = await openDb();
  try {
    await new Promise((resolve,reject) => {
      const tx = db.transaction("recordings","readwrite");
      tx.objectStore("recordings").put(blob,id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function begin(streamId,id) {
  if (active) throw new Error("A recording is already in progress");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio:false,video:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:streamId}}
  });
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ?
    "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream,{mimeType,videoBitsPerSecond:1250000});
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
  active = {stream,recorder,chunks,id,mimeType};
  recorder.start(1000);
  const startedAt = Date.now();
  heartbeatTimer = setInterval(() => {
    chrome.runtime.sendMessage({target:"background",kind:"heartbeat"}).catch(() => {});
  },20000);
  return {ok:true,startedAt};
}
async function finish(id) {
  const item = active;
  if (!item || item.id !== id) return {ok:false,error:"No matching recording"};
  try {
    const blob = await new Promise((resolve,reject) => {
      item.recorder.onstop = () => resolve(new Blob(item.chunks,{type:item.mimeType}));
      item.recorder.onerror = e => reject(e.error || new Error("MediaRecorder failed"));
      item.recorder.stop();
    });
    await storeVideo(id,blob);
    return {ok:true,bytes:blob.size};
  } finally {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    item.stream.getTracks().forEach(track => track.stop());
    active = null;
  }
}
chrome.runtime.onMessage.addListener((msg,_sender,respond) => {
  if (msg?.target !== "offscreen") return;
  const task = msg.action === "start-video" ? begin(msg.streamId,msg.id) :
    msg.action === "stop-video" ? finish(msg.id) :
    Promise.resolve({ok:false,error:"Unrecognized offscreen action"});
  task.then(respond,e => respond({ok:false,error:String(e?.message || e)}));
  return true;
});
