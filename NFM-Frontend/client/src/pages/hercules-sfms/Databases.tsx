import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Live PLC Report — automatic polling to /api/db3/live/read and /api/db4/live/read
 * was removed so the backend is not hit when no PLC is connected.
 */
const DatabasesPage = () => {
  return (
    <WaterSystemLayout>
      <div className="flex-1 p-2 space-y-4 bg-transparent light:bg-white text-white light:text-gray-900">
        <h1 className="text-4xl font-bold text-cyan-400 light:text-blue-600">Live PLC Report</h1>
        <Card className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-cyan-500/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-cyan-400">Live data disabled</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-2">
            <p>
              Automatic refresh to the PLC live endpoints is turned off. This avoids repeated
              requests when no controller is available.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
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
