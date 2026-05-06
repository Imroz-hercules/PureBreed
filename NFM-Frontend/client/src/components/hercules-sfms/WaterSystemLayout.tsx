// import React, { useState } from 'react'
// import { Sidebar } from './Sidebar'
// import { ThemeToggle } from '@/components/ui/theme-toggle'
// import { User, Settings, LogOut } from 'lucide-react'
// import { useLocation } from 'wouter'
// import { useTheme } from '@/contexts/ThemeContext'
// import futuristicNeonVideo from '@assets/20250725_1923_Futuristic Neon Serenity_simple_compose_01k112wfdvfd5v7jndrbpsca92_1753707277024.mp4'

// interface WaterSystemLayoutProps {
//   children: React.ReactNode
// }

// export function WaterSystemLayout({ children }: WaterSystemLayoutProps) {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
//   const { theme } = useTheme()
//   const [location] = useLocation()

//   // Get current page title based on route
//   const getPageTitle = () => {
//     switch(location) {
//       case '/kpi-dashboard':
//       case '/':
//         return 'KPI Dashboard'
//       case '/batch-calendar':
//         return 'Batch Calendar'
//       case '/data-table':
//         return 'Data Table'
//       case '/reports':
//         return 'Reports'
//       case '/admin':
//         return 'Admin'
//       default:
//         return 'Dashboard'
//     }
//   }

//   return (
//     <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 
//                     light:bg-white
//                     text-white light:text-gray-900 flex relative overflow-hidden">
//       {/* Futuristic Video Background */}
//       <div className="fixed inset-0 pointer-events-none z-0">
//         <video
//           key={theme} 
//           autoPlay
//           loop
//           muted
//           playsInline
//           className="w-full h-full object-cover"
//           style={{ 
//             opacity: theme === 'dark' ? 0.7 : 0.8,
//             filter: theme === 'light' ? 'brightness(0.8) contrast(1.2)' : 'none'
//           }}
//         >
//           <source src={futuristicNeonVideo} type="video/mp4" />
//         </video>
//         {theme === 'dark' && (
//           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/40"></div>
//         )}
//         {theme === 'light' && (
//           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50/20"></div>
//         )}
//       </div>
//       {/* Sidebar */}
//       <Sidebar 
//         collapsed={sidebarCollapsed} 
//         onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
//       />
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col relative z-10">

//         {/* Top Header */}
//         <header className="bg-slate-900/95 light:bg-white border-b border-slate-700/50 light:border-gray-200 backdrop-blur-sm 
//                           px-6 py-4 flex items-center justify-between shadow-lg light:shadow-xl">
//           <div>
//             <h1 className="text-xl font-bold text-white light:text-gray-900">Khamis-Historical</h1>
//             <p className="text-sm text-slate-400 light:text-gray-600">{getPageTitle()}</p>
//           </div>

//           <div className="flex items-center space-x-4">
//             {/* User Info */}
//             <div className="flex items-center space-x-3 text-sm">
//               <span className="text-slate-300 light:text-gray-700">Production Manager</span>
//               <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 
//                               rounded-full flex items-center justify-center">
//                 <User className="h-4 w-4 text-white" />
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex items-center space-x-2">
//               <ThemeToggle />
//               <button className="p-2 rounded-lg bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 light:hover:bg-gray-200
//                                  text-slate-400 light:text-gray-600 hover:text-cyan-400 light:hover:text-blue-600 transition-colors">
//                 <Settings className="h-4 w-4" />
//               </button>
//               <button className="p-2 rounded-lg bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 light:hover:bg-gray-200
//                                  text-slate-400 light:text-gray-600 hover:text-red-400 light:hover:text-red-600 transition-colors">
//                 <LogOut className="h-4 w-4" />
//               </button>
//             </div>

//             {/* Timestamp */}
//             <div className="text-xs text-slate-500 light:text-gray-500 border-l border-slate-700 light:border-gray-300 pl-4">
//               <div>Thursday, July 24, 2025</div>
//               <div className="text-cyan-400 light:text-blue-600">11:42 AM +03</div>
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative smooth-scroll
//                          bg-transparent light:bg-gray-50">

//           {/* Background Grid Pattern - Hidden in light mode */}
//           <div className="absolute inset-0 pointer-events-none opacity-5 light:opacity-0">
//             <div className="w-full h-full" 
//                  style={{
//                    backgroundImage: `linear-gradient(rgba(0,188,212,0.1) 1px, transparent 1px),
//                                     linear-gradient(90deg, rgba(0,188,212,0.1) 1px, transparent 1px)`,
//                    backgroundSize: '50px 50px'
//                  }}>
//             </div>
//           </div>

