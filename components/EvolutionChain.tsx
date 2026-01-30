import React from 'react';

interface EvolutionChainProps {
  chain: string[];
  currentAnimal: string;
}

export const EvolutionChain: React.FC<EvolutionChainProps> = ({ chain, currentAnimal }) => {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Especies Relacionadas</h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {chain.map((animal, index) => (
          <React.Fragment key={animal}>
            <div 
              className={`
                flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${animal.toLowerCase() === currentAnimal.toLowerCase() 
                  ? 'bg-blue-600/50 text-white border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                  : 'bg-white/10 text-gray-300 border border-white/5 hover:bg-white/20'}
              `}
            >
              {animal}
            </div>
            {index < chain.length - 1 && (
              <div className="text-gray-500 font-bold">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
