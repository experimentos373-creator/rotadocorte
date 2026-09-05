import React from "react";

/**
 * High-precision vector illustration of a classic barber comb
 */
export function BarberComb({ className = "w-64 h-24 text-[#C6924B]", opacity = 0.12 }) {
  // Generate 36 fine and regular teeth
  const teeth = [];
  for (let i = 0; i < 38; i++) {
    const x = 35 + i * 8.5;
    const height = i < 18 ? 38 : 34; // Varied section for barber styling
    teeth.push(
      <line
        key={i}
        x1={x}
        y1="28"
        x2={x}
        y2={28 + height}
        stroke="currentColor"
        strokeWidth={i < 18 ? "1.8" : "1.4"}
        strokeLinecap="round"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 380 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      {/* Comb Spine with subtle bevel */}
      <path
        d="M 20 28 C 15 28 12 25 15 20 C 20 12 60 8 190 8 C 320 8 360 12 368 20 C 372 25 368 28 360 28 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Decorative center groove */}
      <path
        d="M 40 18 Q 190 15 340 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />
      {/* Teeth */}
      {teeth}
    </svg>
  );
}

/**
 * High-precision vector illustration of vintage barber scissors
 */
export function BarberScissors({ className = "w-64 h-64 text-[#C6924B]", opacity = 0.12 }) {
  return (
    <svg
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      {/* Blade A (Top-right to Bottom-left loop) */}
      <path
        d="M 130 130 L 225 35 C 232 28 222 18 215 25 L 125 120"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Blade A back hollow edge */}
      <path
        d="M 128 126 Q 185 68 220 30"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Shank A & Finger Loop with Tang (Espigão) */}
      <path
        d="M 125 138 L 78 190 C 70 198 58 192 62 182 C 66 172 78 180 88 170 L 120 128"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Finger Loop A */}
      <ellipse
        cx="52"
        cy="205"
        rx="22"
        ry="16"
        transform="rotate(-35 52 205)"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Finger Rest Tang (Espigão clássico de barbeiro) */}
      <path
        d="M 36 218 Q 24 230 18 245 C 16 250 22 252 25 248 Q 32 236 44 225"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Blade B (Crossing blade) */}
      <path
        d="M 130 130 L 235 80 C 242 76 235 64 228 68 L 122 122"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Shank B & Thumb Loop */}
      <path
        d="M 128 138 L 95 205 C 90 214 102 222 110 214 C 118 206 110 198 102 206 L 122 132"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Thumb Loop B */}
      <ellipse
        cx="108"
        cy="225"
        rx="20"
        ry="15"
        transform="rotate(25 108 225)"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Pivot Screw / Parafuso de regulação */}
      <circle
        cx="130"
        cy="130"
        r="7.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="130" cy="130" r="2.5" fill="currentColor" />
      <line x1="126" y1="130" x2="134" y2="130" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * High-precision vector illustration of a straight razor (navalha / navalhete aberta)
 */
export function StraightRazor({ className = "w-72 h-36 text-[#C6924B]", opacity = 0.12 }) {
  return (
    <svg
      viewBox="0 0 320 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      {/* Pivot Pin */}
      <circle
        cx="105"
        cy="70"
        r="5"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      {/* Handle Scales (Cabo da navalha curvado) */}
      <path
        d="M 105 70 Q 55 78 18 110 C 10 118 18 126 26 122 Q 72 94 112 78 Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M 105 70 Q 58 74 15 106"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      {/* Tang / Espiga com ranhuras jimps de aderência */}
      <path
        d="M 105 70 L 132 66 Q 140 64 148 60 L 152 64 L 105 74 Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Jimps */}
      <line x1="116" y1="68" x2="118" y2="72" stroke="currentColor" strokeWidth="1.2" />
      <line x1="122" y1="67" x2="124" y2="71" stroke="currentColor" strokeWidth="1.2" />
      <line x1="128" y1="66" x2="130" y2="70" stroke="currentColor" strokeWidth="1.2" />

      {/* Razor Blade (Lâmina com corte côncavo e ponta francesa/redonda) */}
      <path
        d="M 148 60 L 275 32 C 288 29 294 40 286 48 L 270 62 Q 200 76 148 70 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Hollow Grind Spine Line */}
      <path
        d="M 148 63 Q 210 50 278 35"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Cutting Edge / Fio da Lâmina */}
      <path
        d="M 148 70 Q 200 76 270 62"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/**
 * Full Watermark Background Layer for Modals and Sections
 * Renders the authentic barber tools scattered artistically across the canvas
 */
export default function BarberBackgroundWatermark({ isDark = true }) {
  const strokeColor = isDark ? "text-[#C6924B]" : "text-[#9E7339]";
  const baseOpacity = isDark ? 0.09 : 0.07;
  const highlightOpacity = isDark ? 0.14 : 0.1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Top Right: Large diagonal comb & shears */}
      <div className="absolute -top-6 -right-16 sm:-right-8 transform rotate-[-28deg] transition-transform duration-700">
        <BarberComb
          className={`w-72 sm:w-96 h-28 sm:h-36 ${strokeColor}`}
          opacity={highlightOpacity}
        />
      </div>

      {/* Top Right Center: Crossing Scissors */}
      <div className="absolute top-2 right-4 sm:right-16 transform rotate-[18deg] transition-transform duration-700">
        <BarberScissors
          className={`w-56 sm:w-72 h-56 sm:h-72 ${strokeColor}`}
          opacity={baseOpacity}
        />
      </div>

      {/* Middle Right: Classic Straight Razor floating behind cards */}
      <div className="absolute top-[34%] -right-12 sm:right-2 transform rotate-[-15deg] transition-transform duration-700">
        <StraightRazor
          className={`w-64 sm:w-80 h-32 sm:h-40 ${strokeColor}`}
          opacity={highlightOpacity}
        />
      </div>

      {/* Middle Left: Faint Comb */}
      <div className="absolute top-[45%] -left-20 sm:-left-12 transform rotate-[32deg] transition-transform duration-700">
        <BarberComb
          className={`w-64 sm:w-80 h-24 sm:h-32 ${strokeColor}`}
          opacity={baseOpacity}
        />
      </div>

      {/* Bottom Left: Open Barber Scissors */}
      <div className="absolute -bottom-10 -left-12 sm:left-4 transform rotate-[-42deg] transition-transform duration-700">
        <BarberScissors
          className={`w-60 sm:w-72 h-60 sm:h-72 ${strokeColor}`}
          opacity={highlightOpacity}
        />
      </div>

      {/* Bottom Right: Open Razor & Comb */}
      <div className="absolute -bottom-8 -right-10 sm:right-10 transform rotate-[22deg] transition-transform duration-700">
        <StraightRazor
          className={`w-60 sm:w-76 h-28 sm:h-36 ${strokeColor}`}
          opacity={baseOpacity}
        />
      </div>

      {/* Subtle radial ambient warmth center */}
      <div
        className={`absolute inset-0 bg-radial from-[#C6924B]/[0.03] via-transparent to-transparent pointer-events-none`}
      />
    </div>
  );
}
