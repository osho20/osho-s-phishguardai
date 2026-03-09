import { useState, useRef } from "react";

const C = {
  bg: "#060810", card: "rgba(10,13,25,0.85)", border: "rgba(255,255,255,0.06)",
  red: "#ff3b57", orange: "#ff8c00", green: "#00e87a", blue: "#0ea5ff",
  text: "#eef0ff", muted: "#4a4f6e", surface: "rgba(255,255,255,0.03)",
};

function getRiskColor(s){ return s>=75?C.red:s>=40?C.orange:C.green; }
function getRiskLabel(s){ return s>=75?{label:"HIGH RISK",emoji:"🚨"}:s>=40?{label:"SUSPICIOUS",emoji:"⚠️"}:{label:"SAFE",emoji:"✅"}; }

function Orbs(){
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",width:500,height:500,top:"-15%",left:"-10%",borderRadius:"50%",background:"radial-gradient(circle,#ff3b57 0%,transparent 70%)",opacity:0.07,filter:"blur(60px)",animation:"o0 20s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",width:400,height:400,top:"20%",right:"-10%",borderRadius:"50%",background:"radial-gradient(circle,#0ea5ff 0%,transparent 70%)",opacity:0.08,filter:"blur(60px)",animation:"o1 25s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",width:350,height:350,bottom:"-5%",left:"30%",borderRadius:"50%",background:"radial-gradient(circle,#00e87a 0%,transparent 70%)",opacity:0.06,filter:"blur(60px)",animation:"o2 18s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",backgroundSize:"52px 52px"}}/>
    </div>
  );
}

function RiskGauge({score,color}){
  const r=54,sw=8,circ=2*Math.PI*r,dash=(score/100)*circ;
  return(
    <div style={{position:"relative",width:130,height:130}}>
      <svg width={130} height={130} style={{transform:"rotate(-90deg)",filter:`drop-shadow(0 0 12px ${color}66)`}}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:28,fontWeight:800,color,fontFamily:"'Orbitron',sans-serif",textShadow:`0 0 20px ${color}88`}}>{score}</span>
        <span style={{fontSize:9,color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginTop:2}}>Risk Score</span>
      </div>
    </div>
  );
}

function CheckItem({label,status,detail}){
  const color=status==="safe"?C.green:status==="warn"?C.orange:C.red;
  const icon=status==="safe"?"✓":status==="warn"?"⚠":"✕";
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:24,height:24,borderRadius:8,background:`${color}18`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color,fontWeight:700}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>{label}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.5}}>{detail}</div>
      </div>
    </div>
  );
}

