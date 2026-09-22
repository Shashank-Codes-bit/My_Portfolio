/**
 * Inline script for <head>: stamps data-theme before first paint so a saved choice never flashes.
 * Plain module (no "use client") so the server layout can inline the string.
 */
export const THEME_INIT_SCRIPT =
  "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();";
