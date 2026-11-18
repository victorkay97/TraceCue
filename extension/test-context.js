// Optional test scenario labels for one human-authorized recording.
// No passwords, cookies, tokens, account identifiers or private role grants.
const limited=(value,max)=>String(value??"").trim().slice(0,max)
 .replace(/Bearer\s+\S+/gi,"[REDACTED]")
 .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[EMAIL]")
 .replace(/(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi,"[REDACTED]");
export function normalizeTestContext(source){
  const x=source&&typeof source==="object"&&!Array.isArray(source)?source:{};
  const scenarioId=limited(x.scenarioId,48).toLowerCase();
  const tenantAlias=limited(x.tenantAlias,48).toLowerCase();
  const actorRole=limited(x.actorRole,50);
  const actorAlias=limited(x.actorAlias,60);
  if(![scenarioId,tenantAlias,actorRole,actorAlias].some(Boolean))return null;
  if(!/^[a-z0-9][a-z0-9_-]{2,47}$/.test(scenarioId))
    throw Error("Scenario ID must be 3–48 letters, numbers, - or _ (no spaces).");
  if(!/^[a-z0-9][a-z0-9_-]{1,47}$/.test(tenantAlias))
    throw Error("Tenant alias must be 2–48 letters, numbers, - or _.");
  if(!actorRole||!actorAlias)
    throw Error("Provide a role and a fictional actor alias for this scenario.");
  if(/[\r\n<>]/.test(actorRole+actorAlias))
    throw Error("Role and actor labels must be short, plain-text descriptions.");
  return {scenarioId,tenantAlias,actorRole,actorAlias};
}
export function contextLabel(context){
  if(!context)return "Unassigned standalone QA session";
  return [context.scenarioId,context.tenantAlias,context.actorRole,context.actorAlias].join(" · ");
}


// Numeric suffix retains compatibility with legacy durable IndexedDB keys
// while preventing same-millisecond collisions between different computers.
export function newRecordingId({now=Date.now(),random=globalThis.crypto}={}){
  if(!Number.isSafeInteger(now)||now<10000000000||String(now).length!==13)
    throw Error("Invalid recording timestamp");
  if(!random||typeof random.getRandomValues!=="function")
    throw Error("Secure random generator unavailable");
  const values=new Uint32Array(1);
  random.getRandomValues(values);
  return "tc-"+now+String(values[0]%10000000).padStart(7,"0");
}
