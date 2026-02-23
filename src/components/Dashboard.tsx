import { ChartPanel } from './ChartPanel';
import { useDashboard } from '../context/DashboardContext';

export function Dashboard() {
  const { state, toggleConfig } = useDashboard();
  const { layout, charts } = state.config;

  // Calculate grid template based on layout
  const gridStyle = {
    gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
  };

  // Limit charts to available grid slots
  const maxCharts = layout.columns * layout.rows;
  const visibleCharts = charts.slice(0, maxCharts);

  return (
    <div className="dashboard" style={gridStyle}>
      {visibleCharts.map((chartConfig) => (
        <ChartPanel key={chartConfig.id} config={chartConfig} />
      ))}
      {/* Fill empty slots if needed */}
      {visibleCharts.length < maxCharts &&
        Array.from({ length: maxCharts - visibleCharts.length }).map((_, i) => (
          <div key={`empty-${i}`} className="chart-panel empty" onClick={toggleConfig}>
            <div className="empty-slot">
              <span>+</span>
              <span>Add Chart</span>
            </div>
          </div>
        ))}
    </div>
  );
}
