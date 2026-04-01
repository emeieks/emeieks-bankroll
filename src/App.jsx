import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";

// ── Game Logos & GameLogo component ──────────────────────────────────────
const L={
  LoL:"data:image/png;base64,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", Dota2:"data:image/png;base64,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", CS2:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD40lEQVR42u2WX2scZRTGf+fMzO5ms5tkzSZNa3ohiH9SqmBKimKDUrTgtVL0UuqF/QpWP4Afwitvizfe2BYRWxVpxauCJUqjlLTZaNNkm92dnXnf48XMbrI0Gy0ouckLM8O8w5zzzHme85yRuYVPjH1cyj6vAwAHAA4A7DuAcNgDs+H+JCL/P4C9kuwF7nHj/SsAIkoQaD+xmWFmaBD0EPX3RRTYBuic2xN0iOQP7FGE3lIKQUi322Jj/SGqmWSKhTJRFPBgYx0MRAUlIAhDukkHEQNRgrDIyEh119h9ACYeEMQEyL5IzaMKYilx/JDRSpnjx18gSbqMlCo0Gg9YX7/HifmX8K6LmBJ3UlqtFhNTFRwJ3pTVtTard5uYDxjGaAiSV0zyIyt/mrbx1mGiVuXChQ85OnuEjU2jVBR++P5n6vUyh2dqtLdaTNamuHnzF1ZWVnhl8WU63U3KY1PMzJT44NynNBpbRGFhVxpCTAeT4/HmKBRD/ry/xdvvvMmRJwu8+945glBIk4TTry9w/v3zXPzyR+J2l59ufMfVa9c588YZVu/dodlq8vyxCmsNx/2/GoRBebgGxHpWkAEwIFCh04mZnJzg7Nm3uHzlKu14i6PTs6w1Vvj9j2U++/wSqgHH5p7ixPzTPPvMc8zPv8i3125QLIyw/OtdLn5xhbRrFEcici3uRoH1kw+0mQjVSpmo0GVx8RQLJ0+RJjGXL33F6ddexbmYrWaTMKzxzdfXmT06Q6kYMlY9RLkyym+377B8e4UoqODdHu05d/Jjy1TaE6GBOFRSXNJi+vAM9akxRIxuO2Zjc4ND03XEPFEU0Wp2WLq1xGR9inp9kkKxgGhEJzZuLS2DL+DwiDLQnjsAfGSZEIN+F4BDFZCUTmuTJEnx3hMEEaVSiXZ7C+89WEigyvh4lW7coRN3UFXixBFpkdGxGs6Td4DfFUBI3oaZGH0+HgTvs14ul2sICqLgldQ8409UgQCxAAOcSwlHIsZHK3iMCiHeC6lzWVisbze7aMDnhmg7Dsl0YJB4tvdzkKmkYFnQTD0eLCX1ScamdyCKiQE+95hwDx/AQCx3LMu9ID+ZIKJYr1sEVFxeKc0ASPa+z0H32klUUPMgwW7V7/lAsIOCfh9geDCHiGAEgM/3UoQUTPOZoBkAlf6EV6LsY5xHNItvw6fhoA8MUCE9BRkmgpki5sAEtawq1jMyU0RCsAh1YV5ynyf3/zCObWdytinYEQQkO6sghHn5HWgPsILPbKXHfaaNfrBhFDyaPLvVgWs/RK58w4N06WuoN08EIAUcQ4n/b3/J7DH3D35KDwAMrr8Bx/+9oqtKhPkAAAAASUVORK5CYII=", Valorant:"data:image/png;base64,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"
};
function GameLogo({game,size=18}){
  const src=L[game];
  if(!src) return <span style={{fontSize:size-2}}></span>;
  return <img src={src} alt={game} style={{width:size,height:size,objectFit:"contain",borderRadius:3,verticalAlign:"middle",flexShrink:0}}/>;
}

