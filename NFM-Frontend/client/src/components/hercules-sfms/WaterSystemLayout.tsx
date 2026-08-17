import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { User, Settings, LogOut } from 'lucide-react'
import { useLocation } from 'wouter'
import asmLogo from '../../assets/Asm_Logo.png'
import pureBreedLogo from '../../assets/PureBreed.png'

interface WaterSystemLayoutProps {
  children: React.ReactNode
}

export function WaterSystemLayout({ children }: WaterSystemLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [location, setLocation] = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCurrentTime = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrentTimeOnly = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPageTitle = () => {
    switch (location) {
      case '/kpi-dashboard':
      case '/':
        return 'KPI Dashboard'
      case '/kpi-carousel':
        return 'KPI Carousel'
      case '/batch-calendar':
        return 'Batch Calendar'
      case '/data-table':
        return 'Data Table'
      case '/reports':
        return 'Reports'
      case '/plc-reports':
        return 'PLC Reports'
      case '/databases':
        return 'Databases'
      case '/admin':
        return 'Admin'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="h-screen bg-shell text-shell-text flex relative overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <header className="h-[112px] min-h-[112px] bg-shell border-b border-shell-border px-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-shell-text">PureBreed-reporting</h1>
            <p className="text-sm text-shell-secondary">{getPageTitle()}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-shell-secondary">Production Manager</span>
              <div className="w-9 h-9 rounded-full bg-shell-hover border border-[#2a3347] flex items-center justify-center">
                <User className="h-[18px] w-[18px] text-shell-secondary" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setLocation('/admin')}
                className="p-2 rounded-lg bg-shell-hover text-shell-muted hover:text-shell-text focus:outline-none focus:ring-2 focus:ring-shell-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-shell-hover text-shell-muted hover:text-danger focus:outline-none focus:ring-2 focus:ring-shell-accent transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-shell-muted border-l border-shell-border pl-4">
              <div>{formatCurrentTime()}</div>
              <div className="text-shell-accent">{formatCurrentTimeOnly()}</div>
            </div>

            <div className="flex items-center space-x-3 border-l border-shell-border pl-4">
              <div className="h-[96px] bg-white rounded-lg px-2 flex items-center justify-center">
                <img
                  src={pureBreedLogo}
                  alt="Pure Breed Poultry Co."
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="h-[96px] bg-white rounded-lg px-2 flex items-center justify-center">
                <img
                  src={asmLogo}
                  alt="ASM Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative smooth-scroll bg-background text-foreground">
          <div className="relative z-10 max-w-full page-transition page-transition-enter-active">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
