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
import { DESKTOP_APPS, BLACKBOX_SHORTCUT } from "../data/apps.js";
import { on, emit } from "../core/events.js";
import { buyHardware, buySoftware } from "../systems/hardware.js";
import { missionView } from "../systems/missions.js";
import { formatClock } from "../core/clock.js";
import { saveGame, getPersistenceStatus } from "../core/save.js";
import { makeChoice, choiceMade, recordPresentedThread, setWaitingForReply } from "../systems/communications.js";
import { getKnownClues, reconcilePresentedMessageClues } from "../systems/clues.js";
import { HOSTS } from "../data/hosts.js";
import { proficiencyLabel } from "../systems/progression.js";
import { displayName } from "../systems/network.js";
import { playSound, toggleAudio, isAudioEnabled } from "../systems/audio.js";
import { lookupDns, formatDnsResult } from "../systems/dns.js";
import { escapeHtml } from "./safeText.js";
import { contentAvailable, contentDelivery } from "../systems/contentAvailability.js";
import { chronologyAvailable, contentAbsoluteTime, contentTimeLabel, sortChronologically } from "../systems/contentChronology.js";
import { nexusNetworkOnline, nexusDnsOnline, setNetworkAdapter, renewDhcp, repairNetwork, setFirewallEnabled, setFirewallRule, setService, setDeviceEnabled, systemSnapshot } from "../systems/nexusSystem.js";

function visible(item){return contentAvailable(item);}
function visibleSocial(item){return contentAvailable(item)&&chronologyAvailable(item,{kind:"social"});}
function visibleMessage(item){return contentAvailable(item)&&chronologyAvailable(item,{kind:"message"});}

const NEXUS_KEYBOARD_ROWS=["1234567890","qwertyuiop","asdfghjkl","zxcvbnm"];
const isCoarsePointer=()=>!!globalThis.matchMedia?.("(pointer: coarse)")?.matches;

