/* Private case portal. No data is loaded until server-enforced auth/RLS verification. */
const config=window.MLW_PORTAL||{}, $=id=>document.getElementById(id);
const setStatus=s=>{$("notice").textContent=s;};
let db,session,matters=[],activeId;
const show=(id,on)=>$(id).classList.toggle("hidden",!on);
function node(tag,txt,cls){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function empty(id,message){$(id).replaceChildren(node("p",message,"subtle"));}
if(config.enabled===true && /^https:\/\//.test(config.supabaseUrl||"") && typeof config.supabaseAnonKey==="string" && config.supabaseAnonKey.length>20){
 try{const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
 db=createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 show("unconfigured",false);show("signin",true);
 await auth();
 db.auth.onAuthStateChange((_event)=>{queueMicrotask(auth);});
 }catch(_){setStatus("Authentication library unavailable. Private access remains closed.");}
}else{setStatus("Portal disabled until a secure backend is configured and tested.");}
async function auth(){
 if(!db)return;
 try{const{data,error}=await db.auth.getUser();if(error)throw error;const user=data.user;
 if(!user){session=null;show("workspace",false);show("matter",false);show("logout",false);$("identity").textContent="Not signed in";return;}
 session=user;show("logout",true);$("identity").textContent="Signed in: "+(user.email||"verified account");
 // A signed-in user is NOT automatically an approved case user.
 await loadMatters();
 }catch(_){setStatus("Unable to verify account. Matter data stays inaccessible.");}
}
$("google").addEventListener("click",async()=>{
 if(!db)return;const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+"/secure-portal/"}});if(error)setStatus("Google sign-in not available; verify OAuth provider configuration.");
});
$("logout").addEventListener("click",async()=>{if(!db)return;await db.auth.signOut();session=null;matters=[];show("workspace",false);show("matter",false);setStatus("Signed out.");});
async function loadMatters(){
 if(!db||!session)return;
 const {data,error}=await db.from("matters").select("id,title,internal_ref,court,case_number,stage,status,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){show("workspace",false);setStatus("Matter access not available. Ask the chambers to approve your account.");return;}
 matters=data||[];show("workspace",true);show("matter",false);setStatus(matters.length?"Only your authorised matters are listed.":"No authorised matters have been assigned to this account.");renderMatters();
}
function renderMatters(){
 const q=$("filter").value.trim().toLowerCase(),sort=$("sort").value;
 const rows=matters.filter(m=>[m.title,m.internal_ref,m.court,m.case_number].some(v=>String(v||"").toLowerCase().includes(q)));
 rows.sort((a,b)=>sort==="title"?String(a.title).localeCompare(String(b.title)):String(b.created_at).localeCompare(String(a.created_at)));
 $("matters").replaceChildren();if(!rows.length){empty("matters","No matching authorised matters.");return;}
 for(const m of rows){const b=node("button",undefined,"item");b.type="button";b.append(node("strong",m.title||"Untitled matter"),node("div",[m.internal_ref,m.court,m.case_number,m.status].filter(Boolean).join(" · "),"tag"));b.addEventListener("click",()=>openMatter(m.id));$("matters").append(b);}
}
$("filter").addEventListener("input",renderMatters);$("sort").addEventListener("change",renderMatters);$("reload").addEventListener("click",loadMatters);$("back").addEventListener("click",()=>{show("matter",false);show("workspace",true);});
async function openMatter(id){
 if(!db||!session||!matters.some(m=>m.id===id))return;
 activeId=id;const m=matters.find(x=>x.id===id);
 $("matter-title").textContent=m.title||"Matter";
 $("matter-meta").textContent=[m.internal_ref,m.court,m.case_number,m.stage,m.status].filter(Boolean).join(" · ");
 show("workspace",false);show("matter",true);
 for(const k of ["docs","events","notes"])empty(k,"Loading authorised records…");
 const results=await Promise.allSettled([
 db.from("case_documents").select("id,display_name,doc_type,created_at").eq("matter_id",id).order("created_at",{ascending:false}).limit(100),
 db.from("case_events").select("id,event_type,event_at,note,verified").eq("matter_id",id).order("event_at",{ascending:true}).limit(100),
 db.from("case_notes").select("id,content,created_at").eq("matter_id",id).order("created_at",{ascending:false}).limit(100)]);
 if(activeId!==id)return;
 const targets=["docs","events","notes"];
 results.forEach((r,i)=>{
 const target=targets[i];if(r.status!=="fulfilled"||r.value.error){empty(target,i===2?"Internal notes restricted or unavailable.":"Records unavailable.");return;}
 const rows=r.value.data||[];$(target).replaceChildren();if(!rows.length){empty(target,"No authorised records.");return;}
 rows.forEach(v=>{const p=node("p");if(i===0)p.textContent=[v.display_name,v.doc_type].filter(Boolean).join(" · ");if(i===1)p.textContent=[v.event_type,new Date(v.event_at).toLocaleString("en-IN"),v.note].filter(Boolean).join(" · ");if(i===2)p.textContent=v.content;$(target).append(p);});
 });
}
