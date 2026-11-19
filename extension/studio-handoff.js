// Studio handoff is initiated only inside the recording review extension page.
// The short-lived token lives in the target URL *fragment* (not sent to a server).
// Neither a session nor a video is ever transmitted without a fresh user gesture.
export const STUDIO_ORIGINS=Object.freeze({
  local:"http://127.0.0.1:5173",
  localHostname:"http://localhost:5173",
  preview:"https://tracecue-studio-preview.vercel.app"
});
export const MAX_HANDOFF_VIDEO_BYTES=80*1024*1024;
export function studioTarget(name){
  if(name==="local")return STUDIO_ORIGINS.local;
  if(name==="preview")return STUDIO_ORIGINS.preview;
  throw new Error("Unknown Studio destination.");
}
export function studioAllowedOrigin(origin){
  return Object.values(STUDIO_ORIGINS).includes(origin);
}
export function transferTarget(origin,token,extensionId){
  if(!studioAllowedOrigin(origin))throw Error("Unapproved Studio origin.");
  if(!/^[a-f0-9]{48}$/.test(String(token)))throw Error("Invalid handoff token.");
  if(!/^[a-p]{32}$/.test(String(extensionId)))throw Error("Invalid Chrome extension ID.");
  return origin+"/app.html#tracecue-transfer="+token+"&extension="+extensionId;
}
export function newHandoffToken(cryptoApi=crypto){
  const bytes=new Uint8Array(24);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes,v=>v.toString(16).padStart(2,"0")).join("");
}
