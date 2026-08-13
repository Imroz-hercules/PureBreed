import React from 'react'
import { Link, useLocation } from 'wouter'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Activity,
} from 'lucide-react'
import herculesLogo from "../../assets/hercules-logo-final.png"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  {
    path: '/kpi-dashboard',
    icon: Activity,
    label: 'KPI Dashboard',
    description: 'Key Performance Indicators & Analytics'
  },
  {
    path: '/batch-calendar',
    icon: Calendar,
    label: 'Batch Calendar',
    description: 'Daily Production Calendar with Batch Statistics'
  },
  {
    path: '/data-table',
    icon: FileText,
    label: 'Historical Reports',
    description: 'Production Reports & Data Export'
  },
  {
    path: '/reports',
    icon: FileText,
    label: 'Raw Data',
    description: 'CSV Format Reports & Analytics'
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation()

  return (
    <div
      className={`bg-shell border-r border-shell-border flex flex-col relative h-screen
        transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      <div className="p-4 border-b border-shell-border">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={herculesLogo}
                alt="Hercules v2.0"
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
          )}
          {collapsed && (
            <img
              src={herculesLogo}
              alt="Hercules v2.0"
              className="h-10 w-auto object-contain mx-auto brightness-0 invert"
            />
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-shell-hover text-shell-muted hover:text-shell-text focus:outline-none focus:ring-2 focus:ring-shell-accent transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.path
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`relative h-12 flex items-center rounded-lg transition-all duration-200 group cursor-pointer
                  ${collapsed ? 'justify-center px-0' : 'gap-3 px-3.5'}
                  ${isActive
                    ? 'bg-shell-hover text-shell-text shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                    : 'text-shell-secondary hover:bg-shell-hover hover:text-shell-text'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-shell-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                )}
                <Icon
                  className={`h-[22px] w-[22px] flex-shrink-0 ${
                    isActive ? 'text-shell-text' : 'text-shell-muted group-hover:text-shell-text'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{item.label}</div>
                    {isActive && (
                      <div className="text-[10px] text-shell-muted truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
