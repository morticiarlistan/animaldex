import React, { useState, useRef, useEffect } from 'react';
import { transcribeUserAudio, identifyAnimalFromImage } from '../services/pokedexService';
import { blobToBase64 } from '../utils/audioUtils';
import { SoundService } from '../services/soundService';
import { CollectionService } from '../services/collectionService';
import { AnimalData } from '../types';
import { CameraScanner } from './CameraScanner';

interface ControlsProps {
  onSearch: (query: string) => void;
  onCameraCapture: (animal: AnimalData) => void;
  onToggleGallery: () => void;
  isLoading: boolean;
  discoveryCount: number;
  currentAnimal: AnimalData | null;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onShare?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  onSearch, 
  onCameraCapture, 
  onToggleGallery, 
  isLoading, 
  discoveryCount, 
  currentAnimal,
  onNavigate,
  onShare
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Konami Code Detection
  const [konamiProgress, setKonamiProgress] = useState(0);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Konami Code Detection
      if (e.code === konamiCode[konamiProgress]) {
        setKonamiProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= konamiCode.length) {
            // Konami Code Complete!
            CollectionService.unlockKonamiCode();
            SoundService.playAchievement();
            alert('🎮 ¡CÓDIGO KONAMI ACTIVADO! Sección secreta desbloqueada.');
            return 0;
          }
          return newProgress;
        });
      } else {
        setKonamiProgress(0);
      }

      // Navigation shortcuts
      if (!isLoading && onNavigate) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onNavigate('prev');
          SoundService.playNavigation();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onNavigate('next');
          SoundService.playNavigation();
        }
      }

      // Search shortcut
      if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiProgress, isLoading, inputValue, onNavigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      // Easter egg for MissingNo
      if (inputValue.trim() === '????') {
        SoundService.playError();
        onSearch('????');
        setInputValue('');
        return;
      }

      SoundService.playClick();
      CollectionService.addSearchTerm(inputValue.trim());
      onSearch(inputValue);
      setInputValue('');
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      SoundService.playScanBeep();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process
        handleAudioProcess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setInputValue("🎤 GRABANDO...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setInputValue("ERROR DE MIC");
      SoundService.playError();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcess = async (audioBlob: Blob) => {
    setInputValue("⚡ PROCESANDO...");
    try {
      const base64 = await blobToBase64(audioBlob);
      const text = await transcribeUserAudio(base64);
      
      if (text) {
        setInputValue(text);
        SoundService.playNavigation();
        // Add a small delay so user can see what was transcribed before searching
        setTimeout(() => {
            CollectionService.addSearchTerm(text);
            onSearch(text);
            setInputValue('');
        }, 1000);
      } else {
        setInputValue("🚫 NO ENTENDIDO");
        SoundService.playError();
        setTimeout(() => setInputValue(''), 2000);
      }
    } catch (e) {
      setInputValue("❌ ERROR AUDIO");
      SoundService.playError();
      setTimeout(() => setInputValue(''), 2000);
    }
  };

  const handleCameraClick = () => {
    SoundService.playClick();
    setShowCamera(true);
  };

  const handleCameraCapture = async (imageData: string) => {
    setIsCameraScanning(true);
    try {
      const animalData = await identifyAnimalFromImage(imageData, 'image/jpeg');
      SoundService.playDiscoverySequence();
      onCameraCapture(animalData);
      setShowCamera(false);
    } catch (error) {
      console.error('Error identifying animal from image:', error);
      SoundService.playError();
    } finally {
      setIsCameraScanning(false);
    }
  };

  const handleDpadClick = (direction: 'up' | 'down' | 'left' | 'right' | 'center') => {
    SoundService.playNavigation();
    
    if (direction === 'left' && onNavigate) {
      onNavigate('prev');
    } else if (direction === 'right' && onNavigate) {
      onNavigate('next');
    } else if (direction === 'up') {
      // Toggle gallery
      onToggleGallery();
    }
  };

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-red-600 rounded-lg relative">
        {/* Shadow Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-lg"></div>

        {/* Discovery Counter */}
        <div className="bg-yellow-300 text-black p-2 rounded text-center text-sm font-bold mb-4 relative z-10 border-2 border-yellow-600">
          📚 {discoveryCount}/200 DESCUBIERTOS
        </div>

        {/* Input Area simulating a data entry port */}
        <div className="bg-gray-800 p-4 rounded-lg border-b-4 border-gray-950 shadow-lg mb-6 relative z-10">
          <label className="text-blue-200 text-xs font-['Press_Start_2P'] mb-2 block">ENTRADA DE DATOS</label>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej: León, Águila..."
              disabled={isLoading || isRecording}
              className={`w-full bg-green-900 border-2 border-green-600 text-green-300 font-['VT323'] text-xl px-2 py-1 focus:outline-none focus:border-green-400 uppercase placeholder-green-700/50 ${isRecording ? 'animate-pulse bg-red-900/50 text-red-300' : ''}`}
            />
            
            {/* Mic Button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`px-3 border-b-4 font-bold rounded active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center
                ${isRecording 
                  ? 'bg-red-500 border-red-800 text-white animate-pulse' 
                  : 'bg-yellow-500 border-yellow-800 text-black hover:bg-yellow-400'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Presiona para hablar"
            >
              🎤
            </button>

            {/* Camera Button */}
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={isLoading}
              className={`px-3 border-b-4 font-bold rounded active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center bg-purple-500 border-purple-800 text-white hover:bg-purple-400
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Escanear con cámara"
            >
              📷
            </button>

            {/* Go Button */}
            <button 
              type="submit"
              disabled={isLoading || isRecording}
              className={`px-4 bg-blue-500 border-b-4 border-blue-800 text-white font-bold rounded active:border-b-0 active:translate-y-1 transition-all ${isLoading || isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-400'}`}
            >
              GO
            </button>
          </form>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-5 gap-2 mb-6 relative z-10">
           {/* Share Button */}
           <button 
             className={`bg-green-500 border border-green-600 h-8 rounded shadow-sm hover:bg-green-400 transition-colors active:translate-y-0.5 flex items-center justify-center ${!currentAnimal ? 'opacity-50 cursor-not-allowed' : ''}`}
             onClick={() => currentAnimal && onShare && onShare()}
             disabled={!currentAnimal}
             title="Compartir tarjeta"
           >
             📤
           </button>
           
           {Array.from({ length: 9 }).map((_, i) => (
             <button 
               key={i} 
               className="bg-blue-300 border border-blue-400 h-8 rounded shadow-sm hover:bg-blue-200 transition-colors active:translate-y-0.5"
               onClick={() => SoundService.playClick()}
             ></button>
           ))}
        </div>

        {/* Bottom Controls: D-Pad and Action Buttons */}
        <div className="flex justify-between items-end relative z-10">
           {/* D-Pad */}
           <div className="w-24 h-24 relative">
             <div className="absolute top-0 left-8 w-8 h-24 bg-gray-800 rounded shadow-lg border-r border-b border-black"></div>
             <div className="absolute top-8 left-0 w-24 h-8 bg-gray-800 rounded shadow-lg border-r border-b border-black"></div>
             
             {/* D-Pad buttons */}
             <button 
               className="absolute top-2 left-8 w-8 h-6 bg-gray-700 rounded hover:bg-gray-600 active:bg-gray-500 transition-colors"
               onClick={() => handleDpadClick('up')}
               title="Galería"
             >↑</button>
             <button 
               className="absolute bottom-2 left-8 w-8 h-6 bg-gray-700 rounded hover:bg-gray-600 active:bg-gray-500 transition-colors"
               onClick={() => handleDpadClick('down')}
             >↓</button>
             <button 
               className="absolute top-8 left-2 w-6 h-8 bg-gray-700 rounded hover:bg-gray-600 active:bg-gray-500 transition-colors"
               onClick={() => handleDpadClick('left')}
               title="Animal anterior"
             >←</button>
             <button 
               className="absolute top-8 right-2 w-6 h-8 bg-gray-700 rounded hover:bg-gray-600 active:bg-gray-500 transition-colors"
               onClick={() => handleDpadClick('right')}
               title="Animal siguiente"
             >→</button>
             <button 
               className="absolute top-8 left-8 w-8 h-8 bg-gray-600 rounded-full hover:bg-gray-500 active:bg-gray-400 transition-colors"
               onClick={() => handleDpadClick('center')}
             ></button>
           </div>

           {/* Yellow Data Display and Action Buttons */}
           <div className="flex flex-col gap-2">
             <div className="flex gap-4">
               <button 
                 className="w-12 h-3 bg-red-600 rounded-full border border-red-950 hover:bg-red-500 active:bg-red-400 transition-colors"
                 onClick={() => SoundService.playError()}
               ></button>
               <button 
                 className="w-12 h-3 bg-blue-600 rounded-full border border-blue-950 hover:bg-blue-500 active:bg-blue-400 transition-colors"
                 onClick={onToggleGallery}
                 title="Ver colección"
               ></button>
             </div>
             <div className="bg-yellow-200 border-4 border-yellow-600 w-28 h-16 rounded opacity-80 flex items-center justify-center overflow-hidden">
                <div className="text-black font-mono text-[8px] leading-none opacity-50 w-full px-1 break-words text-center">
                  {isRecording ? "🎤 RECORDING AUDIO INPUT..." : 
                   isCameraScanning ? "📷 SCANNING IMAGE..." :
                   currentAnimal ? `${currentAnimal.name.toUpperCase()}\n${currentAnimal.rarity}` :
                   "SYSTEM READY. SELECT FUNCTION."}
                </div>
             </div>
           </div>
        </div>

        {/* Camera Scanner Overlay */}
        {showCamera && (
          <CameraScanner
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
            isScanning={isCameraScanning}
          />
        )}
    </div>
  );
};