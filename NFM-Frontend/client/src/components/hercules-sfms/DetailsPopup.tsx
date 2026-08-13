import React from 'react';
import PieChart from './PieChart';
import { X } from 'lucide-react';
import { chartPalette } from '@/lib/themeTokens';

interface DetailsPopupProps {
  date: string;
  data: any[];
  onClose: () => void;
  totalProduction: number;
  totalBatches: number;
  totalProducts: number;
}

const DetailsPopup: React.FC<DetailsPopupProps> = ({ date, data, onClose, totalProduction, totalBatches, totalProducts }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const palette = chartPalette();
  const uniqueColors = [
    ...palette.series,
    palette.brand,
    palette.success,
    palette.warning,
    palette.danger,
    palette.info,
    '#96CEB4',
    '#DDA0DD',
    '#F7DC6F',
    '#85C1E9',
    '#82E0AA',
  ];

  const getProductColors = (productCount: number) => {
    const colors = [];
    for (let i = 0; i < productCount; i++) {
      colors.push(uniqueColors[i % uniqueColors.length]);
    }
    return colors;
  };

  const productColors = getProductColors(data.length);

  const chartData = {
    labels: data.map(item => item.product_name),
    datasets: [
      {
        data: data.map(item => item.quantity_kg),
        backgroundColor: productColors,
        borderColor: productColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: productColors,
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface text-foreground rounded-lg shadow-[var(--shadow-lg)] w-full max-w-4xl p-6 relative border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[color:var(--text-muted)] hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-brand">
          {new Date(date).toLocaleDateString()} - Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-surface-sunken p-4 rounded-lg border border-border">
            <h3 className="text-sm font-medium text-[color:var(--text-muted)]">Total Production</h3>
            <p className="text-2xl font-bold text-brand">
              {(totalProduction / 1000).toFixed(2)}{' '}
              <span className="text-base font-normal">tons</span>
            </p>
          </div>
          <div className="bg-surface-sunken p-4 rounded-lg border border-border">
            <h3 className="text-sm font-medium text-[color:var(--text-muted)]">Total Batches</h3>
            <p className="text-2xl font-bold text-success">{totalBatches}</p>
          </div>
          <div className="bg-surface-sunken p-4 rounded-lg border border-border">
            <h3 className="text-sm font-medium text-[color:var(--text-muted)]">Total Products</h3>
            <p className="text-2xl font-bold text-info">{totalProducts}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-brand">Product Totals</h3>
            <div className="overflow-auto max-h-80 border border-border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-sunken text-[color:var(--text-secondary)] sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3 text-right">Quantity (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-surface-sunken"
                    >
                      <td className="px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 text-foreground">
                        <div
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: productColors[index] }}
                        />
                        <span>{item.product_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-foreground">
                        {item.quantity_kg.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-center text-brand">
              Product Pie Chart
            </h3>
            <div className="flex justify-center items-center h-full max-h-80 details-popup-pie-chart">
              <PieChart data={chartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPopup;
