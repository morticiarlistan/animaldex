import React, { useState, useEffect, useRef } from 'react';
import { PokedexScreen } from './components/PokedexScreen';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { BootScreen } from './components/BootScreen';
import { CompareScreen } from './components/CompareScreen';
import { AnimalData, AppState, Achievement } from './types';
import { identifyAnimal, generatePokedexSpeech, getDailyDiscovery } from './services/pokedexService';
import { decodeBase64, decodeAudioData } from './utils/audioUtils';
import { CollectionService } from './services/collectionService';
import { SoundService } from './services/soundService';
import { useSwipe } from './utils/useSwipe';
import { generateShareCard } from './utils/shareUtils';

// Image placeholder utility
const getAnimalImage = (query: string) => {
  return `https://picsum.photos/seed/${query}/400/400`;
};

const App: React.FC = () => {
  const [data, setData] = useState<AnimalData | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.BOOT);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [discoveredAnimals, setDiscoveredAnimals] = useState<AnimalData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(-1);
  const [showGallery, setShowGallery] = useState(false);
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [dailyDiscovery, setDailyDiscovery] = useState<string | null>(null);
  
  // Compare state
  const [compareData, setCompareData] = useState<{ a: AnimalData, b: AnimalData } | null>(null);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => handleNavigate('next'),
    onSwipeRight: () => handleNavigate('prev'),
  });

  const handleShare = async () => {
    if (!data) return;
    
    SoundService.playClick();
    try {
      const dataUrl = await generateShareCard(data, currentImage);
      
      const link = document.createElement('a');
      link.download = `animaldex-${data.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      SoundService.playAchievement();
    } catch (error) {
      console.error('Error generating share card:', error);
      SoundService.playError();
    }
  };

  // Particle effect
  useEffect(() => {
    const createParticles = () => {
      const container = document.querySelector('.particles-container');
      if (!container) return;

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.style.left = Math.random() * 100 + '%';
          particle.style.animationDelay = Math.random() * 2 + 's';
          particle.style.animationDuration = (8 + Math.random() * 4) + 's';
          container.appendChild(particle);
          
          setTimeout(() => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 12000);
        }, Math.random() * 1000);
      }
    };

    const particleInterval = setInterval(createParticles, 3000);
    return () => clearInterval(particleInterval);
  }, []);

  // Load collection data on startup
  useEffect(() => {
    if (!showBootScreen) {
      const collection = CollectionService.getCollection();
      setDiscoveredAnimals(collection.discoveredAnimals);
      setAchievements(collection.achievements);
      setSearchHistory(collection.searchHistory);
      
      // Daily Discovery Check
      const daily = getDailyDiscovery();
      const lastCheck = localStorage.getItem('lastDailyCheck');
      const today = new Date().toDateString();
      
      if (lastCheck !== today) {
        setDailyDiscovery(daily);
        localStorage.setItem('lastDailyCheck', today);
        setTimeout(() => SoundService.playDiscovery(), 1000);
      }
    }
  }, [showBootScreen]);

  useEffect(() => {
    // Initialize AudioContext on user interaction if needed
    return () => {
      stopAudio();
    };
  }, []);

  // Achievement display timeout
  useEffect(() => {
    if (recentAchievements.length > 0) {
      const timer = setTimeout(() => {
        setRecentAchievements([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentAchievements]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
      audioSourceRef.current = null;
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      stopAudio();

      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        if (appState === AppState.SPEAKING) {
          setAppState(AppState.IDLE);
        }
      };

      source.start(0);
      audioSourceRef.current = source;

    } catch (error) {
      console.error("Audio playback error:", error);
      setAppState(AppState.IDLE);
    }
  };

  const handleBootComplete = () => {
    setShowBootScreen(false);
    setAppState(AppState.IDLE);
  };

  const handleSearch = async (query: string, discoveryMethod: 'search' | 'voice' | 'camera' = 'search') => {
    stopAudio();
    setAppState(AppState.ANALYZING);
    setData(null);
    setCurrentImage(null);
    setShowGallery(false);
    setCompareData(null); // Clear compare if searching

    // Play scan sound
    SoundService.playScanBeep();

    try {
      // 1. Get Data
      const animalData = await identifyAnimal(query);
      
      // Add discoveredAt timestamp
      animalData.discoveredAt = new Date();
      
      setData(animalData);
      setCurrentImage(getAnimalImage(animalData.name));
      
      // 2. Update collection and check for achievements
      const { newAnimal, achievements: newAchievements } = CollectionService.addDiscoveredAnimal(animalData, discoveryMethod);
      
      if (newAnimal) {
        SoundService.playDiscovery();
      }
      
      if (newAchievements.length > 0) {
        setRecentAchievements(newAchievements);
        SoundService.playAchievement();
      }
      
      // 3. Refresh collection data
      const updatedCollection = CollectionService.getCollection();
      setDiscoveredAnimals(updatedCollection.discoveredAnimals);
      setAchievements(updatedCollection.achievements);
      setSearchHistory(updatedCollection.searchHistory);
      
      // 4. Update current animal index
      const animalIndex = updatedCollection.discoveredAnimals.findIndex(a => 
        a.name.toLowerCase() === animalData.name.toLowerCase()
      );
      setCurrentAnimalIndex(animalIndex);
      
      // 5. Generate Speech
      setAppState(AppState.SPEAKING);
      const audioBase64 = await generatePokedexSpeech(animalData.description);
      
      if (audioBase64) {
        await playAudio(audioBase64);
      } else {
        setAppState(AppState.IDLE);
      }
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      SoundService.playError();
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const handleCameraCapture = async (animalData: AnimalData) => {
    await handleSearch(animalData.name, 'camera');
    // The animal data is already processed in the camera scanner
    setData(animalData);
    setCurrentImage(getAnimalImage(animalData.name));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (discoveredAnimals.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentAnimalIndex <= 0 ? discoveredAnimals.length - 1 : currentAnimalIndex - 1;
    } else {
      newIndex = currentAnimalIndex >= discoveredAnimals.length - 1 ? 0 : currentAnimalIndex + 1;
    }
    
    setCurrentAnimalIndex(newIndex);
    const animal = discoveredAnimals[newIndex];
    setData(animal);
    setCurrentImage(getAnimalImage(animal.name));
    setAppState(AppState.IDLE);
  };

  const handleAnimalSelect = (animal: AnimalData) => {
    SoundService.playClick();
    setData(animal);
    setCurrentImage(getAnimalImage(animal.name));
    setShowGallery(false);
    setAppState(AppState.IDLE);
    
    const index = discoveredAnimals.findIndex(a => a.name === animal.name);
    setCurrentAnimalIndex(index);
  };

  const handleCompare = (a1: AnimalData, a2: AnimalData) => {
    setCompareData({ a: a1, b: a2 });
    setAppState(AppState.COMPARE);
    setShowGallery(false);
  };

  const handleToggleGallery = () => {
    SoundService.playNavigation();
    if (appState === AppState.COMPARE) {
      setAppState(AppState.GALLERY);
      setCompareData(null);
    }
    setShowGallery(!showGallery);
  };

  if (showBootScreen) {
    return <BootScreen onBootComplete={handleBootComplete} />;
  }

  return (
    <div 
      className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans"
      {...swipeHandlers}
    >
      
      {/* Background Particles */}
      <div className="particles-container"></div>

      {/* Daily Discovery Toast */}
      {dailyDiscovery && (
        <div className="fixed top-4 left-4 z-50 animate-bounce cursor-pointer" onClick={() => {
          handleSearch(dailyDiscovery);
          setDailyDiscovery(null);
        }}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <div className="text-[10px] uppercase font-bold opacity-80">Descubrimiento Diario</div>
              <div className="font-bold text-sm">¿Conoces al {dailyDiscovery}?</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Notifications */}
      {recentAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
          {recentAchievements.map(achievement => (
            <div key={achievement.id} className="konami-unlock bg-yellow-600 text-black p-3 rounded-lg border-2 border-yellow-800 shadow-lg animate-slide-in">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <div className="font-bold text-sm">{achievement.name}</div>
                  <div className="text-xs opacity-80">{achievement.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pokedex Case */}
      <div className="max-w-4xl w-full bg-red-600 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-red-400 relative flex flex-col md:flex-row overflow-hidden transition-all duration-500 ease-in-out">
        
        {/* Enhanced Hinge with better Gen 1 styling */}
        <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-8 pokedex-hinge rounded-lg z-20 border-l border-r border-red-900">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>

        {/* Left Panel: Screen */}
        <div className="flex-1 p-6 sm:p-8 md:pr-10 border-b-8 md:border-b-0 md:border-r-8 border-red-800 relative bg-red-600">
           {/* Big Blue LED with enhanced styling */}
           <div className="absolute top-4 left-4 sm:left-8 z-30">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-200 bg-blue-500 shadow-lg ${appState === AppState.ANALYZING || appState === AppState.SPEAKING ? 'blinking-led' : 'shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}`}>
                 <div className="w-6 h-6 bg-white/40 rounded-full absolute top-3 left-3 blur-sm"></div>
              </div>
           </div>

           {/* Enhanced LED array */}
           <div className="absolute top-6 left-24 sm:left-32 flex gap-2 z-30">
             <div className={`w-3 h-3 bg-red-500 rounded-full border border-red-800 ${appState === AppState.ERROR ? 'animate-pulse' : ''}`}></div>
             <div className={`w-3 h-3 bg-yellow-400 rounded-full border border-yellow-800 ${appState === AppState.ANALYZING ? 'animate-pulse' : ''}`}></div>
             <div className={`w-3 h-3 bg-green-500 rounded-full border border-green-800 ${appState === AppState.IDLE ? 'animate-pulse' : ''}`}></div>
           </div>

           {/* Screen Container */}
           <div className="mt-16 sm:mt-20 h-[400px] sm:h-[500px] bg-white rounded-b-xl rounded-t-lg p-0 shadow-lg relative overflow-hidden">
              {showGallery ? (
                <Gallery
                  animals={discoveredAnimals}
                  achievements={achievements}
                  onAnimalSelect={handleAnimalSelect}
                  onBackToScan={() => setShowGallery(false)}
                  onCompare={handleCompare}
                />
              ) : appState === AppState.COMPARE && compareData ? (
                <CompareScreen 
                  animal1={compareData.a} 
                  animal2={compareData.b} 
                  onClose={() => {
                    setAppState(AppState.GALLERY);
                    setShowGallery(true);
                  }}
                />
              ) : (
                <PokedexScreen 
                  data={data} 
                  state={appState} 
                  imageUrl={currentImage} 
                  searchHistory={searchHistory}
                />
              )}
           </div>

           {/* Decorative Vents with enhanced styling */}
           <div className="absolute bottom-4 right-8 flex gap-2">
             {Array.from({length: 5}).map((_, i) => (
               <div key={i} className="w-1 h-6 bg-red-900 rounded-full"></div>
             ))}
           </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="flex-1 p-6 sm:p-8 md:pl-10 bg-red-600 relative">
           <div className="h-full flex flex-col">
              {/* Enhanced Terminal Display */}
              <div className="bg-black text-green-500 font-['VT323'] p-4 rounded mb-6 text-xl border-4 border-gray-700 shadow-md h-32 overflow-hidden relative">
                {/* CRT effect on terminal too */}
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none"></div>
                
                <p>{appState === AppState.IDLE ? "> SISTEMA OPERATIVO v2.1" : ""}</p>
                <p>{appState === AppState.ANALYZING ? "> ESCANEANDO OBJETIVO..." : ""}</p>
                <p>{appState === AppState.SPEAKING ? "> SINTETIZANDO VOZ..." : ""}</p>
                <p>{appState === AppState.CAMERA ? "> MODO CÁMARA ACTIVO" : ""}</p>
                <p>{appState === AppState.GALLERY ? "> MODO COLECCIÓN" : ""}</p>
                <p>{appState === AppState.COMPARE ? "> MODO COMPARACIÓN" : ""}</p>
                <p>{appState === AppState.ERROR ? "> ERROR CRÍTICO DETECTADO" : ""}</p>
                {data && appState !== AppState.COMPARE && <p className="mt-2 text-white text-sm">{'>'} {data.scientificName}</p>}
                {discoveredAnimals.length > 0 && !showGallery && appState !== AppState.COMPARE && (
                  <p className="mt-1 text-cyan-400 text-xs">{'>'} USE ← → PARA NAVEGAR</p>
                )}
              </div>

              <div className="flex-1">
                 <Controls 
                   onSearch={(query) => handleSearch(query, 'search')}
                   onCameraCapture={handleCameraCapture}
                   onToggleGallery={handleToggleGallery}
                   isLoading={appState === AppState.ANALYZING || appState === AppState.SPEAKING} 
                   discoveryCount={discoveredAnimals.length}
                   currentAnimal={data}
                   onNavigate={handleNavigate}
                   onShare={handleShare}
                 />
              </div>
           </div>
        </div>

      </div>
      
      {/* Enhanced Footer Credits */}
      <div className="absolute bottom-2 text-gray-600 text-xs font-mono">
        POWERED BY GEMINI 3.0 FLASH & 2.5 TTS • ANIMALDEX OS v2.1
      </div>
    </div>
  );
};

export default App;