import {annotationShape,annotationArea,pointToFrame} from "./annotation-core.js";

// Captures only frames of a locally imported video. No screen permissions,
// network calls or automatic uploads. Opaque mask removes image pixels.
export function createFrameAnnotator(root,{video,getSession}){
  root.innerHTML=[
    '<div class="panel-head"><div><span class="eyebrow">VISUAL EVIDENCE</span><h3>Screenshot & annotation</h3></div><span class="badge">Local only</span></div>',
    '<p class="muted small">Capture the current playback frame, annotate, mask sensitive data and download a PNG. The original recording is unchanged.</p>',
    '<div class="actions"><button id="snapFrame">Capture current frame</button><button id="snapUndo" class="ghost" disabled>Undo</button><button id="snapDownload" class="ghost" disabled>Download PNG</button></div>',
    '<div class="annotation-tools"><label>Tool <select id="snapTool"><option value="rectangle">Rectangle</option><option value="arrow">Arrow</option><option value="mask">Opaque privacy mask</option></select></label></div>',
    '<canvas id="snapCanvas" hidden aria-label="Draw an annotation on the captured video frame" role="img"></canvas>',
    '<div class="status-text" id="snapStatus" role="status">Import a full WebM and choose a frame to capture.</div>',
    '<p class="muted small">Redaction is applied only to the exported screenshot; the original recording may still contain the sensitive information. Review before sharing.</p>'
  ].join("");
  const $=id=>root.querySelector("#"+id);
  const canvas=$("snapCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
  const base=document.createElement("canvas");const baseCtx=base.getContext("2d");
  let shapes=[],drag=null;
  const draw=()=>{
    if(!base.width)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(base,0,0);
    for(const s of [...shapes,...(drag?[drag]:[])]){
      const w=s.x2-s.x1,h=s.y2-s.y1;
      ctx.lineWidth=Math.max(3,Math.round(canvas.width/400));
      ctx.strokeStyle="#f8c264";ctx.fillStyle="#f8c264";
      if(s.kind==="mask"){ctx.fillStyle="#111827";ctx.fillRect(Math.min(s.x1,s.x2),Math.min(s.y1,s.y2),Math.abs(w),Math.abs(h));continue;}
      if(s.kind==="rectangle"){ctx.strokeRect(s.x1,s.y1,w,h);continue;}
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
      const angle=Math.atan2(h,w),head=Math.max(12,canvas.width/55);
      ctx.beginPath();ctx.moveTo(s.x2,s.y2);
      ctx.lineTo(s.x2-head*Math.cos(angle-.5),s.y2-head*Math.sin(angle-.5));
      ctx.lineTo(s.x2-head*Math.cos(angle+.5),s.y2-head*Math.sin(angle+.5));
      ctx.closePath();ctx.fill();
    }
    $("snapUndo").disabled=!shapes.length;
  };
  const point=e=>pointToFrame(e.clientX,e.clientY,canvas.getBoundingClientRect(),canvas.width,canvas.height);
  canvas.addEventListener("pointerdown",e=>{
    if(!base.width)return;
    const p=point(e);drag=annotationShape($("snapTool").value,p.x,p.y,p.x,p.y,canvas.width,canvas.height);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(!drag)return;
    const p=point(e);drag=annotationShape(drag.kind,drag.x1,drag.y1,p.x,p.y,canvas.width,canvas.height);
    draw();
  });
  canvas.addEventListener("pointerup",e=>{
    if(!drag)return;
    const p=point(e);drag=annotationShape(drag.kind,drag.x1,drag.y1,p.x,p.y,canvas.width,canvas.height);
    if(drag.kind==="arrow"||annotationArea(drag)>=16)shapes.push(drag);
    drag=null;draw();
    $("snapStatus").textContent=shapes.length+" annotation"+(shapes.length===1?"":"s")+" on local screenshot.";
  });
  $("snapFrame").addEventListener("click",()=>{
    if(!getSession()||video.readyState<2||!video.videoWidth){
      $("snapStatus").textContent="Load an actual video and seek to a visible frame first.";return;
    }
    const maxPixels=1920*1080;
    const scale=Math.min(1,Math.sqrt(maxPixels/(video.videoWidth*video.videoHeight)));
    base.width=canvas.width=Math.round(video.videoWidth*scale);
    base.height=canvas.height=Math.round(video.videoHeight*scale);
    try{baseCtx.drawImage(video,0,0,base.width,base.height);}
    catch(e){$("snapStatus").textContent="Cannot draw the selected frame: "+e.message;return;}
    shapes=[];drag=null;draw();canvas.hidden=false;
    $("snapDownload").disabled=false;
    $("snapStatus").textContent="Captured frame at +"+video.currentTime.toFixed(1)+"s. Draw to annotate or mask.";
  });
  $("snapUndo").addEventListener("click",()=>{shapes.pop();draw();});
  $("snapDownload").addEventListener("click",()=>{
    if(!base.width)return;
    draw();
    canvas.toBlob(blob=>{
      if(!blob){$("snapStatus").textContent="PNG encoding failed.";return;}
      const url=URL.createObjectURL(blob),a=document.createElement("a");
      const reportId=(getSession()?.id||"session").replace(/[^A-Za-z0-9_-]/g,"").slice(0,50);
      a.href=url;a.download="tracecue-"+reportId+"-frame-"+Math.round(video.currentTime*10)+".png";
      a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
      $("snapStatus").textContent="Annotated PNG exported locally. Review it before sharing.";
    },"image/png");
  });
  return {clear:()=>{
    shapes=[];drag=null;base.width=base.height=0;
    canvas.hidden=true;$("snapDownload").disabled=true;$("snapUndo").disabled=true;
    $("snapStatus").textContent="Import a full recording, then capture a frame.";
  }};
}
