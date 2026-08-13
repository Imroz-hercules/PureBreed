import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Live PLC Report — automatic polling to /api/db3/live/read and /api/db4/live/read
 * was removed so the backend is not hit when no PLC is connected.
 */
const DatabasesPage = () => {
  return (
    <WaterSystemLayout>
      <div className="flex-1 p-2 space-y-4 bg-transparent text-foreground">
        <h1 className="text-4xl font-bold text-brand">Live PLC Report</h1>
        <Card className="bg-surface border border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-brand">Live data disabled</CardTitle>
          </CardHeader>
          <CardContent className="text-[color:var(--text-muted)] text-sm leading-relaxed space-y-2">
            <p>
              Automatic refresh to the PLC live endpoints is turned off. This avoids repeated
              requests when no controller is available.
            </p>
            <p className="text-[color:var(--text-muted)]">
              To show live pellet and mill data again, wire this page back to the live APIs and
              enable polling only when a PLC is configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </WaterSystemLayout>
  );
};

export default DatabasesPage;
