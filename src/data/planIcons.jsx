// ─── Shared plan SVG icons ────────────────────────────────
// Keyed by plan.id: 'portfolio' | 'starter' | 'pro'

export const PLAN_ICONS = {
  // Portfolio: ID card / profile badge
  portfolio: (color) => (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="13" width="40" height="30" rx="7" stroke={color} strokeWidth="2"/>
      <rect x="7" y="13" width="40" height="9" rx="7" fill={color} opacity="0.15"/>
      <rect x="7" y="18" width="40" height="4" fill={color} opacity="0.15"/>
      <circle cx="20" cy="31" r="6.5" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <circle cx="20" cy="29" r="2.5" fill={color}/>
      <path d="M14.5 37.5C14.5 34.46 17.02 32 20 32s5.5 2.46 5.5 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="30" y="27" width="12" height="2.5" rx="1.25" fill={color}/>
      <rect x="30" y="32" width="9" height="2" rx="1" fill={color} opacity="0.5"/>
      <rect x="30" y="36.5" width="10.5" height="2" rx="1" fill={color} opacity="0.3"/>
    </svg>
  ),

  // Small Website: browser window with layout blocks
  starter: (color) => (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="44" height="34" rx="7" stroke={color} strokeWidth="2"/>
      <rect x="5" y="10" width="44" height="11" rx="7" fill={color} opacity="0.12"/>
      <rect x="5" y="17" width="44" height="4" fill={color} opacity="0.12"/>
      <circle cx="13" cy="16" r="2" fill={color}/>
      <circle cx="20" cy="16" r="2" fill={color} opacity="0.5"/>
      <circle cx="27" cy="16" r="2" fill={color} opacity="0.25"/>
      <rect x="11" y="25" width="32" height="7" rx="3" fill={color} opacity="0.25"/>
      <rect x="11" y="35" width="14" height="5" rx="2.5" fill={color} opacity="0.15"/>
      <rect x="29" y="35" width="14" height="5" rx="2.5" fill={color} opacity="0.3"/>
    </svg>
  ),

  // Pro: layered stacked pages with star
  pro: (color) => (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="17" width="30" height="24" rx="5" stroke={color} strokeWidth="1.5" opacity="0.25"/>
      <rect x="10" y="13" width="30" height="24" rx="5" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <rect x="6" y="9" width="30" height="24" rx="5" fill="rgba(13,13,26,1)" stroke={color} strokeWidth="2"/>
      <path d="M21 14.5L22.8 19.6H28.2L23.9 22.7L25.6 27.8L21 24.7L16.4 27.8L18.1 22.7L13.8 19.6H19.2Z" fill={color}/>
    </svg>
  ),
};

// Paused / unavailable state — circular badge with pause bars, matching the
// plan icon style above (stroke outline + soft fill).
export const PAUSE_ICON = (color, size = 40) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="27" cy="27" r="20" stroke={color} strokeWidth="2"/>
    <circle cx="27" cy="27" r="20" fill={color} opacity="0.1"/>
    <rect x="19.5" y="18" width="5.5" height="18" rx="2.75" fill={color}/>
    <rect x="29" y="18" width="5.5" height="18" rx="2.75" fill={color}/>
  </svg>
);
