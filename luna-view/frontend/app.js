const R=Math.PI/180,$=s=>document.querySelector(s),H=3600000,D=24*H;
const SITES=[{n:"Shackleton crater rim",la:-89.9,lo:129.8},{n:"Connecting Ridge",la:-89.45,lo:-137.3},{n:"de Gerlache rim",la:-88.5,lo:-87.1},{n:"Faustini rim",la:-87.3,lo:77},{n:"Malapert massif",la:-85.99,lo:0.12},{n:"Custom",la:-88,lo:20}];
const TABS=[["overview","Overview"],["explorer","Lunar Explorer"],["solar","Solar"],["earth","Earth Tracker"],["timeline","Timeline"],["compare","Compare"],["resched","Rescheduling"],["assistant","Assistant"],["about","About & data"]];
const d0=new Date();d0.setUTCMinutes(0,0,0);
const S={site:0,t:d0.getTime(),mask:0,cur:0,B:{site:4,t:d0.getTime()+14*D},shift:7,play:false};
const jd=ms=>ms/D+2440587.5,wrap=a=>((a+180)%360+360)%360-180;
function geo(ms){const j=jd(ms),d=j-2451545,ph=(((j-2451550.26)/29.530588)%1+1)%1;
const ls=280.46+0.9856474*d,om=125.04-0.0529538*d,M=134.963+13.064993*d,F=93.272+13.22935*d;
return{sl:wrap(180-360*ph),sb:-1.54*Math.sin((ls-om)*R),el:-6.29*Math.sin(M*R),eb:-6.7*Math.sin(F*R)}}
function dirEl(la,lo,dl,db){const p=la*R,l=lo*R,a=db*R,b=dl*R;
const s=[Math.cos(a)*Math.cos(b),Math.cos(a)*Math.sin(b),Math.sin(a)],up=[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],
e=[-Math.sin(l),Math.cos(l),0],n=[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)];
const dot=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2];
return{el:Math.asin(Math.max(-1,Math.min(1,dot(s,up))))/R,az:(Math.atan2(dot(s,e),dot(s,n))/R+360)%360}}
const site=i=>SITES[i];
function at(s,ms){const g=geo(ms);return{sun:dirEl(s.la,s.lo,g.sl,g.sb),earth:dirEl(s.la,s.lo,g.el,g.eb),g}}
const cache={},API={on:false,llm:false,base:new URLSearchParams(location.search).get("api")||""},acache={},pend={};let SWEEP=false;
const skey=(s,t0)=>[s.la,s.lo,t0].join();
function ser(s,t0,days=30,step=2){const k=[s.la,s.lo,t0,days,step].join();
if(API.on&&!SWEEP&&days==30&&step==2){const a=acache[skey(s,t0)];if(a)return a;
if(!pend[k]){pend[k]=1;fetch(`${API.base}/api/series?lat=${s.la}&lon=${s.lo}&start=${new Date(t0).toISOString()}&days=30&step=2`).then(r=>r.ok?r.json():Promise.reject()).then(j=>{acache[skey(s,t0)]={sun:j.sun,ea:j.earth,n:j.sun.length,step:2,src:j.source};render()}).catch(()=>{})}}
if(cache[k])return cache[k];
const n=Math.round(days*24/step)+1,sun=[],ea=[];for(let i=0;i<n;i++){const r=at(s,t0+i*step*H);sun.push(r.sun.el);ea.push(r.earth.el)}
const o={sun,ea,n,step,src:"model"};if(Object.keys(cache).length>400)for(const x in cache)delete cache[x];return cache[k]=o}
function runs(a,m,step){let best=0,c=0;for(const v of a){if(v>m){c++;best=Math.max(best,c)}else c=0}return best*step/24}
function nextRise(a,m,step,from=0){for(let i=from+1;i<a.length;i++)if(a[i]>m&&a[i-1]<=m)return i*step;return null}
function stats(s,t0,m){const o=ser(s,t0),n=o.n;let a=0,b=0,c=0,mn=1e9,mx=-1e9;
for(let i=0;i<n;i++){const u=o.sun[i]>m,e=o.ea[i]>m;a+=u;b+=e;c+=u&&e;mn=Math.min(mn,o.sun[i]);mx=Math.max(mx,o.sun[i])}
const both=o.sun.map((v,i)=>v>m&&o.ea[i]>m?1:0);
return{o,sun:100*a/n,earth:100*b/n,both:100*c/n,earthRun:runs(o.ea,m,o.step),sunRun:runs(o.sun,m,o.step),bothRun:runs(both.map(x=>x-0.5),0,o.step),mn,mx,
sunRise:nextRise(o.sun,m,o.step),earthRise:nextRise(o.ea,m,o.step),sunSet:nextRise(o.sun.map(x=>-x),-m,o.step)}}
function at2(s,ms){const r=at(s,ms),o=acache[skey(s,S.t)];if(o&&ms>=S.t){const x=(ms-S.t)/(2*H),i=Math.min(Math.floor(x),o.n-2),f=x-i;if(i>=0){r.sun.el=o.sun[i]*(1-f)+o.sun[i+1]*f;r.earth.el=o.ea[i]*(1-f)+o.ea[i+1]*f}}return r}
const f1=x=>x.toFixed(1),fd=ms=>new Date(ms).toISOString().slice(0,16).replace("T"," ")+" UTC",
fo=(h,t0)=>h==null?"none in 30 d":fd(t0+h*H);
const cv=n=>getComputedStyle(document.documentElement).getPropertyValue("--"+n).trim();
function fit(c,h){const w=c.parentElement.clientWidth-(c.parentElement.classList.contains("card")?28:0)||300,r=devicePixelRatio||1;c.width=w*r;c.height=h*r;c.style.height=h+"px";const x=c.getContext("2d");x.setTransform(r,0,0,r,0,0);x.font="11px IBM Plex Mono,monospace";return[x,w,h]}
function sky(c,s,ms){const[x,w,h]=fit(c,230),m=S.mask,r=at2(s,ms),lo=-14,hi=26,Y=e=>h-18-(e-lo)/(hi-lo)*(h-30),X=a=>10+a/360*(w-20);
x.fillStyle=cv("ground");x.fillRect(0,Y(0),w,h);x.fillStyle="#FF7A7A22";if(m>0)x.fillRect(0,Y(m),w,Y(0)-Y(m));
x.strokeStyle=cv("line");x.fillStyle=cv("mute");x.beginPath();x.moveTo(0,Y(0));x.lineTo(w,Y(0));x.stroke();
[["N",0],["E",90],["S",180],["W",270]].forEach(([t,a])=>x.fillText(t,X(a),h-4));
[[r.sun,cv("au"),"Sun",12],[r.earth,cv("cy"),"Earth",9]].forEach(([p,col,t,rad])=>{x.fillStyle=col;x.globalAlpha=p.el>m?1:.4;x.beginPath();x.arc(X(p.az),Math.min(Math.max(Y(p.el),10),h-18),rad,0,7);x.fill();x.globalAlpha=1;x.fillStyle=cv("ink");x.fillText(t+" "+f1(p.el)+"°",Math.min(X(p.az)+rad+4,w-80),Math.min(Math.max(Y(p.el),10),h-18)-rad)});
x.fillStyle=cv("mute");x.fillText("elev "+lo+"° … "+hi+"° · az 0–360°",6,12)}
function map(c,ms){const[x,w,h]=fit(c,Math.min(360,c.parentElement.clientWidth)),cx=w/2,cy=h/2,Rm=Math.min(cx,cy)-16,P=(la,lo)=>{const r=(la+90)/10*Rm;return[cx+r*Math.sin(lo*R),cy-r*Math.cos(lo*R)]};
x.strokeStyle=cv("line");x.fillStyle=cv("mute");[85,80].forEach((l,i)=>{x.beginPath();x.arc(cx,cy,(90-l)/10*Rm,0,7);x.stroke();x.fillText(l+"°S",cx+4,cy-(90-l)/10*Rm+11)});
for(let a=0;a<360;a+=45){x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Rm*Math.sin(a*R),cy-Rm*Math.cos(a*R));x.stroke()}
const g=geo(ms);[[g.sl,cv("au")],[g.el,cv("cy")]].forEach(([l,col])=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Rm*Math.sin(l*R),cy-Rm*Math.cos(l*R));x.stroke();x.lineWidth=1});
SITES.forEach((s,i)=>{if(i==5&&S.site!=5)return;const[px,py]=P(s.la,s.lo);x.fillStyle=i==S.site?cv("au"):cv("ink");x.beginPath();x.arc(px,py,i==S.site?6:4,0,7);x.fill();x.fillStyle=cv("ink");x.fillText(s.n.split(" ")[0],px+7,py+3);s._p=[px,py]});
c.onclick=e=>{const b=c.getBoundingClientRect(),px=e.clientX-b.left,py=e.clientY-b.top;let k=-1,dm=900;SITES.forEach((s,i)=>{if(!s._p||(i==5&&S.site!=5))return;const d=(s._p[0]-px)**2+(s._p[1]-py)**2;if(d<dm){dm=d;k=i}});if(k>=0){S.site=k;sync();render()}}}
function line(c,sets,t0,days,o={}){const[x,w,h]=fit(c,o.h||200),L=34,T=8,B=20,ymn=o.mn??-10,ymx=o.mx??30,X=t=>L+t/(days*24)*(w-L-6),Y=v=>T+(ymx-v)/(ymx-ymn)*(h-T-B);
x.strokeStyle=cv("line");x.fillStyle=cv("mute");for(let v=Math.ceil(ymn/10)*10;v<=ymx;v+=10){x.beginPath();x.moveTo(L,Y(v));x.lineTo(w,Y(v));x.stroke();x.fillText(v,2,Y(v)+4)}
for(let d=0;d<=days;d+=5){x.fillText(o.lab?o.lab(d):"d"+d,X(d*24)-6,h-4)}
x.strokeStyle=cv("ink");x.beginPath();x.moveTo(L,Y(S.mask));x.lineTo(w,Y(S.mask));x.stroke();
sets.forEach(s=>{x.strokeStyle=s.col;x.lineWidth=2;x.setLineDash(s.dash?[5,4]:[]);x.beginPath();s.y.forEach((v,i)=>{const px=s.xs?X(s.xs[i]):X(i*s.step);i?x.lineTo(px,Y(Math.max(ymn,Math.min(ymx,v)))):x.moveTo(px,Y(v))});x.stroke()});x.setLineDash([]);x.lineWidth=1;
if(o.cur!=null){x.strokeStyle=cv("ink");x.beginPath();x.moveTo(X(o.cur),T);x.lineTo(X(o.cur),h-B);x.stroke()}}
function strip(c,st,cur){const[x,w,h]=fit(c,120),o=st.o,L=44,bw=(w-L-6)/o.n,rows=[["Sun",i=>o.sun[i]>S.mask,cv("au")],["Earth",i=>o.ea[i]>S.mask,cv("cy")],["Both",i=>o.sun[i]>S.mask&&o.ea[i]>S.mask,cv("ok")]];
rows.forEach(([t,f,col],r)=>{x.fillStyle=cv("mute");x.fillText(t,2,r*34+22);for(let i=0;i<o.n;i++){x.fillStyle=f(i)?col:cv("line");x.fillRect(L+i*bw,r*34+8,bw+.5,24)}});
x.fillStyle=cv("ink");x.fillRect(L+cur/o.step*bw,2,2,108)}
function metric(k,v,u=""){return`<div class="card"><div class="k">${k}</div><div class="v">${v}<small> ${u}</small></div></div>`}
const badge=(p,m)=>p.el>m?'<span class="pill ok">Above horizon</span>':'<span class="pill bad">Below horizon</span>';
function commState(st,e,m){return st.earth==0?'<span class="pill bad">Communication Visibility Unavailable</span>':e.el>m?'<span class="pill ok">Potential Communication Window</span>':'<span class="pill au">Earth Below Horizon</span>'}
function sync(){$("#site").value=S.site;const s=site(S.site);$("#lat").value=s.la;$("#lon").value=s.lo;$("#dt").value=new Date(S.t).toISOString().slice(0,16);$("#mv").textContent=S.mask+"°"}
function sc(tag,i,t){const s=site(i),st=stats(s,t,S.mask);return{s,st,t,i}}
function render(){const on=document.querySelector("section.on").id,s=site(S.site),ms=S.t+S.cur*H,r=at2(s,ms),st=stats(s,S.t,S.mask),m=S.mask;
{const o=st.o;$("#src").textContent=o.src=="horizons"?"Source: JPL Horizons (via backend)":API.on?(acache[skey(s,S.t)]?"Source: backend model (Horizons unavailable)":"Fetching JPL Horizons… showing local model"):"Source: local model (no backend)"}
if(on=="overview"){$("#dash").innerHTML=metric("Site",s.n)+metric("Lat / Lon",s.la.toFixed(2)+"° / "+s.lo.toFixed(2)+"°")+metric("Time",fd(ms).slice(0,16))+metric("Sun elevation",f1(r.sun.el),"°")+metric("Sunlight (30 d)",f1(st.sun),"%")+metric("Earth elevation",f1(r.earth.el),"°")+metric("Earth view (30 d)",f1(st.earth),"%")+metric("Next Earth rise",st.earthRise==null?"—":"+"+f1(st.earthRise/24),"days")+`<div class="card"><div class="k">Status</div>${commState(st,r.earth,m)}<br>${badge(r.sun,m)} Sun</div>`;
sky($("#sky0"),s,ms);map($("#map0"),ms)}
if(on=="explorer"){map($("#map1"),ms);$("#siteinfo").innerHTML=`<h3>${s.n}</h3><p class="mono">${s.la.toFixed(2)}°, ${s.lo.toFixed(2)}°E</p><p>Approximate catalogue coordinates (illustrative; verify against LOLA/Moon Trek). Terrain data: <b>not loaded</b>, so use the horizon mask as a stand-in.</p><p>Sun ${f1(r.sun.el)}° · Earth ${f1(r.earth.el)}° at ${fd(ms)}.</p><p>30-day light ${f1(st.sun)}% · Earth ${f1(st.earth)}% · both ${f1(st.both)}%.</p>`}
if(on=="solar"){$("#sm").innerHTML=metric("Elevation now",f1(r.sun.el),"°")+metric("Sunlight share",f1(st.sun),"%")+metric("Longest sunlit run",f1(st.sunRun),"days")+metric("Elevation range",f1(st.mn)+" … "+f1(st.mx),"°")+metric("Next sunrise",fo(st.sunRise,S.t))+metric("Next sunset",fo(st.sunSet,S.t));
line($("#c_sun"),[{y:st.o.sun,col:cv("au"),step:2}],S.t,30,{cur:S.cur})}
if(on=="earth"){$("#em").innerHTML=metric("Elevation now",f1(r.earth.el),"°")+metric("Earth visible",f1(st.earth),"%")+metric("Longest visible run",f1(st.earthRun),"days")+metric("Next Earthrise",fo(st.earthRise,S.t))+`<div class="card"><div class="k">Status</div>${commState(st,r.earth,m)}</div>`;
line($("#c_earth"),[{y:st.o.ea,col:cv("cy"),step:2}],S.t,30,{mn:-10,mx:10,cur:S.cur})}
if(on=="timeline"){$("#tl").textContent=fd(ms);$("#sl").value=S.cur;sky($("#sky1"),s,ms);$("#tm").innerHTML=`<h3>${s.n}</h3><p>Sun <b>${f1(r.sun.el)}°</b> ${badge(r.sun,m)}</p><p>Earth <b>${f1(r.earth.el)}°</b> ${badge(r.earth,m)}</p><p>${commState(st,r.earth,m)}</p><p>Both up: ${r.sun.el>m&&r.earth.el>m?"yes":"no"}</p>`;strip($("#strip"),st,S.cur)}
if(on=="compare"||on=="assistant")cmp(on);
if(on=="resched")rs()}
const P=(st)=>{return 0};
function card(L,sc){const{s,st,t}=sc;return`<div class="card"><h3>${L}: ${s.n}</h3><p class="mono">${s.la.toFixed(2)}°, ${s.lo.toFixed(2)}°E · ${fd(t).slice(0,10)}</p><table><tr><td>Sunlight</td><td>${f1(st.sun)}%</td></tr><tr><td>Longest sunlit run</td><td>${f1(st.sunRun)} d</td></tr><tr><td>Sun elev. range</td><td>${f1(st.mn)}…${f1(st.mx)}°</td></tr><tr><td>Earth visible</td><td>${f1(st.earth)}%</td></tr><tr><td>Longest Earth run</td><td>${f1(st.earthRun)} d</td></tr><tr><td>Sun + Earth both up</td><td>${f1(st.both)}%</td></tr></table><div class="note">Uncertain: low-precision model, no terrain data.</div></div>`}
function scen(){return[sc("A",S.site,S.t),sc("B",S.B.site,S.B.t)]}
const score=st=>0.4*st.sun+0.4*st.earth+0.2*st.both;
function summary(a,b){const g=(k,l)=>{const d=a.st[k]-b.st[k];return Math.abs(d)<2?`${l} is about equal (${f1(a.st[k])}% vs ${f1(b.st[k])}%)`:`${l} favours ${d>0?"A":"B"} (${f1(a.st[k])}% vs ${f1(b.st[k])}%)`};
return[g("sun","Sunlight"),g("earth","Earth visibility"),g("both","Combined overlap")]}
function cmp(on){const[a,b]=scen();if(on!="compare")return;$("#cards").innerHTML=card("A",a)+card("B",b);
line($("#c_cmp"),[{y:a.st.o.sun,col:cv("cy"),step:2},{y:a.st.o.ea,col:cv("cy"),step:2,dash:1},{y:b.st.o.sun,col:cv("au"),step:2},{y:b.st.o.ea,col:cv("au"),step:2,dash:1}],0,30,{mn:-10,mx:10});
$("#sum").innerHTML="<ul>"+summary(a,b).map(x=>`<li>${x}</li>`).join("")+"</ul><p>Which is better depends on the requirement: power-driven missions weight sunlight, comms-driven missions weight Earth view. Neither scenario is universally superior.</p>";
$("#suit").innerHTML=`<table><tr><th>Index</th><th>A</th><th>B</th></tr><tr><td>Weighted illumination/visibility index (0–100)</td><td>${f1(score(a.st))}</td><td>${f1(score(b.st))}</td></tr><tr><td>Terrain data</td><td>none</td><td>none</td></tr><tr><td>Data confidence</td><td>Low</td><td>Low</td></tr></table><div class="note">Index = 0.4·sunlight% + 0.4·Earth% + 0.2·overlap%. The weights are an arbitrary, transparent choice for comparison, not a validated or official score. Terrain, thermal, slope and hazard factors are excluded.</div>`}
function rs(){const s=site(S.site),t1=S.t+S.shift*D,a=sc("A",S.site,S.t),b=sc("A",S.site,t1);$("#sv").textContent=(S.shift>=0?"+":"")+S.shift+" days";
$("#rc").innerHTML=card("Original",a)+card("Rescheduled",b);SWEEP=true;const xs=[],su=[],ea=[],bo=[];for(let d=-30;d<=60;d++){const k=stats(s,S.t+d*D,S.mask);xs.push((d+30)*24);su.push(k.sun);ea.push(k.earth);bo.push(k.both)}
SWEEP=false;line($("#c_sw"),[{y:su,xs,col:cv("au")},{y:ea,xs,col:cv("cy")},{y:bo,xs,col:cv("ok")}],0,90,{mn:0,mx:100,lab:d=>(d-30)+"d"});
const dd=k=>{const v=b.st[k]-a.st[k];return(v>=0?"+":"")+f1(v)+" pts"};
$("#rs").innerHTML=`<h3>What changed with a ${S.shift}-day shift</h3><ul><li>Sunlight: ${f1(a.st.sun)}% → ${f1(b.st.sun)}% (${dd("sun")})</li><li>Earth view: ${f1(a.st.earth)}% → ${f1(b.st.earth)}% (${dd("earth")})</li><li>Overlap: ${f1(a.st.both)}% → ${f1(b.st.both)}% (${dd("both")})</li><li>Sun elevation range: ${f1(a.st.mn)}…${f1(a.st.mx)}° → ${f1(b.st.mn)}…${f1(b.st.mx)}°</li></ul>`}
function reply(q){const[a,b]=scen();q=q.toLowerCase();const t=[];
if(/sun|solar|light|power/.test(q))t.push("Sunlight over 30 days: "+a.s.n+" (A) "+f1(a.st.sun)+"%, "+b.s.n+" (B) "+f1(b.st.sun)+"%. This is illumination only, not electrical output.");
if(/earth|comm|link/.test(q))t.push("Earth above the horizon: A "+f1(a.st.earth)+"%, B "+f1(b.st.earth)+"%; longest runs "+f1(a.st.earthRun)+" d and "+f1(b.st.earthRun)+" d. Geometric only; it is not a guaranteed link.");
if(/delay|date|resched|slip|change/.test(q)){const s=site(S.site),k=stats(s,S.t+S.shift*D,S.mask);t.push("Shifting A by "+S.shift+" days moves sunlight from "+f1(a.st.sun)+"% to "+f1(k.sun)+"% and Earth view from "+f1(a.st.earth)+"% to "+f1(k.earth)+"%.")}
if(/trade|better|compare|which|summar/.test(q))t.push(summary(a,b).join("; ")+". Which matters more depends on the mission.");
if(/graph|chart|explain|elevation/.test(q))t.push("The charts plot elevation above the local horizon in degrees over 30 days. The thin line is your horizon mask ("+S.mask+"°); above it the body is counted as visible.");
if(/why/.test(q)&&/earth/.test(q))t.push("Earth visibility matters because a direct line of sight is needed for direct-to-Earth communication.");
return t.length?t.join(" "):"I can answer about sunlight, Earth visibility, date changes, trade-offs or the graphs, using the current scenarios."}
function say(t,u){const d=document.createElement("div");d.className="m"+(u?" u":"");d.textContent=t;$("#chat").append(d);$("#chat").scrollTop=1e9}
function go(id){location.hash=id}
function route(){const id=TABS.some(t=>t[0]==location.hash.slice(1))?location.hash.slice(1):"overview";document.querySelectorAll("section").forEach(e=>e.classList.toggle("on",e.id==id));document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.hash=="#"+id));render()}
$("#nav").innerHTML=TABS.map(t=>`<a href="#${t[0]}">${t[1]}</a>`).join("");
const opts=SITES.map((s,i)=>`<option value="${i}">${s.n}</option>`).join("");$("#site").innerHTML=opts;$("#bs").innerHTML=opts;
$("#site").onchange=e=>{S.site=+e.target.value;sync();render()};
$("#ap").onclick=()=>{const la=+$("#lat").value,lo=+$("#lon").value;if(isNaN(la)||isNaN(lo)||Math.abs(la)>90||Math.abs(lo)>180)return;SITES[5].la=la;SITES[5].lo=lo;S.site=5;sync();render()};
const rd=v=>{const t=Date.parse(v+":00Z");return isNaN(t)?null:t};
$("#dt").onchange=e=>{const t=rd(e.target.value);if(t){S.t=t;render()}};
$("#bd").onchange=e=>{const t=rd(e.target.value);if(t){S.B.t=t;render()}};$("#bs").onchange=e=>{S.B.site=+e.target.value;render()};
$("#bs").value=S.B.site;$("#bd").value=new Date(S.B.t).toISOString().slice(0,16);
$("#mask").oninput=e=>{S.mask=+e.target.value;$("#mv").textContent=S.mask+"°";render()};
$("#sl").oninput=e=>{S.cur=+e.target.value;render()};$("#sh").oninput=e=>{S.shift=+e.target.value;render()};
$("#pl").onclick=()=>{S.play=!S.play;$("#pl").textContent=S.play?"❚❚ Pause":"▶ Play"};
setInterval(()=>{if(S.play){S.cur=(S.cur+ +$("#spd").value/10)%721;if(location.hash=="#timeline")render()}},100);
$("#th").onclick=()=>{const d=document.documentElement;const dark=getComputedStyle(d).getPropertyValue("--bg").trim()=="#080B14";d.dataset.theme=dark?"light":"dark";render()};
const ctx=()=>{const[a,b]=scen(),o=x=>({site:x.s.n,lat:x.s.la,lon:x.s.lo,start:fd(x.t),sunlight_pct:+f1(x.st.sun),earth_visible_pct:+f1(x.st.earth),both_up_pct:+f1(x.st.both),longest_sunlit_days:+f1(x.st.sunRun),longest_earth_days:+f1(x.st.earthRun),sun_elev_min_deg:+f1(x.st.mn),sun_elev_max_deg:+f1(x.st.mx)});return{A:o(a),B:o(b),horizon_mask_deg:S.mask,delay_days:S.shift,data_source:a.st.o.src}};
const ask=async()=>{const q=$("#q").value.trim();if(!q)return;say(q,1);$("#q").value="";let t=null;
if(API.on&&API.llm){try{const r=await fetch(API.base+"/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,context:ctx()})});if(r.ok)t=(await r.json()).answer}catch(e){}}
say(t||reply(q))};$("#ask").onclick=ask;$("#q").onkeydown=e=>e.key=="Enter"&&ask();
["Which site has better sunlight?","Why is Earth visibility important?","What happens if the landing date changes?","Summarize the trade-offs","Explain the graphs"].forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>{$("#q").value=t;ask()};$("#chips").append(b)});
say("Hello. Ask me about the current scenarios; I only quote values this page calculated.");
fetch(API.base+"/api/health").then(r=>r.json()).then(j=>{API.on=!!j.ok;API.llm=!!j.llm;render()}).catch(()=>{});
addEventListener("hashchange",route);addEventListener("resize",render);sync();route();
