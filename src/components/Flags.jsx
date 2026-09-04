import React from "react";

export const FlagPT = ({ className = "w-5 h-3.5 rounded-xs object-cover inline-block shrink-0 shadow-xs" }) => (
  <svg className={className} viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="#DA121A"/>
    <rect width="240" height="400" fill="#006600"/>
    <circle cx="240" cy="200" r="80" fill="#FFDA44"/>
    <circle cx="240" cy="200" r="70" fill="#DA121A"/>
    <path d="M200,160 h80 v50 a40,40 0 0,1 -80,0 z" fill="#FFFFFF"/>
    <path d="M210,170 h60 v35 a30,30 0 0,1 -60,0 z" fill="#002B7F"/>
  </svg>
);

export const FlagGB = ({ className = "w-5 h-3.5 rounded-xs object-cover inline-block shrink-0 shadow-xs" }) => (
  <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="t"><path d="M30,15 m-30,0 l30,-15 l30,15 l-30,15 z h-30 v-30 h60 v30 z"/></clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 l60,30 M60,0 l-60,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 l60,30 M60,0 l-60,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#t)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

export const FlagES = ({ className = "w-5 h-3.5 rounded-xs object-cover inline-block shrink-0 shadow-xs" }) => (
  <svg className={className} viewBox="0 0 750 500" xmlns="http://www.w3.org/2000/svg">
    <rect width="750" height="500" fill="#c60b1e"/>
    <rect y="125" width="750" height="250" fill="#ffc400"/>
  </svg>
);

export const FlagFR = ({ className = "w-5 h-3.5 rounded-xs object-cover inline-block shrink-0 shadow-xs" }) => (
  <svg className={className} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="600" fill="#ED2939"/>
    <rect width="600" height="600" fill="#fff"/>
    <rect width="300" height="600" fill="#002395"/>
  </svg>
);
