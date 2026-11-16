// Local-only QA session search and conservative recurrence hints.
const normalized=s=>String(s||"").toLowerCase().trim().replace(/\s+/g," ").slice(0,200);
export function sessionIssueTitles(report){
  return (report.events||[]).filter(e=>e.kind==="issue-marker")
    .map(e=>e.title||"Untitled issue");
}
export function searchSessions(reports,query=""){
  const terms=normalized(query).split(" ").filter(Boolean);
  return reports.filter(r=>{
    const searchable=normalized([r.title,r.url,r.issueTitle,
      ...sessionIssueTitles(r)].join(" "));
    return terms.every(t=>searchable.includes(t));
  }).sort((a,b)=>b.startedAt-a.startedAt);
}
export function issueFingerprint(event){
  if(!event||!["network-failure","console-error","console-exception"].includes(event.kind))return null;
  const url=normalized(event.url||"").replace(/\?.*$/,"");
  const detail=normalized(event.kind.startsWith("console-")?event.message:"")
    .replace(/\b\d{4,}\b/g,"#").slice(0,100);
  if(event.kind==="network-failure")
    return [event.kind,Number(event.status)||"?",normalized(event.method||"?"),url].join("|");
  if(!detail)return null;
  return [event.kind,detail].join("|");
}
export function recurrenceHints(current,history,max=5){
  const signals=(current.events||[]).map(issueFingerprint).filter(Boolean);
  const keys=new Set(signals);
  const results=[];
  if(!keys.size)return results;
  for(const report of history){
    if(report.id===current.id)continue;
    const matches=(report.events||[]).filter(e=>keys.has(issueFingerprint(e))).length;
    if(matches)results.push({sessionId:report.id,title:report.title||"Previous QA session",matches});
  }
  return results.sort((a,b)=>b.matches-a.matches).slice(0,max);
}
