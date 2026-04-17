import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
    } catch {}
    return true
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    if (root.getAttribute('data-theme') !== 'admin') {
      root.setAttribute('data-theme', 'customer')
    }
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  const toggleTheme = () => setIsDark(d => !d)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
