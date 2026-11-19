import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
const manifest=JSON.parse(readFileSync(new URL("../extension/manifest.json",import.meta.url),"utf8"));
test("Chrome manifest points to valid-sized transparent PNG icons",()=>{
 for(const size of [16,32,48,128]){
  const name=manifest.icons[String(size)];
  assert.equal(name,"icons/icon-"+size+".png");
  const data=readFileSync(new URL("../extension/"+name,import.meta.url));
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(data.readUInt32BE(16),size);
  assert.equal(data.readUInt32BE(20),size);
  assert.equal(data[25],6); // RGBA
  let pos=8,idat=[];
  while(pos<data.length){
   const len=data.readUInt32BE(pos);
   const typ=data.toString("ascii",pos+4,pos+8);
   if(typ==="IDAT")idat.push(data.subarray(pos+8,pos+8+len));
   pos+=len+12;if(typ==="IEND")break;
  }
  const raw=inflateSync(Buffer.concat(idat));
  assert.equal(raw.length,size*(size*4+1));
  assert.equal(manifest.action.default_icon[String(size)],name);
 }
});
