import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-shell-hover border border-shell-border rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-shell-accent"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-shell-deep border border-shell-border rounded-full transition-all duration-300 ease-in-out transform ${
          theme === 'light' ? 'translate-x-0' : 'translate-x-7'
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Sun
            className={`w-3 h-3 text-amber-400 transition-all duration-300 ${
              theme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'
            }`}
          />
          <Moon
            className={`absolute w-3 h-3 text-shell-secondary transition-all duration-300 ${
              theme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
            }`}
          />
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-between px-1">
        <Sun className="w-3 h-3 text-shell-muted/40" />
        <Moon className="w-3 h-3 text-shell-muted/40" />
      </div>
    </button>
  )
}
