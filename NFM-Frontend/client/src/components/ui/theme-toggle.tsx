import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-slate-200 dark:bg-slate-700 rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-300"
      aria-label="Toggle theme"
    >
      {/* Toggle Handle */}
      <div 
        className={`absolute top-1 w-5 h-5 bg-white dark:bg-slate-300 rounded-full shadow-md transition-all duration-300 ease-in-out transform ${
          theme === 'light' ? 'translate-x-0' : 'translate-x-7'
        }`}
      >
        {/* Icon Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Sun Icon - Visible in light mode */}
          <Sun 
            className={`w-3 h-3 text-amber-500 transition-all duration-300 ${
              theme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'
            }`}
          />
          
          {/* Moon Icon - Visible in dark mode */}
          <Moon 
            className={`absolute w-3 h-3 text-slate-600 transition-all duration-300 ${
              theme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
            }`}
          />
        </div>
      </div>
      
      {/* Background Icons (Subtle) */}
      <div className="relative w-full h-full flex items-center justify-between px-1">
        <Sun className="w-3 h-3 text-amber-400/30 dark:text-amber-400/20" />
        <Moon className="w-3 h-3 text-slate-400/30 dark:text-slate-400/20" />
      </div>
    </button>
  )
}