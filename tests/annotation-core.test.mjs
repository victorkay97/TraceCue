import test from "node:test";
import assert from "node:assert/strict";
import {annotationShape,annotationArea,pointToFrame} from "../studio/src/annotation-core.js";
test("canvas coordinates are converted to actual frame dimensions",()=>{
 const p=pointToFrame(150,75,{left:100,top:50,width:200,height:100},1920,1080);
 assert.deepEqual(p,{x:480,y:270});
});
test("mask and arrow endpoints are clamped and checked",()=>{
 const s=annotationShape("mask",-5,-10,3000,4000,1280,720);
 assert.deepEqual(s,{kind:"mask",x1:0,y1:0,x2:1280,y2:720});
 assert.equal(annotationArea(s),921600);
 assert.throws(()=>annotationShape("script",0,0,10,10,100,100));
});
