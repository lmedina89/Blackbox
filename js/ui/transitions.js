const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export async function enterBlackboxTransition({desktop,transition,blackbox,lines,skipButton,resume=false}){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){desktop.classList.add("hidden");blackbox.classList.remove("hidden");return;}

  desktop.classList.add("flicker");
  await sleep(resume?160:300);
  desktop.classList.remove("flicker");
  desktop.classList.add("hidden");
  transition.classList.remove("hidden");
  skipButton.classList.remove("hidden");

  let skipped=false;
  skipButton.addEventListener("click",()=>{skipped=true;},{once:true});

  const script=resume?[
    "DISPLAY INTERRUPT 0x0B",
    "Restoring BLACKBOX context..... OK",
    "Remote session state.......... PRESERVED",
    "",
    "SESSION RESUMED"
  ]:[
    "DISPLAY INTERRUPT 0x0B",
    "Saving desktop context........ OK",
    "Dropping graphical session.... OK","",
    "BLACKBOX BOOTSTRAP 0.2.3.3",
    "VT100 compatibility........... OK",
    "SIMNET transport.............. OK",
    "Filesystem bridge............. OK",
    "Session isolation............. OK","",
    "NEGOTIATING LOCAL HANDSHAKE",
    "KEY EXCHANGE: ████████████████ 100%","",
    "ACCESS GRANTED"
  ];

  lines.textContent="";
  for(const line of script){
    if(skipped)break;
    lines.textContent+=line+"\n";
    await sleep(resume?55:(line?80:45));
  }
  await sleep(skipped?0:(resume?80:160));
  transition.classList.add("hidden");
  skipButton.classList.add("hidden");
  blackbox.classList.remove("hidden");
}

export async function exitBlackboxTransition({desktop,blackbox}){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduce){
    blackbox.classList.add("crt-collapse");
    await sleep(280);
    blackbox.classList.remove("crt-collapse");
  }
  blackbox.classList.add("hidden");
  desktop.classList.remove("hidden");
}
