// Small geometry-only module to keep screenshot annotations testable.
export function annotationShape(kind,x1,y1,x2,y2,width,height){
  if(!["rectangle","arrow","mask"].includes(kind))throw Error("Unsupported annotation tool");
  const clamp=(n,max)=>Math.max(0,Math.min(max,Number(n)||0));
  if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error("Invalid frame dimensions");
  return {kind,x1:clamp(x1,width),y1:clamp(y1,height),
    x2:clamp(x2,width),y2:clamp(y2,height)};
}
export function annotationArea(shape){
  return Math.abs((shape.x2-shape.x1)*(shape.y2-shape.y1));
}
export function pointToFrame(clientX,clientY,rect,frameWidth,frameHeight){
  if(!rect?.width||!rect?.height)throw Error("Canvas has no displayed size");
  return {
    x:Math.max(0,Math.min(frameWidth,(clientX-rect.left)*frameWidth/rect.width)),
    y:Math.max(0,Math.min(frameHeight,(clientY-rect.top)*frameHeight/rect.height))
  };
}
