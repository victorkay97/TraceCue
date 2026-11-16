const ENGLISH_TEXT={
  expectedInputs:[{type:"text",languages:["en"]}],
  expectedOutputs:[{type:"text",languages:["en"]}]
};
export function localReadinessLabel(value){
  switch(value){
    case "available":return "Local model ready. On-device analysis can run without cloud fallback.";
    case "downloadable":return "Chrome supports local AI, but needs a model download. Starting analysis may download it.";
    case "downloading":return "Chrome is still downloading the local model.";
    case "unavailable":return "Local model is unavailable in this browser or device. Cloud AI remains optional and requires consent.";
    default:return "Local model status could not be determined. It will be checked again when you choose on-device analysis.";
  }
}
export async function checkLocalModelAvailability(modelApi){
  if(!modelApi || typeof modelApi.availability!=="function")return "unavailable";
  const status=await modelApi.availability(ENGLISH_TEXT);
  return ["available","downloadable","downloading","unavailable"].includes(status)?status:"unknown";
}
