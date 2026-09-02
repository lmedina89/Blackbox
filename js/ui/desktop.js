import { getState, hasFlag } from "../core/state.js";
import { EMAILS } from "../data/emails.js";
import { THREADS } from "../data/messages.js";
import { NEWS } from "../data/news.js";
import { FORUM_POSTS } from "../data/forums.js";
import { SOCIAL_POSTS } from "../data/social.js";
import { HARDWARE } from "../data/hardware.js";
import { DESKTOP_APPS } from "../data/apps.js";
import { on, emit } from "../core/events.js";
import { buyHardware } from "../systems/hardware.js";
import { missionView } from "../systems/missions.js";
import { formatClock } from "../core/clock.js";
import { saveGame } from "../core/save.js";

function visible(item){
  if((item.visibleWhen||[]).some(f=>!hasFlag(f))) return false;
  if((item.hiddenWhen||[]).some(f=>hasFlag(f))) return false;
  return true;
}

export function initDesktopUI({enterBlackbox}){
  const icons=document.querySelector("#desktop-icons"),startList=document.querySelector("#start-app-list"),startMenu=document.querySelector("#start-menu"),layer=document.querySelector("#window-layer"),taskApps=document.querySelector("#taskbar-apps"),toastBox=document.querySelector("#notifications");
  let z=20,offset=0;

  for(const app of DESKTOP_APPS){
    const b=document.createElement("button");b.className="desktop-icon";b.dataset.appIcon=app.id;b.innerHTML=`<span class="glyph">${app.glyph}</span><span>${app.shortName}</span>`;b.addEventListener("click",()=>openApp(app.id));icons.appendChild(b);
    const s=document.createElement("button");s.textContent=`${app.glyph} ${app.name}`;s.addEventListener("click",()=>{startMenu.classList.add("hidden");openApp(app.id);});startList.appendChild(s);
  }
  document.querySelector("#start-button").addEventListener("click",()=>startMenu.classList.toggle("hidden"));
  document.querySelector("#blackbox-button").addEventListener("click",()=>{startMenu.classList.add("hidden");enterBlackbox();});
  document.querySelector("#save-button").addEventListener("click",()=>{saveGame();toast("Game saved to local disk.");});
  document.querySelector("#start-alias").textContent=getState().player.alias;

  function toast(text){const t=document.createElement("div");t.className="toast";t.innerHTML=`<b>NEXUS/OS</b><span>${text}</span>`;toastBox.appendChild(t);setTimeout(()=>t.classList.add("toast-out"),3300);setTimeout(()=>t.remove(),3800);}
  function updateClock(){const c=formatClock();document.querySelector("#clock-time").textContent=c.time;document.querySelector("#clock-date").textContent=c.date;}
  updateClock();on("clock:tick",updateClock);
  on("mission:started",({mission})=>{toast(`New job received: ${mission.title}`);renderOpenApps();});
  on("mission:progress",({objective})=>{toast(`Objective complete: ${objective.label}`);renderOpenApps();});
  on("mission:completed",({mission})=>{toast(`Job complete. ${mission.rewards.credits} credits transferred.`);renderOpenApps();setTimeout(()=>openApp("mail"),650);});
  on("hardware:purchased",({item})=>{toast(`${item.name} installed.`);renderOpenApps();});

  function createWindow(id,title){
    const existing=layer.querySelector(`[data-window="${id}"]`);if(existing){existing.classList.remove("hidden");existing.style.zIndex=String(++z);return existing.querySelector(".window-content");}
    const win=document.createElement("section");win.className="app-window";win.dataset.window=id;win.style.zIndex=String(++z);win.style.setProperty("--win-offset",`${offset}px`);offset=(offset+18)%72;
    win.innerHTML=`<div class="window-titlebar"><span class="window-app-title">${title}</span><div class="window-controls"><button data-min aria-label="Minimize">—</button><button data-close aria-label="Close">×</button></div></div><div class="window-content"></div>`;
    win.addEventListener("pointerdown",()=>win.style.zIndex=String(++z));
    win.querySelector("[data-close]").addEventListener("click",()=>{win.remove();taskApps.querySelector(`[data-task="${id}"]`)?.remove();});
    win.querySelector("[data-min]").addEventListener("click",()=>win.classList.add("hidden"));layer.appendChild(win);
    const task=document.createElement("button");task.className="taskbar-app";task.dataset.task=id;task.textContent=title;task.addEventListener("click",()=>{win.classList.toggle("hidden");win.style.zIndex=String(++z);});taskApps.appendChild(task);return win.querySelector(".window-content");
  }

  function openApp(id){
    const app=DESKTOP_APPS.find(a=>a.id===id);if(!app)return;
    const el=createWindow(id,app.name);
    ({browser:renderBrowser,mail:renderMail,chat:renderChat,files:renderSystem,missions:renderMissions,notes:renderNotes}[id])?.(el);
  }
  function renderOpenApps(){for(const win of layer.querySelectorAll(".app-window")){const fn={browser:renderBrowser,mail:renderMail,chat:renderChat,files:renderSystem,missions:renderMissions,notes:renderNotes}[win.dataset.window];fn?.(win.querySelector(".window-content"));}}

  function renderBrowser(el){
    const s=getState();
    el.innerHTML=`<div class="browser-chrome"><div class="browser-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Favorites&nbsp;&nbsp; Help</div><div class="app-toolbar browser-toolbar"><button data-nav="back">←</button><button data-site="news">News</button><button data-site="social">FriendSpace</button><button data-site="forum">NightWire</button><button data-site="shop">ByteBarn</button><input value="nexus://${s.ui.lastBrowserSite||"news"}" aria-label="Address"></div></div><div class="app-body browser-page" id="browser-body"></div>`;
    const body=el.querySelector("#browser-body"),addr=el.querySelector("input");
    const show=site=>{s.ui.lastBrowserSite=site;addr.value=`nexus://${site}`;
      if(site==="news")body.innerHTML=`<div class="site-head"><div class="site-logo">METROWIRE</div><span>LOCAL // TECHNOLOGY // BUSINESS</span></div>${NEWS.filter(visible).map(n=>`<article class="news-story"><h2>${n.title}</h2><p>${n.body}</p><span class="feed-meta">MetroWire desk · Day ${s.world.day}</span></article>`).join("")}`;
      if(site==="social")body.innerHTML=`<div class="site-head friendspace"><div class="site-logo">FriendSpace</div><span>${s.player.alias}'s feed</span></div>${SOCIAL_POSTS.filter(visible).map(x=>`<article class="social-post"><div class="avatar">${x.name[0]}</div><div><h3>${x.name} <span>@${x.author}</span></h3><p>${x.body}</p><small>${x.time}</small></div></article>`).join("")}`;
      if(site==="forum"){
        body.innerHTML=`<div class="site-head nightwire"><div class="site-logo">NIGHTWIRE</div><span>underground computing board</span></div><div class="forum-banner">READ THE RULES // NO REAL-WORLD TARGETS // KEEP IT IN THE LAB</div>${FORUM_POSTS.filter(visible).map(p=>`<button class="forum-thread" data-post="${p.id}"><b>${p.title}</b><span>by ${p.author}</span><p>${p.body}</p></button>`).join("")}`;
        body.querySelectorAll("[data-post]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.post;if(!s.world.readForumPosts.includes(id))s.world.readForumPosts.push(id);emit("forum:read",{postId:id});btn.classList.add("read");toast("Useful information added to your notes.");}));
      }
      if(site==="shop"){
        body.innerHTML=`<div class="site-head bytebarn"><div class="site-logo">BYTEBARN</div><span>PC PARTS // SAME-DAY INSTALL</span></div><div class="store-balance">Available credits: <b>${s.player.credits}</b></div><div class="shop-grid">${HARDWARE.map(h=>`<div class="shop-item"><span class="part-type">${h.type}</span><h3>${h.name}</h3><p>${h.description}</p><strong>${h.price} cr</strong><button data-buy="${h.id}" ${s.player.installedHardware.includes(h.id)?"disabled":""}>${s.player.installedHardware.includes(h.id)?"Installed":"Order & install"}</button></div>`).join("")}</div>`;
        body.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{const result=buyHardware(btn.dataset.buy);toast(result.message);show("shop");}));
      }
    };
    el.querySelectorAll("[data-site]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.site)));
    addr.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const site=addr.value.replace(/^nexus:\/\//,"").trim().toLowerCase();if(["news","social","forum","shop"].includes(site))show(site);else{body.innerHTML=`<div class="browser-error"><h2>Page cannot be displayed</h2><p>NEXUS Explorer could not resolve <b>${site||"(blank)"}</b>.</p></div>`;}});
    show(s.ui.lastBrowserSite||"news");
  }

  function renderMail(el){
    const s=getState(),mails=EMAILS.filter(visible);
    el.innerHTML=`<div class="mail-header"><b>NEXUS Mail</b><span>${mails.filter(m=>!s.world.readEmails.includes(m.id)).length} unread</span></div><div class="mail-layout"><div class="sidebar mail-list">${mails.map(m=>`<button data-mail="${m.id}" class="${s.world.readEmails.includes(m.id)?"read":"unread"}"><span>${m.from.split("@")[0]}</span><b>${m.subject}</b></button>`).join("")}</div><div class="content-pane"><div class="empty-state">Select a message to read.</div></div></div>`;
    const pane=el.querySelector(".content-pane");el.querySelectorAll("[data-mail]").forEach(btn=>btn.addEventListener("click",()=>{const mail=mails.find(m=>m.id===btn.dataset.mail);pane.innerHTML=`<div class="mail-message"><h2>${mail.subject}</h2><div class="mail-meta">From: ${mail.from}<br>To: ${s.player.alias}@nexus.local</div><div class="mail-body">${mail.body}</div></div>`;if(!s.world.readEmails.includes(mail.id))s.world.readEmails.push(mail.id);btn.classList.remove("unread");btn.classList.add("read");emit("email:read",{emailId:mail.id});}));
  }

  function renderChat(el){
    const s=getState(),thread=THREADS[0],messages=thread.messages.filter(m=>(m.visibleWhen||[]).every(hasFlag));
    el.innerHTML=`<div class="messenger-top"><b>NEXUS Messenger</b><span class="online-dot"></span> Online</div><div class="chat-layout"><div class="sidebar buddy-list"><div class="buddy-group">Friends (1)</div><button class="active"><span class="online-dot"></span> Maya</button><div class="buddy-group">Offline (2)</div><button disabled>Sam K.</button><button disabled>Chris</button></div><div class="content-pane chat-pane"><div class="chat-history">${messages.map(m=>`<div class="chat-line"><span class="chat-time">${m.id==="m1"?"18:38":"18:39"}</span><b>${m.from==="player"?s.player.alias:"Maya"}:</b> ${m.text}</div>`).join("")}</div><div class="chat-compose"><input value="" placeholder="Messaging is read-only in v0.1.1" disabled><button disabled>Send</button></div></div></div>`;
  }

  function renderSystem(el){
    const s=getState();
    el.innerHTML=`<div class="app-body"><div class="system-title"><div class="computer-glyph">🖥️</div><div><h2>${s.player.alias}'s Computer</h2><span>NEXUS/OS Personal Workstation</span></div></div><div class="system-grid"><div class="stat"><b>Processor</b><br>Northstar P3 733 MHz</div><div class="stat"><b>Memory</b><br>${s.player.installedHardware.includes("ram_256")?"384":"128"} MB</div><div class="stat"><b>Network</b><br>${s.player.installedHardware.includes("nic_fast")?"FastLink 100":"EtherLink 10"}</div><div class="stat"><b>Credits</b><br>${s.player.credits}</div><div class="stat"><b>Reputation</b><br>${s.player.reputation}</div><div class="stat"><b>BLACKBOX</b><br>0.1.1 installed</div></div><div class="card blackbox-launch"><div><h3>BLACKBOX Secure Environment</h3><p>Launch isolated simulated terminal workspace.</p></div><button id="system-blackbox">ENTER BLACKBOX</button></div></div>`;
    el.querySelector("#system-blackbox").addEventListener("click",enterBlackbox);
  }

  function renderMissions(el){const active=missionView();el.innerHTML=`<div class="app-body"><h2>Jobs</h2>${active.length?active.map(m=>`<div class="card mission-box"><div class="mission-title"><h3>${m.title}</h3><span>ACTIVE</span></div><p>${m.description}</p><div class="objective-list">${m.objectives.map(o=>`<div class="${m.progress[o.id]?"done":""}">${m.progress[o.id]?"☑":"☐"} ${o.label}</div>`).join("")}</div></div>`).join(""):`<div class="empty-state">No active jobs.<br>Check your email and messages.</div>`}`;}

  function renderNotes(el){const s=getState();el.innerHTML=`<div class="notepad-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; Format&nbsp;&nbsp; Help</div><textarea id="player-notes" class="notepad" spellcheck="false" placeholder="Write anything you want to remember...">${s.player.notes||""}</textarea>`;const ta=el.querySelector("#player-notes");ta.addEventListener("input",()=>{s.player.notes=ta.value;});}

  return {openApp,toast,refresh:renderOpenApps};
}
