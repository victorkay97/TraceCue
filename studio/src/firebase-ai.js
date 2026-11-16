import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";

let service = null;
function initializeService() {
  if (service) return service;
  const vars = import.meta.env;
  const config = {
    apiKey:vars.VITE_FIREBASE_API_KEY,
    authDomain:vars.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:vars.VITE_FIREBASE_PROJECT_ID,
    appId:vars.VITE_FIREBASE_APP_ID
  };
  if (!config.apiKey || !config.projectId || !config.appId || !vars.VITE_APPCHECK_SITE_KEY)
    throw new Error("Configure Firebase AI Logic and App Check in studio/.env.local.");
  const app = getApps()[0] || initializeApp(config);
  initializeAppCheck(app,{
    provider:new ReCaptchaV3Provider(vars.VITE_APPCHECK_SITE_KEY),
    isTokenAutoRefreshEnabled:true
  });
  service = getAI(app,{backend:new GoogleAIBackend()});
  return service;
}
/**
 * Both paths explicitly go through Firebase AI Logic. No simulated responses.
 * For sensitive evidence, ONLY_ON_DEVICE must never silently fall back to cloud.
 */
export async function investigate(prompt,mode,progress) {
  const backend = initializeService();
  const inferenceMode = mode === "device" ? InferenceMode.ONLY_ON_DEVICE :
    mode === "cloud" ? InferenceMode.ONLY_IN_CLOUD : null;
  if (!inferenceMode) throw new Error("Unsupported inference mode.");
  const model = getGenerativeModel(backend,{mode:inferenceMode});
  if (mode === "device") {
    progress?.("Preparing Chrome local model. First-time download may be substantial.");
    // Invoked synchronously from the user's click before calling generateContent.
    await model.initializeDeviceModel(p => progress?.("Local model preparation: " + Math.round(p*100) + "%"));
  }
  const result = await model.generateContent(prompt);
  const source = result.response.inferenceSource;
  if (!source) throw new Error("SDK returned no inference-source information.");
  return {text:result.response.text(),source,mode,at:new Date().toISOString()};
}
