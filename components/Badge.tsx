import React from 'react';

interface BadgeProps {
  type: 'biome' | 'rarity' | 'conservation' | 'danger';
  value: string | number;
  className?: string;
}

const BIOME_COLORS: Record<string, string> = {
  'Selva': 'bg-green-600 border-green-400 text-green-100',
  'Océano': 'bg-blue-600 border-blue-400 text-blue-100',
  'Desierto': 'bg-yellow-600 border-yellow-400 text-yellow-100',
  'Ártico': 'bg-cyan-600 border-cyan-400 text-cyan-100',
  'Sabana': 'bg-orange-600 border-orange-400 text-orange-100',
  'Bosque': 'bg-emerald-700 border-emerald-500 text-emerald-100',
  'Montaña': 'bg-gray-600 border-gray-400 text-gray-100',
  'Urbano': 'bg-purple-600 border-purple-400 text-purple-100',
};

const RARITY_STYLES: Record<string, string> = {
  'Común': 'bg-gray-500 text-white border-gray-400',
  'Poco Común': 'bg-green-500 text-white border-green-300 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
  'Raro': 'bg-blue-500 text-white border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  'Épico': 'bg-purple-600 text-white border-purple-300 shadow-[0_0_20px_rgba(147,51,234,0.6)] animate-pulse',
  'Legendario': 'bg-yellow-500 text-white border-yellow-200 shadow-[0_0_25px_rgba(234,179,8,0.8)] animate-pulse ring-2 ring-yellow-400 ring-opacity-50',
};

const CONSERVATION_COLORS: Record<string, string> = {
  'LC': 'bg-green-600', // Least Concern
  'NT': 'bg-emerald-600', // Near Threatened
  'VU': 'bg-yellow-600', // Vulnerable
  'EN': 'bg-orange-600', // Endangered
  'CR': 'bg-red-600', // Critically Endangered
  'EW': 'bg-purple-800', // Extinct in Wild
  'EX': 'bg-black', // Extinct
};

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let styles = 'px-3 py-1 rounded-full text-xs font-bold border flex items-center justify-center uppercase tracking-wider backdrop-blur-sm ';
  
  if (type === 'biome') {
    styles += BIOME_COLORS[value.toString()] || 'bg-gray-500 border-gray-400 text-white';
  } else if (type === 'rarity') {
    styles += RARITY_STYLES[value.toString()] || 'bg-gray-500 border-gray-400 text-white';
  } else if (type === 'conservation') {
    const color = CONSERVATION_COLORS[value.toString()] || 'bg-gray-500';
    styles += `${color} text-white border-white/20`;
  } else if (type === 'danger') {
    const val = Number(value);
    const color = val < 4 ? 'bg-green-500' : val < 7 ? 'bg-yellow-500' : 'bg-red-600';
    styles += `${color} text-white border-white/20`;
  }

  return (
    <div className={`${styles} ${className}`}>
      {type === 'danger' && <span className="mr-1">⚠</span>}
      {value}
    </div>
  );
};
