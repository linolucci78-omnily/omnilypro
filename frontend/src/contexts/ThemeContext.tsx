import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface BrandTheme {
  id: string
  name: string
  description: string
  is_default: boolean
  is_active: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text_primary: string
    text_secondary: string
    success: string
    warning: string
    error: string
  }
  sidebar: {
    background: string
    text: string
    text_hover: string
    text_active: string
    background_hover: string
    background_active: string
    border_color: string
    logo_text: string
  }
  typography: {
    font_family: string
    font_size_base: string
    font_weight_normal: string
    font_weight_bold: string
  }
  customization: {
    border_radius: string
    shadow_level: string
  }
  created_at: string
  updated_at: string
  usage_count: number
}

interface ThemeContextType {
  currentTheme: BrandTheme | null
  themes: BrandTheme[]
  setTheme: (themeId: string) => void
  saveTheme: (theme: BrandTheme) => void
  deleteTheme: (themeId: string) => void
  createTheme: (theme: Omit<BrandTheme, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Default themes
const defaultThemes: BrandTheme[] = [
  {
    id: '1',
    name: 'OMNILY Default',
    description: 'Tema principale di OMNILY con colori brand ufficiali',
    is_default: true,
    is_active: true,
    colors: {
      primary: '#3182CE',
      secondary: '#2D3748',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F7FAFC',
      text_primary: '#1A202C',
      text_secondary: '#4A5568',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    sidebar: {
      background: '#2D3748',
      text: '#FFFFFF',
      text_hover: '#3182CE',
      text_active: '#FFFFFF',
      background_hover: 'rgba(255, 255, 255, 0.1)',
      background_active: '#3182CE',
      border_color: 'rgba(255, 255, 255, 0.1)',
      logo_text: '#3182CE'
    },
    typography: {
      font_family: 'Inter, system-ui, sans-serif',
      font_size_base: '16px',
      font_weight_normal: '400',
      font_weight_bold: '600'
    },
    customization: {
      border_radius: '8px',
      shadow_level: 'medium'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 0
  }
]

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<BrandTheme[]>([])
  const [currentTheme, setCurrentTheme] = useState<BrandTheme | null>(null)

  // Helper function to migrate old themes without sidebar property
  const migrateTheme = (theme: any): BrandTheme => {
    if (!theme.sidebar) {
      // Add default sidebar configuration
      return {
        ...theme,
        sidebar: {
          background: theme.colors?.secondary || '#2D3748',
          text: '#FFFFFF',
          text_hover: theme.colors?.primary || '#3182CE',
          text_active: '#FFFFFF',
          background_hover: 'rgba(255, 255, 255, 0.1)',
          background_active: theme.colors?.primary || '#3182CE',
          border_color: 'rgba(255, 255, 255, 0.1)',
          logo_text: theme.colors?.primary || '#3182CE'
        }
      }
    }
    return theme
  }

  // Load themes from localStorage on mount
  useEffect(() => {
    const storedThemes = localStorage.getItem('omnily_themes')
    const storedActiveThemeId = localStorage.getItem('omnily_active_theme_id')

    if (storedThemes) {
      const parsedThemes = JSON.parse(storedThemes)

      // Migrate themes to add sidebar property if missing
      const migratedThemes = parsedThemes.map(migrateTheme)

      // Save migrated themes back to localStorage
      if (JSON.stringify(parsedThemes) !== JSON.stringify(migratedThemes)) {
        localStorage.setItem('omnily_themes', JSON.stringify(migratedThemes))
      }

      setThemes(migratedThemes)

      // Set active theme
      const activeTheme = migratedThemes.find((t: BrandTheme) =>
        storedActiveThemeId ? t.id === storedActiveThemeId : t.is_active
      )
      if (activeTheme) {
        setCurrentTheme(activeTheme)
        applyTheme(activeTheme)
      }
    } else {
      // First time: use default themes
      setThemes(defaultThemes)
      setCurrentTheme(defaultThemes[0])
      applyTheme(defaultThemes[0])
      localStorage.setItem('omnily_themes', JSON.stringify(defaultThemes))
      localStorage.setItem('omnily_active_theme_id', defaultThemes[0].id)
    }
  }, [])

  // Apply theme to DOM
  const applyTheme = (theme: BrandTheme) => {
    const root = document.documentElement

    // Apply colors
    root.style.setProperty('--primary-color', theme.colors.primary)
    root.style.setProperty('--secondary-color', theme.colors.secondary)
    root.style.setProperty('--accent-color', theme.colors.accent)
    root.style.setProperty('--background-color', theme.colors.background)
    root.style.setProperty('--surface-color', theme.colors.surface)
    root.style.setProperty('--text-primary-color', theme.colors.text_primary)
    root.style.setProperty('--text-secondary-color', theme.colors.text_secondary)
    root.style.setProperty('--success-color', theme.colors.success)
    root.style.setProperty('--warning-color', theme.colors.warning)
    root.style.setProperty('--error-color', theme.colors.error)

    // Apply sidebar colors
    root.style.setProperty('--sidebar-background', theme.sidebar.background)
    root.style.setProperty('--sidebar-text', theme.sidebar.text)
    root.style.setProperty('--sidebar-text-hover', theme.sidebar.text_hover)
    root.style.setProperty('--sidebar-text-active', theme.sidebar.text_active)
    root.style.setProperty('--sidebar-background-hover', theme.sidebar.background_hover)
    root.style.setProperty('--sidebar-background-active', theme.sidebar.background_active)
    root.style.setProperty('--sidebar-border-color', theme.sidebar.border_color)
    root.style.setProperty('--sidebar-logo-text', theme.sidebar.logo_text)

    // Apply typography
    root.style.setProperty('--font-family', theme.typography.font_family)
    root.style.setProperty('--font-size-base', theme.typography.font_size_base)
    root.style.setProperty('--font-weight-normal', theme.typography.font_weight_normal)
    root.style.setProperty('--font-weight-bold', theme.typography.font_weight_bold)

    // Apply customization
    root.style.setProperty('--border-radius', theme.customization.border_radius)

    // Shadow levels
    const shadowMap = {
      'low': '0 1px 3px rgba(0, 0, 0, 0.1)',
      'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
      'high': '0 10px 15px rgba(0, 0, 0, 0.2)'
    }
    root.style.setProperty('--box-shadow', shadowMap[theme.customization.shadow_level as keyof typeof shadowMap] || shadowMap.medium)
  }

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      // Update active status
      const updatedThemes = themes.map(t => ({
        ...t,
        is_active: t.id === themeId
      }))

      setThemes(updatedThemes)
      setCurrentTheme(theme)
      applyTheme(theme)

      localStorage.setItem('omnily_themes', JSON.stringify(updatedThemes))
      localStorage.setItem('omnily_active_theme_id', themeId)
    }
  }

  const saveTheme = (theme: BrandTheme) => {
    const updatedThemes = themes.map(t =>
      t.id === theme.id
        ? { ...theme, updated_at: new Date().toISOString() }
        : t
    )

    setThemes(updatedThemes)
    localStorage.setItem('omnily_themes', JSON.stringify(updatedThemes))

    // If updating the active theme, reapply it
    if (currentTheme?.id === theme.id) {
      setCurrentTheme(theme)
      applyTheme(theme)
    }
  }

  const createTheme = (themeData: Omit<BrandTheme, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
    const newTheme: BrandTheme = {
      ...themeData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0
    }

    const updatedThemes = [...themes, newTheme]
    setThemes(updatedThemes)
    localStorage.setItem('omnily_themes', JSON.stringify(updatedThemes))
  }

  const deleteTheme = (themeId: string) => {
    const themeToDelete = themes.find(t => t.id === themeId)

    // Don't delete default theme
    if (themeToDelete?.is_default) {
      console.warn('Cannot delete default theme')
      return
    }

    const updatedThemes = themes.filter(t => t.id !== themeId)
    setThemes(updatedThemes)
    localStorage.setItem('omnily_themes', JSON.stringify(updatedThemes))

    // If deleting active theme, switch to default
    if (currentTheme?.id === themeId) {
      const defaultTheme = updatedThemes.find(t => t.is_default) || updatedThemes[0]
      if (defaultTheme) {
        setTheme(defaultTheme.id)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themes,
      setTheme,
      saveTheme,
      deleteTheme,
      createTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
