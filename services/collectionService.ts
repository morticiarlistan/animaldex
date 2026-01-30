import { AnimalData, Achievement, CollectionData } from '../types';

const STORAGE_KEY = 'animaldex_collection';
const ACHIEVEMENTS_STORAGE_KEY = 'animaldex_achievements';

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_discovery',
    name: 'Primer Descubrimiento',
    description: 'Descubre tu primer animal',
    icon: '🥇',
    unlocked: false
  },
  {
    id: 'ten_animals',
    name: 'Explorador',
    description: 'Descubre 10 animales diferentes',
    icon: '🔍',
    unlocked: false
  },
  {
    id: 'rare_find',
    name: 'Cazador de Rarezas',
    description: 'Encuentra un animal Raro o superior',
    icon: '💎',
    unlocked: false
  },
  {
    id: 'legendary_find',
    name: 'Leyenda Viviente',
    description: 'Encuentra un animal Legendario',
    icon: '👑',
    unlocked: false
  },
  {
    id: 'ocean_explorer',
    name: 'Explorador Oceánico',
    description: 'Descubre 5 animales del Océano',
    icon: '🌊',
    unlocked: false
  },
  {
    id: 'dangerous_encounter',
    name: 'Encuentro Peligroso',
    description: 'Encuentra un animal con nivel de peligro 8+',
    icon: '⚠️',
    unlocked: false
  },
  {
    id: 'endangered_protector',
    name: 'Protector de Especies',
    description: 'Encuentra un animal en peligro crítico (CR)',
    icon: '🛡️',
    unlocked: false
  },
  {
    id: 'camera_master',
    name: 'Maestro de la Cámara',
    description: 'Descubre 3 animales usando la cámara',
    icon: '📸',
    unlocked: false
  },
  {
    id: 'voice_commander',
    name: 'Comandante de Voz',
    description: 'Descubre 5 animales usando comandos de voz',
    icon: '🎤',
    unlocked: false
  },
  {
    id: 'konami_master',
    name: 'Maestro del Código',
    description: 'Desbloquea la sección secreta',
    icon: '🎮',
    unlocked: false
  }
];

export class CollectionService {
  static getCollection(): CollectionData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      
      const baseData: CollectionData = {
        discoveredAnimals: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        searchHistory: []
      };

      if (stored) {
        const parsed = JSON.parse(stored);
        baseData.discoveredAnimals = parsed.discoveredAnimals || [];
        baseData.searchHistory = parsed.searchHistory || [];
      }

      if (storedAchievements) {
        const achievements = JSON.parse(storedAchievements);
        // Merge with default achievements, keeping unlock status
        baseData.achievements = DEFAULT_ACHIEVEMENTS.map(defaultAchiev => {
          const stored = achievements.find((a: Achievement) => a.id === defaultAchiev.id);
          return stored || defaultAchiev;
        });
      }

      return baseData;
    } catch (error) {
      console.error('Error loading collection:', error);
      return {
        discoveredAnimals: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        searchHistory: []
      };
    }
  }

  static saveCollection(collection: CollectionData): void {
    try {
      const { achievements, ...collectionData } = collection;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectionData));
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  }

  static addDiscoveredAnimal(animal: AnimalData, discoveryMethod: 'search' | 'voice' | 'camera' = 'search'): { newAnimal: boolean; achievements: Achievement[] } {
    const collection = this.getCollection();
    
    // Check if animal already exists
    const existingIndex = collection.discoveredAnimals.findIndex(
      a => a.name.toLowerCase() === animal.name.toLowerCase() ||
           a.scientificName.toLowerCase() === animal.scientificName.toLowerCase()
    );

    let newAnimal = false;
    if (existingIndex === -1) {
      animal.discoveredAt = new Date();
      collection.discoveredAnimals.push(animal);
      newAnimal = true;
    } else {
      // Update existing with latest data but keep discovery date
      const originalDate = collection.discoveredAnimals[existingIndex].discoveredAt;
      collection.discoveredAnimals[existingIndex] = { ...animal, discoveredAt: originalDate };
    }

    // Check for new achievements
    const newAchievements: Achievement[] = [];
    
    if (newAnimal) {
      // First discovery
      this.unlockAchievement(collection, 'first_discovery', newAchievements);
      
      // 10 animals
      if (collection.discoveredAnimals.length >= 10) {
        this.unlockAchievement(collection, 'ten_animals', newAchievements);
      }

      // Rare find
      if (['Raro', 'Épico', 'Legendario'].includes(animal.rarity)) {
        this.unlockAchievement(collection, 'rare_find', newAchievements);
      }

      // Legendary find
      if (animal.rarity === 'Legendario') {
        this.unlockAchievement(collection, 'legendary_find', newAchievements);
      }

      // Ocean explorer
      const oceanAnimals = collection.discoveredAnimals.filter(a => a.type === 'Océano');
      if (oceanAnimals.length >= 5) {
        this.unlockAchievement(collection, 'ocean_explorer', newAchievements);
      }

      // Dangerous encounter
      if (animal.dangerLevel >= 8) {
        this.unlockAchievement(collection, 'dangerous_encounter', newAchievements);
      }

      // Endangered protector
      if (animal.conservationStatus === 'CR') {
        this.unlockAchievement(collection, 'endangered_protector', newAchievements);
      }

      // Camera master (need to track discovery method)
      if (discoveryMethod === 'camera') {
        // This would require tracking discovery methods, simplified for now
        this.unlockAchievement(collection, 'camera_master', newAchievements);
      }

      // Voice commander
      if (discoveryMethod === 'voice') {
        this.unlockAchievement(collection, 'voice_commander', newAchievements);
      }
    }

    this.saveCollection(collection);
    return { newAnimal, achievements: newAchievements };
  }

  private static unlockAchievement(collection: CollectionData, achievementId: string, newAchievements: Achievement[]): void {
    const achievement = collection.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      newAchievements.push(achievement);
    }
  }

  static addSearchTerm(term: string): void {
    const collection = this.getCollection();
    
    // Add to history, avoid duplicates
    const normalizedTerm = term.toLowerCase().trim();
    collection.searchHistory = collection.searchHistory.filter(
      h => h.toLowerCase() !== normalizedTerm
    );
    
    collection.searchHistory.unshift(term);
    
    // Keep only last 20 searches
    collection.searchHistory = collection.searchHistory.slice(0, 20);
    
    this.saveCollection(collection);
  }

  static unlockKonamiCode(): void {
    const collection = this.getCollection();
    const newAchievements: Achievement[] = [];
    this.unlockAchievement(collection, 'konami_master', newAchievements);
    this.saveCollection(collection);
  }

  static getDiscoveryCount(): number {
    return this.getCollection().discoveredAnimals.length;
  }

  static getUnlockedAchievements(): Achievement[] {
    return this.getCollection().achievements.filter(a => a.unlocked);
  }

  static clearCollection(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  }
}