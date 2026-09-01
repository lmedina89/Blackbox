const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export async function enterBlackboxTransition({desktop,transition,blackbox,lines,skipButton}){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){ desktop.classList.add("hidden"); blackbox.classList.remove("hidden"); return; }

  desktop.classList.add("flicker");
  await sleep(420);
  desktop.classList.remove("flicker");
  desktop.classList.add("hidden");
  transition.classList.remove("hidden");
  skipButton.classList.remove("hidden");

  let skipped=false;
  const skip=()=>{skipped=true;};
  skipButton.addEventListener("click",skip,{once:true});

  const script=[
    "NEXUS DISPLAY INTERRUPT...",
    "LOCAL SESSION SUSPENDED",
    "",
    "BLACKBOX BOOTSTRAP 0.1.0",
    "Loading secure environment...",
    "Mounting simulated network layer...",
    "Initializing terminal state...",
    "Cipher handshake: OK",
    "Terminal type: VT100",
    "",
    "ACCESS GRANTED."
  ];
  lines.textContent="";
  for(const line of script){
    if(skipped) break;
    lines.textContent+=line+"\n";
    await sleep(115);
  }
  await sleep(skipped?0:220);
  transition.classList.add("hidden");
  skipButton.classList.add("hidden");
  blackbox.classList.remove("hidden");
}

export async function exitBlackboxTransition({desktop,blackbox}){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduce){
    blackbox.classList.add("crt-collapse");
    await sleep(350);
    blackbox.classList.remove("crt-collapse");
  }
  blackbox.classList.add("hidden");
  desktop.classList.remove("hidden");
}
