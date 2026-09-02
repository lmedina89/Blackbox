import { getState, hasFlag } from "../core/state.js";
import { EMAILS } from "../data/emails.js";
import { THREADS } from "../data/messages.js";
import { NEWS } from "../data/news.js";
import { FORUM_POSTS } from "../data/forums.js";
import { SOCIAL_POSTS } from "../data/social.js";
import { HARDWARE } from "../data/hardware.js";
import { SOFTWARE } from "../data/software.js";
import { THREATS, FIELD_NOTES, LABS } from "../data/threats.js";
import { MISSIONS } from "../data/missions.js";
import { DESKTOP_APPS } from "../data/apps.js";
import { on, emit } from "../core/events.js";
import { buyHardware, buySoftware } from "../systems/hardware.js";
import { missionView } from "../systems/missions.js";
import { formatClock } from "../core/clock.js";
import { saveGame } from "../core/save.js";
import { makeChoice, choiceMade } from "../systems/communications.js";
import { getKnownClues } from "../systems/clues.js";
import { HOSTS } from "../data/hosts.js";
import { proficiencyLabel } from "../systems/progression.js";
import { displayName } from "../systems/network.js";
import { playSound, toggleAudio, isAudioEnabled } from "../systems/audio.js";
import { lookupDns, formatDnsResult } from "../systems/dns.js";

function visible(item){
  if((item.visibleWhen||[]).some(f=>!hasFlag(f))) return false;
  if((item.hiddenWhen||[]).some(f=>hasFlag(f))) return false;
  return true;
}

