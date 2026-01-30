import React, { useState, useMemo } from 'react';
import { AnimalData, Achievement } from '../types';
import { Badge } from './Badge';

interface GalleryProps {
  animals: AnimalData[];
  achievements: Achievement[];
  onAnimalSelect: (animal: AnimalData) => void;
  onBackToScan: () => void;
  onCompare: (animal1: AnimalData, animal2: AnimalData) => void;
}

const getAnimalImage = (query: string) => {
  return `https://picsum.photos/seed/${query}/200/200`;
};

type SortMode = 'recent' | 'name' | 'rarity' | 'danger';
type FilterBiome = string | 'All';

export const Gallery: React.FC<GalleryProps> = ({ animals, achievements, onAnimalSelect, onBackToScan, onCompare }) => {
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterBiome, setFilterBiome] = useState<FilterBiome>('All');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<AnimalData[]>([]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  const biomes = useMemo(() => {
    const allBiomes = animals.map(a => a.type);
    return ['All', ...Array.from(new Set(allBiomes))];
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    let result = [...animals];

    // Filter
    if (filterBiome !== 'All') {
      result = result.filter(a => a.type === filterBiome);
    }

    // Sort
    switch (sortMode) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rarity':
        const rarityOrder = { 'Legendario': 5, 'Épico': 4, 'Raro': 3, 'Poco Común': 2, 'Común': 1 };
        result.sort((a, b) => (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0));
        break;
      case 'danger':
        result.sort((a, b) => b.dangerLevel - a.dangerLevel);
        break;
      case 'recent':
      default:
        // Already sorted by recent normally if appended, but let's ensure
        // Assuming discoveredAt is available, or relying on array order (reverse)
        result.reverse(); 
        break;
    }

    return result;
  }, [animals, sortMode, filterBiome]);

  const handleCardClick = (animal: AnimalData) => {
    if (isCompareMode) {
      if (selectedForCompare.find(a => a.name === animal.name)) {
        setSelectedForCompare(prev => prev.filter(a => a.name !== animal.name));
      } else {
        if (selectedForCompare.length < 2) {
          const newSelection = [...selectedForCompare, animal];
          setSelectedForCompare(newSelection);
          
          if (newSelection.length === 2) {
            // Wait a bit to show selection then trigger compare
            setTimeout(() => {
              onCompare(newSelection[0], newSelection[1]);
              setIsCompareMode(false);
              setSelectedForCompare([]);
            }, 500);
          }
        }
      }
    } else {
      onAnimalSelect(animal);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-green-400 font-mono">
      {/* Header */}
      <div className="p-4 border-b border-green-800 bg-green-900/10">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-bold tracking-widest">BASE DE DATOS</h2>
            <p className="text-xs text-green-600">{animals.length} ESPECÍMENES REGISTRADOS</p>
          </div>
          <button
            onClick={onBackToScan}
            className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded text-sm font-bold transition-colors"
          >
            VOLVER
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <select 
            value={sortMode} 
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-black/50 border border-green-700 rounded px-2 py-1 focus:outline-none focus:border-green-400"
          >
            <option value="recent">Recientes</option>
            <option value="name">Nombre</option>
            <option value="rarity">Rareza</option>
            <option value="danger">Peligro</option>
          </select>

          <select 
            value={filterBiome} 
            onChange={(e) => setFilterBiome(e.target.value)}
            className="bg-black/50 border border-green-700 rounded px-2 py-1 focus:outline-none focus:border-green-400"
          >
            {biomes.map(b => <option key={b} value={b}>{b === 'All' ? 'Todos los Biomas' : b}</option>)}
          </select>

          <button
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              setSelectedForCompare([]);
            }}
            className={`px-3 py-1 rounded border transition-colors ml-auto ${
              isCompareMode 
                ? 'bg-yellow-600 text-black border-yellow-400 font-bold animate-pulse' 
                : 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50'
            }`}
          >
            {isCompareMode ? `SELECCIONA 2 (${selectedForCompare.length}/2)` : 'COMPARAR'}
          </button>
        </div>
      </div>

      {/* Achievements Ticker */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-yellow-900/10 border-b border-yellow-900/30 overflow-hidden whitespace-nowrap py-1">
          <div className="animate-marquee inline-block px-4">
            {unlockedAchievements.map(a => (
              <span key={a.id} className="mr-8 text-yellow-500/80 text-xs">
                {a.icon} {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-green-800 scrollbar-track-black">
        {filteredAnimals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="text-4xl mb-2">∅</div>
            <p>NO SE ENCONTRARON REGISTROS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-20">
            {filteredAnimals.map((animal, index) => {
              const isSelected = selectedForCompare.find(a => a.name === animal.name);
              return (
                <div
                  key={`${animal.name}-${index}`}
                  onClick={() => handleCardClick(animal)}
                  className={`
                    relative group rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer
                    ${isSelected 
                      ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-95' 
                      : 'border-green-800/50 hover:border-green-400/80 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                    }
                    ${isCompareMode && !isSelected ? 'opacity-60 hover:opacity-100' : ''}
                  `}
                >
                  <div className="aspect-square bg-black relative">
                    <img 
                      src={getAnimalImage(animal.name)} 
                      alt={animal.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    
                    {/* Overlays */}
                    <div className="absolute top-1 right-1">
                      <Badge type="rarity" value={animal.rarity} className="scale-[0.6] origin-top-right" />
                    </div>
                    
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="font-bold text-sm truncate text-white drop-shadow-md">{animal.name}</h3>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-[10px] text-green-400">{animal.type}</span>
                        <span className="text-xs">{animal.soundEmoji}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
