import React from 'react';
import { AnimalData } from '../types';
import { Badge } from './Badge';
import { RadarChart } from './RadarChart';

interface CompareScreenProps {
  animal1: AnimalData;
  animal2: AnimalData;
  onClose: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({ animal1, animal2, onClose }) => {
  const getHigherStat = (stat1: number, stat2: number) => {
    if (stat1 > stat2) return 'text-green-400 font-bold';
    if (stat1 < stat2) return 'text-red-400';
    return 'text-gray-300';
  };

  const getStatDiff = (stat1: number, stat2: number) => {
    const diff = stat1 - stat2;
    if (diff > 0) return <span className="text-green-500 text-xs ml-1">(+{diff})</span>;
    if (diff < 0) return <span className="text-red-500 text-xs ml-1">({diff})</span>;
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black z-0"></div>
      
      {/* Header */}
      <div className="z-10 p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
        <h2 className="text-xl font-bold font-['VT323'] tracking-widest text-cyan-400">MODO COMPARACIÓN</h2>
        <button 
          onClick={onClose}
          className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded text-sm font-bold transition-colors"
        >
          CERRAR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 z-10 grid grid-cols-2 gap-4">
        {/* Animal 1 Column */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <img 
              src={`https://picsum.photos/seed/${animal1.name}/200`} 
              alt={animal1.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-bold text-center leading-tight">{animal1.name}</h3>
          <Badge type="rarity" value={animal1.rarity} className="scale-75" />
        </div>

        {/* Animal 2 Column */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            <img 
              src={`https://picsum.photos/seed/${animal2.name}/200`} 
              alt={animal2.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-bold text-center leading-tight">{animal2.name}</h3>
          <Badge type="rarity" value={animal2.rarity} className="scale-75" />
        </div>

        {/* Comparison Rows */}
        <div className="col-span-2 space-y-4 mt-4">
          
          {/* Base Stats Comparison */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Estadísticas Base</h4>
            
            <div className="space-y-3 font-mono text-sm">
              {[
                { label: 'Velocidad', key: 'speed' as keyof typeof animal1.stats },
                { label: 'Fuerza', key: 'strength' as keyof typeof animal1.stats },
                { label: 'Inteligencia', key: 'intelligence' as keyof typeof animal1.stats },
              ].map(({ label, key }) => {
                const val1 = Number(animal1.stats[key]);
                const val2 = Number(animal2.stats[key]);
                return (
                  <div key={key} className="grid grid-cols-3 items-center text-center">
                    <div className={getHigherStat(val1, val2)}>{val1} {getStatDiff(val1, val2)}</div>
                    <div className="text-gray-400 text-xs uppercase">{label}</div>
                    <div className={getHigherStat(val2, val1)}>{val2} {getStatDiff(val2, val1)}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 h-32 w-full flex justify-center">
              <RadarChart stats={animal1.stats} color="rgba(59, 130, 246, 0.5)" />
              <div className="absolute" style={{opacity: 0.7}}>
                 <RadarChart stats={animal2.stats} color="rgba(239, 68, 68, 0.5)" />
              </div>
            </div>
          </div>

          {/* Physical Stats */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
             <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Físico</h4>
             <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="text-blue-300">{animal1.stats.height}</div>
                <div className="text-gray-400 uppercase">Altura</div>
                <div className="text-red-300">{animal2.stats.height}</div>

                <div className="text-blue-300">{animal1.stats.weight}</div>
                <div className="text-gray-400 uppercase">Peso</div>
                <div className="text-red-300">{animal2.stats.weight}</div>

                <div className="text-blue-300">{animal1.stats.lifespan}</div>
                <div className="text-gray-400 uppercase">Vida</div>
                <div className="text-red-300">{animal2.stats.lifespan}</div>
             </div>
          </div>

          {/* Danger Level */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Peligro</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Badge type="danger" value={animal1.dangerLevel} className="mx-auto" />
              </div>
              <div className="text-center">
                <Badge type="danger" value={animal2.dangerLevel} className="mx-auto" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
