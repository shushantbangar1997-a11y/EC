import React, { createContext, useContext, useState } from 'react'

// ── Light mode tokens ────────────────────────────────────────────────────────
const LIGHT = {
  isDark: false,

  // Content area
  pageBg:        '#fafafa',
  card:          '#ffffff',
  border:        '#e5e5e5',
  borderSoft:    '#f0f0f0',
  surfaceAlt:    '#f5f5f5',
  text:          '#171717',
  textSub:       '#525252',
  textMuted:     '#a3a3a3',
  inputBg:       '#ffffff',
  inputBorder:   '#e5e5e5',
  btnBg:         '#0a0a0a',
  btnText:       '#ffffff',
  btnDisBg:      '#e5e5e5',
  btnDisText:    '#a3a3a3',
  headerBg:      '#ffffff',
  headerBorder:  '#e5e5e5',

  // Sidebar — white in light mode
  sidebarBg:          '#ffffff',
  sidebarBorder:      '#e5e5e5',
  sidebarText:        '#525252',
  sidebarTextMuted:   '#a3a3a3',
  sidebarActiveBg:    '#0a0a0a',
  sidebarActiveText:  '#ffffff',
  sidebarHover:       'rgba(0,0,0,0.04)',
  sidebarAvatarBg:    '#f5f5f5',
  sidebarAvatarBorder:'#e5e5e5',
  sidebarAvatarText:  '#525252',
  sidebarLogoutBorder:'#e5e5e5',
  sidebarLogoutText:  '#a3a3a3',
  sidebarBadgeBg:     '#0a0a0a',
  sidebarBadgeText:   '#ffffff',
  sidebarDotBg:       '#0a0a0a',
  logoFilter:         'none',
  wordmarkColor:      '#171717',
  submarkColor:       '#a3a3a3',
}

// ── Dark mode tokens ─────────────────────────────────────────────────────────
const DARK = {
  isDark: true,

  // Content area
  pageBg:        '#111111',
  card:          '#1c1c1c',
  border:        '#2e2e2e',
  borderSoft:    '#222222',
  surfaceAlt:    '#161616',
  text:          '#f0f0f0',
  textSub:       '#a3a3a3',
  textMuted:     '#555555',
  inputBg:       '#161616',
  inputBorder:   '#2e2e2e',
  btnBg:         '#f0f0f0',
  btnText:       '#111111',
  btnDisBg:      '#2a2a2a',
  btnDisText:    '#555555',
  headerBg:      '#111111',
  headerBorder:  '#2a2a2a',

  // Sidebar — black in dark mode
  sidebarBg:          '#0a0a0a',
  sidebarBorder:      '#1e1e1e',
  sidebarText:        'rgba(255,255,255,0.65)',
  sidebarTextMuted:   '#555555',
  sidebarActiveBg:    '#ffffff',
  sidebarActiveText:  '#0a0a0a',
  sidebarHover:       'rgba(255,255,255,0.07)',
  sidebarAvatarBg:    '#1e1e1e',
  sidebarAvatarBorder:'#2e2e2e',
  sidebarAvatarText:  '#a3a3a3',
  sidebarLogoutBorder:'#2a2a2a',
  sidebarLogoutText:  '#a3a3a3',
  sidebarBadgeBg:     '#ffffff',
  sidebarBadgeText:   '#0a0a0a',
  sidebarDotBg:       '#ffffff',
  logoFilter:         'brightness(0) invert(1)',
  wordmarkColor:      'rgba(255,255,255,0.88)',
  submarkColor:       '#555555',
}

const AdminThemeContext = createContext({ theme: LIGHT, toggle: () => {} })

export function AdminThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('adminTheme') === 'dark' } catch { return false }
  })

  const toggle = () => setIsDark(d => {
    const next = !d
    try { localStorage.setItem('adminTheme', next ? 'dark' : 'light') } catch {}
    return next
  })

  return (
    <AdminThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, toggle }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}
