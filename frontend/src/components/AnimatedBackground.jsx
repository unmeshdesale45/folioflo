import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
      <svg 
        viewBox="0 0 1200 600" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <style>
            {`
              .wave-line {
                fill: none;
                stroke-width: 1.5;
                animation: waveDrift 25s ease-in-out infinite alternate;
              }
              .wave-line:nth-child(even) {
                animation-direction: alternate-reverse;
                animation-duration: 30s;
              }
              .wave-line:nth-child(3n) {
                animation-duration: 20s;
              }
              @keyframes waveDrift {
                0% { transform: translateX(0) translateY(0); }
                33% { transform: translateX(-15px) translateY(10px); }
                66% { transform: translateX(15px) translateY(-10px); }
                100% { transform: translateX(0) translateY(0); }
              }
              
              /* Light Mode */
              body:not(.dark) .wave-line {
                stroke: #93b4d4;
                opacity: 0.6;
              }
              body:not(.dark) .wave-indigo {
                stroke: #b8a9e0;
                opacity: 0.5;
              }

              /* Dark Mode */
              body.dark .wave-line {
                stroke: #1e3a5f;
                opacity: 0.6;
              }
              body.dark .wave-indigo {
                stroke: #2d1b69;
                opacity: 0.6;
              }
            `}
          </style>
        </defs>
        
        {/* Top Left Cluster - flowing from top left curving down/right */}
        <g opacity="0.8">
          <path className="wave-line" d="M -50,-50 C 150,50 300,100 500,-50" />
          <path className="wave-line wave-indigo" d="M -50,-20 C 170,70 320,120 520,-30" />
          <path className="wave-line" d="M -50,10 C 190,90 340,140 540,-10" />
          <path className="wave-line wave-indigo" d="M -50,40 C 210,110 360,160 560,10" />
          <path className="wave-line" d="M -50,70 C 230,130 380,180 580,30" />
          <path className="wave-line wave-indigo" d="M -50,100 C 250,150 400,200 600,50" />
          <path className="wave-line" d="M -50,130 C 270,170 420,220 620,70" />
          <path className="wave-line wave-indigo" d="M -50,160 C 290,190 440,240 640,90" />
          <path className="wave-line" d="M -50,190 C 310,210 460,260 660,110" />
          <path className="wave-line wave-indigo" d="M -50,220 C 330,230 480,280 680,130" />
        </g>

        {/* Bottom Right Cluster - flowing from bottom right curving up/left */}
        <g opacity="0.8">
          <path className="wave-line" d="M 1250,650 C 1050,550 900,500 700,650" />
          <path className="wave-line wave-indigo" d="M 1250,620 C 1030,530 880,480 680,630" />
          <path className="wave-line" d="M 1250,590 C 1010,510 860,460 660,610" />
          <path className="wave-line wave-indigo" d="M 1250,560 C 990,490 840,440 640,590" />
          <path className="wave-line" d="M 1250,530 C 970,470 820,420 620,570" />
          <path className="wave-line wave-indigo" d="M 1250,500 C 950,450 800,400 600,550" />
          <path className="wave-line" d="M 1250,470 C 930,430 780,380 580,530" />
          <path className="wave-line wave-indigo" d="M 1250,440 C 910,410 760,360 560,510" />
          <path className="wave-line" d="M 1250,410 C 890,390 740,340 540,490" />
          <path className="wave-line wave-indigo" d="M 1250,380 C 870,370 720,320 520,470" />
        </g>
        
      </svg>
    </div>
  );
};

export default AnimatedBackground;
