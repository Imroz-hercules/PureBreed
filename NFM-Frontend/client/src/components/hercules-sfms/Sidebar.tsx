import React from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Settings,
  Activity,
  Database,
  Cpu,
  TrendingUp,
  BarChart3
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
    path: '/kpi-overview',
    icon: BarChart3,
    label: 'KPI Overview',
    description: 'Comprehensive Performance Metrics & Analytics'
  },
  // {
  //   path: '/kpi-carousel',
  //   icon: TrendingUp,
  //   label: 'KPI Carousel',
  //   description: 'Interactive Chart Carousel with Live Data'
  // },
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
  // {
  //   path: '/plc-reports',
  //   icon: Cpu,
  //   label: 'PLC Reports',
  //   description: 'Real-time PLC Data & System Status'
  // },
  // {
  //   path: '/databases',
  //   icon: Database,
  //   label: 'Live PLC Data',
  //   description: 'Live PLC Data & Database Management'
  // },
  // {
  //   path: '/admin',
  //   icon: Settings,
  //   label: 'Admin',
  //   description: 'System Administration & Configuration'
  // },
]
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation()
  return (
    <div className={`bg-slate-900/95 light:bg-white border-r border-slate-700/50 light:border-gray-200 backdrop-blur-sm
                     transition-all duration-300 flex flex-col relative h-screen shadow-lg light:shadow-xl
                     ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 light:border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <img
                src={herculesLogo}
                alt="Hercules v2.0"
                className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
                style={{
                  opacity: 1,
                  imageRendering: 'auto'
                }}
              />
            </div>
          )}
          {collapsed && (
            <img
              src={herculesLogo}
              alt="Hercules v2.0"
              className="h-10 w-auto object-contain mx-auto dark:brightness-0 dark:invert"
              style={{
                opacity: 1,
                imageRendering: 'auto'
              }}
            />
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 light:hover:bg-gray-200
                       text-slate-400 light:text-gray-600 hover:text-cyan-400 light:hover:text-blue-600 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.path
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center p-3 rounded-lg transition-all duration-200 group cursor-pointer
                             ${isActive
                               ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400'
                               : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                             }`}>
                <Icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    {isActive && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
                {!collapsed && isActive && (
                  <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
      {/* Scanning Line Animation */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent
                      via-cyan-500/50 to-transparent opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/0 via-cyan-400/80 to-cyan-400/0
                        h-8 animate-pulse"></div>
      </div>
    </div>
  )
}