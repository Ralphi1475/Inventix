'use client';
import React from 'react';
import { LucideIcon } from 'lucide-react';

export function NavItem({ icon, label, active, onClick }: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${active ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}