export const HARDWARE = [
  {
    id:"ram_256",
    type:"ram",
    name:"256 MB SDRAM Kit",
    price:120,
    description:"More memory for heavier BLACKBOX tools.",
    effects:{memory:256},
    requires:[],
    cosmetic:false
  },
  {
    id:"nic_fast",
    type:"network",
    name:"FastLink 100 Network Adapter",
    price:180,
    description:"Improves simulated scan and transfer performance.",
    effects:{networkTier:1},
    requires:[],
    cosmetic:false
  },
  {
    id:"monitor_17crt",
    type:"monitor",
    name:'17" ShadowView CRT',
    price:95,
    description:"More screen real estate and a sharper BLACKBOX display.",
    effects:{monitorTier:1},
    requires:[],
    cosmetic:true
  }
];
