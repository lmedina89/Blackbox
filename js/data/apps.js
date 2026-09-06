export const DESKTOP_APPS = [
  {id:"browser",name:"Nexus Explorer",shortName:"Internet",glyph:"🌐"},
  {id:"mail",name:"NEXUS Mail",shortName:"Email",glyph:"✉️"},
  {id:"chat",name:"NEXUS Messenger",shortName:"Messenger",glyph:"💬"},
  {id:"files",name:"My Computer",shortName:"My Computer",glyph:"🖥️"},
  {id:"missions",name:"Jobs",shortName:"Jobs",glyph:"📋"},
  {id:"servicedesk",name:"NEXUS Service Desk",shortName:"Service Desk",glyph:"🎧"},
  {id:"notes",name:"Notepad",shortName:"Notepad",glyph:"📝"},
  {id:"threatdesk",name:"NEXUS ThreatDesk",shortName:"ThreatDesk",glyph:"🛡️"}
];

export const BLACKBOX_SHORTCUT = {
  id:"blackbox",
  name:"BLACKBOX",
  shortName:"BLACKBOX",
  glyphSvg:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="cubeFront" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#202a28"/>
      <stop offset="1" stop-color="#050807"/>
    </linearGradient>
    <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a4a46"/>
      <stop offset="1" stop-color="#141b19"/>
    </linearGradient>
    <linearGradient id="cubeSide" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111816"/>
      <stop offset="1" stop-color="#020303"/>
    </linearGradient>

    <radialGradient id="core" cx="50%" cy="43%" r="58%">
      <stop offset="0" stop-color="#f7fff8"/>
      <stop offset="0.16" stop-color="#b6ffc3"/>
      <stop offset="0.42" stop-color="#5dff7d"/>
      <stop offset="0.72" stop-color="#18d94d"/>
      <stop offset="1" stop-color="#053714"/>
    </radialGradient>

    <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e1b12"/>
      <stop offset="0.55" stop-color="#061009"/>
      <stop offset="1" stop-color="#020604"/>
    </linearGradient>

    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="4.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
  </defs>

  <g transform="translate(0,2)">
    <!-- Original A circuit silhouette -->
    <g stroke="#29ef62" stroke-width="5" fill="none" stroke-linecap="square" opacity="0.95">
      <path d="M54 88 H28 V67"/>
      <path d="M202 88 H228 V67"/>
      <path d="M54 157 H28 V177"/>
      <path d="M202 157 H228 V177"/>
      <path d="M82 56 V31 H67"/>
      <path d="M174 56 V31 H189"/>
      <path d="M82 189 V214 H67"/>
      <path d="M174 189 V214 H189"/>
    </g>

    <g fill="#62ff87" filter="url(#softGlow)">
      <rect x="23" y="62" width="10" height="10" rx="2"/>
      <rect x="223" y="62" width="10" height="10" rx="2"/>
      <rect x="23" y="172" width="10" height="10" rx="2"/>
      <rect x="223" y="172" width="10" height="10" rx="2"/>
      <rect x="62" y="26" width="10" height="10" rx="2"/>
      <rect x="184" y="26" width="10" height="10" rx="2"/>
      <rect x="62" y="209" width="10" height="10" rx="2"/>
      <rect x="184" y="209" width="10" height="10" rx="2"/>
    </g>

    <!-- Original A cube -->
    <polygon points="128,44 199,81 128,119 57,81" fill="url(#cubeTop)" stroke="#5b726c" stroke-width="4"/>
    <polygon points="57,81 128,119 128,196 57,157" fill="url(#cubeFront)" stroke="#41534f" stroke-width="4"/>
    <polygon points="128,119 199,81 199,157 128,196" fill="url(#cubeSide)" stroke="#28332f" stroke-width="4"/>

    <!-- Circuit etching -->
    <g stroke="#1b7d3c" stroke-width="3" fill="none" opacity="0.75">
      <path d="M75 105 H98 V123 H108"/>
      <path d="M69 141 H92 V151 H108"/>
      <path d="M181 105 H157 V123 H148"/>
      <path d="M187 141 H164 V151 H148"/>
      <path d="M128 67 V92"/>
      <path d="M128 166 V184"/>
    </g>

    <!-- A2: sharper single-eye housing -->
    <path d="M79 133
             Q96 112 118 104
             L128 101
             L138 104
             Q160 112 177 133
             Q160 154 138 162
             L128 165
             L118 162
             Q96 154 79 133 Z"
          fill="url(#visor)"
          stroke="#36ff69"
          stroke-width="4.5"
          filter="url(#glow)"/>

    <!-- inner targeting rails -->
    <g stroke="#2de45c" stroke-width="2.5" fill="none" opacity="0.82">
      <path d="M92 133 H106"/>
      <path d="M150 133 H164"/>
      <path d="M128 109 V118"/>
      <path d="M128 148 V157"/>
    </g>

    <!-- synthetic iris -->
    <ellipse cx="128" cy="133" rx="24" ry="27" fill="#06100a" stroke="#1da947" stroke-width="2.5"/>
    <ellipse cx="128" cy="133" rx="18" ry="22" fill="url(#core)" filter="url(#glow)"/>

    <!-- concentric machine ring -->
    <ellipse cx="128" cy="133" rx="12" ry="16" fill="none" stroke="#d6ffe0" stroke-width="2" opacity="0.78"/>
    <ellipse cx="128" cy="133" rx="7" ry="18" fill="#030a05"/>

    <!-- narrow AI aperture -->
    <rect x="125" y="117" width="6" height="32" rx="3" fill="#000"/>
    <rect x="126.5" y="122" width="3" height="22" rx="1.5" fill="#0b3517"/>

    <!-- asymmetric machine highlight -->
    <circle cx="120" cy="122" r="3.5" fill="#f2fff4" opacity="0.9"/>
    <path d="M116 114 Q128 108 140 114" fill="none" stroke="#7fff99" stroke-width="2" opacity="0.65"/>

    <!-- tiny reticle ticks -->
    <g stroke="#69ff86" stroke-width="2" opacity="0.9">
      <path d="M128 105 V111"/>
      <path d="M128 155 V161"/>
      <path d="M100 133 H106"/>
      <path d="M150 133 H156"/>
    </g>

    <!-- Original A bottom signature -->
    <g stroke="#29ef62" stroke-width="4" fill="none" opacity="0.95">
      <path d="M104 172 L116 182 L128 172 L140 182 L152 172"/>
    </g>

    <g fill="#4aff75">
      <circle cx="89" cy="93" r="3"/>
      <circle cx="167" cy="93" r="3"/>
      <circle cx="89" cy="160" r="3"/>
      <circle cx="167" cy="160" r="3"/>
    </g>
  </g>
</svg>
`
};
