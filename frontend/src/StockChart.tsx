// src/StockChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface StockChartProps {
  data: ChartData<'line'>;
  // You can also pass options if you want to customize them per chart instance
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Important for custom height/width
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Stock Performance Comparison',
      },
      tooltip: {
        mode: 'index' as const, // Show tooltip for all lines at that x-index
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Portfolio Value ($)',
        },
        // beginAtZero: true, // Optional: decide if Y-axis should always start at 0
      },
    },
    interaction: { // Enhances tooltip behavior
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // It's good to provide a container with a specific height for the chart
  return (
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default StockChart;