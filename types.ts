export interface AnimalStats {
  height: string;
  weight: string;
  lifespan: string;
  speed: number; // 1-100
  strength: number; // 1-100
  intelligence: number; // 1-100
}

export interface AnimalData {
  name: string;
  scientificName: string;
  category: string; // e.g., Mammal, Reptile
  diet: string;
  habitat: string;
  description: string; // The text aimed for the Pokedex to read
  stats: AnimalStats;
  funFact: string;
  // New expanded fields
  type: string; // Biome: Selva, Océano, Desierto, Ártico, Sabana, Bosque, Montaña, Urbano
  rarity: 'Común' | 'Poco Común' | 'Raro' | 'Épico' | 'Legendario';
  dangerLevel: number; // 1-10
  conservationStatus: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX'; // Least Concern to Extinct
  soundEmoji: string; // Animal sound representation
  evolutionChain?: string[]; // Names of related animals (e.g., ["Wolf", "Dog"])
  discoveredAt?: Date; // When discovered by user
}

export enum AppState {
  BOOT = 'BOOT',
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
  CAMERA = 'CAMERA',
  GALLERY = 'GALLERY',
  COMPARE = 'COMPARE'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface CollectionData {
  discoveredAnimals: AnimalData[];
  achievements: Achievement[];
  searchHistory: string[];
}
