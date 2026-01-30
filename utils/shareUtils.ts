import { AnimalData } from '../types';

export const generateShareCard = async (animal: AnimalData, imageUrl: string | null): Promise<string> => {
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#0f390f'); // Dark green bottom
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, width, height);

  // Header Background
  ctx.fillStyle = '#111';
  ctx.fillRect(20, 20, width - 40, 100);

  // Name
  ctx.font = 'bold 50px "Courier New", monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(animal.name.toUpperCase(), width / 2, 80);

  // Scientific Name
  ctx.font = 'italic 25px "Courier New", monospace';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(animal.scientificName, width / 2, 110);

  // Image
  if (imageUrl) {
    try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
        });

        // Draw image with rounded corners effect (clip)
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
             ctx.roundRect(50, 150, 500, 350, 20);
        } else {
             ctx.rect(50, 150, 500, 350);
        }
        ctx.clip();
        ctx.drawImage(img, 50, 150, 500, 350);
        ctx.restore();
        
        // Border for image
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
             ctx.roundRect(50, 150, 500, 350, 20);
        } else {
             ctx.rect(50, 150, 500, 350);
        }
        ctx.stroke();

    } catch (e) {
        console.warn("Could not load image for share card", e);
        // Fallback rectangle
        ctx.fillStyle = '#333';
        ctx.fillRect(50, 150, 500, 350);
        ctx.fillStyle = '#555';
        ctx.font = '30px monospace';
        ctx.fillText("IMAGEN NO DISPONIBLE", width/2, 325);
    }
  }

  // Rarity Badge
  const rarityColors: Record<string, string> = {
    'Común': '#9ca3af',
    'Poco Común': '#22c55e',
    'Raro': '#3b82f6',
    'Épico': '#a855f7',
    'Legendario': '#f59e0b'
  };
  const rarityColor = rarityColors[animal.rarity] || '#fff';
  
  ctx.fillStyle = rarityColor;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(animal.rarity.toUpperCase(), width / 2, 550);

  // Biome
  ctx.fillStyle = '#fff';
  ctx.font = '25px monospace';
  ctx.fillText(`BIOMA: ${animal.type.toUpperCase()}`, width / 2, 590);

  // Stats (Bars)
  const drawStatBar = (label: string, value: number, y: number, color: string) => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, 80, y);

    // Bar background
    ctx.fillStyle = '#333';
    ctx.fillRect(250, y - 20, 270, 25);

    // Bar fill
    ctx.fillStyle = color;
    ctx.fillRect(250, y - 20, (value / 100) * 270, 25);
    
    // Value text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(value.toString(), 510, y);
  };

  drawStatBar('VELOCIDAD', animal.stats.speed, 650, '#3b82f6');
  drawStatBar('FUERZA', animal.stats.strength, 690, '#ef4444');
  drawStatBar('INTELIGENCIA', animal.stats.intelligence, 730, '#a855f7');

  // Danger Level
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 25px monospace';
  ctx.fillText(`PELIGRO: ${animal.dangerLevel}/10`, width / 2, 780);

  // Footer
  ctx.fillStyle = '#666';
  ctx.font = '20px monospace';
  ctx.fillText('GENERADO POR ANIMALDEX', width / 2, 850);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('animaldex-gemini.vercel.app', width / 2, 880);

  return canvas.toDataURL('image/png');
};
