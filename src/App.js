import { useState, useRef, useEffect, useCallback } from "react";
import emailjs from '@emailjs/browser';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase';
const BACKEND = "https://phishguard-backend-xnb1.onrender.com";

/* ── THEME ── */
const T = {
  bg: "#020408",
  surface: "rgba(255,255,255,0.03)",
  card: "rgba(6,12,24,0.9)",
  border: "rgba(0,240,255,0.08)",
  borderHover: "rgba(0,240,255,0.25)",
  red: "#ff2545",
  orange: "#ff6b00",
  green: "#00ff87",
  cyan: "#00f0ff",
  blue: "#0066ff",
  violet: "#7c3aed",
  text: "#e8f4ff",
  muted: "#3a5068",
  dim: "rgba(232,244,255,0.4)",
};

function riskColor(s){ return s>=75?T.red:s>=40?T.orange:T.green; }
function riskLabel(s){ return s>=75?{t:"CRITICAL THREAT",e:"🚨"}:s>=40?{t:"SUSPICIOUS",e:"⚠️"}:{t:"SAFE",e:"✅"}; }

/* ── MATRIX RAIN ── */
function MatrixRain(){
  const ref = useRef(null);
  useEffect(()=>{
    const c = ref.current;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const cols = Math.floor(c.width/18);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(2,4,8,0.05)";
      ctx.fillRect(0,0,c.width,c.height);
      ctx.font = "13px monospace";
      drops.forEach((y,i)=>{
        const char = chars[Math.floor(Math.random()*chars.length)];
        const x = i*18;
        const alpha = Math.random()*0.5+0.1;
        ctx.fillStyle = `rgba(0,240,255,${alpha})`;
        ctx.fillText(char, x, y*18);
        if(y*18>c.height && Math.random()>0.975) drops[i]=0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = ()=>{ c.width=window.innerWidth; c.height=window.innerHeight; };
    window.addEventListener("resize",resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,opacity:0.15,pointerEvents:"none"}}/>;
}

/* ── SCAN RING ── */
function ScanRing({score,color,size=140,sw=10}){
  const r=(size-sw)/2, circ=2*Math.PI*r, dash=(score/100)*circ;
  const [anim,setAnim]=useState(0);
  useEffect(()=>{
    let start=null;
    const step=(ts)=>{
      if(!start) start=ts;
      const p=Math.min((ts-start)/1200,1);
      setAnim(Math.floor(p*score));
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },[score]);
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={color}/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={sw}
          strokeDasharray={`${(anim/100)*circ} ${circ}`} strokeLinecap="round" filter="url(#glow)"
          style={{transition:"stroke-dasharray 0.05s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <span style={{fontSize:32,fontWeight:900,color,fontFamily:"'Share Tech Mono',monospace",
          textShadow:`0 0 30px ${color}, 0 0 60px ${color}44`}}>{anim}</span>
        <span style={{fontSize:9,color:T.muted,letterSpacing:"3px",textTransform:"uppercase"}}>RISK SCORE</span>
      </div>
    </div>
  );
}

/* ── TERMINAL LOG ── */
function TerminalLog({lines}){
  const ref=useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=ref.current.scrollHeight; },[lines]);
  return(
    <div ref={ref} style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${T.border}`,borderRadius:12,
      padding:"14px 16px",fontFamily:"'Share Tech Mono',monospace",fontSize:12,
      color:"rgba(0,240,255,0.7)",maxHeight:120,overflowY:"auto",lineHeight:1.8}}>
      {lines.map((l,i)=>(
        <div key={i} style={{opacity: i===lines.length-1?1:0.5}}>
          <span style={{color:T.muted}}>{">"} </span>{l}
          {i===lines.length-1&&<span style={{animation:"blink 1s infinite"}}>▋</span>}
        </div>
      ))}
    </div>
  );
}

/* ── CHECK ROW ── */
function CheckRow({label,status,detail,idx}){
  const color=status==="safe"?T.green:status==="warn"?T.orange:T.red;
  const icon=status==="safe"?"✓":status==="warn"?"!":"✕";
  const [show,setShow]=useState(false);
  useEffect(()=>{ setTimeout(()=>setShow(true),idx*80); },[]);
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 0",
      borderBottom:`1px solid rgba(255,255,255,0.04)`,
      opacity:show?1:0,transform:show?"none":"translateX(-10px)",
      transition:"opacity 0.4s ease, transform 0.4s ease"}}>
      <div style={{width:22,height:22,borderRadius:6,
        background:`${color}18`,border:`1px solid ${color}55`,
        display:"flex",alignItems:"center",justifyContent:"center",
        flexShrink:0,fontSize:11,color,fontWeight:900,
        fontFamily:"'Share Tech Mono',monospace",
        boxShadow:`0 0 10px ${color}33`}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:T.text,letterSpacing:"0.3px"}}>{label}</div>
        <div style={{fontSize:11,color:T.muted,marginTop:2,lineHeight:1.6}}>{detail}</div>
      </div>
      <div style={{width:6,height:6,borderRadius:"50%",background:color,
        boxShadow:`0 0 8px ${color}`,flexShrink:0,marginTop:6}}/>
    </div>
  );
}

/* ── THREAT BADGE ── */
function ThreatBadge({text,idx}){
  const [show,setShow]=useState(false);
  useEffect(()=>{ setTimeout(()=>setShow(true),idx*100+200); },[]);
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:8,
      padding:"8px 14px",margin:"0 6px 8px 0",
      background:`${T.red}0f`,border:`1px solid ${T.red}33`,
      borderRadius:8,fontSize:12,color:T.dim,
      opacity:show?1:0,transform:show?"none":"translateY(8px)",
      transition:"opacity 0.3s, transform 0.3s",
      boxShadow:`0 0 16px ${T.red}11`}}>
      <span style={{color:T.red,fontSize:14}}>⚡</span>{text}
    </div>
  );
}

/* ── HISTORY ITEM ── */
function HistoryItem({h,onSelect}){
  const score=h.risk_score||0;
  const color=riskColor(score);
  return(
    <div onClick={()=>onSelect(h)} style={{display:"flex",alignItems:"center",gap:12,
      padding:"10px 14px",background:T.surface,
      border:`1px solid ${T.border}`,borderRadius:10,
      cursor:"pointer",marginBottom:6,transition:"border-color 0.2s, background 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;e.currentTarget.style.background="rgba(0,240,255,0.04)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surface;}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:color,
        boxShadow:`0 0 8px ${color}`,flexShrink:0}}/>
      <div style={{flex:1,fontSize:12,color:T.dim,overflow:"hidden",
        textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Share Tech Mono',monospace"}}>{h.url}</div>
      <div style={{fontSize:13,fontWeight:700,color,fontFamily:"'Share Tech Mono',monospace",
        textShadow:`0 0 8px ${color}44`}}>{score}</div>
    </div>
  );
}

/* ── STATS ── */
function StatsBar({history}){
  if(!history.length) return null;
  const total=history.length;
  const high=history.filter(h=>(h.risk_score||0)>=75).length;
  const susp=history.filter(h=>(h.risk_score||0)>=40&&(h.risk_score||0)<75).length;
  const safe=history.filter(h=>(h.risk_score||0)<40).length;
  const avg=Math.round(history.reduce((a,h)=>a+(h.risk_score||0),0)/total);
  return(
    <div style={{margin:"20px 0 0",background:T.card,border:`1px solid ${T.border}`,
      borderRadius:16,padding:"16px 20px",backdropFilter:"blur(20px)"}}>
      <div style={{fontSize:10,color:T.muted,letterSpacing:"3px",
        textTransform:"uppercase",marginBottom:14,fontFamily:"'Share Tech Mono',monospace"}}>
        SESSION STATISTICS
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[
          {val:total,label:"TOTAL",color:T.cyan},
          {val:high,label:"CRITICAL",color:T.red},
          {val:susp,label:"SUSPICIOUS",color:T.orange},
          {val:safe,label:"SAFE",color:T.green},
          {val:avg,label:"AVG SCORE",color:T.violet},
        ].map(s=>(
          <div key={s.label} style={{flex:1,minWidth:70,textAlign:"center",
            padding:"10px 6px",background:"rgba(255,255,255,0.02)",
            border:`1px solid rgba(255,255,255,0.05)`,borderRadius:10}}>
            <div style={{fontSize:24,fontWeight:900,color:s.color,
              fontFamily:"'Share Tech Mono',monospace",
              textShadow:`0 0 20px ${s.color}55`}}>{s.val}</div>
            <div style={{fontSize:9,color:T.muted,marginTop:4,letterSpacing:"1.5px"}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SCAN LOGS ── */
const LOG_STEPS = [
  "Initializing PhishGuard AI engine...",
  "Resolving domain and DNS records...",
  "Checking SSL/TLS certificate...",
  "Fetching page content...",
  "Analysing HTML structure...",
  "Running XSS pattern detection...",
  "Running SQL injection scan...",
  "Checking domain registration age...",
  "Querying Gemini AI model...",
  "Generating risk assessment...",
  "Compiling threat report...",
];

/* ── MAIN APP ── */
export default function App(){
  const [url,setUrl]=useState("");
  const [compareUrl,setCompareUrl]=useState("");
const [compareResult,setCompareResult]=useState(null);
const [compareMode,setCompareMode]=useState(false);
const [user,setUser]=useState(null);
const [showAuth,setShowAuth]=useState(false);
const [authMode,setAuthMode]=useState("login");
const [authEmail,setAuthEmail]=useState("");
const [authPassword,setAuthPassword]=useState("");
const [authError,setAuthError]=useState("");
  const [scanning,setScanning]=useState(false);
  const [result,setResult]=useState(null);
  const [logs,setLogs]=useState([]);
  const [progress,setProgress]=useState(0);
  const [activeTab,setActiveTab]=useState("overview");
  const [history,setHistory]=useState(()=>{
    try{ const s=localStorage.getItem("phishguard_history"); return s?JSON.parse(s):[]; }
    catch{ return []; }
  });
  const inputRef=useRef(null);
  const logRef=useRef(0);
  const handleEmailReport = async () => {
    const email = prompt("Enter your email address:");
    if (!email) return;
    try {
      await emailjs.send(
        "service_qpflyvh",
        "template_h7a0z9c",
        {
          url: result.url,
          score: result.risk_score || 0,
          level: result.risk_level || "",
          severity: result.severity || "LOW",
          summary: result.summary || "",
          threats: (result.vulnerabilities || []).join(", "),
          time: new Date().toLocaleString(),
          to_email: email,
        },
        "shj70a9_m3esIUi97"
      );
      alert("✅ Report sent to " + email);
    } catch (error) {
      alert("❌ Failed to send email. Try again!");
    }
  };
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return ()=>unsub();
  },[]);

  const handleLogin = async () => {
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuth(false);
    } catch(e) {
      setAuthError(e.message);
    }
  };

  const handleSignup = async () => {
    setAuthError("");
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuth(false); } catch(e) {
      setAuthError(e.message);
    }
  };
    }
  const handleCompare = async () => {
    if (!compareUrl.trim()) return;
    setScanning(true);
    try {
      const response = await fetch(`${BACKEND}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: compareUrl.trim() })
      });
      const data = await response.json();
      setCompareResult(data);
    } catch (error) {
      alert("Could not scan compare URL!");
    }
    setScanning(false);
  };
  const handleScan=useCallback(async()=>{
    if(!url.trim()||scanning) return;
    setScanning(true); setResult(null); setProgress(0);
    setLogs([LOG_STEPS[0]]); setActiveTab("overview"); logRef.current=0;

    let p=0;
    const iv=setInterval(()=>{
      p+=Math.random()*8;
      if(p>=90) p=90;
      setProgress(p);
      logRef.current=Math.min(logRef.current+1, LOG_STEPS.length-1);
      setLogs(prev=>[...prev.slice(-6), LOG_STEPS[logRef.current]]);
    },400);

    try{
      const res=await fetch(`${BACKEND}/scan`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({url:url.trim()})
      });
      const data=await res.json();
      clearInterval(iv);
      setProgress(100);
      setLogs(prev=>[...prev.slice(-6),"✓ Scan complete. Threat report ready."]);
      setTimeout(()=>{ setScanning(false); setResult(data);
        setHistory(prev=>{
          const u=[data,...prev.filter(h=>h.url!==url.trim())].slice(0,10);
          localStorage.setItem("phishguard_history",JSON.stringify(u));
          return u;
        });
      },600);
    }catch(e){
      clearInterval(iv);
      setScanning(false);
      setLogs(["✕ Connection failed. Backend unreachable."]);
    }
  },[url,scanning]);

  const handleDownloadReport=async()=>{
    try{
      const res=await fetch(`${BACKEND}/report`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(result)
      });
      const blob=await res.blob();
      const blobUrl=window.URL.createObjectURL(new Blob([blob],{type:"application/pdf"}));
      window.open(blobUrl,"_blank");
    }catch{ alert("Report generation failed. Try again!"); }
  };

  const score=result?(result.risk_score||0):0;
  const rc=result?riskColor(score):T.cyan;
  const rl=result?riskLabel(score):null;

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",
      color:T.text,maxWidth:800,margin:"0 auto",paddingBottom:100,position:"relative"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#020408;}
        input::placeholder{color:#1a3048;}
        input:focus{outline:none;}
        button:active{transform:scale(0.96)!important;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes shine{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes scanLine{0%{top:0}100%{top:100%}}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1a3048;border-radius:4px;}
      `}</style>

      <MatrixRain/>
      
{showAuth&&(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)"}}>
    <div style={{background:"rgba(10,10,24,0.98)",border:"1px solid rgba(0,240,255,0.3)",borderRadius:28,padding:"32px 24px",width:"100%",maxWidth:360,boxShadow:"0 0 60px rgba(0,240,255,0.1)"}}>
      <div style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>{authMode==="login"?"Welcome Back":"Create Account"}</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:24}}>PhishGuard AI — {authMode==="login"?"Sign in to continue":"Join to save your scans"}</div>
      <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="Email address"
        style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:T.text,fontSize:14,marginBottom:10,fontFamily:"inherit",outline:"none"}}/>
      <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Password"
        style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:T.text,fontSize:14,marginBottom:10,fontFamily:"inherit",outline:"none"}}/>
      {authError&&<div style={{fontSize:12,color:T.red,marginBottom:10}}>{authError}</div>}
      <button onClick={authMode==="login"?handleLogin:handleSignup} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:"linear-gradient(135deg,#7c3aed,#00f0ff)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",marginBottom:10}}>
        {authMode==="login"?"Sign In":"Sign Up"}
      </button>
      <div style={{textAlign:"center",fontSize:12,color:T.muted}}>
        {authMode==="login"?"Don't have an account? ":"Already have an account? "}
        <span onClick={()=>setAuthMode(authMode==="login"?"signup":"login")} style={{color:"#00f0ff",cursor:"pointer",fontWeight:600}}>
          {authMode==="login"?"Sign Up":"Sign In"}
        </span>
      </div>
      <button onClick={()=>setShowAuth(false)} style={{width:"100%",marginTop:10,padding:10,borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:T.muted,cursor:"pointer",fontSize:13}}>Cancel</button>
    </div>
  </div>
)}

      {/* ── HEADER ── */}
      <div style={{position:"sticky",top:0,zIndex:100,
        background:"linear-gradient(180deg,rgba(2,4,8,0.98) 0%,rgba(2,4,8,0.9) 100%)",
        backdropFilter:"blur(30px)",borderBottom:`1px solid ${T.border}`,
        padding:"40px 28px 24px"}}>

        {/* Top glow line */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${T.cyan},${T.blue},${T.cyan},transparent)`,
          opacity:0.6}}/>

        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
          {/* Logo */}
          <div style={{position:"relative",width:48,height:48,animation:"float 4s ease-in-out infinite"}}>
            <div style={{position:"absolute",inset:0,borderRadius:14,
              background:`linear-gradient(135deg,${T.cyan},${T.blue})`,opacity:0.15,
              boxShadow:`0 0 30px ${T.cyan}44`}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:22,
              filter:`drop-shadow(0 0 12px ${T.cyan})`}}>🛡️</div>
          </div>

          {/* Title */}
          <div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:22,fontWeight:400,
              background:`linear-gradient(270deg,${T.cyan},${T.blue},#fff,${T.cyan})`,
              backgroundSize:"300% auto",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              letterSpacing:"3px",animation:"shine 5s linear infinite"}}>
              PHISHGUARD<span style={{color:T.cyan}}>::</span>AI
            </div>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"2.5px",
              textTransform:"uppercase",marginTop:3,fontFamily:"'Share Tech Mono',monospace"}}>
              ADVANCED THREAT INTELLIGENCE SYSTEM
            </div>
          </div>

          {/* Status badge */}
          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",
            alignItems:"flex-end",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,
              padding:"6px 14px",
              background:"rgba(0,255,135,0.06)",
              border:`1px solid rgba(0,255,135,0.2)`,borderRadius:6,
              fontFamily:"'Share Tech Mono',monospace"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.green,
                animation:"pulse 2s infinite",boxShadow:`0 0 10px ${T.green}`}}/>
              <span style={{fontSize:11,color:T.green,letterSpacing:"1.5px"}}>SYSTEM ONLINE</span>
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.15)",
              fontFamily:"'Share Tech Mono',monospace",letterSpacing:"1px"}}>
              by <span style={{color:T.cyan}}>osho</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:12,
            background:"rgba(0,240,255,0.03)",
            border:`1px solid ${scanning?T.cyan:result?rc:T.border}`,
            borderRadius:10,padding:"13px 18px",
            transition:"border-color 0.3s, box-shadow 0.3s",
            boxShadow:scanning?`0 0 20px ${T.cyan}22`:result?`0 0 20px ${rc}22`:"none"}}>
            <span style={{fontFamily:"'Share Tech Mono',monospace",
              color:T.muted,fontSize:14}}>URL://</span>
            <input ref={inputRef} value={url}
              onChange={e=>setUrl(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleScan()}
              placeholder="enter target url to analyse..."
              style={{flex:1,background:"none",border:"none",color:T.text,
                fontSize:14,fontFamily:"'Share Tech Mono',monospace",
                fontWeight:400,letterSpacing:"0.5px"}}/>
            {url&&<button onClick={()=>{setUrl("");setResult(null);}}
              style={{background:"none",border:"none",color:T.muted,
                cursor:"pointer",fontSize:18,padding:0,lineHeight:1,
                fontFamily:"'Share Tech Mono',monospace"}}>×</button>}
          </div>
          <button onClick={handleScan} disabled={scanning||!url.trim()} style={{
            padding:"13px 24px",borderRadius:10,border:`1px solid ${T.cyan}44`,
            background:scanning?"rgba(0,240,255,0.05)":`linear-gradient(135deg,${T.cyan}22,${T.blue}22)`,
            color:scanning?T.cyan:T.cyan,
            fontWeight:700,fontSize:13,cursor:scanning?"not-allowed":"pointer",
            fontFamily:"'Share Tech Mono',monospace",letterSpacing:"1.5px",
            boxShadow:scanning?"none":`0 0 20px ${T.cyan}22`,
            whiteSpace:"nowrap",minWidth:120,transition:"all 0.3s",
            textTransform:"uppercase"}}>
            {scanning?(
              <span style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{display:"inline-block",width:12,height:12,
                  border:`2px solid ${T.cyan}`,borderTopColor:"transparent",
                  borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                SCANNING
              </span>
            ):"[ SCAN ]"}
          </button>
          {compareMode&&(
  <div style={{display:"flex",gap:10,marginTop:10}}>
    <div style={{flex:1,display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(0,240,255,0.3)",borderRadius:16,padding:"13px 18px"}}>
      <span style={{fontSize:16}}>🔗</span>
      <input value={compareUrl} onChange={e=>setCompareUrl(e.target.value)}
        placeholder="Enter second URL to compare"
        style={{flex:1,background:"none",border:"none",color:T.text,fontSize:14,fontFamily:"inherit"}}/>
    </div>
    <button onClick={handleCompare} disabled={scanning||!compareUrl.trim()} style={{padding:"13px 22px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#7c3aed,#00f0ff)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
      Compare
    </button>
  </div>
)}
<button onClick={()=>setCompareMode(p=>!p)} style={{marginTop:8,padding:"6px 16px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
  {compareMode?"✕ Cancel Compare":"⚡ Compare Two URLs"}
</button>
        </div>

        {/* Progress */}
        {scanning&&(
          <div style={{marginTop:12}}>
            <div style={{height:2,background:"rgba(255,255,255,0.04)",
              borderRadius:2,overflow:"hidden",marginBottom:10}}>
              <div style={{height:"100%",width:`${progress}%`,
                background:`linear-gradient(90deg,${T.cyan},${T.blue})`,
                transition:"width 0.3s",
                boxShadow:`0 0 10px ${T.cyan}`}}/>
            </div>
            <TerminalLog lines={logs}/>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:"24px 28px 0",position:"relative",zIndex:1}}>

        {/* Result */}
        {result&&(
          <div style={{animation:"fadeUp 0.5s cubic-bezier(.34,1.2,.64,1)"}}>

            {/* Risk card */}
            <div style={{background:T.card,border:`1px solid ${rc}33`,
              borderRadius:16,padding:"24px",marginBottom:20,
              position:"relative",overflow:"hidden",backdropFilter:"blur(30px)",
              boxShadow:`0 0 60px ${rc}11, inset 0 1px 0 rgba(255,255,255,0.05)`}}>

              {/* Corner accent */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${rc}88,${rc},${rc}88,transparent)`}}/>
              <div style={{position:"absolute",top:-60,right:-60,width:180,height:180,
                borderRadius:"50%",background:`radial-gradient(circle,${rc}18 0%,transparent 70%)`,
                pointerEvents:"none"}}/>

              <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
                <ScanRing score={score} color={rc}/>

                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <span style={{fontSize:24}}>{rl.e}</span>
                    <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:score>=85?"#ff000033":score>=65?"#ff3b5733":score>=40?"#ff8c0033":"#00ff8733",color:score>=85?"#ff0000":score>=65?"#ff3b57":score>=40?"#ff8c00":"#00ff87",border:`1px solid ${score>=85?"#ff0000":score>=65?"#ff3b57":score>=40?"#ff8c00":"#00ff87"}`,marginLeft:8}}>{result.severity||"LOW"}</span>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",
                      fontSize:20,fontWeight:400,color:rc,
                      textShadow:`0 0 30px ${rc}`,letterSpacing:"2px"}}>{rl.t}</span>
                  </div>
                  <div style={{fontSize:13,color:T.dim,lineHeight:1.8,
                    marginBottom:14,maxWidth:420}}>{result.summary}</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",
                    fontSize:11,color:T.muted,wordBreak:"break-all",
                    marginBottom:16}}>TARGET: {result.url}</div>

                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <button onClick={handleDownloadReport} style={{
                      padding:"9px 18px",borderRadius:8,border:`1px solid ${T.cyan}44`,
                      background:`${T.cyan}0f`,color:T.cyan,
                      fontFamily:"'Share Tech Mono',monospace",
                      fontWeight:400,fontSize:12,cursor:"pointer",
                      letterSpacing:"1px",textTransform:"uppercase",
                      boxShadow:`0 0 16px ${T.cyan}22`,transition:"all 0.2s"}}>
                      ↓ EXPORT REPORT
                    </button>
                    <button onClick={handleEmailReport} style={{marginTop:8,marginLeft:8,padding:"10px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7c3aed,#00f0ff)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
  📧 Email Report
</button>
                    <div style={{display:"flex",gap:8}}>
                      {[
                        {label:"HTTPS",val:result.has_https?"ON":"OFF",c:result.has_https?T.green:T.red},
                        {label:"DOMAIN AGE",val:result.domain_age>0?`${result.domain_age}d`:"?",
                          c:result.domain_age>30?T.green:T.orange},
                      ].map(b=>(
                        <div key={b.label} style={{padding:"8px 12px",
                          background:"rgba(255,255,255,0.03)",
                          border:"1px solid rgba(255,255,255,0.06)",
                          borderRadius:8,textAlign:"center"}}>
                          <div style={{fontSize:13,fontWeight:700,color:b.c,
                            fontFamily:"'Share Tech Mono',monospace"}}>{b.val}</div>
                          <div style={{fontSize:9,color:T.muted,letterSpacing:"1px",marginTop:2}}>{b.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:2,marginBottom:16,
              background:"rgba(255,255,255,0.02)",
              border:`1px solid ${T.border}`,
              borderRadius:10,padding:4}}>
              {["overview","threats","intel"].map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                  flex:1,padding:"9px 0",borderRadius:7,border:"none",
                  background:activeTab===tab?`${T.cyan}12`:"none",
                  color:activeTab===tab?T.cyan:T.muted,
                  fontFamily:"'Share Tech Mono',monospace",
                  fontWeight:400,fontSize:12,cursor:"pointer",
                  letterSpacing:"1.5px",textTransform:"uppercase",
                  transition:"all 0.2s",
                  borderBottom:activeTab===tab?`1px solid ${T.cyan}44`:"1px solid transparent"}}>
                  {tab==="overview"?"[ CHECKS ]":tab==="threats"?"[ THREATS ]":"[ INTEL ]"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,
              borderRadius:14,padding:"18px 20px",backdropFilter:"blur(20px)"}}>

              {activeTab==="overview"&&(
                <>
                  <div style={{fontSize:10,color:T.muted,letterSpacing:"3px",
                    textTransform:"uppercase",marginBottom:14,
                    fontFamily:"'Share Tech Mono',monospace"}}>SECURITY CHECKS</div>
                  {(result.checks||[]).map((c,i)=><CheckRow key={i} idx={i} {...c}/>)}
                </>
              )}

              {activeTab==="threats"&&(
                <>
                  <div style={{fontSize:10,color:T.muted,letterSpacing:"3px",
                    textTransform:"uppercase",marginBottom:14,
                    fontFamily:"'Share Tech Mono',monospace"}}>DETECTED THREATS</div>
                  <div style={{display:"flex",flexWrap:"wrap"}}>
                    {(result.vulnerabilities||[]).length===0?(
                      <div style={{color:T.green,fontFamily:"'Share Tech Mono',monospace",
                        fontSize:13}}>✓ NO THREATS DETECTED</div>
                    ):(result.vulnerabilities||[]).map((v,i)=>(
                      <ThreatBadge key={i} text={v} idx={i}/>
                    ))}
                  </div>
                </>
              )}

           {activeTab==="intel"&&(
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px 20px"}}>
    <div style={{fontSize:11,color:T.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14,fontWeight:600}}>Technical Details</div>
    {[
      {label:"URL Scanned",value:result.url},
      {label:"Risk Score",value:`${score}/100`},
    {label:"Risk Level",value:riskLabel(score).t||"Unknown"},
      {label:"HTTPS",value:result.has_https?"Yes ✓":"No ✕"},
      {label:"Domain Age",value:result.domain_age>0?`${result.domain_age} days`:"Unknown"},
      {label:"Threats Found",value:(result.vulnerabilities||[]).length},
      {label:"Pages Crawled",value:(result.crawl_data?.pages_crawled||[]).length},
      {label:"Forms Found",value:(result.crawl_data?.forms||[]).length},
      {label:"Subdomains",value:(result.subdomains||[]).join(", ")||"None found"},
      {label:"Open Ports",value:(result.open_ports||[]).join(", ")||"None detected"},
      {label:"Tech Stack",value:(result.tech_stack||[]).join(", ")||"Unknown"},
      {label:"DNS Records",value:Object.keys(result.dns_records||{}).join(", ")||"None"},
      {label:"Scan Time",value:new Date().toLocaleTimeString()},
    ].map((row,i)=>(
      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<12?`1px solid ${T.border}`:"none"}}>
        <span style={{fontSize:13,color:T.muted}}>{row.label}</span>
        <span style={{fontSize:13,color:T.text,fontWeight:600,maxWidth:"60%",textAlign:"right",wordBreak:"break-all"}}>{row.value}</span>
      </div>
    ))}
  </div>
)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result&&!scanning&&(
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:64,marginBottom:20,
              animation:"float 4s ease-in-out infinite",
              filter:`drop-shadow(0 0 30px ${T.cyan}66)`}}>🛡️</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",
              fontSize:13,color:"rgba(0,240,255,0.2)",
              letterSpacing:"4px",marginBottom:10}}>AWAITING TARGET</div>
            <div style={{fontSize:14,color:T.muted,lineHeight:2}}>
              Enter any URL to run a full threat analysis
            </div>
            <div style={{display:"flex",justifyContent:"center",
              gap:10,marginTop:32,flexWrap:"wrap"}}>
              {["SSL CHECK","XSS SCAN","SQL INJECT","DOMAIN AGE","AI ANALYSIS","PDF EXPORT"].map(f=>(
                <div key={f} style={{padding:"7px 14px",
                  background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:6,fontSize:10,color:T.muted,
                  fontFamily:"'Share Tech Mono',monospace",
                  letterSpacing:"1.5px"}}>[ {f} ]</div>
              ))}
            </div>
            <button onClick={user?handleLogout:()=>setShowAuth(true)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid rgba(0,240,255,0.3)",background:"none",color:"#00f0ff",fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:"inherit",marginBottom:8}}>
  {user?`👤 ${user.email.split("@")[0]} | Logout`:"🔐 Login"}
</button>
            <div style={{marginTop:40,fontSize:10,
              color:"rgba(255,255,255,0.08)",
              fontFamily:"'Share Tech Mono',monospace",letterSpacing:"2px"}}>
              BUILT BY <span style={{color:T.cyan}}>OSHO</span> // PHISHGUARD AI v2.0
            </div>
          </div>
        )}
{compareResult&&result&&(
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px 20px",marginTop:20}}>
    <div style={{fontSize:11,color:T.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14,fontWeight:600}}>URL Comparison</div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      {[
        {url:result.url,score:result.risk_score||0,severity:result.severity||"LOW"},
        {url:compareResult.url,score:compareResult.risk_score||0,severity:compareResult.severity||"LOW"},
      ].map((r,i)=>(
        <div key={i} style={{flex:1,minWidth:200,padding:"14px",background:"rgba(255,255,255,0.02)",border:`1px solid ${riskColor(r.score)}44`,borderRadius:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8,wordBreak:"break-all"}}>{r.url}</div>
          <div style={{fontSize:32,fontWeight:800,color:riskColor(r.score)}}>{r.score}</div>
          <div style={{fontSize:11,color:riskColor(r.score),marginTop:4}}>{r.severity}</div>
        </div>
      ))}
    </div>
    <div style={{marginTop:12,fontSize:13,color:T.muted,textAlign:"center"}}>
      {(result.risk_score||0)>(compareResult.risk_score||0)?
        `⚠ ${result.url} is more dangerous`:
        (compareResult.risk_score||0)>(result.risk_score||0)?
        `⚠ ${compareResult.url} is more dangerous`:
        "✓ Both URLs have equal risk levels"}
    </div>
  </div>
)}
        <StatsBar history={history}/>

        {history.length>0&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"3px",
              textTransform:"uppercase",marginBottom:10,
              fontFamily:"'Share Tech Mono',monospace"}}>SCAN HISTORY</div>
            {history.slice(0,5).map((h,i)=>(
              <HistoryItem key={i} h={h} onSelect={r=>{
                setResult(r);setUrl(r.url);setActiveTab("overview");
              }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
