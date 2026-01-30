import React, { useState, useEffect } from 'react';
import { AnimalData, AppState } from '../types';
import { RadarChart } from './RadarChart';
import { Badge } from './Badge';
import { EvolutionChain } from './EvolutionChain';

interface PokedexScreenProps {
  data: AnimalData | null;
  state: AppState;
  imageUrl: string | null;
  searchHistory?: string[];
}

const getAnimalImage = (query: string) => {
  return `https://picsum.photos/seed/${query}/400/400`;
};

// ... (keep helper functions if needed, or replace with components)

export const PokedexScreen: React.FC<PokedexScreenProps> = ({ data, state, imageUrl, searchHistory = [] }) => {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showMissingNo, setShowMissingNo] = useState(false);

  useEffect(() => {
    if (data && (data.name.toLowerCase().includes('????') || data.name.toLowerCase().includes('unknown'))) {
      setShowMissingNo(true);
    } else {
      setShowMissingNo(false);
    }
  }, [data]);

  const renderSizeComparison = (height: string) => {
    const extractHeight = height.match(/(\d+(?:\.\d+)?)/)?.[1];
    const heightNum = extractHeight ? parseFloat(extractHeight) : 1;
    const humanHeight = 1.7; // meters
    // Assume height is in meters if small, cm if large. Simple heuristic.
    let animalHeightM = heightNum;
    if (heightNum > 10) animalHeightM = heightNum / 100; // probably cm

    const maxH = Math.max(humanHeight, animalHeightM);
    const scale = 50 / maxH; // scale to fit in 50px height

    return (
      <div className="flex items-end justify-center gap-4 h-20 bg-black/20 rounded-lg p-2">
        <div className="text-center flex flex-col items-center justify-end h-full">
          <div 
            className="bg-green-500 w-6 rounded-t shadow-[0_0_5px_rgba(34,197,94,0.5)] transition-all duration-1000"
            style={{ height: `${Math.min(animalHeightM * scale, 100)}%` }}
          />
          <div className="text-[10px] mt-1 text-green-300 opacity-80">Animal</div>
        </div>
        <div className="text-center flex flex-col items-center justify-end h-full">
          <div 
            className="bg-gray-400 w-4 rounded-t opacity-50"
            style={{ height: `${humanHeight * scale}%` }}
          />
          <div className="text-[10px] mt-1 text-gray-400 opacity-80">Humano</div>
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-green-900/50 rounded w-3/4"></div>
      <div className="flex gap-4">
        <div className="w-32 h-32 bg-green-900/30 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-green-900/40 rounded w-full"></div>
          <div className="h-4 bg-green-900/40 rounded w-5/6"></div>
          <div className="h-4 bg-green-900/40 rounded w-4/6"></div>
        </div>
      </div>
      <div className="h-20 bg-green-900/20 rounded"></div>
    </div>
  );

  return (
    <div className="bg-gray-200 border-[12px] border-gray-300 rounded-bl-[40px] rounded-br-[40px] rounded-tl-lg rounded-tr-lg p-6 shadow-inner relative overflow-hidden h-full flex flex-col">
      {/* Top decorative dots */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full border border-gray-400 shadow-sm"></div>
        <div className="w-3 h-3 bg-red-500 rounded-full border border-gray-400 shadow-sm"></div>
      </div>

      {/* Main Digital Screen */}
      <div className="crt-screen bg-[#1a1a1a] border-4 border-gray-500 rounded-lg flex-1 relative overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        
        {/* Content Area */}
        <div className="relative z-20 flex flex-col h-full font-['VT323'] text-green-400 text-xl leading-snug digital-scroll overflow-y-auto scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black">
          
          {state === AppState.IDLE && !data && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70 p-4">
              <span className="text-4xl mb-4 animate-pulse text-green-300 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">ESPERANDO DATOS</span>
              <p className="text-lg text-green-500/80">ESCRIBE, HABLA O USA LA CÁMARA</p>
              
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mt-8 w-full max-w-xs bg-green-900/10 p-4 rounded border border-green-800/30">
                  <div className="text-green-600 text-xs mb-2 tracking-widest uppercase border-b border-green-800/30 pb-1">Historial Reciente</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {searchHistory.slice(0, 5).map((term, index) => (
                      <div key={index} className="text-green-400/80 text-sm hover:text-green-300 cursor-default truncate">
                        {'>'} {term}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {state === AppState.ANALYZING && (
            <div className="flex flex-col items-center justify-center h-full relative">
              <div className="scan-line absolute inset-0 pointer-events-none"></div>
              <SkeletonLoader />
              <div className="absolute bottom-10 text-center w-full">
                <span className="animate-pulse bg-black/50 px-2 rounded">ANALIZANDO ADN...</span>
              </div>
            </div>
          )}
          
          {(state === AppState.SPEAKING || (state === AppState.IDLE && data)) && data && (
            <div className={`flip-card ${cardFlipped ? 'flipped' : ''} h-full w-full`} onClick={() => setCardFlipped(!cardFlipped)}>
              <div className="flip-card-inner">
                
                {/* --- FRONT CARD --- */}
                <div className="flip-card-front p-4 overflow-y-auto">
                  <div className="space-y-4 pb-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-green-800/50 pb-2">
                      <div>
                        <h2 className={`text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${showMissingNo ? 'glitch' : ''}`}>
                          {data.name.toUpperCase()}
                        </h2>
                        <div className="text-xs text-green-500 italic font-mono opacity-80">{data.scientificName}</div>
                      </div>
                      <Badge type="rarity" value={data.rarity} className="scale-90 origin-top-right" />
                    </div>
                    
                    {/* Image Row */}
                    <div className="flex gap-4 items-start">
                      <div className={`relative w-32 h-32 flex-shrink-0 bg-black/40 rounded-lg border border-green-700/50 overflow-hidden group ${showMissingNo ? 'missing-no' : ''}`}>
                         {imageUrl ? (
                           <>
                             <img src={imageUrl} alt={data.name} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                             <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay"></div>
                           </>
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-4xl">?</div>
                         )}
                         <div className="absolute bottom-0 right-0 bg-black/60 px-2 py-0.5 text-xs rounded-tl">{data.soundEmoji}</div>
                      </div>
                      
                      <div className="flex-1 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 font-bold text-xs uppercase">Bioma</span>
                          <Badge type="biome" value={data.type} className="scale-75 origin-right" />
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          <div>
                            <span className="text-green-700 block text-[10px]">ALTURA</span>
                            <span className="text-green-300">{data.stats.height}</span>
                          </div>
                          <div>
                            <span className="text-green-700 block text-[10px]">PESO</span>
                            <span className="text-green-300">{data.stats.weight}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-green-700 block text-[10px]">DIETA</span>
                            <span className="text-green-300">{data.diet}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-green-900/10 p-3 rounded border-l-2 border-green-600">
                      <p className={`text-base leading-relaxed text-green-200 ${showMissingNo ? 'glitch' : ''}`}>{data.description}</p>
                    </div>

                    {/* Evolution Chain */}
                    {data.evolutionChain && data.evolutionChain.length > 0 && (
                      <EvolutionChain chain={data.evolutionChain} currentAnimal={data.name} />
                    )}

                    <div className="text-center text-green-500/50 text-xs animate-pulse mt-2">
                      [ TAP PARA DETALLES ]
                    </div>
                  </div>
                </div>

                {/* --- BACK CARD --- */}
                <div className="flip-card-back bg-[#1a1a1a] p-4 text-green-400 space-y-4 overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-green-800/50 pb-2">
                    <h3 className="text-lg font-bold text-green-300">ANÁLISIS DE DATOS</h3>
                    <div className="text-xs px-2 py-0.5 bg-green-900/30 rounded text-green-500">v2.0</div>
                  </div>
                  
                  {/* Radar Chart */}
                  <div className="flex justify-center py-2 relative">
                    <div className="absolute inset-0 bg-green-500/5 blur-xl rounded-full"></div>
                    <RadarChart 
                      stats={data.stats}
                      size={120}
                    />
                  </div>

                  {/* Danger & Conservation Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-2 rounded border border-white/5 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 uppercase mb-1">Peligro</span>
                      <Badge type="danger" value={data.dangerLevel} />
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-white/5 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 uppercase mb-1">Estado</span>
                      <Badge type="conservation" value={data.conservationStatus} />
                    </div>
                  </div>

                  {/* Size Comparison */}
                  <div>
                    <div className="text-green-600 text-xs mb-1 uppercase tracking-wider">Comparación de Escala</div>
                    {renderSizeComparison(data.stats.height)}
                  </div>

                  {/* Fun Fact */}
                  {data.funFact && (
                    <div className="mt-auto pt-2 border-t border-green-800/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="text-green-500 text-xs font-bold tracking-wider uppercase">Archivo Secreto</span>
                      </div>
                      <p className="text-sm text-green-300/90 italic border-l-2 border-yellow-500/50 pl-3 py-1">
                        "{data.funFact}"
                      </p>
                    </div>
                  )}

                  <div className="text-center text-green-500/50 text-xs animate-pulse pt-2">
                    [ TAP PARA VOLVER ]
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === AppState.ERROR && (
             <div className="flex flex-col items-center justify-center h-full text-red-500 p-4 text-center">
               <div className="text-6xl mb-4 opacity-50">⚠</div>
               <span className="text-2xl mb-2 font-bold glitch tracking-widest">ERROR FATAL</span>
               <p className="text-sm border-t border-red-900/50 pt-2 mt-2 w-full">NO SE PUDO DECODIFICAR LA SEÑAL DE ENTRADA</p>
               <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-900/30 border border-red-700 hover:bg-red-900/50 rounded text-red-300 text-sm transition-colors">
                 REINICIAR SISTEMA
               </button>
             </div>
          )}

        </div>
      </div>

      <div className="flex justify-between items-center mt-4 px-2">
        <div className={`w-8 h-8 rounded-full shadow-lg transition-all duration-300 ${
          state === AppState.ANALYZING || state === AppState.SPEAKING 
            ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
            : 'bg-red-600 border-2 border-red-800 shadow-inner'
        }`}></div>
        <div className="space-y-1">
          <div className="w-8 h-1 bg-gray-600/50 rounded-full"></div>
          <div className="w-8 h-1 bg-gray-600/50 rounded-full"></div>
          <div className="w-8 h-1 bg-gray-600/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