//           {/* Content Container */}
//           <div className="relative z-10 max-w-full page-transition page-transition-enter-active">
//             {children}
//           </div>

//           {/* Floating Particles - Hidden in light mode */}
//           <div className="absolute inset-0 pointer-events-none overflow-hidden light:hidden">
//             {[...Array(20)].map((_, i) => (
//               <div
//                 key={i}
//                 className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
//                 style={{
//                   left: `${Math.random() * 100}%`,
//                   top: `${Math.random() * 100}%`,
//                   animationDelay: `${Math.random() * 10}s`,
//                   animationDuration: `${15 + Math.random() * 10}s`
//                 }}
//               />
//             ))}
//           </div>
//         </main>


//       </div>
//     </div>
//   );
// }







import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { User, Settings, LogOut } from 'lucide-react'
import { useLocation } from 'wouter'
import { useTheme } from '@/contexts/ThemeContext'
import futuristicNeonVideo from '@assets/20250725_1923_Futuristic Neon Serenity_simple_compose_01k112wfdvfd5v7jndrbpsca92_1753707277024.mp4'
import asmLogo from '../../assets/Asm_Logo.png'
// import aghtiaLogo from '../../assets/aghtia.png' // Agthia logo commented out

interface WaterSystemLayoutProps {
  children: React.ReactNode
}

export function WaterSystemLayout({ children }: WaterSystemLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme } = useTheme()
  const [location, setLocation] = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format current time
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

  // Get current page title based on route
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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 
                    light:bg-white
                    text-white light:text-gray-900 flex relative overflow-hidden">
      {/* Futuristic Video Background */}
      {/* Background Video */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            opacity: 0.85, // same in both modes
            filter: "none" // no dimming in light mode
          }}
        >
          <source src={futuristicNeonVideo} type="video/mp4" />
        </video>

        {/* Same overlay for both themes */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/40"></div>
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">

        {/* Top Header */}
        <header className="bg-slate-900/95 light:bg-white border-b border-slate-700/50 light:border-gray-200 backdrop-blur-sm 
                          px-6 py-4 flex items-center justify-between shadow-lg light:shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-white light:text-gray-900">Khamis-Historical</h1>
            <p className="text-sm text-slate-400 light:text-gray-600">{getPageTitle()}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-slate-300 light:text-gray-700">Production Manager</span>
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 
                              rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button 
                onClick={() => setLocation('/admin')}
                className="p-2 rounded-lg bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 light:hover:bg-gray-200
                                 text-slate-400 light:text-gray-600 hover:text-cyan-400 light:hover:text-blue-600 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-slate-800/50 light:bg-gray-100 hover:bg-slate-700/50 light:hover:bg-gray-200
                                 text-slate-400 light:text-gray-600 hover:text-red-400 light:hover:text-red-600 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-slate-500 light:text-gray-500 border-l border-slate-700 light:border-gray-300 pl-4">
              <div>{formatCurrentTime()}</div>
              <div className="text-cyan-400 light:text-blue-600">{formatCurrentTimeOnly()}</div>
            </div>

            {/* Company Logos - Hidden */}
            <div className="flex items-center space-x-4 border-l border-slate-700 light:border-gray-300 pl-4">
              <img 
                src={asmLogo} 
                alt="ASM Logo" 
                className="h-16 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
              {/* Agthia logo commented out
              <img 
                src={aghtiaLogo} 
                alt="Aghtia Logo" 
                className="h-16 w-auto opacity-90 hover:opacity-100 transition-opacity dark:invert light:invert-0"
                style={{
                  filter: theme === 'dark' ? 'invert(1)' : 'none'
                }}
              />
              */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative smooth-scroll
                         bg-transparent light:bg-white">

          {/* Background Grid Pattern - Hidden in light mode */}
          <div className="absolute inset-0 pointer-events-none opacity-5 light:opacity-0">
            <div className="w-full h-full"
              style={{
                backgroundImage: `linear-gradient(rgba(0,188,212,0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0,188,212,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}>
            </div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 max-w-full page-transition page-transition-enter-active">
            {children}
          </div>

          {/* Floating Particles - Hidden in light mode */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden light:hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
        </main>


      </div>
    </div>
  );
}