export const HARDWARE = [
  {id:"ram_256",type:"ram",name:"256 MB SDRAM Kit",price:120,description:"More memory for heavier BLACKBOX analysis tools.",effects:{memory:256,analysisBuffer:2},requires:[],cosmetic:false},
  {id:"nic_fast",type:"network",name:"FastLink 100 Network Adapter",price:180,description:"Adds service detail to active scans and improves simulated transfers.",effects:{networkTier:1,scanDetail:true},requires:[],cosmetic:false},
  {id:"hdd_20gb",type:"storage",name:"20 GB DeskStar HDD",price:220,description:"Expands local evidence storage from 2 downloaded files to 8.",effects:{downloadSlots:8},requires:[],cosmetic:false},
  {id:"cpu_p3_933",type:"cpu",name:"Northstar P3 933 MHz",price:320,description:"Faster workstation CPU for future analysis workloads.",effects:{cpuTier:1},requires:[],cosmetic:false},
  {id:"monitor_17crt",type:"monitor",name:'17" ShadowView CRT',price:95,description:"More screen real estate and a sharper BLACKBOX display.",effects:{monitorTier:1},requires:[],cosmetic:true}
];
