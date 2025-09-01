import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatItem {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  color?: string;
  description?: string;
}

interface StatsProps {
  items: StatItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const Stats: React.FC<StatsProps> = ({ items, columns = 4, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: string) => {
    if (changeType === 'positive') return '↗';
    if (changeType === 'negative') return '↘';
    return '→';
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            {item.icon && (
              <div className={`p-3 rounded-lg ${item.color || 'bg-blue-500'}`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className={`${item.icon ? 'ml-4' : ''} flex-1`}>
              <p className="text-sm font-medium text-gray-600">{item.title}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              {item.change && (
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${getChangeColor(item.changeType || 'neutral')}`}>
                    {getChangeIcon(item.changeType || 'neutral')} {item.change}
                  </span>
                  {item.description && (
                    <span className="text-sm text-gray-500 ml-1">{item.description}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
