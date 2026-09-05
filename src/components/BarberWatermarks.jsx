import React from "react";

/**
 * Full Watermark Background Layer for Modals and Sections
 * Uses the exact vintage barber tools wallpaper pattern sent by user
 */
export default function BarberBackgroundWatermark({ isDark = true }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Exact High-Res Barber Wallpaper Pattern */}
      <div
        className={`absolute inset-0 bg-repeat bg-center transition-opacity duration-500 ${
          isDark ? "opacity-[0.28]" : "opacity-[0.14]"
        }`}
        style={{
          backgroundImage: `url('/images/barber_wallpaper_pattern.png')`,
          backgroundSize: "320px auto"
        }}
      />

      {/* Subtle Radial Ambient Lighting & Vignette for maximum legibility */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-radial from-transparent via-[#171310]/50 to-[#171310]/85"
            : "bg-radial from-transparent via-white/60 to-white/90"
        }`}
      />
    </div>
  );
}
