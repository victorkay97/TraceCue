// Stable IndexedDB keys for partial MediaRecorder sessions.
const safeId=id=>{
  if(!/^tc-[0-9]{8,20}$/.test(String(id||"")))throw Error("Invalid TraceCue session ID");
  return id;
};
export const draftKey=id=>"draft:"+safeId(id);
export const chunkPrefix=id=>"part:"+safeId(id)+":";
export const chunkKey=(id,position)=>{
  if(!Number.isSafeInteger(position)||position<0||position>99999999)
    throw Error("Invalid video segment number");
  return chunkPrefix(id)+String(position).padStart(8,"0");
};
export const metaKey=id=>"recording-meta:"+safeId(id);
export function describeRecovery({chunks,bytes,hasFinal}){
  if(!Number.isInteger(chunks)||chunks<0||!Number.isFinite(bytes)||bytes<0)
    throw Error("Invalid recovery data");
  return {recoverable:hasFinal||chunks>0,partial:!hasFinal,
    chunks,bytes,description:hasFinal?"Final recording available":
      chunks?"Interrupted recording chunks available; playback not guaranteed":
      "No recorded chunks available"};
}
