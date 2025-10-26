'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({ 
  title, 
  value, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  color: string;
  subtitle?: string;
}) {
  const colors: Record<string, string> = { 
    green: 'bg-green-500', 
    red: 'bg-red-500', 
    blue: 'bg-blue-500', 
    purple: 'bg-purple-500',
    gray: 'bg-gray-500'
  };

  const getIcon = () => {
    if (color === 'green') return <TrendingUp className="text-white" />;
    if (color === 'red') return <TrendingDown className="text-white" />;
    return <Minus className="text-white" />;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`w-12 h-12 ${colors[color]} rounded-full flex items-center justify-center mb-4`}>
        {getIcon()}
      </div>
      <h3 className="text-gray-600 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}