function ScanHistory({history,onSelect}){
  if(!history.length)return null;
  return(
    <div style={{marginTop:24}}>
      <div style={{fontSize:11,color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Recent Scans</div>
      {history.slice(0,5).map((h,i)=>{
        const color=getRiskColor(h.risk_score||h.score||0);
        return(
          <div key={i} onClick={()=>onSelect(h)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,cursor:"pointer",marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`,flexShrink:0}}/>
            <div style={{flex:1,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.url}</div>
            <div style={{fontSize:12,fontWeight:700,color,flexShrink:0}}>{h.risk_score||h.score||0}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App(){
  const [url,setUrl]=useState("");
  const [scanning,setScanning]=useState(false);
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState([]);
  const [progress,setProgress]=useState(0);
  const [activeTab,setActiveTab]=useState("overview");
  const inputRef=useRef(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true); setResult(null); setProgress(0); setActiveTab("overview");

    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 90) p = 90;
      setProgress(p);
    }, 200);

    try {
      const response = await fetch("http://127.0.0.1:5000/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await response.json();
      clearInterval(iv);
      setProgress(100);
      setTimeout(() => {
        setScanning(false);
        setResult(data);
        setHistory(prev => [data, ...prev.filter(h => h.url !== url.trim())]);
      }, 400);
    } catch (error) {
      clearInterval(iv);
      setScanning(false);
      alert("Backend not running! Make sure python app.py is running in Shell 1");
    }
  };

  const score = result ? (result.risk_score || result.score || 0) : 0;
  const riskColor = result ? getRiskColor(score) : C.blue;
  const riskInfo = result ? getRiskLabel(score) : null;

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:C.text,maxWidth:720,margin:"0 auto",paddingBottom:80,position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#060810;}
        input::placeholder{color:#2a2f4e;}
        input:focus{outline:none;}
        button:active{transform:scale(0.97)!important;}
        @keyframes o0{from{transform:translate(0,0)}to{transform:translate(40px,30px) scale(1.1)}}
        @keyframes o1{from{transform:translate(0,0)}to{transform:translate(-30px,40px) scale(0.9)}}
        @keyframes o2{from{transform:translate(0,0)}to{transform:translate(20px,-30px) scale(1.05)}}
        @keyframes scanPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:0;}
      `}</style>

      <Orbs/>

      {/* HEADER */}
      <div style={{position:"relative",zIndex:10,padding:"40px 24px 28px",borderBottom:`1px solid ${C.border}`,background:"linear-gradient(180deg,rgba(6,8,16,0.98) 0%,rgba(6,8,16,0.85) 100%)",backdropFilter:"blur(20px)"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#ff3b57,#0ea5ff,#00e87a,transparent)",opacity:0.8}}/>

        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
          <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#ff3b57,#0ea5ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 24px rgba(255,59,87,0.4)"}}>🛡️</div>
          <div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,background:"linear-gradient(135deg,#fff,#ff3b57,#0ea5ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"1px"}}>PhishGuard AI</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase"}}>Web Phishing & Vulnerability Detector</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(0,232,122,0.08)",border:"1px solid rgba(0,232,122,0.2)",borderRadius:20}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 8px ${C.green}`,animation:"scanPulse 2s infinite"}}/>
              <span style={{fontSize:11,color:C.green,fontWeight:600}}>AI ONLINE</span>
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>
              crafted by <span style={{background:"linear-gradient(90deg,#ff3b57,#0ea5ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,fontStyle:"normal"}}>osho</span>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:`1px solid ${scanning?C.blue:result?riskColor:"rgba(255,255,255,0.1)"}`,borderRadius:16,padding:"13px 18px",transition:"border-color 0.3s"}}>
            <span style={{fontSize:16}}>🔗</span>
            <input ref={inputRef} value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleScan()}
              placeholder="Enter URL to scan (e.g. https://example.com)"
              style={{flex:1,background:"none",border:"none",color:C.text,fontSize:14,fontFamily:"inherit",fontWeight:500}}/>
            {url&&<button onClick={()=>{setUrl("");setResult(null);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:0,lineHeight:1}}>×</button>}
          </div>
          <button onClick={handleScan} disabled={scanning||!url.trim()} style={{padding:"13px 22px",borderRadius:16,border:"none",background:scanning?"rgba(14,165,255,0.15)":`linear-gradient(135deg,#ff3b57,#0ea5ff)`,color:scanning?C.blue:"#fff",fontWeight:800,fontSize:14,cursor:scanning?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:scanning?"none":"0 0 24px rgba(255,59,87,0.35)",whiteSpace:"nowrap",minWidth:100,transition:"all 0.3s"}}>
            {scanning?(
              <span style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{display:"inline-block",width:14,height:14,border:`2px solid ${C.blue}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                Scanning
              </span>
            ):"Scan URL"}
          </button>
        </div>

        {scanning&&(
          <div style={{marginTop:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,color:C.blue,fontWeight:600}}>
                {progress<30?"🔍 Fetching page content...":progress<60?"🤖 Running AI analysis...":progress<90?"🛡️ Checking vulnerabilities...":"📊 Generating report..."}
              </span>
              <span style={{fontSize:11,color:C.muted}}>{Math.round(progress)}%</span>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:4}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#ff3b57,#0ea5ff)",borderRadius:4,transition:"width 0.2s",boxShadow:"0 0 12px rgba(14,165,255,0.5)"}}/>
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{padding:"24px 24px 0",position:"relative",zIndex:1}}>
        {result&&(
          <div style={{animation:"fadeUp 0.5s cubic-bezier(.34,1.2,.64,1)"}}>
            <div style={{background:`linear-gradient(135deg,${riskColor}18,${riskColor}08)`,border:`1px solid ${riskColor}33`,borderRadius:20,padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <RiskGauge score={score} color={riskColor}/>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:22}}>{riskInfo.emoji}</span>
                  <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:800,color:riskColor,letterSpacing:"1px"}}>{riskInfo.label}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.7,marginBottom:10}}>{result.summary}</div>
                <div style={{fontSize:11,color:C.muted,wordBreak:"break-all"}}>🔗 {result.url}</div>
              </div>
            </div>

            <div style={{display:"flex",gap:4,marginBottom:16,background:"rgba(255,255,255,0.03)",borderRadius:14,padding:4}}>
              {["overview","vulnerabilities","details"].map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",background:activeTab===tab?"rgba(255,255,255,0.08)":"none",color:activeTab===tab?C.text:C.muted,fontWeight:activeTab===tab?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                  {tab==="overview"?"📊 Overview":tab==="vulnerabilities"?"🚨 Threats":"🔍 Details"}
                </button>
              ))}
            </div>

            {activeTab==="overview"&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14,fontWeight:600}}>Security Checks</div>
                {(result.checks||[]).map((c,i)=><CheckItem key={i} {...c}/>)}
              </div>
            )}

            {activeTab==="vulnerabilities"&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14,fontWeight:600}}>Detected Threats</div>
                {(result.vulnerabilities||[]).map((v,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(255,59,87,0.06)",border:"1px solid rgba(255,59,87,0.15)",borderRadius:12,marginBottom:8}}>
                    <span style={{fontSize:16}}>⚡</span>
                    <span style={{fontSize:13,color:C.text,fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab==="details"&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14,fontWeight:600}}>Technical Details</div>
                {[
                  {label:"URL Scanned",value:result.url},
                  {label:"Risk Score",value:`${score}/100`},
                  {label:"Risk Level",value:riskInfo.label},
                  {label:"HTTPS",value:result.has_https?"Yes ✓":"No ✕"},
                  {label:"Domain Age",value:result.domain_age>0?`${result.domain_age} days`:"Unknown"},
                  {label:"Threats Found",value:(result.vulnerabilities||[]).length},
                  {label:"Scan Time",value:new Date().toLocaleTimeString()},
                ].map((row,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
                    <span style={{fontSize:13,color:C.muted}}>{row.label}</span>
                    <span style={{fontSize:13,color:C.text,fontWeight:600,maxWidth:"60%",textAlign:"right",wordBreak:"break-all"}}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!result&&!scanning&&(
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:60,marginBottom:16,filter:"drop-shadow(0 0 20px rgba(255,59,87,0.4))"}}>🛡️</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.15)",letterSpacing:"2px",marginBottom:8}}>READY TO SCAN</div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.8}}>Enter any URL above to detect<br/>phishing attempts and vulnerabilities</div>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:32,flexWrap:"wrap"}}>
              {["🔐 SSL Check","🌐 Domain Analysis","🤖 AI Detection","📊 Risk Scoring","🚨 Threat Detection","📋 PDF Reports"].map(f=>(
                <div key={f} style={{padding:"8px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,fontSize:12,color:C.muted}}>{f}</div>
              ))}
            </div>
            <div style={{marginTop:48,fontSize:11,color:"rgba(255,255,255,0.1)"}}>
              designed & built by <span style={{background:"linear-gradient(90deg,#ff3b57,#0ea5ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>osho</span>
            </div>
          </div>
        )}

        <ScanHistory history={history} onSelect={r=>{setResult(r);setUrl(r.url);setActiveTab("overview");}}/>
      </div>
    </div>
  );
}