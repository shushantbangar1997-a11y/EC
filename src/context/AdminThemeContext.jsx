import React, { createContext, useContext, useState } from 'react'

// ── Light mode tokens ────────────────────────────────────────────────────────
export const LIGHT = {
  isDark: false,
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
  sidebarActiveBg:   '#ffffff',
  sidebarActiveText: '#0a0a0a',
}

// ── Dark mode tokens ─────────────────────────────────────────────────────────
export const DARK = {
  isDark: true,
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
  headerBg:      '#161616',
  headerBorder:  '#2a2a2a',
  sidebarActiveBg:   '#ffffff',
  sidebarActiveText: '#0a0a0a',
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