export function initDesktopUI({enterBlackbox}){
  const icons=document.querySelector("#desktop-icons"),startList=document.querySelector("#start-app-list"),startMenu=document.querySelector("#start-menu"),layer=document.querySelector("#window-layer"),taskApps=document.querySelector("#taskbar-apps"),toastBox=document.querySelector("#notifications"),audioButton=document.querySelector("#audio-button");
  // Identity restore can initialize the desktop again in the same page lifetime.
  // Clear identity-owned presentation so Messenger and every app rebuild from restored canonical state.
  icons.replaceChildren();
  startList.replaceChildren();
  layer.replaceChildren();
  taskApps.replaceChildren();
  toastBox.replaceChildren();
  let z=20,offset=0,activeThreadId="maya";

  for(const app of DESKTOP_APPS){
    const b=document.createElement("button");b.className="desktop-icon";b.dataset.appIcon=app.id;b.innerHTML=`<span class="glyph">${app.glyph}</span><span>${app.shortName}</span><span class="app-badge hidden" aria-label="unread items"></span>`;b.addEventListener("click",()=>openApp(app.id));icons.appendChild(b);
    const s=document.createElement("button");s.textContent=`${app.glyph} ${app.name}`;s.addEventListener("click",()=>{startMenu.classList.add("hidden");openApp(app.id);});startList.appendChild(s);
  }
  document.querySelector("#start-button").addEventListener("click",()=>startMenu.classList.toggle("hidden"));
  document.querySelector("#blackbox-button").addEventListener("click",()=>{startMenu.classList.add("hidden");enterBlackbox();});
  document.querySelector("#save-button").addEventListener("click",()=>{saveGame();toast("Game saved to local disk.");});
  document.querySelector("#start-alias").textContent=getState().player.alias;
  function refreshAudioButton(){
    const enabled=isAudioEnabled();
    audioButton.textContent=enabled?"🔊":"🔇";
    audioButton.classList.toggle("is-muted",!enabled);
    audioButton.title=enabled?"Sound on — tap to mute":"Sound muted — tap to enable";
    audioButton.setAttribute("aria-label",audioButton.title);
    audioButton.setAttribute("aria-pressed",String(!enabled));
  }
  refreshAudioButton();
  audioButton.onclick=()=>{
    const enabled=toggleAudio();
    refreshAudioButton();
    toast(enabled?"Sound effects enabled.":"Sound effects muted.");
  };

  function unreadCount(appId){
    const s=getState();
    if(appId==="mail")return EMAILS.filter(visible).filter(x=>!s.world.readEmails.includes(x.id)).length;
    if(appId==="threatdesk")return hasFlag("threatdesk_online")?THREATS.filter(visible).filter(x=>!(s.world.readThreats||[]).includes(x.id)).length:0;
    if(appId==="chat")return THREADS.flatMap(x=>x.messages).filter(x=>x.from!=="player"&&(x.visibleWhen||[]).every(hasFlag)&&!(s.world.readMessages||[]).includes(x.id)).length;
    if(appId==="browser")return NEWS.filter(x=>x.clueId&&visible(x)&&!s.world.readNewsStories.includes(x.id)).length+FORUM_POSTS.filter(x=>x.clueId&&visible(x)&&!s.world.readForumPosts.includes(x.id)).length+SOCIAL_POSTS.filter(x=>x.clueId&&visible(x)&&!s.world.readSocialPosts.includes(x.id)).length;
    if(appId==="missions")return (s.missions.active||[]).length;
    return 0;
  }
  function refreshBadges(){
    for(const button of icons.querySelectorAll("[data-app-icon]")){
      const badge=button.querySelector(".app-badge"),count=unreadCount(button.dataset.appIcon);
      badge.textContent=count>9?"9+":String(count);
      badge.classList.toggle("hidden",count===0);
    }
  }
  refreshBadges();

  function toast(text){const t=document.createElement("div");t.className="toast";t.innerHTML=`<b>NEXUS/OS</b><span>${text}</span>`;toastBox.appendChild(t);setTimeout(()=>t.classList.add("toast-out"),3300);setTimeout(()=>t.remove(),3800);}
  function updateClock(){const c=formatClock();document.querySelector("#clock-time").textContent=c.time;document.querySelector("#clock-date").textContent=c.date;}
  updateClock();on("clock:tick",updateClock);
  on("mission:started",({mission})=>{toast(`New job received: ${mission.title}`);renderOpenApps();});
  on("mission:progress",({objective})=>{toast(`Objective complete: ${objective.label}`);renderOpenApps();});
  on("mission:completed",({mission})=>{toast(`Job complete. ${mission.rewards.credits} credits transferred.`);renderOpenApps();setTimeout(()=>openApp("mail"),650);});
  on("hardware:purchased",({item})=>{toast(`${item.name} installed.`);renderOpenApps();});
  on("software:purchased",({item})=>{toast(`${item.name} installed.`);renderOpenApps();});
  on("clue:discovered",({clue})=>{toast(clue.kind==="world"?`World intel learned: ${clue.title}`:`Clue recorded: ${clue.title}`);renderOpenApps();});
  on("communications:changed",()=>renderOpenApps());
  on("timeline:event",({event})=>{if(event.notice)toast(event.notice);renderOpenApps();});

  function createWindow(id,title){
    playSound("ui_open");
    const existing=layer.querySelector(`[data-window="${id}"]`);if(existing){existing.classList.remove("hidden");existing.style.zIndex=String(++z);return existing.querySelector(".window-content");}
    const win=document.createElement("section");win.className="app-window";win.dataset.window=id;win.style.zIndex=String(++z);win.style.setProperty("--win-offset",`${offset}px`);offset=(offset+18)%72;
    win.innerHTML=`<div class="window-titlebar"><span class="window-app-title">${title}</span><div class="window-controls"><button data-min aria-label="Minimize">—</button><button data-close aria-label="Close">×</button></div></div><div class="window-content"></div>`;
    win.addEventListener("pointerdown",()=>win.style.zIndex=String(++z));
    win.querySelector("[data-close]").addEventListener("click",()=>{playSound("ui_close");win.remove();taskApps.querySelector(`[data-task="${id}"]`)?.remove();});
    win.querySelector("[data-min]").addEventListener("click",()=>win.classList.add("hidden"));layer.appendChild(win);
    const task=document.createElement("button");task.className="taskbar-app";task.dataset.task=id;task.textContent=title;task.addEventListener("click",()=>{win.classList.toggle("hidden");win.style.zIndex=String(++z);});taskApps.appendChild(task);return win.querySelector(".window-content");
  }

  function openApp(id){
    const app=DESKTOP_APPS.find(a=>a.id===id);if(!app)return;
    const el=createWindow(id,app.name);
    ({browser:renderBrowser,mail:renderMail,chat:renderChat,files:renderSystem,missions:renderMissions,notes:renderNotes,threatdesk:renderThreatDesk}[id])?.(el);
  }
  function renderOpenApps(){for(const win of layer.querySelectorAll(".app-window")){const fn={browser:renderBrowser,mail:renderMail,chat:renderChat,files:renderSystem,missions:renderMissions,notes:renderNotes,threatdesk:renderThreatDesk}[win.dataset.window];fn?.(win.querySelector(".window-content"));}refreshBadges();}

  function renderBrowser(el){
    const s=getState();
    el.innerHTML=`<div class="browser-chrome"><div class="browser-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Favorites&nbsp;&nbsp; Help</div><div class="app-toolbar browser-toolbar"><button data-nav="back">←</button><button data-site="news">News</button><button data-site="social">FriendSpace</button><button data-site="forum">NightWire</button><button data-site="packet">Packet Underground</button><button data-site="deaddrop">DeadDrop</button><button data-site="shop">ByteBarn</button><input value="nexus://${s.ui.lastBrowserSite||"news"}" aria-label="Address"></div></div><div class="app-body browser-page" id="browser-body"></div>`;
    const body=el.querySelector("#browser-body"),addr=el.querySelector("input");
    const show=site=>{s.ui.lastBrowserSite=site;addr.value=`nexus://${site}`;
      if(site==="news"){
        body.innerHTML=`<div class="site-head"><div class="site-logo">METROWIRE</div><span>LOCAL // TECHNOLOGY // BUSINESS</span></div>${NEWS.filter(visible).map(n=>n.clueId?`<button class="news-story news-story-button ${s.world.readNewsStories.includes(n.id)?"read":""}" data-news="${n.id}"><h2>${n.title}</h2><p>${n.body}</p><span class="feed-meta">MetroWire desk · Day ${s.world.day} · open story</span></button>`:`<article class="news-story"><h2>${n.title}</h2><p>${n.body}</p><span class="feed-meta">MetroWire desk · Day ${s.world.day}</span></article>`).join("")}`;
        body.querySelectorAll("[data-news]").forEach(btn=>btn.addEventListener("click",()=>{
          const id=btn.dataset.news;
          if(!s.world.readNewsStories.includes(id))s.world.readNewsStories.push(id);
          emit("news:read",{newsId:id});
          btn.classList.add("read");
          toast("You noticed technical details in the story.");refreshBadges();
        }));
      }
      if(site==="social"){
        body.innerHTML=`<div class="site-head friendspace"><div class="site-logo">FriendSpace</div><span>${s.player.alias}'s feed</span></div>${SOCIAL_POSTS.filter(visible).map(x=>`<article class="social-post"><div class="avatar">${x.name[0]}</div><div><h3>${x.name} <span>@${x.author}</span></h3><p>${x.body}</p><small>${x.time}</small>${x.clueId?`<button class="save-clue" data-social="${x.id}">${s.world.readSocialPosts.includes(x.id)?"Saved to BLACKBOX":"Save technical info"}</button>`:""}</div></article>`).join("")}`;
        body.querySelectorAll("[data-social]").forEach(btn=>btn.addEventListener("click",()=>{
          const id=btn.dataset.social;
          if(!s.world.readSocialPosts.includes(id))s.world.readSocialPosts.push(id);
          emit("social:read",{postId:id});
          btn.textContent="Saved to BLACKBOX";
          btn.disabled=true;refreshBadges();
        }));
      }
      if(site==="forum"){
        body.innerHTML=`<div class="site-head nightwire"><div class="site-logo">NIGHTWIRE</div><span>underground computing board</span></div><div class="forum-banner">READ THE RULES // NO REAL-WORLD TARGETS // KEEP IT IN THE LAB</div>${FORUM_POSTS.filter(visible).map(p=>`<button class="forum-thread" data-post="${p.id}"><b>${p.title}</b><span>by ${p.author}</span><p>${p.body}</p></button>`).join("")}`;
        body.querySelectorAll("[data-post]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.post;if(!s.world.readForumPosts.includes(id))s.world.readForumPosts.push(id);emit("forum:read",{postId:id});btn.classList.add("read");toast(id==="f1"?"Northstar host identified.":"Thread read. BLACKBOX will remember any technical details you actually learned.");refreshBadges();}));
      }
      if(site==="packet"){
        body.innerHTML=`<div class="site-head nightwire"><div class="site-logo">PACKET UNDERGROUND</div><span>FIELD NOTES // CLI // NETWORKING</span></div>
        <article class="news-story"><h2>Know where you are</h2><p><b>pwd</b> prints your working directory. <b>ls</b> lists it. <b>cd ..</b> moves up one level. These are real shell habits worth learning.</p></article>
        <article class="news-story"><h2>One host, more than one network</h2><p>Use <b>ip</b> to inspect interfaces. A remote system can have a second interface on a network HOME-PC cannot directly see.</p></article>
        <article class="news-story"><h2>Don't read a wall of logs</h2><p>Use <b>grep text file</b> to filter matching lines. <b>head</b> and <b>tail</b> are useful when you only need the beginning or end.</p></article>`;
      }
      if(site==="deaddrop"){
        const jobs=[
          ["Recovery Index","Meridian support recovery","mission_mirror_complete","mission_recovery_complete"],
          ["Ghost Account","Helix diagnostics review","mission_recovery_complete","mission_ghost_complete"],
          ["Preserve a Config","Axiom relay retirement","mission_ghost_complete","mission_deaddrop_complete"],
          ["The Relay","Axiom outbound review","mission_deaddrop_complete","mission_relay_complete"]
        ].filter(x=>hasFlag(x[2])&&!hasFlag(x[3]));
        body.innerHTML=`<div class="site-head nightwire"><div class="site-logo">DEADDROP</div><span>ANONYMOUS CONTRACT BOARD</span></div><div class="forum-banner">SIMULATED SYSTEMS ONLY // CONTRACTS APPEAR AS YOUR REPUTATION GROWS</div>${jobs.length?jobs.map(j=>`<article class="news-story"><h2>${j[0]}</h2><p>${j[1]}</p><span class="feed-meta">Check NEXUS Mail for contract details.</span></article>`).join(""):`<div class="empty-state">No contracts matching your current reputation.</div>`}`;
      }
      if(site==="shop"){
        body.innerHTML=`<div class="site-head bytebarn"><div class="site-logo">BYTEBARN</div><span>PC PARTS // SOFTWARE // SAME-DAY INSTALL</span></div><div class="store-balance">Available credits: <b>${s.player.credits}</b></div><h2>Hardware</h2><div class="shop-grid">${HARDWARE.map(h=>`<div class="shop-item"><span class="part-type">${h.type}</span><h3>${h.name}</h3><p>${h.description}</p><strong>${h.price} cr</strong><button data-buy="${h.id}" ${s.player.installedHardware.includes(h.id)?"disabled":""}>${s.player.installedHardware.includes(h.id)?"Installed":"Order & install"}</button></div>`).join("")}</div><h2>BLACKBOX Software</h2><div class="shop-grid">${SOFTWARE.map(h=>`<div class="shop-item"><span class="part-type">${h.type} software</span><h3>${h.name}</h3><p>${h.description}</p><strong>${h.price} cr</strong><button data-software="${h.id}" ${(s.player.installedSoftware||[]).includes(h.id)?"disabled":""}>${(s.player.installedSoftware||[]).includes(h.id)?"Installed":"Purchase license"}</button></div>`).join("")}</div>`;
        body.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{const result=buyHardware(btn.dataset.buy);toast(result.message);show("shop");}));
        body.querySelectorAll("[data-software]").forEach(btn=>btn.addEventListener("click",()=>{const result=buySoftware(btn.dataset.software);toast(result.message);show("shop");}));
      }
    };
    el.querySelectorAll("[data-site]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.site)));
    addr.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const site=addr.value.replace(/^nexus:\/\//,"").trim().toLowerCase();if(["news","social","forum","packet","deaddrop","shop"].includes(site))show(site);else{body.innerHTML=`<div class="browser-error"><h2>Page cannot be displayed</h2><p>NEXUS Explorer could not resolve <b>${site||"(blank)"}</b>.</p></div>`;}});
    show(s.ui.lastBrowserSite||"news");
  }

  function renderMail(el){
    const s=getState(),mails=EMAILS.filter(visible);
    el.innerHTML=`<div class="mail-header"><b>NEXUS Mail</b><span>${mails.filter(m=>!s.world.readEmails.includes(m.id)).length} unread</span></div><div class="mail-layout"><div class="sidebar mail-list">${mails.map(m=>`<button data-mail="${m.id}" class="${s.world.readEmails.includes(m.id)?"read":"unread"}"><span>${m.from.split("@")[0]}</span><b>${m.subject}</b></button>`).join("")}</div><div class="content-pane"><div class="empty-state">Select a message to read.</div></div></div>`;
    const pane=el.querySelector(".content-pane");el.querySelectorAll("[data-mail]").forEach(btn=>btn.addEventListener("click",()=>{const mail=mails.find(m=>m.id===btn.dataset.mail);pane.innerHTML=`<div class="mail-message"><h2>${mail.subject}</h2><div class="mail-meta">From: ${mail.from}<br>To: ${s.player.alias}@nexus.local</div><div class="mail-body">${mail.body}</div></div>`;if(!s.world.readEmails.includes(mail.id))s.world.readEmails.push(mail.id);btn.classList.remove("unread");btn.classList.add("read");emit("email:read",{emailId:mail.id});refreshBadges();}));
  }

  function messageTime(message,state){
    if(!message.timeFromEvent)return message.time||"";
    const event=(state.world.caseHistory||[]).find(x=>x.id===`event:${message.timeFromEvent}`);
    if(!event)return message.time||"";
    return `${String(Math.floor(event.minute/60)).padStart(2,"0")}:${String(event.minute%60).padStart(2,"0")}`;
  }

  function renderChat(el){
    const s=getState();
    const thread=THREADS.find(x=>x.id===activeThreadId)||THREADS[0];
    activeThreadId=thread.id;
    const messages=thread.messages.filter(m=>(m.visibleWhen||[]).every(hasFlag));
    const pending=messages.find(m=>m.choice && !m.choice.options.some(o=>choiceMade(o.id)));

    const newlyRead=[];
    if(!el.closest(".app-window")?.classList.contains("hidden"))for(const m of messages){
      if(m.from!=="player"&&!(s.world.readMessages||[]).includes(m.id)){
        s.world.readMessages.push(m.id);
        newlyRead.push(m.id);
        emit("message:read",{messageId:m.id,threadId:thread.id});
      }
    }
    if(newlyRead.length)emit("thread:read",{threadId:thread.id,messageIds:newlyRead});

    const online=THREADS.filter(x=>x.status==="online");
    const others=THREADS.filter(x=>x.status!=="online");
    const buddy=(x)=>`<button data-thread="${x.id}" class="${x.id===thread.id?"active":""}">${x.status==="online"?'<span class="online-dot"></span>':""}${x.name}</button>`;

    el.innerHTML=`<div class="messenger-top"><b>NEXUS Messenger</b><span><span class="online-dot"></span> Online</span></div>
      <div class="chat-layout">
        <div class="sidebar buddy-list">
          <div class="buddy-group">Friends (${online.length})</div>${online.map(buddy).join("")}
          <div class="buddy-group">Away / Offline (${others.length})</div>${others.map(buddy).join("")}
        </div>
        <div class="content-pane chat-pane">
          <div class="chat-history">${messages.map(m=>`<div class="chat-line"><span class="chat-time">${messageTime(m,s)}</span><b>${m.from==="player"?s.player.alias:thread.name}:</b> ${m.text}</div>`).join("")}</div>
          ${pending?`<div class="chat-choices">${pending.choice.options.map(o=>`<button data-choice="${o.id}">${o.text}</button>`).join("")}</div>`:`<div class="chat-compose"><input placeholder="No reply needed right now." disabled><button disabled>Send</button></div>`}
        </div>
      </div>`;

    el.querySelectorAll("[data-thread]").forEach(btn=>btn.addEventListener("click",()=>{activeThreadId=btn.dataset.thread;renderChat(el);}));
    refreshBadges();
    el.querySelectorAll("[data-choice]").forEach(btn=>btn.addEventListener("click",()=>{
      const result=makeChoice(btn.dataset.choice);
      if(result.ok){toast("Message sent.");renderChat(el);}
    }));
  }

  function renderSystem(el){
    const s=getState();
    const knownHosts=(s.player.savedTargets||[]).map(entry=>HOSTS[entry.hostId]).filter(Boolean);
    const clues=getKnownClues();
    const caseClues=clues.filter(c=>c.kind!=="world"),worldIntel=clues.filter(c=>c.kind==="world");
    el.innerHTML=`<div class="app-body">
      <div class="system-title"><div class="computer-glyph">🖥️</div><div><h2>${s.player.alias}'s Computer</h2><span>NEXUS/OS Personal Workstation</span></div></div>
      <div class="system-grid">
        <div class="stat"><b>Processor</b><br>${s.player.installedHardware.includes("cpu_p3_933")?"Northstar P3 933 MHz":"Northstar P3 733 MHz"}</div>
        <div class="stat"><b>Memory</b><br>${s.player.installedHardware.includes("ram_256")?"384":"128"} MB</div>
        <div class="stat"><b>Network</b><br>${s.player.installedHardware.includes("nic_fast")?"FastLink 100":"EtherLink 10"}</div>
        <div class="stat"><b>Credits</b><br>${s.player.credits}</div>
        <div class="stat"><b>Reputation</b><br>${s.player.reputation}</div>
        <div class="stat"><b>BLACKBOX</b><br>0.3.0 installed</div>
      </div>
      <div class="card"><h3>Installed software</h3><p>${(s.player.installedSoftware||[]).map(id=>({resolver_basic:"Basic Resolver",resolver_pro:"Resolver Pro",scan_suite:"WideScan Suite",logscope:"LogScope"}[id]||id)).join(" · ")}</p></div>
      <div class="card"><h3>BLACKBOX proficiencies</h3><div class="system-grid">${Object.entries(s.player.proficiencies||{}).map(([skill,value])=>`<div class="stat"><b>${skill[0].toUpperCase()+skill.slice(1)}</b><br>${proficiencyLabel(value)} (${value})</div>`).join("")}</div><p class="muted">Proficiency grows by using real CLI and investigation concepts, not by spending skill points.</p></div>
      <div class="card"><h3>Known BLACKBOX targets</h3>${knownHosts.length?knownHosts.map((h,i)=>`<div class="target-row"><b>[${i}] ${displayName(h.id)}</b><span>${h.address}</span></div>`).join(""):"<p>No remote targets saved.</p>"}</div>
      <div class="card"><h3>Downloaded evidence</h3>${(s.player.downloads||[]).length?(s.player.downloads||[]).map(x=>`<div class="clue-row"><b>${x.split(":")[0].toUpperCase()}</b><span>${x.split(":").slice(1).join(":")}</span></div>`).join(""):"<p>No evidence files stored locally.</p>"}</div>
      <div class="card"><h3>Case clues</h3>${caseClues.length?caseClues.map(c=>`<div class="clue-row"><b>${c.title}</b><span>${c.summary}</span></div>`).join(""):"<p>No case clues recorded.</p>"}</div>
      <div class="card"><h3>World intel</h3>${worldIntel.length?worldIntel.map(c=>`<div class="clue-row"><b>${c.title}</b><span>${c.summary}</span></div>`).join(""):"<p>No optional world intel learned yet.</p>"}</div>
      <div class="card blackbox-launch"><div><h3>BLACKBOX Secure Environment</h3><p>Launch or resume the isolated simulated terminal workspace.</p></div><button id="system-blackbox">ENTER BLACKBOX</button></div>
    </div>`;
    el.querySelector("#system-blackbox").addEventListener("click",enterBlackbox);
  }

  function renderMissions(el){
    const s=getState(),active=missionView(),completed=(s.world.completedMissions||[]).map(id=>MISSIONS.find(m=>m.id===id)).filter(Boolean);
    const worldHistory=(s.world.caseHistory||[]).filter(x=>x.kind==="world").slice(-8).reverse();
    el.innerHTML=`<div class="app-body"><h2>Jobs</h2>${active.length?active.map(m=>`<div class="card mission-box"><div class="mission-title"><h3>${m.title}</h3><span>ACTIVE</span></div><p>${m.description}</p><div class="objective-list">${m.objectives.map(o=>`<div class="${m.progress[o.id]?"done":""}">${m.progress[o.id]?"☑":"☐"} ${o.label}</div>`).join("")}</div></div>`).join(""):`<div class="empty-state compact">No active jobs. Check your email, messages, and ThreatDesk.</div>`}<h2>Completed Cases</h2>${completed.length?completed.slice().reverse().map(m=>`<div class="case-history-row"><b>✓ ${m.title}</b><span>${m.description}</span></div>`).join(""):`<p class="muted">No completed cases yet.</p>`}<h2>World Timeline</h2>${worldHistory.length?worldHistory.map(x=>`<div class="case-history-row"><b>Day ${x.day} · ${String(Math.floor(x.minute/60)).padStart(2,"0")}:${String(x.minute%60).padStart(2,"0")}</b><span>${x.title||x.id}</span></div>`).join(""):`<p class="muted">No later world updates yet.</p>`}</div>`;
  }

  function renderThreatDesk(el){
    const s=getState();
    if(!hasFlag("threatdesk_online")){el.innerHTML='<div class="empty-state"><b>NEXUS ThreatDesk</b><br>Feed authorization is still initializing. Continue using NEXUS/OS.</div>';return;}
    const reports=THREATS.filter(visible);
    el.innerHTML=`<div class="threatdesk-head"><div><b>NEXUS ThreatDesk</b><span>SIMULATED THREAT INTELLIGENCE</span></div><strong>FEED ONLINE</strong></div>
      <div class="threatdesk-body">
        <section class="td-panel"><h2>Lookup Tools</h2><p>Query the fictional NEXUS resolver. No real DNS request is sent.</p><form id="td-lookup" class="td-lookup"><input id="td-name" placeholder="hostname.test" autocapitalize="none" autocomplete="off"><button>Resolve</button></form><pre id="td-result" class="td-result">Enter a fictional hostname.</pre></section>
        <section class="td-panel"><h2>Threat Feed</h2><div class="td-feed">${reports.map(r=>`<button data-threat="${r.id}" class="td-report ${(s.world.readThreats||[]).includes(r.id)?"read":"unread"}"><span>${r.severity}</span><b>${r.title}</b><small>${r.body}</small></button>`).join("")}</div></section>
        <section class="td-panel"><h2>Field Notes</h2>${FIELD_NOTES.map(n=>`<details><summary>${n.title}</summary><p>${n.body}</p></details>`).join("")}</section>
        <section class="td-panel"><h2>Training Lab</h2>${LABS.map(l=>`<div class="td-lab"><b>${l.title} ${(s.world.completedLabs||[]).includes(l.id)?"✓":""}</b><p>${l.question}</p><div>${l.options.map(o=>`<button data-lab="${l.id}" data-answer="${o}">${o}</button>`).join("")}</div></div>`).join("")}</section>
      </div>`;
    el.querySelectorAll("[data-threat]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.threat;if(!s.world.readThreats.includes(id))s.world.readThreats.push(id);emit("threat:read",{threatId:id});btn.classList.remove("unread");btn.classList.add("read");toast("ThreatDesk report recorded.");refreshBadges();}));
    el.querySelectorAll("[data-lab]").forEach(btn=>btn.addEventListener("click",()=>{const lab=LABS.find(x=>x.id===btn.dataset.lab);if(!lab)return;if(btn.dataset.answer!==lab.answer){toast("Not quite. Review the Field Notes and try again.");return;}if(!s.world.completedLabs.includes(lab.id)){s.world.completedLabs.push(lab.id);emit("lab:completed",{labId:lab.id});}toast(lab.explanation);renderThreatDesk(el);}));
    el.querySelector("#td-lookup").addEventListener("submit",e=>{e.preventDefault();const out=el.querySelector("#td-result");try{out.textContent=formatDnsResult(lookupDns(el.querySelector("#td-name").value,"ANY"),{detailed:(s.player.installedSoftware||[]).includes("resolver_pro")});}catch(err){out.textContent=err.message;}});
  }

  function renderNotes(el){const s=getState();el.innerHTML=`<div class="notepad-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; Format&nbsp;&nbsp; Help</div><textarea id="player-notes" class="notepad" spellcheck="false" placeholder="Write anything you want to remember...">${s.player.notes||""}</textarea>`;const ta=el.querySelector("#player-notes");ta.addEventListener("input",()=>{s.player.notes=ta.value;});}

  return {openApp,toast,refresh:renderOpenApps};
}