// ── Bankroll Chart ────────────────────────────────────────────────────────
function BankrollChart({points,h=150}){
  if(!points||points.length<2)return(
    <div style={{height:h,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:13}}>Pas assez de donnees</div>
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
  const color=up?"#34D399":"#F87171";
  const yTicks=[min,min+range*0.5,max];
  const xSamples=[0,Math.floor((points.length-1)/2),points.length-1];
  return(
    <svg width="100%" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="none" style={{overflow:"visible"}}>
      <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
      {yTicks.map((v,i)=><line key={i} x1={pad.l} y1={py(v)} x2={W-pad.r} y2={py(v)} stroke="#1E2D45" strokeWidth="1" strokeDasharray="3,3"/>)}
      {yTicks.map((v,i)=><text key={i} x={pad.l-3} y={py(v)+4} textAnchor="end" fontSize="9" fill="#475569">{v.toFixed(0)}</text>)}
      {xSamples.filter(i=>points[i]&&points[i].dt).map((i,k)=><text key={k} x={px(i)} y={H-2} textAnchor="middle" fontSize="9" fill="#475569">{points[i].dt.slice(5,10).replace("-","/")}</text>)}
      <path d={fillPath} fill="url(#cf)"/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={px(points.length-1)} cy={py(points[points.length-1].v)} r="4" fill={color}/>
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
soboro:{game:"LoL",league:"LPL",role:"Top Laner",team:"Invictus Gaming"},
igwei:{game:"LoL",league:"LPL",role:"Jungler",team:"Invictus Gaming"},
rookie:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Invictus Gaming"},
photic:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Invictus Gaming"},
meiko:{game:"LoL",league:"LPL",role:"Support",team:"Invictus Gaming"},
xiaoxu:{game:"LoL",league:"LPL",role:"Top Laner",team:"JD Gaming"},
junjia:{game:"LoL",league:"LPL",role:"Jungler",team:"JD Gaming"},
hongq:{game:"LoL",league:"LPL",role:"Mid Laner",team:"JD Gaming"},
gala:{game:"LoL",league:"LPL",role:"Bot Laner",team:"JD Gaming"},
vampire:{game:"LoL",league:"LPL",role:"Support",team:"JD Gaming"},
tes369:{game:"LoL",league:"LPL",role:"Top Laner",team:"Top Esports"},
naiyou:{game:"LoL",league:"LPL",role:"Jungler",team:"Top Esports"},
creme:{game:"LoL",league:"LPL",role:"Mid Laner",team:"Top Esports"},
jiaqi:{game:"LoL",league:"LPL",role:"Bot Laner",team:"Top Esports"},
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
// #1 Vitality
apex:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
ropz:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
zywoo:{game:"CS2",league:"",role:"AWPer",team:"Vitality"},
flamez:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
mezii:{game:"CS2",league:"",role:"Rifler",team:"Vitality"},
// #2 FURIA
fallen:{game:"CS2",league:"",role:"AWPer",team:"FURIA"},
yuurih:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
yekindar:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
kscerato:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
molodoy:{game:"CS2",league:"",role:"Rifler",team:"FURIA"},
// #3 MOUZ
brollan:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
torzsi:{game:"CS2",league:"",role:"AWPer",team:"MOUZ"},
spinx:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
jimpphat:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
xertion:{game:"CS2",league:"",role:"Rifler",team:"MOUZ"},
// #4 Team Falcons
niko:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
teses:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
monesy:{game:"CS2",league:"",role:"AWPer",team:"Team Falcons"},
kyxsan:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
kyousuke:{game:"CS2",league:"",role:"Rifler",team:"Team Falcons"},
// #5 PARIVISION
jame:{game:"CS2",league:"",role:"AWPer",team:"PARIVISION"},
belchonokk:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
xielo:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
nota:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
zweih:{game:"CS2",league:"",role:"Rifler",team:"PARIVISION"},
// #6 NaVi
aleksib:{game:"CS2",league:"",role:"IGL",team:"NaVi"},
im:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
b1t:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
wonderful:{game:"CS2",league:"",role:"AWPer",team:"NaVi"},
makazze:{game:"CS2",league:"",role:"Rifler",team:"NaVi"},
// #7 Aurora
xantares:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
woxic:{game:"CS2",league:"",role:"AWPer",team:"Aurora"},
maj3r:{game:"CS2",league:"",role:"IGL",team:"Aurora"},
wicadia:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
jottaaa:{game:"CS2",league:"",role:"Rifler",team:"Aurora"},
// #8 Team Spirit
sh1ro:{game:"CS2",league:"",role:"AWPer",team:"Team Spirit"},
magixx:{game:"CS2",league:"",role:"IGL",team:"Team Spirit"},
tn1r:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
zont1x:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
donk:{game:"CS2",league:"",role:"Rifler",team:"Team Spirit"},
// #9 The MongolZ
blitz:{game:"CS2",league:"",role:"IGL",team:"The MongolZ"},
techno:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
mzinho:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
cs2910:{game:"CS2",league:"",role:"AWPer",team:"The MongolZ"},
cobrazera:{game:"CS2",league:"",role:"Rifler",team:"The MongolZ"},
// #10 Astralis
hooxi:{game:"CS2",league:"",role:"IGL",team:"Astralis"},
staavn:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
phzy:{game:"CS2",league:"",role:"AWPer",team:"Astralis"},
ryu:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
mightymaxcs:{game:"CS2",league:"",role:"Rifler",team:"Astralis"},
// #11 FaZe Clan
karrigan:{game:"CS2",league:"",role:"IGL",team:"FaZe Clan"},
twistzz:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
frozen:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
broky:{game:"CS2",league:"",role:"AWPer",team:"FaZe Clan"},
jcobbb:{game:"CS2",league:"",role:"Rifler",team:"FaZe Clan"},
// #12 FUT Esports
calyx:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
imorr:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
atilla:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
wicle:{game:"CS2",league:"",role:"AWPer",team:"FUT Esports"},
aunkere:{game:"CS2",league:"",role:"Rifler",team:"FUT Esports"},
// #13 G2 Esports
hunter:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
nertz:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
sunpayus:{game:"CS2",league:"",role:"AWPer",team:"G2 Esports"},
heavygod:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
matys:{game:"CS2",league:"",role:"Rifler",team:"G2 Esports"},
// #14 3DMAX
misutaaa:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
lucky:{game:"CS2",league:"",role:"AWPer",team:"3DMAX"},
maka:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
ex3rcice:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
graviti:{game:"CS2",league:"",role:"Rifler",team:"3DMAX"},
// #15 Legacy
art:{game:"CS2",league:"",role:"IGL",team:"Legacy"},
latto:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
dumau:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
n1ssim:{game:"CS2",league:"",role:"Rifler",team:"Legacy"},
saadzin:{game:"CS2",league:"",role:"AWPer",team:"Legacy"},
// #16 GamerLegion CS
snax:{game:"CS2",league:"",role:"IGL",team:"GamerLegion CS"},
rez:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
tauson:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
hypex:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
pr:{game:"CS2",league:"",role:"Rifler",team:"GamerLegion CS"},
// #17 paiN CS
biguzera:{game:"CS2",league:"",role:"Rifler",team:"paiN CS"},
dav1deus:{game:"CS2",league:"",role:"IGL",team:"paiN CS"},
skullz:{game:"CS2",league:"",role:"Rifler",team:"paiN CS"},
hardzao:{game:"CS2",league:"",role:"AWPer",team:"paiN CS"},
nqz:{game:"CS2",league:"",role:"Rifler",team:"paiN CS"},
// #18 HEROIC
hades:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
xfl0ud:{game:"CS2",league:"",role:"AWPer",team:"HEROIC"},
chr1zn:{game:"CS2",league:"",role:"IGL",team:"HEROIC"},
susp:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
sjush:{game:"CS2",league:"",role:"Rifler",team:"HEROIC"},
// #19 B8
npl:{game:"CS2",league:"",role:"IGL",team:"B8"},
headtr1ck:{game:"CS2",league:"",role:"Rifler",team:"B8"},
kensizor:{game:"CS2",league:"",role:"Rifler",team:"B8"},
alex666:{game:"CS2",league:"",role:"AWPer",team:"B8"},
esenthial:{game:"CS2",league:"",role:"Rifler",team:"B8"},
// #20 Liquid CS
naf:{game:"CS2",league:"",role:"Rifler",team:"Liquid CS"},
elige:{game:"CS2",league:"",role:"Rifler",team:"Liquid CS"},
malbsmd:{game:"CS2",league:"",role:"IGL",team:"Liquid CS"},
siuhy:{game:"CS2",league:"",role:"IGL",team:"Liquid CS"},
ultimate:{game:"CS2",league:"",role:"AWPer",team:"Liquid CS"},
// #21 Gentle Mates
poizon:{game:"CS2",league:"",role:"AWPer",team:"Gentle Mates"},
tarik:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
dupreeh:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
misutaaa2:{game:"CS2",league:"",role:"Rifler",team:"Gentle Mates"},
hooxi2:{game:"CS2",league:"",role:"IGL",team:"Gentle Mates"},
// #22 NiP
plopski:{game:"CS2",league:"",role:"Rifler",team:"NiP"},
hampus:{game:"CS2",league:"",role:"IGL",team:"NiP"},
lwx:{game:"CS2",league:"",role:"Rifler",team:"NiP"},
maxster:{game:"CS2",league:"",role:"AWPer",team:"NiP"},
nawwk:{game:"CS2",league:"",role:"AWPer",team:"NiP"},
// #23 Monte
woro2k:{game:"CS2",league:"",role:"AWPer",team:"Monte"},
krad:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
almazer:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
ssau:{game:"CS2",league:"",role:"Rifler",team:"Monte"},
tobiz:{game:"CS2",league:"",role:"IGL",team:"Monte"},
// #24 NRG CS
nitro:{game:"CS2",league:"",role:"IGL",team:"NRG CS"},
sonic:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
grim:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
osee:{game:"CS2",league:"",role:"AWPer",team:"NRG CS"},
br0:{game:"CS2",league:"",role:"Rifler",team:"NRG CS"},
// #25 HOTU
n0rb3r7:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
dukefissura:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
kalash:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
mizu:{game:"CS2",league:"",role:"AWPer",team:"HOTU"},
frontales:{game:"CS2",league:"",role:"Rifler",team:"HOTU"},
// #26 BetBoom CS
boombl4:{game:"CS2",league:"",role:"IGL",team:"BetBoom CS"},
d1ledez:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
s1ren:{game:"CS2",league:"",role:"AWPer",team:"BetBoom CS"},
artfr0st:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
magnojez:{game:"CS2",league:"",role:"Rifler",team:"BetBoom CS"},
// #27 Passion UA
passion1:{game:"CS2",league:"",role:"IGL",team:"Passion UA"},
s1ren2:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
krabeni:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
burmylov:{game:"CS2",league:"",role:"AWPer",team:"Passion UA"},
lack1:{game:"CS2",league:"",role:"Rifler",team:"Passion UA"},
// #28 MIBR
lnz2:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
insani:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
brnz4n:{game:"CS2",league:"",role:"Rifler",team:"MIBR"},
venomzera:{game:"CS2",league:"",role:"AWPer",team:"MIBR"},
kl1m:{game:"CS2",league:"",role:"IGL",team:"MIBR"},
// #29 9z
cs2max:{game:"CS2",league:"",role:"Rifler",team:"9z"},
dgt:{game:"CS2",league:"",role:"AWPer",team:"9z"},
meyern:{game:"CS2",league:"",role:"Rifler",team:"9z"},
luchov:{game:"CS2",league:"",role:"Rifler",team:"9z"},
huasopeek:{game:"CS2",league:"",role:"Rifler",team:"9z"},
// #30 BC.Game
s1mple:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
electronic:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
mutir1s:{game:"CS2",league:"",role:"IGL",team:"BC.Game"},
krazy:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
aragornN:{game:"CS2",league:"",role:"Rifler",team:"BC.Game"},
// #31 M80
oSee:{game:"CS2",league:"",role:"AWPer",team:"M80"},
hext:{game:"CS2",league:"",role:"Rifler",team:"M80"},
naf2:{game:"CS2",league:"",role:"Rifler",team:"M80"},
cj:{game:"CS2",league:"",role:"IGL",team:"M80"},
jba:{game:"CS2",league:"",role:"Rifler",team:"M80"},
// #32 100 Thieves
device:{game:"CS2",league:"",role:"AWPer",team:"100 Thieves"},
rain:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
ag1l:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
glae:{game:"CS2",league:"",role:"IGL",team:"100 Thieves"},
poiii:{game:"CS2",league:"",role:"Rifler",team:"100 Thieves"},
// #33 Sharks
gafolo:{game:"CS2",league:"",role:"IGL",team:"Sharks"},
koala:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
maxxkor:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
rdnzao:{game:"CS2",league:"",role:"AWPer",team:"Sharks"},
doc:{game:"CS2",league:"",role:"Rifler",team:"Sharks"},
// #34 TYLOO
gxx:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
bntet:{game:"CS2",league:"",role:"AWPer",team:"TYLOO"},
advent:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
cs2zero:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
mouz2:{game:"CS2",league:"",role:"Rifler",team:"TYLOO"},
// #35 Imperial Esports
fell:{game:"CS2",league:"",role:"AWPer",team:"Imperial"},
boltz:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
decenty:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
neo2:{game:"CS2",league:"",role:"Rifler",team:"Imperial"},
tuxa:{game:"CS2",league:"",role:"IGL",team:"Imperial"},
// #36 illwill
fl0m:{game:"CS2",league:"",role:"IGL",team:"illwill"},
parabellum:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
junior:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
slaxz:{game:"CS2",league:"",role:"Rifler",team:"illwill"},
infinite2:{game:"CS2",league:"",role:"AWPer",team:"illwill"},
// #37 RED Canids
lucas1:{game:"CS2",league:"",role:"AWPer",team:"RED Canids"},
nqz3:{game:"CS2",league:"",role:"Rifler",team:"RED Canids"},
kauez:{game:"CS2",league:"",role:"Rifler",team:"RED Canids"},
kng:{game:"CS2",league:"",role:"Rifler",team:"RED Canids"},
saffee:{game:"CS2",league:"",role:"AWPer",team:"RED Canids"},
// #38 FlyQuest CS
story:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
kyxo:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
djl:{game:"CS2",league:"",role:"IGL",team:"FlyQuest CS"},
motm:{game:"CS2",league:"",role:"Rifler",team:"FlyQuest CS"},
faNg:{game:"CS2",league:"",role:"AWPer",team:"FlyQuest CS"},
// #39 ECSTATIC
queenix:{game:"CS2",league:"",role:"AWPer",team:"ECSTATIC"},
kristou:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
jkaem:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
nodios:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
magisk2:{game:"CS2",league:"",role:"Rifler",team:"ECSTATIC"},
// #40 SINNERS Esports
torszi:{game:"CS2",league:"",role:"AWPer",team:"SINNERS"},
neno:{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
beastik:{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
oskarish:{game:"CS2",league:"",role:"IGL",team:"SINNERS"},
ayken:{game:"CS2",league:"",role:"Rifler",team:"SINNERS"},
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
};

const STATIC_PLAYERS_COUNT=Object.keys(STATIC_PLAYERS).length;
const DEFAULT_BK=["Stake","Roobet","Rainbet","BCGame","Duelbits"];

const BK_LOGOS={
"Stake":"data:image/png;base64,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",
"Roobet":"data:image/png;base64,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",
"Rainbet":"data:image/png;base64,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",
"BCGame":"data:image/png;base64,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",
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
  pending:{label:"En attente",color:"#60A5FA",bg:"rgba(96,165,250,0.1)"},
  won:{label:"Gagne",color:"#34D399",bg:"rgba(52,211,153,0.1)"},
  lost:{label:"Perdu",color:"#F87171",bg:"rgba(248,113,113,0.1)"},
};
const EMPTY_FORM={player:"",overUnder:"Over",description:"",odds:"",stake:"",bookmaker:"",status:"pending",autoInfo:null,datetime:"",isHeadshot:false,mapTag:"",isLive:false};
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
function NumPad({value,onChange,placeholder,step}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const isDecimal=step==="0.01";
  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  const press=useCallback((k)=>{
    let v=String(value||"");
    if(k==="DEL"){v=v.slice(0,-1);}
    else if(k==="."){if(!v.includes("."))v+=k;}
    else{
      if(isDecimal&&v===""&&k!=="0")v=k;
      else v+=k;
    }
    onChange(v);
  },[value,onChange,isDecimal]);
  const keys=isDecimal
    ?["1","2","3","4","5","6","7","8","9",".","0","DEL"]
    :["1","2","3","4","5","6","7","8","9","00","0","DEL"];
  return(
    <div ref={ref} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input
          readOnly
          placeholder={placeholder}
          value={value||""}
          onFocus={()=>setOpen(true)}
          className="add-ifield"
          style={{height:48,paddingRight:14,cursor:"pointer"}}
        />
        {value&&<button onClick={()=>onChange("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16,fontFamily:"Inter"}}>x</button>}
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#0E1120",border:"1px solid #1E2245",borderRadius:10,zIndex:300,padding:8,boxShadow:"0 8px 28px rgba(0,0,0,0.7)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {keys.map(k=>(
              <button key={k} onMouseDown={e=>{e.preventDefault();press(k);}}
                style={{background:k==="DEL"?"#1A1E30":"#13172A",border:"1px solid #1E2245",borderRadius:7,padding:"12px 4px",color:k==="DEL"?"#F87171":"#E2E8F0",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"monospace"}}>
                {k}
              </button>
            ))}
          </div>
          <button onMouseDown={e=>{e.preventDefault();setOpen(false);}}
            style={{width:"100%",marginTop:6,background:"#6C5FF0",border:"none",borderRadius:7,padding:"10px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Inter"}}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}

// ── PlayerAC ──────────────────────────────────────────────────────────────
function PlayerAC({value,onChange,allPlayers}){
  const [open,setOpen]=useState(false);
  const [inputVal,setInputVal]=useState(value);
  const ref=useRef(null);
  const debounceRef=useRef(null);
  useEffect(()=>{setInputVal(value);},[value]);
  const isConfirmed=useMemo(()=>!!allPlayers[inputVal.toLowerCase().trim()],[allPlayers,inputVal]);
  const sugg=useMemo(()=>{
    const q=inputVal.toLowerCase().trim();
    if(q.length<1)return[];
    return Object.entries(allPlayers).filter(([k])=>k.includes(q)).slice(0,8);
  },[allPlayers,inputVal]);
  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const handleChange=useCallback((e)=>{
    const v=e.target.value;
    setInputVal(v);setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>onChange(v),80);
  },[onChange]);
  const handleSelect=useCallback((key)=>{
    setInputVal(key);onChange(key);setOpen(false);
  },[onChange]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input className="add-ifield" placeholder="ex: Faker, ZywOo..." value={inputVal} autoComplete="off"
          onChange={handleChange} onFocus={()=>setOpen(true)}
          style={{paddingRight:isConfirmed?42:14,height:48}}/>
        {isConfirmed&&(
          <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,background:"rgba(52,211,153,0.15)",borderRadius:"50%",border:"1.5px solid #34D399",pointerEvents:"none"}}>
            <span style={{color:"#34D399",fontSize:14,lineHeight:1}}>v</span>
          </div>
        )}
      </div>
      {open&&sugg.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#0E1120",border:"1px solid #1E2245",borderRadius:10,zIndex:200,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.7)"}}>
          {sugg.map(([key,p])=>{
            const isSelected=key===inputVal.toLowerCase().trim();
            return(
              <div key={key} onMouseDown={e=>{e.preventDefault();handleSelect(key);}}
                style={{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",cursor:"pointer",borderBottom:"1px solid #1A2245",background:isSelected?"rgba(108,95,240,0.08)":"transparent"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(108,95,240,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.background=isSelected?"rgba(108,95,240,0.08)":"transparent"}>
                <GameLogo game={p.game} size={16}/>
                <div style={{flex:1}}>
                  <span style={{fontWeight:700,fontSize:14,color:"#F1F5F9",textTransform:"capitalize"}}>{key}</span>
                  <span style={{fontSize:11,color:"#4A5080",marginLeft:7}}>{p.team}</span>
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  {p.league&&<span style={{fontSize:10,fontWeight:600,color:"#A78BFA",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",padding:"1px 5px",borderRadius:4}}>{p.league}</span>}
                  <span style={{fontSize:10,fontWeight:600,color:"#60A5FA",background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.15)",padding:"1px 5px",borderRadius:4}}>{p.role}</span>
                  {isSelected&&<span style={{color:"#34D399",fontSize:14,fontWeight:700,marginLeft:2}}>v</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── BetRow component ───────────────────────────────────────────────────────
const BetRow=memo(function BetRow({bet,onStatus,onDelete,onDuplicate,onEdit}){
  const [open,setOpen]=useState(false);
  const sc=STATUS_CFG[bet.status]||{color:"#60A5FA",label:bet.status};
  const isPending=bet.status==="pending";
  const profitColor=isPending?"#60A5FA":bet.profit>=0?"#34D399":"#F87171";
  const profitTxt=isPending?"@"+bet.odds:(bet.profit>=0?"+":"")+bet.profit.toFixed(2)+"$";

  return(
    <div className="betrow">
      {/* ── Main row (always visible) ── */}
      <div onClick={()=>setOpen(v=>!v)} style={{padding:"9px 13px",cursor:"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Left: game logo + player */}
          <GameLogo game={bet.game} size={17}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontWeight:700,fontSize:13,color:"#F1F5F9",textTransform:"capitalize",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{bet.player}</span>
              {bet.isLive&&<span style={{fontSize:9,fontWeight:800,color:"#FF4757",background:"rgba(255,71,87,0.15)",padding:"1px 5px",borderRadius:3,border:"1px solid rgba(255,71,87,0.3)",letterSpacing:.5,flexShrink:0}}>LIVE</span>}
              {bet.mapTag&&<span style={{fontSize:9,fontWeight:700,color:"#F59E0B",background:"rgba(245,158,11,0.1)",padding:"1px 5px",borderRadius:3,border:"1px solid rgba(245,158,11,0.2)",flexShrink:0}}>{bet.mapTag}</span>}
            </div>
            <div style={{fontSize:10,color:"#475569",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {bet.description} · @{bet.odds}
              {bet.bookmaker&&<span style={{color:"#334155"}}> · {bet.bookmaker}</span>}
            </div>
          </div>
          {/* Right: amount + status dot */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:700,fontSize:13,color:profitColor}}>{profitTxt}</div>
            <div style={{fontSize:9,color:sc.color,marginTop:1}}>{sc.label}</div>
          </div>
          {/* Chevron */}
          <span style={{color:"#1E2D45",fontSize:12,marginLeft:2,flexShrink:0,transition:"transform .15s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>▼</span>
        </div>
      </div>

      {/* ── Expanded actions ── */}
      {open&&(
        <div style={{padding:"0 13px 9px",display:"flex",gap:5,flexWrap:"wrap",borderTop:"1px solid #0F1824",paddingTop:8}}>
          <span style={{fontSize:9,color:"#334155",alignSelf:"center",flex:1}}>{fmtDate(bet.datetime)}</span>
          {isPending&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"won");setOpen(false);}} style={{color:"#34D399",borderColor:"#34D39944",fontSize:11}}>✓ Gagné</button>}
          {isPending&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"lost");setOpen(false);}} style={{color:"#F87171",borderColor:"#F8717144",fontSize:11}}>✗ Perdu</button>}
          {!isPending&&<button className="editbtn" onClick={()=>{onStatus(bet.id,"pending");setOpen(false);}} style={{fontSize:11}}>↩ Annuler</button>}
          <button className="editbtn" onClick={()=>{onEdit();setOpen(false);}} style={{fontSize:11}}>✎ Éd.</button>
          <button className="editbtn" onClick={()=>{onDuplicate(bet);setOpen(false);}} style={{fontSize:11}}>⧉ Dup.</button>
          <button className="editbtn" onClick={()=>onDelete(bet.id)} style={{color:"#F87171",borderColor:"#F8717144",fontSize:11}}>🗑</button>
        </div>
      )}
    </div>
  );
});

// ── BetRowSelectable ───────────────────────────────────────────────────────
const BetRowSelectable=memo(function BetRowSelectable({bet,selected,onToggle,onEdit}){
  const sc=STATUS_CFG[bet.status]||{color:"#60A5FA",label:bet.status};
  return(
    <div className="betrow" style={{background:selected?"rgba(0,255,204,0.04)":"#0D1220",padding:"11px 13px",borderLeft:selected?"3px solid #00FFCC":"3px solid transparent"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <button onClick={onToggle} style={{width:22,height:22,borderRadius:6,border:"2px solid "+(selected?"#00FFCC":"#1A2535"),background:selected?"rgba(0,255,204,0.1)":"transparent",cursor:"pointer",flexShrink:0,marginTop:2}}/>
        <div style={{flex:1,minWidth:0}}>
          {/* Date */}
          <div style={{fontSize:10,color:"#475569",marginBottom:4}}>{fmtDate(bet.datetime)}{bet.bookmaker?" · "+bet.bookmaker:""}</div>
          {/* Player row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
              <GameLogo game={bet.game} size={18}/>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:"#F1F5F9",textTransform:"capitalize"}}>{bet.player}</div>
                <div style={{fontSize:10,color:"#475569",marginTop:1}}>{bet.description} - @{bet.odds} - {bet.stake}$</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:700,fontSize:13,color:bet.status==="pending"?"#60A5FA":bet.profit>=0?"#34D399":"#F87171"}}>
                {bet.status==="pending"?"@"+bet.odds:(bet.profit>=0?"+":"")+bet.profit.toFixed(2)+"$"}
              </div>
              <div style={{fontSize:10,color:sc.color}}>{sc.label}</div>
            </div>
          </div>
        </div>
        <button className="editbtn" onClick={onEdit} style={{flexShrink:0,marginTop:2}}>Ed.</button>
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
  const [visibleMonths,setVisibleMonths]=useState(3);
  const [selectMode,setSelectMode]=useState(false);
  const [selectedIds,setSelectedIds]=useState([]);
  const [bulkModal,setBulkModal]=useState(false);
  const [bulkStatus,setBulkStatus]=useState("won");
  const [bulkBK,setBulkBK]=useState("");
  const [bulkDatetime,setBulkDatetime]=useState("");
  const [editingBet,setEditingBet]=useState(null);
  const [sessionMode,setSessionMode]=useState(false);
  const [sessionMaps,setSessionMaps]=useState([{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW}]);
  const [fGames,setFGames]=useState([]);
  const [fBKs,setFBKs]=useState([]);
  const [fPlayer,setFPlayer]=useState("");
  const [fStatus,setFStatus]=useState("All");
  const [fOverUnder,setFOverUnder]=useState("All");
  const [filtresPage,setFiltresPage]=useState(1);
  const [mpFilter,setMpFilter]=useState("all");
  const [collapsedMonths,setCollapsedMonths]=useState({});
  const [fLive,setFLive]=useState(false);
  const [fHeadshot,setFHeadshot]=useState(false);
  const FILTRES_PER_PAGE=30;
  const [modalBK,setModalBK]=useState(false);
  const [newBK,setNewBK]=useState("");
  const [modalPlayer,setModalPlayer]=useState(false);
  const [pform,setPform]=useState({name:"",game:"LoL",league:"",role:"",team:""});

  // localStorage load
  useEffect(()=>{
    try{
      const b=localStorage.getItem("v7_bets"); if(b)setBets(JSON.parse(b));
      const bk=localStorage.getItem("v7_bankroll"); if(bk)setBankroll(parseFloat(bk));
      const cp=localStorage.getItem("v7_custom_p"); if(cp)setCustom(JSON.parse(cp));
      const bm=localStorage.getItem("v7_bmakers"); if(bm)setBookmakers(JSON.parse(bm));
    }catch{}
    setLoaded(true);
  },[]);

  useEffect(()=>{
    if(!loaded)return;
    const t=setTimeout(()=>{try{localStorage.setItem("v7_bets",JSON.stringify(bets));}catch{}},800);
    return()=>clearTimeout(t);
  },[bets,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    const t=setTimeout(()=>{try{localStorage.setItem("v7_bankroll",String(bankroll));}catch{}},800);
    return()=>clearTimeout(t);
  },[bankroll,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    const t=setTimeout(()=>{try{localStorage.setItem("v7_custom_p",JSON.stringify(custom));}catch{}},400);
    return()=>clearTimeout(t);
  },[custom,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    const t=setTimeout(()=>{try{localStorage.setItem("v7_bmakers",JSON.stringify(bookmakers));}catch{}},400);
    return()=>clearTimeout(t);
  },[bookmakers,loaded]);

  const showToast=useCallback((msg,color="#34D399")=>{
    setToast({msg,color});setTimeout(()=>setToast(null),2200);
  },[]);

  const allPlayers=useMemo(()=>{
    const merged={...STATIC_PLAYERS};
    Object.entries(custom).forEach(([k,v])=>{merged[k]=v;});
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
  const gStats=useMemo(()=>{
    const g={};
    settled.forEach(b=>{
      if(!g[b.game])g[b.game]={profit:0,count:0,staked:0,won:0,oddsSum:0};
      g[b.game].profit+=b.profit;g[b.game].count++;g[b.game].staked+=b.stake;
      g[b.game].oddsSum+=b.odds;
      if(b.status==="won")g[b.game].won++;
    });
    return g;
  },[settled]);

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

  const liveStats=useMemo(()=>{
    const lb=settled.filter(b=>b.isLive);
    const won=lb.filter(b=>b.status==="won").length;
    const profit=lb.reduce((s,b)=>s+b.profit,0);
    const staked=lb.reduce((s,b)=>s+b.stake,0);
    return{count:lb.length,won,profit,staked,roi:staked>0?(profit/staked)*100:0,wr:lb.length>0?(won/lb.length)*100:0};
  },[settled]);

  const hsStats=useMemo(()=>{
    const hb=settled.filter(b=>b.isHeadshot);
    const won=hb.filter(b=>b.status==="won").length;
    const profit=hb.reduce((s,b)=>s+b.profit,0);
    const staked=hb.reduce((s,b)=>s+b.stake,0);
    return{count:hb.length,won,profit,staked,roi:staked>0?(profit/staked)*100:0,wr:hb.length>0?(won/hb.length)*100:0};
  },[settled]);

  const oddsRangeStats=useMemo(()=>{
    const ranges=[
      {label:"1.01-1.40",min:1.01,max:1.40},{label:"1.40-1.60",min:1.40,max:1.60},
      {label:"1.60-1.80",min:1.60,max:1.80},{label:"1.80-2.00",min:1.80,max:2.00},
      {label:"2.00-2.50",min:2.00,max:2.50},{label:"2.50+",min:2.50,max:Infinity},
    ];
    return ranges.map(r=>{
      const b=settled.filter(x=>x.odds>=r.min&&x.odds<r.max);
      const won=b.filter(x=>x.status==="won").length;
      const profit=b.reduce((s,x)=>s+x.profit,0);
      const staked=b.reduce((s,x)=>s+x.stake,0);
      return{...r,count:b.length,won,profit,staked,roi:staked>0?(profit/staked)*100:0,wr:b.length>0?(won/b.length)*100:0};
    }).filter(r=>r.count>0);
  },[settled]);

  const mapStats=useMemo(()=>{
    const global={};const perGame={};
    settled.forEach(b=>{
      const tag=b.mapTag||"Sans tag";
      if(!global[tag])global[tag]={count:0,won:0,profit:0,staked:0};
      global[tag].count++;global[tag].profit+=b.profit;global[tag].staked+=b.stake;
      if(b.status==="won")global[tag].won++;
      const g=b.game||"?";
      if(!perGame[g])perGame[g]={};
      if(!perGame[g][tag])perGame[g][tag]={count:0,won:0,profit:0,staked:0};
      perGame[g][tag].count++;perGame[g][tag].profit+=b.profit;perGame[g][tag].staked+=b.stake;
      if(b.status==="won")perGame[g][tag].won++;
    });
    const sortTags=(tags)=>[...tags].sort((a,b)=>{
      const na=parseInt(a.replace("Map ",""))||99;
      const nb=parseInt(b.replace("Map ",""))||99;
      return na-nb;
    });
    return{global,perGame,sortTags};
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

  const topPlayers=useMemo(()=>{
    const pm={};
    settled.forEach(b=>{
      if(!pm[b.player])pm[b.player]={player:b.player,count:0,won:0,profit:0,game:b.game};
      pm[b.player].count++;pm[b.player].profit+=b.profit;
      if(b.status==="won")pm[b.player].won++;
    });
    return Object.values(pm).filter(p=>p.count>=2).sort((a,b)=>b.profit-a.profit).slice(0,5);
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
    return bets.filter(b=>{
      if(fGames.length>0&&!fGames.includes(b.game))return false;
      if(fBKs.length>0&&!fBKs.includes(b.bookmaker||"Autre"))return false;
      if(fPlayer&&!b.player.toLowerCase().includes(fPlayer.toLowerCase()))return false;
      if(fStatus!=="All"&&b.status!==fStatus)return false;
      if(fOverUnder==="Over"&&b.overUnder!=="Over")return false;
      if(fOverUnder==="Under"&&b.overUnder!=="Under")return false;
      if(fLive&&!b.isLive)return false;
      if(fHeadshot&&!b.isHeadshot)return false;
      return true;
    }).sort((a,b2)=>(b2.datetime||"").localeCompare(a.datetime||""));
  },[bets,fGames,fBKs,fPlayer,fStatus,fOverUnder,fLive,fHeadshot]);

  const {allSortedBets,byDay,byMonth,monthKeys}=useMemo(()=>{
    const sorted=[...bets].sort((a,b2)=>(b2.datetime||"").localeCompare(a.datetime||""));
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
    if(!form.player||!form.odds||!form.stake)return;
    const info=findPlayer(form.player)||{game:"?",league:"?",role:"?",team:"?"};
    const stake=parseFloat(form.stake),odds=parseFloat(form.odds);
    const desc=form.description?form.overUnder+" "+form.description:form.overUnder;
    setBets(b=>[{
      id:Date.now(),player:form.player,description:desc,overUnder:form.overUnder,
      odds,stake,bookmaker:form.bookmaker,status:form.status,
      game:info.game,league:info.league,role:info.role,team:info.team,
      datetime:form.datetime||nowDT(),isHeadshot:form.isHeadshot||false,isLive:form.isLive||false,
      mapTag:form.mapTag||"",profit:calcProfit(form.status,stake,odds),
    },...b]);
    setForm(f=>({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?f.bookmaker:""}));
    showToast("Pari enregistre");
    setView("mesparis");
  }

  function addSession(){
    const info=findPlayer(form.player)||{game:"?",league:"?",role:"?",team:"?"};
    const desc=form.description?form.overUnder+" "+form.description:form.overUnder;
    const enabled=sessionMaps.filter(m=>m.enabled&&m.odds);
    if(!form.player||enabled.length===0)return;
    const now=Date.now();
    const newBets=enabled.map((m,i)=>({
      id:now+i,player:form.player,description:desc,overUnder:form.overUnder,
      odds:parseFloat(m.odds),stake:parseFloat(m.stake||form.stake||0),
      bookmaker:form.bookmaker,status:m.status,
      game:info.game,league:info.league,role:info.role,team:info.team,
      datetime:form.datetime||nowDT(),isHeadshot:form.isHeadshot||false,isLive:form.isLive||false,
      mapTag:"Map "+(i+1),
      profit:calcProfit(m.status,parseFloat(m.stake||form.stake||0),parseFloat(m.odds)),
    }));
    setBets(b=>[...newBets,...b]);
    setForm(f=>({...EMPTY_FORM,datetime:nowDT(),bookmaker:stickyBK?f.bookmaker:""}));
    setSessionMaps([{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW},{...EMPTY_MAP_ROW}]);
    showToast(newBets.length+" paris enregistres");
    setView("mesparis");
  }

  const updateStatus=useCallback((id,status)=>{
    setBets(b=>b.map(bet=>bet.id!==id?bet:{...bet,status,profit:calcProfit(status,bet.stake,bet.odds)}));
  },[]);

  const deleteBet=useCallback((id)=>{
    setBets(b=>b.filter(bet=>bet.id!==id));
  },[]);

  const duplicateBet=useCallback((bet)=>{
    const newBet={...bet,id:Date.now(),datetime:nowDT(),status:"pending",profit:0,mapTag:""};
    setBets(b=>[newBet,...b]);
    showToast("Pari duplique");
  },[showToast]);

  function applyBulkStatus(status){
    setBets(b=>b.map(bet=>selectedIds.includes(bet.id)?{...bet,status,profit:calcProfit(status,bet.stake,bet.odds)}:bet));
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
    setNewBK("");setModalBK(false);
    showToast(newBK+" ajoute");
  }

  function toggleArr(arr,setter,val){
    setter(a=>a.includes(val)?a.filter(x=>x!==val):[...a,val]);
  }

  const NAV=[
    {id:"home",icon:"🏠",label:"Accueil"},
    {id:"mesparis",icon:"📋",label:"Mes Paris"},
    {id:"add",icon:"➕",label:"Pari"},
    {id:"statistiques",icon:"💲",label:"Stats"},
    {id:"players",icon:"🎮",label:"Joueurs"},
  ];

  const customEntries=useMemo(()=>Object.entries(custom),[custom]);
  const customCount=useMemo(()=>Object.keys(custom).length,[custom]);
  const todayKey=useMemo(()=>toDateKey(nowDT()),[]);


  return(
    <div style={{minHeight:"100vh",background:"#070B13",fontFamily:"Inter,sans-serif",color:"#E2E8F0",paddingBottom:84}}>
      <style>{`
        
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{background:#070B13;margin:0;}
        .card{background:#0D1220;border:1px solid #1A2535;border-radius:12px;padding:14px;}
        .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:600;}
        .ifield{width:100%;background:#0D1220;border:1px solid #1A2535;border-radius:9px;padding:10px 14px;color:#E2E8F0;font-size:14px;font-family:Inter,sans-serif;outline:none;}
        .ifield:focus{border-color:#6C5FF0;}
        .add-card{background:#0B0E1C;border:1px solid #1C2040;border-radius:12px;padding:14px 16px;margin-bottom:10px;}
        .add-label{font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;display:block;}
        .add-ifield{width:100%;background:#080B18;border:1.5px solid #1C2040;border-radius:9px;padding:10px 14px;color:#E2E8F0;font-size:15px;font-family:Inter,sans-serif;outline:none;}
        .add-ifield:focus{border-color:#6C5FF0;}
        .ou-btn{padding:10px 0;border-radius:9px;border:1.5px solid #1C2040;background:#080B18;color:#475569;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;transition:all .15s;}
        .ou-btn.over.on{border-color:#34D399;background:rgba(52,211,153,0.08);color:#34D399;}
        .ou-btn.under.on{border-color:#F87171;background:rgba(248,113,113,0.08);color:#F87171;}
        .navitem{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:8px 6px;border-radius:10px;transition:color .15s;font-family:Inter,sans-serif;color:#475569;min-width:56px;}
        .navitem.on{color:#00FFCC;}
        .navitem .lbl{font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;}
        .stat-bloc{background:#0D1220;border:1px solid #1A2535;border-radius:12px;overflow:hidden;}
        .stat-row{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #0F1824;}
        .stat-row:last-child{border-bottom:none;}
        .fchip{padding:7px 12px;border-radius:8px;border:1.5px solid #1A2535;background:#0D1220;color:#64748B;font-size:12px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;transition:all .15s;}
        .fchip.on{border-color:#00FFCC;color:#00FFCC;background:rgba(0,255,204,0.06);}
        .editbtn{background:none;border:1px solid #1A2535;border-radius:5px;padding:4px 8px;color:#475569;cursor:pointer;font-family:Inter,sans-serif;font-size:12px;}
        .bkchip{padding:9px 12px;border-radius:8px;border:2px solid #1A2535;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#64748B;transition:all .15s;}
        .bkchip.on{border-color:#00FFCC;color:#00FFCC;background:rgba(0,255,204,0.06);}
        .moverlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:400;display:flex;align-items:flex-end;justify-content:center;}
        .modal{background:#0D1220;border:1px solid #1A2535;border-radius:16px 16px 0 0;padding:22px 18px 34px;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;}
        .betrow{border-bottom:1px solid #0F1824;}
        .toggle-wrap{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#080B18;border:1.5px solid #1C2040;border-radius:10px;cursor:pointer;transition:all .15s;}
        .toggle-wrap.hs-on{border-color:rgba(75,111,212,0.4);}
        .toggle-track{width:36px;height:20px;border-radius:10px;background:#1C2040;position:relative;transition:background .2s;flex-shrink:0;}
        .toggle-track.on{background:#4B6FD4;}
        .toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s;}
        .toggle-thumb.on{left:18px;}
        .cal-cell{border:1px solid #1A2535;border-radius:7px;padding:6px 4px;text-align:center;cursor:pointer;transition:all .15s;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
        .cal-cell.today{border-color:rgba(0,255,204,.45);}
        .cal-cell.selected{background:rgba(0,255,204,.1);border-color:#00FFCC;}
        .view-enter{animation:fadeUp .18s ease;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .month-header{font-size:13px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;padding:14px 4px 6px;}
        .day-header{font-size:12px;color:#475569;font-weight:600;padding:10px 0 6px;display:flex;justify-content:space-between;align-items:center;}
      `}</style>

      <div style={{maxWidth:500,margin:"0 auto",padding:"16px 14px"}}>

        {/* Toast */}
        {toast&&<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:toast.color||"#34D399",color:"#070B13",padding:"9px 18px",borderRadius:10,fontWeight:700,fontSize:13,zIndex:500,boxShadow:"0 4px 16px rgba(0,0,0,0.4)",whiteSpace:"nowrap",fontFamily:"Inter,sans-serif"}}>{toast.msg}</div>}

        {/* ── HOME ── */}
        {view==="home"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:0}}>
                  <div style={{background:"#00FFCC",width:5,height:38,borderRadius:2,marginRight:10,transform:"skewX(-8deg)",flexShrink:0}}/>
                  <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
                    <span style={{fontFamily:"system-ui,sans-serif",fontSize:18,fontWeight:800,color:"#fff",letterSpacing:-0.5,lineHeight:1}}><span style={{color:"#00FFCC"}}>EMEI</span>EKS</span>
                    <span style={{fontFamily:"monospace",fontSize:8,color:"#4a7c6f",letterSpacing:4,textTransform:"uppercase",marginTop:4}}>Bankroll</span>
                  </div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:"#475569",marginBottom:2}}>Profit Net</div>
                <div style={{fontSize:16,fontWeight:700,color:totalProfit>=0?"#34D399":"#F87171"}}>{totalProfit>=0?"+":""}{totalProfit.toFixed(0)}$</div>
                <div style={{fontSize:9,color:"#334155",marginTop:1}}>Bankroll: <span style={{color:"#E2E8F0"}}>{bankroll.toFixed(0)}$</span></div>
              </div>
            </div>

            <div className="card" style={{marginBottom:12,padding:"12px 14px"}}>
              <BankrollChart points={chartPoints} h={120}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
              {[
                {label:"Paris",val:bets.length,sub:bets.filter(b=>b.status==="pending").length+" en cours"},
                {label:"Progression",val:(progression>=0?"+":"")+progression.toFixed(1)+"%",sub:"BK: "+bankroll.toFixed(0)+"$",col:progression>=0?"#34D399":"#F87171"},
                {label:"Profit Net",val:(totalProfit>=0?"+":"")+totalProfit.toFixed(0)+"$",sub:"ROI "+roi.toFixed(1)+"%",col:totalProfit>=0?"#34D399":"#F87171"},
              ].map(k=>(
                <div key={k.label} className="card" style={{padding:"11px 12px"}}>
                  <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{k.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:k.col||"#F1F5F9"}}>{k.val}</div>
                  <div style={{fontSize:9,color:"#334155",marginTop:1}}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
              <button onClick={()=>setShowCal(true)} style={{background:"#0D1220",border:"1px solid #1A2535",borderRadius:12,padding:"13px",color:"#E2E8F0",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                Calendrier
              </button>
              <button onClick={()=>setView("filtres")} style={{background:"#0D1220",border:"1px solid #1A2535",borderRadius:12,padding:"13px",color:"#E2E8F0",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                Filtres
              </button>
            </div>

            {(currentStreak>1||bestMonth)&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
                {currentStreak>1&&(
                  <div className="card" style={{padding:"11px 12px",border:"1px solid "+(streakType==="won"?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)")}}>
                    <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Serie actuelle</div>
                    <div style={{fontSize:20,fontWeight:700,color:streakType==="won"?"#34D399":"#F87171"}}>
                      {currentStreak}
                    </div>
                    <div style={{fontSize:9,color:"#475569",marginTop:1}}>{streakType==="won"?"victoires de suite":"defaites de suite"}</div>
                  </div>
                )}
                {bestMonth&&(
                  <div className="card" style={{padding:"11px 12px"}}>
                    <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Meilleur mois</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#34D399"}}>+{bestMonth[1].toFixed(0)}$</div>
                    <div style={{fontSize:9,color:"#475569",marginTop:1}}>{bestMonth[0]}</div>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:11}}>Paris recents</div>
              {bets.length===0&&<div style={{color:"#334155",fontSize:13}}>Aucun pari</div>}
              {allSortedBets.slice(0,5).map(b=>(
                <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0F1824"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <GameLogo game={b.game} size={18}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:"#E2E8F0",textTransform:"capitalize"}}>{b.player}</div>
                      <div style={{fontSize:10,color:"#475569"}}>{b.description} - @{b.odds}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:b.status==="won"?"#34D399":b.status==="lost"?"#F87171":"#60A5FA"}}>
                      {b.status==="pending"?"@"+b.odds:(b.profit>=0?"+":"")+b.profit.toFixed(2)+"$"}
                    </div>
                    <div style={{fontSize:10,color:"#334155"}}>{toDateKey(b.datetime)}</div>
                  </div>
                </div>
              ))}
              {bets.length>5&&<div style={{textAlign:"center",marginTop:10}}>
                <button onClick={()=>setView("mesparis")} style={{background:"none",border:"none",color:"#6C5FF0",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
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
              <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,color:"#F1F5F9"}}>Mes Paris</div>
              <div style={{display:"flex",gap:6}}>
                {selectMode&&selectedIds.length>0&&(
                  <button onClick={()=>setBulkModal(true)}
                    style={{background:"linear-gradient(135deg,#00FFCC,#0EA5E9)",border:"none",borderRadius:7,padding:"5px 10px",color:"#070B13",fontWeight:700,fontSize:11,fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                    ✓ {selectedIds.length}
                  </button>
                )}
                <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds([]);}}
                  style={{background:selectMode?"rgba(0,255,204,0.08)":"transparent",border:"1px solid "+(selectMode?"#00FFCC":"#1A2535"),borderRadius:7,padding:"5px 10px",color:selectMode?"#00FFCC":"#475569",fontWeight:600,fontSize:11,fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                  {selectMode?"Annuler":"Sél."}
                </button>
              </div>
            </div>

            {/* Quick status filter */}
            {(()=>{
              const tabs=[
                {k:"all",label:"Tous",count:bets.length},
                {k:"pending",label:"⏳ Attente",count:bets.filter(b=>b.status==="pending").length},
                {k:"won",label:"✓ Gagnés",count:bets.filter(b=>b.status==="won").length},
                {k:"lost",label:"✗ Perdus",count:bets.filter(b=>b.status==="lost").length},
              ];
              return(
                <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
                  {tabs.map(t=>(
                    <button key={t.k} onClick={()=>setMpFilter(t.k)}
                      style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid "+(mpFilter===t.k?"#00FFCC":"#1A2535"),background:mpFilter===t.k?"rgba(0,255,204,0.06)":"#0D1220",color:mpFilter===t.k?"#00FFCC":"#475569",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                      {t.label}{t.count>0?<span style={{opacity:.6}}> ({t.count})</span>:null}
                    </button>
                  ))}
                </div>
              );
            })()}

            {bets.length===0&&<div style={{color:"#334155",fontSize:14,padding:20,textAlign:"center"}}>Aucun pari enregistré</div>}

            {monthKeys.slice(0,visibleMonths).map(mk=>{
              const monthDays=byMonth[mk];
              const filteredMonthBets=monthDays.flatMap(dk=>byDay[dk]).filter(b=>mpFilter==="all"||b.status===mpFilter);
              if(filteredMonthBets.length===0)return null;
              const monthP=filteredMonthBets.filter(b=>b.status!=="pending").reduce((s,b)=>s+b.profit,0);
              const monthTotal=filteredMonthBets.length;
              const isCollapsed=!!collapsedMonths[mk];
              const toggleMonth=()=>setCollapsedMonths(c=>({...c,[mk]:!c[mk]}));
              return(
                <div key={mk} style={{marginBottom:10}}>
                  {/* ── BIG MONTH HEADER — cliquable ── */}
                  <button onClick={toggleMonth} style={{width:"100%",background:isCollapsed?"#0D1220":"linear-gradient(135deg,#0F1829 0%,#111D30 100%)",border:"1px solid "+(isCollapsed?"#1A2535":"#1E3050"),borderRadius:14,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:isCollapsed?0:2,transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:18,fontWeight:800,color:"#F1F5F9",textTransform:"uppercase",letterSpacing:1}}>{fmtMonthFR(mk+"-01")}</span>
                      <span style={{fontSize:11,color:"#334155",fontWeight:500}}>{monthTotal} paris</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:16,fontWeight:800,color:monthP>=0?"#34D399":"#F87171"}}>{monthP>=0?"+":""}{monthP.toFixed(0)}$</span>
                      <span style={{color:"#334155",fontSize:13,transition:"transform .2s",display:"inline-block",transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)"}}>▾</span>
                    </div>
                  </button>

                  {/* ── DAYS — only when expanded ── */}
                  {!isCollapsed&&(
                    <div style={{borderRadius:"0 0 12px 12px",overflow:"hidden",border:"1px solid #1A2535",borderTop:"none"}}>
                    {monthDays.map((dk,di)=>{
                      const dayBetsAll=byDay[dk];
                      const dayBets=mpFilter==="all"?dayBetsAll:dayBetsAll.filter(b=>b.status===mpFilter);
                      if(dayBets.length===0)return null;
                      const dayP=dayBets.filter(b=>b.status!=="pending").reduce((s,b)=>s+b.profit,0);
                      const hasSt=dayBets.some(b=>b.status!=="pending");
                      const allDaySelected=dayBets.every(b=>selectedIds.includes(b.id));
                      return(
                        <div key={dk} style={{borderTop:di>0?"1px solid #0A0F1A":"none"}}>
                          {/* ── Day header — bigger, white ── */}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px 7px",background:"#0A0E1C"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              {selectMode&&<button onClick={()=>setSelectedIds(ids=>allDaySelected?ids.filter(id=>!dayBets.map(b=>b.id).includes(id)):[...new Set([...ids,...dayBets.map(b=>b.id)])])} style={{width:16,height:16,borderRadius:4,border:"1.5px solid "+(allDaySelected?"#00FFCC":"#334155"),background:allDaySelected?"rgba(0,255,204,0.1)":"transparent",cursor:"pointer"}}/>}
                              <span style={{fontSize:13,fontWeight:700,color:"#E2E8F0",letterSpacing:.3}}>{fmtDayFR(dk)}</span>
                            </div>
                            {hasSt&&<span style={{fontSize:12,fontWeight:700,color:dayP>=0?"#34D399":"#F87171"}}>{dayP>=0?"+":""}{dayP.toFixed(0)}$</span>}
                          </div>
                          {/* ── Bets ── */}
                          {dayBets.map(b=>(
                            selectMode
                              ?<BetRowSelectable key={b.id} bet={b} selected={selectedIds.includes(b.id)} onToggle={()=>setSelectedIds(ids=>ids.includes(b.id)?ids.filter(x=>x!==b.id):[...ids,b.id])} onEdit={()=>setEditingBet({...b})}/>
                              :<BetRow key={b.id} bet={b} onStatus={updateStatus} onDelete={deleteBet} onDuplicate={duplicateBet} onEdit={()=>setEditingBet({...b})}/>
                          ))}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}
            {monthKeys.length>visibleMonths&&(
              <button onClick={()=>setVisibleMonths(v=>v+3)} style={{width:"100%",padding:"13px",background:"#0D1220",border:"1px solid #1A2535",borderRadius:12,color:"#64748B",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:13,marginTop:4}}>
                ↓ Voir {Math.min(3,monthKeys.length-visibleMonths)} mois de plus ({monthKeys.length-visibleMonths} restants)
              </button>
            )}
          </div>
        )}

        {/* ── FILTRES ── */}
        {view==="filtres"&&(
          <div className="view-enter">
            <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Filtres</div>
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
              <span className="add-label">Statut</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {["All","pending","won","lost"].map(s=>(
                  <button key={s} className={"fchip "+(fStatus===s?"on":"")} onClick={()=>setFStatus(s)}>
                    {s==="All"?"Tous":STATUS_CFG[s]?STATUS_CFG[s].label:s}
                  </button>
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
              {fPlayer&&<button onClick={()=>setFPlayer("")} style={{position:"absolute",right:24,bottom:22,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16}}>x</button>}
            </div>
            <div className="add-card">
              <span className="add-label">Type de pari</span>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <button className={"fchip "+(fLive?"on":"")} onClick={()=>setFLive(v=>!v)} style={{display:"flex",alignItems:"center",gap:5}}>
                  🔴 Live
                </button>
                <button className={"fchip "+(fHeadshot?"on":"")} onClick={()=>setFHeadshot(v=>!v)} style={{display:"flex",alignItems:"center",gap:5}}>
                  💀 Headshot
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:9,marginBottom:14}}>
              <button onClick={()=>{setFGames([]);setFBKs([]);setFPlayer("");setFStatus("All");setFOverUnder("All");setFLive(false);setFHeadshot(false);setFiltresPage(1);}} style={{flex:1,padding:"11px",background:"#0D1220",border:"1px solid #1A2535",borderRadius:10,color:"#64748B",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:13}}>
                Reinitialiser
              </button>
            </div>
            {(()=>{
              const fs=filteredBets;
              const fw=fs.filter(b=>b.status==="won").length;
              const fp=fs.filter(b=>b.status!=="pending").reduce((s,b)=>s+b.profit,0);
              return(
                <div style={{display:"flex",gap:9,marginBottom:14}}>
                  <div className="card" style={{flex:1,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#475569",marginBottom:2}}>{fs.length} paris</div>
                    <div style={{fontSize:15,fontWeight:700,color:fp>=0?"#34D399":"#F87171"}}>{fp>=0?"+":""}{fp.toFixed(0)}$</div>
                  </div>
                  <div className="card" style={{flex:1,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#475569",marginBottom:2}}>Win Rate</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#E2E8F0"}}>{fs.length>0?(fw/fs.length*100).toFixed(0):0}%</div>
                  </div>
                </div>
              );
            })()}
            <div className="stat-bloc">
              {filteredBets.length===0&&<div style={{padding:"18px 15px",color:"#334155",fontSize:13}}>Aucun pari</div>}
              {filteredBets.slice(0,(filtresPage)*FILTRES_PER_PAGE).map(b=>(
                <BetRow key={b.id} bet={b} onStatus={updateStatus} onDelete={deleteBet} onDuplicate={duplicateBet} onEdit={()=>setEditingBet({...b})}/>
              ))}
            </div>
            {filteredBets.length>filtresPage*FILTRES_PER_PAGE&&(
              <button onClick={()=>setFiltresPage(p=>p+1)} style={{width:"100%",padding:"13px",background:"#0D1220",border:"1px solid #1A2535",borderRadius:12,color:"#64748B",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,fontSize:13,marginTop:8}}>
                Voir {filteredBets.length-filtresPage*FILTRES_PER_PAGE} paris de plus
              </button>
            )}
          </div>
        )}


        {/* ── ADD BET ── */}
        {view==="add"&&(
          <div className="view-enter">
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",textTransform:"uppercase",letterSpacing:1}}>
                {sessionMode?"Session multi-map":"Ajouter pari"}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {/* LIVE toggle */}
                <button onClick={()=>setForm(f=>({...f,isLive:!f.isLive}))}
                  style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid "+(form.isLive?"#FF4757":"#1C2040"),background:form.isLive?"rgba(255,71,87,0.12)":"transparent",color:form.isLive?"#FF4757":"#475569",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"Inter,sans-serif",letterSpacing:.5}}>
                  {form.isLive?"🔴 LIVE":"LIVE"}
                </button>
                <button onClick={()=>setSessionMode(v=>!v)}
                  style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+(sessionMode?"#00FFCC":"#1A2535"),background:sessionMode?"rgba(0,255,204,0.08)":"transparent",color:sessionMode?"#00FFCC":"#475569",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  {sessionMode?"Session ✓":"Session"}
                </button>
              </div>
            </div>

            {/* ── JOUEUR ── */}
            <div className="add-card" style={{marginBottom:8}}>
              <span className="add-label">Joueur</span>
              <PlayerAC value={form.player} onChange={v=>setForm(f=>({...f,player:v,autoInfo:findPlayer(v)}))} allPlayers={allPlayers}/>
              {form.autoInfo&&(
                <div style={{marginTop:8,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <GameLogo game={form.autoInfo.game} size={14}/>
                  <span style={{fontSize:11,fontWeight:700,color:GAME_CFG[form.autoInfo.game]?.accent||"#94A3B8"}}>{form.autoInfo.game}</span>
                  <span style={{fontSize:11,color:"#475569"}}>·</span>
                  <span style={{fontSize:11,color:"#64748B"}}>{form.autoInfo.team}</span>
                  <span style={{fontSize:11,color:"#475569"}}>·</span>
                  <span style={{fontSize:11,color:"#475569"}}>{form.autoInfo.role}</span>
                  {form.autoInfo.game==="CS2"&&(
                    <div onClick={()=>setForm(f=>({...f,isHeadshot:!f.isHeadshot,description:""}))}
                      style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"3px 8px",borderRadius:6,border:"1px solid "+(form.isHeadshot?"rgba(75,111,212,0.5)":"#1C2040"),background:form.isHeadshot?"rgba(75,111,212,0.1)":"transparent"}}>
                      <span style={{fontSize:10,fontWeight:600,color:form.isHeadshot?"#818CF8":"#475569"}}>HS</span>
                      <div style={{width:28,height:15,borderRadius:8,background:form.isHeadshot?"#4B6FD4":"#1C2040",position:"relative",transition:"background .2s"}}>
                        <div style={{width:11,height:11,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:form.isHeadshot?15:2,transition:"left .2s"}}/>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {form.player&&!form.autoInfo&&<div style={{marginTop:5,fontSize:10,color:"#F59E0B"}}>Joueur non reconnu — enregistrement possible.</div>}
            </div>

            {/* ── OVER/UNDER + DESCRIPTION en une seule card ── */}
            <div className="add-card" style={{marginBottom:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                <button className={"ou-btn over"+(form.overUnder==="Over"?" on":"")} onClick={()=>setForm(f=>({...f,overUnder:"Over",description:""}))}>Over</button>
                <button className={"ou-btn under"+(form.overUnder==="Under"?" on":"")} onClick={()=>setForm(f=>({...f,overUnder:"Under",description:""}))}>Under</button>
              </div>
              {form.autoInfo&&(()=>{
                const game=form.autoInfo.game;
                let opts=[];
                if(form.isHeadshot) opts=Array.from({length:10},(_,i)=>(i+4.5).toFixed(1)+" Headshots");
                else if(game==="LoL") opts=Array.from({length:15},(_,i)=>(i+0.5).toFixed(1)+" Kills");
                else if(game==="CS2") opts=Array.from({length:12},(_,i)=>(i+9.5).toFixed(1)+" Kills");
                else if(game==="Dota2") opts=Array.from({length:11},(_,i)=>(i+2.5).toFixed(1)+" Kills");
                else if(game==="Valorant") opts=Array.from({length:12},(_,i)=>(i+9.5).toFixed(1)+" Kills");
                return opts.length>0?(
                  <select className="add-ifield" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{height:42,marginBottom:6}}>
                    <option value="">Choisir une ligne...</option>
                    {opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                ):null;
              })()}
              <input className="add-ifield" placeholder="ex: 4.5 Kills, 2+ Assists..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{height:40}}/>
            </div>

            {/* ── COTE + MISE ── */}
            {!sessionMode&&(
              <div className="add-card" style={{marginBottom:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <span className="add-label">Cote</span>
                    <NumPad value={form.odds} onChange={v=>setForm(f=>({...f,odds:v}))} placeholder="1.85" step="0.01"/>
                  </div>
                  <div>
                    <span className="add-label">Mise ($)</span>
                    <NumPad value={form.stake} onChange={v=>setForm(f=>({...f,stake:v}))} placeholder="50" step="1"/>
                  </div>
                </div>
                {/* Quick stakes */}
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:form.odds&&form.stake?6:0}}>
                  {QUICK_STAKES.map(s=>(
                    <button key={s} onClick={()=>setForm(f=>({...f,stake:String(s)}))}
                      style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid "+(parseFloat(form.stake)===s?"#6C5FF0":"#1C2040"),background:parseFloat(form.stake)===s?"rgba(108,95,240,0.12)":"#080B18",color:parseFloat(form.stake)===s?"#A89EF8":"#475569",fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,flex:1}}>
                      {s}$
                    </button>
                  ))}
                </div>
                {form.odds&&form.stake&&(
                  <div style={{textAlign:"center",fontSize:12,color:"#475569",paddingTop:4,borderTop:"1px solid #0F1824"}}>
                    Gain potentiel: <span style={{color:"#34D399",fontWeight:700}}>+{(parseFloat(form.stake||0)*(parseFloat(form.odds||1)-1)).toFixed(2)}$</span>
                  </div>
                )}
              </div>
            )}

            {/* ── SESSION MAPS ── */}
            {sessionMode&&(
              <div className="add-card" style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span className="add-label" style={{margin:0}}>Maps</span>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <span className="add-label" style={{margin:0}}>Mise défaut:</span>
                    {QUICK_STAKES.map(s=>(
                      <button key={s} onClick={()=>setForm(f=>({...f,stake:String(s)}))}
                        style={{padding:"3px 7px",borderRadius:5,border:"1px solid "+(parseFloat(form.stake)===s?"#6C5FF0":"#1C2040"),background:parseFloat(form.stake)===s?"rgba(108,95,240,0.12)":"#080B18",color:parseFloat(form.stake)===s?"#A89EF8":"#475569",fontSize:10,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}>
                        {s}$
                      </button>
                    ))}
                  </div>
                </div>
                {sessionMaps.map((m,i)=>(
                  <div key={i} style={{padding:"9px 10px",borderRadius:9,border:"1.5px solid "+(m.enabled?"#1C2040":"#0A0D1A"),background:m.enabled?"#080B18":"#05060F",marginBottom:6,opacity:m.enabled?1:0.4}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:m.enabled?7:0}}>
                      <span style={{fontWeight:700,fontSize:12,color:m.enabled?"#C4BEF8":"#4A5080"}}>Map {i+1}</span>
                      <button onClick={()=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,enabled:!x.enabled}:x))}
                        style={{background:"none",border:"none",color:m.enabled?"#6C5FF0":"#334155",fontSize:11,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,padding:"2px 6px"}}>
                        {m.enabled?"ON":"OFF"}
                      </button>
                    </div>
                    {m.enabled&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                        <NumPad value={m.odds} onChange={v=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,odds:v}:x))} placeholder="Cote" step="0.01"/>
                        <NumPad value={m.stake} onChange={v=>setSessionMaps(ms=>ms.map((x,j)=>j===i?{...x,stake:v}:x))} placeholder={form.stake||"Mise"} step="1"/>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={()=>setSessionMaps(ms=>[...ms,{...EMPTY_MAP_ROW}])} style={{background:"none",border:"1px dashed #1C2040",borderRadius:7,padding:"5px 10px",color:"#4A5080",cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif",width:"100%"}}>
                  + Ajouter map
                </button>
              </div>
            )}

            {/* ── BOOKMAKER ── */}
            <div className="add-card" style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                <span className="add-label" style={{margin:0}}>Bookmaker</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setStickyBK(v=>!v)} style={{background:stickyBK?"rgba(0,255,204,0.08)":"none",border:"1px solid "+(stickyBK?"#00FFCC":"#1C2040"),borderRadius:5,padding:"3px 8px",color:stickyBK?"#00FFCC":"#475569",fontSize:10,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}>
                    {stickyBK?"📌 Fixé":"Garder"}
                  </button>
                  <button onClick={()=>setModalBK(true)} style={{background:"none",border:"1px solid #1C2040",borderRadius:5,padding:"3px 8px",color:"#4A5080",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"Inter,sans-serif"}}>
                    + Nouveau
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {bookmakers.map(bk=>(
                  <button key={bk} className={"bkchip"+(form.bookmaker===bk?" on":"")} onClick={()=>setForm(f=>({...f,bookmaker:f.bookmaker===bk?"":bk}))}
                    style={{padding:"6px 10px",fontSize:12}}>
                    {BK_LOGOS[bk]&&<img src={BK_LOGOS[bk]} alt={bk} style={{width:15,height:15,borderRadius:3,objectFit:"cover",marginRight:4,verticalAlign:"middle"}}/>}
                    {bk}
                  </button>
                ))}
              </div>
            </div>

            {/* ── MAP TAG + DATE + STATUT en une card ── */}
            <div className="add-card" style={{marginBottom:10}}>
              {/* Map tag + Statut only - no date */}
              <div style={{marginBottom:10}}>
                <span className="add-label">Map</span>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {MAP_TAGS.map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,mapTag:f.mapTag===t?"":t}))}
                      style={{padding:"4px 9px",borderRadius:6,border:"1.5px solid "+(form.mapTag===t?"#6C5FF0":"#1C2040"),background:form.mapTag===t?"rgba(108,95,240,0.12)":"#080B18",color:form.mapTag===t?"#A89EF8":"#475569",fontSize:11,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Statut */}
              <div>
                <span className="add-label">Statut</span>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {["pending","won","lost"].map(s=>(
                    <button key={s} onClick={()=>setForm(f=>({...f,status:s}))}
                      style={{padding:"8px 0",borderRadius:8,border:"1.5px solid "+(form.status===s?STATUS_CFG[s].color+"66":"#1C2040"),background:form.status===s?STATUS_CFG[s].bg:"#080B18",color:form.status===s?STATUS_CFG[s].color:"#475569",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={sessionMode?addSession:addBet}
              disabled={!form.player||(sessionMode?!sessionMaps.some(m=>m.enabled&&m.odds):(!form.odds||!form.stake))}
              style={{width:"100%",padding:"14px",background:(!form.player||(sessionMode?!sessionMaps.some(m=>m.enabled&&m.odds):(!form.odds||!form.stake)))?"#1C2040":"linear-gradient(135deg,#6C5FF0,#0EA5E9)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",letterSpacing:.5,marginBottom:8}}>
              {sessionMode?"Enregistrer session ("+sessionMaps.filter(m=>m.enabled&&m.odds).length+" maps)":"✓ Enregistrer"}
            </button>
          </div>
        )}


        {/* ── STATS ── */}
        {view==="statistiques"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Statistiques</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={exportCSV} style={{background:"#0D1220",border:"1px solid #1A2535",borderRadius:7,padding:"6px 10px",color:"#64748B",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600}}>
                  CSV
                </button>
                <button onClick={exportJSON} style={{background:"rgba(0,255,204,0.06)",border:"1px solid rgba(0,255,204,0.2)",borderRadius:7,padding:"6px 10px",color:"#00FFCC",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:700}}>
                  💾 Backup
                </button>
                <label style={{background:"#0D1220",border:"1px solid #1A2535",borderRadius:7,padding:"6px 10px",color:"#64748B",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:11,fontWeight:600}}>
                  📂 Import
                  <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importJSON(e.target.files[0]);e.target.value="";}}/>
                </label>
              </div>
            </div>

            {settled.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
                <div className="card" style={{padding:"12px"}}>
                  <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Série actuelle</div>
                  <div style={{fontSize:28,fontWeight:800,color:currentStreak>1?(streakType==="won"?"#34D399":"#F87171"):"#475569",lineHeight:1}}>{currentStreak>1?currentStreak:"-"}</div>
                  <div style={{fontSize:9,color:"#475569",marginTop:3}}>{currentStreak>1?(streakType==="won"?"✓ victoires":"✗ défaites")+" de suite":"Pas de série"}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {bestMonth&&<div className="card" style={{padding:"10px 12px",flex:1}}>
                    <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Meilleur mois</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#34D399"}}>+{bestMonth[1].toFixed(0)}$</div>
                    <div style={{fontSize:9,color:"#475569"}}>{bestMonth[0]}</div>
                  </div>}
                  {worstMonth&&worstMonth[1]<0&&<div className="card" style={{padding:"10px 12px",flex:1}}>
                    <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Pire mois</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#F87171"}}>{worstMonth[1].toFixed(0)}$</div>
                    <div style={{fontSize:9,color:"#475569"}}>{worstMonth[0]}</div>
                  </div>}
                </div>
              </div>
            )}

            {(liveStats.count>0||hsStats.count>0)&&(
              <>
                <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Live & Headshot</div>
                <div className="stat-bloc" style={{marginBottom:16}}>
                  {liveStats.count>0&&(
                    <div className="stat-row">
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <span style={{fontSize:16}}>🔴</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:"#FF4757"}}>Paris Live</div>
                          <div style={{fontSize:10,color:"#475569"}}>{liveStats.count} paris · {liveStats.wr.toFixed(0)}% WR · ROI {liveStats.roi>=0?"+":""}{liveStats.roi.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:700,fontSize:14,color:liveStats.profit>=0?"#34D399":"#F87171"}}>{liveStats.profit>=0?"+":""}{liveStats.profit.toFixed(0)}$</div>
                        <div style={{fontSize:10,color:"#475569"}}>{liveStats.won}/{liveStats.count} gagnés</div>
                      </div>
                    </div>
                  )}
                  {hsStats.count>0&&(
                    <div className="stat-row">
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <span style={{fontSize:16}}>💀</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:"#818CF8"}}>Paris Headshot</div>
                          <div style={{fontSize:10,color:"#475569"}}>{hsStats.count} paris · {hsStats.wr.toFixed(0)}% WR · ROI {hsStats.roi>=0?"+":""}{hsStats.roi.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:700,fontSize:14,color:hsStats.profit>=0?"#34D399":"#F87171"}}>{hsStats.profit>=0?"+":""}{hsStats.profit.toFixed(0)}$</div>
                        <div style={{fontSize:10,color:"#475569"}}>{hsStats.won}/{hsStats.count} gagnés</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {topPlayers.length>0&&(
              <>
                <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Top joueurs</div>
                <div className="stat-bloc" style={{marginBottom:16}}>
                  {topPlayers.map((p,i)=>{
                    const wr=p.count>0?(p.won/p.count*100).toFixed(0):0;
                    const gc=GAME_CFG[p.game]||{accent:"#94A3B8"};
                    return(
                      <div key={p.player} className="stat-row">
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:12,color:"#334155",fontWeight:700,width:16}}>{i+1}</span>
                          <GameLogo game={p.game} size={16}/>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:"#F1F5F9",textTransform:"capitalize"}}>{p.player}</div>
                            <div style={{fontSize:10,color:"#475569"}}>{p.count} paris - {wr}% WR</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:700,fontSize:14,color:p.profit>=0?"#34D399":"#F87171"}}>{p.profit>=0?"+":""}{p.profit.toFixed(0)}$</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Par jeu</div>
            <div className="stat-bloc" style={{marginBottom:16}}>
              {ALL_GAMES.map(game=>{
                const s=gStats[game];
                const gc=GAME_CFG[game]||{accent:"#94A3B8"};
                if(!s)return(
                  <div key={game} className="stat-row">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <GameLogo game={game} size={20}/>
                      <span style={{fontWeight:600,fontSize:14,color:"#475569"}}>{game}</span>
                    </div>
                    <span style={{fontSize:12,color:"#334155"}}>Aucun pari</span>
                  </div>
                );
                const wr=s.count>0?(s.won/s.count*100).toFixed(0):0;
                const gameROI=s.staked>0?((s.profit/s.staked)*100):0;
                const avgOdds=s.count>0?(s.oddsSum/s.count).toFixed(2):0;
                return(
                  <div key={game} className="stat-row">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <GameLogo game={game} size={22}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:gc.accent}}>{game}</div>
                        <div style={{fontSize:10,color:"#475569"}}>{s.count} paris - {wr}% WR - @{avgOdds}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,fontSize:14,color:s.profit>=0?"#34D399":"#F87171"}}>{s.profit>=0?"+":""}{s.profit.toFixed(2)}$</div>
                      <div style={{fontSize:10,color:gameROI>=0?"#34D399":"#F87171"}}>{gameROI>=0?"+":""}{gameROI.toFixed(1)}% ROI</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Par bookmaker</div>
            <div className="stat-bloc" style={{marginBottom:14}}>
              {bkStatsSorted.length===0&&<div style={{padding:"18px 15px",color:"#334155",fontSize:13}}>Aucune donnee</div>}
              {bkStatsSorted.map(([bk,s])=>{
                const wr=s.count>0?(s.won/s.count*100).toFixed(0):0;
                const bkROI=s.staked>0?((s.profit/s.staked)*100):0;
                const avgOdds=s.count>0?(s.oddsSum/s.count).toFixed(2):0;
                return(
                  <div key={bk} className="stat-row">
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      {BK_LOGOS[bk]&&<img src={BK_LOGOS[bk]} alt={bk} style={{width:22,height:22,borderRadius:5,objectFit:"cover"}}/>}
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#E2E8F0"}}>{bk}</div>
                        <div style={{fontSize:10,color:"#475569"}}>{s.count} paris - {wr}% WR - @{avgOdds}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,fontSize:14,color:s.profit>=0?"#34D399":"#F87171"}}>{s.profit>=0?"+":""}{s.profit.toFixed(2)}$</div>
                      <div style={{fontSize:10,color:bkROI>=0?"#34D399":"#F87171"}}>{bkROI>=0?"+":""}{bkROI.toFixed(1)}% ROI</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(mapStats.global).length>0&&(
              <>
                <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Par map</div>
                <div className="stat-bloc" style={{marginBottom:14}}>
                  {mapStats.sortTags(Object.keys(mapStats.global)).map(tag=>{
                    const s=mapStats.global[tag];
                    const wr=s.count>0?(s.won/s.count*100):0;
                    const roi=s.staked>0?(s.profit/s.staked*100):0;
                    const barW=Math.min(100,Math.abs(roi)*2);
                    return(
                      <div key={tag} className="stat-row" style={{flexDirection:"column",alignItems:"stretch",gap:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <span style={{fontWeight:700,fontSize:14,color:"#E2E8F0"}}>{tag}</span>
                            <span style={{fontSize:10,color:"#475569",marginLeft:8}}>{s.count} paris - {wr.toFixed(0)}% WR</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700,fontSize:14,color:s.profit>=0?"#34D399":"#F87171"}}>{s.profit>=0?"+":""}{s.profit.toFixed(0)}$</div>
                            <div style={{fontSize:10,color:roi>=0?"#34D399":"#F87171"}}>{roi>=0?"+":""}{roi.toFixed(1)}% ROI</div>
                          </div>
                        </div>
                        <div style={{height:4,background:"#1C2040",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:2,width:barW+"%",background:roi>=0?"linear-gradient(90deg,#34D399,#0EA5E9)":"linear-gradient(90deg,#F87171,#EF4444)"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── JOUEURS ── */}
        {view==="players"&&(
          <div className="view-enter">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Base de joueurs</div>
                <div style={{fontSize:11,color:"#475569",marginTop:2}}>{STATIC_PLAYERS_COUNT} precharges + {customCount} perso</div>
              </div>
              <button onClick={()=>setModalPlayer(true)} style={{background:"linear-gradient(135deg,#00FFCC,#0EA5E9)",border:"none",borderRadius:8,padding:"7px 14px",color:"#070B13",fontWeight:700,fontSize:13,fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                + Ajouter
              </button>
            </div>
            {customCount>0&&(
              <>
                <div style={{fontSize:12,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Mes joueurs</div>
                <div className="stat-bloc" style={{marginBottom:14}}>
                  {customEntries.map(([key,p])=>(
                    <div key={key} className="stat-row">
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <GameLogo game={p.game} size={20}/>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:"#F1F5F9",textTransform:"capitalize"}}>{key}</div>
                          <div style={{fontSize:10,color:"#475569"}}>{p.team} - {p.role}</div>
                        </div>
                      </div>
                      <button onClick={()=>setCustom(c=>{const n={...c};delete n[key];return n;})} style={{background:"none",border:"1px solid #1A2535",borderRadius:5,padding:"4px 8px",color:"#F87171",cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{fontSize:11,color:"#334155",textAlign:"center",padding:16}}>
              Appuie sur + Ajouter pour ajouter un joueur personnalise.
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#060A10",borderTop:"1px solid #1A2535",display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:50}}>
          {NAV.map(n=>(
            <button key={n.id} className={"navitem "+(view===n.id?"on":"")} onClick={()=>setView(n.id)}>
              <span style={{fontSize:18}}>{n.icon}</span>
              <span className="lbl">{n.label}</span>
            </button>
          ))}
        </div>

        {/* ── CALENDRIER MODAL ── */}
        {showCal&&(
          <div className="moverlay" onClick={()=>{setShowCal(false);setCalSelected(null);}}>
            <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <button onClick={()=>{let m=calMonth-1,y=calYear;if(m<0){m=11;y--;}setCalMonth(m);setCalYear(y);setCalSelected(null);}} style={{background:"none",border:"1px solid #1A2535",borderRadius:7,padding:"6px 12px",color:"#94A3B8",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700}}>Prev</button>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700}}>{FR_MONTHS[calMonth]} {calYear}</div>
                  <div style={{fontSize:11,color:monthProfit>=0?"#34D399":"#F87171",fontWeight:600}}>{monthProfit>=0?"+":""}{monthProfit.toFixed(2)}$</div>
                </div>
                <button onClick={()=>{let m=calMonth+1,y=calYear;if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);setCalSelected(null);}} style={{background:"none",border:"1px solid #1A2535",borderRadius:7,padding:"6px 12px",color:"#94A3B8",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700}}>Suiv</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
                {FR_DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:"#475569",fontWeight:600,padding:"3px 0",textTransform:"uppercase"}}>{d}</div>)}
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
                        <div style={{fontSize:12,fontWeight:isToday?700:500,color:isToday?"#00FFCC":(hasSettled||pending)?"#E2E8F0":"#334155"}}>{d}</div>
                        {hasSettled&&<div style={{fontSize:8,fontWeight:700,color:profit>=0?"#34D399":"#F87171",lineHeight:1}}>{profit>=0?"+":""}{profit>=1000?(profit/1000).toFixed(1)+"k":profit.toFixed(0)}$</div>}
                        {pending>0&&!hasSettled&&<div style={{width:4,height:4,borderRadius:"50%",background:"#60A5FA",marginTop:1}}/>}
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
                    <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>
                      {calSelected.split("-").reverse().join("/")} - {selectedDayBets.length} pari{selectedDayBets.length!==1?"s":""}
                      {dp!==undefined&&<span style={{marginLeft:8,fontWeight:700,color:dp>=0?"#34D399":"#F87171"}}>{dp>=0?"+":""}{dp.toFixed(2)}$</span>}
                    </div>
                    <div className="stat-bloc">
                      {selectedDayBets.map(b=>(
                        <div key={b.id} style={{padding:"10px 12px",borderBottom:"1px solid #0F1824",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <GameLogo game={b.game} size={16}/>
                            <div>
                              <div style={{fontWeight:600,fontSize:13,textTransform:"capitalize"}}>{b.player}</div>
                              <div style={{fontSize:10,color:"#475569"}}>{b.description}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700,fontSize:13,color:b.status==="won"?"#34D399":b.status==="lost"?"#F87171":"#60A5FA"}}>
                              {b.status==="pending"?"@"+b.odds:(b.profit>=0?"+":"")+b.profit.toFixed(2)+"$"}
                            </div>
                            <div style={{fontSize:10,color:STATUS_CFG[b.status]?STATUS_CFG[b.status].color:"#475569"}}>{STATUS_CFG[b.status]?STATUS_CFG[b.status].label:b.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <button onClick={()=>{setShowCal(false);setCalSelected(null);}} style={{width:"100%",marginTop:14,padding:"12px",background:"#1A2535",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>Fermer</button>
            </div>
          </div>
        )}

        {/* ── BULK MODAL ── */}
        {bulkModal&&(
          <div className="moverlay" onClick={()=>{setBulkModal(false);setBulkDatetime("");}}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Modifier {selectedIds.length} paris</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:8}}>Statut</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  {["won","lost","pending"].map(s=>(
                    <button key={s} onClick={()=>applyBulkStatus(s)}
                      style={{padding:"11px 8px",borderRadius:9,border:"1.5px solid "+(STATUS_CFG[s]?STATUS_CFG[s].color+"44":"#1A2535"),background:STATUS_CFG[s]?STATUS_CFG[s].bg:"#0D1220",color:STATUS_CFG[s]?STATUS_CFG[s].color:"#E2E8F0",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                      {STATUS_CFG[s]?STATUS_CFG[s].label:s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:8}}>Bookmaker</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
                  {bookmakers.map(bk=>(
                    <button key={bk} className={"bkchip"+(bulkBK===bk?" on":"")} onClick={()=>setBulkBK(bk===bulkBK?"":bk)}
                      style={{border:"2px solid "+(bulkBK===bk?"#00FFCC":"#1A2535")}}>
                      {bk}
                    </button>
                  ))}
                </div>
                <button onClick={applyBulkBK} disabled={!bulkBK}
                  style={{width:"100%",padding:"11px",background:bulkBK?"linear-gradient(135deg,#00FFCC,#0EA5E9)":"#1A2535",border:"none",borderRadius:9,color:bulkBK?"#070B13":"#475569",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  {bulkBK?"Appliquer "+bulkBK+" à "+selectedIds.length+" paris":"Sélectionner un bookmaker"}
                </button>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:8}}>Date & heure</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
                  <input type="date" className="ifield" value={bulkDatetime?bulkDatetime.split("T")[0]:""} onChange={e=>{const d=e.target.value;const t=bulkDatetime?bulkDatetime.split("T")[1]||"12:00":"12:00";setBulkDatetime(d+"T"+t);}} style={{height:40}}/>
                  <input type="time" className="ifield" value={bulkDatetime?bulkDatetime.split("T")[1]||"":"12:00"} onChange={e=>{const t=e.target.value;const d=bulkDatetime?bulkDatetime.split("T")[0]:nowDT().split("T")[0];setBulkDatetime(d+"T"+t);}} style={{height:40}}/>
                </div>
                <button onClick={applyBulkDatetime} disabled={!bulkDatetime}
                  style={{width:"100%",padding:"11px",background:bulkDatetime?"linear-gradient(135deg,#6C5FF0,#0EA5E9)":"#1A2535",border:"none",borderRadius:9,color:bulkDatetime?"#fff":"#475569",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                  {bulkDatetime?"Appliquer la date à "+selectedIds.length+" paris":"Choisir une date"}
                </button>
              </div>
              <button onClick={()=>{setBulkModal(false);setBulkDatetime("");}} style={{width:"100%",padding:"11px",background:"#1A2535",border:"none",borderRadius:9,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>Annuler</button>
            </div>
          </div>
        )}

        {/* ── EDIT BET MODAL ── */}
        {editingBet&&(
          <div className="moverlay" onClick={()=>setEditingBet(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Modifier le pari</div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Statut</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  {["won","lost","pending"].map(s=>(
                    <button key={s} onClick={()=>setEditingBet(b=>({...b,status:s}))}
                      style={{padding:"10px 6px",borderRadius:8,border:"1.5px solid "+(editingBet.status===s?STATUS_CFG[s].color+"66":"#1A2535"),background:editingBet.status===s?STATUS_CFG[s].bg:"#080B18",color:editingBet.status===s?STATUS_CFG[s].color:"#475569",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Over / Under</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <button className={"ou-btn over"+((editingBet.overUnder||"Over")==="Over"?" on":"")} onClick={()=>setEditingBet(b=>({...b,overUnder:"Over"}))}>Over</button>
                  <button className={"ou-btn under"+(editingBet.overUnder==="Under"?" on":"")} onClick={()=>setEditingBet(b=>({...b,overUnder:"Under"}))}>Under</button>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Bookmaker</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {bookmakers.map(bk=>(
                    <button key={bk} className={"bkchip"+(editingBet.bookmaker===bk?" on":"")} onClick={()=>setEditingBet(b=>({...b,bookmaker:bk}))}>{bk}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Cote</div>
                  <NumPad value={String(editingBet.odds)} onChange={v=>setEditingBet(b=>({...b,odds:parseFloat(v)||b.odds}))} placeholder="Cote" step="0.01"/>
                </div>
                <div>
                  <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Mise</div>
                  <NumPad value={String(editingBet.stake)} onChange={v=>setEditingBet(b=>({...b,stake:parseFloat(v)||b.stake}))} placeholder="Mise" step="1"/>
                </div>
              </div>
              {editingBet.status!=="pending"&&(
                <div style={{textAlign:"center",marginBottom:8,fontSize:13,color:"#475569"}}>
                  Profit: <span style={{color:editingBet.status==="won"?"#34D399":"#F87171",fontWeight:700}}>
                    {editingBet.status==="won"?"+"+((editingBet.stake*(editingBet.odds-1)).toFixed(2))+"-"+parseFloat(editingBet.stake||0).toFixed(2)+"$":"-"+parseFloat(editingBet.stake||0).toFixed(2)+"$"}
                  </span>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setEditingBet(null)} style={{padding:"12px",background:"#1A2535",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>Annuler</button>
                <button onClick={()=>{
                  const newProfit=calcProfit(editingBet.status,editingBet.stake,editingBet.odds);
                  setBets(b=>b.map(bet=>bet.id===editingBet.id?{...editingBet,profit:newProfit}:bet));
                  setEditingBet(null);
                  showToast("Pari mis a jour");
                }} style={{padding:"12px",background:"linear-gradient(135deg,#00FFCC,#0EA5E9)",border:"none",borderRadius:10,color:"#070B13",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:14}}>
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL ADD BOOKMAKER ── */}
        {modalBK&&(
          <div className="moverlay" onClick={()=>setModalBK(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Nouveau bookmaker</div>
              <input className="ifield" placeholder="Nom du bookmaker..." value={newBK} onChange={e=>setNewBK(e.target.value)} style={{marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>{setModalBK(false);setNewBK("");}} style={{padding:"12px",background:"#1A2535",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Annuler</button>
                <button onClick={saveBookmaker} disabled={!newBK.trim()} style={{padding:"12px",background:newBK.trim()?"linear-gradient(135deg,#00FFCC,#0EA5E9)":"#1A2535",border:"none",borderRadius:10,color:newBK.trim()?"#070B13":"#475569",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Ajouter</button>
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
                <select className="ifield" value={pform.game} onChange={e=>setPform(p=>({...p,game:e.target.value}))}>
                  {ALL_GAMES.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <input className="ifield" placeholder="Ligue (opt.)" value={pform.league} onChange={e=>setPform(p=>({...p,league:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                <input className="ifield" placeholder="Role (opt.)" value={pform.role} onChange={e=>setPform(p=>({...p,role:e.target.value}))}/>
                <input className="ifield" placeholder="Equipe *" value={pform.team} onChange={e=>setPform(p=>({...p,team:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setModalPlayer(false)} style={{padding:"12px",background:"#1A2535",border:"none",borderRadius:10,color:"#94A3B8",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Annuler</button>
                <button onClick={savePlayer} disabled={!pform.name||!pform.team} style={{padding:"12px",background:pform.name&&pform.team?"linear-gradient(135deg,#00FFCC,#0EA5E9)":"#1A2535",border:"none",borderRadius:10,color:pform.name&&pform.team?"#070B13":"#475569",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Ajouter</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}