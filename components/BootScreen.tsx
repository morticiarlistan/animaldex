import React, { useState, useEffect } from 'react';
import { SoundService } from '../services/soundService';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showAscii, setShowAscii] = useState(false);

  const bootMessages = [
    'INICIANDO SISTEMA ANIMALDEX OS v2.0...',
    'CARGANDO BASE DE DATOS BIOLÓGICA...',
    'CALIBRANDO SENSORES DE RECONOCIMIENTO...',
    'INICIALIZANDO MÓDULO DE VOZ...',
    'CONECTANDO CON GEMINI AI...',
    'ACTIVANDO MODO DE EXPLORACIÓN...',
    'SISTEMA LISTO PARA OPERACIÓN'
  ];

  useEffect(() => {
    const startBoot = async () => {
      // Initialize sound system
      await SoundService.init();
      
      // Play boot sound
      setTimeout(() => {
        SoundService.playBootSequence();
      }, 500);
      
      // Show ASCII art after a delay
      setTimeout(() => {
        setShowAscii(true);
      }, 800);

      // Progress animation
      let currentProgress = 0;
      let messageIndex = 0;
      
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5; // Random progress jumps
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          setCurrentMessage('SISTEMA LISTO PARA OPERACIÓN');
          
          setTimeout(() => {
            clearInterval(interval);
            onBootComplete();
          }, 1000);
          
          return;
        }
        
        setProgress(currentProgress);
        
        // Update message
        const newMessageIndex = Math.floor((currentProgress / 100) * bootMessages.length);
        if (newMessageIndex !== messageIndex && newMessageIndex < bootMessages.length) {
          messageIndex = newMessageIndex;
          setCurrentMessage(bootMessages[messageIndex]);
        }
      }, 300);
    };

    startBoot();
  }, [onBootComplete]);

  const asciiArt = `
    ╔═══════════════════════════════════╗
    ║      █████  ███    ██ ██ ███     ║
    ║      ██   ██ ████   ██ ██ ████    ║
    ║      ███████ ██ ██  ██ ██ ██ ██   ║
    ║      ██   ██ ██  ██ ██ ██ ██  ██  ║
    ║      ██   ██ ██   ████ ██ ██   ██ ║
    ║                                   ║
    ║      ██████  ███████ ██   ██      ║
    ║      ██   ██ ██       ██ ██       ║
    ║      ██   ██ █████     ███        ║
    ║      ██   ██ ██       ██ ██       ║
    ║      ██████  ███████ ██   ██      ║
    ╚═══════════════════════════════════╝
  `;

  return (
    <div className="boot-screen">
      {/* Background particles */}
      <div className="particles-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main boot content */}
      <div className="z-10 text-center">
        {/* ASCII Art Animal Logo */}
        {showAscii && (
          <div className="ascii-art mb-8">
            <pre>{asciiArt}</pre>
          </div>
        )}

        {/* System Title */}
        <h1 className="text-4xl md:text-6xl font-['Press_Start_2P'] mb-8 text-green-400">
          ANIMALDEX OS
        </h1>
        
        <h2 className="text-xl md:text-2xl font-['VT323'] mb-12 text-green-300">
          v2.0 ADVANCED BIOLOGICAL SCANNER
        </h2>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-2xl font-mono mb-6 text-green-400">
          {Math.floor(progress)}%
        </div>

        {/* Boot Messages */}
        <div className="h-16 flex items-center justify-center">
          <p className="text-green-300 font-['VT323'] text-xl animate-pulse">
            {currentMessage}
          </p>
        </div>

        {/* Blinking cursor */}
        <div className="mt-4">
          <span className="text-green-400 text-2xl animate-pulse font-mono">█</span>
        </div>
      </div>

      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="crt-screen w-full h-full"></div>
      </div>
    </div>
  );
};