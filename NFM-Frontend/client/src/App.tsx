import { useEffect } from "react"
import { Switch, Route } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { useLenisScroll } from "@/hooks/useLenisScroll" // :white_check_mark: Import your Lenis hook
// Hercules SFMS Core System Pages
import { KPIDashboard } from "./pages/hercules-sfms/KPIDashboard"
import { KPICarousel } from "./pages/hercules-sfms/KPICarousel"
import { BatchCalendar } from "./pages/hercules-sfms/BatchCalendar"
import { Reports as DataTable } from "./pages/hercules-sfms/Reports"
import { ReportsPage } from "./pages/hercules-sfms/ReportsPage"
import PLCReportsPage from "./pages/hercules-sfms/PLCReportsPage"
import { PLCConfiguration } from "./pages/hercules-sfms/PLCConfiguration"
import { Admin } from "./pages/hercules-sfms/Admin"
import DatabasesPage from "./pages/hercules-sfms/Databases"
import KPIOverview from "./pages/hercules-sfms/KPIOverview"
function Router() {
  return (
    <Switch>
      {/* Hercules SFMS Core System Routes — home opens Historical Reports */}
      <Route path="/" component={DataTable} />
      <Route path="/data-table" component={DataTable} />
      <Route path="/kpi-dashboard" component={KPIDashboard} />
      <Route path="/kpi-carousel" component={KPICarousel} />
      <Route path="/batch-calendar" component={BatchCalendar} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/plc-reports" component={PLCReportsPage} />
      <Route path="/plc-configuration" component={PLCConfiguration} />
      <Route path="/admin" component={Admin} />
      <Route path="/databases" component={DatabasesPage} />
      <Route path="/kpi-overview" component={KPIOverview} />
      {/* Catch all - redirect to Historical Reports */}
      <Route
        component={() => {
          window.location.href = "/data-table"
          return null
        }}
      />
    </Switch>
  )
}
function App() {
  // :white_check_mark: Activate smooth scrolling globally
  // useLenisScroll()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          {/* You can wrap your router in a scroll container if needed */}
          <div data-scroll-container>
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
export default App






