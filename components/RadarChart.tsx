import React from 'react';
import { AnimalStats } from '../types';

interface RadarChartProps {
  stats: AnimalStats;
  color?: string;
  size?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({ 
  stats, 
  color = "#22c55e", 
  size = 120,
  className = ""
}) => {
  const { speed, strength, intelligence } = stats;
  const center = size / 2;
  const maxRadius = (size * 0.8) / 2;
  
  // Calculate positions for each stat (triangle for 3 stats)
  const angles = [0, 120, 240]; // degrees
  const statValues = [speed, strength, intelligence];
  const labels = ['VEL', 'FUE', 'INT']; 
  
  const getPoint = (angle: number, value: number, radius: number = maxRadius) => {
    const radian = (angle - 90) * (Math.PI / 180); // -90 to start at top
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(radian);
    const y = center + distance * Math.sin(radian);
    return { x, y };
  };

  // Create grid lines (triangles)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPath = gridLevels.map(level => {
    const points = angles.map(angle => {
      const point = getPoint(angle, level);
      return `${point.x},${point.y}`;
    }).join(' ');
    return `M ${points.split(' ')[0]} L ${points.split(' ').slice(1).join(' L ')} Z`;
  }).join(' ');

  // Create stat polygon
  const statPoints = angles.map((angle, index) => {
    const point = getPoint(angle, statValues[index]);
    return `${point.x},${point.y}`;
  }).join(' ');

  // Create axis lines
  const axisLines = angles.map(angle => {
    const start = getPoint(angle, 0);
    const end = getPoint(angle, 100);
    return `M ${start.x},${start.y} L ${end.x},${end.y}`;
  }).join(' ');

  // Convert hex color to rgba for fill
  const getFillColor = (hex: string, opacity: number) => {
    // Simple hex to rgb conversion
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#')) {
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid lines */}
        <g stroke={color} strokeWidth="1" fill="none" opacity="0.3">
          <path d={gridPath} />
        </g>
        
        {/* Axis lines */}
        <g stroke={color} strokeWidth="1" opacity="0.5">
          <path d={axisLines} />
        </g>
        
        {/* Stat polygon */}
        <polygon
          points={statPoints}
          fill={getFillColor(color, 0.3)}
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Stat points */}
        {angles.map((angle, index) => {
          const point = getPoint(angle, statValues[index]);
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Labels */}
        {angles.map((angle, index) => {
          const point = getPoint(angle, 115); // Slightly outside max radius
          return (
            <text
              key={index}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-mono"
              fill={color}
              style={{ fontSize: '10px' }}
            >
              {labels[index]}
            </text>
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r="2"
          fill={color}
        />
      </svg>
      
      {/* Stat values below chart */}
      <div className="text-center text-xs font-mono mt-1 space-y-0.5" style={{ color: color }}>
        <div>VEL: {speed}</div>
        <div>FUE: {strength}</div>
        <div>INT: {intelligence}</div>
      </div>
    </div>
  );
};
