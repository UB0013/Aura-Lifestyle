import React from 'react';
import { Award } from 'lucide-react';

interface DataPoint {
  day: string;
  steps?: number;
  calories?: number;
  auraScore?: number;
}

interface VisibleLines {
    steps: boolean;
    calories: boolean;
    auraScore: boolean;
}

interface LineChartProps {
  data: DataPoint[];
  visibleLines: VisibleLines;
  onLegendClick: (key: 'steps' | 'calories' | 'auraScore') => void;
  width?: number;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, visibleLines, onLegendClick, width = 500, height = 200 }) => {
  if (!data || data.length < 2) {
    return <div style={{ height }} className="flex items-center justify-center text-gray-400">Not enough data to display a chart.</div>;
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxSteps = Math.max(...data.map(d => d.steps || 0), 1);
  const maxCalories = Math.max(...data.map(d => d.calories || 0), 1);
  const maxScore = 100;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getStepsY = (value: number) => padding.top + chartHeight - (value / maxSteps) * chartHeight;
  const getCaloriesY = (value: number) => padding.top + chartHeight - (value / maxCalories) * chartHeight;
  const getScoreY = (value: number) => padding.top + chartHeight - (value / maxScore) * chartHeight;
  
  const lineData = [
    { key: 'steps', path: data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getStepsY(d.steps || 0)}`).join(' '), color: 'stroke-cyan-400', fill: 'fill-cyan-400', points: data.map(d => d.steps || 0), getY: getStepsY },
    { key: 'calories', path: data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getCaloriesY(d.calories || 0)}`).join(' '), color: 'stroke-red-400', fill: 'fill-red-400', points: data.map(d => d.calories || 0), getY: getCaloriesY },
    { key: 'auraScore', path: data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getScoreY(d.auraScore || 0)}`).join(' '), color: 'stroke-indigo-400', fill: 'fill-indigo-400', points: data.map(d => d.auraScore || 0), getY: getScoreY },
  ];

  const legendItems = [
      { key: 'steps', label: 'Steps', color: 'bg-cyan-400' },
      { key: 'calories', label: 'Calories', color: 'bg-red-400' },
      { key: 'auraScore', label: 'Aura Score', color: 'bg-indigo-400' },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis labels (Percentage) */}
        {[0, 25, 50, 75, 100].map(p => (
            <g key={p}>
                 <text x={padding.left - 8} y={padding.top + chartHeight - (p / 100) * chartHeight} dy="0.32em" textAnchor="end" className="text-xs fill-gray-400">{p}%</text>
                 <line x1={padding.left} y1={padding.top + chartHeight - (p / 100) * chartHeight} x2={width - padding.right} y2={padding.top + chartHeight - (p / 100) * chartHeight} className="stroke-gray-700/50" />
            </g>
        ))}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="stroke-gray-700" />
        
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={d.day} x={getX(i)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-gray-400">{d.day}</text>
        ))}
        
        {/* Data paths and points */}
        {lineData.map(line => visibleLines[line.key as keyof VisibleLines] && (
            <g key={line.key}>
                <path d={line.path} fill="none" className={line.color} strokeWidth="2" />
                {line.points.map((point, i) => (
                    <circle key={`${line.key}-point-${i}`} cx={getX(i)} cy={line.getY(point)} r="4" className={`${line.fill} cursor-pointer`}>
                        <title>{`${legendItems.find(l=>l.key === line.key)?.label}: ${point.toLocaleString()}`}</title>
                    </circle>
                ))}
            </g>
        ))}
      </svg>
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2 text-sm">
        {legendItems.map(item => (
            <button key={item.key} onClick={() => onLegendClick(item.key as keyof VisibleLines)} className={`flex items-center space-x-2 p-1 rounded transition-opacity ${visibleLines[item.key as keyof VisibleLines] ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}>
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-gray-300">{item.label}</span>
            </button>
        ))}
      </div>
    </div>
  );
};

export default LineChart;