export function initDesktopUI({enterBlackbox}){
  const icons=document.querySelector("#desktop-icons"),startList=document.querySelector("#start-app-list"),startMenu=document.querySelector("#start-menu"),layer=document.querySelector("#window-layer"),taskApps=document.querySelector("#taskbar-apps"),toastBox=document.querySelector("#notifications"),audioButton=document.querySelector("#audio-button");
  // Identity restore can initialize the desktop again in the same page lifetime.
  // Clear identity-owned presentation so Messenger and every app rebuild from restored canonical state.
  icons.replaceChildren();
  startList.replaceChildren();
  layer.replaceChildren();
  taskApps.replaceChildren();
  toastBox.replaceChildren();
  let z=20,offset=0,activeThreadId="maya",selectedMailId=null,renderScheduled=false;
  const systemView={tool:"explorer",path:"C:\\"};
  const browserHistory=[];
  const threatDeskView={query:"",output:"Enter a fictional hostname."};

  for(const app of DESKTOP_APPS){
    const b=document.createElement("button");b.className="desktop-icon";b.dataset.appIcon=app.id;b.innerHTML=`<span class="glyph">${app.glyph}</span><span>${app.shortName}</span><span class="app-badge hidden" aria-label="unread items"></span>`;b.addEventListener("click",()=>openApp(app.id));icons.appendChild(b);
    const s=document.createElement("button");s.textContent=`${app.glyph} ${app.name}`;s.addEventListener("click",()=>{startMenu.classList.add("hidden");openApp(app.id);});startList.appendChild(s);
  }
  const blackboxIcon=document.createElement("button");
  blackboxIcon.className="desktop-icon blackbox-desktop-icon";
  blackboxIcon.dataset.appIcon=BLACKBOX_SHORTCUT.id;
  blackboxIcon.innerHTML=`<span class="glyph svg-glyph" aria-hidden="true">${BLACKBOX_SHORTCUT.glyphSvg}</span><span>${BLACKBOX_SHORTCUT.shortName}</span><span class="app-badge hidden" aria-label="unread items"></span>`;
  blackboxIcon.addEventListener("click",()=>enterBlackbox());
  icons.appendChild(blackboxIcon);
  document.querySelector("#start-button").addEventListener("click",()=>startMenu.classList.toggle("hidden"));
  document.querySelector("#blackbox-button").addEventListener("click",()=>{startMenu.classList.add("hidden");enterBlackbox();});
  document.querySelector("#save-button").addEventListener("click",()=>{const result=saveGame();toast(result.ok?"Game saved to local disk.":"Save failed. Your last stored save was preserved.");syncSaveWarning();});
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
    if(appId==="chat")return THREADS.flatMap(x=>x.messages).filter(x=>x.from!=="player"&&visibleMessage(x)&&!(s.world.readMessages||[]).includes(x.id)).length;
    if(appId==="browser")return NEWS.filter(x=>x.clueId&&visible(x)&&!s.world.readNewsStories.includes(x.id)).length+FORUM_POSTS.filter(x=>x.clueId&&visible(x)&&!s.world.readForumPosts.includes(x.id)).length+SOCIAL_POSTS.filter(x=>x.clueId&&visibleSocial(x)&&!s.world.readSocialPosts.includes(x.id)).length;
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

  function toast(text,{duration=3300,titleText="NEXUS/OS"}={}){
    const t=document.createElement("div"),title=document.createElement("b"),message=document.createElement("span");
    t.className="toast";title.textContent=titleText;message.textContent=String(text);
    t.append(title,message);toastBox.appendChild(t);
    setTimeout(()=>t.classList.add("toast-out"),duration);setTimeout(()=>t.remove(),duration+500);
  }
  function syncSaveWarning(){
    const status=getPersistenceStatus();
    let warning=toastBox.querySelector("[data-save-warning]");
    if(status.ok){warning?.remove();return;}
    if(!warning){
      warning=document.createElement("div");warning.className="toast save-warning";warning.dataset.saveWarning="1";
      const title=document.createElement("b"),message=document.createElement("span");title.textContent="SAVE WARNING";warning.append(title,message);toastBox.appendChild(warning);
    }
    warning.querySelector("span").textContent=`Progress cannot be saved right now. Last good save preserved. ${status.error||"Browser storage unavailable."}`;
  }
  syncSaveWarning();
  function updateClock(){const c=formatClock();document.querySelector("#clock-time").textContent=c.time;document.querySelector("#clock-date").textContent=c.date;}
  updateClock();on("clock:tick",updateClock);
  on("mission:started",({mission})=>{toast(`New job received: ${mission.title}`);scheduleRenderOpenApps();});
  on("mission:progress",({objective})=>{toast(`Objective complete: ${objective.label}`);scheduleRenderOpenApps();});
  on("mission:completed",({mission})=>{toast(`Job complete. ${mission.rewards.credits} credits transferred.`);scheduleRenderOpenApps();setTimeout(()=>openApp("mail"),650);});
  on("hardware:purchased",({item})=>{toast(`${item.name} installed.`);scheduleRenderOpenApps();});
  on("software:purchased",({item})=>{toast(`${item.name} installed.`);scheduleRenderOpenApps();});
  on("clue:discovered",({clue})=>{
    if(clue.kind==="world")toast(`World intel learned: ${clue.title}. Recorded in My Computer → World Intel and BLACKBOX "clues".`,{duration:5200,titleText:"WORLD INTEL"});
    else toast(`Clue recorded: ${clue.title}`);
    scheduleRenderOpenApps();
  });
  on("communications:changed",()=>scheduleRenderOpenApps());
  on("timeline:event",({event})=>{if(event.notice)toast(event.notice);scheduleRenderOpenApps();});
  on("content:delivered",()=>scheduleRenderOpenApps());
  on("content:cancelled",()=>scheduleRenderOpenApps());
  on("content:expired",()=>scheduleRenderOpenApps());
  on("content:replaced",()=>scheduleRenderOpenApps());
  on("save:status",()=>syncSaveWarning());
  on("nexus:system-changed",()=>scheduleRenderOpenApps());

  function createWindow(id,title){
    playSound("ui_open");
    const existing=layer.querySelector(`[data-window="${id}"]`);if(existing){existing.classList.remove("hidden");existing.style.zIndex=String(++z);return existing.querySelector(".window-content");}
    const win=document.createElement("section");win.className="app-window";win.dataset.window=id;win.style.zIndex=String(++z);win.style.setProperty("--win-offset",`${offset}px`);offset=(offset+18)%72;
    win.innerHTML=`<div class="window-titlebar"><span class="window-app-title">${title}</span><div class="window-controls"><button data-min aria-label="Minimize">—</button><button data-close aria-label="Close">×</button></div></div><div class="window-content"></div>`;
    win.addEventListener("pointerdown",()=>win.style.zIndex=String(++z));
    win.querySelector("[data-close]").addEventListener("click",()=>{playSound("ui_close");win.remove();taskApps.querySelector(`[data-task="${id}"]`)?.remove();});
    win.querySelector("[data-min]").addEventListener("click",()=>win.classList.add("hidden"));layer.appendChild(win);
    const task=document.createElement("button");task.className="taskbar-app";task.dataset.task=id;task.title=title;task.setAttribute("aria-label",title);
    const appDef=DESKTOP_APPS.find(app=>app.id===id);
    const taskGlyph=document.createElement("span"),taskLabel=document.createElement("span");
    taskGlyph.className="taskbar-app-glyph";taskGlyph.setAttribute("aria-hidden","true");taskGlyph.textContent=appDef?.glyph||"▣";
    taskLabel.className="taskbar-app-label";taskLabel.textContent=title;task.append(taskGlyph,taskLabel);task.addEventListener("click",()=>{
      const restoring=win.classList.contains("hidden");win.classList.toggle("hidden");win.style.zIndex=String(++z);
      if(restoring)renderWindow(id,win.querySelector(".window-content"));
    });taskApps.appendChild(task);return win.querySelector(".window-content");
  }

  function renderWindow(id,el){
    ({browser:renderBrowser,mail:renderMail,chat:renderChat,files:renderSystem,missions:renderMissions,notes:renderNotes,threatdesk:renderThreatDesk}[id])?.(el);
  }
  function openApp(id){
    const app=DESKTOP_APPS.find(a=>a.id===id);if(!app)return;
    const el=createWindow(id,app.name);
    renderWindow(id,el);
  }
  function renderOpenApps(){
    for(const win of layer.querySelectorAll(".app-window")){
      if(win.dataset.window==="notes")continue;
      renderWindow(win.dataset.window,win.querySelector(".window-content"));
    }
    refreshBadges();
  }
  function scheduleRenderOpenApps(){
    if(renderScheduled)return;renderScheduled=true;
    queueMicrotask(()=>{renderScheduled=false;renderOpenApps();});
  }

  function deliveryLabel(item,{includeDay=true}={}){
    const delivered=contentDelivery(item);
    if(!delivered)return null;
    const h=String(Math.floor(delivered.minute/60)).padStart(2,"0"),m=String(delivered.minute%60).padStart(2,"0");
    return includeDay?`Day ${delivered.day} · ${h}:${m}`:`${delivered.day>1?`D${delivered.day} `:""}${h}:${m}`;
  }

  function renderBrowser(el){
    const s=getState();
    const browserSites=new Set(["news","social","forum","packet","deaddrop","shop"]);
    const siteUrl={
      news:"http://www.metrowire.local/",social:"http://www.friendspace.local/home/",forum:"http://nightwire.local/board/",
      packet:"http://packet-underground.local/notes/",deaddrop:"http://deaddrop.local/contracts/",shop:"http://www.bytebarn.local/classifieds/"
    };
    const aliasMap={
      "metrowire.local":"news","www.metrowire.local":"news","news":"news",
      "friendspace.local":"social","www.friendspace.local":"social","social":"social",
      "nightwire.local":"forum","forum":"forum",
      "packet-underground.local":"packet","packet":"packet",
      "deaddrop.local":"deaddrop","deaddrop":"deaddrop",
      "bytebarn.local":"shop","www.bytebarn.local":"shop","shop":"shop"
    };
    el.innerHTML=`<div class="browser-chrome browser-retro">
      <div class="browser-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Go&nbsp;&nbsp; Favorites&nbsp;&nbsp; Help</div>
      <div class="app-toolbar browser-toolbar retro-toolbar">
        <button data-nav="back" title="Back">← Back</button><button data-nav="home">Home</button><button data-nav="refresh">Refresh</button><button data-nav="favorites">Favorites</button>
        <label class="browser-address-label">Address:</label><input aria-label="Address" spellcheck="false" autocapitalize="none">
      </div>
      <div class="browser-links" aria-label="Favorites bar"><button data-site="news">MetroWire</button><button data-site="social">FriendSpace</button><button data-site="forum">NightWire</button><button data-site="packet">Packet Underground</button><button data-site="deaddrop">DeadDrop</button><button data-site="shop">ByteBarn</button></div>
    </div><div class="app-body browser-page browser-page-retro" id="browser-body"></div>`;
    const body=el.querySelector("#browser-body"),addr=el.querySelector("input"),back=el.querySelector('[data-nav="back"]');
    const updateBack=()=>{back.disabled=browserHistory.length===0;};
    const browserFailure=(title,message,hint="")=>{body.innerHTML=`<div class="browser-error browser-error-90"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${hint?`<p><b>Troubleshooting:</b> ${escapeHtml(hint)}</p>`:""}<hr><small>NEXUS Explorer</small></div>`;};
    const renderSite=site=>{
      if(!nexusNetworkOnline()){
        browserFailure("Work Offline","NEXUS Explorer cannot load this page because Local Area Connection is disabled.","Open My Computer → Control Panel → Network Connections and enable or repair the adapter.");
        return;
      }
      if(!nexusDnsOnline()){
        browserFailure("Cannot find server or DNS Error","The network link is up, but the NEXUS DNS Client service is not running.","Open My Computer → Control Panel → Administrative Tools → Services and start DNS Client, or use Network Repair.");
        return;
      }
      if(site==="news"){
        body.innerHTML=`<div class="web90 metrowire90"><div class="mw-masthead"><div class="mw-date">DAY ${s.world.day} // ${formatClock().time}</div><div class="mw-logo">METROWIRE</div><div class="mw-tag">LOCAL • TECHNOLOGY • BUSINESS • COMMUNITY</div></div><div class="mw-nav"><a>Local</a> | <a>Technology</a> | <a>Business</a> | <a>Weather</a> | <a>Classifieds</a></div><div class="mw-columns"><main>${NEWS.filter(visible).map(n=>n.clueId?`<button class="mw-story mw-story-button ${s.world.readNewsStories.includes(n.id)?"read":""}" data-news="${n.id}"><h2>${n.title}</h2><p>${n.body}</p><span>${contentTimeLabel(n,s,{includeDay:true})||`Day ${s.world.day}`} · click for details</span></button>`:`<article class="mw-story"><h2>${n.title}</h2><p>${n.body}</p><span>${contentTimeLabel(n,s,{includeDay:true})||`Day ${s.world.day}`}</span></article>`).join("")}</main><aside><b>METROWIRE ONLINE</b><p>Your local source for city desk updates and technology news.</p><hr><a>Send a tip</a><br><a>About MetroWire</a><br><a>Archives</a><p class="web-counter">Visitors: 001284</p></aside></div><div class="web90-footer">Best viewed at 800×600 • © NEXUS MetroWire</div></div>`;
        body.querySelectorAll("[data-news]").forEach(btn=>btn.addEventListener("click",()=>{
          const id=btn.dataset.news;if(!s.world.readNewsStories.includes(id))s.world.readNewsStories.push(id);emit("news:read",{newsId:id});btn.classList.add("read");toast("You noticed technical details in the story.");refreshBadges();
        }));
      }
      if(site==="social"){
        const posts=sortChronologically(SOCIAL_POSTS.filter(visibleSocial),s,{direction:"desc"});
        body.innerHTML=`<div class="web90 friendspace90"><div class="fs-header"><div class="fs-logo">FriendSpace</div><div>connect // share // post</div></div><div class="fs-nav"><a>Home</a> | <a>Profiles</a> | <a>Friends</a> | <a>Messages</a> | <a>Search</a> | <a>My Page</a></div><div class="fs-welcome"><b>Welcome back, ${escapeHtml(s.player.alias)}!</b><br><small>Status: Online • Your page has 17 visitors today.</small></div><div class="fs-feed">${posts.map(x=>`<article class="fs-post"><div class="fs-avatar">${x.name[0]}</div><div><h3>${x.name} <span>@${x.author}</span></h3><p>${x.body}</p><small>${contentTimeLabel(x,s,{includeDay:false})}</small>${x.clueId?`<button class="old-web-button" data-social="${x.id}" ${s.world.readSocialPosts.includes(x.id)?"disabled":""}>${s.world.readSocialPosts.includes(x.id)?"Saved to BLACKBOX":"Save technical info"}</button>`:""}</div></article>`).join("")}</div><div class="web90-footer">FriendSpace v1.8 • This page is best viewed with NEXUS Explorer 4.0</div></div>`;
        body.querySelectorAll("[data-social]").forEach(btn=>btn.addEventListener("click",()=>{
          const id=btn.dataset.social;if(!s.world.readSocialPosts.includes(id))s.world.readSocialPosts.push(id);emit("social:read",{postId:id});btn.textContent="Saved to BLACKBOX";btn.disabled=true;refreshBadges();
        }));
      }
      if(site==="forum"){
        body.innerHTML=`<div class="web90 nightwire90"><div class="nw-title">NIGHTWIRE // MESSAGE BOARD</div><div class="nw-sub">"learn the systems before you touch them"</div><div class="nw-nav">[ <a>THREADS</a> ] [ <a>USERS</a> ] [ <a>ARCHIVES</a> ] [ <a>RULES</a> ]</div><div class="nw-rules">READ THE RULES // NO REAL-WORLD TARGETS // KEEP IT IN THE LAB</div><table class="nw-table"><thead><tr><th>THREAD</th><th>AUTHOR</th><th>STATUS</th></tr></thead><tbody>${FORUM_POSTS.filter(visible).map(p=>`<tr><td><button class="nw-thread ${s.world.readForumPosts.includes(p.id)?"read":""}" data-post="${p.id}"><b>${p.title}</b><span>${p.body}</span></button></td><td>${p.author}</td><td>${s.world.readForumPosts.includes(p.id)?"READ":"NEW"}</td></tr>`).join("")}</tbody></table><div class="nw-foot">NightWire board software 2.6.3 // ${FORUM_POSTS.filter(visible).length} visible threads // plaintext preferred</div></div>`;
        body.querySelectorAll("[data-post]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.post;if(!s.world.readForumPosts.includes(id))s.world.readForumPosts.push(id);emit("forum:read",{postId:id});btn.classList.add("read");toast(id==="f1"?"Northstar host identified.":"Thread read. BLACKBOX will remember any technical details you actually learned.");refreshBadges();renderSite("forum");}));
      }
      if(site==="packet"){
        body.innerHTML=`<div class="web90 packet90"><div class="pk-header"><b>PACKET UNDERGROUND</b><span>FIELD NOTES // CLI // NETWORKING</span></div><div class="pk-nav"><a>Topics</a> | <a>Command Index</a> | <a>DNS</a> | <a>Routing</a> | <a>Archives</a> | <a>New Posts</a></div><article><h1>Know where you are</h1><p><code>pwd</code> prints your working directory. <code>ls</code> lists what is in that location. <code>cd ..</code> moves up one level.</p><pre>guest@archives-01:~$ pwd\n/home/guest</pre><p class="pk-tip"><b>TIP:</b> <code>~</code> usually represents the current user's home directory. <code>/</code> is the filesystem root.</p></article><article><h1>One host, more than one network</h1><p>Use <code>ip</code> to inspect interfaces. A remote host can have another interface on a network HOME-PC cannot directly reach.</p></article><article><h1>Don't read a wall of logs</h1><p>Use <code>grep text file</code> to filter matching lines. <code>head</code> and <code>tail</code> are useful when you only need the beginning or end.</p></article><div class="web90-footer">Packet Underground field notes • Last edited by packetmoth • Text over decoration</div></div>`;
      }
      if(site==="deaddrop"){
        const jobs=[
          ["Recovery Index","Meridian support recovery","mission_mirror_complete","mission_recovery_complete"],
          ["Ghost Account","Helix diagnostics review","mission_recovery_complete","mission_ghost_complete"],
          ["Preserve a Config","Axiom relay retirement","mission_ghost_complete","mission_deaddrop_complete"],
          ["The Relay","Axiom outbound review","mission_deaddrop_complete","mission_relay_complete"]
        ].filter(x=>hasFlag(x[2])&&!hasFlag(x[3]));
        body.innerHTML=`<div class="web90 deaddrop90"><div class="dd-head"><b>DEADDROP</b><span>anonymous contract index // text preferred</span></div><div class="dd-nav"><a>INDEX</a> <a>NEW</a> <a>MIRRORS</a> <a>RULES.TXT</a> <a>CONTACT</a></div><div class="dd-warning"><b>NOTICE:</b> SIMULATED SYSTEMS ONLY. No real-world targets or credentials.</div><div class="dd-index"><div class="dd-index-head">/contracts/ — available work</div>${jobs.length?jobs.map(j=>`<article><a>${j[0]}</a><span>${j[1]}</span><small>Check NEXUS Mail for contract details.</small></article>`).join(""):`<p>No contracts matching your current reputation.</p>`}</div><pre class="dd-status">DEADDROP MIRROR STATUS\n----------------------\nnode: DD-MIRROR-02\nprotocol: http/text\ncontract index: ${jobs.length}\n\n&gt; save references locally if they matter</pre><div class="web90-footer">DEADDROP v2.3 • plaintext forever</div></div>`;
      }
      if(site==="shop"){
        body.innerHTML=`<div class="web90 bytebarn90"><div class="bbn-logo"><b>BYTEBARN</b><span>USED COMPUTERS • PARTS • SOFTWARE • SAME-DAY INSTALL</span></div><div class="bbn-ticker">*** NEW LISTINGS DAILY *** AVAILABLE CREDITS: ${s.player.credits} *** LOCAL FICTIONAL MARKET ***</div><div class="bbn-nav"><a>Computers</a> | <a>Modems</a> | <a>Drives</a> | <a>Networking</a> | <a>Software</a> | <a>Wanted</a></div><section class="bbn-section"><h2>Hardware</h2>${HARDWARE.map(h=>`<article class="bbn-listing"><div class="bbn-photo">${h.type.toUpperCase()}<br>PHOTO</div><div><h3>${h.name}</h3><p>${h.description}</p><small>${h.type.toUpperCase()} • tested in NEXUS lab</small></div><strong>${h.price} cr</strong><button class="old-web-button" data-buy="${h.id}" ${s.player.installedHardware.includes(h.id)?"disabled":""}>${s.player.installedHardware.includes(h.id)?"INSTALLED":"ORDER & INSTALL"}</button></article>`).join("")}</section><section class="bbn-section"><h2>BLACKBOX Software</h2>${SOFTWARE.map(h=>`<article class="bbn-listing"><div class="bbn-photo">SOFT<br>WARE</div><div><h3>${h.name}</h3><p>${h.description}</p><small>${h.type.toUpperCase()} SOFTWARE • digital delivery</small></div><strong>${h.price} cr</strong><button class="old-web-button" data-software="${h.id}" ${(s.player.installedSoftware||[]).includes(h.id)?"disabled":""}>${(s.player.installedSoftware||[]).includes(h.id)?"INSTALLED":"PURCHASE LICENSE"}</button></article>`).join("")}</section><div class="bbn-rules"><b>BYTEBARN RULES:</b> Test your junk before listing it. No real-world purchases. All credits and parts are simulated.</div><div class="web90-footer">You are visitor [ 0001847 ] • Best viewed at 800×600</div></div>`;
        body.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{const result=buyHardware(btn.dataset.buy);toast(result.message);renderSite("shop");}));
        body.querySelectorAll("[data-software]").forEach(btn=>btn.addEventListener("click",()=>{const result=buySoftware(btn.dataset.software);toast(result.message);renderSite("shop");}));
      }
    };
    const show=(site,{record=true}={})=>{
      if(!browserSites.has(site))site="news";
      const previous=s.ui.lastBrowserSite;
      if(record&&previous&&previous!==site&&browserSites.has(previous))browserHistory.push(previous);
      s.ui.lastBrowserSite=site;addr.value=siteUrl[site];if(previous!==site)emit("browser:navigated",{site});updateBack();renderSite(site);
    };
    el.querySelectorAll("[data-site]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.site)));
    back.addEventListener("click",()=>{const site=browserHistory.pop();if(site)show(site,{record:false});updateBack();});
    el.querySelector('[data-nav="home"]').addEventListener("click",()=>show("news"));
    el.querySelector('[data-nav="refresh"]').addEventListener("click",()=>renderSite(s.ui.lastBrowserSite));
    el.querySelector('[data-nav="favorites"]').addEventListener("click",()=>toast("Favorites: MetroWire · FriendSpace · NightWire · Packet Underground · DeadDrop · ByteBarn"));
    addr.addEventListener("keydown",e=>{if(e.key!=="Enter")return;let raw=addr.value.trim().toLowerCase().replace(/^nexus:\/\//,"").replace(/^https?:\/\//,"").replace(/\/.*$/,"");const site=aliasMap[raw];if(site)show(site);else{browserFailure("Page cannot be displayed",`NEXUS Explorer could not resolve ${raw||"(blank)"}.`,`Check the address, network adapter, DNS Client service, and firewall settings.`);}});
    show(browserSites.has(s.ui.lastBrowserSite)?s.ui.lastBrowserSite:"news",{record:false});
  }

  function renderMail(el){
    const s=getState(),mails=EMAILS.filter(visible);
    if(selectedMailId&&!mails.some(m=>m.id===selectedMailId))selectedMailId=null;
    const selected=mails.find(m=>m.id===selectedMailId);
    el.innerHTML=`<div class="mail-header"><b>NEXUS Mail</b><span>${mails.filter(m=>!s.world.readEmails.includes(m.id)).length} unread</span></div><div class="mail-layout"><div class="sidebar mail-list">${mails.map(m=>`<button data-mail="${m.id}" class="${s.world.readEmails.includes(m.id)?"read":"unread"}"><span>${m.from.split("@")[0]}</span><b>${m.subject}</b></button>`).join("")}</div><div class="content-pane">${selected?`<div class="mail-message"><h2>${selected.subject}</h2><div class="mail-meta">From: ${selected.from}<br>To: ${escapeHtml(s.player.alias)}@nexus.local</div><div class="mail-body">${selected.body}</div></div>`:`<div class="empty-state">Select a message to read.</div>`}</div></div>`;
    el.querySelectorAll("[data-mail]").forEach(btn=>btn.addEventListener("click",()=>{
      const mail=mails.find(m=>m.id===btn.dataset.mail);if(!mail)return;selectedMailId=mail.id;
      if(!s.world.readEmails.includes(mail.id)){s.world.readEmails.push(mail.id);emit("email:read",{emailId:mail.id});}
      renderMail(el);refreshBadges();
    }));
  }

  function messageTime(message,state){return contentTimeLabel(message,state,{includeDay:false});}

  function chatIsPresented(el){
    const win=el.closest(".app-window");
    if(!win||win.classList.contains("hidden")||document.querySelector("#desktop")?.classList.contains("hidden"))return false;
    const visibleWindows=[...layer.querySelectorAll(".app-window")].filter(item=>!item.classList.contains("hidden"));
    const top=Math.max(...visibleWindows.map(item=>Number(item.style.zIndex)||0));
    return (Number(win.style.zIndex)||0)>=top;
  }

  function renderChat(el){
    const s=getState();
    const thread=THREADS.find(x=>x.id===activeThreadId)||THREADS[0];
    activeThreadId=thread.id;
    const messages=sortChronologically(thread.messages.filter(visibleMessage),s,{direction:"asc"});
    const pending=messages.find(m=>m.choice && !m.choice.options.some(o=>choiceMade(o.id)));
    setWaitingForReply(thread.id,pending?.id||null);
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
          <div class="chat-history">${messages.map(m=>`<div class="chat-line"><span class="chat-time">${messageTime(m,s)}</span><b>${m.from==="player"?escapeHtml(s.player.alias):thread.name}:</b> ${m.text}</div>`).join("")}</div>
          ${pending?`<div class="chat-choices">${pending.choice.options.map(o=>`<button data-choice="${o.id}">${o.text}</button>`).join("")}</div>`:`<div class="chat-compose"><input placeholder="No reply needed right now." disabled><button disabled>Send</button></div>`}
        </div>
      </div>`;

    el.querySelectorAll("[data-thread]").forEach(btn=>btn.addEventListener("click",()=>{activeThreadId=btn.dataset.thread;renderChat(el);}));
    el.querySelectorAll("[data-choice]").forEach(btn=>btn.addEventListener("click",()=>{
      const result=makeChoice(btn.dataset.choice);
      if(result.ok){toast("Message sent.");renderChat(el);}
    }));

    if(chatIsPresented(el)){
      const newlyRead=[];
      for(const m of messages){
        if(m.from==="player")continue;
        if(!(s.world.readMessages||[]).includes(m.id)){
          s.world.readMessages.push(m.id);newlyRead.push(m.id);emit("message:read",{messageId:m.id,threadId:thread.id});
        }
        reconcilePresentedMessageClues(m.id);
      }
      const lastMessage=messages.at(-1);
      if(lastMessage)recordPresentedThread(thread.id,lastMessage.id,contentAbsoluteTime(lastMessage,s));
      if(newlyRead.length)emit("thread:read",{threadId:thread.id,messageIds:newlyRead});
    }
    refreshBadges();
  }

  function renderSystem(el){
    const s=getState(),snap=systemSnapshot();
    const knownHosts=(s.player.savedTargets||[]).map(entry=>HOSTS[entry.hostId]).filter(Boolean);
    const clues=getKnownClues(),caseClues=clues.filter(c=>c.kind!=="world"),worldIntel=clues.filter(c=>c.kind==="world");
    const softwareNames=(s.player.installedSoftware||[]).map(id=>({resolver_basic:"Basic Resolver",resolver_pro:"Resolver Pro",scan_suite:"WideScan Suite",logscope:"LogScope"}[id]||id));
    const labels={explorer:"My Computer",documents:"My Documents",downloads:"Downloads",programs:"Add/Remove Programs",control:"Control Panel",system:"System Properties",devices:"Device Manager",network:"Network Connections",firewall:"NEXUS Firewall",services:"Services",events:"Event Viewer",blackboxData:"BLACKBOX Data"};
    const pathFor=tool=>({explorer:"C:\\",documents:"C:\\My Documents",downloads:"C:\\Downloads",programs:"Control Panel\\Add or Remove Programs",control:"Control Panel",system:"Control Panel\\System",devices:"System Properties\\Device Manager",network:"Control Panel\\Network Connections",firewall:"Control Panel\\NEXUS Firewall",services:"Administrative Tools\\Services",events:"Administrative Tools\\Event Viewer",blackboxData:"C:\\BLACKBOX Data"}[tool]||"C:\\");
    const controlIcon=(tool,glyph,title,desc)=>`<button class="cp-icon" data-system-tool="${tool}"><span>${glyph}</span><b>${title}</b><small>${desc}</small></button>`;
    const folder=(tool,glyph,title,detail="File Folder")=>`<button class="explorer-item" data-system-tool="${tool}"><span class="explorer-glyph">${glyph}</span><b>${title}</b><small>${detail}</small></button>`;
    const renderPane=()=>{
      if(systemView.tool==="explorer")return `<div class="explorer-layout"><aside class="explorer-sidebar"><div class="explorer-side-title">System Tasks</div><button data-system-tool="system">View system information</button><button data-system-tool="control">Open Control Panel</button><button data-system-tool="network">View network connections</button><div class="explorer-side-title">Other Places</div><button data-system-tool="documents">My Documents</button><button data-system-tool="downloads">Downloads</button><button data-system-tool="blackboxData">BLACKBOX Data</button></aside><main class="explorer-main"><h2>Files Stored on This Computer</h2><div class="explorer-icons">${folder("documents","📁","My Documents")}${folder("downloads","📁","Downloads")}${folder("programs","📁","Program Files","Installed programs")}${folder("blackboxData","📁","BLACKBOX Data","Targets, evidence and intel")}${folder("control","🛠️","Control Panel","System settings")}</div><h2>Hard Disk Drives</h2><div class="drive-card"><span>💽</span><div><b>Local Disk (C:)</b><div class="drive-meter"><i style="width:${s.player.installedHardware.includes("hdd_20gb")?"28%":"44%"}"></i></div><small>${snap.hardware.disk} • ${s.player.installedHardware.includes("hdd_20gb")?"14.4":"5.6"} GB free</small></div></div></main></div>`;
      if(systemView.tool==="documents")return `<div class="explorer-folder-view"><h2>My Documents</h2><div class="explorer-icons"><div class="explorer-item static"><span class="explorer-glyph">📄</span><b>notes.txt</b><small>${(s.player.notes||"").length} bytes • open with Notepad</small></div><div class="explorer-item static"><span class="explorer-glyph">📁</span><b>Training</b><small>Personal study notes</small></div></div><div class="system-hint">Use the NEXUS Notepad app to edit <b>notes.txt</b>.</div></div>`;
      if(systemView.tool==="downloads")return `<div class="explorer-folder-view"><h2>Downloads</h2>${(s.player.downloads||[]).length?`<div class="file-details-list">${(s.player.downloads||[]).map(x=>`<div><span>📄</span><b>${escapeHtml(x.split(":").slice(1).join(":")||x)}</b><small>BLACKBOX evidence copy • read-only</small></div>`).join("")}</div>`:`<div class="empty-state compact">This folder is empty.</div>`}</div>`;
      if(systemView.tool==="blackboxData")return `<div class="explorer-folder-view"><h2>BLACKBOX Data</h2><div class="system-summary-strip"><span><b>${knownHosts.length}</b> saved targets</span><span><b>${(s.player.downloads||[]).length}</b> evidence files</span><span><b>${caseClues.length}</b> case clues</span><span><b>${worldIntel.length}</b> world intel</span></div><section class="classic-group"><legend>Saved Targets</legend>${knownHosts.length?knownHosts.map((h,i)=>`<div class="classic-row"><b>[${i}] ${displayName(h.id)}</b><span>${h.address}</span></div>`).join(""):`<p>No remote targets saved.</p>`}</section><section class="classic-group"><legend>Case Clues</legend>${caseClues.length?caseClues.map(c=>`<div class="classic-row stacked"><b>${c.title}</b><span>${c.summary}</span></div>`).join(""):`<p>No case clues recorded.</p>`}</section><section class="classic-group"><legend>World Intel</legend>${worldIntel.length?worldIntel.map(c=>`<div class="classic-row stacked"><b>${c.title}</b><span>${c.summary}</span></div>`).join(""):`<p>No optional world intel learned yet.</p>`}</section><button class="classic-button blackbox-system-launch" id="system-blackbox">ENTER BLACKBOX</button></div>`;
      if(systemView.tool==="control")return `<div class="control-panel"><div class="control-panel-head"><span>🛠️</span><div><h2>Control Panel</h2><p>Pick a category to change NEXUS/OS settings.</p></div></div><div class="cp-grid">${controlIcon("system","🖥️","System","Hardware, performance and Device Manager")}${controlIcon("network","🌐","Network Connections","TCP/IP and adapter status")}${controlIcon("firewall","🧱","NEXUS Firewall","Host firewall and exceptions")}${controlIcon("programs","💿","Add or Remove Programs","Installed applications and components")}${controlIcon("services","⚙️","Administrative Tools","Services and startup state")}${controlIcon("events","📋","Event Viewer","System and troubleshooting logs")}<div class="cp-icon static"><span>🕒</span><b>Date and Time</b><small>Day ${s.world.day} • ${formatClock().time}</small></div><div class="cp-icon static"><span>🖼️</span><b>Display</b><small>NEXUS SVGA • 32-bit color</small></div></div></div>`;
      if(systemView.tool==="system")return `<div class="system-properties"><div class="classic-tabs"><button class="active">General</button><button>Computer Name</button><button>Hardware</button><button>Advanced</button></div><div class="system-logo-row"><div class="computer-glyph">🖥️</div><div><h2>NEXUS/OS Personal Workstation</h2><p>Registered to: ${escapeHtml(s.player.alias)}</p><p>BLACKBOX 0.4.0-A4.5 installed</p></div></div><section class="classic-group"><legend>Computer</legend><p>${snap.hardware.cpu}<br>${snap.hardware.memory} RAM<br>${snap.hardware.disk}</p></section><section class="classic-group"><legend>Hardware</legend><button class="classic-button" data-system-tool="devices">DEVICE MANAGER</button><button class="classic-button" data-action="scan-hardware">SCAN FOR HARDWARE CHANGES</button></section><div class="cert-map"><b>Hands-on concepts:</b> A+ operating systems, hardware identification, troubleshooting and change awareness.</div></div>`;
      if(systemView.tool==="devices"){
        const nicEnabled=snap.devices.networkAdapter!=="disabled",soundEnabled=snap.devices.soundAdapter!=="disabled";
        return `<div class="device-manager"><div class="dm-toolbar"><button class="classic-button" data-action="scan-hardware">🔍 Scan for hardware changes</button></div><div class="device-tree"><details open><summary>▾ Computer</summary><div class="device-row ok">🖥️ ACPI NEXUS PC <span>This device is working properly.</span></div></details><details open><summary>▾ Disk drives</summary><div class="device-row ok">💽 ${snap.hardware.disk}<span>This device is working properly.</span></div></details><details open><summary>▾ Display adapters</summary><div class="device-row ok">🖼️ NEXUS SVGA Adapter<span>This device is working properly.</span></div></details><details open><summary>▾ Network adapters</summary><div class="device-row ${nicEnabled?"ok":"disabled"}">🌐 ${snap.hardware.network}<span>${nicEnabled?"This device is working properly.":"This device is disabled. (Code 22)"}</span><button class="classic-button" data-device="networkAdapter" data-enable="${nicEnabled?"0":"1"}">${nicEnabled?"DISABLE":"ENABLE"}</button></div></details><details open><summary>▾ Sound, video and game controllers</summary><div class="device-row ${soundEnabled?"ok":"disabled"}">🔊 SoundBlaster Compatible Audio<span>${soundEnabled?"This device is working properly.":"This device is disabled. (Code 22)"}</span><button class="classic-button" data-device="soundAdapter" data-enable="${soundEnabled?"0":"1"}">${soundEnabled?"DISABLE":"ENABLE"}</button></div></details><details><summary>▸ Ports (COM & LPT)</summary><div class="device-row ok">🔌 Communications Port (COM1)<span>This device is working properly.</span></div></details><details><summary>▸ System devices</summary><div class="device-row ok">🔧 PCI bus<span>This device is working properly.</span></div></details></div><div class="cert-map"><b>Troubleshooting habit:</b> verify device status before replacing hardware. Disabled devices are not the same as failed devices.</div></div>`;
      }
      if(systemView.tool==="network")return `<div class="network-connections"><h2>Network Connections</h2><div class="connection-card ${snap.online?"connected":"offline"}"><div class="connection-icon">🌐</div><div><b>Local Area Connection</b><span>${snap.online?"Connected":"Disabled"}</span><small>${snap.hardware.network} • ${s.player.installedHardware.includes("nic_fast")?"100.0":"10.0"} Mbps</small></div></div><section class="classic-group"><legend>TCP/IP Configuration</legend><div class="network-details"><b>DHCP Enabled</b><span>${snap.network.dhcp?"Yes":"No"}</span><b>IP Address</b><span>${snap.online?snap.network.ip:"Media disconnected"}</span><b>Subnet Mask</b><span>${snap.network.subnet}</span><b>Default Gateway</b><span>${snap.network.gateway}</span><b>DNS Servers</b><span>${snap.network.dns.join(", ")}</span></div></section><div class="classic-actions"><button class="classic-button" data-action="toggle-adapter">${snap.online?"DISABLE":"ENABLE"}</button><button class="classic-button" data-action="renew-dhcp" ${!snap.online?"disabled":""}>RENEW DHCP</button><button class="classic-button" data-action="repair-network">REPAIR</button></div><div class="diagnostic-box"><b>Quick diagnosis</b><p>Link: ${snap.online?"UP":"DOWN"} • DHCP Client: ${snap.services.dhcpClient.toUpperCase()} • DNS Client: ${snap.services.dnsClient.toUpperCase()}</p><p>${snap.online&&snap.dnsOnline?"Network stack is ready for name-based browsing.":snap.online?"Link is up, but name resolution needs attention.":"Start at Layer 1/adapter state before troubleshooting DNS or applications."}</p></div><div class="cert-map"><b>Hands-on concepts:</b> Network+ addressing/DHCP/DNS/troubleshooting and A+ network troubleshooting.</div></div>`;
      if(systemView.tool==="firewall"){
        const f=snap.firewall,ruleLabels={fileSharing:"File and Printer Sharing",remoteAssistance:"Remote Assistance",webBrowser:"NEXUS Explorer",messenger:"NEXUS Messenger"};
        return `<div class="firewall-panel"><div class="firewall-status ${f.enabled?"on":"off"}"><span>🧱</span><div><h2>NEXUS Firewall</h2><b>${f.enabled?"ON — helping protect this computer":"OFF — this computer is less protected"}</b><p>Profile: ${f.profile}</p></div></div><div class="classic-actions"><button class="classic-button" data-action="toggle-firewall">TURN ${f.enabled?"OFF":"ON"}</button></div><section class="classic-group"><legend>Exceptions</legend>${Object.entries(f.rules).map(([id,enabled])=>`<div class="firewall-rule"><span>${enabled?"☑":"☐"}</span><div><b>${ruleLabels[id]}</b><small>${enabled?"Allowed through the host firewall":"Blocked from unsolicited inbound access"}</small></div><button class="classic-button" data-firewall-rule="${id}" data-enable="${enabled?"0":"1"}">${enabled?"BLOCK":"ALLOW"}</button></div>`).join("")}</section><div class="cert-map"><b>Hands-on concepts:</b> Security+ host firewall controls and Network+ security hardening. Exceptions should be deliberate, not blindly enabled.</div></div>`;
      }
      if(systemView.tool==="services"){
        const names={dnsClient:"DNS Client",dhcpClient:"DHCP Client",printSpooler:"Print Spooler",workstation:"Workstation",nexusUpdate:"NEXUS Update"};
        return `<div class="services-panel"><h2>Services</h2><p class="muted">Administrative Tools // local service control</p><div class="service-table"><div class="service-head"><b>Name</b><b>Status</b><b>Action</b></div>${Object.entries(snap.services).map(([id,status])=>`<div class="service-row"><div><b>${names[id]}</b><small>${id==="dnsClient"?"Caches DNS names for NEXUS applications.":id==="dhcpClient"?"Obtains and renews IP configuration.":id==="printSpooler"?"Queues local print jobs.":id==="workstation"?"Maintains network client connections.":"Checks for NEXUS/OS updates."}</small></div><span class="service-state ${status}">${status.toUpperCase()}</span><button class="classic-button" data-service="${id}" data-status="${status==="running"?"stopped":"running"}">${status==="running"?"STOP":"START"}</button></div>`).join("")}</div><div class="cert-map"><b>Troubleshooting habit:</b> verify required services before blaming the network. A working link can still fail name resolution when DNS Client is stopped.</div></div>`;
      }
      if(systemView.tool==="events")return `<div class="event-viewer"><h2>Event Viewer</h2><div class="event-tabs"><button class="active">System</button><button>Application</button><button>Security</button></div><div class="event-table"><div class="event-head"><b>Type</b><b>Source</b><b>Event</b><b>Description</b></div>${snap.eventLog.length?snap.eventLog.slice(0,40).map(e=>`<div class="event-row"><span class="event-level ${e.level.toLowerCase()}">${e.level}</span><span>${escapeHtml(e.source)}</span><span>${e.eventId}</span><span>${escapeHtml(e.message)}</span></div>`).join(""):`<div class="empty-state compact">No events.</div>`}</div><div class="cert-map"><b>Hands-on concepts:</b> A+/Security+ troubleshooting with logs. Correlate timestamps, source, severity and recent changes.</div></div>`;
      if(systemView.tool==="programs")return `<div class="programs-panel"><h2>Add or Remove Programs</h2><p>Installed applications and optional BLACKBOX tools.</p><div class="program-list">${DESKTOP_APPS.map(a=>`<div><span>${a.glyph}</span><b>${a.name}</b><small>NEXUS/OS application • installed</small></div>`).join("")}${softwareNames.map(name=>`<div><span>💿</span><b>${escapeHtml(name)}</b><small>BLACKBOX component • installed</small></div>`).join("")}</div><div class="system-hint">Removal is disabled in this build to protect campaign-critical applications. Future Help Desk scenarios can use controlled install/repair workflows.</div></div>`;
      return `<div class="empty-state">Unknown system tool.</div>`;
    };
    el.innerHTML=`<div class="nexus-explorer-shell"><div class="system-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Favorites&nbsp;&nbsp; Tools&nbsp;&nbsp; Help</div><div class="system-toolbar"><button data-system-tool="explorer">🏠 Home</button><button data-system-tool="control">🛠️ Control Panel</button><button data-system-tool="network">🌐 Network</button><button data-system-tool="events">📋 Event Viewer</button><label>Address:</label><div class="system-address">${pathFor(systemView.tool)}</div></div><div class="system-content"><div class="system-page-title"><span>${systemView.tool==="control"?"🛠️":"📁"}</span><div><b>${labels[systemView.tool]||"My Computer"}</b><small>NEXUS/OS Personal Workstation</small></div><div class="system-net-indicator ${snap.online&&snap.dnsOnline?"online":"problem"}">${snap.online?(snap.dnsOnline?"NETWORK OK":"DNS ISSUE"):"OFFLINE"}</div></div>${renderPane()}</div></div>`;
    const rerender=()=>renderSystem(el);
    el.querySelectorAll("[data-system-tool]").forEach(btn=>btn.addEventListener("click",()=>{systemView.tool=btn.dataset.systemTool;rerender();}));
    el.querySelectorAll("[data-device]").forEach(btn=>btn.addEventListener("click",()=>{const result=setDeviceEnabled(btn.dataset.device,btn.dataset.enable==="1");toast(result.message);rerender();}));
    el.querySelectorAll("[data-firewall-rule]").forEach(btn=>btn.addEventListener("click",()=>{const result=setFirewallRule(btn.dataset.firewallRule,btn.dataset.enable==="1");toast(result.message);rerender();}));
    el.querySelectorAll("[data-service]").forEach(btn=>btn.addEventListener("click",()=>{const result=setService(btn.dataset.service,btn.dataset.status);toast(result.message);rerender();}));
    el.querySelector('[data-action="toggle-adapter"]')?.addEventListener("click",()=>{const result=setNetworkAdapter(!snap.online);toast(result.message);rerender();});
    el.querySelector('[data-action="renew-dhcp"]')?.addEventListener("click",()=>{const result=renewDhcp();toast(result.message);rerender();});
    el.querySelector('[data-action="repair-network"]')?.addEventListener("click",()=>{const result=repairNetwork();toast(result.message);rerender();});
    el.querySelector('[data-action="toggle-firewall"]')?.addEventListener("click",()=>{const result=setFirewallEnabled(!snap.firewall.enabled);toast(result.message);rerender();});
    el.querySelectorAll('[data-action="scan-hardware"]').forEach(btn=>btn.addEventListener("click",()=>toast("Device Manager scanned the simulated hardware bus. No new devices found.")));
    el.querySelector("#system-blackbox")?.addEventListener("click",enterBlackbox);
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
        <section class="td-panel"><h2>Lookup Tools</h2><p>Query the fictional NEXUS resolver. No real DNS request is sent.</p><form id="td-lookup" class="td-lookup"><input id="td-name" placeholder="hostname.test" autocapitalize="none" autocomplete="off"><button>Resolve</button></form><pre id="td-result" class="td-result"></pre></section>
        <section class="td-panel"><h2>Threat Feed</h2><div class="td-feed">${reports.map(r=>`<button data-threat="${r.id}" class="td-report ${(s.world.readThreats||[]).includes(r.id)?"read":"unread"}"><span>${r.severity}${r.timeFromEvent?` · ${contentTimeLabel(r,s,{includeDay:false})}`:""}</span><b>${r.title}</b><small>${r.body}</small></button>`).join("")}</div></section>
        <section class="td-panel"><h2>Field Notes</h2>${FIELD_NOTES.map(n=>`<details><summary>${n.title}</summary><p>${n.body}</p></details>`).join("")}</section>
        <section class="td-panel"><h2>Training Lab</h2>${LABS.map(l=>`<div class="td-lab"><b>${l.title} ${(s.world.completedLabs||[]).includes(l.id)?"✓":""}</b><p>${l.question}</p><div>${l.options.map(o=>`<button data-lab="${l.id}" data-answer="${o}">${o}</button>`).join("")}</div></div>`).join("")}</section>
      </div>`;
    const nameInput=el.querySelector("#td-name"),resultEl=el.querySelector("#td-result");
    nameInput.value=threatDeskView.query;resultEl.textContent=threatDeskView.output;
    el.querySelectorAll("[data-threat]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.threat;if(!s.world.readThreats.includes(id))s.world.readThreats.push(id);emit("threat:read",{threatId:id});btn.classList.remove("unread");btn.classList.add("read");toast("ThreatDesk report recorded.");refreshBadges();}));
    el.querySelectorAll("[data-lab]").forEach(btn=>btn.addEventListener("click",()=>{const lab=LABS.find(x=>x.id===btn.dataset.lab);if(!lab)return;if(btn.dataset.answer!==lab.answer){toast("Not quite. Review the Field Notes and try again.");return;}if(!s.world.completedLabs.includes(lab.id)){s.world.completedLabs.push(lab.id);emit("lab:completed",{labId:lab.id});}toast(lab.explanation);renderThreatDesk(el);}));
    el.querySelector("#td-lookup").addEventListener("submit",e=>{
      e.preventDefault();const name=nameInput.value;threatDeskView.query=name;
      try{
        if(!nexusNetworkOnline())throw new Error("NEXUS network adapter is disabled. Enable Local Area Connection in My Computer → Control Panel → Network Connections.");
        if(!nexusDnsOnline())throw new Error("NEXUS DNS Client service is stopped. Start it in Administrative Tools → Services or run Network Repair.");
        threatDeskView.output=formatDnsResult(lookupDns(name,"ANY"),{detailed:(s.player.installedSoftware||[]).includes("resolver_pro")});
      }catch(err){threatDeskView.output=err.message;}
      renderThreatDesk(el);
    });
  }

  function renderNotes(el){
    const s=getState();
    el.innerHTML=`<div class="notepad-shell">
      <div class="notepad-menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; Format&nbsp;&nbsp; Help</div>
      <textarea id="player-notes" class="notepad" spellcheck="false" autocomplete="off" autocapitalize="sentences" placeholder="Write anything you want to remember..."></textarea>
      <div class="nexus-input-controls" aria-label="Notepad input controls">
        <button class="nexus-keys-collapse" type="button" aria-expanded="true">HIDE KEYS</button>
        <button class="nexus-input-mode" type="button">SYSTEM KEYBOARD</button>
      </div>
      <div class="nexus-custom-keyboard" role="group" aria-label="NEXUS 90s keyboard"></div>
    </div>`;
    const ta=el.querySelector("#player-notes"),keyboard=el.querySelector(".nexus-custom-keyboard"),modeButton=el.querySelector(".nexus-input-mode"),collapseButton=el.querySelector(".nexus-keys-collapse");
    ta.value=s.player.notes||"";
    let caps=false,shift=false,collapsed=false,currentMode="system";

    const key=(label,{value=label,action="",wide=false,space=false,aria=label,shiftValue=""}={})=>({label,value,action,wide,space,aria,shiftValue});
    function renderKeyboard(){
      const rows=[
        [...NEXUS_KEYBOARD_ROWS[0]].map(ch=>key(ch)).concat(key("BKSP",{action:"backspace",wide:true,aria:"Backspace"})),
        [key("TAB",{action:"tab",wide:true}),...NEXUS_KEYBOARD_ROWS[1].split("").map(ch=>key(ch))],
        [key("CAPS",{action:"caps",wide:true,aria:"Caps Lock"}),...NEXUS_KEYBOARD_ROWS[2].split("").map(ch=>key(ch)),key("ENTER",{action:"enter",wide:true})],
        [key("SHIFT",{action:"shift",wide:true}),...NEXUS_KEYBOARD_ROWS[3].split("").map(ch=>key(ch)),key(",",{shiftValue:"<"}),key(".",{shiftValue:">"}),key("/",{shiftValue:"?"})],
        [key("CTRL",{action:"noop"}),key("ALT",{action:"noop"}),key("'",{shiftValue:'"'}),key("-",{shiftValue:"_"}),key("SPACE",{value:" ",space:true,aria:"Space"}),key("←",{action:"left",aria:"Move cursor left"}),key("→",{action:"right",aria:"Move cursor right"})]
      ];
      keyboard.replaceChildren();
      const shell=document.createElement("div");shell.className="nexus-keyboard-case";
      const brand=document.createElement("div");brand.className="nexus-keyboard-brand";brand.innerHTML="<span>NEXUS PERSONAL KEYBOARD</span><span>MODEL N95</span>";shell.appendChild(brand);
      rows.forEach((specs,index)=>{
        const row=document.createElement("div");row.className=`nexus-key-row nexus-key-row-${index+1}`;
        for(const spec of specs){
          const button=document.createElement("button");button.type="button";button.className=`nexus-key${spec.wide?" nexus-key-wide":""}${spec.space?" nexus-key-space":""}`;
          button.textContent=spec.label;button.setAttribute("aria-label",spec.aria);
          if(spec.action)button.dataset.action=spec.action;else button.dataset.value=spec.value;
          if(spec.shiftValue)button.dataset.shiftValue=spec.shiftValue;
          if(spec.action==="caps"&&caps||spec.action==="shift"&&shift)button.classList.add("is-on");
          row.appendChild(button);
        }
        shell.appendChild(row);
      });
      keyboard.appendChild(shell);
    }
    function commit(){s.player.notes=ta.value;emit("notes:changed",{notes:ta.value});}
    function selection(){const start=Number.isInteger(ta.selectionStart)?ta.selectionStart:ta.value.length;const end=Number.isInteger(ta.selectionEnd)?ta.selectionEnd:start;return {start,end};}
    function replaceSelection(text){const {start,end}=selection(),value=String(text);ta.value=ta.value.slice(0,start)+value+ta.value.slice(end);const next=start+value.length;ta.setSelectionRange(next,next);commit();}
    function backspace(){const {start,end}=selection();if(start!==end){ta.value=ta.value.slice(0,start)+ta.value.slice(end);ta.setSelectionRange(start,start);}else if(start>0){const before=Array.from(ta.value.slice(0,start)),removed=before.pop()||"";const next=start-removed.length;ta.value=before.join("")+ta.value.slice(end);ta.setSelectionRange(next,next);}commit();}
    function moveCursor(delta){const {start,end}=selection(),base=delta<0?start:end,next=Math.max(0,Math.min(ta.value.length,base+delta));ta.setSelectionRange(next,next);}
    function preferredMode(){if(!isCoarsePointer())return "system";return s.ui?.nexusInputMode==="system"?"system":"nexus";}
    function setMode(mode,{persist=false,focus=false}={}){
      currentMode=isCoarsePointer()&&mode!=="system"?"nexus":"system";const custom=currentMode==="nexus";
      ta.readOnly=custom;ta.setAttribute("inputmode",custom?"none":"text");ta.classList.toggle("notepad-custom-input",custom);
      keyboard.classList.toggle("is-active",custom&&!collapsed);
      modeButton.textContent=custom?"SYSTEM KEYBOARD":"NEXUS KEYS";
      collapseButton.classList.toggle("hidden",!custom);collapseButton.textContent=collapsed?"SHOW KEYS":"HIDE KEYS";collapseButton.setAttribute("aria-expanded",String(!collapsed));
      if(custom)ta.blur();else if(focus){try{ta.focus({preventScroll:true});}catch{ta.focus();}}
      if(persist){s.ui.nexusInputMode=currentMode;emit("ui:nexus-input-mode",{mode:currentMode});}
    }

    renderKeyboard();setMode(preferredMode());
    ta.addEventListener("input",commit);
    ta.addEventListener("pointerdown",e=>{if(currentMode!=="nexus")return;e.preventDefault();ta.blur();});
    ta.addEventListener("focus",()=>{if(currentMode==="nexus")ta.blur();});
    keyboard.addEventListener("click",e=>{
      const button=e.target.closest("button");if(!button)return;const action=button.dataset.action;
      if(!action){let value=button.dataset.value||"";if(button.dataset.shiftValue&&shift)value=button.dataset.shiftValue;else if(/^[a-z]$/i.test(value)){const upper=caps!==shift;value=upper?value.toUpperCase():value.toLowerCase();}replaceSelection(value);if(shift){shift=false;renderKeyboard();}return;}
      if(action==="backspace")backspace();
      else if(action==="enter")replaceSelection("\n");
      else if(action==="tab")replaceSelection("    ");
      else if(action==="left")moveCursor(-1);
      else if(action==="right")moveCursor(1);
      else if(action==="caps"){caps=!caps;renderKeyboard();}
      else if(action==="shift"){shift=!shift;renderKeyboard();}
    });
    modeButton.addEventListener("click",()=>setMode(currentMode==="nexus"?"system":"nexus",{persist:true,focus:currentMode==="nexus"}));
    collapseButton.addEventListener("click",()=>{collapsed=!collapsed;keyboard.classList.toggle("is-active",currentMode==="nexus"&&!collapsed);collapseButton.textContent=collapsed?"SHOW KEYS":"HIDE KEYS";collapseButton.setAttribute("aria-expanded",String(!collapsed));});
  }

  return {openApp,toast,refresh:renderOpenApps};
}
