import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";


// ── Supabase — sync sans login ────────────────────────────────────────────
const SUPA_URL = "https://mtgryzsovqiolinobbjw.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Z3J5enNvdnFpb2xpbm9iYmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDc3MTgsImV4cCI6MjA5MDYyMzcxOH0.2d4Vvm55p_SHi-wGRBrbfsxiwRh-wdqP9tDsHm_Qj3k";

async function supaFetch(path, opts={}) {
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || "GET",
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "",
    },
    body: opts.body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || String(res.status));
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

async function supaPullBets() {
  return supaFetch("/rest/v1/bets?select=id,player,description,overUnder,odds,stake,bookmaker,status,game,league,role,team,datetime,isHeadshot,isLive,mapTag,profit,tournament&order=datetime.desc");
}

async function supaPushBets(bets) {
  const rows = bets.map(({id,player,description,overUnder,odds,stake,bookmaker,
    status,game,league,role,team,datetime,isHeadshot,isLive,mapTag,profit,tournament})=>
    ({id,player,description,overUnder,odds,stake,bookmaker,status,game,league,role,
      team,datetime,isHeadshot:!!isHeadshot,isLive:!!isLive,mapTag,profit,tournament}));
  // Chunk en 500
  for(let i=0;i<rows.length;i+=500){
    await supaFetch("/rest/v1/bets",{
      method:"POST",
      body:JSON.stringify(rows.slice(i,i+500)),
      prefer:"resolution=merge-duplicates",
    });
  }
}

async function supaDeleteAllBets() {
  // Supprimer tous les enregistrements (neq trick car Supabase exige un filtre)
  await supaFetch("/rest/v1/bets?id=neq.0",{method:"DELETE"});
  await supaFetch("/rest/v1/bets?id=eq.0",{method:"DELETE"});
}
async function supaDeleteOneBet(id) {
  await supaFetch("/rest/v1/bets?id=eq."+id,{method:"DELETE"});
}
async function supaDeleteManyBets(ids) {
  if(!ids||!ids.length)return;
  await supaFetch("/rest/v1/bets?id=in.("+ids.join(",")+")",{method:"DELETE"});
}

// ── Game Logos & GameLogo component ──────────────────────────────────────
const L={
  LoL:"data:image/png;base64,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", Dota2:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAHz0lEQVR42n2XyY8dZxXFf/cbanhTd9vdadvxkNgkIbFJgHgVRSIhUoQsxIJskCL4W7LnvwChiA0bkEAiisQmK8KggIOc0ERJ7CZ2t3t6Q1V9w2XxKs3U7ZJKqnpVqnveveeee64MqDUQCQQ8kIHkgFQhGNTPMUEQrUliwRlICYoZqDJqhciQxtagR9jc4A0EFZLCACUDDScfUuA1SiZLxmdFgWiBXFBoppLIUKHEsofSASWgkikVVoEGwx6OiognUwALYA4kIAIB0JMAYFAsIOADGIUWwWFYI3MB5QxQAbvADKiBS8CZ/qPbfcCN/qMdsAfsAJ8CUzklOuCQZXBkidRjAMWQuFJ53twccbVTfKy5l4/Ynk2p1HF9MmLDGGZJ2TqYkoqaCytjqhhp2zk7GG77ip89vM80K6dhcC4tAyOgxtBlAcmEDAMS31gEnjoMWHF8vRqwJxG1ibMxUgfF+ILLIsTUUOwtqA2IKK2MuViv856LbHcHZBJ6AgTngJwgGwGxYDKiS7RlVC5HYVMNO9oxmJcMO6UoEjQzcoLStWwamHtI3uFzx2CR6doD1hkyjgFPojulBi71VCAbkGX6RZc1L5PSzef8LWTe05ZnxHCjXqHu7uOt0GQlSGK39twxyodNYD0q3ykKVgyMiobJdErVk/dEAPH40oIuySA90yuF8WDEJyx4t+nY0iNEVrlWVwzmDaUI2SnbbcevA7yf4CrwQgqMjRC6fQx52TWnADBfcnB5Z5dnD2K1KomdckUGfMsOeJ/Ejxf7/BLPdO0CLhtsgMddwddygQGmGCQXhJAhxmVb/2eM/wVg/utWj1tCgTYmupzZDJbXRpuc95Y/5MRPZnPenXYclmNmAmPNvDRc51W7xmUyXsBXUIwKpgjNIzJgLbylAirSl8HgyDgyZxVujQZM5nNKVzCxkZ0Q+KsqW3FBFuHSuMLMGibAk8MxT3Ytl0wi5MyHKG93cA9zKgB33J+SIWcEgyBkYCaghUFtSzHf5dsjx2xQcGfe8ZEob8cF81nB94djNkLL5vQ+FyVTusReEh5GwwFKxgHtyRnQPgPLZhAExfVdu6Lwus+cj4poxufEygBmCrej8sAKWzFxgLA6rBhopM6BLkFpS5rRGr9p5jxA+6KewIHcV92ogkRUAoZEBqwozaIhpISxhkVMjKeBH61VvFx7pqr8wzp+3rb8dNrwoS85WBmyqAwaAsMOxiiOdCoJHcYiWSlQWhQ1kDKUCk9UJWuuxHcNMQrGGIYG3CzwRllxr4n8GWWK4d22YxoTrw8cL68VVJqJiyklHA+nkwFo2TdKd6zXGfDAqjgG4klG2dFA5UsKOmQa+Oaw5ofViJ3FEdtY9nG8kyIPjhLGel4Tpao9K7MGo4rpJ+P/cQDqt8CQRclmWSebl0DGKfFKCsiw4reS+EtMrE9WmYQFdVImxYjkDFuh4yGGDuUQuN9knjWW8/WQdxZz/v6IcewERQXUODARElgMLXA3Z0Jp2PaRX80jezEwIHOrLhnPI481c75X1XzKlF0ih/24vgPsuRKiov2/P1UJKxoMi75Nli+7/qyA2lZszzq2QuAuwi92drmtSusMdVQuzCLfrcbcAFZ6Ql/2lrNiiFmQR6gggPEEvCbQ/KVFATI1mcfEUZsKT8EQmKF8Bvz+qGU/K6XzTARe8BW3vOcacB64bgrOmwpnLYiQHgHChb5DlyN4ObG73vWsicOSedZ63izH/LGdc84Iz0umFCWlGTZlNlLJraGjmCoz43naWs7EOQsrqP5b5E8E0OJ7N5IhBdQsCWOAVlumXeKqFrxRrvNqZ1nznomdEfKCximFQqULzjXwA6kphmvMwyFVmLFfOLJTcjy9BC6LAQSnBs2RrIqKIWjmyAt7m2M+21sQdUExGdGgJDEQHS43S820SiMOawpSiMQMh95zsDKEfEg+fJQQFR0EEBUKlKzQYskon4nyO4FJ5VCN2JyRlFiVkvN2wJnsGVaRHZ3TjGo0DWlmHbWreAh8PIv8M9pe2E+x5VKgEsHnJfMTQotHSdQkLvZ8qHu5sv31E8A6MPQVn4aGRf9cgQvAx8AWcATsYIjkk225BzU9S1MPIFOBKJaWjbJgLMK0bemyUhbFUlS6jrquaTVhUsJnSMZiYqRQhfGIHWB+FFAxJF2cSEVj+58DQhDIQk9BQazj2vPXOfPVa/hzG8yriuLxC4yvXOagHnD2+nNcvHmDblzh1h9j/akb7JiSeyjnnn+OF199BcTi7emLgWmBDkMyHqwB45cAVKmso56s8vnuLpeevsrNl24SupZa4CvPPMHdh18wMY79hzMmZ9e5fuM6tnS0wAd/+oD0YJexU1KcnW7JFLO042L6wP0DMpmMtTWT1Q1m0zl79x8y8iXDwrM4OsI4h9iSwhhsUXL52pOsbJxBDbxw80UOpwuOwnwp9adZMtC3jlcjjaCKQVACmYSRghzg808+YefzLxibivs7X3D3/i5alDSzQw4ODjlsWm5/dIeDo31iaCgmayQMD/a2yaYfsSfuhqDHNSf1hsyRpeetLk210FHi8BgCHV1Vk3PCaIe3nrZVxFqQgBk60hwIBmyzDJ4ftRv2E8sci2ZcbqkCPhnUQjaWpssgFiue3ETwbpm0mHBqKWIiSaY76kBrjCkpYkBJdKfQ8F8+GupI47q3ngAAAABJRU5ErkJggg==", CS2:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD40lEQVR42u2WX2scZRTGf+fMzO5ms5tkzSZNa3ohiH9SqmBKimKDUrTgtVL0UuqF/QpWP4Afwitvizfe2BYRWxVpxauCJUqjlLTZaNNkm92dnXnf48XMbrI0Gy0ouckLM8O8w5zzzHme85yRuYVPjH1cyj6vAwAHAA4A7DuAcNgDs+H+JCL/P4C9kuwF7nHj/SsAIkoQaD+xmWFmaBD0EPX3RRTYBuic2xN0iOQP7FGE3lIKQUi322Jj/SGqmWSKhTJRFPBgYx0MRAUlIAhDukkHEQNRgrDIyEh119h9ACYeEMQEyL5IzaMKYilx/JDRSpnjx18gSbqMlCo0Gg9YX7/HifmX8K6LmBJ3UlqtFhNTFRwJ3pTVtTard5uYDxjGaAiSV0zyIyt/mrbx1mGiVuXChQ85OnuEjU2jVBR++P5n6vUyh2dqtLdaTNamuHnzF1ZWVnhl8WU63U3KY1PMzJT44NynNBpbRGFhVxpCTAeT4/HmKBRD/ry/xdvvvMmRJwu8+945glBIk4TTry9w/v3zXPzyR+J2l59ufMfVa9c588YZVu/dodlq8vyxCmsNx/2/GoRBebgGxHpWkAEwIFCh04mZnJzg7Nm3uHzlKu14i6PTs6w1Vvj9j2U++/wSqgHH5p7ixPzTPPvMc8zPv8i3125QLIyw/OtdLn5xhbRrFEcici3uRoH1kw+0mQjVSpmo0GVx8RQLJ0+RJjGXL33F6ddexbmYrWaTMKzxzdfXmT06Q6kYMlY9RLkyym+377B8e4UoqODdHu05d/Jjy1TaE6GBOFRSXNJi+vAM9akxRIxuO2Zjc4ND03XEPFEU0Wp2WLq1xGR9inp9kkKxgGhEJzZuLS2DL+DwiDLQnjsAfGSZEIN+F4BDFZCUTmuTJEnx3hMEEaVSiXZ7C+89WEigyvh4lW7coRN3UFXixBFpkdGxGs6Td4DfFUBI3oaZGH0+HgTvs14ul2sICqLgldQ8409UgQCxAAOcSwlHIsZHK3iMCiHeC6lzWVisbze7aMDnhmg7Dsl0YJB4tvdzkKmkYFnQTD0eLCX1ScamdyCKiQE+95hwDx/AQCx3LMu9ID+ZIKJYr1sEVFxeKc0ASPa+z0H32klUUPMgwW7V7/lAsIOCfh9geDCHiGAEgM/3UoQUTPOZoBkAlf6EV6LsY5xHNItvw6fhoA8MUCE9BRkmgpki5sAEtawq1jMyU0RCsAh1YV5ynyf3/zCObWdytinYEQQkO6sghHn5HWgPsILPbKXHfaaNfrBhFDyaPLvVgWs/RK58w4N06WuoN08EIAUcQ4n/b3/J7DH3D35KDwAMrr8Bx/+9oqtKhPkAAAAASUVORK5CYII=", Valorant:"data:image/png;base64,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"
};
function GameLogo({game,size=18}){
  const src=L[game];
  if(!src) return <span style={{fontSize:size-2}}></span>;
  return <img src={src} alt={game} style={{width:size,height:size,objectFit:"contain",borderRadius:3,verticalAlign:"middle",flexShrink:0}}/>;
}

// ── Bankroll Chart ────────────────────────────────────────────────────────
function BankrollChart({points,h=150}){
  if(!points||points.length<2)return(
    <div style={{height:h,display:"flex",alignItems:"center",justifyContent:"center",color:"#6B7280",fontSize:13}}>Pas assez de donnees</div>
  );
  const W=400,H=h,pad={t:8,b:24,l:44,r:8};
  const vals=points.map(p=>p.v);
  const min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
  const cx=W-pad.l-pad.r,cy=H-pad.t-pad.b;
  const px=i=>pad.l+i/(points.length-1)*cx;
  const py=v=>pad.t+cy-(v-min)/range*cy;
  const linePath="M"+points.map((p,i)=>px(i)+","+py(p.v)).join(" L");
  const fillPath="M"+px(0)+","+py(points[0].v)+" "+points.map((p,i)=>"L"+px(i)+","+py(p.v)).join(" ")+" L"+px(points.length-1)+","+H+" L"+px(0)+","+H+" Z";
  const up=points[points.length-1].v>=points[0].v;
  const color=up?"#22C55E":"#F87171";
  const yTicks=[min,min+range*0.5,max];
  const xSamples=[0,Math.floor((points.length-1)/2),points.length-1];
  return(
    <svg width="100%" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="none" style={{overflow:"visible"}}>
      <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
      {yTicks.map((v,i)=><line key={i} x1={pad.l} y1={py(v)} x2={W-pad.r} y2={py(v)} stroke="#1F2937" strokeWidth="1" strokeDasharray="3,3"/>)}
      {yTicks.map((v,i)=><text key={i} x={pad.l-3} y={py(v)+4} textAnchor="end" fontSize="9" fill="#9CA3AF">{v.toFixed(0)}</text>)}
      {xSamples.filter(i=>points[i]&&points[i].dt).map((i,k)=><text key={k} x={px(i)} y={H-2} textAnchor="middle" fontSize="9" fill="#9CA3AF">{points[i].dt.slice(5,10).replace("-","/")}</text>)}
      <path d={fillPath} fill="url(#cf)"/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={px(points.length-1)} cy={py(points[points.length-1].v)} r="4" fill={color}/>
    </svg>
  );
}

// ── ProfitChart — bar chart profit par jour ──────────────────────────────
function ProfitChart({points,h=110}){
  if(!points||points.length<1)return(
    <div style={{height:h,display:"flex",alignItems:"center",justifyContent:"center",color:"#6B7280",fontSize:12}}>Pas assez de données</div>
  );
  const W=400,H=h,padL=38,padB=18,padT=6,padR=6;
  const vals=points.map(p=>p.v);
  const maxAbs=Math.max(...vals.map(Math.abs),1);
  const cw=W-padL-padR;
  const ch=(H-padT-padB)/2; // half height for zero line
  const zeroY=padT+ch;
  const barW=Math.max(2,Math.floor(cw/vals.length)-1);
  const xSamples=points.length<=7?points.map((_,i)=>i):[0,Math.floor(points.length/2),points.length-1];
  return(
    <svg width="100%" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="none" style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22C55E" stopOpacity=".7"/><stop offset="100%" stopColor="#22C55E" stopOpacity=".15"/></linearGradient>
        <linearGradient id="pr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F87171" stopOpacity=".15"/><stop offset="100%" stopColor="#F87171" stopOpacity=".7"/></linearGradient>
      </defs>
      {/* zero line */}
      <line x1={padL} y1={zeroY} x2={W-padR} y2={zeroY} stroke="#374151" strokeWidth="1"/>
      <text x={padL-3} y={zeroY+4} textAnchor="end" fontSize="8" fill="#6B7280">0</text>
      <text x={padL-3} y={padT+5} textAnchor="end" fontSize="8" fill="#22C55E">+{maxAbs.toFixed(0)}</text>
      <text x={padL-3} y={H-padB+4} textAnchor="end" fontSize="8" fill="#F87171">-{maxAbs.toFixed(0)}</text>
      {/* bars */}
      {points.map((p,i)=>{
        const x=padL+i*(cw/vals.length)+1;
        const ratio=p.v/maxAbs;
        const barH=Math.abs(ratio)*ch;
        const y=p.v>=0?zeroY-barH:zeroY;
        return<rect key={i} x={x} y={y} width={barW} height={Math.max(1,barH)} fill={p.v>=0?"url(#pg)":"url(#pr)"} rx="1"/>;
      })}
      {/* x labels */}
      {xSamples.filter(i=>points[i]).map((i,k)=>(
        <text key={k} x={padL+i*(cw/vals.length)+barW/2} y={H-2} textAnchor="middle" fontSize="8" fill="#6B7280">{points[i].dt.slice(5,10).replace("-","/")}</text>
      ))}
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────
const STATIC_PLAYERS={
faker:{game:"LoL",league:"LCK",role:"Mid Laner",team:"T1"},
doran:{game:"LoL",league:"LCK",role:"Top Laner",team:"T1"},
oner:{game:"LoL",league:"LCK",role:"Jungler",team:"T1"},
peyz:{game:"LoL",league:"LCK",role:"Bot Laner",team:"T1"},
keria:{game:"LoL",league:"LCK",role:"Support",team:"T1"},
kiin:{game:"LoL",league:"LCK",role:"Top Laner",team:"Gen.G"},
canyon:{game:"LoL",league:"LCK",role:"Jungler",team:"Gen.G"},
chovy:{game:"LoL",league:"LCK",role:"Mid Laner",team:"Gen.G"},
ruler:{game:"LoL",league:"LCK",role:"Bot Laner",team:"Gen.G"},
duro:{game:"LoL",league:"LCK",role:"Support",team:"Gen.G"},
zeus:{game:"LoL",league:"LCK",role:"Top Laner",team:"HLE"},
kanavi:{game:"LoL",league:"LCK",role:"Jungler",team:"HLE"},
zeka:{game:"LoL",league:"LCK",role:"Mid Laner",team:"HLE"},
gumayusi:{game:"LoL",league:"LCK",role:"Bot Laner",team:"HLE"},
delight:{game:"LoL",league:"LCK",role:"Support",team:"HLE"},
perfect:{game:"LoL",league:"LCK",role:"Top Laner",team:"KT Rolster"},
cuzz:{game:"LoL",league:"LCK",role:"Jungler",team:"KT Rolster"},
bdd:{game:"LoL",league:"LCK",role:"Mid Laner",team:"KT Rolster"},
aiming:{game:"LoL",league:"LCK",role:"Bot Laner",team:"KT Rolster"},
ghost:{game:"LoL",league:"LCK",role:"Support",team:"KT Rolster"},
pollu:{game:"LoL",league:"LCK",role:"Support",team:"KT Rolster"},
siwoo:{game:"LoL",league:"LCK",role:"Top Laner",team:"Dplus KIA"},
lucid:{game:"LoL",league:"LCK",role:"Jungler",team:"Dplus KIA"},
showmaker:{game:"LoL",league:"LCK",role:"Mid Laner",team:"Dplus KIA"},
smash:{game:"LoL",league:"LCK",role:"Bot Laner",team:"Dplus KIA"},
career:{game:"LoL",league:"LCK",role:"Support",team:"Dplus KIA"},
clear:{game:"LoL",league:"LCK",role:"Top Laner",team:"BNK FEARX"},
pzdo:{game:"LoL",league:"LCK",role:"Jungler",team:"BNK FEARX"},
vicla:{game:"LoL",league:"LCK",role:"Mid Laner",team:"BNK FEARX"},
diable:{game:"LoL",league:"LCK",role:"Bot Laner",team:"BNK FEARX"},
kellin:{game:"LoL",league:"LCK",role:"Support",team:"BNK FEARX"},
dudu:{game:"LoL",league:"LCK",role:"Top Laner",team:"DN SOOPers"},
pyosik:{game:"LoL",league:"LCK",role:"Jungler",team:"DN SOOPers"},
clozer:{game:"LoL",league:"LCK",role:"Mid Laner",team:"DN SOOPers"},
deokdam:{game:"LoL",league:"LCK",role:"Bot Laner",team:"DN SOOPers"},
peter:{game:"LoL",league:"LCK",role:"Support",team:"DN SOOPers"},
life:{game:"LoL",league:"LCK",role:"Support",team:"DN SOOPers"},
rich:{game:"LoL",league:"LCK",role:"Top Laner",team:"DRX"},
willer:{game:"LoL",league:"LCK",role:"Jungler",team:"DRX"},
ucal:{game:"LoL",league:"LCK",role:"Mid Laner",team:"DRX"},
jiwoo:{game:"LoL",league:"LCK",role:"Bot Laner",team:"DRX"},
andil:{game:"LoL",league:"LCK",role:"Support",team:"DRX"},
kingen:{game:"LoL",league:"LCK",role:"Top Laner",team:"Nongshim RedForce"},
sponge:{game:"LoL",league:"LCK",role:"Jungler",team:"Nongshim RedForce"},
scout:{game:"LoL",league:"LCK",role:"Mid Laner",team:"Nongshim RedForce"},
taeyoon:{game:"LoL",league:"LCK",role:"Bot Laner",team:"Nongshim RedForce"},
lehends:{game:"LoL",league:"LCK",role:"Support",team:"Nongshim RedForce"},
casting:{game:"LoL",league:"LCK",role:"Top Laner",team:"BRION"},
gideon:{game:"LoL",league:"LCK",role:"Jungler",team:"BRION"},
fisher:{game:"LoL",league:"LCK",role:"Mid Laner",team:"BRION"},
teddy:{game:"LoL",league:"LCK",role:"Bot Laner",team:"BRION"},
namgung:{game:"LoL",league:"LCK",role:"Support",team:"BRION"},
brokenblade:{game:"LoL",league:"LEC",role:"Top Laner",team:"G2 Esports"},
skewmond:{game:"LoL",league:"LEC",role:"Jungler",team:"G2 Esports"},
caps:{game:"LoL",league:"LEC",role:"Mid Laner",team:"G2 Esports"},
hanssama:{game:"LoL",league:"LEC",role:"Bot Laner",team:"G2 Esports"},
labrov:{game:"LoL",league:"LEC",role:"Support",team:"G2 Esports"},
empyros:{game:"LoL",league:"LEC",role:"Top Laner",team:"Fnatic"},
razork:{game:"LoL",league:"LEC",role:"Jungler",team:"Fnatic"},
vladi:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Fnatic"},
upset:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Fnatic"},
lospa:{game:"LoL",league:"LEC",role:"Support",team:"Fnatic"},
canna:{game:"LoL",league:"LEC",role:"Top Laner",team:"Karmine Corp"},
yike:{game:"LoL",league:"LEC",role:"Jungler",team:"Karmine Corp"},
kyeahoo:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Karmine Corp"},
caliste:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Karmine Corp"},
busio:{game:"LoL",league:"LEC",role:"Support",team:"Karmine Corp"},
myrwn:{game:"LoL",league:"LEC",role:"Top Laner",team:"KOI"},
elyoya:{game:"LoL",league:"LEC",role:"Jungler",team:"KOI"},
jojopyun:{game:"LoL",league:"LEC",role:"Mid Laner",team:"KOI"},
supa:{game:"LoL",league:"LEC",role:"Bot Laner",team:"KOI"},
alvaro:{game:"LoL",league:"LEC",role:"Support",team:"KOI"},
naaknako:{game:"LoL",league:"LEC",role:"Top Laner",team:"Vitality"},
lyncas:{game:"LoL",league:"LEC",role:"Jungler",team:"Vitality"},
humanoid:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Vitality"},
carzzy:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Vitality"},
fleshy:{game:"LoL",league:"LEC",role:"Support",team:"Vitality"},
wunder:{game:"LoL",league:"LEC",role:"Top Laner",team:"SK Gaming"},
skeanz:{game:"LoL",league:"LEC",role:"Jungler",team:"SK Gaming"},
lider:{game:"LoL",league:"LEC",role:"Mid Laner",team:"SK Gaming"},
jopa:{game:"LoL",league:"LEC",role:"Bot Laner",team:"SK Gaming"},
mikyx:{game:"LoL",league:"LEC",role:"Support",team:"SK Gaming"},
lot:{game:"LoL",league:"LEC",role:"Top Laner",team:"GIANTX"},
isma:{game:"LoL",league:"LEC",role:"Jungler",team:"GIANTX"},
jackies:{game:"LoL",league:"LEC",role:"Mid Laner",team:"GIANTX"},
noah:{game:"LoL",league:"LEC",role:"Bot Laner",team:"GIANTX"},
jun:{game:"LoL",league:"LEC",role:"Support",team:"GIANTX"},
tracyn:{game:"LoL",league:"LEC",role:"Top Laner",team:"Team Heretics"},
sheo:{game:"LoL",league:"LEC",role:"Jungler",team:"Team Heretics"},
serin:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Team Heretics"},
ice:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Team Heretics"},
stend:{game:"LoL",league:"LEC",role:"Support",team:"Team Heretics"},
rooster:{game:"LoL",league:"LEC",role:"Top Laner",team:"Shifters"},
boukada:{game:"LoL",league:"LEC",role:"Jungler",team:"Shifters"},
nuc:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Shifters"},
paduck:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Shifters"},
trymbi:{game:"LoL",league:"LEC",role:"Support",team:"Shifters"},
maynter:{game:"LoL",league:"LEC",role:"Top Laner",team:"Natus Vincere"},
rhilech:{game:"LoL",league:"LEC",role:"Jungler",team:"Natus Vincere"},
poby:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Natus Vincere"},
hanssamd:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Natus Vincere"},
parus:{game:"LoL",league:"LEC",role:"Support",team:"Natus Vincere"},
baus:{game:"LoL",league:"LEC",role:"Top Laner",team:"Los Ratones"},
velja:{game:"LoL",league:"LEC",role:"Jungler",team:"Los Ratones"},
nemesis:{game:"LoL",league:"LEC",role:"Mid Laner",team:"Los Ratones"},
crownie:{game:"LoL",league:"LEC",role:"Bot Laner",team:"Los Ratones"},
rekkles:{game:"LoL",league:"LEC",role:"Support",team:"Los Ratones"},
thanatos:{game:"LoL",league:"LCS",role:"Top Laner",team:"Cloud9"},
blaber:{game:"LoL",league:"LCS",role:"Jungler",team:"Cloud9"},
apa:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Cloud9"},
zven:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Cloud9"},
vulcan:{game:"LoL",league:"LCS",role:"Support",team:"Cloud9"},
zamudo:{game:"LoL",league:"LCS",role:"Top Laner",team:"LYON"},
inspired:{game:"LoL",league:"LCS",role:"Jungler",team:"LYON"},
saint:{game:"LoL",league:"LCS",role:"Mid Laner",team:"LYON"},
berserker:{game:"LoL",league:"LCS",role:"Bot Laner",team:"LYON"},
isles:{game:"LoL",league:"LCS",role:"Support",team:"LYON"},
morgan:{game:"LoL",league:"LCS",role:"Top Laner",team:"Team Liquid"},
josedeodo:{game:"LoL",league:"LCS",role:"Jungler",team:"Team Liquid"},
quid:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Team Liquid"},
yeon:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Team Liquid"},
corejj:{game:"LoL",league:"LCS",role:"Support",team:"Team Liquid"},
fudge:{game:"LoL",league:"LCS",role:"Top Laner",team:"Shopify Rebellion"},
contractz:{game:"LoL",league:"LCS",role:"Jungler",team:"Shopify Rebellion"},
zinie:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Shopify Rebellion"},
bvoy:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Shopify Rebellion"},
ceos:{game:"LoL",league:"LCS",role:"Support",team:"Shopify Rebellion"},
impact:{game:"LoL",league:"LCS",role:"Top Laner",team:"Sentinels"},
hambak:{game:"LoL",league:"LCS",role:"Jungler",team:"Sentinels"},
darkwings:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Sentinels"},
rahel:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Sentinels"},
huhi:{game:"LoL",league:"LCS",role:"Support",team:"Sentinels"},
gakgos:{game:"LoL",league:"LCS",role:"Top Laner",team:"FlyQuest"},
gryffinn:{game:"LoL",league:"LCS",role:"Jungler",team:"FlyQuest"},
quad:{game:"LoL",league:"LCS",role:"Mid Laner",team:"FlyQuest"},
massu:{game:"LoL",league:"LCS",role:"Bot Laner",team:"FlyQuest"},
cryogen:{game:"LoL",league:"LCS",role:"Support",team:"FlyQuest"},
photon:{game:"LoL",league:"LCS",role:"Top Laner",team:"Dignitas"},
exyu:{game:"LoL",league:"LCS",role:"Jungler",team:"Dignitas"},
palafox:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Dignitas"},
fbi:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Dignitas"},
ignar:{game:"LoL",league:"LCS",role:"Support",team:"Dignitas"},
castle:{game:"LoL",league:"LCS",role:"Top Laner",team:"Disguised"},
kryra:{game:"LoL",league:"LCS",role:"Jungler",team:"Disguised"},
callme:{game:"LoL",league:"LCS",role:"Mid Laner",team:"Disguised"},
sajed:{game:"LoL",league:"LCS",role:"Bot Laner",team:"Disguised"},
lyonz:{game:"LoL",league:"LCS",role:"Support",team:"Disguised"},
flandre:{game:"LoL",league:"LPL",role:"Top Laner",team:"Anyone's Legend"},
tarzan:{game:"LoL",league:"LPL",role:"Jungler",team:"Anyone's Legend"},
shanks:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Anyone's Legend"},
hope:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Anyone's Legend"},
kael:{game:"LoL",league:"LPL",role:"Support",team:"Anyone's Legend"},
bin:{game:"LoL",league:"LPL",role:"Top Laner",team:"Bilibili Gaming"},
xun:{game:"LoL",league:"LPL",role:"Jungler",team:"Bilibili Gaming"},
knight:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Bilibili Gaming"},
blgviper:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Bilibili Gaming"},
on:{game:"LoL",league:"LPL",role:"Support",team:"Bilibili Gaming"},
breathe_ig:{game:"LoL",league:"LPL",role:"Top Laner",team:"Invictus Gaming"},
igwei:{game:"LoL",league:"LPL",role:"Jungler",team:"Invictus Gaming"},
renard:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Invictus Gaming"},  // Rookie DNP Split 2
jiaqi:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Invictus Gaming"},
meiko:{game:"LoL",league:"LPL",role:"Support",team:"Invictus Gaming"},
xiaoxu:{game:"LoL",league:"LPL",role:"Top Laner",team:"JD Gaming"},
junjia:{game:"LoL",league:"LPL",role:"Jungler",team:"JD Gaming"},
hongq:{game:"LoL",league:"LPL",role:"Mid Laner",team:"JD Gaming"},
gala:{game:"LoL",league:"LPL",role:"Bot Laner",team:"JD Gaming"},
vampire:{game:"LoL",league:"LPL",role:"Support",team:"JD Gaming"},
tes369:{game:"LoL",league:"LPL",role:"Top Laner",team:"Top Esports"},  // DNP Split 2 (blessure)
zuian:{game:"LoL",league:"LPL",role:"Top Laner",team:"Top Esports"},  // remplaçant 369
tian:{game:"LoL",league:"LPL",role:"Jungler",team:"Top Esports"},
creme:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Top Esports"},
jackeylove:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Top Esports"},
fengyue:{game:"LoL",league:"LPL",role:"Support",team:"Top Esports"},
zika:{game:"LoL",league:"LPL",role:"Top Laner",team:"Weibo Gaming"},
breathe:{game:"LoL",league:"LPL",role:"Top Laner",team:"Weibo Gaming"},
jiejie:{game:"LoL",league:"LPL",role:"Jungler",team:"Weibo Gaming"},
xiaohu:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Weibo Gaming"},
elk:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Weibo Gaming"},
erha:{game:"LoL",league:"LPL",role:"Support",team:"Weibo Gaming"},
crisp:{game:"LoL",league:"LPL",role:"Support",team:"Weibo Gaming"},
zdz:{game:"LoL",league:"LPL",role:"Top Laner",team:"EDward Gaming"},
xiaohao:{game:"LoL",league:"LPL",role:"Jungler",team:"EDward Gaming"},
angel:{game:"LoL",league:"LPL",role:"Mid Laner",team:"EDward Gaming"},
leave:{game:"LoL",league:"LPL",role:"Bot Laner",team:"EDward Gaming"},
parukia:{game:"LoL",league:"LPL",role:"Support",team:"EDward Gaming"},
hoya:{game:"LoL",league:"LPL",role:"Top Laner",team:"NIP"},
guwon:{game:"LoL",league:"LPL",role:"Jungler",team:"NIP"},
care:{game:"LoL",league:"LPL",role:"Mid Laner",team:"NIP"},
assum:{game:"LoL",league:"LPL",role:"Bot Laner",team:"NIP"},
zhuo:{game:"LoL",league:"LPL",role:"Support",team:"NIP"},
cube:{game:"LoL",league:"LPL",role:"Top Laner",team:"Team WE"},
monki:{game:"LoL",league:"LPL",role:"Jungler",team:"Team WE"},
karis:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Team WE"},
about:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Team WE"},
yaoyao:{game:"LoL",league:"LPL",role:"Support",team:"Team WE"},
keshi:{game:"LoL",league:"LPL",role:"Top Laner",team:"ThunderTalk"},
junhao:{game:"LoL",league:"LPL",role:"Jungler",team:"ThunderTalk"},
heru:{game:"LoL",league:"LPL",role:"Mid Laner",team:"ThunderTalk"},
ryan3:{game:"LoL",league:"LPL",role:"Bot Laner",team:"ThunderTalk"},
feather:{game:"LoL",league:"LPL",role:"Support",team:"ThunderTalk"},
sasi:{game:"LoL",league:"LPL",role:"Top Laner",team:"LGD Gaming"},
heng:{game:"LoL",league:"LPL",role:"Jungler",team:"LGD Gaming"},
tangyuan:{game:"LoL",league:"LPL",role:"Mid Laner",team:"LGD Gaming"},
shaoye:{game:"LoL",league:"LPL",role:"Bot Laner",team:"LGD Gaming"},
ycx:{game:"LoL",league:"LPL",role:"Support",team:"LGD Gaming"},
sheer:{game:"LoL",league:"LPL",role:"Top Laner",team:"LNG Esports"},
croco:{game:"LoL",league:"LPL",role:"Jungler",team:"LNG Esports"},
bulldog:{game:"LoL",league:"LPL",role:"Mid Laner",team:"LNG Esports"},
lng1xn:{game:"LoL",league:"LPL",role:"Bot Laner",team:"LNG Esports"},
missing:{game:"LoL",league:"LPL",role:"Support",team:"LNG Esports"},
hery:{game:"LoL",league:"LPL",role:"Top Laner",team:"Oh My God"},
juhan:{game:"LoL",league:"LPL",role:"Jungler",team:"Oh My God"},
haichao:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Oh My God"},
starry:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Oh My God"},
moham:{game:"LoL",league:"LPL",role:"Support",team:"Oh My God"},
liangchen:{game:"LoL",league:"LPL",role:"Top Laner",team:"Ultra Prime"},
grizzly:{game:"LoL",league:"LPL",role:"Jungler",team:"Ultra Prime"},
saber:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Ultra Prime"},
hena:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Ultra Prime"},
xiaoxia:{game:"LoL",league:"LPL",role:"Support",team:"Ultra Prime"},
  // ── VCT China 2026 ──────────────────────────────────────────────────────
  // All Gamers
  k1ra:{game:"Valorant",league:"VCT China",role:"IGL",team:"All Gamers"},
  "shr1mp":{game:"Valorant",league:"VCT China",role:"Duelist",team:"All Gamers"},
  f4ngeer:{game:"Valorant",league:"VCT China",role:"Initiator",team:"All Gamers"},
  iamgrq:{game:"Valorant",league:"VCT China",role:"Controller",team:"All Gamers"},
  au1:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"All Gamers"},
  // FunPlus Phoenix
  aaaay:{game:"Valorant",league:"VCT China",role:"Initiator",team:"FunPlus Phoenix"},
  berlin:{game:"Valorant",league:"VCT China",role:"IGL",team:"FunPlus Phoenix"},
  ben1ley:{game:"Valorant",league:"VCT China",role:"Initiator",team:"FunPlus Phoenix"},
  kovaq:{game:"Valorant",league:"VCT China",role:"Controller",team:"FunPlus Phoenix"},
  setrod:{game:"Valorant",league:"VCT China",role:"Duelist",team:"FunPlus Phoenix"},
  // EDward Gaming
  "s1mple_edg":{game:"Valorant",league:"VCT China",role:"Duelist",team:"EDward Gaming"},
  chichoo:{game:"Valorant",league:"VCT China",role:"Initiator",team:"EDward Gaming"},
  zrc:{game:"Valorant",league:"VCT China",role:"Controller",team:"EDward Gaming"},
  wuhorse:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"EDward Gaming"},
  cr1t:{game:"Valorant",league:"VCT China",role:"Duelist",team:"EDward Gaming"},
  // Bilibili Gaming
  knight:{game:"Valorant",league:"VCT China",role:"IGL",team:"Bilibili Gaming"},
  biank:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Bilibili Gaming"},
  jinbo:{game:"Valorant",league:"VCT China",role:"Controller",team:"Bilibili Gaming"},
  ctypp:{game:"Valorant",league:"VCT China",role:"Initiator",team:"Bilibili Gaming"},
  dogdog:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Bilibili Gaming"},
  // JDG Esports
  yuicaw:{game:"Valorant",league:"VCT China",role:"Duelist",team:"JDG Esports"},
  jkuro:{game:"Valorant",league:"VCT China",role:"IGL",team:"JDG Esports"},
  coconut:{game:"Valorant",league:"VCT China",role:"Initiator",team:"JDG Esports"},
  stew_jdg:{game:"Valorant",league:"VCT China",role:"Controller",team:"JDG Esports"},
  zhe:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"JDG Esports"},
  // TYLOO
  "sword9":{game:"Valorant",league:"VCT China",role:"Duelist",team:"TYLOO"},
  splash:{game:"Valorant",league:"VCT China",role:"Initiator",team:"TYLOO"},
  scales:{game:"Valorant",league:"VCT China",role:"Controller",team:"TYLOO"},
  slowly:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"TYLOO"},
  erv:{game:"Valorant",league:"VCT China",role:"Duelist",team:"TYLOO"},
  // Titan Esports Club
  haodong:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Titan Esports Club"},
  lucas_tec:{game:"Valorant",league:"VCT China",role:"Initiator",team:"Titan Esports Club"},
  dynamite:{game:"Valorant",league:"VCT China",role:"Controller",team:"Titan Esports Club"},
  coco_tec:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Titan Esports Club"},
  ra1ny:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Titan Esports Club"},
  // Dragon Ranger Gaming
  "spiritz1":{game:"Valorant",league:"VCT China",role:"Duelist",team:"Dragon Ranger Gaming"},
  vo0kashu:{game:"Valorant",league:"VCT China",role:"Initiator",team:"Dragon Ranger Gaming"},
  flex1n:{game:"Valorant",league:"VCT China",role:"Controller",team:"Dragon Ranger Gaming"},
  nicc:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Dragon Ranger Gaming"},
  akeman:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Dragon Ranger Gaming"},
  // Xi Lai Gaming
  xlg_player1:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Xi Lai Gaming"},
  // Trace Esports
  delb:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Trace Esports"},
  viva:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Trace Esports"},
  kai_te:{game:"Valorant",league:"VCT China",role:"Initiator",team:"Trace Esports"},
  xlele:{game:"Valorant",league:"VCT China",role:"Controller",team:"Trace Esports"},
  abo:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Trace Esports"},
  // Wolves Esports
  yosemite:{game:"Valorant",league:"VCT China",role:"Controller",team:"Wolves Esports"},
  "siufattbb":{game:"Valorant",league:"VCT China",role:"Initiator",team:"Wolves Esports"},
  spring_wol:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Wolves Esports"},
  jowa:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Wolves Esports"},
  satoshi:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Wolves Esports"},
  // Nova Esports
  guang:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Nova Esports"},
  heybay:{game:"Valorant",league:"VCT China",role:"Initiator",team:"Nova Esports"},
  ezeir:{game:"Valorant",league:"VCT China",role:"Controller",team:"Nova Esports"},
  green_nova:{game:"Valorant",league:"VCT China",role:"Sentinel",team:"Nova Esports"},
  obone:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Nova Esports"},
  swagzor:{game:"Valorant",league:"VCT China",role:"Duelist",team:"Nova Esports"},
  qiutian:{game:"Valorant",league:"VCT China",role:"IGL",team:"Nova Esports"},

  // ── VCT Pacific 2026 — Corée ──────────────────────────────────────────────
  // Nongshim RedForce
  xross:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Nongshim RedForce"},
  rb:{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"Nongshim RedForce"},
  francis:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Nongshim RedForce"},
  dambi:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Nongshim RedForce"},
  ivy:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Nongshim RedForce"},
  // T1
  "t1_ban":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"T1"},
  "t1_carpe":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"T1"},
  sayaplayer:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"T1"},
  munchkin:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"T1"},
  lakia:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"T1"},
  // DRX
  beyn:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"DRX"},
  free1ng:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"DRX"},
  hyunmin:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"DRX"},
  hermes:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"DRX"},
  mako:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"DRX"},
  yong:{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"DRX"},
  // Gen.G
  "ruler_geng":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Gen.G"},
  "foxy9":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Gen.G"},
  "sylvyr":{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Gen.G"},
  "meteor_geng":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Gen.G"},
  "karon":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Gen.G"},
  // Paper Rex
  invy:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Paper Rex"},
  jinggg:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Paper Rex"},
  "f0rsaken":{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Paper Rex"},
  d4v41:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Paper Rex"},
  something:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Paper Rex"},
  // Global Esports
  "lightningfast":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Global Esports"},
  "russ_ge":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Global Esports"},
  "ban_ge":{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"Global Esports"},
  "patmen":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Global Esports"},
  // Rex Regum Qeon
  "fl1pzjder":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Rex Regum Qeon"},
  "mindfreak_rrq":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Rex Regum Qeon"},
  // DetonatioN FocusMe
  akame:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"DetonatioN FocusMe"},
  caedye:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"DetonatioN FocusMe"},
  meiy:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"DetonatioN FocusMe"},
  ssees:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"DetonatioN FocusMe"},
  yatsuka:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"DetonatioN FocusMe"},
  // ZETA DIVISION
  "laz":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"ZETA DIVISION"},
  dep:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"ZETA DIVISION"},
  crow:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"ZETA DIVISION"},
  "SugarZ3ro":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"ZETA DIVISION"},

  // ── VCT EMEA 2026 ────────────────────────────────────────────────────────
  // BBL Esports
  crewen:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"BBL Esports"},
  "lar0k":{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"BBL Esports"},
  loita:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"BBL Esports"},
  "lovers_rock":{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"BBL Esports"},
  rose_bbl:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"BBL Esports"},
  // Fnatic
  alfajer:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Fnatic"},
  boaster:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Fnatic"},
  crashies:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Fnatic"},
  kaajak:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Fnatic"},
  veqaj:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Fnatic"},
  // Gentle Mates
  beyaz:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Gentle Mates"},
  ruxic:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Gentle Mates"},
  tOpotti:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Gentle Mates"},
  // Team Liquid
  nats:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Team Liquid"},
  "purp0":{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Team Liquid"},
  kamo:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Team Liquid"},
  miniboo:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Team Liquid"},
  wayne:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Team Liquid"},
  // Team Heretics
  wo0t:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Team Heretics"},
  // Natus Vincere
  "n4rrate":{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Natus Vincere"},
  suygetsu:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Natus Vincere"},
  avez:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Natus Vincere"},
  "dos9":{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Natus Vincere"},
  lewn:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Natus Vincere"},
  // Karmine Corp
  // Team Vitality
  chronicle:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Team Vitality"},
  // GIANTX
  "w1ldfireee":{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"GIANTX"},
  // FUT Esports
  // Eternal Fire
  izzy:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Eternal Fire"},
  nekky:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Eternal Fire"},
  audaz:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Eternal Fire"},
  favian:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Eternal Fire"},
  echo_ef:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Eternal Fire"},

  // ── VCT Americas 2026 ────────────────────────────────────────────────────
  // MIBR
  tex:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"MIBR"},
  mazino:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"MIBR"},
  verno:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"MIBR"},
  // NRG
  brawk:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"NRG"},
  mada:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"NRG"},
  skuba:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"NRG"},
  ethan:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"NRG"},
  keiko:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"NRG"},
  // FURIA
  nerve:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"FURIA"},
  eeiu:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"FURIA"},
  koalanoob:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"FURIA"},
  artzin:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"FURIA"},
  alym:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"FURIA"},
  // G2 Esports
  "babybay":{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"G2 Esports VAL"},
  valyn:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"G2 Esports VAL"},
  jawgemo:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"G2 Esports VAL"},
  leaf:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"G2 Esports VAL"},
  trent:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"G2 Esports VAL"},
  // LOUD
  pancada:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"LOUD"},
  virtyy:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"LOUD"},
  cauanzin:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"LOUD"},
  darker:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"LOUD"},
  lukxo:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"LOUD"},
  // Leviatán
  kingg:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"Leviatán"},
  blowz:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"Leviatán"},
  sato:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Leviatán"},
  spike:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Leviatán"},
  neon_lev:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"Leviatán"},
  // Cloud9
  zellsis:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"Cloud9 VAL"},
  penny:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"Cloud9 VAL"},
  xeppaa:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"Cloud9 VAL"},
  "v1c":{game:"Valorant",league:"VCT Americas",role:"Controller",team:"Cloud9 VAL"},
  oxy:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Cloud9 VAL"},
  // 100 Thieves
  asuna:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"100T VAL"},
  bang:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"100T VAL"},
  cryocells:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"100T VAL"},
  vora:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"100T VAL"},
  timotino:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"100T VAL"},
  // Evil Geniuses
  "c0m":{game:"Valorant",league:"VCT Americas",role:"IGL",team:"Evil Geniuses VAL"},
  supamen:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Evil Geniuses VAL"},
  okeanos:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"Evil Geniuses VAL"},
  dgzin:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Evil Geniuses VAL"},
  bao:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"Evil Geniuses VAL"},
  // Sentinels
  johnqt:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"Sentinels VAL"},
  jonahp:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"Sentinels VAL"},
  cortezia:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Sentinels VAL"},
  reduxx:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"Sentinels VAL"},
  kyu:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"Sentinels VAL"},
  // KRÜ Esports
  saadhak:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"KRÜ Esports"},
  mwzera:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"KRÜ Esports"},
  less:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"KRÜ Esports"},
  silentzz:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"KRÜ Esports"},
  dantedeu5:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"KRÜ Esports"},
  // ENVY
  rossy:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"ENVY VAL"},
  keznit:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"ENVY VAL"},
  "p0ppin":{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"ENVY VAL"},
  demon1:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"ENVY VAL"},
  eggsterr:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"ENVY VAL"},

  raptor:{game:"LoL",league:"LCK",role:"Jungle",team:"BNK FearX"},
  // BNK FearX — LoL (LCK 2026)
  clear_bfx:{game:"LoL",league:"LCK",role:"Top Laner",team:"BNK FearX"},
  vicla:{game:"LoL",league:"LCK",role:"Mid Laner",team:"BNK FearX"},
  diable:{game:"LoL",league:"LCK",role:"Bot Laner",team:"BNK FearX"},
  kellin:{game:"LoL",league:"LCK",role:"Support",team:"BNK FearX"},
  daystar:{game:"LoL",league:"LCK",role:"Mid Laner",team:"BNK FearX"},
  // RRQ (Rex Regum Qeon) — VCT Pacific 2026
  crazyguy:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Rex Regum Qeon"},
  xffero:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Rex Regum Qeon"},
  jemkin:{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"Rex Regum Qeon"},
  kushy:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Rex Regum Qeon"},
  monyet:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Rex Regum Qeon"},
  // ZETA DIVISION — VCT Pacific 2026
  "sugarz3ro":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"ZETA DIVISION"},
  "eko_zeta":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"ZETA DIVISION"},
  absol:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"ZETA DIVISION"},
  "xdll":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"ZETA DIVISION"},
  "syouta":{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"ZETA DIVISION"},
  // B8 (CS2) — PGL Bucharest 2026
  alex666:{game:"CS2",league:"",role:"IGL",team:"B8"},
  npl:{game:"CS2",league:"",role:"Rifler",team:"B8"},
  kensizor:{game:"CS2",league:"",role:"Rifler",team:"B8"},
  esenthial:{game:"CS2",league:"",role:"Rifler",team:"B8"},
  s1zzi:{game:"CS2",league:"",role:"AWPer",team:"B8"},
  // Wildcard CS2 update: CLASIA → nEMANHA (mars 2026)
  // BNK FearX — Valorant (VCT Challengers Korea 2026)
  "felix_bfx":{game:"Valorant",league:"VCT Challengers KR",role:"Duelist",team:"BNK FearX VAL"},
  "empty_bfx":{game:"Valorant",league:"VCT Challengers KR",role:"Initiator",team:"BNK FearX VAL"},
  yusung:{game:"Valorant",league:"VCT Challengers KR",role:"Controller",team:"BNK FearX VAL"},
  zain_bfx:{game:"Valorant",league:"VCT Challengers KR",role:"Sentinel",team:"BNK FearX VAL"},
  day1_bfx:{game:"Valorant",league:"VCT Challengers KR",role:"Duelist",team:"BNK FearX VAL"},
  distinct:{game:"Valorant",league:"VCT Challengers KR",role:"Flex",team:"BNK FearX VAL"},
yatoro:{game:"Dota2",league:"",role:"Carry",team:"Team Spirit"},
collapse:{game:"Dota2",league:"",role:"Offlane",team:"Team Spirit"},
larl:{game:"Dota2",league:"",role:"Mid",team:"Team Spirit"},
panto:{game:"Dota2",league:"",role:"Soft Support",team:"Team Spirit"},
rue:{game:"Dota2",league:"",role:"Hard Support",team:"Team Spirit"},
pure:{game:"Dota2",league:"",role:"Carry",team:"Tundra Esports"},
"33":{game:"Dota2",league:"",role:"Offlane",team:"Tundra Esports"},
bzm:{game:"Dota2",league:"",role:"Mid",team:"Tundra Esports"},
whitemon:{game:"Dota2",league:"",role:"Soft Support",team:"Tundra Esports"},
ari:{game:"Dota2",league:"",role:"Hard Support",team:"Tundra Esports"},
ace:{game:"Dota2",league:"",role:"Carry",team:"Team Liquid"},
micke:{game:"Dota2",league:"",role:"Mid",team:"Team Liquid"},
boxi:{game:"Dota2",league:"",role:"Offlane",team:"Team Liquid"},
tofu:{game:"Dota2",league:"",role:"Soft Support",team:"Team Liquid"},
nisha:{game:"Dota2",league:"",role:"Carry",team:"Team Liquid"},
ame:{game:"Dota2",league:"",role:"Carry",team:"Xtreme Gaming"},
nothingtosal:{game:"Dota2",league:"",role:"Mid",team:"Xtreme Gaming"},
xxs:{game:"Dota2",league:"",role:"Offlane",team:"Xtreme Gaming"},
fy:{game:"Dota2",league:"",role:"Soft Support",team:"Xtreme Gaming"},
xnova:{game:"Dota2",league:"",role:"Hard Support",team:"Xtreme Gaming"},
satanicd:{game:"Dota2",league:"",role:"Carry",team:"PARIVISION"},
noone:{game:"Dota2",league:"",role:"Mid",team:"PARIVISION"},
sss:{game:"Dota2",league:"",role:"Offlane",team:"PARIVISION"},
nineclass:{game:"Dota2",league:"",role:"Soft Support",team:"PARIVISION"},
dukalis:{game:"Dota2",league:"",role:"Hard Support",team:"PARIVISION"},
kiritych:{game:"Dota2",league:"",role:"Carry",team:"BetBoom Team"},
gpk:{game:"Dota2",league:"",role:"Mid",team:"BetBoom Team"},
miero:{game:"Dota2",league:"",role:"Offlane",team:"BetBoom Team"},
save:{game:"Dota2",league:"",role:"Soft Support",team:"BetBoom Team"},
kataomi:{game:"Dota2",league:"",role:"Hard Support",team:"BetBoom Team"},
skiter:{game:"Dota2",league:"",role:"Carry",team:"Team Falcons"},
malr1ne:{game:"Dota2",league:"",role:"Mid",team:"Team Falcons"},
atf:{game:"Dota2",league:"",role:"Offlane",team:"Team Falcons"},
crit:{game:"Dota2",league:"",role:"Soft Support",team:"Team Falcons"},
sneyking:{game:"Dota2",league:"",role:"Hard Support",team:"Team Falcons"},
timado:{game:"Dota2",league:"",role:"Carry",team:"Virtus.pro"},
abed:{game:"Dota2",league:"",role:"Mid",team:"Virtus.pro"},
hellscream:{game:"Dota2",league:"",role:"Offlane",team:"Virtus.pro"},
saberlight:{game:"Dota2",league:"",role:"Soft Support",team:"Virtus.pro"},
fly:{game:"Dota2",league:"",role:"Hard Support",team:"Virtus.pro"},
watson:{game:"Dota2",league:"",role:"Carry",team:"Team Yandex"},
chirajr:{game:"Dota2",league:"",role:"Mid",team:"Team Yandex"},
noticed:{game:"Dota2",league:"",role:"Offlane",team:"Team Yandex"},
saksa:{game:"Dota2",league:"",role:"Soft Support",team:"Team Yandex"},
malady:{game:"Dota2",league:"",role:"Hard Support",team:"Team Yandex"},
nightfall:{game:"Dota2",league:"",role:"Carry",team:"Aurora Gaming"},
mikoto:{game:"Dota2",league:"",role:"Mid",team:"Aurora Gaming"},
ws:{game:"Dota2",league:"",role:"Offlane",team:"Aurora Gaming"},
mira:{game:"Dota2",league:"",role:"Soft Support",team:"Aurora Gaming"},
kaori:{game:"Dota2",league:"",role:"Hard Support",team:"Aurora Gaming"},
natsumi:{game:"Dota2",league:"",role:"Carry",team:"OG"},
yopaj:{game:"Dota2",league:"",role:"Mid",team:"OG"},
nikko:{game:"Dota2",league:"",role:"Offlane",team:"OG"},
tims:{game:"Dota2",league:"",role:"Soft Support",team:"OG"},
skem:{game:"Dota2",league:"",role:"Hard Support",team:"OG"},
crystallis:{game:"Dota2",league:"",role:"Carry",team:"MOUZ"},
midone:{game:"Dota2",league:"",role:"Mid",team:"MOUZ"},
boom:{game:"Dota2",league:"",role:"Offlane",team:"MOUZ"},
yamich:{game:"Dota2",league:"",role:"Soft Support",team:"MOUZ"},
seleri:{game:"Dota2",league:"",role:"Hard Support",team:"MOUZ"},
miracle:{game:"Dota2",league:"",role:"Carry",team:"Nigma Galaxy"},
noob:{game:"Dota2",league:"",role:"Offlane",team:"Nigma Galaxy"},
sumail:{game:"Dota2",league:"",role:"Carry",team:"Nigma Galaxy"},
gh:{game:"Dota2",league:"",role:"Soft Support",team:"Nigma Galaxy"},
omar:{game:"Dota2",league:"",role:"Hard Support",team:"Nigma Galaxy"},
davailama:{game:"Dota2",league:"",role:"Offlane",team:"Nigma Galaxy"},
shad:{game:"Dota2",league:"",role:"Carry",team:"GamerLegion"},
rcy:{game:"Dota2",league:"",role:"Mid",team:"GamerLegion"},
fayde:{game:"Dota2",league:"",role:"Offlane",team:"GamerLegion"},
bignum:{game:"Dota2",league:"",role:"Soft Support",team:"GamerLegion"},
speeed:{game:"Dota2",league:"",role:"Hard Support",team:"GamerLegion"},
wits:{game:"Dota2",league:"",role:"Carry",team:"paiN Gaming"},
darkmago:{game:"Dota2",league:"",role:"Mid",team:"paiN Gaming"},
scofield:{game:"Dota2",league:"",role:"Soft Support",team:"paiN Gaming"},
frank:{game:"Dota2",league:"",role:"Offlane",team:"paiN Gaming"},
elmisho:{game:"Dota2",league:"",role:"Hard Support",team:"paiN Gaming"},
ghost_d:{game:"Dota2",league:"",role:"Carry",team:"Yakult Brothers"},
moon_d:{game:"Dota2",league:"",role:"Mid",team:"Yakult Brothers"},
yang:{game:"Dota2",league:"",role:"Offlane",team:"Yakult Brothers"},
boboka:{game:"Dota2",league:"",role:"Soft Support",team:"Yakult Brothers"},
jikroy:{game:"Dota2",league:"",role:"Carry",team:"REKONIX"},
inyourdream:{game:"Dota2",league:"",role:"Mid",team:"REKONIX"},
fbz:{game:"Dota2",league:"",role:"Offlane",team:"REKONIX"},
dalul:{game:"Dota2",league:"",role:"Soft Support",team:"REKONIX"},
varizh:{game:"Dota2",league:"",role:"Hard Support",team:"REKONIX"},
// ── CS2 TOP 50 — Rosters vérifiés HLTV/Liquipedia avril 2026 ──────────────

// #1 Vitality (HLTV #1)
apex:{game:"CS2",league:"",role:"IGL",team:"Vitality"},
ropz:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
zywoo:{game:"CS2",league:"",role:"AWPer",team:"Vitality"},
flamez:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
mezii:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
// #2 FURIA (HLTV #2)
fallen:{game:"CS2",league:"",role:"AWPer",team:"FURIA"},
yuurih:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
yekindar:{game:"CS2",league:"",role:"Entry",team:"FURIA"},
kscerato:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
molodoy:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
// #3 NaVi (HLTV #3)
aleksib:{game:"CS2",league:"",role:"IGL",team:"NaVi"},
im:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
b1t:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
wonderful:{game:"CS2",league:"",role:"AWPer",team:"NaVi"},
makazze:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
// #4 Team Falcons (HLTV #4)
niko:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
monesy:{game:"CS2",league:"",role:"AWPer",team:"Team Falcons"},
teses:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
kyxsan:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
kyousuke:{game:"CS2",league:"",role:"Entry",team:"Team Falcons"},
// #5 PARIVISION (HLTV #5)
jame:{game:"CS2",league:"",role:"AWPer",team:"PARIVISION"},
belchonokk:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
xielo:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
nota:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
zweih:{game:"CS2",league:"",role:"Entry",team:"PARIVISION"},
// #6 MOUZ (HLTV #6)
brollan:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
torzsi:{game:"CS2",league:"",role:"AWPer",team:"MOUZ"},
spinx:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
jimpphat:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
xertion:{game:"CS2",league:"",role:"IGL",team:"MOUZ"},
// #7 Aurora (HLTV #7)
xantares:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
woxic:{game:"CS2",league:"",role:"AWPer",team:"Aurora"},
maj3r:{game:"CS2",league:"",role:"IGL",team:"Aurora"},
wicadia:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
soulfly:{game:"CS2",league:"",role:"Entry",team:"Aurora"},
// #8 The MongolZ (HLTV #8)
blitz:{game:"CS2",league:"",role:"IGL",team:"The MongolZ"},
techno:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
mzinho:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
cs2910:{game:"CS2",league:"",role:"AWPer",team:"The MongolZ"},
cobrazera:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
// #9 Team Spirit (HLTV #9)
sh1ro:{game:"CS2",league:"",role:"AWPer",team:"Team Spirit"},
magixx:{game:"CS2",league:"",role:"IGL",team:"Team Spirit"},
tn1r:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
zont1x:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
donk:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
// #10 Astralis (HLTV #12)
hooxi:{game:"CS2",league:"",role:"IGL",team:"Astralis"},
jabbi:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
phzy:{game:"CS2",league:"",role:"AWPer",team:"Astralis"},
staehr:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
ryu:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
// #11 FaZe Clan (HLTV #11)
karrigan:{game:"CS2",league:"",role:"IGL",team:"FaZe Clan"},
twistzz:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
frozen:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
broky:{game:"CS2",league:"",role:"AWPer",team:"FaZe Clan"},
jcobbb:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
// #12 G2 Esports (HLTV #12)
hunter:{game:"CS2",league:"",role:"IGL",team:"G2 Esports"},
nertz2:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
sunpayus:{game:"CS2",league:"",role:"AWPer",team:"G2 Esports"},
heavygod:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
matys:{game:"CS2",league:"",role:"Entry",team:"G2 Esports"},
// #13 FUT Esports (HLTV #13)
calyx:{game:"CS2",league:"",role:"Entry",team:"FUT Esports"},
imorr:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
atilla:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
wicle:{game:"CS2",league:"",role:"AWPer",team:"FUT Esports"},
aunkere:{game:"CS2",league:"",role:"IGL",team:"FUT Esports"},
// #14 Legacy (HLTV #14)
art:{game:"CS2",league:"",role:"IGL",team:"Legacy"},
latto:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
dumau:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
n1ssim:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
saadzin:{game:"CS2",league:"",role:"AWPer",team:"Legacy"},
// #15 3DMAX (HLTV #15)
misutaaa:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
lucky:{game:"CS2",league:"",role:"AWPer",team:"3DMAX"},
maka:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
ex3rcice:{game:"CS2",league:"",role:"IGL",team:"3DMAX"},
graviti:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
// #16 HEROIC (HLTV #16)
xfl0ud:{game:"CS2",league:"",role:"AWPer",team:"HEROIC"},
nilo:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
susp:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
chr1zn:{game:"CS2",league:"",role:"IGL",team:"HEROIC"},
alkarenn:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
// #17 9z (HLTV #17)
cs2max:{game:"CS2",league:"",role:"Rifler",team:"9z"},
dgt:{game:"CS2",league:"",role:"AWPer",team:"9z"},
meyern:{game:"CS2",league:"",role:"Rifler",team:"9z"},
luchov:{game:"CS2",league:"",role:"Rifler",team:"9z"},
huasopeek:{game:"CS2",league:"",role:"IGL",team:"9z"},
// #18 Team Liquid (HLTV #18)
naf:{game:"CS2",league:"",role:"Rifler",team:"Liquid CS"},
elige:{game:"CS2",league:"",role:"Rifler",team:"Liquid CS"},
malbsmd:{game:"CS2",league:"",role:"IGL",team:"Liquid CS"},
siuhy:{game:"CS2",league:"",role:"Rifler",team:"Liquid CS"},
ultimate:{game:"CS2",league:"",role:"AWPer",team:"Liquid CS"},
// #19 paiN CS (HLTV #19)
biguzera:{game:"CS2",league:"",role:"Rifler",team:"paiN CS"},
dav1deus:{game:"CS2",league:"",role:"IGL",team:"paiN CS"},
skullz:{game:"CS2",league:"",role:"Rifler",team:"paiN CS"},
hardzao:{game:"CS2",league:"",role:"AWPer",team:"paiN CS"},
nqz:{game:"CS2",league:"",role:"Entry",team:"paiN CS"},
// #20 B8 (HLTV #20)
npl:{game:"CS2",league:"",role:"IGL",team:"B8"},
s1zzi:{game:"CS2",league:"",role:"Rifler",team:"B8"},
kensizor:{game:"CS2",league:"",role:"Rifler",team:"B8"},
alex666:{game:"CS2",league:"",role:"AWPer",team:"B8"},
esenthial:{game:"CS2",league:"",role:"Rifler",team:"B8"},
// #21 Gentle Mates (HLTV #21 — équipe espagnole)
alex:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
mopoz:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
sausol:{game:"CS2",league:"",role:"IGL",team:"Gentle Mates"},
dav1g:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
martinezsa:{game:"CS2",league:"",role:"AWPer",team:"Gentle Mates"},
// #22 GamerLegion CS (HLTV #22)
snax:{game:"CS2",league:"",role:"IGL",team:"GamerLegion CS"},
rez:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
tauson:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
hypex:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
pr:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
// #23 Monte (HLTV #23)
krad:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
almazer:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
ssau:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
tobiz:{game:"CS2",league:"",role:"IGL",team:"Monte"},
twist:{game:"CS2",league:"",role:"AWPer",team:"Monte"},
// #24 NiP (HLTV #24)
snappi:{game:"CS2",league:"",role:"IGL",team:"NiP"},
sjuush:{game:"CS2",league:"",role:"Rifler",team:"NiP"},
r1nkle:{game:"CS2",league:"",role:"AWPer",team:"NiP"},
xkacpersky:{game:"CS2",league:"",role:"Rifler",team:"NiP"},
cairne:{game:"CS2",league:"",role:"Rifler",team:"NiP"},
// #25 NRG CS (HLTV #25)
nitro:{game:"CS2",league:"",role:"IGL",team:"NRG CS"},
sonic:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
grim:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
osee:{game:"CS2",league:"",role:"AWPer",team:"NRG CS"},
br0:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
// #26 SINNERS Esports (HLTV #27)
torszi2:{game:"CS2",league:"",role:"AWPer",team:"SINNERS"},
neno:{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
beastik:{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
oskarish:{game:"CS2",league:"",role:"IGL",team:"SINNERS"},
ayken:{game:"CS2",league:"",role:"Entry",team:"SINNERS"},
// #27 BetBoom CS (HLTV #28)
boombl4:{game:"CS2",league:"",role:"IGL",team:"BetBoom CS"},
d1ledez:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
s1ren:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
artfr0st:{game:"CS2",league:"",role:"AWPer",team:"BetBoom CS"},
magnojez:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
// #28 HOTU (HLTV #29)
n0rb3r7:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
dukefissura:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
kalash:{game:"CS2",league:"",role:"IGL",team:"HOTU"},
mizu:{game:"CS2",league:"",role:"AWPer",team:"HOTU"},
frontales:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
// #29 Passion UA (HLTV #30)
jt:{game:"CS2",league:"",role:"IGL",team:"Passion UA"},
trycs:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
senzu:{game:"CS2",league:"",role:"AWPer",team:"Passion UA"},
kvem:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
nicx:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
// #30 BC.Game (HLTV ~27)
s1mple:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
electronic:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
mutir1s:{game:"CS2",league:"",role:"IGL",team:"BC.Game"},
krazy:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
aragornN:{game:"CS2",league:"",role:"Entry",team:"BC.Game"},
// #31 MIBR
lnz2:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
insani:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
brnz4n:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
venomzera:{game:"CS2",league:"",role:"AWPer",team:"MIBR"},
kl1m:{game:"CS2",league:"",role:"IGL",team:"MIBR"},
// #32 M80
oSee:{game:"CS2",league:"",role:"AWPer",team:"M80"},
cj:{game:"CS2",league:"",role:"IGL",team:"M80"},
jba:{game:"CS2",league:"",role:"Rifler",team:"M80"},
stavn2:{game:"CS2",league:"",role:"Rifler",team:"M80"},
slaxz2:{game:"CS2",league:"",role:"Rifler",team:"M80"},
// #33 100 Thieves
device:{game:"CS2",league:"",role:"AWPer",team:"100 Thieves"},
rain:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
ag1l:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
sirah:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
poiii:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
// #34 Sharks
gafolo:{game:"CS2",league:"",role:"IGL",team:"Sharks"},
koala:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
maxxkor:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
rdnzao:{game:"CS2",league:"",role:"AWPer",team:"Sharks"},
doc:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
// #35 TYLOO
gxx:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
bntet:{game:"CS2",league:"",role:"AWPer",team:"TYLOO"},
advent:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
cs2zero:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
mouz2:{game:"CS2",league:"",role:"IGL",team:"TYLOO"},
// #36 Imperial Esports
fell:{game:"CS2",league:"",role:"AWPer",team:"Imperial"},
boltz:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
decenty:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
neo2:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
tuxa:{game:"CS2",league:"",role:"IGL",team:"Imperial"},
// #37 illwill
fl0m:{game:"CS2",league:"",role:"IGL",team:"illwill"},
parabellum:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
junior:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
slaxz:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
infinite2:{game:"CS2",league:"",role:"AWPer",team:"illwill"},
// #38 RED Canids
lucas1:{game:"CS2",league:"",role:"AWPer",team:"RED Canids"},
nqz3:{game:"CS2",league:"",role:"Rifler",team:"RED Canids"},
kauez:{game:"CS2",league:"",role:"Rifler",team:"RED Canids"},
kng:{game:"CS2",league:"",role:"Entry",team:"RED Canids"},
saffee:{game:"CS2",league:"",role:"AWPer",team:"RED Canids"},
// #39 FlyQuest CS
story:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
kyxo:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
djl:{game:"CS2",league:"",role:"IGL",team:"FlyQuest CS"},
motm:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
faNg:{game:"CS2",league:"",role:"AWPer",team:"FlyQuest CS"},
// #40 ECSTATIC
queenix:{game:"CS2",league:"",role:"AWPer",team:"ECSTATIC"},
kristou:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
jkaem:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
nodios:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
magisk2:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
// ── PGL Bucharest 2026 — équipes non encore dans la base ──
// Inner Circle Esports (avril 2026 — qualifier EU)
headtr1ck:{game:"CS2",league:"",role:"AWPer",team:"Inner Circle"},
cptkurtka023:{game:"CS2",league:"",role:"Rifler",team:"Inner Circle"},
onic:{game:"CS2",league:"",role:"Rifler",team:"Inner Circle"},
zeRRoFIX:{game:"CS2",league:"",role:"Rifler",team:"Inner Circle"},
dawy:{game:"CS2",league:"",role:"Rifler",team:"Inner Circle"},
flierax:{game:"CS2",league:"",role:"Rifler",team:"Inner Circle"},
// FOKUS (CS2, avril 2026)
ztr:{game:"CS2",league:"",role:"IGL",team:"FOKUS"},
volt:{game:"CS2",league:"",role:"AWPer",team:"FOKUS"},
banjo:{game:"CS2",league:"",role:"Rifler",team:"FOKUS"},
jorko:{game:"CS2",league:"",role:"Rifler",team:"FOKUS"},
matheos:{game:"CS2",league:"",role:"Rifler",team:"FOKUS"},
// Wildcard (CS2, avril 2026)
mhL:{game:"CS2",league:"",role:"AWPer",team:"Wildcard CS"},
reck:{game:"CS2",league:"",role:"Rifler",team:"Wildcard CS"},
hext:{game:"CS2",league:"",role:"Rifler",team:"Wildcard CS"},
nemanha_wc:{game:"CS2",league:"",role:"Rifler",team:"Wildcard CS"},
peeping:{game:"CS2",league:"",role:"IGL",team:"Wildcard CS"},
// Team Voca (CS2, avril 2026) — junior & Jeorge rejoints en mars 2026
junior_voca:{game:"CS2",league:"",role:"Entry",team:"Team Voca"},
infinite_voca:{game:"CS2",league:"",role:"Rifler",team:"Team Voca"},
nosraC:{game:"CS2",league:"",role:"Rifler",team:"Team Voca"},
snav:{game:"CS2",league:"",role:"IGL",team:"Team Voca"},
jeorge:{game:"CS2",league:"",role:"AWPer",team:"Team Voca"},
// NRG (CS2, avril 2026 — Grim remplace Jeorge en fév. 2026)
nitr0:{game:"CS2",league:"",role:"IGL",team:"NRG CS"},
sonic_nrg:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
osee:{game:"CS2",league:"",role:"AWPer",team:"NRG CS"},
grim:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
br0:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
// MIBR (CS2, avril 2026 — LNZ IGL depuis jan. 2026)
lnz:{game:"CS2",league:"",role:"IGL",team:"MIBR CS"},
brnz4n:{game:"CS2",league:"",role:"Rifler",team:"MIBR CS"},
insani_mibr:{game:"CS2",league:"",role:"Rifler",team:"MIBR CS"},
venomzera:{game:"CS2",league:"",role:"AWPer",team:"MIBR CS"},
kl1m:{game:"CS2",league:"",role:"Rifler",team:"MIBR CS"},
// PARIVISION (CS2, avril 2026)
jame:{game:"CS2",league:"",role:"AWPer",team:"PARIVISION CS"},
belchonokk:{game:"CS2",league:"",role:"IGL",team:"PARIVISION CS"},
xielo:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION CS"},
nota_pari:{game:"CS2",league:"",role:"Entry",team:"PARIVISION CS"},
zweih:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION CS"},
// The MongolZ (CS2, avril 2026 — cobrazera remplace Senzu jan. 2026)
blitz:{game:"CS2",league:"",role:"IGL",team:"The MongolZ"},
techno:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
mzinho:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
cs2_910:{game:"CS2",league:"",role:"AWPer",team:"The MongolZ"},
cobrazera:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
// BC.Game (CS2, avril 2026)
s1mple:{game:"CS2",league:"",role:"Rifler",team:"BC.Game CS"},
electroNic:{game:"CS2",league:"",role:"Rifler",team:"BC.Game CS"},
mutir1s:{game:"CS2",league:"",role:"IGL",team:"BC.Game CS"},
aragornN:{game:"CS2",league:"",role:"Rifler",team:"BC.Game CS"},
krazy:{game:"CS2",league:"",role:"Entry",team:"BC.Game CS"},
// 3DMAX (CS2, avril 2026 — bodyy loué à OG; misutaaa remplace bodyy fév. 2026)
lucky_3dmax:{game:"CS2",league:"",role:"Rifler",team:"3DMAX CS"},
misutaaa:{game:"CS2",league:"",role:"Rifler",team:"3DMAX CS"},
maka:{game:"CS2",league:"",role:"IGL/AWP",team:"3DMAX CS"},
ex3rcice:{game:"CS2",league:"",role:"Rifler",team:"3DMAX CS"},
graviti:{game:"CS2",league:"",role:"Rifler",team:"3DMAX CS"},
// Astralis (CS2, avril 2026 — phzy & ryu rejoints jan. 2026)
hooxi:{game:"CS2",league:"",role:"IGL",team:"Astralis CS"},
jabbi:{game:"CS2",league:"",role:"Rifler",team:"Astralis CS"},
phzy:{game:"CS2",league:"",role:"AWPer",team:"Astralis CS"},
staehr:{game:"CS2",league:"",role:"Rifler",team:"Astralis CS"},
ryu_cs2:{game:"CS2",league:"",role:"Rifler",team:"Astralis CS"},
// Legacy (CS2, avril 2026 — arT IGL depuis fév. 2026, lux benché)
art_legacy:{game:"CS2",league:"",role:"IGL",team:"Legacy CS"},
latto:{game:"CS2",league:"",role:"Rifler",team:"Legacy CS"},
dumau:{game:"CS2",league:"",role:"Rifler",team:"Legacy CS"},
n1ssim:{game:"CS2",league:"",role:"Rifler",team:"Legacy CS"},
saadzin:{game:"CS2",league:"",role:"AWPer",team:"Legacy CS"},
// #41 fnatic
blamef:{game:"CS2",league:"",role:"IGL",team:"fnatic"},
nicoodoz:{game:"CS2",league:"",role:"Rifler",team:"fnatic"},
afro:{game:"CS2",league:"",role:"Rifler",team:"fnatic"},
matys2:{game:"CS2",league:"",role:"Entry",team:"fnatic"},
farlig:{game:"CS2",league:"",role:"AWPer",team:"fnatic"},
// #42 Alliance
twist2:{game:"CS2",league:"",role:"Rifler",team:"Alliance"},
lekr0:{game:"CS2",league:"",role:"IGL",team:"Alliance"},
adamb:{game:"CS2",league:"",role:"Rifler",team:"Alliance"},
regali:{game:"CS2",league:"",role:"AWPer",team:"Alliance"},
birdfromsky:{game:"CS2",league:"",role:"Rifler",team:"Alliance"},
// #43 OG CS
mantuu:{game:"CS2",league:"",role:"AWPer",team:"OG CS"},
flamezes:{game:"CS2",league:"",role:"Rifler",team:"OG CS"},
nexa:{game:"CS2",league:"",role:"IGL",team:"OG CS"},
valdes:{game:"CS2",league:"",role:"Rifler",team:"OG CS"},
nbk:{game:"CS2",league:"",role:"Rifler",team:"OG CS"},
// #44 K27
jl:{game:"CS2",league:"",role:"Entry",team:"K27"},
kairon:{game:"CS2",league:"",role:"IGL",team:"K27"},
allu:{game:"CS2",league:"",role:"AWPer",team:"K27"},
maden:{game:"CS2",league:"",role:"Rifler",team:"K27"},
relaxa:{game:"CS2",league:"",role:"Rifler",team:"K27"},
// #45 BIG
syrson:{game:"CS2",league:"",role:"AWPer",team:"BIG"},
krimbo:{game:"CS2",league:"",role:"Rifler",team:"BIG"},
faven:{game:"CS2",league:"",role:"Rifler",team:"BIG"},
taber:{game:"CS2",league:"",role:"Rifler",team:"BIG"},
prosus:{game:"CS2",league:"",role:"IGL",team:"BIG"},
// #46 Nemiga Gaming
impulse:{game:"CS2",league:"",role:"Rifler",team:"Nemiga"},
kairi:{game:"CS2",league:"",role:"AWPer",team:"Nemiga"},
groove:{game:"CS2",league:"",role:"Rifler",team:"Nemiga"},
ssm:{game:"CS2",league:"",role:"IGL",team:"Nemiga"},
r1nkle2:{game:"CS2",league:"",role:"Rifler",team:"Nemiga"},
// #47 Lynn Vision
jamyoung:{game:"CS2",league:"",role:"Rifler",team:"Lynn Vision"},
starry2:{game:"CS2",league:"",role:"Rifler",team:"Lynn Vision"},
zero2:{game:"CS2",league:"",role:"Rifler",team:"Lynn Vision"},
mouz3:{game:"CS2",league:"",role:"IGL",team:"Lynn Vision"},
afufu:{game:"CS2",league:"",role:"AWPer",team:"Lynn Vision"},
// #48 EYEBALLERS
jw:{game:"CS2",league:"",role:"AWPer",team:"EYEBALLERS"},
f0rest:{game:"CS2",league:"",role:"Rifler",team:"EYEBALLERS"},
xizt:{game:"CS2",league:"",role:"IGL",team:"EYEBALLERS"},
flusha:{game:"CS2",league:"",role:"Rifler",team:"EYEBALLERS"},
krimz:{game:"CS2",league:"",role:"Rifler",team:"EYEBALLERS"},
// #49 9INE (roster 2026)
raalz:{game:"CS2",league:"",role:"IGL",team:"9INE"},
bnox:{game:"CS2",league:"",role:"Rifler",team:"9INE"},
kraghen:{game:"CS2",league:"",role:"Rifler",team:"9INE"},
flayy:{game:"CS2",league:"",role:"AWPer",team:"9INE"},
cejot:{game:"CS2",league:"",role:"Entry",team:"9INE"},
// #50 Apogee Esports
hatu:{game:"CS2",league:"",role:"AWPer",team:"Apogee"},
dukefissura2:{game:"CS2",league:"",role:"Rifler",team:"Apogee"},
krade:{game:"CS2",league:"",role:"Rifler",team:"Apogee"},
krabo:{game:"CS2",league:"",role:"IGL",team:"Apogee"},
xfl2:{game:"CS2",league:"",role:"Rifler",team:"Apogee"},
tex:{game:"Valorant",league:"Americas",role:"Controller",team:"MIBR"},
zekken:{game:"Valorant",league:"Americas",role:"Flex",team:"MIBR"},
mazino:{game:"Valorant",league:"Americas",role:"Initiator",team:"MIBR"},
aspas:{game:"Valorant",league:"Americas",role:"Duelist",team:"MIBR"},
verno:{game:"Valorant",league:"Americas",role:"IGL",team:"MIBR"},
brawk:{game:"Valorant",league:"Americas",role:"Initiator",team:"NRG VAL"},
mada:{game:"Valorant",league:"Americas",role:"Duelist",team:"NRG VAL"},
skuba:{game:"Valorant",league:"Americas",role:"Sentinel",team:"NRG VAL"},
ethan:{game:"Valorant",league:"Americas",role:"Flex",team:"NRG VAL"},
keiko:{game:"Valorant",league:"Americas",role:"Duelist",team:"NRG VAL"},
nerve:{game:"Valorant",league:"Americas",role:"Duelist",team:"FURIA VAL"},
eeiu:{game:"Valorant",league:"Americas",role:"Initiator",team:"FURIA VAL"},
koalanoob:{game:"Valorant",league:"Americas",role:"Sentinel",team:"FURIA VAL"},
artzin:{game:"Valorant",league:"Americas",role:"IGL",team:"FURIA VAL"},
alym:{game:"Valorant",league:"Americas",role:"Controller",team:"FURIA VAL"},
babybay:{game:"Valorant",league:"Americas",role:"Duelist",team:"G2 VAL"},
valyn:{game:"Valorant",league:"Americas",role:"IGL",team:"G2 VAL"},
jawgemo:{game:"Valorant",league:"Americas",role:"Duelist",team:"G2 VAL"},
leaf:{game:"Valorant",league:"Americas",role:"Sentinel",team:"G2 VAL"},
trent:{game:"Valorant",league:"Americas",role:"Initiator",team:"G2 VAL"},
zellsis:{game:"Valorant",league:"Americas",role:"Flex",team:"Cloud9 VAL"},
penny:{game:"Valorant",league:"Americas",role:"Initiator",team:"Cloud9 VAL"},
xeppaa:{game:"Valorant",league:"Americas",role:"Flex",team:"Cloud9 VAL"},
v1c:{game:"Valorant",league:"Americas",role:"Controller",team:"Cloud9 VAL"},
oxy:{game:"Valorant",league:"Americas",role:"Duelist",team:"Cloud9 VAL"},
johnqt:{game:"Valorant",league:"Americas",role:"Sentinel",team:"Sentinels VAL"},
jonahp:{game:"Valorant",league:"Americas",role:"Flex",team:"Sentinels VAL"},
cortezia:{game:"Valorant",league:"Americas",role:"Initiator",team:"Sentinels VAL"},
reduxx:{game:"Valorant",league:"Americas",role:"Duelist",team:"Sentinels VAL"},
kyu:{game:"Valorant",league:"Americas",role:"IGL",team:"Sentinels VAL"},
kingg:{game:"Valorant",league:"Americas",role:"IGL",team:"Leviatan"},
blowz:{game:"Valorant",league:"Americas",role:"Initiator",team:"Leviatan"},
sato:{game:"Valorant",league:"Americas",role:"Duelist",team:"Leviatan"},
spike:{game:"Valorant",league:"Americas",role:"Duelist",team:"Leviatan"},
neon:{game:"Valorant",league:"Americas",role:"Controller",team:"Leviatan"},
pancada:{game:"Valorant",league:"Americas",role:"IGL",team:"LOUD"},
virtyy:{game:"Valorant",league:"Americas",role:"Duelist",team:"LOUD"},
cauanzin:{game:"Valorant",league:"Americas",role:"Initiator",team:"LOUD"},
darker:{game:"Valorant",league:"Americas",role:"Flex",team:"LOUD"},
lukxo:{game:"Valorant",league:"Americas",role:"Controller",team:"LOUD"},
asuna:{game:"Valorant",league:"Americas",role:"Duelist",team:"100T VAL"},
bang:{game:"Valorant",league:"Americas",role:"Controller",team:"100T VAL"},
cryocells:{game:"Valorant",league:"Americas",role:"Duelist",team:"100T VAL"},
vora:{game:"Valorant",league:"Americas",role:"Sentinel",team:"100T VAL"},
timotino:{game:"Valorant",league:"Americas",role:"Initiator",team:"100T VAL"},
c0m:{game:"Valorant",league:"Americas",role:"IGL",team:"Evil Geniuses VAL"},
supamen:{game:"Valorant",league:"Americas",role:"Duelist",team:"Evil Geniuses VAL"},
okeanos:{game:"Valorant",league:"Americas",role:"Initiator",team:"Evil Geniuses VAL"},
dgzin:{game:"Valorant",league:"Americas",role:"Duelist",team:"Evil Geniuses VAL"},
bao:{game:"Valorant",league:"Americas",role:"Controller",team:"Evil Geniuses VAL"},
saadhak:{game:"Valorant",league:"Americas",role:"IGL",team:"KRU"},
mwzera:{game:"Valorant",league:"Americas",role:"Duelist",team:"KRU"},
less:{game:"Valorant",league:"Americas",role:"Initiator",team:"KRU"},
silentzz:{game:"Valorant",league:"Americas",role:"Controller",team:"KRU"},
dantedeu5:{game:"Valorant",league:"Americas",role:"Flex",team:"KRU"},
rossy:{game:"Valorant",league:"Americas",role:"Controller",team:"ENVY VAL"},
keznit:{game:"Valorant",league:"Americas",role:"Duelist",team:"ENVY VAL"},
p0ppin:{game:"Valorant",league:"Americas",role:"Initiator",team:"ENVY VAL"},
demon1:{game:"Valorant",league:"Americas",role:"Duelist",team:"ENVY VAL"},
eggsterr:{game:"Valorant",league:"Americas",role:"Flex",team:"ENVY VAL"},
boaster:{game:"Valorant",league:"EMEA",role:"IGL",team:"Fnatic VAL"},
alfajer:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Fnatic VAL"},
kaajak:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Fnatic VAL"},
crashies:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Fnatic VAL"},
veqaj:{game:"Valorant",league:"EMEA",role:"Controller",team:"Fnatic VAL"},
jamppi:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Vitality VAL"},
derke:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Vitality VAL"},
sayonara:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Vitality VAL"},
chronicle:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"Vitality VAL"},
profek:{game:"Valorant",league:"EMEA",role:"Controller",team:"Vitality VAL"},
nats:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"Liquid VAL"},
kamo:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Liquid VAL"},
miniboo:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Liquid VAL"},
purp0:{game:"Valorant",league:"EMEA",role:"Controller",team:"Liquid VAL"},
wayne:{game:"Valorant",league:"EMEA",role:"IGL",team:"Liquid VAL"},
rose:{game:"Valorant",league:"EMEA",role:"Duelist",team:"BBL Esports"},
umu7:{game:"Valorant",league:"EMEA",role:"Duelist",team:"BBL Esports"},
loita:{game:"Valorant",league:"EMEA",role:"Controller",team:"BBL Esports"},
lar0k:{game:"Valorant",league:"EMEA",role:"Initiator",team:"BBL Esports"},
crewen:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"BBL Esports"},
starxo:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Gentle Mates VAL"},
minny:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Gentle Mates VAL"},
bipo:{game:"Valorant",league:"EMEA",role:"Controller",team:"Gentle Mates VAL"},
glyph:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"Gentle Mates VAL"},
marteen:{game:"Valorant",league:"EMEA",role:"IGL",team:"Gentle Mates VAL"},
cloud:{game:"Valorant",league:"EMEA",role:"Controller",team:"GIANTX VAL"},
westside:{game:"Valorant",league:"EMEA",role:"Initiator",team:"GIANTX VAL"},
ara:{game:"Valorant",league:"EMEA",role:"Duelist",team:"GIANTX VAL"},
flickless:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"GIANTX VAL"},
grubinho:{game:"Valorant",league:"EMEA",role:"IGL",team:"GIANTX VAL"},
boo:{game:"Valorant",league:"EMEA",role:"Flex",team:"Team Heretics VAL"},
benjyfishy:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Team Heretics VAL"},
riens:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Team Heretics VAL"},
wo0t:{game:"Valorant",league:"EMEA",role:"Controller",team:"Team Heretics VAL"},
comeback:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"Team Heretics VAL"},
shao:{game:"Valorant",league:"EMEA",role:"Duelist",team:"NaVi VAL"},
hiro:{game:"Valorant",league:"EMEA",role:"Duelist",team:"NaVi VAL"},
ruxic:{game:"Valorant",league:"EMEA",role:"IGL",team:"NaVi VAL"},
filu:{game:"Valorant",league:"EMEA",role:"Initiator",team:"NaVi VAL"},
sociablee:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"NaVi VAL"},
sheydos:{game:"Valorant",league:"EMEA",role:"Duelist",team:"Karmine Corp VAL"},
dos9:{game:"Valorant",league:"EMEA",role:"Initiator",team:"Karmine Corp VAL"},
suygetsu:{game:"Valorant",league:"EMEA",role:"Controller",team:"Karmine Corp VAL"},
lewn:{game:"Valorant",league:"EMEA",role:"Flex",team:"Karmine Corp VAL"},
avez:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"Karmine Corp VAL"},
mrfalin:{game:"Valorant",league:"EMEA",role:"Duelist",team:"FUT VAL"},
yetujey:{game:"Valorant",league:"EMEA",role:"Initiator",team:"FUT VAL"},
krostaly:{game:"Valorant",league:"EMEA",role:"Controller",team:"FUT VAL"},
xeus:{game:"Valorant",league:"EMEA",role:"Flex",team:"FUT VAL"},
baha:{game:"Valorant",league:"EMEA",role:"Sentinel",team:"FUT VAL"},
cned:{game:"Valorant",league:"EMEA",role:"Duelist",team:"PCIFIC"},
ninja:{game:"Valorant",league:"EMEA",role:"IGL",team:"PCIFIC"},
qpert:{game:"Valorant",league:"EMEA",role:"Controller",team:"PCIFIC"},
seven:{game:"Valorant",league:"EMEA",role:"Initiator",team:"PCIFIC"},
alorante:{game:"Valorant",league:"EMEA",role:"Duelist",team:"PCIFIC"},
xross:{game:"Valorant",league:"Pacific",role:"Duelist",team:"Nongshim VAL"},
rb:{game:"Valorant",league:"Pacific",role:"Initiator",team:"Nongshim VAL"},
francis:{game:"Valorant",league:"Pacific",role:"Controller",team:"Nongshim VAL"},
dambi:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"Nongshim VAL"},
ivy:{game:"Valorant",league:"Pacific",role:"IGL",team:"Nongshim VAL"},
t1guma:{game:"Valorant",league:"Pacific",role:"Duelist",team:"T1 VAL"},
t1ban:{game:"Valorant",league:"Pacific",role:"Controller",team:"T1 VAL"},
t1mako:{game:"Valorant",league:"Pacific",role:"IGL",team:"T1 VAL"},
t1beyn:{game:"Valorant",league:"Pacific",role:"Duelist",team:"T1 VAL"},
stax:{game:"Valorant",league:"Pacific",role:"Initiator",team:"T1 VAL"},
invy:{game:"Valorant",league:"Pacific",role:"Duelist",team:"Paper Rex"},
jinggg:{game:"Valorant",league:"Pacific",role:"Duelist",team:"Paper Rex"},
forsaken:{game:"Valorant",league:"Pacific",role:"Initiator",team:"Paper Rex"},
d4v41:{game:"Valorant",league:"Pacific",role:"Controller",team:"Paper Rex"},
something:{game:"Valorant",league:"Pacific",role:"IGL",team:"Paper Rex"},
crazyguy:{game:"Valorant",league:"Pacific",role:"IGL",team:"RRQ"},
monyet:{game:"Valorant",league:"Pacific",role:"Duelist",team:"RRQ"},
xffero:{game:"Valorant",league:"Pacific",role:"Initiator",team:"RRQ"},
kush:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"RRQ"},
jemkin:{game:"Valorant",league:"Pacific",role:"Controller",team:"RRQ"},
beyn:{game:"Valorant",league:"Pacific",role:"Duelist",team:"DRX VAL"},
free1ng:{game:"Valorant",league:"Pacific",role:"Initiator",team:"DRX VAL"},
hyunmin:{game:"Valorant",league:"Pacific",role:"Controller",team:"DRX VAL"},
hermes:{game:"Valorant",league:"Pacific",role:"IGL",team:"DRX VAL"},
mako:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"DRX VAL"},
lakia:{game:"Valorant",league:"Pacific",role:"Initiator",team:"Gen.G VAL"},
zynx:{game:"Valorant",league:"Pacific",role:"Controller",team:"Gen.G VAL"},
ash:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"Gen.G VAL"},
karon:{game:"Valorant",league:"Pacific",role:"Duelist",team:"Gen.G VAL"},
t3xture:{game:"Valorant",league:"Pacific",role:"Duelist",team:"Gen.G VAL"},
leviathan:{game:"Valorant",league:"Pacific",role:"IGL",team:"FULL SENSE"},
killua:{game:"Valorant",league:"Pacific",role:"Duelist",team:"FULL SENSE"},
thyy:{game:"Valorant",league:"Pacific",role:"Initiator",team:"FULL SENSE"},
primmie:{game:"Valorant",league:"Pacific",role:"Controller",team:"FULL SENSE"},
jitboys:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"FULL SENSE"},
akame:{game:"Valorant",league:"Pacific",role:"IGL",team:"DFM VAL"},
caedye:{game:"Valorant",league:"Pacific",role:"Duelist",team:"DFM VAL"},
meiy:{game:"Valorant",league:"Pacific",role:"Initiator",team:"DFM VAL"},
ssees:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"DFM VAL"},
yatsuka:{game:"Valorant",league:"Pacific",role:"Controller",team:"DFM VAL"},
c1nder:{game:"Valorant",league:"Pacific",role:"Duelist",team:"VARREL"},
klaus:{game:"Valorant",league:"Pacific",role:"IGL",team:"VARREL"},
xuna:{game:"Valorant",league:"Pacific",role:"Controller",team:"VARREL"},
oonzmlp:{game:"Valorant",league:"Pacific",role:"Initiator",team:"VARREL"},
zexy:{game:"Valorant",league:"Pacific",role:"Sentinel",team:"VARREL"},

  // ═══════════════════════════════════════════════
  // VCT AMERICAS 2026 — ROSTERS COMPLETS
  // ═══════════════════════════════════════════════
  // FURIA (rebuild complet 2026)
  nerve_furia:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"FURIA VAL 26"},
  // G2 Esports Americas (Ascension)
  babybay_g2:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"G2 VAL 26"},
  jawgemo_g2:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"G2 VAL 26"},
  leaf_g2:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"G2 VAL 26"},
  trent_g2:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"G2 VAL 26"},
  // LOUD
  pancada_loud:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"LOUD VAL 26"},
  // MIBR
  aspas:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"MIBR VAL 26"},
  zekken:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"MIBR VAL 26"},
  mazino_mibr:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"MIBR VAL 26"},
  tex_mibr:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"MIBR VAL 26"},
  less_mibr:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"MIBR VAL 26"},
  // NRG (Champions 2025)
  ethan_nrg:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"NRG VAL 26"},
  mada_nrg:{game:"Valorant",league:"VCT Americas",role:"Controller",team:"NRG VAL 26"},
  brawk_nrg:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"NRG VAL 26"},
  skuba_nrg:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"NRG VAL 26"},
  keiko_nrg:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"NRG VAL 26"},
  // Sentinels
  kyu_sen:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"Sentinels VAL"},
  // 100 Thieves
  asuna_100t:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"100T VAL 26"},
  bang_100t:{game:"Valorant",league:"VCT Americas",role:"Support",team:"100T VAL 26"},
  vora_100t:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"100T VAL 26"},
  // Cloud9
  oxy_c9:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"Cloud9 VAL"},
  penny_c9:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"Cloud9 VAL"},
  // Evil Geniuses
  c0m_eg:{game:"Valorant",league:"VCT Americas",role:"IGL",team:"EG VAL"},
  supamen_eg:{game:"Valorant",league:"VCT Americas",role:"Duelist",team:"EG VAL"},
  bao_eg:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"EG VAL"},
  // Leviatán
  spike_lev:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"Leviatán VAL"},
  sato_lev:{game:"Valorant",league:"VCT Americas",role:"Flex",team:"Leviatán VAL"},
  // KRÜ Esports
  shyy:{game:"Valorant",league:"VCT Americas",role:"Initiator",team:"KRÜ VAL"},
  melser:{game:"Valorant",league:"VCT Americas",role:"Sentinel",team:"KRÜ VAL"},
  // ENVY (Ascension)

  // ═══════════════════════════════════════════════
  // VCT EMEA 2026 — ROSTERS COMPLETS
  // ═══════════════════════════════════════════════
  // BBL Esports (champion Kickoff)
  // Fnatic
  alfajer_fnc:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Fnatic VAL 26"},
  boaster_fnc:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Fnatic VAL 26"},
  // Team Vitality (+ Chronicle)
  chronicle_vit:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Vitality VAL"},
  derke:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Vitality VAL"},
  profek:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Vitality VAL"},
  jamppi:{game:"Valorant",league:"VCT EMEA",role:"Flex",team:"Vitality VAL"},
  sayonara:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Vitality VAL"},
  // Team Liquid
  nats_tl:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Team Liquid VAL"},
  // Gentle Mates
  starxo:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Gentle Mates VAL"},
  glyph:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Gentle Mates VAL"},
  marteen:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Gentle Mates VAL"},
  bipo:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Gentle Mates VAL"},
  minny:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Gentle Mates VAL"},
  // Team Heretics
  boo_th:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Team Heretics VAL"},
  riens:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Team Heretics VAL"},
  benjyfishy:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Team Heretics VAL"},
  comeback_th:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Team Heretics VAL"},
  // NAVI
  filu:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"NAVI VAL"},
  chloric:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"NAVI VAL"},
  hiro_navi:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"NAVI VAL"},
  kolosha:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"NAVI VAL"},
  // Karmine Corp (ex-NAVI core)
  suygetsu_kc:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Karmine Corp VAL"},
  avez_kc:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Karmine Corp VAL"},
  dos9_kc:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Karmine Corp VAL"},
  lewn_kc:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"Karmine Corp VAL"},
  n4rrate_kc:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"Karmine Corp VAL"},
  // GIANTX
  cloud_gx:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"GIANTX VAL"},
  grubinho:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"GIANTX VAL"},
  flickless:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"GIANTX VAL"},
  ara_gx:{game:"Valorant",league:"VCT EMEA",role:"Flex",team:"GIANTX VAL"},
  westside:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"GIANTX VAL"},
  // FUT Esports
  sociablee:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"FUT Esports VAL"},
  yetujey:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"FUT Esports VAL"},
  xeus:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"FUT Esports VAL"},
  krostaly:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"FUT Esports VAL"},
  s0pp:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"FUT Esports VAL"},
  // Eternal Fire (remplace ULF)
  izzy_ef:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"Eternal Fire VAL"},
  nekky_ef:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"Eternal Fire VAL"},
  audaz_ef:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"Eternal Fire VAL"},
  favian_ef:{game:"Valorant",league:"VCT EMEA",role:"Flex",team:"Eternal Fire VAL"},
  // PCIFIC Esports
  cned:{game:"Valorant",league:"VCT EMEA",role:"Duelist",team:"PCIFIC Esports VAL"},
  al0rante:{game:"Valorant",league:"VCT EMEA",role:"IGL",team:"PCIFIC Esports VAL"},
  qpert:{game:"Valorant",league:"VCT EMEA",role:"Controller",team:"PCIFIC Esports VAL"},
  seven_pcf:{game:"Valorant",league:"VCT EMEA",role:"Initiator",team:"PCIFIC Esports VAL"},
  ninja_pcf:{game:"Valorant",league:"VCT EMEA",role:"Sentinel",team:"PCIFIC Esports VAL"},

  // ═══════════════════════════════════════════════
  // VCT PACIFIC 2026 — équipes restantes
  // ═══════════════════════════════════════════════
  // T1
  buzz_t1:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"T1 VAL"},
  izu_t1:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"T1 VAL"},
  meteor_t1:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"T1 VAL"},
  munchkin_t1:{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"T1 VAL"},
  stax:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"T1 VAL"},
  // DRX
  mako_drx:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"DRX VAL"},
  yong_drx:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"DRX VAL"},
  // Gen.G
  iZu_geng:{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Gen.G VAL"},
  ryu_geng:{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Gen.G VAL"},
  pumpkin_geng:{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Gen.G VAL"},
  hope_geng:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Gen.G VAL"},
  k1ng_geng:{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Gen.G VAL"},
  // Paper Rex
  something_prx:{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Paper Rex VAL"},
  // Global Esports
  "wippie":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Global Esports VAL"},
  "borkum":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Global Esports VAL"},
  "Lmemore":{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"Global Esports VAL"},
  "BerserX":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Global Esports VAL"},
  // Team Secret
  "jessievash":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"Team Secret VAL"},
  "kellyS_ts":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"Team Secret VAL"},
  "sylvan_ts":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"Team Secret VAL"},
  "tenten_ts":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"Team Secret VAL"},
  "rimuru_ts":{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"Team Secret VAL"},
  // Nongshim RedForce
  "xross_ns":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"NSR VAL"},
  "rb_ns":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"NSR VAL"},
  "francis_ns":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"NSR VAL"},
  "dambi_ns":{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"NSR VAL"},
  "ivy_ns":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"NSR VAL"},
  // DFM
  "TENNN_dfm":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"DFM VAL"},
  "Reita_dfm":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"DFM VAL"},
  "XQQ_dfm":{game:"Valorant",league:"VCT Pacific",role:"IGL",team:"DFM VAL"},
  // FULL SENSE
  "boo_fs":{game:"Valorant",league:"VCT Pacific",role:"Duelist",team:"FULL SENSE VAL"},
  "noppex":{game:"Valorant",league:"VCT Pacific",role:"Initiator",team:"FULL SENSE VAL"},
  "garnetS":{game:"Valorant",league:"VCT Pacific",role:"Controller",team:"FULL SENSE VAL"},
  "surf_fs":{game:"Valorant",league:"VCT Pacific",role:"Flex",team:"FULL SENSE VAL"},
  "JessieVash_fs":{game:"Valorant",league:"VCT Pacific",role:"Sentinel",team:"FULL SENSE VAL"},

  // ═══════════════════════════════════════════════
  // VCT CHINA 2026 — équipes restantes
  // ═══════════════════════════════════════════════
  // Bilibili Gaming
  "mistic_blg":{game:"Valorant",league:"VCT China",role:"Duelist",team:"BLG VAL"},
  "lmeore_blg":{game:"Valorant",league:"VCT China",role:"Controller",team:"BLG VAL"},
  "muggle_blg":{game:"Valorant",league:"VCT China",role:"IGL",team:"BLG VAL"},
  "xccurate":{game:"Valorant",league:"VCT China",role:"Initiator",team:"BLG VAL"},
  "Cr4t":{game:"Valorant",league:"VCT China",role:"Sentinel",team:"BLG VAL"},
  // FPX
  "berlin_fpx":{game:"Valorant",league:"VCT China",role:"Initiator",team:"FPX VAL"},
  // XLG Esports
  "stax_xlg":{game:"Valorant",league:"VCT China",role:"Duelist",team:"XLG VAL"},
  "s1mon_xlg":{game:"Valorant",league:"VCT China",role:"Controller",team:"XLG VAL"},
  "mDaiki":{game:"Valorant",league:"VCT China",role:"Flex",team:"XLG VAL"},
  "CHICHOO":{game:"Valorant",league:"VCT China",role:"Sentinel",team:"XLG VAL"},
  // JDG
  "LXQ":{game:"Valorant",league:"VCT China",role:"Duelist",team:"JDG VAL"},
  "Rb_jdg":{game:"Valorant",league:"VCT China",role:"Initiator",team:"JDG VAL"},
  "Autumn":{game:"Valorant",league:"VCT China",role:"Flex",team:"JDG VAL"},
  "cb_jdg":{game:"Valorant",league:"VCT China",role:"Sentinel",team:"JDG VAL"},
  // Wolves Esports
  "Satoshi_wolves":{game:"Valorant",league:"VCT China",role:"Duelist",team:"Wolves VAL"},
  "ZmjjKK":{game:"Valorant",league:"VCT China",role:"Controller",team:"Wolves VAL"},

  // ═══════════════════════════════════════════════
  // LCK 2026 — ROSTERS COMPLETS
  // ═══════════════════════════════════════════════
  // T1 (Worlds 2025 champs — Gumayusi → Peyz)
  // faker, oner, peyz déjà dans la base — ajout des manquants
  zeus_t1:{game:"LoL",league:"LCK",role:"Top Laner",team:"T1"},
  keria:{game:"LoL",league:"LCK",role:"Support",team:"T1"},
  // Gen.G (déjà chovy, ruler)
  doran_geng:{game:"LoL",league:"LCK",role:"Top Laner",team:"Gen.G"},
  peanut:{game:"LoL",league:"LCK",role:"Jungler",team:"Gen.G"},
  canyon:{game:"LoL",league:"LCK",role:"Jungler",team:"Gen.G"},
  lehends:{game:"LoL",league:"LCK",role:"Support",team:"Gen.G"},
  // HLE (Zeus, Kanavi, Zeka, Gumayusi, Delight)
  kanavi:{game:"LoL",league:"LCK",role:"Jungler",team:"HLE"},
  zeka:{game:"LoL",league:"LCK",role:"Mid Laner",team:"HLE"},
  delight:{game:"LoL",league:"LCK",role:"Support",team:"HLE"},
  // gumayusi déjà dans la base
  zeus_hle:{game:"LoL",league:"LCK",role:"Top Laner",team:"HLE"},
  // KT Rolster (Aiming, Ghost-rôle swap support, Cuzz, Pollu, nouveau mid)
  aiming:{game:"LoL",league:"LCK",role:"Bot Laner",team:"KT Rolster"},
  ghost_kt:{game:"LoL",league:"LCK",role:"Support",team:"KT Rolster"},
  cuzz:{game:"LoL",league:"LCK",role:"Jungler",team:"KT Rolster"},
  bdd:{game:"LoL",league:"LCK",role:"Mid Laner",team:"KT Rolster"},
  kiin:{game:"LoL",league:"LCK",role:"Top Laner",team:"KT Rolster"},
  // Dplus KIA (ShowMaker, Lucid, Siwoo, Smash, Career)
  showmaker:{game:"LoL",league:"LCK",role:"Mid Laner",team:"Dplus KIA"},
  lucid:{game:"LoL",league:"LCK",role:"Jungler",team:"Dplus KIA"},
  siwoo:{game:"LoL",league:"LCK",role:"Top Laner",team:"Dplus KIA"},
  smash_dp:{game:"LoL",league:"LCK",role:"Bot Laner",team:"Dplus KIA"},
  career_dp:{game:"LoL",league:"LCK",role:"Support",team:"Dplus KIA"},
  // DRX (Willer, ucal + nouveaux)
  willer_drx:{game:"LoL",league:"LCK",role:"Jungler",team:"DRX"},
  ucal:{game:"LoL",league:"LCK",role:"Mid Laner",team:"DRX"},
  // FEARX — ajout Daystar déjà fait, joueurs de base
  // BNK FearX LoL déjà complet dans la base
  // Nongshim RedForce (Scout, Sponge, Taeyoon)
  scout_ns:{game:"LoL",league:"LCK",role:"Mid Laner",team:"Nongshim RedForce"},
  sponge_ns:{game:"LoL",league:"LCK",role:"Jungler",team:"Nongshim RedForce"},
  // DN SOOPers (nouveau)
  kingen_dns:{game:"LoL",league:"LCK",role:"Top Laner",team:"DN SOOPers"},
  beryl_dns:{game:"LoL",league:"LCK",role:"Support",team:"DN SOOPers"},
  // BRION
  teddy_bro:{game:"LoL",league:"LCK",role:"Bot Laner",team:"BRION"},
  gideon_bro:{game:"LoL",league:"LCK",role:"Jungler",team:"BRION"},

  // ═══════════════════════════════════════════════
  // LPL 2026 — ROSTERS COMPLETS
  // ═══════════════════════════════════════════════
  // BLG (Xun, Viper revenu + Knight, Bin, ON)
  xun_blg:{game:"LoL",league:"LPL",role:"Jungler",team:"BLG"},
  viper_blg:{game:"LoL",league:"LPL",role:"Bot Laner",team:"BLG"},
  bin_blg:{game:"LoL",league:"LPL",role:"Top Laner",team:"BLG"},
  on_blg:{game:"LoL",league:"LPL",role:"Support",team:"BLG"},
  // JDG (GALA, Vampire, Xiaoxu, JunJia, HongQ)
  gala:{game:"LoL",league:"LPL",role:"Bot Laner",team:"JD Gaming"},
  vampire_jdg:{game:"LoL",league:"LPL",role:"Support",team:"JD Gaming"},
  xiaoxu:{game:"LoL",league:"LPL",role:"Top Laner",team:"JD Gaming"},
  junjia:{game:"LoL",league:"LPL",role:"Jungler",team:"JD Gaming"},
  hongq:{game:"LoL",league:"LPL",role:"Mid Laner",team:"JD Gaming"},
  // Weibo Gaming (Elk, jiejie, Zika/Breathe, Crisp/Erha)
  elk:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Weibo Gaming"},
  jiejie:{game:"LoL",league:"LPL",role:"Jungler",team:"Weibo Gaming"},
  zika:{game:"LoL",league:"LPL",role:"Top Laner",team:"Weibo Gaming"},
  xiaohu:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Weibo Gaming"},
  crisp:{game:"LoL",league:"LPL",role:"Support",team:"Weibo Gaming"},
  // TES (naiyou remplace Kanavi, reste)
  "369":{game:"LoL",league:"LPL",role:"Top Laner",team:"Top Esports"},
  naiyou:{game:"LoL",league:"LPL",role:"Jungler",team:"Top Esports"},
  rookie:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Top Esports"},
  jackeylove:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Top Esports"},
  mark_tes:{game:"LoL",league:"LPL",role:"Support",team:"Top Esports"},
  // EDG (Zdz, Xiaohao, Angel, Leave, Parukia)
  zdz:{game:"LoL",league:"LPL",role:"Top Laner",team:"EDward Gaming LPL"},
  xiaohao:{game:"LoL",league:"LPL",role:"Jungler",team:"EDward Gaming LPL"},
  angel:{game:"LoL",league:"LPL",role:"Mid Laner",team:"EDward Gaming LPL"},
  leave_edg:{game:"LoL",league:"LPL",role:"Bot Laner",team:"EDward Gaming LPL"},
  parukia:{game:"LoL",league:"LPL",role:"Support",team:"EDward Gaming LPL"},
  // Anyone's Legend (inchangé)
  ame:{game:"LoL",league:"LPL",role:"Carry",team:"Anyone's Legend"},
  nothingToSay:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Anyone's Legend"},
  "fy":{game:"LoL",league:"LPL",role:"Support",team:"Anyone's Legend"},
  xxs_al:{game:"LoL",league:"LPL",role:"Top Laner",team:"Anyone's Legend"},
  xnova:{game:"LoL",league:"LPL",role:"Flex",team:"Anyone's Legend"},
  // LNG
  ale_lng:{game:"LoL",league:"LPL",role:"Top Laner",team:"LNG Esports"},
  leyan:{game:"LoL",league:"LPL",role:"Jungler",team:"LNG Esports"},
  // NIP (Care mid, Zhuo, Assum)
  care_nip:{game:"LoL",league:"LPL",role:"Mid Laner",team:"NIP LPL"},
  zhuo_nip:{game:"LoL",league:"LPL",role:"Flex",team:"NIP LPL"},

  // ═══════════════════════════════════════════════
  // CS2 — TOP 60 HLTV (manquants)
  // ═══════════════════════════════════════════════
  // Vitality (#1 HLTV) — ZywOo déjà là + compléter
  mezii:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
  floss:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
  ropz:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
  brollan:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
  // MOUZ (torzsi AWP)
  torzsi:{game:"CS2",league:"",role:"AWPer",team:"MOUZ"},
  xertioN:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
  jimpphat:{game:"CS2",league:"",role:"Entry",team:"MOUZ"},
  siuhy:{game:"CS2",league:"",role:"IGL",team:"MOUZ"},
  "dexter_mouz":{game:"CS2",league:"",role:"Support",team:"MOUZ"},
  // Team Spirit (donk)
  donk:{game:"CS2",league:"",role:"Entry",team:"Team Spirit"},
  magixx:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
  chopper:{game:"CS2",league:"",role:"IGL",team:"Team Spirit"},
  zont1x:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
  tN1R:{game:"CS2",league:"",role:"AWPer",team:"Team Spirit"},
  // Aurora (MAJ3R, XANTARES, woxic, Wicadia, soulfly)
  "maj3r":{game:"CS2",league:"",role:"IGL",team:"Aurora"},
  xantares:{game:"CS2",league:"",role:"Entry",team:"Aurora"},
  woxic:{game:"CS2",league:"",role:"AWPer",team:"Aurora"},
  wicadia:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
  soulfly:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
  // Falcons (karrigan déjà là — reste)
  // FaZe déjà partiellement — compléter
  twistzz:{game:"CS2",league:"",role:"Entry",team:"FaZe Clan"},
  broky:{game:"CS2",league:"",role:"AWPer",team:"FaZe Clan"},
  jcobbb:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
  // G2 (huNter, NiKo, malbsMd, SunPayus, HeavyGod)
  niko_g2:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports CS"},
  "hunter_g2":{game:"CS2",league:"",role:"Entry",team:"G2 Esports CS"},
  malbsmd:{game:"CS2",league:"",role:"AWPer",team:"G2 Esports CS"},
  sunpayus:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports CS"},
  heavygod:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports CS"},
  // FUT Esports (HLTV #13)
  "dem0n_fut":{game:"CS2",league:"",role:"IGL",team:"FUT Esports CS"},
  "MAJ3R_fut":{game:"CS2",league:"",role:"AWPer",team:"FUT Esports CS"},
  "calyx":{game:"CS2",league:"",role:"Rifler",team:"FUT Esports CS"},
  "XANTARES_fut":{game:"CS2",league:"",role:"Entry",team:"FUT Esports CS"},
  "woxic_fut":{game:"CS2",league:"",role:"Rifler",team:"FUT Esports CS"},
  // Legacy (SA)
  "art_leg":{game:"CS2",league:"",role:"IGL",team:"Legacy CS2"},
  "latto":{game:"CS2",league:"",role:"Rifler",team:"Legacy CS2"},
  "dumau":{game:"CS2",league:"",role:"Rifler",team:"Legacy CS2"},
  "n1ssim":{game:"CS2",league:"",role:"AWPer",team:"Legacy CS2"},
  "saadzin":{game:"CS2",league:"",role:"Rifler",team:"Legacy CS2"},
  // HEROIC (raalz, shield, kraghen, bnox, cej0t + BERRY)
  "cadiaN":{game:"CS2",league:"",role:"IGL",team:"HEROIC"},
  "Nicoodoz":{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
  "stavn":{game:"CS2",league:"",role:"Entry",team:"HEROIC"},
  "TeSeS":{game:"CS2",league:"",role:"AWPer",team:"HEROIC"},
  "susp_h":{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
  // Liquid (Team Liquid CS2)
  "nitr0_tl":{game:"CS2",league:"",role:"IGL",team:"Team Liquid CS"},
  "jl_tl":{game:"CS2",league:"",role:"Rifler",team:"Team Liquid CS"},
  "faven_tl":{game:"CS2",league:"",role:"Rifler",team:"Team Liquid CS"},
  "NAF":{game:"CS2",league:"",role:"Rifler",team:"Team Liquid CS"},
  "nertZ":{game:"CS2",league:"",role:"AWPer",team:"Team Liquid CS"},
  // NAVI (Aleksib, iM, b1t, w0nderful, makazze)
  "aleksib":{game:"CS2",league:"",role:"IGL",team:"NAVI CS"},
  "im_navi":{game:"CS2",league:"",role:"Rifler",team:"NAVI CS"},
  "b1t":{game:"CS2",league:"",role:"Entry",team:"NAVI CS"},
  "w0nderful":{game:"CS2",league:"",role:"AWPer",team:"NAVI CS"},
  "makazze":{game:"CS2",league:"",role:"Rifler",team:"NAVI CS"},
  // Falcons CS2 (team Falcons CS2 — différent de Dota)
  "xertioN_f":{game:"CS2",league:"",role:"Rifler",team:"Falcons CS"},
  "flamez":{game:"CS2",league:"",role:"Entry",team:"Falcons CS"},
  "kyousuke_f":{game:"CS2",league:"",role:"AWPer",team:"Falcons CS"},
  "iM_f":{game:"CS2",league:"",role:"Rifler",team:"Falcons CS"},
  "fl0m":{game:"CS2",league:"",role:"IGL",team:"Falcons CS"},
  // paiN Gaming (SA)
  "vsm":{game:"CS2",league:"",role:"Entry",team:"paiN Gaming CS"},
  "brnz4n_pain":{game:"CS2",league:"",role:"Rifler",team:"paiN Gaming CS"},
  "biguzera":{game:"CS2",league:"",role:"IGL",team:"paiN Gaming CS"},
  "hardzao":{game:"CS2",league:"",role:"Rifler",team:"paiN Gaming CS"},
  "nqz":{game:"CS2",league:"",role:"AWPer",team:"paiN Gaming CS"},
  // TYLOO (top 21)
  "SkYz":{game:"CS2",league:"",role:"AWPer",team:"TYLOO"},
  "advent":{game:"CS2",league:"",role:"IGL",team:"TYLOO"},
  "Zero_tyloo":{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
  "Attacker":{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
  "khk":{game:"CS2",league:"",role:"Entry",team:"TYLOO"},
  // GamerLegion
  "volt_gl":{game:"CS2",league:"",role:"AWPer",team:"GamerLegion"},
  "isak_gl":{game:"CS2",league:"",role:"Rifler",team:"GamerLegion"},
  "iM_gl":{game:"CS2",league:"",role:"Rifler",team:"GamerLegion"},
  "DJF":{game:"CS2",league:"",role:"Entry",team:"GamerLegion"},
  "dycha":{game:"CS2",league:"",role:"IGL",team:"GamerLegion"},
  // Monte
  "NertZ_m":{game:"CS2",league:"",role:"AWPer",team:"Monte CS"},
  "PR":{game:"CS2",league:"",role:"Rifler",team:"Monte CS"},
  "kaboose":{game:"CS2",league:"",role:"Rifler",team:"Monte CS"},
  "smooya":{game:"CS2",league:"",role:"AWPer",team:"Monte CS"},
  // NiP (NiP CS2)
  "hampus":{game:"CS2",league:"",role:"IGL",team:"NiP CS"},
  "Brollan_nip":{game:"CS2",league:"",role:"Entry",team:"NiP CS"},
  "maxster":{game:"CS2",league:"",role:"Rifler",team:"NiP CS"},
  "headtr1ck_nip":{game:"CS2",league:"",role:"AWPer",team:"NiP CS"},
  // SINNERS (top 27)
  "oskar_sin":{game:"CS2",league:"",role:"AWPer",team:"SINNERS"},
  "FASHR":{game:"CS2",league:"",role:"Entry",team:"SINNERS"},
  "arrowtide":{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
  "majky":{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
  "BOROS":{game:"CS2",league:"",role:"IGL",team:"SINNERS"},
  // BetBoom
  "Boombl4":{game:"CS2",league:"",role:"IGL",team:"BetBoom CS"},
  "S1ren":{game:"CS2",league:"",role:"AWPer",team:"BetBoom CS"},
  "d1Ledez":{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
  "ArtFr0st":{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
  "Magnojez":{game:"CS2",league:"",role:"Entry",team:"BetBoom CS"},
  // BIG
  "blamef":{game:"CS2",league:"",role:"IGL",team:"BIG CS"},
  "tabsen":{game:"CS2",league:"",role:"Rifler",team:"BIG CS"},
  "faven":{game:"CS2",league:"",role:"Rifler",team:"BIG CS"},
  "JDC_big":{game:"CS2",league:"",role:"AWPer",team:"BIG CS"},
  "gr1ks":{game:"CS2",league:"",role:"Entry",team:"BIG CS"},
  // 9INE
  "raalz":{game:"CS2",league:"",role:"IGL",team:"9INE CS"},
  "kraghen":{game:"CS2",league:"",role:"AWPer",team:"9INE CS"},
  "bnox":{game:"CS2",league:"",role:"Entry",team:"9INE CS"},
  "flayy":{game:"CS2",league:"",role:"Rifler",team:"9INE CS"},
  "cej0t":{game:"CS2",league:"",role:"Rifler",team:"9INE CS"},
  // ECSTATIC
  "TMB":{game:"CS2",league:"",role:"IGL",team:"ECSTATIC"},
  "nicoodoz":{game:"CS2",league:"",role:"AWPer",team:"ECSTATIC"},
  "Anlelele":{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
  "Buzz_ec":{game:"CS2",league:"",role:"Entry",team:"ECSTATIC"},
  "nutnut":{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
  // Betclic Apogee
  "hades_bc":{game:"CS2",league:"",role:"AWPer",team:"Betclic Apogee"},
  "Demho":{game:"CS2",league:"",role:"Rifler",team:"Betclic Apogee"},
  "Prism_bc":{game:"CS2",league:"",role:"Rifler",team:"Betclic Apogee"},
  "eskyy":{game:"CS2",league:"",role:"Entry",team:"Betclic Apogee"},
  "Dr3nquu":{game:"CS2",league:"",role:"Rifler",team:"Betclic Apogee"},
  // TDK (Ax1Le, nafany)
  "zorte":{game:"CS2",league:"",role:"AWPer",team:"TDK"},
  "Ax1Le":{game:"CS2",league:"",role:"Entry",team:"TDK"},
  "nafany":{game:"CS2",league:"",role:"IGL",team:"TDK"},
  "sugaR":{game:"CS2",league:"",role:"Rifler",team:"TDK"},
  "Xant3r":{game:"CS2",league:"",role:"Rifler",team:"TDK"},
  // Marsborne
  "WolfY_mb":{game:"CS2",league:"",role:"IGL",team:"Marsborne"},
  "motm_mb":{game:"CS2",league:"",role:"AWPer",team:"Marsborne"},
  "cxzi":{game:"CS2",league:"",role:"Rifler",team:"Marsborne"},
  "chop_mb":{game:"CS2",league:"",role:"Entry",team:"Marsborne"},
  "Grizz":{game:"CS2",league:"",role:"Rifler",team:"Marsborne"},
  // EYEBALLERS
  "JW":{game:"CS2",league:"",role:"AWPer",team:"EYEBALLERS"},
  "maxster_eye":{game:"CS2",league:"",role:"Rifler",team:"EYEBALLERS"},
  "Ro1f":{game:"CS2",league:"",role:"Entry",team:"EYEBALLERS"},
  "bobeksde":{game:"CS2",league:"",role:"Rifler",team:"EYEBALLERS"},
  "dex":{game:"CS2",league:"",role:"IGL",team:"EYEBALLERS"},
  // Passion UA
  "JT_pua":{game:"CS2",league:"",role:"IGL",team:"Passion UA"},
  "try_pua":{game:"CS2",league:"",role:"AWPer",team:"Passion UA"},
  "Senzu_pua":{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
  "Kvem":{game:"CS2",league:"",role:"Entry",team:"Passion UA"},
  "nicx":{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
  // FlyQuest
  "jks_fq":{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
  "INS_fq":{game:"CS2",league:"",role:"Entry",team:"FlyQuest CS"},
  "Vexite":{game:"CS2",league:"",role:"IGL",team:"FlyQuest CS"},
  "nettik":{game:"CS2",league:"",role:"AWPer",team:"FlyQuest CS"},
  "story_fq":{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},

  // ═══════════════════════════════════════════════
  // DOTA 2 — ROSTERS COMPLETS (ESL One Birmingham 2026)
  // ═══════════════════════════════════════════════
  // Team Yandex (champions ESL One Birmingham 2026)
  "watson_d2":{game:"Dota2",league:"",role:"Pos 1",team:"Team Yandex"},
  "CHIRA_JUNIOR":{game:"Dota2",league:"",role:"Pos 2",team:"Team Yandex"},
  "Noticed":{game:"Dota2",league:"",role:"Pos 3",team:"Team Yandex"},
  "Saksa":{game:"Dota2",league:"",role:"Pos 4",team:"Team Yandex"},
  "Malady":{game:"Dota2",league:"",role:"Pos 5",team:"Team Yandex"},
  // Tundra (champion Birmingham — Malr1ne, Skiter, ATF, Cr1t, Sneyking)
  "Malr1ne":{game:"Dota2",league:"",role:"Pos 1",team:"Tundra Esports"},
  "Skiter":{game:"Dota2",league:"",role:"Pos 2",team:"Tundra Esports"},
  "ATF":{game:"Dota2",league:"",role:"Pos 3",team:"Tundra Esports"},
  "Cr1t":{game:"Dota2",league:"",role:"Pos 4",team:"Tundra Esports"},
  "Sneyking":{game:"Dota2",league:"",role:"Pos 5",team:"Tundra Esports"},
  // Xtreme Gaming (finaliste Birmingham)
  "ame_xg":{game:"Dota2",league:"",role:"Pos 1",team:"Xtreme Gaming"},
  "NothingToSay":{game:"Dota2",league:"",role:"Pos 2",team:"Xtreme Gaming"},
  "fy_xg":{game:"Dota2",league:"",role:"Pos 5",team:"Xtreme Gaming"},
  "Xxs":{game:"Dota2",league:"",role:"Pos 3",team:"Xtreme Gaming"},
  "xNova":{game:"Dota2",league:"",role:"Pos 4",team:"Xtreme Gaming"},
  // Team Spirit (Yatoro déjà là + reste)
  // yatoro déjà dans la base
  "Collapse":{game:"Dota2",league:"",role:"Pos 3",team:"Team Spirit"},
  "mira_spirit":{game:"Dota2",league:"",role:"Pos 2",team:"Team Spirit"},
  "Tobi_spirit":{game:"Dota2",league:"",role:"Pos 4",team:"Team Spirit"},
  "miposhka":{game:"Dota2",league:"",role:"Pos 5",team:"Team Spirit"},
  // PARIVISION (Satanic + 4)
  "Satanic":{game:"Dota2",league:"",role:"Pos 1",team:"PARIVISION Dota2"},
  "Palantimos":{game:"Dota2",league:"",role:"Pos 2",team:"PARIVISION Dota2"},
  "bzm":{game:"Dota2",league:"",role:"Pos 3",team:"PARIVISION Dota2"},
  "Save_d2":{game:"Dota2",league:"",role:"Pos 4",team:"PARIVISION Dota2"},
  "illidan_d2":{game:"Dota2",league:"",role:"Pos 5",team:"PARIVISION Dota2"},
  // MOUZ Dota2 (Crystallis déjà là)
  // crystallis déjà dans la base
  "Seleri":{game:"Dota2",league:"",role:"Pos 2",team:"MOUZ Dota2"},
  "MidOne":{game:"Dota2",league:"",role:"Pos 2",team:"MOUZ Dota2"},
  "ImmortalFaith":{game:"Dota2",league:"",role:"Pos 4",team:"MOUZ Dota2"},
  "Quinn_d2":{game:"Dota2",league:"",role:"Pos 5",team:"MOUZ Dota2"},
  // Team Falcons Dota2
  "Arteezy":{game:"Dota2",league:"",role:"Pos 1",team:"Falcons Dota2"},
  "Abed":{game:"Dota2",league:"",role:"Pos 2",team:"Falcons Dota2"},
  "GH_d2":{game:"Dota2",league:"",role:"Pos 4",team:"Falcons Dota2"},
  "DJ_d2":{game:"Dota2",league:"",role:"Pos 5",team:"Falcons Dota2"},
  "Resolut1on":{game:"Dota2",league:"",role:"Pos 3",team:"Falcons Dota2"},
  // Aurora Gaming Dota2
  "Torontotokyo":{game:"Dota2",league:"",role:"Pos 1",team:"Aurora Dota2"},
  "Larl":{game:"Dota2",league:"",role:"Pos 2",team:"Aurora Dota2"},
  "Pure_aur":{game:"Dota2",league:"",role:"Pos 3",team:"Aurora Dota2"},
  "Fishman":{game:"Dota2",league:"",role:"Pos 4",team:"Aurora Dota2"},
  "BokerN1":{game:"Dota2",league:"",role:"Pos 5",team:"Aurora Dota2"},
  // BetBoom Dota2
  "RAMZES666":{game:"Dota2",league:"",role:"Pos 1",team:"BetBoom Dota2"},
  "gpk":{game:"Dota2",league:"",role:"Pos 2",team:"BetBoom Dota2"},
  "Zayac":{game:"Dota2",league:"",role:"Pos 4",team:"BetBoom Dota2"},
  "SoNNeikO":{game:"Dota2",league:"",role:"Pos 5",team:"BetBoom Dota2"},
  "sayuw":{game:"Dota2",league:"",role:"Pos 3",team:"BetBoom Dota2"},
  // paiN Gaming Dota2
  "hFn_d2":{game:"Dota2",league:"",role:"Pos 1",team:"paiN Dota2"},
  "4dr":{game:"Dota2",league:"",role:"Pos 2",team:"paiN Dota2"},
  "KJ_d2":{game:"Dota2",league:"",role:"Pos 3",team:"paiN Dota2"},
  "Lelis":{game:"Dota2",league:"",role:"Pos 4",team:"paiN Dota2"},
  "VoiD_d2":{game:"Dota2",league:"",role:"Pos 5",team:"paiN Dota2"},
  // Virtus.pro Dota2
  "Nightfall":{game:"Dota2",league:"",role:"Pos 3",team:"Virtus.pro Dota2"},
  "solo_vp":{game:"Dota2",league:"",role:"Pos 5",team:"Virtus.pro Dota2"},
  "Shad0wfall":{game:"Dota2",league:"",role:"Pos 1",team:"Virtus.pro Dota2"},
  "qojqva":{game:"Dota2",league:"",role:"Pos 2",team:"Virtus.pro Dota2"},
  "Antimage_vp":{game:"Dota2",league:"",role:"Pos 4",team:"Virtus.pro Dota2"},
  // GamerLegion Dota2
  "tOfu":{game:"Dota2",league:"",role:"Pos 5",team:"GamerLegion Dota2"},
  "Ace_d2":{game:"Dota2",league:"",role:"Pos 3",team:"GamerLegion Dota2"},
  "miCKe":{game:"Dota2",league:"",role:"Pos 1",team:"GamerLegion Dota2"},
  "iNSaNiA":{game:"Dota2",league:"",role:"Pos 4",team:"GamerLegion Dota2"},
  "Nisha_d2":{game:"Dota2",league:"",role:"Pos 2",team:"GamerLegion Dota2"},
  // OG Dota2
  "Bzm_og":{game:"Dota2",league:"",role:"Pos 1",team:"OG Dota2"},
  "inYourdreaM":{game:"Dota2",league:"",role:"Pos 2",team:"OG Dota2"},
  "ATF_og":{game:"Dota2",league:"",role:"Pos 3",team:"OG Dota2"},
  "Chu":{game:"Dota2",league:"",role:"Pos 4",team:"OG Dota2"},
  "ana_og":{game:"Dota2",league:"",role:"Pos 1",team:"OG Dota2"},
  // Nigma Galaxy Dota2
  "w33":{game:"Dota2",league:"",role:"Pos 2",team:"Nigma Galaxy"},
  "iLTW":{game:"Dota2",league:"",role:"Pos 1",team:"Nigma Galaxy"},
  "KuroKy":{game:"Dota2",league:"",role:"Pos 5",team:"Nigma Galaxy"},
  "NobodyXD":{game:"Dota2",league:"",role:"Pos 4",team:"Nigma Galaxy"},
  "Davai_Lama":{game:"Dota2",league:"",role:"Pos 3",team:"Nigma Galaxy"},
  // Team Liquid Dota2
  "Nisha_tl":{game:"Dota2",league:"",role:"Pos 2",team:"Team Liquid Dota2"},
  "zai":{game:"Dota2",league:"",role:"Pos 4",team:"Team Liquid Dota2"},
  "m1CKe_tl":{game:"Dota2",league:"",role:"Pos 1",team:"Team Liquid Dota2"},
  "MiCkEy":{game:"Dota2",league:"",role:"Pos 3",team:"Team Liquid Dota2"},
  "insania":{game:"Dota2",league:"",role:"Pos 5",team:"Team Liquid Dota2"},
};

const STATIC_PLAYERS_COUNT=Object.keys(STATIC_PLAYERS).length;
const DEFAULT_BK=["Stake","Roobet","Rainbet","BCGame","Duelbits","Duel","Thunderpick"];

const BK_LOGOS={
"Stake":"data:image/png;base64,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",
"Roobet":"data:image/png;base64,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",
"Rainbet":"data:image/png;base64,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",
"BCGame":"data:image/png;base64,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",
"Duel":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAEsCAYAAADtt+XCAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABJGSURBVHgB7d07jF1VlgbgzWjCwZYg4CGqQjOSywGPDpoi8KgnAIaH1BNgIzHqDrAtDRoCLCyBunmJAMsOGDEShqBRI1F4AiQeUyaghZFsJuAVuCyNHUxgt2gSAhfk9F3HXNoYyrhW3bPPOfd+n1SqAmFUrntr/2evtR9XXHXNTd8WAFinvysAkCBAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKX9fBuirLz8rQ3f27BfN5zMXfD5z9i9ldfXrcmLldDk3+ryycqoA3Vm87dby9psvlxquvvbmMjSDDJBpMDd3/Q8+L67x3x3/6JMmUFZOnionTp4WKkBvCJCeiyeg+BiLmUqEyvKRD5vPMVMB6IIAGZj50Yxl/v57y87RR1g6/HYTJsvvfVAAatJEH7gIktdePVg+//jdsmfXA03AANQgQKZEBMdzz+xtguTFF54SJEDrBMgUillJBMlzz+4VJEBrBMgU2/PQA+WtN18eBco9BWDSBMiUixnIiy88rawFTJwAmRFR1orZyF13/FMBmAQBMkNiBhIrtvbt3V0ANkqAzKDHRgESJS2AjRAgMypKWh++v1Q2b7qyAGQIkBm2sHBjc1CcEAEyBMiMG4cIwHoJEJoQ0RMB1kuA0IieiNVZwHoIEL4Xq7MuPDoe4FIECD8QpSxNdeByCBB+oDn65D+fKgA/R4DwI3HciSNPgJ8jQPhJzz37qFIWcEkChJ8Upazdux4oAGtxJ/plOLFyqpw4eapkbd58ZfM039xnPqAj1eOK3EMvv17OrX5dAC4mQC7D8ntHy/4Dh8qkxMa9CJLFX94y+npLub2nS2cj9GIWMsm/OzA9BEgHVkYzmvhYPvJB889NmIxCZMf9d/cuTMxCgLXogfTAmbNflKXDb5f7fr2r3PSLu0dfv1P6YjwLAbiYGUjPRJg8/MiTzVP/H1892IueiVkIa5kbvT8v7PGtJd7X489nv/ua4RMgPRVN+5iNxPEiXZ9RFYPD4uKt35fcmD3xHoje3bZRz25h65aybeuNZW7++vRS7yjhnvnzF+XEyunR16fL8Y8+8YAyQAKk56KBvXru6/Lcs3tLl/Y8tFOAzJgIh5077il33bG9CY9J7guK/198XLhhNULl2EeflqX/fqf5mv4TIAPw0itRPvqm0yPXo8kfA8h6nxK/+vKzUsO9o/5RPMW2Jf7+te5Nufram0tXLgyN2gdrjkMlSqZR6jo0et8vHzn6ffmL/tFEH4hosj/8yFOlSztGAwvTKYIjSqWff/Juee6ZvZ2fyhz9lPg+Pv/43ebBaUj7p2aJABmQCJGXRs3srvzL6KmU6XJhcES/rY/H18RdNYKknwTIwOw/eKizKf24jMV0iP5Dn4PjYuMgcfFZfwiQgTk3aqh3WcqKGjXDFmER/ZzXXj04yAeCCLwIErOR7gmQAYpmcZsN40u5Sxlr0GIWefRPS4O/eTLCI0Jkj02unRIgA/X8gTorgi4W+0EYphhsY+YxTU/u0Wjveon7LBMgA9XVLGTb1i36IAMUfYMYbKfRnoceKB++v+R92QEBMmBLh98tXZifV3sekgiPx6a88Ry9uZhdCZG6BMiALb/3QSfHP9x22y2FYZiF8BgTIvUJkAGLFVnHj39aapu/wQxkCGYpPMYiRGJ1GXUIkIGLy65qiwP16LdomM9aeIzFCjON9ToEyMB10Uifs/6+18bHgMyyaKxb4ts+ATJwsSu9dh8kBih15n6K1+atN7tZ4t03MQOz2bBdAmQKdNEHiUuE6B+D5t/EQ85rf9APaZMAmQJdnI2ljNU/cVbUzvudmHyhaKrPai+oBveBTIGVk6dLbfNz15XjhT55bO+u0oUooZ5YOdXcLBjvxfjnWCEYYqYa75W5G64fNbdvKds6OEsteiFvHH7HvSItECBToItfjE1KWL2yr4PS1bGPPilH3jtalt5457L7cPE93nnn9qbJXev7jVJWHAUfl44xWUpYU+BsBwGiid4fMRDvrrjiKMLi4UeeLPeNBuS4n2Y9iziamwZHfyb+7PMHDpVaYmnv0A+Q7CMBMgW62I0uQPqj5n0eEQDbf7WzLI1KQhv9/+wfBciDv3202vt3314zkEkTIFNgXG+uafPmfyh0L2Yfi5WOlolBP2YOkyyZLh/5oDz4m0dLDWYhkydApoQG4WyKAbFGL6GN8BiLzbBP/O5AqcEsZLIECAxYrZVXUW5q8yHlpVder3KqgmuZJ0uAwEBt23pjtdnHRnsel6PWJWm7HXEyMQIEBmpHpU2D+yutlqp1SZrNlpMjQGCgajTPa80+xmpcknZ+4YFm+iQIEBigGARr7OpePnK01FTrkrRFl6JNhACZEg43nC21nqBr3zcTS9JXVk6Vtt0uQCZCgEwJK0tmS40n6JgJdHHfzImV9s92sxprMgQIKefOfVPozsLW9m+FPFFhJvBTah0OurioD7JRDlOcAl3c/9DF8Sn8TY3+R5yx1sWx/bU2xS7+8pZmJzx5AmQKzAmQmRL7P2o4f7/IvWVazc+702ajlLCmQBfnUq2eEyBdmZu/rrBxVmJtnACZAgtb61/Sc+bsXwrdcBvkZEQTXSN9YwTIFNjWQYCsKmF1xqA3OcpYGyNApsDCQvsrci525ozTf7sybwYyMTVWs00zATJwMZjUHlCaO6/NQDpjBjI5rmbeGAEycF2c6dPV/gDOc5nX5AjjjREgA3fXHdtLbaurNhEyHebnrGjbCAEycIuL9ZciHuvgeAugfwTIgMUmry6m4CsrdY6agLZt3rypkCdABmzn/XeXLqzogTAlNm3ST9oIATJQsfejkwb6ydNWYHXMJk76QoAMVFf3Oq+s/F+ZRVY+wY8JkAE6f8hdN/c6H//o0zKLNm/qT638nHPI6AkBMjDRNH9s767SlVkNkLkeLfc882enANAPjnMfmH17d3d2lEX0P2rd1dA3XZw3tpbVSpd5xXLtaX+9z+onbYgAGZAIj656H+H48f7u/4gNYcdLe7o4b2wttVbBxX3oh15+vcBalLAGYs8oOB4bBUiXYkCZRV2cN3YptUpY2xw0yM8QIAMQM4/nntlbuhSljOM93oHe5h0Zd965vfRJNNFrlJYWFv6xwKUIkB6Lhvl/vfB05zOPsHT4ndJnbd4Rvueh7sqGa6mxmCFmIA4b5FIESE/FJsGjf1oqOzparnuxN3oeIG1dTxpLpvt4/8aJk3X6IAsL/Vk8QP8IkJ6J4Hj7zZebj74MXNH76PtqnHhSbmNnfpdLpi+l1nlkXZz2zHAIkB6IgS/6HP9/+sMmOLo4ouRSXhrISpx9Ex7su1wy/XOiH1XjSJmdO+5RxmJNlvFWFI3ezZuvbPYUxMa0bQtbmrDo8y/oRpvn8edrDcLxs4yPSTT7Y6d/H3pPl7J85GjrJxLEe3PHKERqLuc9/zreUlbj5stz3zSLBsa3YMbXZ2d0L1IfXXHVNTd9Wwbmqy8/K9Tx8CNPbqiB/vnH71Z9io/A2v6rnRt6Oo9B+cUXni5duframy/rvxuXO9s2iZ/pelzue2YcJGcu+NwEzuj7nFT41PoZh8t93fvEDIQ1xS/kRldfNec2zZVqYuCJX/gHf/toqm8TZau+zzzGVkaN9BgY257Bxs80NrDuP3CotG09ZcPx0u3x58Vy+eLv8nyFv8+00wNhTTEIb1QXR0XEyqG3RiGynvJOs+rt/aXBhEeIcF56o87quBjY2+7NRXDU+vkfm9Ez3SbNDISftHT47YkcmdHV6q0YjF78bg9N9ESWj3zYPK2Pv59xL2ph65ZBN4pjefWeSsfbvPjCU+W+X+9q5TWN1+utSqWivm+KHRIBwo/EL9j+A5P5Ze765NjmGJLm+Pt7yzSK/SAxGNZYuTce5GNmOsnzuMb/31q9sv1KVxOjhMWPxC/YpJ4y3Z/evucP1HlyDzHIfzgq9e2bUKkpZk+xYbZWeMQsdFavJGiDAOEHonQ1yWNLVk66P71tMQOpXZKJ0mCsloo+03oH//Gmz1jsEGe81SwfLh/5YGavJGiDEhbfm2TpaiwavbVKLLPs8d8fbGYGNY37TCFe4xOj2ebKd3fGjJfNhug3zd8wKiXOX9fs7+hq71N8T/srztZmgQChEb9cbTVIY8WLAGlX9CTixIA9Hd0XM97E2Wfx8zH7mCwlLBoP/8dTrf1yqTnXsf/gIQPkGs7PrjXPJ02A0GyoWn7vg9KWLmr0syhKRg8/8lThx/xc2iFAZlyER40ns/+Z0dsMa4ugtsP6h6J05QGmHQJkhj3++wPVpvWx4a3WWUqzLl5TA+Z5Ubp6YvQ+px0CZAbFQP7gbx6tesJqlFeGciz8WobUX8ieBTZN4u8fC0NojwCZMeOTVdvseaxlkhsUa4vv+6VXhhOAEdhtraobgnhI+jch2joBMkNig2CER5e/VENsZo6XOK+e+6YMyfgJfBYH0cd/d6CcWLGJtW0CZAaMS1Zxt0fXfYiozQ+tlPXEaDA6vzlutQzNrIVIvL//ffQ+f+NwnVOKZ50AmXIxWN90692dlKzWEk3NoTR5Y0XT+GiXcwObgYzNSoiMZ4rCox4BMqWOjQbom35xdzNY93H106RPdG3DxUuch3yVatP7+uedg1/IsJZxb0/Zqi4BMkUiKOIwxHtHT2F9f+KMJu+9/7qrtyFSa39MTfEzjweKKMlNkwjFrnt7s8pZWFMgnrqW3zvaLMsd0l6LcYjEiazruT2wTfHzi/D4qSXO0zJAxWqyeL/88Q8Hy7aFG8tQxesRizLseemOABmoY83xIJ9+9zHcX6Dzx2882QwG+zq+Tja+h1j6eakySI07yGsYl7Tioq3H9u6qdh/HpMSsI2aINqd264qrrrnp2zIwX335WZklzVWsZ75owiKOy447DabxF2d8J3bt2Uj8LGNAupwZXNyB0fZge/W1N5fahhIkUaKNI9lrzQbH95bU0MXrvlFmID0wvjshPuIK2Ph8chQUseonZhpDbt6ux/mSxJPNqqcYzG5v+Xjw9QTH938m7riYK1Pn/EVibzdBsvuhnb0qbTW9vTfeKYdecRx73wxyBjI3sOn2WmYlGLLiaXj3Qw+Uu+7cPtEn4wjlI6MeQAxK653JRflq0+Z2S1h9eF8sjAJkz+hnHxdAdTUr2cjrNEm1xpshjgeDDBBmTwxiUU5Y2LplNLhtaZ6QL6cXMSvlvzZFmNw+CpLbRh/btt7YWqBE76np6f3v6OP4J16nARAgDFo8HcaVqReGybgkuBplQYPQxMXPOkJl2yjI5264vszNX9f8u3GwrBUw4/JTfI6POBomQv3EyVPl7JkvvFYDJEAASLGREIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEgRIACkCBAAUgQIACkCBIAUAQJAigABIEWAAJAiQABIESAApAgQAFIECAApAgSAFAECQIoAASBFgACQIkAASBEgAKQIEABSBAgAKQIEgBQBAkCKAAEgRYAAkCJAAEj5K7QtofrwQ7W4AAAAAElFTkSuQmCC",
"Thunderpick":"data:image/jpeg;base64,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",
"Duelbits":"data:image/png;base64,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",
};


// ── Constants ──────────────────────────────────────────────────────────────
const ALL_GAMES=["LoL","Dota2","CS2","Valorant"];
const FR_MONTHS=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const FR_DAYS=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MAP_TAGS=["Map 1","Map 2","Map 3","Map 4","Map 5"];
const QUICK_STAKES=[50,62,75,87,100];
const GAME_CFG={
  LoL:{accent:"#C89B3C",bg:"rgba(200,155,60,0.08)",border:"rgba(200,155,60,0.25)"},
  Dota2:{accent:"#C23C2A",bg:"rgba(194,60,42,0.08)",border:"rgba(194,60,42,0.25)"},
  CS2:{accent:"#F0A500",bg:"rgba(240,165,0,0.08)",border:"rgba(240,165,0,0.25)"},
  Valorant:{accent:"#FF4655",bg:"rgba(255,70,85,0.08)",border:"rgba(255,70,85,0.25)"},
};
const STATUS_CFG={
  pending:{label:"En attente",color:"#3B82F6",bg:"rgba(96,165,250,0.1)"},
  won:{label:"Gagne",color:"#4ADE80",bg:"rgba(34,197,94,0.1)"},
  lost:{label:"Perdu",color:"#F87171",bg:"rgba(248,113,113,0.1)"},
};
const EMPTY_FORM={player:"",overUnder:"Over",description:"",odds:"",stake:"",bookmaker:"",status:"pending",autoInfo:null,datetime:"",isHeadshot:false,mapTag:"Map 1",isLive:false};
const EMPTY_MAP_ROW={odds:"",stake:"",status:"pending",enabled:true};

function toDateKey(dt){return dt?dt.slice(0,10):"";}
function nowDT(){
  const n=new Date(),p=v=>String(v).padStart(2,"0");
  return n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate())+"T"+p(n.getHours())+":"+p(n.getMinutes());
}
function calcProfit(status,stake,odds){
  if(status==="won")return stake*(odds-1);
  if(status==="lost")return -stake;
  return 0;
}
function fmtMonthFR(d){
  const p=d.split("-");
  if(p.length<2)return d;
  return FR_MONTHS[parseInt(p[1])-1]+" "+p[0];
}
function fmtDayFR(d){
  const p=d.split("-");
  if(p.length<3)return d;
  const dt=new Date(d+"T12:00:00");
  return FR_DAYS[dt.getDay()]+" "+parseInt(p[2])+" "+FR_MONTHS[parseInt(p[1])-1]+" "+p[0];
}
function fmtDate(dt){
  if(!dt)return "";
  const p=dt.split("T");
  const dp=p[0].split("-");
  if(dp.length<3)return dt;
  const d=dp[2],m=dp[1],y=dp[0];
  const tp=p[1]?p[1].slice(0,5):"";
  return d+"/"+m+"/"+y+(tp?" - "+tp:"");
}


// ── NumPad ────────────────────────────────────────────────────────────────
function NumPad({value,onChange,placeholder,step,id}){
  const isDecimal=step==="0.01";
  return(
    <div style={{position:"relative"}}>
      <input
        id={id}
        type="text"
        inputMode={isDecimal?"decimal":"numeric"}
        placeholder={placeholder}
        value={value||""}
        onChange={e=>{
          // Accept both . and , as decimal separator
          let v=e.target.value.replace(/,/g,".");
          v=v.replace(/[^0-9.]/g,"");
          if(isDecimal){
            const parts=v.split(".");
            if(parts.length>2)return;
            onChange(v);
          } else {
            onChange(v.replace(/\./g,""));
          }
        }}
        style={{
          width:"100%",
          background:"transparent",
          border:"none",
          padding:"12px 14px",
          color:value?"#E5E7EB":"#6B7280",
          fontSize:16,
          fontFamily:"'Inter',system-ui,sans-serif",
          fontWeight:value?600:400,
          outline:"none",
          boxSizing:"border-box",
          paddingRight:value?42:14,
        }}
      />
      {value&&(
        <button onMouseDown={e=>{e.preventDefault();onChange("");}}
          style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:22,height:22,color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter"}}>
          ×
        </button>
      )}
    </div>
  );
}

// ── PlayerAC ──────────────────────────────────────────────────────────────
// Récents: stockés dans localStorage "v7_recent_players" (max 6)
function getRecentPlayers(){try{return JSON.parse(localStorage.getItem("v7_recent_players")||"[]");}catch{return[];}}
function addRecentPlayer(key){
  try{
    const prev=getRecentPlayers().filter(k=>k!==key);
    localStorage.setItem("v7_recent_players",JSON.stringify([key,...prev].slice(0,6)));
  }catch{}
}

function PlayerAC({value,onChange,allPlayers,onConfirm,activeTourneys={}}){
  const [open,setOpen]=useState(false);
  const [inputVal,setInputVal]=useState(value);
  const ref=useRef(null);
  const inputRef=useRef(null);
  const debounceRef=useRef(null);
  const [recents,setRecents]=useState(()=>getRecentPlayers());

  useEffect(()=>{setInputVal(value);},[value]);

  const isConfirmed=useMemo(()=>!!allPlayers[inputVal.toLowerCase().trim()],[allPlayers,inputVal]);

  const sugg=useMemo(()=>{
    const q=inputVal.toLowerCase().trim();
    if(q.length<1){
      // Pas de query → afficher joueurs récents
      return recents
        .filter(k=>allPlayers[k])
        .map(k=>[k,allPlayers[k],true]); // true = isRecent
    }
    const all=Object.entries(allPlayers);
    // Priorité: commence par q > contient q
    const starts=all.filter(([k])=>k.startsWith(q));
    const contains=all.filter(([k])=>!k.startsWith(q)&&k.includes(q));
    return [...starts,...contains].slice(0,6).map(([k,p])=>[k,p,false]);
  },[allPlayers,inputVal,recents]);

  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  const handleChange=useCallback((e)=>{
    const v=e.target.value;
    setInputVal(v);setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>onChange(v),30);
  },[onChange]);

  const handleSelect=useCallback((key)=>{
    setInputVal(key);onChange(key);setOpen(false);
    addRecentPlayer(key);
    setRecents(getRecentPlayers());
    // Focus auto sur champ cote après sélection joueur
    setTimeout(()=>onConfirm&&onConfirm(),60);
  },[onChange,onConfirm]);

  return(
    <div ref={ref} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input ref={inputRef} className="add-ifield" placeholder="ex: Faker, ZywOo..." value={inputVal} autoComplete="off"
          onChange={handleChange} onFocus={()=>{setRecents(getRecentPlayers());setOpen(true);}}
          style={{paddingRight:isConfirmed?42:14,height:48,background:"transparent",border:"none",outline:"none",borderRadius:0,boxShadow:"none"}}/>
        {isConfirmed&&(
          <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,background:"rgba(34,197,94,0.15)",borderRadius:"50%",border:"1.5px solid #4ADE80",pointerEvents:"none"}}>
            <span style={{color:"#22C55E",fontSize:14,lineHeight:1}}>✓</span>
          </div>
        )}
      </div>
      {open&&sugg.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#111827",border:"1px solid #1F2937",borderRadius:10,zIndex:500,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.7)"}}>
          {inputVal.trim().length<1&&<div style={{padding:"6px 13px 2px",fontSize:10,color:"#6B7280",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Récents</div>}
          {sugg.map(([key,p,isRecent])=>{
            const isSelected=key===inputVal.toLowerCase().trim();
            return(
              <div key={key} onMouseDown={e=>{e.preventDefault();handleSelect(key);}}
                style={{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",cursor:"pointer",borderBottom:"1px solid #1F2937",background:isSelected?"rgba(124,58,237,0.08)":"transparent"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.background=isSelected?"rgba(124,58,237,0.08)":"transparent"}>
                {isRecent&&<span style={{fontSize:10,color:"#6B7280"}}>🕐</span>}
                <GameLogo game={p.game} size={16}/>
                {(()=>{const t=activeTourneys[p.game];const hasTourney=t&&(!t.end||new Date(t.end)>=new Date());return hasTourney?<span style={{fontSize:12,flexShrink:0}} title={t.name}>🏆</span>:null;})()}
                <div style={{flex:1}}>
                  <span style={{fontWeight:700,fontSize:14,color:"#E5E7EB",textTransform:"capitalize"}}>{key}</span>
                  <span style={{fontSize:11,color:"#9CA3AF",marginLeft:7}}>{p.team}</span>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  {p.league&&<span style={{fontSize:10,fontWeight:600,color:"#A78BFA",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",padding:"1px 5px",borderRadius:4}}>{p.league}</span>}
                  <span style={{fontSize:10,fontWeight:600,color:"#3B82F6",background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.15)",padding:"1px 5px",borderRadius:4}}>{p.role}</span>
                  {isSelected&&<span style={{color:"#22C55E",fontSize:14,fontWeight:700,marginLeft:2}}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── PlayerSearchPanel ──────────────────────────────────────────────────────
function PlayerSearchPanel({allPlayers,custom,setCustom,setEditingPlayer}){
  const [pSearch,setPSearch]=useState("");
  const filtered=useMemo(()=>{
    const q=pSearch.toLowerCase().trim();
    if(!q)return[];
    return Object.entries(allPlayers).filter(([k])=>k.includes(q)).slice(0,20);
  },[allPlayers,pSearch]);
  return(
    <div style={{marginBottom:12}}>
      <div style={{position:"relative",marginBottom:8}}>
        <input style={{width:"100%",background:"#111827",border:"1.5px solid #1F2937",borderRadius:12,padding:"12px 44px 12px 16px",color:"#E5E7EB",fontSize:14,fontFamily:"Inter,sans-serif",outline:"none",boxSizing:"border-box"}}
          placeholder="🔍  Rechercher un joueur..." value={pSearch} onChange={e=>setPSearch(e.target.value)}/>
        {pSearch&&<button onClick={()=>setPSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6B7280",cursor:"pointer",fontSize:16}}>×</button>}
      </div>
      {filtered.length>0&&(
        <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:14,overflow:"hidden",marginBottom:8}}>
          {filtered.map(([key,p])=>{
            const isCustom=!!custom[key];
            return(
              <div key={key} style={{display:"flex",alignItems:"center",gap:9,padding:"11px 14px",borderBottom:"1px solid #1F2937"}}>
                <GameLogo game={p.game} size={18}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:700,fontSize:14,color:"#E5E7EB",textTransform:"capitalize"}}>{key}</span>
                    {isCustom&&<span style={{fontSize:9,color:"#22C55E",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",padding:"1px 5px",borderRadius:4,fontWeight:700}}>MODIFIÉ</span>}
                  </div>
                  <div style={{fontSize:10,color:"#9CA3AF"}}>{p.team} · {p.role}{p.league?" · "+p.league:""}</div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button onClick={()=>setEditingPlayer({key,data:{...p,name:key}})}
                    style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"5px 10px",color:"#3B82F6",cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif",fontWeight:600}}>
                    ✎ Éd.
                  </button>
                  {isCustom&&<button onClick={()=>setCustom(c=>{const n={...c};delete n[key];return n;})}
                    style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"5px 10px",color:"#EF4444",cursor:"pointer",fontSize:11}}>
                    ×
                  </button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {pSearch&&filtered.length===0&&<div style={{fontSize:12,color:"#6B7280",padding:"10px 0",textAlign:"center"}}>Aucun résultat pour "{pSearch}"</div>}
    </div>
  );
}

// ── EditBetModal component ─────────────────────────────────────────────────
const EditBetModal=memo(function EditBetModal({bet,bookmakers,onSave,onClose,calcProfit,allPlayers}){
  const ebGame=bet.game||"CS2";
  const ebIsHS=bet.isHeadshot;
  // Build kills options
  let ebOpts=[];
  if(ebIsHS) ebOpts=Array.from({length:16},(_,i)=>(i+2.5).toFixed(1)+" Headshots");
  else if(ebGame==="LoL") ebOpts=Array.from({length:20},(_,i)=>(i+0.5).toFixed(1)+" Kills");
  else if(ebGame==="CS2") ebOpts=Array.from({length:16},(_,i)=>(i+7.5).toFixed(1)+" Kills");
  else if(ebGame==="Dota2") ebOpts=Array.from({length:16},(_,i)=>(i+2.5).toFixed(1)+" Kills");
  else ebOpts=Array.from({length:16},(_,i)=>(i+7.5).toFixed(1)+" Kills");
  // Extract current kills line: "Over 14.5 Kills" → "14.5 Kills"
  const ebDescParts=bet.description?.split(" ")||[];
  const initKills=ebDescParts.length>=2?ebDescParts.slice(1).join(" "):"";
  if(initKills&&!ebOpts.includes(initKills))ebOpts=[initKills,...ebOpts];

  const [ebBK,setEbBK]=useState(bet.bookmaker||"");
  const [ebPlayer,setEbPlayer]=useState(bet.player||"");
  const [ebOU,setEbOU]=useState(bet.overUnder||"Over");
  const [ebLine,setEbLine]=useState(initKills);
  const [ebOdds,setEbOdds]=useState(String(bet.odds||""));
  const [ebStake,setEbStake]=useState(String(bet.stake||""));
  const [ebMap,setEbMap]=useState(bet.mapTag||"Map 1");

  const labelStyle={fontSize:11,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:5,display:"block"};
  const fieldStyle={width:"100%",background:"#111827",border:"1px solid #1F2937",borderRadius:10,padding:"10px 12px",color:"#E5E7EB",fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box"};

  function save(){
    const newDesc=ebOU+" "+(ebLine||initKills||bet.description?.split(" ").slice(1).join(" ")||"");
    const odds=parseFloat(ebOdds)||bet.odds;
    const stake=parseFloat(ebStake)||bet.stake;
    onSave({...bet,
      player:ebPlayer||bet.player,
      bookmaker:ebBK||bet.bookmaker,
      overUnder:ebOU,
      description:newDesc,
      odds,stake,
      mapTag:ebMap,
      profit:calcProfit(bet.status,stake,odds),
    });
  }

  return(
    <div className="moverlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#E5E7EB"}}>✎ Modifier le pari</div>
            <div style={{fontSize:10,color:"#6B7280",marginTop:2}}>{bet.player} · {ebGame}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B7280",fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
        </div>

        {/* Bookmaker */}
        <div style={{marginBottom:12}}>
          <span style={labelStyle}>Bookmaker</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {bookmakers.map(bk=>(
              <button key={bk} onClick={()=>setEbBK(bk)}
                style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid "+(ebBK===bk?"#7C3AED":"#1F2937"),background:ebBK===bk?"rgba(124,58,237,0.15)":"transparent",color:ebBK===bk?"#A78BFA":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                {bk}
              </button>
            ))}
          </div>
        </div>

        {/* Joueur */}
        <div style={{marginBottom:12}}>
          <span style={labelStyle}>Joueur</span>
          <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:10,position:"relative",zIndex:300}}>
            <PlayerAC value={ebPlayer} onChange={v=>setEbPlayer(v)} allPlayers={allPlayers} onConfirm={()=>{}}/>
          </div>
        </div>

        {/* Over / Under */}
        <div style={{marginBottom:12}}>
          <span style={labelStyle}>Over / Under</span>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {["Over","Under"].map(ou=>(
              <button key={ou} onClick={()=>setEbOU(ou)}
                style={{padding:"11px 0",borderRadius:10,border:"1.5px solid "+(ebOU===ou?(ou==="Over"?"#22C55E":"#EF4444"):"#1F2937"),background:ebOU===ou?(ou==="Over"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)"):"transparent",color:ebOU===ou?(ou==="Over"?"#22C55E":"#EF4444"):"#6B7280",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                {ou}
              </button>
            ))}
          </div>
        </div>

        {/* Kills */}
        <div style={{marginBottom:12}}>
          <span style={labelStyle}>Ligne ({ebIsHS?"Headshots":"Kills"})</span>
          <select value={ebLine} onChange={e=>setEbLine(e.target.value)}
            style={{...fieldStyle,appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
            <option value="" style={{background:"#111827"}}>Choisir une ligne...</option>
            {ebOpts.map(o=><option key={o} value={o} style={{background:"#111827"}}>{o}</option>)}
          </select>
        </div>

        {/* Cote + Mise */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <span style={labelStyle}>Cote</span>
            <NumPad value={ebOdds} onChange={v=>setEbOdds(v)} placeholder="1.75" step="0.01"/>
          </div>
          <div>
            <span style={labelStyle}>Mise ($)</span>
            <NumPad value={ebStake} onChange={v=>setEbStake(v)} placeholder="50" step="1"/>
          </div>
        </div>

        {/* Gain potentiel */}
        {ebOdds&&ebStake&&(
          <div style={{textAlign:"center",marginBottom:12,padding:"8px",background:"rgba(34,197,94,0.06)",borderRadius:8,border:"1px solid rgba(34,197,94,0.15)"}}>
            <span style={{fontSize:12,color:"#6B7280"}}>Gain potentiel : </span>
            <span style={{fontSize:14,fontWeight:700,color:"#22C55E"}}>+{(parseFloat(ebStake||0)*(parseFloat(ebOdds||1)-1)).toFixed(2)}$</span>
          </div>
        )}

        {/* Map */}
        <div style={{marginBottom:16}}>
          <span style={labelStyle}>Map</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Map 1","Map 2","Map 3","Map 4","Map 5"].map(m=>(
              <button key={m} onClick={()=>setEbMap(m)}
                style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid "+(ebMap===m?"#F59E0B":"#1F2937"),background:ebMap===m?"rgba(245,158,11,0.1)":"transparent",color:ebMap===m?"#F59E0B":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Boutons */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose}
            style={{padding:"13px",background:"#1F2937",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14}}>
            Annuler
          </button>
          <button onClick={save}
            style={{padding:"13px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14}}>
            ✓ Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
});

// ── BetRow component ───────────────────────────────────────────────────────
const BetRow=memo(function BetRow({bet,onStatus,onDelete,onDuplicate,onEdit}){
  const [open,setOpen]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const sc=STATUS_CFG[bet.status]||{color:"#3B82F6",label:bet.status};
  const isPending=bet.status==="pending";
  const profitColor=isPending?"#3B82F6":bet.profit>=0?"#22C55E":"#F87171";
  const profitTxt=isPending?"@"+bet.odds:(bet.profit>=0?"+":"")+bet.profit.toFixed(2)+"$";

  return(
    <div className="betrow" style={{WebkitTapHighlightColor:"transparent"}}>
      {/* ── Main row (always visible) ── */}
      <div onClick={()=>setOpen(v=>!v)} style={{padding:"9px 13px",cursor:"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Left: game logo + player */}
          <GameLogo game={bet.game} size={17}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:14,color:"#E5E7EB",textTransform:"capitalize"}}>{bet.player}</span>
              {bet.isLive&&<span style={{fontSize:9,fontWeight:800,color:"#FF4757",background:"rgba(255,71,87,0.15)",padding:"1px 5px",borderRadius:3,border:"1px solid rgba(255,71,87,0.3)",letterSpacing:.5,flexShrink:0}}>LIVE</span>}
              {bet.mapTag&&<span style={{fontSize:9,fontWeight:700,color:"#F59E0B",background:"rgba(245,158,11,0.1)",padding:"1px 5px",borderRadius:3,border:"1px solid rgba(245,158,11,0.2)",flexShrink:0}}>{bet.mapTag}</span>}
              {bet.description&&<span style={{fontSize:12,color:"#94A3B8",fontWeight:500}}>— {bet.description}</span>}
            </div>
            <div style={{fontSize:13,color:"#9CA3AF",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:600}}>
              <span style={{color:"#94A3B8",fontWeight:700}}>@{bet.odds}</span>
              {bet.bookmaker&&<span style={{color:"#3B82F6",fontWeight:600}}> · {bet.bookmaker}</span>}
              <span style={{color:"#A78BFA",fontWeight:600}}> · {bet.stake}$</span>
              {bet.league&&<span style={{color:"#9CA3AF"}}> · {bet.league}</span>}
            </div>
          </div>
          {/* Right: amount + status dot */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:700,fontSize:13,color:profitColor}}>{profitTxt}</div>
            <div style={{fontSize:9,color:sc.color,marginTop:1}}>{sc.label}</div>
          </div>
          {/* Chevron */}
          <span style={{color:"#1F2937",fontSize:12,marginLeft:2,flexShrink:0,transition:"transform .15s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>▼</span>
        </div>
      </div>

      {/* ── Expanded actions ── */}
      {open&&(
        <div style={{padding:"0 13px 9px",display:"flex",gap:5,flexWrap:"wrap",borderTop:"1px solid #1F2937",paddingTop:8}}>
          <span style={{fontSize:9,color:"#6B7280",alignSelf:"center",flex:1}}>{fmtDate(bet.datetime)}</span>
          {isPending&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"won");setOpen(false);}} style={{color:"#22C55E",borderColor:"#22C55E44",fontSize:11}}>✓ Gagné</button>}
          {isPending&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"lost");setOpen(false);}} style={{color:"#F87171",borderColor:"#F8717144",fontSize:11}}>✗ Perdu</button>}
          {bet.status==="won"&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"lost");setOpen(false);}} style={{color:"#F87171",borderColor:"#F8717144",fontSize:11}}>✗ Perdu</button>}
          {bet.status==="won"&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"pending");setOpen(false);}} style={{fontSize:11}}>↩ Attente</button>}
          {bet.status==="lost"&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"won");setOpen(false);}} style={{color:"#22C55E",borderColor:"#22C55E44",fontSize:11}}>✓ Gagné</button>}
          {bet.status==="lost"&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"pending");setOpen(false);}} style={{fontSize:11}}>↩ Attente</button>}
          <button className="editbtn" onClick={()=>{onEdit();setOpen(false);}} style={{fontSize:11}}>✎ Modif.</button>
          <button className="editbtn" onClick={()=>{onDuplicate(bet);setOpen(false);}} style={{fontSize:11}}>⧉ Dup.</button>
          {!confirmDel
            ?<button className="editbtn" onClick={()=>setConfirmDel(true)} style={{color:"#F87171",borderColor:"#F8717144",fontSize:11}}>🗑</button>
            :<>
              <button className="editbtn" onClick={()=>{onDelete(bet.id);}} style={{color:"#fff",background:"#EF4444",borderColor:"#EF4444",fontSize:11,fontWeight:700}}>Oui</button>
              <button className="editbtn" onClick={()=>setConfirmDel(false)} style={{fontSize:11}}>Non</button>
            </>
          }
        </div>
      )}
    </div>
  );
});

// ── BetRowSelectable ───────────────────────────────────────────────────────
const BetRowSelectable=memo(function BetRowSelectable({bet,selected,onToggle,onEdit}){
  const sc=STATUS_CFG[bet.status]||{color:"#3B82F6",label:bet.status};
  return(
    <div className="betrow" style={{background:selected?"rgba(34,197,94,0.04)":"#111827",padding:"11px 13px",borderLeft:selected?"3px solid #22C55E":"3px solid transparent"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <button onClick={onToggle} style={{width:22,height:22,borderRadius:6,border:"2px solid "+(selected?"#22C55E":"#1F2937"),background:selected?"rgba(34,197,94,0.1)":"transparent",cursor:"pointer",flexShrink:0,marginTop:2}}/>
        <div style={{flex:1,minWidth:0}}>
          {/* Date */}
          <div style={{fontSize:10,color:"#9CA3AF",marginBottom:4}}>{fmtDate(bet.datetime)}{bet.bookmaker?" · "+bet.bookmaker:""}</div>
          {/* Player row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
              <GameLogo game={bet.game} size={18}/>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:"#E5E7EB",textTransform:"capitalize"}}>{bet.player}</div>
                <div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{bet.description} - @{bet.odds} - {bet.stake}$</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:700,fontSize:13,color:bet.status==="pending"?"#3B82F6":bet.profit>=0?"#22C55E":"#F87171"}}>
                {bet.status==="pending"?"@"+bet.odds:(bet.profit>=0?"+":"")+bet.profit.toFixed(2)+"$"}
              </div>
              <div style={{fontSize:10,color:sc.color}}>{sc.label}</div>
            </div>
          </div>
        </div>
        <button className="editbtn" onClick={onEdit} style={{flexShrink:0,marginTop:2}}>✎ Modif.</button>
      </div>
    </div>
  );
});

// ── Main App ───────────────────────────────────────────────────────────────
export default function App(){
  const [bets,setBets]=useState([]);
  const [bankroll,setBankroll]=useState(7500);
  const [custom,setCustom]=useState({});
  const [bookmakers,setBookmakers]=useState(DEFAULT_BK);
  const [form,setForm]=useState({...EMPTY_FORM,datetime:nowDT()});
  const [stickyBK,setStickyBK]=useState(false);
  const [view,setView]=useState("home");
  const [loaded,setLoaded]=useState(false);
  const [toast,setToast]=useState(null);
  const [showCal,setShowCal]=useState(false);
  const [calMonth,setCalMonth]=useState(new Date().getMonth());
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calSelected,setCalSelected]=useState(null);
  const [visibleMonths,setVisibleMonths]=useState(1);
  const [selectMode,setSelectMode]=useState(false);
  const [selectedIds,setSelectedIds]=useState([]);
  const [bulkModal,setBulkModal]=useState(false);
  
  const [bulkBK,setBulkBK]=useState("");
  const [bulkDatetime,setBulkDatetime]=useState("");
  const [bulkTourney,setBulkTourney]=useState("");
  const [bulkMap,setBulkMap]=useState("");
  const [editingBet,setEditingBet]=useState(null); // null or bet object being edited
  const [sessionMode,setSessionMode]=useState(false);
  const [duelMode,setDuelMode]=useState(false);
  const [duelForm,setDuelForm]=useState({player1:"",player2:"",odds:"",stake:"",winner:"",bookmaker:"",mapTag:"Map 1",isLive:false,datetime:""});
  const [sessionMaps,setSessionMaps]=useState([{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW}]);
  const [fGames,setFGames]=useState([]);
  const [fBKs,setFBKs]=useState([]);
  const [fPlayer,setFPlayer]=useState("");
  const [fStatus,setFStatus]=useState("All");
  const [fTourneys,setFTourneys]=useState(new Set()); // Set vide = tous
  const [fOverUnder,setFOverUnder]=useState("All");
  const [filtresPage,setFiltresPage]=useState(1);
  const [collapsedMonths,setCollapsedMonths]=useState({});
  const [fLive,setFLive]=useState(false);
  const [fHeadshot,setFHeadshot]=useState(false);
  const [fDuel,setFDuel]=useState(false);
  const [fMinOdds,setFMinOdds]=useState("");
  const [fMaxOdds,setFMaxOdds]=useState("");
  const [fMinStake,setFMinStake]=useState("");
  const [fMaxStake,setFMaxStake]=useState("");
  const [fMapFilter,setFMapFilter]=useState("all");
  const [deletedBets,setDeletedBets]=useState([]);
  const [showCorbeille,setShowCorbeille]=useState(false);
  const [settledOrder,setSettledOrder]=useState({});
  const [fRole,setFRole]=useState("All");
  const [fLeague,setFLeague]=useState("All");
  const FILTRES_PER_PAGE=30;
  const [modalBK,setModalBK]=useState(false);
  const [newBK,setNewBK]=useState("");
  const [newBKPhoto,setNewBKPhoto]=useState("");
  const [bkPhotos,setBkPhotos]=useState({});
  const [modalPlayer,setModalPlayer]=useState(false);
  const [pform,setPform]=useState({name:"",game:"LoL",league:"",role:"",team:""});
  const [editingPlayer,setEditingPlayer]=useState(null); // {key, data}
  // Tournois actifs par jeu: {CS2: {name:"PGL Astana 2026", end:"2026-04-10"}, ...}
  const [activeTourneys,setActiveTourneys]=useState({});
  // Tous les tournois sauvegardés (historique + réactivation)
  const [savedTourneys,setSavedTourneys]=useState({
    CS2:["PGL Astana 2026","IEM Rio 2026","BLAST Rivals 2026","PGL Bucharest 2026","ESL Pro League S24","BLAST Open Fall 2026","IEM Cologne Major 2026","Esports World Cup 2026"],
    Dota2:["ESL One 2026","PGL Wallachia S3","Riyadh Masters 2026","The International 2026","BetBoom Dacha 2026"],
    LoL:["Worlds 2026","MSI 2026","LEC Spring 2026","LCK Summer 2026"],
    Valorant:["VCT Masters 2026","Champions 2026","VCT Americas 2026","VCT EMEA 2026"],
  });
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [modalTourney,setModalTourney]=useState(false); // game string ou false
  const [statsGameOpen,setStatsGameOpen]=useState({}); // {CS2: true, ...}
const [analyseBets,setAnalyseBets]=useState([]);
const [analyseLoading,setAnalyseLoading]=useState(false);
const [analyseLastFetch,setAnalyseLastFetch]=useState(null);
const [analyseFSport,setAnalyseFSport]=useState("all");
const [analyseFSource,setAnalyseFSource]=useState("all");
const [analyseFDir,setAnalyseFDir]=useState("All");
  // ── Supabase sync (sans login) ───────────────────────────────────────────
  const [syncing,setSyncing]=useState(false);
  const [supaOk,setSupaOk]=useState(false); // true si connexion confirmée
  const [supaModal,setSupaModal]=useState(false);

  // ── Load: localStorage ───────────────────────────────────────────────────
  useEffect(()=>{
    try{
      const b=localStorage.getItem("v7_bets"); if(b)setBets(JSON.parse(b));
      const bk=localStorage.getItem("v7_bankroll"); if(bk)setBankroll(parseFloat(bk));
      const cp=localStorage.getItem("v7_custom_p"); if(cp)setCustom(JSON.parse(cp));
      const bm=localStorage.getItem("v7_bmakers"); if(bm)setBookmakers(JSON.parse(bm));
      const bp=localStorage.getItem("v7_bkphotos"); if(bp)setBkPhotos(JSON.parse(bp));
      const tv=localStorage.getItem("v7_tourneys"); if(tv)setActiveTourneys(JSON.parse(tv));
      const stv=localStorage.getItem("v7_saved_tourneys"); if(stv)setSavedTourneys(JSON.parse(stv));
      // Restaurer le BK sticky de la session précédente
      const sbk=localStorage.getItem("v7_sticky_bk");
      if(sbk){const d=JSON.parse(sbk);setStickyBK(d.active||false);setForm(f=>({...f,bookmaker:d.bk||""}));}
    }catch(e){}
    setLoaded(true);
  },[]);

  // Persister stickyBK + bookmaker actif
  useEffect(()=>{
    if(!loaded)return;
    try{localStorage.setItem("v7_sticky_bk",JSON.stringify({active:stickyBK,bk:stickyBK?form.bookmaker:""}));}catch{}
  },[stickyBK,form.bookmaker,loaded]);

  // Persister tournois actifs
  useEffect(()=>{
    if(!loaded)return;
    try{localStorage.setItem("v7_tourneys",JSON.stringify(activeTourneys));}catch{}
  },[activeTourneys,loaded]);

  // Persister liste des tournois sauvegardés
  useEffect(()=>{
    if(!loaded)return;
    try{localStorage.setItem("v7_saved_tourneys",JSON.stringify(savedTourneys));}catch{}
  },[savedTourneys,loaded]);

  // ── Save: localStorage (debounced) ───────────────────────────────────────
  useEffect(()=>{
    if(!loaded)return;
    // Debounce longer for large datasets to avoid blocking UI
    const delay=bets.length>5000?2000:800;
    const t=setTimeout(()=>{
      try{
        const data=JSON.stringify(bets);
        // Warn if approaching localStorage limits (~5MB typical)
        if(data.length>4000000){
          console.warn("Bankroll: localStorage near limit ("+Math.round(data.length/1024)+"kb). Consider exporting a backup.");
        }
        localStorage.setItem("v7_bets",data);
      }catch(e){
        // QuotaExceededError - localStorage full
        console.warn("Bankroll: localStorage full, bets not saved. Export a backup!");
      }
    },delay);
    return()=>clearTimeout(t);
  },[bets,loaded]);

  const showToast=useCallback((msg,color="#22C55E")=>{
    setToast({msg,color});setTimeout(()=>setToast(null),2200);
  },[]);

  // ── Supabase: auto-push après chaque changement de paris (debounce 3s) ────
  useEffect(()=>{
    if(!loaded)return;
    const t=setTimeout(async()=>{
      try{ await supaPushBets(bets); setSupaOk(true); }
      catch(e){ setSupaOk(false); }
    },3000);
    return()=>clearTimeout(t);
  },[bets,loaded]);


  // ── Supabase: pull au chargement — Supabase fait autorité ────────────────
  useEffect(()=>{
    if(!loaded)return;
    (async()=>{
      setSyncing(true);
      try{
        const remote=await supaPullBets();
        setSupaOk(true);
        // Supabase fait TOUJOURS autorité
        // Si remote est vide = intentionnel (reset), on vide aussi local
        const final=remote||[];
        setBets(final);
        localStorage.setItem("v7_bets",JSON.stringify(final));
        if(final.length>0) showToast("☁️ "+final.length+" paris","#7C3AED");
      }catch(e){
        // Hors ligne → garder localStorage
        setSupaOk(false);
      }
      setSyncing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[loaded]);

  const allPlayers=useMemo(()=>{
    const merged={};
    // Normalize all keys to lowercase so search always works regardless of casing in STATIC_PLAYERS
    Object.entries(STATIC_PLAYERS).forEach(([k,v])=>{merged[k.toLowerCase()]=v;});
    Object.entries(custom).forEach(([k,v])=>{merged[k.toLowerCase()]=v;});
    return merged;
  },[custom]);

  const findPlayer=useCallback((name)=>{
    const key=name.toLowerCase().trim();
    if(allPlayers[key])return{name:key,...allPlayers[key]};
    const m=Object.keys(allPlayers).find(k=>k.startsWith(key)&&key.length>=2);
    if(m)return{name:m,...allPlayers[m]};
    return null;
  },[allPlayers]);

  const settled=useMemo(()=>bets.filter(b=>b.status!=="pending"),[bets]);

  // Stats
  const bkStats=useMemo(()=>{
    const bk={};
    settled.forEach(b=>{
      const k=b.bookmaker||"Autre";
      if(!bk[k])bk[k]={profit:0,count:0,staked:0,won:0,oddsSum:0};
      bk[k].profit+=b.profit;bk[k].count++;bk[k].staked+=b.stake;
      bk[k].oddsSum+=b.odds;
      if(b.status==="won")bk[k].won++;
    });
    return bk;
  },[settled]);

  const bkStatsSorted=useMemo(()=>Object.entries(bkStats).sort((a,z)=>z[1].profit-a[1].profit),[bkStats]);

  const oddsRangeStats=useMemo(()=>{
    const step=0.10;
    const start=1.00;
    const ranges={};
    settled.forEach(b=>{
      const o=b.odds;if(!o||o<start)return;
      const bucket=Math.floor((o-start)/step);
      const lo=(start+bucket*step).toFixed(2);
      const hi=(start+(bucket+1)*step-0.01).toFixed(2);
      const key=lo+"-"+hi;
      if(!ranges[key])ranges[key]={label:key,lo:parseFloat(lo),hi:parseFloat(hi),count:0,won:0,profit:0,staked:0};
      ranges[key].count++;ranges[key].profit+=b.profit;ranges[key].staked+=b.stake;
      if(b.status==="won")ranges[key].won++;
    });
    return Object.values(ranges)
      .filter(r=>r.count>=1)
      .map(r=>({...r,wr:r.count>0?r.won/r.count*100:0,roi:r.staked>0?r.profit/r.staked*100:0}))
      .sort((a,b)=>a.lo-b.lo);
  },[settled]);


  const {currentStreak,streakType}=useMemo(()=>{
    const resolved=[...bets].filter(b=>b.status!=="pending"&&b.datetime)
      .sort((a,b2)=>b2.datetime.localeCompare(a.datetime));
    if(!resolved.length)return{currentStreak:0,streakType:"none"};
    const first=resolved[0].status;
    let count=0;
    for(const b of resolved){if(b.status===first)count++;else break;}
    return{currentStreak:count,streakType:first};
  },[bets]);




  // ── Stats par jeu regroupées ─────────────────────────────────────────────
  const perGameStats=useMemo(()=>{
    // Single pass: group by game first to avoid 4x full-array scans
    const byGame={};
    settled.forEach(b=>{if(!byGame[b.game])byGame[b.game]=[];byGame[b.game].push(b);});
    const result={};
    ALL_GAMES.forEach(game=>{
      const gb=byGame[game]||[];
      if(gb.length===0){result[game]=null;return;}
      // Global - computed inline in single forEach
      let won=0,profit=0,staked=0,oddsSum=0;
      let liveCnt=0,liveWon=0,liveProfit=0,liveStaked=0;
      let hsCnt=0,hsWon=0,hsProfit=0,hsStaked=0;
      const isCS2=(game==="CS2");
      // Top joueurs
      const pm={};
      gb.forEach(b=>{
        if(!pm[b.player])pm[b.player]={player:b.player,count:0,won:0,profit:0};
        pm[b.player].count++;pm[b.player].profit+=b.profit;
        if(b.status==="won")pm[b.player].won++;
      });
      const topP=Object.values(pm).filter(p=>p.count>=2).sort((a,b)=>b.profit-a.profit).slice(0,5);
      // Positions
      const rm={};
      gb.forEach(b=>{
        const k=b.role||"Inconnu";
        if(!rm[k])rm[k]={role:k,count:0,won:0,profit:0,staked:0};
        rm[k].count++;rm[k].profit+=b.profit;rm[k].staked+=b.stake;
        if(b.status==="won")rm[k].won++;
      });
      const roles=Object.values(rm).sort((a,b)=>b.profit-a.profit);
      // Ligues
      const lm={};
      gb.forEach(b=>{
        const k=b.league||"";if(!k)return;
        if(!lm[k])lm[k]={league:k,count:0,won:0,profit:0,staked:0};
        lm[k].count++;lm[k].profit+=b.profit;lm[k].staked+=b.stake;
        if(b.status==="won")lm[k].won++;
      });
      const leagues=Object.values(lm).sort((a,b)=>b.profit-a.profit);
      // Maps par jeu
      const mm={};
      gb.forEach(b=>{
        const k=b.mapTag||"Sans tag";
        if(!mm[k])mm[k]={tag:k,count:0,won:0,profit:0,staked:0};
        mm[k].count++;mm[k].profit+=b.profit;mm[k].staked+=b.stake;
        if(b.status==="won")mm[k].won++;
      });
      const maps=Object.values(mm).sort((a,b)=>{
        const na=parseInt(a.tag.replace("Map ",""))||99;
        const nb=parseInt(b.tag.replace("Map ",""))||99;
        return na-nb;
      });
      // Tournois pour ce jeu
      const tm={};
      gb.forEach(b=>{
        const k=b.tournament||"Hors tournoi";
        if(!tm[k])tm[k]={name:k,count:0,won:0,profit:0,staked:0};
        tm[k].count++;tm[k].profit+=b.profit;tm[k].staked+=b.stake;
        if(b.status==="won")tm[k].won++;
      });
      const tourneys=Object.values(tm).sort((a,b)=>b.profit-a.profit);
      // Kills & HS
      const kills={};const hs={};const duels={};
      gb.forEach(b=>{
        if(!b.description)return;
        // Fast string split instead of regex: "Over 14.5 Kills" -> parts[1]="14.5", parts[2]="Kills"
        const parts=b.description.split(" ");
        const isKills=parts.length>=3&&parts[2]==="Kills";
        const isHS=parts.length>=3&&parts[2]==="Headshots";
        if(isHS){const k=parts[1]+" HS";if(!hs[k])hs[k]={line:k,count:0,won:0,profit:0,staked:0};hs[k].count++;hs[k].profit+=b.profit;hs[k].staked+=b.stake;if(b.status==="won")hs[k].won++;}
        else if(isKills){const k=parts[1]+" K";if(!kills[k])kills[k]={line:k,count:0,won:0,profit:0,staked:0};kills[k].count++;kills[k].profit+=b.profit;kills[k].staked+=b.stake;if(b.status==="won")kills[k].won++;}
        // Duel bets
        const isDuel=b.description&&b.description.includes("Duel vs");
        if(isDuel){const dk="Duel";if(!duels[dk])duels[dk]={line:"Duel",count:0,won:0,profit:0,staked:0};duels[dk].count++;duels[dk].profit+=b.profit;duels[dk].staked+=b.stake;if(b.status==="won")duels[dk].won++;}
        // Live & HS inline
        if(b.isLive){liveCnt++;liveProfit+=b.profit;liveStaked+=b.stake;if(b.status==="won")liveWon++;}
        if(isCS2&&b.isHeadshot){hsCnt++;hsProfit+=b.profit;hsStaked+=b.stake;if(b.status==="won")hsWon++;}
        // Global totals
        if(b.status==="won")won++;
        profit+=b.profit;staked+=b.stake;oddsSum+=b.odds;
      });
      const killsArr=Object.values(kills).map(x=>({...x,wr:x.count>0?x.won/x.count*100:0})).sort((a,b)=>b.profit-a.profit).slice(0,10);
      const duelsArr=Object.values(duels).map(x=>({...x,wr:x.count>0?x.won/x.count*100:0}));
      const hsArr=Object.values(hs).map(x=>({...x,wr:x.count>0?x.won/x.count*100:0})).sort((a,b)=>b.profit-a.profit).slice(0,10);
      // Live & HS counted inline above during main forEach loop
      const liveS=liveCnt>0?{count:liveCnt,won:liveWon,profit:liveProfit,staked:liveStaked,wr:liveWon/liveCnt*100,roi:liveStaked>0?liveProfit/liveStaked*100:0}:null;
      const hsS=hsCnt>0?{count:hsCnt,won:hsWon,profit:hsProfit,staked:hsStaked,wr:hsWon/hsCnt*100,roi:hsStaked>0?hsProfit/hsStaked*100:0}:null;
      // Over/Under stats
      let overCnt=0,overWon=0,overProfit=0,overStaked=0;
      let underCnt=0,underWon=0,underProfit=0,underStaked=0;
      gb.forEach(b=>{
        if(b.overUnder==="Over"){overCnt++;overProfit+=b.profit;overStaked+=b.stake;if(b.status==="won")overWon++;}
        else if(b.overUnder==="Under"){underCnt++;underProfit+=b.profit;underStaked+=b.stake;if(b.status==="won")underWon++;}
      });
      const overS=overCnt>0?{count:overCnt,won:overWon,profit:overProfit,staked:overStaked,wr:overWon/overCnt*100,roi:overStaked>0?overProfit/overStaked*100:0}:null;
      const underS=underCnt>0?{count:underCnt,won:underWon,profit:underProfit,staked:underStaked,wr:underWon/underCnt*100,roi:underStaked>0?underProfit/underStaked*100:0}:null;
      result[game]={count:gb.length,won,profit,staked,oddsSum,wr:gb.length>0?won/gb.length*100:0,roi:staked>0?profit/staked*100:0,avgOdds:gb.length>0?oddsSum/gb.length:0,topP,roles,leagues,maps,tourneys,kills:killsArr,hs:hsArr,liveS,hsS,duels:duelsArr,overS,underS};
    });
    return result;
  },[settled]);

  const {bestMonth,worstMonth}=useMemo(()=>{
    const byMo={};
    settled.forEach(b=>{
      const mo=b.datetime?b.datetime.slice(0,7):"?";
      if(mo==="?")return;
      byMo[mo]=(byMo[mo]||0)+b.profit;
    });
    const entries=Object.entries(byMo);
    if(!entries.length)return{bestMonth:null,worstMonth:null};
    entries.sort((a,b)=>b[1]-a[1]);
    return{bestMonth:entries[0],worstMonth:entries[entries.length-1]};
  },[settled]);

  const exportCSV=useCallback(()=>{
    const hdr="Date,Joueur,Jeu,Equipe,Role,Over/Under,Description,Cote,Mise,Bookmaker,Statut,Profit,Live,Headshot";
    const sorted=[...bets].sort((a,b2)=>(b2.datetime||"").localeCompare(a.datetime||""));
    const rows=sorted.map(b=>[
      b.datetime?b.datetime.slice(0,16):"",b.player,b.game,b.team||"",b.role||"",
      b.overUnder,b.description||"",b.odds,b.stake,b.bookmaker||"",b.status,b.profit.toFixed(2),
      b.isLive?"Oui":"Non",b.isHeadshot?"Oui":"Non"
    ].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(","));
    const csv=[hdr,...rows].join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="emeieks_bankroll_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();URL.revokeObjectURL(url);
    showToast("CSV exporté ✓");
  },[bets,showToast]);

  const exportJSON=useCallback(()=>{
    const data={version:7,exportedAt:new Date().toISOString(),bankroll,bets,bookmakers};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="emeieks_backup_"+new Date().toISOString().slice(0,10)+".json";
    a.click();URL.revokeObjectURL(url);
    showToast("Sauvegarde JSON ✓");
  },[bets,bankroll,bookmakers,showToast]);

  const importJSON=useCallback((file)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result);
        if(data.bets){setBets(data.bets);showToast(data.bets.length+" paris importés ✓");}
        if(data.bankroll)setBankroll(data.bankroll);
        if(data.bookmakers)setBookmakers(data.bookmakers);
      }catch{showToast("Fichier invalide ✗","#F87171");}
    };
    reader.readAsText(file);
  },[showToast]);

  const {dailyProfit,dailyPending}=useMemo(()=>{
    const dp={},dpd={};
    bets.forEach(b=>{
      const dk=toDateKey(b.datetime);
      if(!dk)return;
      if(b.status!=="pending"){dp[dk]=(dp[dk]||0)+b.profit;}
      else{dpd[dk]=(dpd[dk]||0)+1;}
    });
    return{dailyProfit:dp,dailyPending:dpd};
  },[bets]);

  const monthProfit=useMemo(()=>{
    const mo=String(calMonth+1).padStart(2,"0");
    return Object.entries(dailyProfit)
      .filter(([d])=>d.startsWith(calYear+"-"+mo))
      .reduce((s,[,v])=>s+v,0);
  },[dailyProfit,calYear,calMonth]);

  const filteredBets=useMemo(()=>{
    // Fast path: no active filters
    const noFilters=fGames.length===0&&fBKs.length===0&&!fPlayer&&fStatus==="All"&&fOverUnder==="All"&&!fLive&&!fHeadshot&&!fDuel&&!fMinOdds&&!fMaxOdds&&!fMinStake&&!fMaxStake&&fMapFilter==="all"&&fRole==="All"&&fLeague==="All"&&fTourneys.size===0;
    if(noFilters)return bets;
    return bets.filter(b=>{
      if(fGames.length>0&&!fGames.includes(b.game))return false;
      if(fBKs.length>0&&!fBKs.includes(b.bookmaker||"Autre"))return false;
      if(fPlayer&&!b.player.toLowerCase().includes(fPlayer.toLowerCase()))return false;
      if(fStatus!=="All"&&b.status!==fStatus)return false;
      if(fOverUnder!=="All"&&b.overUnder!==fOverUnder)return false;
      if(fLive&&!b.isLive)return false;
      if(fHeadshot&&!b.isHeadshot)return false;
      if(fDuel&&!(b.description&&b.description.includes("Duel vs")))return false;
      if(fMinOdds&&b.odds<parseFloat(fMinOdds))return false;
      if(fMaxOdds&&b.odds>parseFloat(fMaxOdds))return false;
      if(fMinStake&&b.stake<parseFloat(fMinStake))return false;
      if(fMaxStake&&b.stake>parseFloat(fMaxStake))return false;
      if(fMapFilter&&fMapFilter!=="all"&&(b.mapTag||"none")!==fMapFilter)return false;
      if(fRole!=="All"&&b.role!==fRole)return false;
      if(fLeague!=="All"&&b.league!==fLeague)return false;
      if(fTourneys.size>0&&!fTourneys.has(b.tournament||"Hors tournoi"))return false;
      return true;
    }).sort((a,b2)=>{
      if(a.status==="pending"&&b2.status!=="pending")return -1;
      if(b2.status==="pending"&&a.status!=="pending")return 1;
      // Both settled: most recently settled first
      if(a.status!=="pending"&&b2.status!=="pending"){
        const sa=a.settledAt||0,sb=b2.settledAt||0;
        if(sa!==sb)return sb-sa;
      }
      return (b2.datetime||"").localeCompare(a.datetime||"");
    });
  },[bets,fGames,fBKs,fPlayer,fStatus,fOverUnder,fLive,fHeadshot,fDuel,fMinOdds,fMaxOdds,fMinStake,fMaxStake,fMapFilter,fRole,fLeague,fTourneys]);

  const {allSortedBets,byDay,byMonth,monthKeys}=useMemo(()=>{
    const now=Date.now();
    const sorted=[...bets].sort((a,b2)=>{
      // Pending toujours en premier
      if(a.status==="pending"&&b2.status!=="pending")return -1;
      if(b2.status==="pending"&&a.status!=="pending")return 1;
      // Pending entre eux: les plus récents en premier
      if(a.status==="pending"&&b2.status==="pending"){
        return (b2.datetime||"").localeCompare(a.datetime||"");
      }
      // Settled entre eux: trier par settledAt desc (le plus récemment settlé en premier)
      const sa=a.settledAt||0;
      const sb=b2.settledAt||0;
      if(sa!==sb)return sb-sa;
      return (b2.datetime||"").localeCompare(a.datetime||"");
    });
    const bd={};
    sorted.forEach(b=>{
      const dk=toDateKey(b.datetime)||"?";
      if(!bd[dk])bd[dk]=[];
      bd[dk].push(b);
    });
    const dk=Object.keys(bd).sort((a,z)=>z.localeCompare(a));
    const bm={};
    dk.forEach(d=>{
      const mk=d.slice(0,7);
      if(!bm[mk])bm[mk]=[];
      bm[mk].push(d);
    });
    return{allSortedBets:sorted,byDay:bd,dayKeys:dk,byMonth:bm,monthKeys:Object.keys(bm).sort((a,z)=>z.localeCompare(a))};
  },[bets]);

  const totalProfit=useMemo(()=>settled.reduce((s,b)=>s+b.profit,0),[settled]);
  const totalStaked=useMemo(()=>settled.reduce((s,b)=>s+b.stake,0),[settled]);
  const roi=useMemo(()=>totalStaked>0?(totalProfit/totalStaked)*100:0,[totalProfit,totalStaked]);
  const progression=useMemo(()=>bankroll>0?(totalProfit/bankroll)*100:0,[totalProfit,bankroll]);
  const chartPoints=useMemo(()=>{
    const pts=[{v:bankroll,dt:""}];
    const sorted=[...settled].sort((a,b2)=>(a.datetime||"").localeCompare(b2.datetime||""));
    let running=bankroll;
    sorted.forEach(b=>{running+=b.profit;pts.push({v:running,dt:toDateKey(b.datetime)});});
    return pts;
  },[settled,bankroll]);

  const formGame=useMemo(()=>{
    if(form.autoInfo&&form.autoInfo.game)return form.autoInfo.game;
    return "LoL";
  },[form.autoInfo]);

  function addBet(){
    if(!form.player||!form.odds||!form.stake||!form.bookmaker||!form.description||!form.mapTag)return;
    const info=findPlayer(form.player)||{game:"?",league:"?",role:"?",team:"?"};
    const stake=parseFloat(form.stake),odds=parseFloat(form.odds);
    const desc=form.description?form.overUnder+" "+form.description:form.overUnder;
    const tname=(()=>{const t=activeTourneys[info.game];return(t&&(!t.end||new Date(t.end)>=new Date()))?t.name:"";})();
    if(editingBet){
      // Mode édition — remplace le pari existant avec tous les champs
      const updatedBet={
        ...editingBet,
        player:form.player,description:desc,overUnder:form.overUnder,
        odds,stake,bookmaker:form.bookmaker,
        game:info.game,league:info.league,role:info.role,team:info.team,
        datetime:form.datetime||nowDT(),isHeadshot:form.isHeadshot||false,isLive:form.isLive||false,
        mapTag:form.mapTag||"",
        profit:calcProfit(editingBet.status,stake,odds),
        tournament:form.tournament||tname,
      };
      setBets(b=>b.map(bet=>bet.id===editingBet.id?updatedBet:bet));
      setEditingBet(null);
      setForm(f=>({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?f.bookmaker:""}));
      showToast("Pari modifié ✓");
      setView("mesparis");
      return;
    }
    setBets(b=>[{
      id:Date.now(),player:form.player,description:desc,overUnder:form.overUnder,
      odds,stake,bookmaker:form.bookmaker,status:form.status,
      game:info.game,league:info.league,role:info.role,team:info.team,
      datetime:form.datetime||nowDT(),isHeadshot:form.isHeadshot||false,isLive:form.isLive||false,
      mapTag:form.mapTag||"",profit:calcProfit(form.status,stake,odds),
      tournament:tname,
    },...b]);
    setForm(f=>({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?f.bookmaker:""}));
    showToast("Pari enregistré ✓");
    setView("mesparis");
  }

  function addSession(){
    const info=findPlayer(form.player)||{game:"?",league:"?",role:"?",team:"?"};
    const desc=form.description?form.overUnder+" "+form.description:form.overUnder;
    const enabled=sessionMaps.filter(m=>m.enabled&&m.odds);
    if(!form.player||enabled.length===0)return;
    const now=Date.now();
    const tname=(()=>{const t=activeTourneys[info.game];return(t&&(!t.end||new Date(t.end)>=new Date()))?t.name:"";})();
    const newBets=enabled.map((m,i)=>({
      id:now+i,player:form.player,description:desc,overUnder:form.overUnder,
      odds:parseFloat(m.odds),stake:parseFloat(m.stake||form.stake||0),
      bookmaker:form.bookmaker,status:m.status,
      game:info.game,league:info.league,role:info.role,team:info.team,
      datetime:form.datetime||nowDT(),isHeadshot:form.isHeadshot||false,isLive:form.isLive||false,
      mapTag:"Map "+(i+1),
      profit:calcProfit(m.status,parseFloat(m.stake||form.stake||0),parseFloat(m.odds)),
      tournament:tname,
    }));
    setBets(b=>[...newBets,...b]);
    setForm(f=>({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?f.bookmaker:""}));
    setSessionMaps([{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW}]);
    showToast(newBets.length+" paris enregistres");
    setView("mesparis");
  }

  function addDuel(){
    if(!duelForm.player1||!duelForm.player2||!duelForm.odds||!duelForm.stake||!duelForm.bookmaker||!duelForm.winner)return;
    const winner=duelForm.winner; // "player1" or "player2"
    const winnerName=winner==="player1"?duelForm.player1:duelForm.player2;
    const loserName=winner==="player1"?duelForm.player2:duelForm.player1;
    const infoW=findPlayer(winnerName)||{game:"CS2",league:"",role:"",team:""};
    const now=Date.now();
    const stake=parseFloat(duelForm.stake);
    const odds=parseFloat(duelForm.odds);
    const tname=(()=>{const t=activeTourneys[infoW.game];return(t&&(!t.end||new Date(t.end)>=new Date()))?t.name:"";})();
    const bet={
      id:now,player:winnerName,
      description:"Duel vs "+loserName+" — Plus de kills",
      overUnder:"Over",odds,stake,
      bookmaker:duelForm.bookmaker,status:"pending",
      game:infoW.game,league:infoW.league,role:infoW.role,team:infoW.team,
      datetime:duelForm.datetime||nowDT(),isHeadshot:false,isLive:duelForm.isLive,
      mapTag:duelForm.mapTag,profit:0,tournament:tname,
    };
    setBets(b=>[bet,...b]);
    setDuelForm({player1:"",player2:"",odds:"",stake:"",winner:"",bookmaker:duelForm.bookmaker,mapTag:"Map 1",isLive:false,datetime:""});
    showToast("Duel enregistré ⚔️");
    setView("mesparis");
  }

  const updateStatus=useCallback((id,status)=>{
    const now=Date.now();
    setBets(b=>b.map(bet=>bet.id!==id?bet:{...bet,status,profit:calcProfit(status,bet.stake,bet.odds),settledAt:status!=="pending"?now:null}));
    if(status!=="pending"){setSettledOrder(prev=>({...prev,[id]:now}));}
  },[]);

    const openEdit=useCallback((b)=>{
    setEditingBet({...b});
  },[]);

  const deleteBet=useCallback((id)=>{
    const found=bets.find(b=>b.id===id);
    if(found)setDeletedBets(prev=>[{...found,deletedAt:Date.now()},...prev].slice(0,50));
    setBets(b=>b.filter(bet=>bet.id!==id));
    supaDeleteOneBet(id).catch(()=>{});
  },[]);

  const duplicateBet=useCallback((bet)=>{
    const newBet={...bet,id:Date.now(),datetime:nowDT(),status:"pending",profit:0,mapTag:""};
    setBets(b=>[newBet,...b]);
    showToast("Pari duplique");
  },[showToast]);

  function applyBulkStatus(status){
    const now=Date.now();
    setBets(b=>b.map((bet,i)=>selectedIds.includes(bet.id)?{...bet,status,profit:calcProfit(status,bet.stake,bet.odds),settledAt:status!=="pending"?now+i:null}:bet));
    setBulkModal(false);setSelectMode(false);setSelectedIds([]);setBulkDatetime("");
    showToast(selectedIds.length+" paris mis à jour");
  }
  function applyBulkBK(){
    if(!bulkBK)return;
    setBets(b=>b.map(bet=>selectedIds.includes(bet.id)?{...bet,bookmaker:bulkBK}:bet));
    setBulkModal(false);setSelectMode(false);setSelectedIds([]);setBulkDatetime("");
    showToast("Bookmaker mis à jour");
  }
  function applyBulkDatetime(){
    if(!bulkDatetime)return;
    setBets(b=>b.map(bet=>selectedIds.includes(bet.id)?{...bet,datetime:bulkDatetime}:bet));
    setBulkModal(false);setSelectMode(false);setSelectedIds([]);setBulkDatetime("");
    showToast("Date mise à jour");
  }
  function applyBulkMap(){
    if(!bulkMap)return;
    setBets(b=>b.map(bet=>selectedIds.includes(bet.id)?{...bet,mapTag:bulkMap}:bet));
    setBulkModal(false);setSelectMode(false);setSelectedIds([]);setBulkMap("");
    showToast("Map mise à jour");
  }
  function applyBulkTourney(name){
    setBets(b=>b.map(bet=>selectedIds.includes(bet.id)?{...bet,tournament:name}:bet));
    setBulkModal(false);setSelectMode(false);setSelectedIds([]);setBulkTourney("");
    showToast("🏆 Tournoi mis à jour");
  }

  function savePlayer(){
    if(!pform.name.trim())return;
    const key=pform.name.toLowerCase().trim();
    setCustom(c=>({...c,[key]:{game:pform.game,league:pform.league,role:pform.role,team:pform.team}}));
    setPform({name:"",game:"LoL",league:"",role:"",team:""});
    setModalPlayer(false);
    showToast(pform.name+" ajoute");
  }
  function saveBookmaker(){
    if(!newBK.trim())return;
    setBookmakers(b=>[...b,newBK.trim()]);
    if(newBKPhoto){
      const updated={...bkPhotos,[newBK.trim()]:newBKPhoto};
      setBkPhotos(updated);
      try{localStorage.setItem("v7_bkphotos",JSON.stringify(updated));}catch{}
    }
    setNewBK("");setNewBKPhoto("");setModalBK(false);
    showToast(newBK+" ajouté");
  }

  function toggleArr(arr,setter,val){
    setter(a=>a.includes(val)?a.filter(x=>x!==val):[...a,val]);
  }

  const NAV=[
    {id:"home",icon:"🏠",label:"Accueil"},
    {id:"mesparis",icon:"📋",label:"Mes Paris"},
    {id:"add",icon:"➕",label:"Pari"},
    {id:"statistiques",icon:"💲",label:"Stats"},
    {id:"analyse",icon:"🔍",label:"Analyse"},
    {id:"players",icon:"⚙️",label:"Gestion"},
  ];

const fetchAnalyse=useCallback(async()=>{
    setAnalyseLoading(true);
    try{
      const r=await fetch(SUPA_URL+"/rest/v1/bets_comparaison?select=*&order=diff.desc",{
        headers:{"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY}
      });
      const data=await r.json();
      setAnalyseBets(Array.isArray(data)?data:[]);
      setAnalyseLastFetch(new Date());
    }catch{setAnalyseBets([]);}
    setAnalyseLoading(false);
  },[]);  
  const customEntries=useMemo(()=>Object.entries(custom),[custom]);
  const customCount=useMemo(()=>Object.keys(custom).length,[custom]);
  const todayKey=useMemo(()=>toDateKey(nowDT()),[]);


  return(
    <div style={{minHeight:"100vh",background:"#0B1220",fontFamily:"'Inter',system-ui,-apple-system,sans-serif",color:"#E5E7EB",paddingBottom:84}}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{background:#0B1220;margin:0;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
        .card{background:#111827;border:1px solid #1F2937;border-radius:14px;padding:14px;transition:border-color .2s ease;}
        .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:600;}
        .ifield{width:100%;background:#111827;border:1px solid #1F2937;border-radius:10px;padding:11px 14px;color:#E5E7EB;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s ease,box-shadow .2s ease;}
        .ifield:focus{border-color:#7C3AED;box-shadow:0 0 0 3px rgba(124,58,237,0.12);}
        .add-card{background:#111827;border:1px solid #1F2937;border-radius:16px;padding:16px 18px;margin-bottom:12px;transition:border-color .2s ease;}
        .add-label{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;display:block;font-weight:600;}
        .add-ifield{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid #1F2937;border-radius:12px;padding:12px 16px;color:#E5E7EB;font-size:15px;font-family:'Inter',sans-serif;outline:none;transition:border-color .25s ease,box-shadow .25s ease;}
        .add-ifield:focus{border-color:rgba(124,58,237,0.6);box-shadow:0 0 0 3px rgba(124,58,237,0.12);}
        .ou-btn{padding:13px 0;border-radius:12px;border:1.5px solid #1F2937;background:rgba(255,255,255,0.03);color:#9CA3AF;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .25s ease;will-change:border-color,background,color,box-shadow;}
        .ou-btn:active{transform:scale(.97);}
        .ou-btn.over.on{border-color:#22C55E;background:rgba(34,197,94,0.1);color:#22C55E;box-shadow:0 0 16px rgba(74,222,128,0.15);}
        .ou-btn.under.on{border-color:#EF4444;background:rgba(239,68,68,0.1);color:#EF4444;box-shadow:0 0 16px rgba(239,68,68,0.12);}
        .navitem{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:8px 6px;border-radius:10px;transition:color .2s ease,transform .15s ease;font-family:'Inter',sans-serif;color:#6B7280;min-width:56px;will-change:transform,color;}
        .navitem:active{transform:scale(.92);}
        .navitem.on{color:#A78BFA;}
        .navitem .lbl{font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;transition:color .2s ease;}
        .stat-bloc{background:#111827;border:1px solid #1F2937;border-radius:14px;overflow:hidden;}
        .stat-row{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #1F2937;transition:background .15s ease;}
        .stat-row:last-child{border-bottom:none;}
        .fchip{padding:7px 14px;border-radius:20px;border:1.5px solid #1F2937;background:#111827;color:#9CA3AF;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:border-color .2s ease,color .2s ease,background .2s ease;will-change:border-color,color,background;}
        .fchip:active{transform:scale(.95);}
        .fchip.on{border-color:#7C3AED;color:#A78BFA;background:rgba(124,58,237,0.1);}
        .editbtn{background:rgba(255,255,255,0.04);border:1px solid #1F2937;border-radius:8px;padding:5px 9px;color:#9CA3AF;cursor:pointer;font-family:'Inter',sans-serif;font-size:11px;font-weight:500;transition:all .2s ease;}
        .editbtn:active{transform:scale(.93);opacity:.75;}
        .bkchip{padding:9px 12px;border-radius:10px;border:2px solid #1F2937;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#9CA3AF;transition:all .2s ease;}
        .bkchip:active{transform:scale(.96);}
        .bkchip.on{border-color:#7C3AED;color:#A78BFA;background:rgba(124,58,237,0.08);}
        .moverlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:400;display:flex;align-items:flex-end;justify-content:center;animation:overlayIn .2s ease;}
        @keyframes overlayIn{from{opacity:0;}to{opacity:1;}}
        .modal{background:#111827;border:1px solid #1F2937;border-top:1px solid #374151;border-radius:24px 24px 0 0;padding:24px 18px 36px;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;animation:slideUp .25s cubic-bezier(.32,.72,0,1);}
        @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .betrow{border-bottom:1px solid #1F2937;transition:background .15s ease;contain:layout style;}
        .betrow:active{background:rgba(255,255,255,0.02);}
        .toggle-wrap{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,255,255,0.03);border:1.5px solid #1F2937;border-radius:12px;cursor:pointer;transition:all .2s ease;}
        .toggle-wrap.hs-on{border-color:rgba(124,58,237,0.4);background:rgba(124,58,237,0.05);}
        .toggle-track{width:36px;height:20px;border-radius:10px;background:#374151;position:relative;transition:background .25s ease;flex-shrink:0;}
        .toggle-track.on{background:linear-gradient(135deg,#7C3AED,#3B82F6);}
        .toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .25s cubic-bezier(.32,.72,0,1);box-shadow:0 1px 4px rgba(0,0,0,0.3);will-change:left;}
        .toggle-thumb.on{left:18px;}
        .cal-cell{border:1px solid #1F2937;border-radius:8px;padding:6px 4px;text-align:center;cursor:pointer;transition:all .2s ease;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
        .cal-cell:active{transform:scale(.94);}
        .cal-cell.today{border-color:rgba(124,58,237,.5);}
        .cal-cell.selected{background:rgba(124,58,237,.12);border-color:#7C3AED;}
        .view-enter{animation:fadeUp .22s cubic-bezier(.32,.72,0,1);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .month-header{font-size:13px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;padding:14px 4px 6px;}
        .day-header{font-size:12px;color:#6B7280;font-weight:600;padding:8px 0 5px;display:flex;justify-content:space-between;align-items:center;}
        select option{background:#1F2937;color:#E5E7EB;}
        input::placeholder,textarea::placeholder{color:#6B7280;}
        *{-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:0;background:transparent;}
        button{-webkit-tap-highlight-color:transparent;}
        button:focus{outline:none;}
        input:focus{outline:none;}
      `}</style>

      <div style={{maxWidth:500,margin:"0 auto",padding:"16px 14px",WebkitOverflowScrolling:"touch"}}>

        {/* Toast */}
        {toast&&<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",color:"#fff",padding:"10px 20px",borderRadius:12,fontWeight:700,fontSize:13,zIndex:500,boxShadow:"0 8px 24px rgba(124,58,237,0.4)",whiteSpace:"nowrap",fontFamily:"'Inter',sans-serif",animation:"fadeUp .2s ease"}}>{toast.msg}</div>}

        {/* Syncing indicator */}
        {syncing&&<div style={{position:"fixed",top:18,right:14,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,color:"#A78BFA",zIndex:499,fontFamily:"'Inter',sans-serif"}}>☁️ Sync…</div>}

        {/* ── HOME ── */}
        {view==="home"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <svg width="160" height="44" viewBox="0 0 160 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C3AED"/>
                      <stop offset="100%" stopColor="#3B82F6"/>
                    </linearGradient>
                  </defs>
                  <text x="0" y="26" fontFamily="Inter, -apple-system, sans-serif" fontWeight="900" fontSize="26" fill="url(#logoGrad)" letterSpacing="-1.5">EMEIEKS</text>
                  <text x="1" y="40" fontFamily="Inter, -apple-system, sans-serif" fontWeight="600" fontSize="8" fill="#4B5563" letterSpacing="6">BANKROLL</text>
                </svg>
              </div>
              <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                <button onClick={()=>setSupaModal(true)}
                  style={{display:"flex",alignItems:"center",gap:5,background:supaOk?"rgba(34,197,94,0.08)":"rgba(124,58,237,0.08)",border:"1px solid "+(supaOk?"rgba(34,197,94,0.25)":"rgba(124,58,237,0.25)"),borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"'Inter',sans-serif",color:supaOk?"#22C55E":"#A78BFA",fontSize:10,fontWeight:700}}>
                  <span>{syncing?"☁️ Sync…":supaOk?"☁️ Sync ✓":"☁️ Cloud"}</span>
                  {supaOk&&!syncing&&<span style={{width:5,height:5,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 4px rgba(34,197,94,0.8)"}}/>}
                </button>
                <div style={{fontSize:11,color:"#9CA3AF",marginBottom:0}}>Profit Net</div>
                <div style={{fontSize:16,fontWeight:700,color:totalProfit>=0?"#22C55E":"#F87171"}}>{totalProfit>=0?"+":""}{totalProfit.toFixed(0)}$</div>
                <div style={{fontSize:9,color:"#6B7280"}}>Bankroll: <span style={{color:"#E5E7EB"}}>{bankroll.toFixed(0)}$</span></div>
              </div>
            </div>

            <div className="card" style={{marginBottom:12,padding:"12px 14px"}}>
              <BankrollChart points={chartPoints} h={170}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
              {[
                {label:"Paris",val:bets.length,sub:bets.filter(b=>b.status==="pending").length+" en cours"},
                {label:"Progression",val:(progression>=0?"+":"")+progression.toFixed(1)+"%",sub:"BK: "+bankroll.toFixed(0)+"$",col:progression>=0?"#22C55E":"#F87171"},
                {label:"Profit Net",val:(totalProfit>=0?"+":"")+totalProfit.toFixed(0)+"$",sub:"ROI "+roi.toFixed(1)+"%",col:totalProfit>=0?"#22C55E":"#F87171"},
              ].map(k=>(
                <div key={k.label} className="card" style={{padding:"11px 12px"}}>
                  <div style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{k.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:k.col||"#E5E7EB"}}>{k.val}</div>
                  <div style={{fontSize:9,color:"#6B7280",marginTop:1}}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
              <button onClick={()=>setShowCal(true)} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:12,padding:"13px",color:"#E5E7EB",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                Calendrier
              </button>
              <button onClick={()=>setView("filtres")} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:12,padding:"13px",color:"#E5E7EB",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                Filtres
              </button>
            </div>

            <div className="card">
              <div style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:11}}>Paris recents</div>
              {bets.length===0&&<div style={{color:"#6B7280",fontSize:13}}>Aucun pari</div>}
              {allSortedBets.slice(0,5).map(b=>(
                <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1F2937"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <GameLogo game={b.game} size={18}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:"#E5E7EB",textTransform:"capitalize"}}>{b.player}</div>
                      <div style={{fontSize:10,color:"#9CA3AF"}}>{b.description} - @{b.odds}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:b.status==="won"?"#22C55E":b.status==="lost"?"#F87171":"#3B82F6"}}>
                      {b.status==="pending"?"@"+b.odds:(b.profit>=0?"+":"")+b.profit.toFixed(2)+"$"}
                    </div>
                    <div style={{fontSize:10,color:"#6B7280"}}>{toDateKey(b.datetime)}</div>
                  </div>
                </div>
              ))}
              {bets.length>5&&<div style={{textAlign:"center",marginTop:10}}>
                <button onClick={()=>setView("mesparis")} style={{background:"none",border:"none",color:"#7C3AED",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  Voir tous ({bets.length})
                </button>
              </div>}
            </div>
          </div>
        )}

        {/* ── MES PARIS ── */}
        {view==="mesparis"&&(
          <div className="view-enter">
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,color:"#E5E7EB"}}>Mes Paris</div>
              <div style={{display:"flex",gap:6}}>
                {selectMode&&selectedIds.length>0&&(
                  <>
                    {confirmDelete?(
                      <>
                        <button onClick={()=>{
                          const removed=bets.filter(b=>selectedIds.includes(b.id));
    setDeletedBets(prev=>[...removed.map(b=>({...b,deletedAt:Date.now()})),...prev].slice(0,50));
    setBets(b=>b.filter(bet=>!selectedIds.includes(bet.id)));
                          supaDeleteManyBets(selectedIds).catch(()=>{});
                          setSelectMode(false);setSelectedIds([]);setConfirmDelete(false);
                          showToast(selectedIds.length+" paris supprimés","#EF4444");
                        }}
                          style={{background:"#EF4444",border:"none",borderRadius:7,padding:"5px 12px",color:"#fff",fontWeight:700,fontSize:11,fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>
                          Confirmer
                        </button>
                        <button onClick={()=>setConfirmDelete(false)}
                          style={{background:"#1F2937",border:"none",borderRadius:7,padding:"5px 10px",color:"#9CA3AF",fontWeight:600,fontSize:11,fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>
                          ✕
                        </button>
                      </>
                    ):(
                      <button onClick={()=>setConfirmDelete(true)}
                        style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:7,padding:"5px 10px",color:"#F87171",fontWeight:700,fontSize:11,fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>
                        🗑 {selectedIds.length}
                      </button>
                    )}
                    <button onClick={()=>setBulkModal(true)}
                      style={{background:"linear-gradient(135deg,#22C55E,#0EA5E9)",border:"none",borderRadius:7,padding:"5px 10px",color:"#0B1220",fontWeight:700,fontSize:11,fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>
                      ✓ {selectedIds.length}
                    </button>
                  </>
                )}
                <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds([]);setConfirmDelete(false);}}
                  style={{background:selectMode?"rgba(34,197,94,0.08)":"transparent",border:"1px solid "+(selectMode?"#22C55E":"#1F2937"),borderRadius:7,padding:"5px 10px",color:selectMode?"#22C55E":"#9CA3AF",fontWeight:600,fontSize:11,fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                  {selectMode?"Annuler":"Sél."}
                </button>
              </div>
            </div>

            {/* ── Status chips + Filtre button ── */}
            {(()=>{
              const activeFilters=fGames.length+fBKs.length+(fMinOdds?1:0)+(fMaxOdds?1:0)+(fMinStake?1:0)+(fMaxStake?1:0)+(fMapFilter!=="all"?1:0)+(fDuel?1:0)+(fLive?1:0)+(fHeadshot?1:0)+(fStatus!=="All"?1:0)+(fOverUnder!=="All"?1:0)+(fRole!=="All"?1:0)+(fLeague!=="All"?1:0);
              return(
                <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2,alignItems:"center"}}>
                  <button onClick={()=>setView("filtres")}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:"1.5px solid "+(activeFilters>0?"#7C3AED":"#1F2937"),background:activeFilters>0?"rgba(124,58,237,0.1)":"#111827",color:activeFilters>0?"#A78BFA":"#9CA3AF",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                    🔍 Filtres{activeFilters>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"2px 6px",marginLeft:2}}>{activeFilters}</span>}
                  </button>
                  {activeFilters>0&&(
                    <button onClick={()=>{setFGames([]);setFBKs([]);setFMinOdds("");setFMaxOdds("");setFMinStake("");setFMaxStake("");setFMapFilter("all");setFDuel(false);setFLive(false);setFHeadshot(false);setFStatus("All");setFOverUnder("All");setFRole("All");setFLeague("All");setFTourneys(new Set());}}
                      style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"#F87171",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                      × Effacer tout
                    </button>
                  )}
                </div>
              );
            })()}

            {bets.length===0&&<div style={{color:"#6B7280",fontSize:14,padding:20,textAlign:"center"}}>Aucun pari enregistré</div>}

            {(()=>{
              // Build flat sorted list: pending first (by datetime desc), then settled by settledAt desc
              const filtered=allSortedBets.filter(b=>{
                if(fStatus!=="All"&&b.status!==fStatus)return false;
                if(fGames.length>0&&!fGames.includes(b.game))return false;
                if(fBKs.length>0&&!fBKs.includes(b.bookmaker||"Autre"))return false;
                if(fOverUnder!=="All"&&b.overUnder!==fOverUnder)return false;
                if(fRole!=="All"&&b.role!==fRole)return false;
                if(fLeague!=="All"&&b.league!==fLeague)return false;
                if(fMinOdds&&b.odds<parseFloat(fMinOdds))return false;
                if(fMaxOdds&&b.odds>parseFloat(fMaxOdds))return false;
                if(fMinStake&&b.stake<parseFloat(fMinStake))return false;
                if(fMaxStake&&b.stake>parseFloat(fMaxStake))return false;
                if(fDuel&&!(b.description&&b.description.includes("Duel vs")))return false;
                if(fLive&&!b.isLive)return false;
                if(fHeadshot&&!b.isHeadshot)return false;
                if(fMapFilter&&fMapFilter!=="all"&&(b.mapTag||"none")!==fMapFilter)return false;
                if(fTourneys.size>0&&!fTourneys.has(b.tournament||"Hors tournoi"))return false;
                return true;
              });
              if(filtered.length===0&&bets.length>0)return<div style={{color:"#6B7280",fontSize:13,padding:"20px",textAlign:"center"}}>Aucun pari pour ces filtres</div>;

              // Pending on top
              const pending=filtered.filter(b=>b.status==="pending");
              const settled=filtered.filter(b=>b.status!=="pending");

              // Group settled by settle date (settledAt → date), fallback to datetime date
              const settledByDay={};
              const settledDayKeys=[];
              settled.forEach(b=>{
                const sk=b.settledAt?new Date(b.settledAt).toISOString().slice(0,10):toDateKey(b.datetime)||"?";
                if(!settledByDay[sk]){settledByDay[sk]=[];settledDayKeys.push(sk);}
                settledByDay[sk].push(b);
              });

              // Group settle days by month
              const settledByMonth={};
              const settledMonthKeys=[];
              settledDayKeys.forEach(dk=>{
                const mk=dk.slice(0,7);
                if(!settledByMonth[mk]){settledByMonth[mk]=[];settledMonthKeys.push(mk);}
                settledByMonth[mk].push(dk);
              });

              const allPendingSelected=pending.length>0&&pending.every(b=>selectedIds.includes(b.id));

              return(
                <div>
                  {/* ── PENDING SECTION ── */}
                  {pending.length>0&&(
                    <div style={{marginBottom:10}}>
                      {/* Gros header En attente */}
                      <div style={{background:"linear-gradient(135deg,#0F1829,#111D30)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:14,padding:"14px 18px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {selectMode&&<button onClick={()=>setSelectedIds(ids=>allPendingSelected?ids.filter(id=>!pending.map(b=>b.id).includes(id)):[...new Set([...ids,...pending.map(b=>b.id)])])} style={{width:18,height:18,borderRadius:5,border:"2px solid "+(allPendingSelected?"#22C55E":"#374151"),background:allPendingSelected?"rgba(34,197,94,0.1)":"transparent",cursor:"pointer"}}/>}
                          <span style={{fontSize:18,fontWeight:800,color:"#60A5FA",textTransform:"uppercase",letterSpacing:1}}>⏳ En attente</span>
                          <span style={{fontSize:12,color:"#374151",fontWeight:500}}>{pending.length} paris</span>
                        </div>
                      </div>
                      <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #1F2937"}}>
                        {pending.map(b=>(
                          selectMode
                            ?<BetRowSelectable key={b.id} bet={b} selected={selectedIds.includes(b.id)} onToggle={()=>setSelectedIds(ids=>ids.includes(b.id)?ids.filter(x=>x!==b.id):[...ids,b.id])} onEdit={()=>openEdit(b)}/>
                            :<BetRow key={b.id} bet={b} onStatus={updateStatus} onDelete={deleteBet} onDuplicate={duplicateBet} onEdit={()=>openEdit(b)}/>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── SETTLED — groupés par mois puis par jour de settlement ── */}
                  {settledMonthKeys.map(mk=>{
                    const monthDays=settledByMonth[mk];
                    const monthBets=monthDays.flatMap(dk=>settledByDay[dk]);
                    const monthP=monthBets.reduce((s,b)=>s+b.profit,0);
                    const allMonthSelected=monthBets.every(b=>selectedIds.includes(b.id));
                    return(
                      <div key={mk} style={{marginBottom:10}}>
                        {/* Gros header mois */}
                        <div style={{background:"linear-gradient(135deg,#0F1829,#111D30)",border:"1px solid #1E3050",borderRadius:14,padding:"14px 18px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            {selectMode&&<button onClick={()=>setSelectedIds(ids=>allMonthSelected?ids.filter(id=>!monthBets.map(b=>b.id).includes(id)):[...new Set([...ids,...monthBets.map(b=>b.id)])])} style={{width:18,height:18,borderRadius:5,border:"2px solid "+(allMonthSelected?"#22C55E":"#374151"),background:allMonthSelected?"rgba(34,197,94,0.1)":"transparent",cursor:"pointer"}}/>}
                            <span style={{fontSize:18,fontWeight:800,color:"#E5E7EB",textTransform:"uppercase",letterSpacing:1}}>{fmtMonthFR(mk+"-01")}</span>
                            <span style={{fontSize:12,color:"#374151",fontWeight:500}}>{monthBets.length} paris</span>
                          </div>
                          <span style={{fontSize:17,fontWeight:800,color:monthP>=0?"#22C55E":"#F87171"}}>{monthP>=0?"+":""}{monthP.toFixed(0)}$</span>
                        </div>

                        {/* Jours */}
                        <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #1F2937"}}>
                          {monthDays.map((dk,di)=>{
                            const dayBets=settledByDay[dk];
                            const dayP=dayBets.reduce((s,b)=>s+b.profit,0);
                            const allDaySelected=dayBets.every(b=>selectedIds.includes(b.id));
                            // Format day nicely
                            const dayLabel=(()=>{try{const d=new Date(dk+"T12:00:00");return FR_DAYS[d.getDay()]+" "+d.getDate()+" "+FR_MONTHS[d.getMonth()];}catch{return dk;}})();
                            return(
                              <div key={dk} style={{borderTop:di>0?"1px solid #0A0F1A":"none"}}>
                                {/* Séparateur jour */}
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px 7px",background:"#0B1220"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    {selectMode&&<button onClick={()=>setSelectedIds(ids=>allDaySelected?ids.filter(id=>!dayBets.map(b=>b.id).includes(id)):[...new Set([...ids,...dayBets.map(b=>b.id)])])} style={{width:16,height:16,borderRadius:4,border:"1.5px solid "+(allDaySelected?"#22C55E":"#6B7280"),background:allDaySelected?"rgba(34,197,94,0.1)":"transparent",cursor:"pointer"}}/>}
                                    <span style={{fontSize:15,fontWeight:700,color:"#E5E7EB",letterSpacing:.2,borderBottom:"2px solid rgba(255,255,255,0.25)",paddingBottom:1}}>{dayLabel}</span>
                                  </div>
                                  <span style={{fontSize:13,fontWeight:700,color:dayP>=0?"#22C55E":"#F87171"}}>{dayP>=0?"+":""}{dayP.toFixed(0)}$</span>
                                </div>
                                {dayBets.map(b=>(
                                  selectMode
                                    ?<BetRowSelectable key={b.id} bet={b} selected={selectedIds.includes(b.id)} onToggle={()=>setSelectedIds(ids=>ids.includes(b.id)?ids.filter(x=>x!==b.id):[...ids,b.id])} onEdit={()=>openEdit(b)}/>
                                    :<BetRow key={b.id} bet={b} onStatus={updateStatus} onDelete={deleteBet} onDuplicate={duplicateBet} onEdit={()=>openEdit(b)}/>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── FILTRES ── */}
        {view==="filtres"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>🔍 Filtres</div>
              <button onClick={()=>setView("mesparis")}
                style={{padding:"7px 16px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                Appliquer →
              </button>
            </div>

            {/* Statut */}
            <div className="add-card">
              <span className="add-label">Statut</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[{k:"All",label:"Tous"},{k:"pending",label:"⏳ Attente"},{k:"won",label:"✓ Gagnés"},{k:"lost",label:"✗ Perdus"}].map(t=>(
                  <button key={t.k} className={"fchip "+(fStatus===t.k?"on":"")} onClick={()=>setFStatus(t.k)}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="add-card">
              <span className="add-label">Jeu</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {ALL_GAMES.map(g=>(
                  <button key={g} className={"fchip "+(fGames.includes(g)?"on":"")} onClick={()=>toggleArr(fGames,setFGames,g)} style={{display:"flex",alignItems:"center",gap:5}}>
                    <GameLogo game={g} size={14}/> {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="add-card">
              <span className="add-label">Bookmaker</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {bookmakers.map(bk=>(
                  <button key={bk} className={"fchip "+(fBKs.includes(bk)?"on":"")} onClick={()=>toggleArr(fBKs,setFBKs,bk)}>{bk}</button>
                ))}
              </div>
            </div>
            <div className="add-card">
              <span className="add-label">Over / Under</span>
              <div style={{display:"flex",gap:7}}>
                {[{val:"All",label:"Tous"},{val:"Over",label:"Over"},{val:"Under",label:"Under"}].map(opt=>(
                  <button key={opt.val} className={"fchip "+(fOverUnder===opt.val?"on":"")} onClick={()=>setFOverUnder(opt.val)}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="add-card" style={{position:"relative"}}>
              <span className="add-label">Joueur</span>
              <input className="ifield" placeholder="Rechercher..." value={fPlayer} onChange={e=>setFPlayer(e.target.value)}/>
              {fPlayer&&<button onClick={()=>setFPlayer("")} style={{position:"absolute",right:24,bottom:22,background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:16}}>x</button>}
            </div>
            <div className="add-card">
              <span className="add-label">Position / Rôle</span>
              {(()=>{
                // Rôles disponibles selon jeux sélectionnés
                const ROLES_BY_GAME={
                  LoL:["Top Laner","Jungler","Mid Laner","Bot Laner","Support"],
                  CS2:["AWPer","Rifler","IGL"],
                  Dota2:["Carry","Mid","Offlane","Soft Support","Hard Support"],
                  Valorant:["Duelist","Initiator","Controller","Sentinel","Flex"],
                };
                // Si un jeu est sélectionné → montre ses rôles, sinon tous
                let roles=[];
                if(fGames.length>0){
                  fGames.forEach(g=>{if(ROLES_BY_GAME[g])roles=[...new Set([...roles,...ROLES_BY_GAME[g]])]});
                } else {
                  Object.values(ROLES_BY_GAME).forEach(r=>roles=[...new Set([...roles,...r])]);
                }
                return(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button className={"fchip "+(fRole==="All"?"on":"")} onClick={()=>setFRole("All")}>Tous</button>
                    {roles.map(r=>(
                      <button key={r} className={"fchip "+(fRole===r?"on":"")} onClick={()=>setFRole(fRole===r?"All":r)}>{r}</button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="add-card">
              <span className="add-label">Ligue</span>
              {(()=>{
                const LEAGUES_BY_GAME={
                  LoL:["LCK","LEC","LCS","LPL"],
                  Valorant:["Americas","EMEA","Pacific"],
                };
                let leagues=[];
                if(fGames.length>0){
                  fGames.forEach(g=>{if(LEAGUES_BY_GAME[g])leagues=[...new Set([...leagues,...LEAGUES_BY_GAME[g]])]});
                } else {
                  Object.values(LEAGUES_BY_GAME).forEach(l=>leagues=[...new Set([...leagues,...l])]);
                }
                if(leagues.length===0)return <div style={{fontSize:11,color:"#6B7280"}}>Sélectionne LoL ou Valorant pour filtrer par ligue</div>;
                return(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button className={"fchip "+(fLeague==="All"?"on":"")} onClick={()=>setFLeague("All")}>Toutes</button>
                    {leagues.map(l=>(
                      <button key={l} className={"fchip "+(fLeague===l?"on":"")} onClick={()=>setFLeague(fLeague===l?"All":l)}>{l}</button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="add-card">
              <span className="add-label">Type de pari</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <button className={"fchip "+(fDuel?"on":"")} onClick={()=>setFDuel(v=>!v)}>⚔️ Duel</button>
                <button className={"fchip "+(fLive?"on":"")} onClick={()=>setFLive(v=>!v)} style={{display:"flex",alignItems:"center",gap:5}}>
                  🔴 Live
                </button>
                <button className={"fchip "+(fHeadshot?"on":"")} onClick={()=>setFHeadshot(v=>!v)} style={{display:"flex",alignItems:"center",gap:5}}>
                  💀 Headshot
                </button>
              </div>
            </div>

            {/* ── Filtre cote min/max ── */}
            <div className="add-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span className="add-label">Cote</span>
                {(fMinOdds||fMaxOdds)&&(
                  <button onClick={()=>{setFMinOdds("");setFMaxOdds("");}}
                    style={{fontSize:10,color:"#EF4444",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                    × Effacer
                  </button>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontSize:10,color:"#6B7280",marginBottom:4}}>Min</div>
                  <input type="number" step="0.01" min="1" placeholder="ex: 1.60"
                    value={fMinOdds} onChange={e=>setFMinOdds(e.target.value)}
                    className="ifield" style={{marginBottom:0,fontSize:14}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#6B7280",marginBottom:4}}>Max</div>
                  <input type="number" step="0.01" min="1" placeholder="ex: 2.00"
                    value={fMaxOdds} onChange={e=>setFMaxOdds(e.target.value)}
                    className="ifield" style={{marginBottom:0,fontSize:14}}/>
                </div>
              </div>
              {/* Stats live pour la plage sélectionnée */}
              {(fMinOdds||fMaxOdds)&&(()=>{
                const inRange=filteredBets.filter(b=>b.status!=="pending");
                const profit=inRange.reduce((s,b)=>s+b.profit,0);
                const staked=inRange.reduce((s,b)=>s+b.stake,0);
                const won=inRange.filter(b=>b.status==="won").length;
                const wr=inRange.length>0?(won/inRange.length*100).toFixed(0):0;
                const roi=staked>0?(profit/staked*100).toFixed(1):0;
                if(inRange.length===0)return null;
                return(
                  <div style={{background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:8,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:10,color:"#9CA3AF"}}>{inRange.length} paris · {wr}% WR</div>
                      <div style={{fontSize:10,color:parseFloat(roi)>=0?"#22C55E":"#EF4444"}}>{parseFloat(roi)>=0?"+":""}{roi}% ROI</div>
                    </div>
                    <div style={{fontSize:16,fontWeight:700,color:profit>=0?"#22C55E":"#EF4444"}}>
                      {profit>=0?"+":""}{profit.toFixed(0)}$
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* ── Filtre Map ── */}
            <div className="add-card">
              <span className="add-label">Map</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[{v:"all",l:"Toutes"},{v:"none",l:"Sans tag"},{v:"Map 1",l:"Map 1"},{v:"Map 2",l:"Map 2"},{v:"Map 3",l:"Map 3"},{v:"Map 4",l:"Map 4"},{v:"Map 5",l:"Map 5"}].map(({v,l})=>(
                  <button key={v} className={"fchip "+(fMapFilter===v?"on":"")} onClick={()=>setFMapFilter(v)}>{l}</button>
                ))}
              </div>
            </div>

            {/* ── Filtre Mise min/max ── */}
            <div className="add-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span className="add-label">Mise ($)</span>
                {(fMinStake||fMaxStake)&&(
                  <button onClick={()=>{setFMinStake("");setFMaxStake("");}}
                    style={{fontSize:10,color:"#EF4444",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>× Effacer</button>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:"#6B7280",marginBottom:4}}>Min</div>
                  <input type="number" step="1" min="0" placeholder="ex: 10"
                    value={fMinStake} onChange={e=>setFMinStake(e.target.value)}
                    className="ifield" style={{marginBottom:0,fontSize:14}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#6B7280",marginBottom:4}}>Max</div>
                  <input type="number" step="1" min="0" placeholder="ex: 100"
                    value={fMaxStake} onChange={e=>setFMaxStake(e.target.value)}
                    className="ifield" style={{marginBottom:0,fontSize:14}}/>
                </div>
              </div>
            </div>

            {/* ── Filtre Tournoi (tous jeux) ── */}
            {(()=>{
              const allTourneys=[...new Set(bets.filter(b=>b.tournament).map(b=>b.tournament))];
              const hasHors=bets.some(b=>!b.tournament);
              const opts=[...(hasHors?["Hors tournoi"]:[]),...allTourneys];
              if(opts.length===0)return null;
              const toggleT=(t)=>setFTourneys(prev=>{const n=new Set(prev);if(n.has(t))n.delete(t);else n.add(t);return n;});
              return(
                <div className="add-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span className="add-label">Tournoi</span>
                    {fTourneys.size>0&&<button onClick={()=>setFTourneys(new Set())} style={{fontSize:10,color:"#EF4444",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>× Effacer ({fTourneys.size})</button>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {opts.map(t=>{
                      const isOn=fTourneys.has(t);
                      return(
                        <button key={t} onClick={()=>toggleT(t)}
                          style={{padding:"5px 11px",borderRadius:8,border:"1.5px solid "+(isOn?"#7C3AED":"#1F2937"),background:isOn?"rgba(124,58,237,0.12)":"transparent",color:isOn?"#A78BFA":"#6B7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                          {t==="Hors tournoi"?"📅 Sans tournoi":"🏆 "+t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Tournoi — apparaît si un jeu est sélectionné */}
            {fGames.length>0&&(()=>{
              const tourneysForGame=[...new Set(
                bets
                  .filter(b=>fGames.includes(b.game)&&b.tournament)
                  .map(b=>b.tournament)
              )];
              // Add "Hors tournoi" if any bets have no tournament
              const hasHors=bets.filter(b=>fGames.includes(b.game)&&!b.tournament).length>0;
              const allOptions=[...(hasHors?["Hors tournoi"]:[]),...tourneysForGame];
              if(allOptions.length===0)return null;
              const toggleT=(t)=>setFTourneys(prev=>{
                const n=new Set(prev);
                if(n.has(t))n.delete(t); else n.add(t);
                return n;
              });
              return(
                <div className="add-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span className="add-label" style={{marginBottom:0}}>Tournoi</span>
                    {fTourneys.size>0&&(
                      <button onClick={()=>setFTourneys(new Set())}
                        style={{fontSize:10,color:"#EF4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                        × Effacer ({fTourneys.size})
                      </button>
                    )}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {allOptions.map(t=>{
                      const isOn=fTourneys.has(t);
                      const isHors=t==="Hors tournoi";
                      return(
                        <button key={t} onClick={()=>toggleT(t)}
                          style={{padding:"5px 11px",borderRadius:8,border:"1.5px solid "+(isOn?(isHors?"#6B7280":"#7C3AED"):"#1F2937"),
                            background:isOn?(isHors?"rgba(107,114,128,0.12)":"rgba(124,58,237,0.12)"):"transparent",
                            color:isOn?(isHors?"#9CA3AF":"#A78BFA"):"#6B7280",
                            fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",
                            transition:"all .15s ease"}}>
                          {isHors?"📅":"🏆"} {t}
                        </button>
                      );
                    })}
                  </div>
                  {fTourneys.size>0&&(
                    <div style={{fontSize:10,color:"#6B7280",marginTop:6}}>
                      {fTourneys.size} sélectionné{fTourneys.size>1?"s":""} — résultats combinés
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{display:"flex",gap:9,marginBottom:8}}>
              <button onClick={()=>{setFGames([]);setFBKs([]);setFPlayer("");setFStatus("All");setFOverUnder("All");setFLive(false);setFHeadshot(false);setFDuel(false);setFMinOdds("");setFMaxOdds("");setFMinStake("");setFMaxStake("");setFMapFilter("all");setFRole("All");setFLeague("All");setFTourneys(new Set());setFiltresPage(1);}} style={{flex:1,padding:"11px",background:"#111827",border:"1px solid #1F2937",borderRadius:10,color:"#9CA3AF",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13}}>
                Réinitialiser
              </button>
              <button onClick={()=>setView("mesparis")} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13}}>
                Appliquer →
              </button>
            </div>
            {(()=>{
              const fs=filteredBets;
              const fw=fs.filter(b=>b.status==="won").length;
              const fp=fs.filter(b=>b.status!=="pending").reduce((s,b)=>s+b.profit,0);
              return(
                <div style={{display:"flex",gap:9,marginBottom:14}}>
                  <div className="card" style={{flex:1,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:2}}>{fs.length} paris</div>
                    <div style={{fontSize:15,fontWeight:700,color:fp>=0?"#22C55E":"#F87171"}}>{fp>=0?"+":""}{fp.toFixed(0)}$</div>
                  </div>
                  <div className="card" style={{flex:1,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:2}}>Win Rate</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#E5E7EB"}}>{fs.length>0?(fw/fs.length*100).toFixed(0):0}%</div>
                  </div>
                </div>
              );
            })()}
            <div className="stat-bloc">
              {filteredBets.length===0&&<div style={{padding:"18px 15px",color:"#6B7280",fontSize:13}}>Aucun pari</div>}
              {filteredBets.slice(0,(filtresPage)*FILTRES_PER_PAGE).map(b=>(
                <BetRow key={b.id} bet={b} onStatus={updateStatus} onDelete={deleteBet} onDuplicate={duplicateBet} onEdit={()=>openEdit(b)}/>
              ))}
            </div>
            {filteredBets.length>filtresPage*FILTRES_PER_PAGE&&(
              <button onClick={()=>setFiltresPage(p=>p+1)} style={{width:"100%",padding:"13px",background:"#111827",border:"1px solid #1F2937",borderRadius:12,color:"#9CA3AF",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:13,marginTop:8}}>
                Voir {filteredBets.length-filtresPage*FILTRES_PER_PAGE} paris de plus
              </button>
            )}
          </div>
        )}


        {/* ── ADD BET ── */}
        {view==="add"&&(
          <div className="view-enter" style={{margin:"-16px -14px",padding:"0",minHeight:"calc(100vh - 84px)",background:"#0D0F1E"}}>

            {/* ── Top header bar ── */}
            {editingBet&&(
              <div style={{background:"rgba(124,58,237,0.12)",borderBottom:"1px solid rgba(124,58,237,0.25)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"#A78BFA",fontWeight:700}}>✎ Mode modification — {editingBet.player}</span>
                <button onClick={()=>{setEditingBet(null);setForm({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?form.bookmaker:""});}}
                  style={{fontSize:11,color:"#6B7280",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                  × Annuler
                </button>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 16px 12px"}}>
              <div style={{fontSize:17,fontWeight:700,color:"#E5E7EB",letterSpacing:-.2}}>
                {duelMode?"Duel ⚔️":sessionMode?"Session multi-map":editingBet?"✎ Modifier pari":"Ajouter pari"}
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setForm(f=>({...f,isLive:!f.isLive}))}
                  style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(form.isLive?"#EF4444":"rgba(255,255,255,0.1)"),background:form.isLive?"rgba(239,68,68,0.15)":"transparent",color:form.isLive?"#EF4444":"#9CA3AF",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease"}}>
                  {form.isLive?"🔴 LIVE":"LIVE"}
                </button>
                <button onClick={()=>{setDuelMode(v=>!v);setSessionMode(false);}}
                  style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(duelMode?"#F59E0B":"rgba(255,255,255,0.1)"),background:duelMode?"rgba(245,158,11,0.15)":"transparent",color:duelMode?"#F59E0B":"#9CA3AF",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease"}}>
                  ⚔️ Duel
                </button>
                <button onClick={()=>{setSessionMode(v=>!v);setDuelMode(false);}}
                  style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(sessionMode?"#7C3AED":"rgba(255,255,255,0.1)"),background:sessionMode?"rgba(124,58,237,0.15)":"transparent",color:sessionMode?"#A78BFA":"#9CA3AF",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease"}}>
                  Session
                </button>
              </div>
            </div>

            <div style={{padding:"0 12px 20px"}}>

            {/* ── DUEL MODE ── */}
            {duelMode&&(
              <>
                {/* Bookmaker */}
                <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(245,158,11,0.2)",padding:"14px 16px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500}}>Bookmaker</span>
                    <button onClick={()=>setModalBK(true)} style={{padding:"3px 10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#6B7280",fontSize:10,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                      + Nouveau
                    </button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,background:"#0D0F1E",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    {(BK_LOGOS[duelForm.bookmaker]||bkPhotos[duelForm.bookmaker])&&<img src={BK_LOGOS[duelForm.bookmaker]||bkPhotos[duelForm.bookmaker]} alt="" style={{width:28,height:28,borderRadius:7,objectFit:"cover",flexShrink:0}}/>}
                    <select value={duelForm.bookmaker} onChange={e=>setDuelForm(f=>({...f,bookmaker:e.target.value}))}
                      style={{flex:1,background:"transparent",border:"none",color:duelForm.bookmaker?"#E5E7EB":"#6B7280",fontSize:16,fontFamily:"'Inter',sans-serif",fontWeight:duelForm.bookmaker?600:400,outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
                      <option value="">Sélectionner...</option>
                      {bookmakers.map(bk=><option key={bk} value={bk} style={{background:"#131525"}}>{bk}</option>)}
                    </select>
                    <span style={{color:"#6B7280",fontSize:16}}>⌄</span>
                  </div>
                </div>

                {/* Joueur 1 vs Joueur 2 */}
                <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(245,158,11,0.2)",padding:"14px 16px",marginBottom:10}}>
                  <div style={{fontSize:12,color:"#F59E0B",fontWeight:700,marginBottom:12,letterSpacing:.5}}>⚔️ Duel — Plus de kills sur cette map</div>

                  {/* Joueurs */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:10,color:"#9CA3AF",marginBottom:6,fontWeight:600}}>Joueur 1</div>
                      <PlayerAC value={duelForm.player1} onChange={v=>setDuelForm(f=>({...f,player1:v,winner:""}))} allPlayers={allPlayers} activeTourneys={activeTourneys} onConfirm={()=>{}}/>
                      {duelForm.player1&&findPlayer(duelForm.player1)&&(
                        <div style={{marginTop:4,fontSize:10,color:GAME_CFG[findPlayer(duelForm.player1).game]?.accent||"#A78BFA",fontWeight:600}}>
                          {findPlayer(duelForm.player1).team}
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:16,fontWeight:800,color:"#F59E0B",textAlign:"center",paddingTop:22}}>VS</div>
                    <div>
                      <div style={{fontSize:10,color:"#9CA3AF",marginBottom:6,fontWeight:600}}>Joueur 2</div>
                      <PlayerAC value={duelForm.player2} onChange={v=>setDuelForm(f=>({...f,player2:v,winner:""}))} allPlayers={allPlayers} activeTourneys={activeTourneys} onConfirm={()=>{}}/>
                      {duelForm.player2&&findPlayer(duelForm.player2)&&(
                        <div style={{marginTop:4,fontSize:10,color:GAME_CFG[findPlayer(duelForm.player2).game]?.accent||"#A78BFA",fontWeight:600}}>
                          {findPlayer(duelForm.player2).team}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sélection du gagnant — apparaît quand les 2 joueurs sont choisis */}
                  {duelForm.player1&&duelForm.player2&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:10,color:"#9CA3AF",marginBottom:6,fontWeight:600}}>Qui va avoir le plus de kills ?</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <button onClick={()=>setDuelForm(f=>({...f,winner:"player1"}))}
                          style={{padding:"12px 8px",borderRadius:12,border:"2px solid "+(duelForm.winner==="player1"?"#F59E0B":"#1F2937"),background:duelForm.winner==="player1"?"rgba(245,158,11,0.12)":"#111827",color:duelForm.winner==="player1"?"#F59E0B":"#9CA3AF",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s",textTransform:"capitalize"}}>
                          {duelForm.player1||"J1"}
                          {duelForm.winner==="player1"&&<div style={{fontSize:9,color:"#F59E0B",marginTop:2}}>✓ SÉLECTIONNÉ</div>}
                        </button>
                        <button onClick={()=>setDuelForm(f=>({...f,winner:"player2"}))}
                          style={{padding:"12px 8px",borderRadius:12,border:"2px solid "+(duelForm.winner==="player2"?"#F59E0B":"#1F2937"),background:duelForm.winner==="player2"?"rgba(245,158,11,0.12)":"#111827",color:duelForm.winner==="player2"?"#F59E0B":"#9CA3AF",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s",textTransform:"capitalize"}}>
                          {duelForm.player2||"J2"}
                          {duelForm.winner==="player2"&&<div style={{fontSize:9,color:"#F59E0B",marginTop:2}}>✓ SÉLECTIONNÉ</div>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cote unique */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:"#9CA3AF",marginBottom:4,fontWeight:600}}>Cote</div>
                    <div style={{background:"#0D0F1E",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                      <NumPad value={duelForm.odds} onChange={v=>setDuelForm(f=>({...f,odds:v}))} placeholder="1.50" step="0.01"/>
                    </div>
                  </div>

                  {/* Mise */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:"#9CA3AF",marginBottom:4,fontWeight:600}}>Mise ($)</div>
                    <div style={{background:"#0D0F1E",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                      <NumPad value={duelForm.stake} onChange={v=>setDuelForm(f=>({...f,stake:v}))} placeholder="50" step="1"/>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      {[50,62,75,87,100].map(s=>(
                        <button key={s} onClick={()=>setDuelForm(f=>({...f,stake:String(s)}))}
                          style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(duelForm.stake===String(s)?"#F59E0B":"#1F2937"),background:duelForm.stake===String(s)?"rgba(245,158,11,0.12)":"#111827",color:duelForm.stake===String(s)?"#F59E0B":"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                          {s}$
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Map */}
                  <div>
                    <div style={{fontSize:10,color:"#9CA3AF",marginBottom:6,fontWeight:600}}>Map</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["Map 1","Map 2","Map 3","Map 4"].map(m=>(
                        <button key={m} onClick={()=>setDuelForm(f=>({...f,mapTag:m}))}
                          style={{padding:"7px 14px",borderRadius:20,border:"1.5px solid "+(duelForm.mapTag===m?"#F59E0B":"#1F2937"),background:duelForm.mapTag===m?"rgba(245,158,11,0.1)":"transparent",color:duelForm.mapTag===m?"#F59E0B":"#6B7280",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Duel */}
                {(()=>{
                  const disabled=!duelForm.player1||!duelForm.player2||!duelForm.odds||!duelForm.stake||!duelForm.bookmaker||!duelForm.winner;
                  const missing=[];
                  if(!duelForm.bookmaker)missing.push("Bookmaker");
                  if(!duelForm.player1)missing.push("Joueur 1");
                  if(!duelForm.player2)missing.push("Joueur 2");
                  if(!duelForm.winner)missing.push("Gagnant");
                  if(!duelForm.odds)missing.push("Cote");
                  if(!duelForm.stake)missing.push("Mise");
                  return(
                    <>
                      <button onClick={addDuel} disabled={disabled}
                        style={{width:"100%",padding:"17px",background:disabled?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#F59E0B,#EF4444)",border:"none",borderRadius:16,color:disabled?"rgba(255,255,255,0.18)":"#fff",fontSize:16,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:.3,boxShadow:disabled?"none":"0 8px 28px rgba(245,158,11,0.35)",transition:"all .25s",marginBottom:4}}>
                        ⚔️ Enregistrer le duel
                      </button>
                      {missing.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8,justifyContent:"center"}}>
                          {missing.map(f=>(
                            <span key={f} style={{fontSize:10,fontWeight:700,color:"#F59E0B",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:5,padding:"2px 7px"}}>⚠ {f}</span>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* ─── Floating label input style helper ─── */}
            {/* Each card: dark rounded box with subtle border + label top-left */}

            {/* ── 1. BOOKMAKER ── */}
            {!duelMode&&(()=>{
              const logo=BK_LOGOS[form.bookmaker]||bkPhotos[form.bookmaker];
              return(
                <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10,position:"relative"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,letterSpacing:.2}}>Bookmaker</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setStickyBK(v=>!v)} style={{padding:"3px 10px",borderRadius:10,border:"1px solid "+(stickyBK?"#7C3AED":"rgba(255,255,255,0.08)"),background:stickyBK?"rgba(124,58,237,0.12)":"transparent",color:stickyBK?"#A78BFA":"#6B7280",fontSize:10,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                        {stickyBK?"📌 Fixé":"Garder"}
                      </button>
                      <button onClick={()=>setModalBK(true)} style={{padding:"3px 10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#6B7280",fontSize:10,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                        + Nouveau
                      </button>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,background:"#0D0F1E",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    {logo&&<img src={logo} alt="" style={{width:28,height:28,borderRadius:7,objectFit:"cover",flexShrink:0}}/>}
                    <select value={form.bookmaker} onChange={e=>setForm(f=>({...f,bookmaker:e.target.value}))}
                      style={{flex:1,background:"transparent",border:"none",color:form.bookmaker?"#E5E7EB":"#6B7280",fontSize:16,fontFamily:"'Inter',sans-serif",fontWeight:form.bookmaker?600:400,outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
                      <option value="" style={{color:"#6B7280",background:"#131525"}}>Sélectionner...</option>
                      {bookmakers.map(bk=><option key={bk} value={bk} style={{color:"#E5E7EB",background:"#131525"}}>{bk}</option>)}
                    </select>
                    <span style={{color:"#6B7280",fontSize:16,flexShrink:0}}>⌄</span>
                  </div>
                </div>
              );
            })()}

            {!duelMode&&<>
            {/* ── 2. JOUEUR (Sélection 1) ── */}
            <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500}}>Joueur</span>
                {form.autoInfo?.game==="CS2"&&(
                  <div onClick={()=>setForm(f=>({...f,isHeadshot:!f.isHeadshot,description:""}))}
                    style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"3px 10px",borderRadius:10,border:"1px solid "+(form.isHeadshot?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.08)"),background:form.isHeadshot?"rgba(124,58,237,0.12)":"transparent"}}>
                    <span style={{fontSize:10,fontWeight:600,color:form.isHeadshot?"#A78BFA":"#6B7280"}}>HS</span>
                    <div style={{width:26,height:14,borderRadius:7,background:form.isHeadshot?"linear-gradient(135deg,#7C3AED,#3B82F6)":"rgba(255,255,255,0.12)",position:"relative",transition:"background .2s"}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:form.isHeadshot?14:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}/>
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,background:"#0D0F1E",borderRadius:12,padding:"4px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <PlayerAC value={form.player} onChange={v=>setForm(f=>({...f,player:v,autoInfo:findPlayer(v)}))} allPlayers={allPlayers} activeTourneys={activeTourneys} onConfirm={()=>{setTimeout(()=>{const el=document.getElementById("kills-select");if(el){el.focus();el.click();}else{const odds=document.getElementById("odds-input-field");if(odds)odds.focus();}},80);}}/>
              </div>
              {form.autoInfo&&(
                <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.18)",borderRadius:10,padding:"7px 12px",flexWrap:"wrap"}}>
                  <GameLogo game={form.autoInfo.game} size={14}/>
                  <span style={{fontSize:13,fontWeight:700,color:"#E5E7EB",textTransform:"capitalize",letterSpacing:-.2}}>{form.player}</span>
                  <span style={{width:1,height:12,background:"rgba(255,255,255,0.15)",flexShrink:0}}/>
                  <span style={{fontSize:11,color:GAME_CFG[form.autoInfo.game]?.accent||"#A78BFA",fontWeight:600}}>{form.autoInfo.game}</span>
                  <span style={{fontSize:11,color:"#6B7280"}}>·</span>
                  <span style={{fontSize:11,color:"#9CA3AF"}}>{form.autoInfo.team}</span>
                  <span style={{fontSize:11,color:"#6B7280"}}>·</span>
                  <span style={{fontSize:11,color:"#6B7280"}}>{form.autoInfo.role}</span>
                  {(()=>{
                    const t=activeTourneys[form.autoInfo.game];
                    const isExpired=t&&t.end&&new Date(t.end)<new Date();
                    if(!t||isExpired)return null;
                    return(
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#A78BFA"}}>
                        🏆 {t.name}
                      </span>
                    );
                  })()}
                </div>
              )}
              {form.player&&!form.autoInfo&&<div style={{marginTop:6,fontSize:10,color:"#F59E0B"}}>Joueur non reconnu — tu peux quand même enregistrer.</div>}
            </div>

            {/* ── 3. DESCRIPTION + OVER/UNDER ── */}
            <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10}}>
              <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,display:"block",marginBottom:12}}>Intitulé du pari</span>
              {/* Over / Under pill selector */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <button onClick={()=>setForm(f=>({...f,overUnder:"Over"}))}
                  style={{padding:"12px 0",borderRadius:12,border:"1.5px solid "+(form.overUnder==="Over"?"#22C55E":"rgba(255,255,255,0.08)"),background:form.overUnder==="Over"?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.02)",color:form.overUnder==="Over"?"#22C55E":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease",boxShadow:form.overUnder==="Over"?"0 0 16px rgba(74,222,128,0.15)":"none"}}>
                  Over
                </button>
                <button onClick={()=>setForm(f=>({...f,overUnder:"Under"}))}
                  style={{padding:"12px 0",borderRadius:12,border:"1.5px solid "+(form.overUnder==="Under"?"#EF4444":"rgba(255,255,255,0.08)"),background:form.overUnder==="Under"?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.02)",color:form.overUnder==="Under"?"#EF4444":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease",boxShadow:form.overUnder==="Under"?"0 0 16px rgba(239,68,68,0.12)":"none"}}>
                  Under
                </button>
              </div>
              {/* Kills line dropdown */}
              {form.autoInfo&&(()=>{
                const game=form.autoInfo.game;
                let opts=[];
                if(form.isHeadshot) opts=Array.from({length:16},(_,i)=>(i+2.5).toFixed(1)+" Headshots");
                else if(game==="LoL") opts=Array.from({length:20},(_,i)=>(i+0.5).toFixed(1)+" Kills");
                else if(game==="CS2") opts=Array.from({length:16},(_,i)=>(i+7.5).toFixed(1)+" Kills");
                else if(game==="Dota2") opts=Array.from({length:16},(_,i)=>(i+2.5).toFixed(1)+" Kills");
                else if(game==="Valorant") opts=Array.from({length:16},(_,i)=>(i+7.5).toFixed(1)+" Kills");
                // Si la valeur éditée n'est pas dans les options, l'ajouter
                if(form.description&&!opts.includes(form.description)){opts=[form.description,...opts];}
                if(opts.length===0)return null;
                return(
                  <div style={{background:"#0D0F1E",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",padding:"4px"}}>
                    <select id="kills-select" value={form.description} onChange={e=>{
                        setForm(f=>({...f,description:e.target.value}));
                        if(e.target.value){
                          setTimeout(()=>{const el=document.getElementById("odds-input-field");if(el)el.focus();},80);
                        }
                      }}
                      style={{width:"100%",background:"transparent",border:"none",padding:"10px 14px",color:form.description?"#E5E7EB":"#6B7280",fontSize:15,fontFamily:"'Inter',sans-serif",fontWeight:form.description?600:400,outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
                      <option value="" style={{color:"#6B7280",background:"#131525"}}>Choisir une ligne...</option>
                      {opts.map(o=><option key={o} value={o} style={{color:"#E5E7EB",background:"#131525"}}>{o}</option>)}
                    </select>
                  </div>
                );
              })()}
              {!form.autoInfo&&(
                <div style={{background:"#0D0F1E",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",padding:"12px 14px",color:"#4B5563",fontSize:13,textAlign:"center"}}>
                  Sélectionnez d'abord un joueur
                </div>
              )}
            </div>

            {/* ── 4. COTE + MISE ── */}
            {!sessionMode&&(
              <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div>
                    <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,display:"block",marginBottom:8}}>Cote</span>
                    <div style={{background:"#0D0F1E",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                      <NumPad id="odds-input-field" value={form.odds} onChange={v=>setForm(f=>({...f,odds:v}))} placeholder="Ex: 1.50" step="0.01"/>
                    </div>
                  </div>
                  <div>
                    <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,display:"block",marginBottom:8}}>Mise ($)</span>
                    <div style={{background:"#0D0F1E",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                      <NumPad value={form.stake} onChange={v=>setForm(f=>({...f,stake:v}))} placeholder="Ex: 50" step="1"/>
                    </div>
                  </div>
                </div>
                {/* Quick stakes — style pill gris */}
                <div style={{display:"flex",gap:7,marginBottom:form.odds&&form.stake?12:0}}>
                  {QUICK_STAKES.map(s=>(
                    <button key={s} onClick={()=>setForm(f=>({...f,stake:String(s)}))}
                      style={{flex:1,padding:"9px 0",borderRadius:10,border:"1px solid "+(parseFloat(form.stake)===s?"#7C3AED":"rgba(255,255,255,0.08)"),background:parseFloat(form.stake)===s?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.03)",color:parseFloat(form.stake)===s?"#A78BFA":"#9CA3AF",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,transition:"all .2s ease"}}>
                      {s}$
                    </button>
                  ))}
                </div>
                {form.odds&&form.stake&&(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{fontSize:12,color:"#6B7280"}}>Gain potentiel</span>
                    <span style={{fontSize:15,fontWeight:700,color:"#22C55E"}}>+{(parseFloat(form.stake||0)*(parseFloat(form.odds||1)-1)).toFixed(2)}$</span>
                  </div>
                )}
              </div>
            )}

            {/* ── SESSION MAPS ── */}
            {sessionMode&&(
              <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500}}>Maps · Mise défaut</span>
                  <div style={{display:"flex",gap:5}}>
                    {QUICK_STAKES.map(s=>(
                      <button key={s} onClick={()=>setForm(f=>({...f,stake:String(s)}))}
                        style={{padding:"3px 8px",borderRadius:8,border:"1px solid "+(parseFloat(form.stake)===s?"#7C3AED":"rgba(255,255,255,0.08)"),background:parseFloat(form.stake)===s?"rgba(124,58,237,0.12)":"transparent",color:parseFloat(form.stake)===s?"#A78BFA":"#6B7280",fontSize:10,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                        {s}$
                      </button>
                    ))}
                  </div>
                </div>
                {sessionMaps.map((m,i)=>(
                  <div key={i} style={{padding:"10px 12px",borderRadius:12,border:"1px solid "+(m.enabled?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.04)"),background:m.enabled?"rgba(124,58,237,0.04)":"transparent",marginBottom:7,opacity:m.enabled?1:0.4}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:m.enabled?8:0}}>
                      <span style={{fontWeight:600,fontSize:13,color:m.enabled?"#A78BFA":"#4B5563"}}>Map {i+1}</span>
                      <button onClick={()=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,enabled:!x.enabled}:x))}
                        style={{background:"none",border:"none",color:m.enabled?"#7C3AED":"#4B5563",fontSize:11,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700}}>
                        {m.enabled?"ON":"OFF"}
                      </button>
                    </div>
                    {m.enabled&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <NumPad value={m.odds} onChange={v=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,odds:v}:x))} placeholder="Cote" step="0.01"/>
                        <NumPad value={m.stake} onChange={v=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,stake:v}:x))} placeholder={form.stake||"Mise"} step="1"/>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={()=>setSessionMaps(ms=>[...ms,{...EMPTY_MAP_ROW}])} style={{width:"100%",background:"transparent",border:"1px dashed rgba(124,58,237,0.2)",borderRadius:10,padding:"9px",color:"#6B7280",cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif"}}>
                  + Ajouter map
                </button>
              </div>
            )}

            {/* ── 5. MAP TAG ── */}
            <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:10}}>
              <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,display:"block",marginBottom:12}}>Map</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {MAP_TAGS.map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,mapTag:f.mapTag===t?"":t}))}
                    style={{padding:"8px 16px",borderRadius:20,border:"1.5px solid "+(form.mapTag===t?"#7C3AED":"rgba(255,255,255,0.08)"),background:form.mapTag===t?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.02)",color:form.mapTag===t?"#A78BFA":"#9CA3AF",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,transition:"all .2s ease",boxShadow:form.mapTag===t?"0 0 12px rgba(124,58,237,0.15)":"none"}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 6. STATUT ── */}
            <div style={{background:"#131525",borderRadius:16,border:"1px solid rgba(124,58,237,0.15)",padding:"14px 16px",marginBottom:16}}>
              <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500,display:"block",marginBottom:12}}>État</span>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {["pending","won","lost"].map(s=>(
                  <button key={s} onClick={()=>setForm(f=>({...f,status:s}))}
                    style={{padding:"11px 0",borderRadius:12,border:"1.5px solid "+(form.status===s?STATUS_CFG[s].color+"88":"rgba(255,255,255,0.07)"),background:form.status===s?STATUS_CFG[s].bg:"rgba(255,255,255,0.02)",color:form.status===s?STATUS_CFG[s].color:"#9CA3AF",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease"}}>
                    {STATUS_CFG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CTA ── */}
            {(()=>{
              const missing=[];
              if(!form.bookmaker) missing.push("Bookmaker");
              if(!form.player) missing.push("Joueur");
              if(!form.description) missing.push("Kills");
              if(!form.odds) missing.push("Cote");
              if(!form.stake) missing.push("Mise");
              if(!form.mapTag) missing.push("Map");
              const canAdd=sessionMode?(!form.player||!sessionMaps.some(m=>m.enabled&&m.odds)):missing.length===0;
              const isDisabled=sessionMode?(!form.player||!sessionMaps.some(m=>m.enabled&&m.odds)):missing.length>0;
              return(
                <>
                  <button onClick={sessionMode?addSession:addBet} disabled={isDisabled}
                    style={{
                      width:"100%",padding:"17px",
                      background:isDisabled?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7C3AED 0%,#3B82F6 100%)",
                      border:"none",borderRadius:16,
                      color:isDisabled?"rgba(255,255,255,0.18)":"#fff",
                      fontSize:16,fontWeight:700,cursor:isDisabled?"not-allowed":"pointer",
                      fontFamily:"'Inter',sans-serif",letterSpacing:.3,
                      boxShadow:isDisabled?"none":"0 8px 28px rgba(124,58,237,0.4)",
                      transition:"all .25s",marginBottom:missing.length>0?4:8,
                    }}>
                    {sessionMode?"Enregistrer session ("+sessionMaps.filter(m=>m.enabled&&m.odds).length+" maps)":editingBet?"✓ Sauvegarder modifications":"Ajouter pari"}
                  </button>
                  {editingBet&&(
                    <button onClick={()=>{setEditingBet(null);setForm({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?form.bookmaker:""});}}
                      style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid #374151",borderRadius:16,color:"#9CA3AF",fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginTop:8}}>
                      × Annuler modification
                    </button>
                  )}
                  {!sessionMode&&missing.length>0&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8,justifyContent:"center"}}>
                      {missing.map(f=>(
                        <span key={f} style={{fontSize:10,fontWeight:700,color:"#F59E0B",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:5,padding:"2px 7px"}}>
                          ⚠ {f}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            </>
            }

            </div>{/* end padding wrapper */}
          </div>
        )}


        {/* ── STATS ── */}
        {view==="statistiques"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Statistiques</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={exportCSV} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:7,padding:"6px 10px",color:"#9CA3AF",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600}}>
                  CSV
                </button>
                <button onClick={exportJSON} style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:7,padding:"6px 10px",color:"#22C55E",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700}}>
                  💾 Backup
                </button>
                <label style={{background:"#111827",border:"1px solid #1F2937",borderRadius:7,padding:"6px 10px",color:"#9CA3AF",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600}}>
                  📂 Import
                  <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importJSON(e.target.files[0]);e.target.value="";}}/>
                </label>
              </div>
            </div>

            {settled.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
                <div className="card" style={{padding:"12px"}}>
                  <div style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Série actuelle</div>
                  <div style={{fontSize:28,fontWeight:800,color:currentStreak>1?(streakType==="won"?"#22C55E":"#F87171"):"#9CA3AF",lineHeight:1}}>{currentStreak>1?currentStreak:"-"}</div>
                  <div style={{fontSize:9,color:"#9CA3AF",marginTop:3}}>{currentStreak>1?(streakType==="won"?"✓ victoires":"✗ défaites")+" de suite":"Pas de série"}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {bestMonth&&<div className="card" style={{padding:"10px 12px",flex:1}}>
                    <div style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Meilleur mois</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#22C55E"}}>+{bestMonth[1].toFixed(0)}$</div>
                    <div style={{fontSize:9,color:"#9CA3AF"}}>{bestMonth[0]}</div>
                  </div>}
                  {worstMonth&&worstMonth[1]<0&&<div className="card" style={{padding:"10px 12px",flex:1}}>
                    <div style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Pire mois</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#F87171"}}>{worstMonth[1].toFixed(0)}$</div>
                    <div style={{fontSize:9,color:"#9CA3AF"}}>{worstMonth[0]}</div>
                  </div>}
                </div>
              </div>
            )}




            {/* ── PAR JEU — accordéons regroupés ── */}
            {ALL_GAMES.map(game=>{
              const gs=perGameStats[game];
              if(!gs)return null;
              const cfg=GAME_CFG[game]||{accent:"#9CA3AF"};
              const isOpen=!!statsGameOpen[game];
              const toggle=()=>setStatsGameOpen(s=>({...s,[game]:!s[game]}));
              return(
                <div key={game} style={{marginBottom:10}}>
                  {/* Accordéon header */}
                  <button onClick={toggle} style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"stretch",background:"#111827",border:"1px solid "+(isOpen?cfg.accent+"55":"#1F2937"),borderRadius:isOpen?"14px 14px 0 0":"14px",padding:"12px 14px",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s ease",textAlign:"left"}}>
                    {/* Top row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <GameLogo game={game} size={18}/>
                        <span style={{fontSize:14,fontWeight:700,color:cfg.accent}}>{game}</span>
                        <span style={{fontSize:10,color:"#6B7280"}}>{gs.count} paris</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{padding:"2px 8px",borderRadius:6,background:gs.profit>=0?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",fontSize:11,fontWeight:700,color:gs.profit>=0?"#22C55E":"#EF4444"}}>{gs.profit>=0?"+":""}{gs.profit.toFixed(0)}$</span>
                        <span style={{fontSize:11,color:"#6B7280",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▼</span>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>{gs.wr.toFixed(0)}% WR</span>
                      <span style={{fontSize:11,color:"#6B7280"}}>·</span>
                      <span style={{fontSize:11,fontWeight:700,color:gs.roi>=0?"#22C55E":"#EF4444"}}>{gs.roi>=0?"+":""}{gs.roi.toFixed(1)}% ROI</span>
                      <span style={{fontSize:11,color:"#6B7280"}}>·</span>
                      <span style={{fontSize:11,color:"#9CA3AF"}}>@{gs.avgOdds.toFixed(2)} moy.</span>
                      <span style={{fontSize:11,color:"#6B7280"}}>·</span>
                      <span style={{fontSize:11,fontWeight:700,color:gs.profit>=0?"#22C55E":"#EF4444",background:gs.profit>=0?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",padding:"1px 6px",borderRadius:5}}>{gs.profit>=0?"+":""}{bankroll>0?(gs.profit/bankroll*100).toFixed(1):0}% BK</span>
                    </div>
                    {/* Progress bar: WR */}
                    {(()=>{
                      const wr=gs.wr;
                      const roiAbs=Math.min(Math.abs(gs.roi),50); // cap à 50%
                      return(
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          {/* WR bar */}
                          <div style={{flex:1,height:4,background:"#1F2937",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:wr+"%",background:wr>55?"linear-gradient(90deg,#22C55E,#4ADE80)":wr<45?"linear-gradient(90deg,#EF4444,#F87171)":"linear-gradient(90deg,#9CA3AF,#6B7280)",borderRadius:2,transition:"width .5s ease"}}/>
                          </div>
                          {/* ROI bar */}
                          <div style={{flex:1,height:4,background:"#1F2937",borderRadius:2,overflow:"hidden",position:"relative"}}>
                            <div style={{position:"absolute",top:0,left:gs.roi>=0?"50%":"calc(50% - "+(roiAbs/100*100/2)+"%)",height:"100%",width:(roiAbs/50*50)+"%",background:gs.roi>=0?"linear-gradient(90deg,#3B82F6,#06B6D4)":"linear-gradient(90deg,#EF4444,#F87171)",borderRadius:2,transition:"all .5s ease"}}/>
                          </div>
                        </div>
                      );
                    })()}
                  </button>

                  {isOpen&&(
                    <div style={{background:"#111827",border:"1px solid #1F2937",borderTop:"none",borderRadius:"0 0 14px 14px",overflow:"hidden"}}>

                      {/* Top joueurs */}
                      {gs.topP.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif"}}>Top joueurs</div>
                          {gs.topP.map((p,i)=>(
                            <div key={p.player} className="stat-row">
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <span style={{fontSize:11,color:"#6B7280",fontWeight:700,width:14}}>{i+1}</span>
                                <div>
                                  <div style={{fontWeight:700,fontSize:13,color:"#E5E7EB",textTransform:"capitalize"}}>{p.player}</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{p.count} paris · {p.count>0?(p.won/p.count*100).toFixed(0):0}% WR</div>
                                </div>
                              </div>
                              <span style={{fontWeight:700,fontSize:13,color:p.profit>=0?"#22C55E":"#EF4444"}}>{p.profit>=0?"+":""}{p.profit.toFixed(0)}$</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Maps */}
                      {gs.maps.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>Maps</div>
                          {gs.maps.map(m=>{
                            const wr=m.count>0?(m.won/m.count*100):0;
                            const roi=m.staked>0?(m.profit/m.staked*100):0;
                            return(
                              <div key={m.tag} className="stat-row">
                                <div>
                                  <div style={{fontWeight:600,fontSize:13,color:"#E5E7EB"}}>{m.tag}</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{m.count} paris · {wr.toFixed(0)}% WR</div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontWeight:700,fontSize:13,color:m.profit>=0?"#22C55E":"#EF4444"}}>{m.profit>=0?"+":""}{m.profit.toFixed(0)}$</div>
                                  <div style={{fontSize:10,color:roi>=0?"#22C55E":"#EF4444"}}>{roi>=0?"+":""}{roi.toFixed(1)}%</div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Positions */}
                      {gs.roles.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>Positions</div>
                          {gs.roles.map(r=>{
                            const wr=r.count>0?(r.won/r.count*100):0;
                            const roi=r.staked>0?(r.profit/r.staked*100):0;
                            return(
                              <div key={r.role} className="stat-row">
                                <div>
                                  <div style={{fontWeight:600,fontSize:13,color:"#E5E7EB"}}>{r.role}</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{r.count} paris · {wr.toFixed(0)}% WR</div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontWeight:700,fontSize:13,color:r.profit>=0?"#22C55E":"#EF4444"}}>{r.profit>=0?"+":""}{r.profit.toFixed(0)}$</div>
                                  <div style={{fontSize:10,color:roi>=0?"#22C55E":"#EF4444"}}>{roi>=0?"+":""}{roi.toFixed(1)}%</div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Ligues */}
                      {gs.leagues.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>Ligues</div>
                          {gs.leagues.map(l=>{
                            const wr=l.count>0?(l.won/l.count*100):0;
                            const roi=l.staked>0?(l.profit/l.staked*100):0;
                            return(
                              <div key={l.league} className="stat-row">
                                <div>
                                  <div style={{fontWeight:600,fontSize:13,color:"#E5E7EB"}}>{l.league}</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{l.count} paris · {wr.toFixed(0)}% WR</div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontWeight:700,fontSize:13,color:l.profit>=0?"#22C55E":"#EF4444"}}>{l.profit>=0?"+":""}{l.profit.toFixed(0)}$</div>
                                  <div style={{fontSize:10,color:roi>=0?"#22C55E":"#EF4444"}}>{roi>=0?"+":""}{roi.toFixed(1)}%</div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Tournois */}
                      {gs.tourneys.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>Tournois</div>
                          {gs.tourneys.map(t=>{
                            const wr=t.count>0?(t.won/t.count*100):0;
                            const roi=t.staked>0?(t.profit/t.staked*100):0;
                            return(
                              <div key={t.name} className="stat-row">
                                <div style={{display:"flex",alignItems:"center",gap:7}}>
                                  <span style={{fontSize:12}}>{t.name==="Hors tournoi"?"📅":"🏆"}</span>
                                  <div>
                                    <div style={{fontWeight:600,fontSize:13,color:t.name==="Hors tournoi"?"#9CA3AF":"#E5E7EB"}}>{t.name}</div>
                                    <div style={{fontSize:10,color:"#6B7280"}}>{t.count} paris · {wr.toFixed(0)}% WR</div>
                                  </div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontWeight:700,fontSize:13,color:t.profit>=0?"#22C55E":"#EF4444"}}>{t.profit>=0?"+":""}{t.profit.toFixed(0)}$</div>
                                  <div style={{fontSize:10,color:roi>=0?"#22C55E":"#EF4444"}}>{roi>=0?"+":""}{roi.toFixed(1)}%</div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Kills */}
                      {gs.kills.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>Lignes Kills</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"4px 14px 6px"}}>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textTransform:"uppercase"}}>Ligne</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>N</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>WR%</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"right"}}>Profit</span>
                            <span/>
                          </div>
                          {gs.kills.map((r,i)=>(
                            <div key={r.line} style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"6px 14px",borderTop:"1px solid #1F2937",alignItems:"center"}}>
                              <span style={{fontSize:12,fontWeight:600,color:"#E5E7EB"}}>{r.line}</span>
                              <span style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>{r.count}</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.wr>55?"#22C55E":r.wr<45?"#EF4444":"#9CA3AF",textAlign:"center"}}>{r.wr.toFixed(0)}%</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.profit>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{r.profit>=0?"+":""}{r.profit.toFixed(0)}$</span>
                              <span style={{fontSize:10}}>{r.wr>55?"✅":r.wr<45?"❌":""}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Duels */}
                      {gs.duels&&gs.duels.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#F59E0B",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(245,158,11,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>⚔️ Duels</div>
                          {gs.duels.map((r,i)=>(
                            <div key={r.line} style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"6px 14px",borderTop:"1px solid #1F2937",alignItems:"center"}}>
                              <span style={{fontSize:12,fontWeight:600,color:"#F59E0B"}}>Duels</span>
                              <span style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>{r.count}</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.wr>55?"#22C55E":r.wr<45?"#EF4444":"#9CA3AF",textAlign:"center"}}>{r.wr.toFixed(0)}%</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.profit>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{r.profit>=0?"+":""}{r.profit.toFixed(0)}$</span>
                              <span style={{fontSize:10}}>{r.wr>55?"✅":r.wr<45?"❌":""}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Over / Under */}
                      {(gs.overS||gs.underS)&&(
                        <>
                          <div style={{fontSize:11,color:"#60A5FA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderBottom:"1px solid rgba(96,165,250,0.2)",fontFamily:"'Inter',sans-serif",borderTop:"1px solid #1F2937"}}>📊 Over / Under</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"4px 14px 6px"}}>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textTransform:"uppercase"}}>Type</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>N</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>WR%</span>
                            <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"right"}}>Profit</span>
                            <span/>
                          </div>
                          {[{label:"🔼 Over",s:gs.overS},{label:"🔽 Under",s:gs.underS}].filter(x=>x.s).map(({label,s})=>(
                            <div key={label} style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"6px 14px",borderTop:"1px solid #1F2937",alignItems:"center"}}>
                              <span style={{fontSize:12,fontWeight:600,color:"#60A5FA"}}>{label}</span>
                              <span style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>{s.count}</span>
                              <span style={{fontSize:11,fontWeight:700,color:s.wr>55?"#22C55E":s.wr<45?"#EF4444":"#9CA3AF",textAlign:"center"}}>{s.wr.toFixed(0)}%</span>
                              <span style={{fontSize:11,fontWeight:700,color:s.profit>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{s.profit>=0?"+":""}{s.profit.toFixed(0)}$</span>
                              <span style={{fontSize:10}}>{s.wr>55?"✅":s.wr<45?"❌":""}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Headshots */}
                      {gs.hs.length>0&&(
                        <>
                          <div style={{fontSize:11,color:"#818CF8",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderTop:"1px solid #1F2937",borderBottom:"1px solid rgba(129,140,248,0.2)",fontFamily:"'Inter',sans-serif"}}>💀 Headshots</div>
                          {gs.hs.map((r,i)=>(
                            <div key={r.line} style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 64px 16px",gap:2,padding:"6px 14px",borderTop:"1px solid #1F2937",alignItems:"center"}}>
                              <span style={{fontSize:12,fontWeight:600,color:"#818CF8"}}>{r.line}</span>
                              <span style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>{r.count}</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.wr>55?"#22C55E":r.wr<45?"#EF4444":"#9CA3AF",textAlign:"center"}}>{r.wr.toFixed(0)}%</span>
                              <span style={{fontSize:11,fontWeight:700,color:r.profit>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{r.profit>=0?"+":""}{r.profit.toFixed(0)}$</span>
                              <span style={{fontSize:10}}>{r.wr>55?"✅":r.wr<45?"❌":""}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Live & HS globaux */}
                      {(gs.liveS||gs.hsS)&&(
                        <>
                          <div style={{fontSize:11,color:"#A78BFA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"14px 14px 6px",borderTop:"1px solid #1F2937",borderBottom:"1px solid rgba(124,58,237,0.2)",fontFamily:"'Inter',sans-serif"}}>Live & Headshot</div>
                          {gs.liveS&&(
                            <div className="stat-row">
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <span style={{fontSize:14}}>🔴</span>
                                <div>
                                  <div style={{fontWeight:700,fontSize:13,color:"#FF4757"}}>Paris Live</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{gs.liveS.count} paris · {gs.liveS.wr.toFixed(0)}% WR</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontWeight:700,fontSize:13,color:gs.liveS.profit>=0?"#22C55E":"#EF4444"}}>{gs.liveS.profit>=0?"+":""}{gs.liveS.profit.toFixed(0)}$</div>
                                <div style={{fontSize:10,color:gs.liveS.roi>=0?"#22C55E":"#EF4444"}}>{gs.liveS.roi>=0?"+":""}{gs.liveS.roi.toFixed(1)}% ROI</div>
                              </div>
                            </div>
                          )}
                          {gs.hsS&&(
                            <div className="stat-row">
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <span style={{fontSize:14}}>💀</span>
                                <div>
                                  <div style={{fontWeight:700,fontSize:13,color:"#818CF8"}}>Paris HS</div>
                                  <div style={{fontSize:10,color:"#6B7280"}}>{gs.hsS.count} paris · {gs.hsS.wr.toFixed(0)}% WR</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontWeight:700,fontSize:13,color:gs.hsS.profit>=0?"#22C55E":"#EF4444"}}>{gs.hsS.profit>=0?"+":""}{gs.hsS.profit.toFixed(0)}$</div>
                                <div style={{fontSize:10,color:gs.hsS.roi>=0?"#22C55E":"#EF4444"}}>{gs.hsS.roi>=0?"+":""}{gs.hsS.roi.toFixed(1)}% ROI</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  )}
                </div>
              );
            })}

            {/* ── COTES PAR TRANCHES ── */}
            {oddsRangeStats.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:800,color:"#E5E7EB",letterSpacing:.5,marginBottom:8,paddingBottom:6,borderBottom:"2px solid rgba(124,58,237,0.4)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15}}>📊</span> Cotes par tranches
                </div>
                <div className="stat-bloc">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 60px 52px",gap:2,padding:"4px 14px 6px"}}>
                    <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textTransform:"uppercase"}}>Cote</span>
                    <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>N</span>
                    <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"center"}}>WR%</span>
                    <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"right"}}>Profit</span>
                    <span style={{fontSize:9,color:"#4B5563",fontWeight:700,textAlign:"right"}}>ROI</span>
                  </div>
                  {oddsRangeStats.map(r=>(
                    <div key={r.label} style={{display:"grid",gridTemplateColumns:"1fr 40px 48px 60px 52px",gap:2,padding:"6px 14px",borderTop:"1px solid #1F2937",alignItems:"center"}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#E5E7EB"}}>{r.label}</span>
                      <span style={{fontSize:11,color:"#9CA3AF",textAlign:"center"}}>{r.count}</span>
                      <span style={{fontSize:11,fontWeight:700,color:r.wr>55?"#22C55E":r.wr<45?"#EF4444":"#9CA3AF",textAlign:"center"}}>{r.wr.toFixed(0)}%</span>
                      <span style={{fontSize:11,fontWeight:700,color:r.profit>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{r.profit>=0?"+":""}{r.profit.toFixed(0)}$</span>
                      <span style={{fontSize:11,color:r.roi>=0?"#22C55E":"#EF4444",textAlign:"right"}}>{r.roi>=0?"+":""}{r.roi.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BOOKMAKERS (global tous jeux) ── */}
            {bkStatsSorted.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:800,color:"#E5E7EB",letterSpacing:.5,marginBottom:8,paddingBottom:6,borderBottom:"2px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15}}>💰</span> Bookmakers
                </div>
                <div className="stat-bloc">
                  {bkStatsSorted.map(([bk,s])=>{
                    const wr=s.count>0?(s.won/s.count*100).toFixed(0):0;
                    const bkROI=s.staked>0?((s.profit/s.staked)*100):0;
                    const avgOdds=s.count>0?(s.oddsSum/s.count).toFixed(2):0;
                    const logo=BK_LOGOS[bk]||bkPhotos[bk];
                    return(
                      <div key={bk} className="stat-row">
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          {logo&&<img src={logo} alt={bk} style={{width:24,height:24,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:"#E5E7EB"}}>{bk}</div>
                            <div style={{fontSize:10,color:"#6B7280"}}>{s.count} paris · {wr}% WR · @{avgOdds}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:700,fontSize:14,color:s.profit>=0?"#22C55E":"#EF4444"}}>{s.profit>=0?"+":""}{s.profit.toFixed(0)}$</div>
                          <div style={{fontSize:10,color:bkROI>=0?"#22C55E":"#EF4444"}}>{bkROI>=0?"+":""}{bkROI.toFixed(1)}% ROI</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── JOUEURS ── */}
        {view==="analyse"&&(()=>{
  const sports=[...new Set(analyseBets.map(b=>b.sport||"?"))].filter(Boolean);
  const sources=[...new Set(analyseBets.map(b=>b.source||"?"))].filter(Boolean);
  const filtered=analyseBets.filter(b=>{
    if(analyseFSport!=="all"&&b.sport!==analyseFSport)return false;
    if(analyseFSource!=="all"&&b.source!==analyseFSource)return false;
    if(analyseFDir!=="All"&&b.direction!==analyseFDir)return false;
    return true;
  });
  const topDiff=filtered.length>0?Math.max(...filtered.map(b=>b.diff||0)):0;
  const avgOdds=filtered.length>0?(filtered.reduce((s,b)=>s+(b.odds||0),0)/filtered.length).toFixed(2):0;
  const sportColor=(sport)=>{
    if(sport?.includes("CS")||sport==="CS2")return"#F0A500";
    if(sport?.includes("Legend")||sport==="LoL")return"#C89B3C";
    if(sport?.includes("Dota"))return"#C23C2A";
    if(sport?.includes("Valor"))return"#FF4655";
    return"#9CA3AF";
  };
  return(
    <div className="view-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#E5E7EB",letterSpacing:.3}}>🔍 Analyse</div>
          <div style={{fontSize:10,color:"#6B7280",marginTop:2}}>
            {analyseLastFetch?"Mis à jour: "+analyseLastFetch.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}):"Pas encore chargé"}
          </div>
        </div>
        <button onClick={fetchAnalyse}
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
          {analyseLoading?"⏳ Chargement...":"↻ Actualiser"}
        </button>
      </div>
      {filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
          {[{label:"Bets",val:filtered.length,col:"#A78BFA"},{label:"Max Diff",val:topDiff.toFixed(2),col:"#F59E0B"},{label:"Cote moy",val:"@"+avgOdds,col:"#22C55E"}].map(k=>(
            <div key={k.label} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:12,padding:"11px 12px"}}>
              <div style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:17,fontWeight:700,color:k.col}}>{k.val}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        <select value={analyseFSport} onChange={e=>setAnalyseFSport(e.target.value)}
          style={{background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:"6px 10px",color:"#E5E7EB",fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none",cursor:"pointer"}}>
          <option value="all">Tous les sports</option>
          {sports.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={analyseFSource} onChange={e=>setAnalyseFSource(e.target.value)}
          style={{background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:"6px 10px",color:"#E5E7EB",fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none",cursor:"pointer"}}>
          <option value="all">Toutes sources</option>
          {sources.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {["All","OVER","UNDER"].map(d=>(
          <button key={d} onClick={()=>setAnalyseFDir(d)}
            style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid "+(analyseFDir===d?"#7C3AED":"#1F2937"),background:analyseFDir===d?"rgba(124,58,237,0.12)":"transparent",color:analyseFDir===d?"#A78BFA":"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
            {d==="All"?"Tous":d}
          </button>
        ))}
      </div>
      {!analyseLoading&&analyseBets.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"#4B5563"}}>
          <div style={{fontSize:32,marginBottom:12}}>🔍</div>
          <div style={{fontSize:14,fontWeight:600,color:"#6B7280",marginBottom:6}}>Aucun bet comparé</div>
          <div style={{fontSize:12,color:"#4B5563",marginBottom:16}}>Lance le pipeline pour analyser les props</div>
          <button onClick={fetchAnalyse} style={{padding:"10px 20px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
            Charger les données
          </button>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((b,i)=>{
          const isOver=b.direction==="OVER";
          const sc=sportColor(b.sport);
          return(
            <div key={i} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:14,padding:"13px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#E5E7EB",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.match||"?"}</div>
                  <div style={{fontSize:10,color:"#6B7280"}}>{b.tournament||""}</div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
                  <span style={{fontSize:9,fontWeight:700,color:sc,background:sc+"22",border:"1px solid "+sc+"44",padding:"2px 6px",borderRadius:5}}>
                    {b.sport?.includes("Legend")?"LoL":b.sport?.includes("CS")?"CS2":b.sport?.includes("Dota")?"Dota":b.sport?.includes("Valor")?"VAL":b.sport||"?"}
                  </span>
                  <span style={{fontSize:9,fontWeight:700,color:"#60A5FA",background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",padding:"2px 6px",borderRadius:5}}>{b.source?.slice(0,2)||"?"}</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:15,fontWeight:700,color:"#E5E7EB",textTransform:"capitalize"}}>{b.player||"?"}</span>
                <span style={{fontSize:10,color:"#9CA3AF"}}>·</span>
                <span style={{fontSize:11,color:"#A78BFA",fontWeight:600,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",padding:"2px 7px",borderRadius:5}}>{b.stat||"kills"}</span>
                <span style={{fontSize:10,color:"#F59E0B",fontWeight:600,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",padding:"2px 6px",borderRadius:5}}>M{b.map||"?"}</span>
                <span style={{fontSize:10,fontWeight:700,color:isOver?"#22C55E":"#F87171",background:isOver?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:"1px solid "+(isOver?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"),padding:"2px 7px",borderRadius:5}}>
                  {isOver?"▲ OVER":"▼ UNDER"}
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:6}}>
                {[{label:"Book",val:b.book_line,col:"#E5E7EB"},{label:"PP",val:b.pp_line_original,col:"#E5E7EB"},{label:"PP/2",val:b.pp_line_per_map,col:"#E5E7EB"},{label:"Diff",val:"+"+parseFloat(b.diff||0).toFixed(2),col:"#F59E0B"},{label:"Cote",val:"@"+(b.odds||0),col:"#A78BFA"}].map(({label,val,col})=>(
                  <div key={label} style={{background:"#0B1220",borderRadius:8,padding:"7px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#6B7280",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:14,fontWeight:700,color:col}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length>0&&(
        <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"#4B5563"}}>
          {filtered.length} bet{filtered.length>1?"s":""} · {analyseLastFetch?analyseLastFetch.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}):"?"}
        </div>
      )}
    </div>
  );
})()}
        {view==="players"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#E5E7EB",letterSpacing:.3}}>Gestion</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{Object.keys(allPlayers).length} joueurs · {customCount} modifiés</div>
              </div>
              <button onClick={()=>{setPform({name:"",game:"LoL",league:"",role:"",team:""});setModalPlayer(true);}}
                style={{background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:12,padding:"9px 16px",color:"#fff",fontWeight:700,fontSize:13,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 14px rgba(124,58,237,0.35)"}}>
                + Ajouter
              </button>
            </div>

            {/* ── TOURNOIS ACTIFS ── */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontWeight:600}}>Tournois actifs</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {["CS2","Dota2","LoL","Valorant"].map(game=>{
                  const t=activeTourneys[game];
                  const cfg=GAME_CFG[game]||{};
                  const isExpired=t&&t.end&&new Date(t.end)<new Date();
                  const saved=savedTourneys[game]||[];
                  return(
                    <div key={game} style={{background:"#111827",border:"1px solid "+(t&&!isExpired?"rgba(124,58,237,0.35)":"#1F2937"),borderRadius:12,padding:"10px 14px",transition:"border-color .2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:t&&!isExpired?8:0}}>
                        <GameLogo game={game} size={16}/>
                        <span style={{fontSize:12,fontWeight:700,color:cfg.accent||"#A78BFA",minWidth:60}}>{game}</span>
                        {/* Dropdown select */}
                        <select
                          value={t&&!isExpired?t.name:""}
                          onChange={e=>{
                            const name=e.target.value;
                            if(!name){setActiveTourneys(prev=>{const n={...prev};delete n[game];return n;});}
                            else{setActiveTourneys(prev=>({...prev,[game]:{name,end:""}}));}
                          }}
                          style={{flex:1,background:"#0B1220",border:"1px solid #374151",borderRadius:8,padding:"6px 10px",color:t&&!isExpired?"#E5E7EB":"#6B7280",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:600,outline:"none",cursor:"pointer"}}>
                          <option value="" style={{background:"#111827",color:"#6B7280"}}>Aucun tournoi actif</option>
                          {saved.map(s=><option key={s} value={s} style={{background:"#111827",color:"#E5E7EB"}}>{s}</option>)}
                        </select>
                        {/* Bouton ajouter un tournoi à la liste */}
                        <button onClick={()=>setModalTourney(game)}
                          style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:8,padding:"5px 10px",color:"#A78BFA",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:600,flexShrink:0,transition:"all .2s ease"}}>
                          + Ajouter
                        </button>
                      </div>
                      {t&&!isExpired&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:6,borderTop:"1px solid rgba(124,58,237,0.15)"}}>
                          <span style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 5px rgba(34,197,94,0.6)",flexShrink:0}}/>
                          <span style={{fontSize:11,fontWeight:700,color:"#22C55E"}}>ACTIF</span>
                          <span style={{fontSize:11,color:"#A78BFA",flex:1}}>🏆 {t.name}</span>
                          {t.end&&<span style={{fontSize:10,color:"#6B7280"}}>fin {new Date(t.end).toLocaleDateString("fr-CA",{day:"numeric",month:"short"})}</span>}
                          <button onClick={()=>setActiveTourneys(prev=>{const n={...prev};delete n[game];return n;})}
                            style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"2px 8px",color:"#EF4444",cursor:"pointer",fontSize:10,fontFamily:"'Inter',sans-serif"}}>
                            Retirer
                          </button>
                        </div>
                      )}
                      {isExpired&&(
                        <div style={{paddingTop:6,borderTop:"1px solid #1F2937",fontSize:10,color:"#EF4444",fontWeight:600}}>EXPIRÉ — sélectionne un autre tournoi</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <PlayerSearchPanel allPlayers={allPlayers} custom={custom} setCustom={setCustom} setEditingPlayer={setEditingPlayer}/>
            {customCount>0&&(
              <>
                <div style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontWeight:600}}>Mes modifications</div>
                <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:14,overflow:"hidden",marginBottom:14}}>
                  {customEntries.map(([key,p])=>(
                    <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:"1px solid #1F2937"}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <GameLogo game={p.game} size={18}/>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:"#E5E7EB",textTransform:"capitalize"}}>{key}</div>
                          <div style={{fontSize:10,color:"#9CA3AF"}}>{p.team} · {p.role}{p.league?" · "+p.league:""}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setEditingPlayer({key,data:{...p,name:key}})}
                          style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:8,padding:"5px 10px",color:"#3B82F6",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                          ✎ Éd.
                        </button>
                        <button onClick={()=>setCustom(c=>{const n={...c};delete n[key];return n;})}
                          style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"5px 10px",color:"#EF4444",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif"}}>
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{fontSize:11,color:"#6B7280",textAlign:"center",padding:12}}>
              Recherche un joueur pour l'éditer (équipe, rôle, ligue)
            </div>

            {/* ── CORBEILLE ── */}
            <div style={{marginTop:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15}}>🗑️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#E5E7EB"}}>Corbeille</div>
                    <div style={{fontSize:10,color:"#6B7280"}}>{deletedBets.length} paris supprimés récemment</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {deletedBets.length>0&&(
                    <button onClick={()=>setDeletedBets([])}
                      style={{fontSize:11,color:"#EF4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                      Vider
                    </button>
                  )}
                  <button onClick={()=>setShowCorbeille(v=>!v)}
                    style={{fontSize:11,color:showCorbeille?"#A78BFA":"#9CA3AF",background:showCorbeille?"rgba(124,58,237,0.1)":"transparent",border:"1px solid "+(showCorbeille?"#7C3AED":"#1F2937"),borderRadius:7,padding:"5px 10px",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                    {showCorbeille?"▲ Masquer":"▼ Voir"}
                  </button>
                </div>
              </div>
              {showCorbeille&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {deletedBets.length===0&&(
                    <div style={{textAlign:"center",color:"#4B5563",fontSize:12,padding:"16px 0"}}>Aucun pari supprimé récemment</div>
                  )}
                  {deletedBets.map((b,i)=>(
                    <div key={b.id+"_"+i} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:10,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <GameLogo game={b.game} size={13}/>
                          <span style={{fontSize:13,fontWeight:700,color:"#9CA3AF",textTransform:"capitalize"}}>{b.player}</span>
                          <span style={{fontSize:11,color:"#6B7280"}}>— {b.description}</span>
                        </div>
                        <div style={{fontSize:10,color:"#4B5563",marginTop:2}}>@{b.odds} · {b.stake}$ · {b.bookmaker||"—"}</div>
                        <div style={{fontSize:9,color:"#374151",marginTop:1}}>Supprimé {b.deletedAt?new Date(b.deletedAt).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}):""}</div>
                      </div>
                      <button onClick={()=>{
                        const restored={...b};delete restored.deletedAt;
                        setBets(prev=>[restored,...prev]);
                        setDeletedBets(prev=>prev.filter((_,idx)=>idx!==i));
                        showToast("Pari restauré ✓");
                      }} style={{padding:"6px 12px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:7,color:"#22C55E",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}>
                        ↩ Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL AJOUTER TOURNOI ── */}
        {modalTourney&&(()=>{
          const game=modalTourney;
          const cfg=GAME_CFG[game]||{};
          return(
            <div className="moverlay" onClick={()=>setModalTourney(false)}>
              <div className="modal" onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <GameLogo game={game} size={20}/>
                  <div style={{fontSize:15,fontWeight:700}}>Ajouter un tournoi — {game}</div>
                </div>
                <div style={{fontSize:11,color:"#6B7280",marginBottom:16}}>Le tournoi sera disponible dans le menu déroulant. Tu pourras l'activer quand tu veux.</div>

                {/* Champ nom */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Nom du tournoi</div>
                  <input id={"tourney-name-"+game} className="ifield" placeholder="ex: PGL Astana 2026" style={{marginBottom:0}}/>
                </div>

                {/* Date de fin optionnelle */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Date de fin (optionnel)</div>
                  <input id={"tourney-end-"+game} className="ifield" type="date" style={{marginBottom:0}}/>
                  <div style={{fontSize:10,color:"#6B7280",marginTop:4}}>Si définie, le tournoi se retire automatiquement après cette date</div>
                </div>

                {/* Liste des tournois existants pour ce jeu */}
                {(savedTourneys[game]||[]).length>0&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Tournois enregistrés</div>
                    <div style={{background:"#0B1220",borderRadius:10,overflow:"hidden",border:"1px solid #1F2937"}}>
                      {(savedTourneys[game]||[]).map((s,i)=>(
                        <div key={s} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderBottom:i<(savedTourneys[game]||[]).length-1?"1px solid #1F2937":"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {activeTourneys[game]?.name===s&&<span style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 5px rgba(34,197,94,0.5)"}}/>}
                            <span style={{fontSize:12,color:activeTourneys[game]?.name===s?"#22C55E":"#E5E7EB",fontWeight:activeTourneys[game]?.name===s?700:400}}>{s}</span>
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>{
                              setActiveTourneys(prev=>({...prev,[game]:{name:s,end:""}}));
                              setModalTourney(false);showToast("🏆 "+s+" activé");
                            }} style={{padding:"3px 9px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:6,color:"#22C55E",cursor:"pointer",fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                              Activer
                            </button>
                            <button onClick={()=>setSavedTourneys(prev=>({...prev,[game]:(prev[game]||[]).filter(x=>x!==s)}))}
                              style={{padding:"3px 8px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,color:"#EF4444",cursor:"pointer",fontSize:10,fontFamily:"'Inter',sans-serif"}}>
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>setModalTourney(false)}
                    style={{padding:"11px",background:"#1F2937",border:"none",borderRadius:10,color:"#9CA3AF",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    Fermer
                  </button>
                  <button onClick={()=>{
                    const name=document.getElementById("tourney-name-"+game).value.trim();
                    const end=document.getElementById("tourney-end-"+game).value;
                    if(!name)return;
                    // Ajouter à la liste sauvegardée si pas déjà présent
                    setSavedTourneys(prev=>{
                      const list=prev[game]||[];
                      if(list.includes(name))return prev;
                      return{...prev,[game]:[...list,name]};
                    });
                    // Activer directement
                    setActiveTourneys(prev=>({...prev,[game]:{name,end}}));
                    setModalTourney(false);
                    showToast("🏆 "+name+" ajouté & activé");
                  }} style={{padding:"11px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}>
                    Ajouter & activer
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── BOTTOM NAV ── */}
        {(()=>{
          const pendingCount=bets.filter(b=>b.status==="pending").length;
          return(
            <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0D1526",borderTop:"1px solid #1F2937",display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:50,backdropFilter:"blur(12px)"}}>
              {NAV.map(n=>(
                <button key={n.id} className={"navitem "+(view===n.id?"on":"")} onClick={()=>setView(n.id)} style={{position:"relative"}}>
                  <span style={{fontSize:18,filter:view===n.id?"drop-shadow(0 0 6px rgba(167,139,250,0.6))":"none"}}>{n.icon}</span>
                  {n.id==="mesparis"&&pendingCount>0&&(
                    <span style={{position:"absolute",top:2,right:8,background:"#3B82F6",color:"#fff",borderRadius:8,fontSize:9,fontWeight:800,padding:"1px 5px",minWidth:16,textAlign:"center",lineHeight:"14px",border:"1.5px solid #0D1526"}}>
                      {pendingCount}
                    </span>
                  )}
                  <span className="lbl">{n.label}</span>
                </button>
              ))}
            </div>
          );
        })()}

        {/* ── CALENDRIER MODAL ── */}
        {showCal&&(
          <div className="moverlay" onClick={()=>{setShowCal(false);setCalSelected(null);}}>
            <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <button onClick={()=>{let m=calMonth-1,y=calYear;if(m<0){m=11;y--;}setCalMonth(m);setCalYear(y);setCalSelected(null);}} style={{background:"none",border:"1px solid #1F2937",borderRadius:7,padding:"6px 12px",color:"#94A3B8",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700}}>Prev</button>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700}}>{FR_MONTHS[calMonth]} {calYear}</div>
                  <div style={{fontSize:11,color:monthProfit>=0?"#22C55E":"#F87171",fontWeight:600}}>{monthProfit>=0?"+":""}{monthProfit.toFixed(2)}$</div>
                </div>
                <button onClick={()=>{let m=calMonth+1,y=calYear;if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);setCalSelected(null);}} style={{background:"none",border:"1px solid #1F2937",borderRadius:7,padding:"6px 12px",color:"#94A3B8",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700}}>Suiv</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
                {FR_DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:"#9CA3AF",fontWeight:600,padding:"3px 0",textTransform:"uppercase"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:14}}>
                {(()=>{
                  const firstDay=new Date(calYear,calMonth,1).getDay();
                  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
                  const cells=[];
                  for(let i=0;i<firstDay;i++)cells.push(<div key={"e"+i}/>);
                  for(let d=1;d<=daysInMonth;d++){
                    const dk=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
                    const profit=dailyProfit[dk];
                    const pending=dailyPending[dk];
                    const isToday=dk===todayKey;
                    const isSel=calSelected===dk;
                    const hasSettled=profit!==undefined;
                    cells.push(
                      <div key={dk} className={"cal-cell"+(isToday?" today":"")+(isSel?" selected":"")} onClick={()=>setCalSelected(isSel?null:dk)}>
                        <div style={{fontSize:16,fontWeight:isToday?800:600,color:isToday?"#22C55E":(hasSettled||pending)?"#E5E7EB":"#6B7280"}}>{d}</div>
                        {hasSettled&&<div style={{fontSize:9,fontWeight:700,color:profit>=0?"#22C55E":"#F87171",lineHeight:1,marginTop:1}}>{profit>=0?"+":""}{profit>=1000?(profit/1000).toFixed(1)+"k":profit.toFixed(0)}$</div>}
                        {pending>0&&!hasSettled&&<div style={{width:4,height:4,borderRadius:"50%",background:"#3B82F6",marginTop:1}}/>}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
              {calSelected&&(()=>{
                const selectedDayBets=byDay[calSelected]||[];
                const dp=dailyProfit[calSelected];
                return(
                  <div>
                    <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>
                      {calSelected.split("-").reverse().join("/")} - {selectedDayBets.length} pari{selectedDayBets.length!==1?"s":""}
                      {dp!==undefined&&<span style={{marginLeft:8,fontWeight:700,color:dp>=0?"#22C55E":"#F87171"}}>{dp>=0?"+":""}{dp.toFixed(2)}$</span>}
                    </div>
                    <div className="stat-bloc">
                      {selectedDayBets.map(b=>(
                        <div key={b.id} style={{padding:"10px 12px",borderBottom:"1px solid #1F2937",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <GameLogo game={b.game} size={16}/>
                            <div>
                              <div style={{fontWeight:600,fontSize:13,textTransform:"capitalize"}}>{b.player}</div>
                              <div style={{fontSize:10,color:"#9CA3AF"}}>{b.description}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700,fontSize:13,color:b.status==="won"?"#22C55E":b.status==="lost"?"#F87171":"#3B82F6"}}>
                              {b.status==="pending"?"@"+b.odds:(b.profit>=0?"+":"")+b.profit.toFixed(2)+"$"}
                            </div>
                            <div style={{fontSize:10,color:STATUS_CFG[b.status]?STATUS_CFG[b.status].color:"#9CA3AF"}}>{STATUS_CFG[b.status]?STATUS_CFG[b.status].label:b.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <button onClick={()=>{setShowCal(false);setCalSelected(null);}} style={{width:"100%",marginTop:14,padding:"12px",background:"#1F2937",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>Fermer</button>
            </div>
          </div>
        )}

        {/* ── BULK MODAL ── */}
        {bulkModal&&(
          <div className="moverlay" onClick={()=>{setBulkModal(false);setBulkDatetime("");}}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Modifier {selectedIds.length} paris</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>Statut</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  {["won","lost","pending"].map(s=>(
                    <button key={s} onClick={()=>applyBulkStatus(s)}
                      style={{padding:"11px 8px",borderRadius:9,border:"1.5px solid "+(STATUS_CFG[s]?STATUS_CFG[s].color+"44":"#1F2937"),background:STATUS_CFG[s]?STATUS_CFG[s].bg:"#111827",color:STATUS_CFG[s]?STATUS_CFG[s].color:"#E5E7EB",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                      {STATUS_CFG[s]?STATUS_CFG[s].label:s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>Bookmaker</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
                  {bookmakers.map(bk=>(
                    <button key={bk} className={"bkchip"+(bulkBK===bk?" on":"")} onClick={()=>setBulkBK(bk===bulkBK?"":bk)}
                      style={{border:"2px solid "+(bulkBK===bk?"#22C55E":"#1F2937")}}>
                      {bk}
                    </button>
                  ))}
                </div>
                <button onClick={applyBulkBK} disabled={!bulkBK}
                  style={{width:"100%",padding:"11px",background:bulkBK?"linear-gradient(135deg,#22C55E,#0EA5E9)":"#1F2937",border:"none",borderRadius:9,color:bulkBK?"#0B1220":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  {bulkBK?"Appliquer "+bulkBK+" à "+selectedIds.length+" paris":"Sélectionner un bookmaker"}
                </button>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>Date & heure</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
                  <input type="date" className="ifield" value={bulkDatetime?bulkDatetime.split("T")[0]:""} onChange={e=>{const d=e.target.value;const t=bulkDatetime?bulkDatetime.split("T")[1]||"12:00":"12:00";setBulkDatetime(d+"T"+t);}} style={{height:40}}/>
                  <input type="time" className="ifield" value={bulkDatetime?bulkDatetime.split("T")[1]||"":"12:00"} onChange={e=>{const t=e.target.value;const d=bulkDatetime?bulkDatetime.split("T")[0]:nowDT().split("T")[0];setBulkDatetime(d+"T"+t);}} style={{height:40}}/>
                </div>
                <button onClick={applyBulkDatetime} disabled={!bulkDatetime}
                  style={{width:"100%",padding:"11px",background:bulkDatetime?"linear-gradient(135deg,#7C3AED,#0EA5E9)":"#1F2937",border:"none",borderRadius:9,color:bulkDatetime?"#fff":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  {bulkDatetime?"Appliquer la date à "+selectedIds.length+" paris":"Choisir une date"}
                </button>
              </div>
              {/* Tournoi — menu déroulant */}
              {(()=>{
                const allT=[...new Set(Object.values(savedTourneys).flat())].filter(Boolean);
                if(allT.length===0)return null;
                return(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>Tournoi</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#0B1220",border:"1px solid #374151",borderRadius:10,padding:"4px 4px 4px 12px",marginBottom:8}}>
                      <span style={{fontSize:14,flexShrink:0}}>{bulkTourney&&bulkTourney!=="Hors tournoi"?"🏆":bulkTourney==="Hors tournoi"?"📅":"🏆"}</span>
                      <select value={bulkTourney} onChange={e=>setBulkTourney(e.target.value)}
                        style={{flex:1,background:"transparent",border:"none",color:bulkTourney?"#E5E7EB":"#6B7280",fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:bulkTourney?600:400,outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer",padding:"8px 0"}}>
                        <option value="" style={{background:"#111827",color:"#6B7280"}}>Choisir un tournoi…</option>
                        {allT.map(t=><option key={t} value={t} style={{background:"#111827",color:"#E5E7EB"}}>🏆 {t}</option>)}
                        <option value="Hors tournoi" style={{background:"#111827",color:"#9CA3AF"}}>📅 Hors tournoi</option>
                      </select>
                      <span style={{color:"#6B7280",fontSize:16,paddingRight:10,flexShrink:0}}>⌄</span>
                    </div>
                    <button onClick={()=>bulkTourney&&applyBulkTourney(bulkTourney)} disabled={!bulkTourney}
                      style={{width:"100%",padding:"11px",background:bulkTourney?"linear-gradient(135deg,#7C3AED,#3B82F6)":"#1F2937",border:"none",borderRadius:9,color:bulkTourney?"#fff":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                      {bulkTourney?"Appliquer "+bulkTourney+" à "+selectedIds.length+" paris":"Sélectionner un tournoi"}
                    </button>
                  </div>
                );
              })()}

              {/* Map bulk */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>Map</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                  {["Map 1","Map 2","Map 3","Map 4"].map(m=>(
                    <button key={m} onClick={()=>setBulkMap(v=>v===m?"":m)}
                      style={{padding:"7px 14px",borderRadius:20,border:"1.5px solid "+(bulkMap===m?"#7C3AED":"#1F2937"),background:bulkMap===m?"rgba(124,58,237,0.1)":"transparent",color:bulkMap===m?"#A78BFA":"#6B7280",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={applyBulkMap} disabled={!bulkMap}
                  style={{width:"100%",padding:"11px",background:bulkMap?"linear-gradient(135deg,#7C3AED,#3B82F6)":"#1F2937",border:"none",borderRadius:9,color:bulkMap?"#fff":"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  {bulkMap?"Appliquer "+bulkMap+" à "+selectedIds.length+" paris":"Sélectionner une map"}
                </button>
              </div>

              <button onClick={()=>{setBulkModal(false);setBulkDatetime("");}} style={{width:"100%",padding:"11px",background:"#1F2937",border:"none",borderRadius:9,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>Annuler</button>
            </div>
          </div>
        )}

        {/* ── EDIT BET MODAL ── */}
        {editingBet&&(
          <EditBetModal
            bet={editingBet}
            bookmakers={bookmakers}
            calcProfit={calcProfit}
            allPlayers={allPlayers}
            onClose={()=>setEditingBet(null)}
            onSave={(updated)=>{
              setBets(b=>b.map(bet=>bet.id===updated.id?updated:bet));
              setEditingBet(null);
              showToast("Pari modifié ✓");
            }}
          />
        )}

                {/* ── MODAL ADD BOOKMAKER ── */}
        {modalBK&&(
          <div className="moverlay" onClick={()=>{setModalBK(false);setNewBK("");setNewBKPhoto("");}}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Nouveau bookmaker</div>
              <input className="ifield" placeholder="Nom du bookmaker..." value={newBK} onChange={e=>setNewBK(e.target.value)} style={{marginBottom:10}}/>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:"#9CA3AF",marginBottom:7}}>Logo (optionnel)</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {newBKPhoto&&<img src={newBKPhoto} alt="preview" style={{width:40,height:40,borderRadius:8,objectFit:"cover",border:"1px solid #1F2937"}}/>}
                  <label style={{flex:1,padding:"10px",background:"#111827",border:"1px dashed #1F2937",borderRadius:8,color:"#9CA3AF",cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textAlign:"center"}}>
                    {newBKPhoto?"Changer la photo":"📷 Ajouter un logo"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const f=e.target.files[0];
                      if(!f)return;
                      const r=new FileReader();
                      r.onload=ev=>setNewBKPhoto(ev.target.result);
                      r.readAsDataURL(f);
                    }}/>
                  </label>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>{setModalBK(false);setNewBK("");setNewBKPhoto("");}} style={{padding:"12px",background:"#1F2937",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Annuler</button>
                <button onClick={saveBookmaker} disabled={!newBK.trim()} style={{padding:"12px",background:newBK.trim()?"linear-gradient(135deg,#22C55E,#0EA5E9)":"#1F2937",border:"none",borderRadius:10,color:newBK.trim()?"#0B1220":"#9CA3AF",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL ADD PLAYER ── */}
        {modalPlayer&&(
          <div className="moverlay" onClick={()=>setModalPlayer(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Ajouter un joueur</div>
              <input className="ifield" placeholder="Pseudo (ex: faker)" value={pform.name} onChange={e=>setPform(p=>({...p,name:e.target.value}))} style={{marginBottom:8}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <select className="ifield" value={pform.game} onChange={e=>setPform(p=>({...p,game:e.target.value,role:""}))}>
                  {ALL_GAMES.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <input className="ifield" placeholder="Ligue (opt.)" value={pform.league} onChange={e=>setPform(p=>({...p,league:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                <select className="ifield" value={pform.role} onChange={e=>setPform(p=>({...p,role:e.target.value}))}>
                  <option value="">Rôle...</option>
                  {(pform.game==="LoL"
                    ?["Top Laner","Jungler","Mid Laner","Bot Laner","Support"]
                    :pform.game==="CS2"
                    ?["Rifler","AWPer","IGL","Entry Fragger","Support"]
                    :pform.game==="Dota2"
                    ?["Carry","Mid","Offlane","Soft Support","Hard Support"]
                    :["Duelist","Initiator","Controller","Sentinel","IGL"]
                  ).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
                <input className="ifield" placeholder="Equipe *" value={pform.team} onChange={e=>setPform(p=>({...p,team:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setModalPlayer(false)} style={{padding:"12px",background:"#1F2937",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Annuler</button>
                <button onClick={savePlayer} disabled={!pform.name||!pform.team} style={{padding:"12px",background:pform.name&&pform.team?"linear-gradient(135deg,#22C55E,#0EA5E9)":"#1F2937",border:"none",borderRadius:10,color:pform.name&&pform.team?"#0B1220":"#9CA3AF",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL EDIT PLAYER ── */}
        {editingPlayer&&(
          <div className="moverlay" onClick={()=>setEditingPlayer(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Modifier le joueur</div>
              <div style={{fontSize:11,color:"#6B7280",marginBottom:12,fontWeight:500}}>
                Pseudo d'origine : <span style={{color:"#A78BFA",textTransform:"capitalize"}}>{editingPlayer.key}</span>
              </div>

              {/* Champ nom/pseudo */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Pseudo</div>
                <input className="ifield" placeholder="Pseudo du joueur..." value={editingPlayer.data.displayName||editingPlayer.key}
                  onChange={e=>setEditingPlayer(ep=>({...ep,data:{...ep.data,displayName:e.target.value.toLowerCase().trim()}}))}/>
                <div style={{fontSize:10,color:"#6B7280",marginTop:4}}>Renomme le joueur (ex: corriger une faute de frappe)</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <select className="ifield" value={editingPlayer.data.game}
                  onChange={e=>setEditingPlayer(ep=>({...ep,data:{...ep.data,game:e.target.value,role:""}}))}>{ALL_GAMES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                <input className="ifield" placeholder="Ligue (opt.)" value={editingPlayer.data.league||""}
                  onChange={e=>setEditingPlayer(ep=>({...ep,data:{...ep.data,league:e.target.value}}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                <select className="ifield" value={editingPlayer.data.role||""}
                  onChange={e=>setEditingPlayer(ep=>({...ep,data:{...ep.data,role:e.target.value}}))}>
                  <option value="">Rôle...</option>
                  {(editingPlayer.data.game==="LoL"
                    ?["Top Laner","Jungler","Mid Laner","Bot Laner","Support"]
                    :editingPlayer.data.game==="CS2"
                    ?["Rifler","AWPer","IGL","Entry Fragger","Support"]
                    :editingPlayer.data.game==="Dota2"
                    ?["Carry","Mid","Offlane","Soft Support","Hard Support"]
                    :["Duelist","Initiator","Controller","Sentinel","IGL"]
                  ).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
                <input className="ifield" placeholder="Équipe *" value={editingPlayer.data.team||""}
                  onChange={e=>setEditingPlayer(ep=>({...ep,data:{...ep.data,team:e.target.value}}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setEditingPlayer(null)}
                  style={{padding:"12px",background:"#1F2937",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  Annuler
                </button>
                <button onClick={()=>{
                  const {key,data}=editingPlayer;
                  const newKey=(data.displayName||key).toLowerCase().trim()||key;
                  const playerData={game:data.game,league:data.league||"",role:data.role||"",team:data.team||""};
                  setCustom(c=>{
                    const n={...c};
                    // If renamed, remove old key and add new one
                    if(newKey!==key) delete n[key];
                    n[newKey]=playerData;
                    return n;
                  });
                  setEditingPlayer(null);
                  showToast((newKey!==key?key+" → "+newKey+" ":newKey+" ")+"mis à jour ✓");
                }} style={{padding:"12px",background:"linear-gradient(135deg,#7C3AED,#3B82F6)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL SUPABASE / CLOUD ── */}
        {supaModal&&(
          <div className="moverlay" onClick={()=>{setSupaModal(false);setSupaError("");}}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{fontSize:22}}>☁️</span>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#E5E7EB"}}>Cloud Sync</div>
                  <div style={{fontSize:11,color:"#6B7280"}}>Sync automatique entre tous tes appareils</div>
                </div>
              </div>

              {/* Status */}
              <div style={{background:supaOk?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.06)",border:"1px solid "+(supaOk?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.15)"),borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:supaOk?"#22C55E":"#EF4444",boxShadow:"0 0 6px "+(supaOk?"rgba(34,197,94,0.8)":"rgba(239,68,68,0.6)")}}/>
                  <span style={{fontSize:12,fontWeight:700,color:supaOk?"#22C55E":"#F87171"}}>{syncing?"Synchronisation…":supaOk?"Connecté à Supabase":"Hors ligne — vérifie ta connexion"}</span>
                </div>
                <div style={{fontSize:11,color:"#6B7280"}}>{bets.length} paris · sync automatique toutes les 3s</div>
              </div>

              {/* Actions manuelles */}
              <button onClick={()=>{
                setSyncing(true);
                supaPullBets().then(remote=>{
                  if(remote&&remote.length>0){
                    setBets(remote);
                    localStorage.setItem("v7_bets",JSON.stringify(remote));
                    showToast("☁️ "+remote.length+" paris rechargés","#7C3AED");
                    setSupaOk(true);
                  }
                  setSyncing(false);setSupaModal(false);
                }).catch(e=>{setSyncing(false);setSupaOk(false);showToast("Erreur: "+e.message,"#EF4444");});
              }} style={{width:"100%",padding:"11px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:10,color:"#A78BFA",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginBottom:8}}>
                ↓ Forcer le rechargement depuis le cloud
              </button>

              <button onClick={()=>{
                setSyncing(true);
                supaPushBets(bets).then(()=>{
                  setSupaOk(true);
                  showToast("☁️ "+bets.length+" paris envoyés","#22C55E");
                  setSyncing(false);setSupaModal(false);
                }).catch(e=>{setSyncing(false);setSupaOk(false);showToast("Erreur: "+e.message,"#EF4444");});
              }} style={{width:"100%",padding:"11px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,color:"#22C55E",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginBottom:14}}>
                ↑ Forcer l'envoi vers le cloud
              </button>

              {/* Reset total */}
              <button onClick={async()=>{
                if(!confirmDelete){setConfirmDelete(true);return;}
                setSyncing(true);
                setBets([]);
                localStorage.setItem("v7_bets","[]");
                try{ await supaDeleteAllBets(); }catch(e){}
                setSyncing(false);
                setConfirmDelete(false);setSupaModal(false);
                showToast("Tous les paris supprimés","#EF4444");
              }}
                style={{width:"100%",padding:"11px",background:confirmDelete?"#EF4444":"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:10,color:confirmDelete?"#fff":"#F87171",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginBottom:8}}>
                {confirmDelete?"⚠️ Confirmer la suppression de TOUS les paris":"🗑 Remettre à zéro"}
              </button>

              <button onClick={()=>{setSupaModal(false);setConfirmDelete(false);}}
                style={{width:"100%",padding:"11px",background:"#1F2937",border:"none",borderRadius:10,color:"#6B7280",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}>
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
