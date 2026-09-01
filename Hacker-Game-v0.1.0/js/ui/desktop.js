import { getState, hasFlag } from "../core/state.js";
import { EMAILS } from "../data/emails.js";
import { THREADS } from "../data/messages.js";
import { NEWS } from "../data/news.js";
import { FORUM_POSTS } from "../data/forums.js";
import { HARDWARE } from "../data/hardware.js";
import { on, emit } from "../core/events.js";
import { buyHardware } from "../systems/hardware.js";
import { missionView } from "../systems/missions.js";
import { formatClock } from "../core/clock.js";
import { saveGame } from "../core/save.js";

const APPS=[
  {id:"browser",name:"Internet",glyph:"🌐"},
  {id:"mail",name:"Email",glyph:"✉️"},
  {id:"chat",name:"Messenger",glyph:"💬"},
  {id:"files",name:"My Computer",glyph:"🖥️"},
  {id:"missions",name:"Jobs",glyph:"📋"},
];

function visible(item){
  const s=getState();
  if((item.visibleWhen||[]).some(f=>!hasFlag(f))) return false;
  if((item.hiddenWhen||[]).some(f=>hasFlag(f))) return false;
  return true;
}

export function initDesktopUI({enterBlackbox}){
  const icons=document.querySelector("#desktop-icons");
  const startList=document.querySelector("#start-app-list");
  const startMenu=document.querySelector("#start-menu");
  const layer=document.querySelector("#window-layer");
  const taskApps=document.querySelector("#taskbar-apps");
  const toastBox=document.querySelector("#notifications");

  for(const app of APPS){
    const b=document.createElement("button");
    b.className="desktop-icon";
    b.innerHTML=`<span class="glyph">${app.glyph}</span><span>${app.name}</span>`;
    b.addEventListener("click",()=>openApp(app.id));
    icons.appendChild(b);

    const s=document.createElement("button");
    s.textContent=`${app.glyph} ${app.name}`;
    s.addEventListener("click",()=>{startMenu.classList.add("hidden");openApp(app.id);});
    startList.appendChild(s);
  }

  document.querySelector("#start-button").addEventListener("click",()=>startMenu.classList.toggle("hidden"));
  document.querySelector("#blackbox-button").addEventListener("click",()=>{startMenu.classList.add("hidden");enterBlackbox();});
  document.querySelector("#save-button").addEventListener("click",()=>{saveGame();toast("Game saved.");});
  document.querySelector("#start-alias").textContent=getState().player.alias;

  function toast(text){
    const t=document.createElement("div");
    t.className="toast";
    t.textContent=text;
    toastBox.appendChild(t);
    setTimeout(()=>t.remove(),3800);
  }

  function updateClock(){
    const c=formatClock();
    document.querySelector("#clock-time").textContent=c.time;
    document.querySelector("#clock-date").textContent=c.date;
  }
  updateClock();
  on("clock:tick",updateClock);
  on("mission:started",({mission})=>toast(`New job: ${mission.title}`));
  on("mission:progress",({objective})=>toast(`Objective complete: ${objective.label}`));
  on("mission:completed",({mission})=>{
    toast(`Job complete: ${mission.title} +${mission.rewards.credits} credits`);
    renderOpenApps();
    setTimeout(()=>openApp("mail"),700);
  });
  on("hardware:purchased",({item})=>toast(`Installed: ${item.name}`));

  function createWindow(id,title){
    const existing=document.querySelector(`[data-window="${id}"]`);
    if(existing){ existing.style.zIndex=String(Date.now()%100000); return existing.querySelector(".window-content"); }
    const win=document.createElement("section");
    win.className="app-window";
    win.dataset.window=id;
    win.innerHTML=`<div class="window-titlebar"><span>${title}</span><button aria-label="Close">×</button></div><div class="window-content"></div>`;
    win.querySelector("button").addEventListener("click",()=>{win.remove();taskApps.querySelector(`[data-task="${id}"]`)?.remove();});
    layer.appendChild(win);

    const task=document.createElement("button");
    task.className="taskbar-app";
    task.dataset.task=id;
    task.textContent=title;
    task.addEventListener("click",()=>win.classList.toggle("hidden"));
    taskApps.appendChild(task);
    return win.querySelector(".window-content");
  }

  function openApp(id){
    if(id==="browser") renderBrowser(createWindow(id,"Nexus Explorer"));
    if(id==="mail") renderMail(createWindow(id,"NEXUS Mail"));
    if(id==="chat") renderChat(createWindow(id,"NEXUS Messenger"));
    if(id==="files") renderSystem(createWindow(id,"My Computer"));
    if(id==="missions") renderMissions(createWindow(id,"Jobs"));
  }

  function renderOpenApps(){
    for(const win of layer.querySelectorAll(".app-window")){
      const id=win.dataset.window;
      if(id==="mail") renderMail(win.querySelector(".window-content"));
      if(id==="missions") renderMissions(win.querySelector(".window-content"));
      if(id==="browser") renderBrowser(win.querySelector(".window-content"));
      if(id==="files") renderSystem(win.querySelector(".window-content"));
    }
  }

  function renderBrowser(el){
    el.innerHTML=`<div class="app-toolbar">
      <button data-site="news">News</button>
      <button data-site="social">FriendSpace</button>
      <button data-site="forum">NightWire</button>
      <button data-site="shop">ByteBarn</button>
      <input value="nexus://home" aria-label="Address" />
    </div><div class="app-body" id="browser-body"></div>`;
    const body=el.querySelector("#browser-body");
    const addr=el.querySelector("input");
    const show=site=>{
      addr.value=`nexus://${site}`;
      if(site==="news") body.innerHTML=`<h2>MetroWire News</h2>${NEWS.filter(visible).map(n=>`<article class="card"><h3>${n.title}</h3><p>${n.body}</p></article>`).join("")}`;
      if(site==="social") body.innerHTML=`<h2>FriendSpace</h2>
        <article class="card"><h3>@maya_r</h3><p>My internet dropped for ten minutes again. Great.</p><span class="feed-meta">18:03</span></article>
        <article class="card"><h3>@samk91</h3><p>Digging through old university mirrors tonight. Found some ancient Northstar references.</p><span class="feed-meta">17:46</span></article>`;
      if(site==="forum"){
        body.innerHTML=`<h2>NightWire Forums</h2>${FORUM_POSTS.filter(visible).map(p=>`<button class="card forum-card" data-post="${p.id}" style="display:block;width:100%;text-align:left"><h3>${p.title}</h3><span class="feed-meta">by ${p.author}</span><p>${p.body}</p></button>`).join("")}`;
        body.querySelectorAll("[data-post]").forEach(btn=>btn.addEventListener("click",()=>{
          const id=btn.dataset.post,s=getState();
          if(!s.world.readForumPosts.includes(id)) s.world.readForumPosts.push(id);
          emit("forum:read",{postId:id});
          toast("Forum clue recorded.");
        }));
      }
      if(site==="shop"){
        const s=getState();
        body.innerHTML=`<h2>ByteBarn PC Parts</h2><p>Credits: <b>${s.player.credits}</b></p><div class="shop-grid">${HARDWARE.map(h=>`
          <div class="shop-item">
            <h3>${h.name}</h3><p>${h.description}</p><strong>${h.price} cr</strong><br>
            <button data-buy="${h.id}" ${s.player.installedHardware.includes(h.id)?"disabled":""}>${s.player.installedHardware.includes(h.id)?"Installed":"Order & install"}</button>
          </div>`).join("")}</div>`;
        body.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{
          const result=buyHardware(btn.dataset.buy); toast(result.message); show("shop");
        }));
      }
    };
    el.querySelectorAll("[data-site]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.site)));
    show("news");
  }

  function renderMail(el){
    const mails=EMAILS.filter(visible);
    el.innerHTML=`<div class="mail-layout"><div class="sidebar">${mails.map(m=>`<button data-mail="${m.id}">${m.subject}</button>`).join("")}</div><div class="content-pane"><p class="muted">Select a message.</p></div></div>`;
    const pane=el.querySelector(".content-pane");
    el.querySelectorAll("[data-mail]").forEach(btn=>btn.addEventListener("click",()=>{
      const mail=mails.find(m=>m.id===btn.dataset.mail);
      pane.innerHTML=`<h2>${mail.subject}</h2><p class="feed-meta">From: ${mail.from}</p><div class="card" style="white-space:pre-wrap">${mail.body}</div>`;
      const s=getState();
      if(!s.world.readEmails.includes(mail.id)) s.world.readEmails.push(mail.id);
      emit("email:read",{emailId:mail.id});
    }));
  }

  function renderChat(el){
    const s=getState();
    const thread=THREADS[0];
    const visibleMessages=thread.messages.filter(m=>(m.visibleWhen||[]).every(hasFlag));
    el.innerHTML=`<div class="chat-layout"><div class="sidebar"><button class="active">Maya</button></div><div class="content-pane">${visibleMessages.map(m=>`<div class="message-bubble ${m.from==="player"?"me":""}">${m.from==="player"?s.player.alias:"Maya"}: ${m.text}</div>`).join("")}</div></div>`;
  }

  function renderSystem(el){
    const s=getState();
    el.innerHTML=`<div class="app-body">
      <h2>My Computer</h2>
      <div class="system-grid">
        <div class="stat"><b>User</b><br>${s.player.alias}</div>
        <div class="stat"><b>Credits</b><br>${s.player.credits}</div>
        <div class="stat"><b>Reputation</b><br>${s.player.reputation}</div>
        <div class="stat"><b>Installed hardware</b><br>${s.player.installedHardware.join(", ")}</div>
      </div>
      <div class="card"><h3>BLACKBOX</h3><p>Secure terminal environment installed.</p><button id="system-blackbox">Launch BLACKBOX</button></div>
    </div>`;
    el.querySelector("#system-blackbox").addEventListener("click",enterBlackbox);
  }

  function renderMissions(el){
    const active=missionView();
    el.innerHTML=`<div class="app-body"><h2>Jobs</h2>${active.length?active.map(m=>`
      <div class="card mission-box"><h3>${m.title}</h3><p>${m.description}</p>${m.objectives.map(o=>`<div>${m.progress[o.id]?"☑":"☐"} ${o.label}</div>`).join("")}</div>`).join(""):"<p>No active jobs.</p>"}</div>`;
  }

  return {openApp,toast,refresh:renderOpenApps};
}
