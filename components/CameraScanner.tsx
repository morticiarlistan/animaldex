import React, { useRef, useState, useEffect } from 'react';
import { SoundService } from '../services/soundService';

interface CameraScannerProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isScanning: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose, isScanning }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      setHasCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se puede acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = imageData.split(',')[1]; // Remove data URL prefix
    
    // Play shutter sound
    SoundService.playShutter();
    
    onCapture(base64Data);
  };

  return (
    <div className="camera-overlay">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Camera Feed */}
        {hasCamera && !error && (
          <div className="relative max-w-md w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded-lg border-2 border-green-500"
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <>
                {/* Red laser scan line */}
                <div className="scan-line"></div>
                
                {/* Scanning text */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-yellow-400 font-['VT323'] text-xl animate-pulse">
                    IDENTIFICANDO...
                  </p>
                </div>
              </>
            )}
            
            {/* Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="crosshairs">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-xs font-mono">
                  TARGET
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <p className="text-green-400 text-sm">
              Permite el acceso a la cámara en tu navegador para usar el escáner.
            </p>
          </div>
        )}

        {/* Loading State */}
        {!hasCamera && !error && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-green-400 text-lg">Iniciando cámara...</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          {hasCamera && !isScanning && (
            <button
              onClick={captureImage}
              className="px-6 py-3 bg-red-600 text-white rounded-full border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all font-bold text-lg hover:bg-red-500"
            >
              📷 ESCANEAR
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-full border-b-4 border-gray-800 active:border-b-0 active:translate-y-1 transition-all font-bold hover:bg-gray-500"
          >
            CERRAR
          </button>
        </div>

        {/* Instructions */}
        {hasCamera && !isScanning && (
          <div className="absolute top-8 left-0 right-0 text-center">
            <p className="text-green-400 font-['VT323'] text-lg">
              Apunta la cámara hacia un animal y presiona ESCANEAR
            </p>
          </div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};