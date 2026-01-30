import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnimalData } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: API_KEY });

// System instruction for the data extraction
const DATA_SYSTEM_INSTRUCTION = `
Eres una enciclopedia de animales estilo Pokedex avanzada con datos científicos extendidos. 
Tu objetivo es identificar animales y proporcionar datos precisos y concisos en formato JSON.
El campo 'description' debe estar escrito en un estilo robótico, enciclopédico pero breve, listo para ser leído por una voz TTS.

CAMPOS REQUERIDOS:
- name: Nombre común en español
- scientificName: Nombre científico correcto
- category: Tipo de animal (Mamífero, Reptil, Ave, Pez, Insecto, etc.)
- diet: Dieta (Carnívoro, Herbívoro, Omnívoro, etc.)
- habitat: Hábitat natural
- description: Descripción robótica para TTS (2-3 oraciones máximo)
- funFact: Dato curioso interesante
- type: Bioma principal - DEBE SER UNO DE: Selva, Océano, Desierto, Ártico, Sabana, Bosque, Montaña, Urbano
- rarity: Rareza - DEBE SER UNO DE: Común, Poco Común, Raro, Épico, Legendario (basado en qué tan fácil es verlos)
- dangerLevel: Nivel de peligro para humanos del 1-10 (1=inofensivo, 10=extremadamente peligroso)
- conservationStatus: Estado de conservación - DEBE SER UNO DE: LC, NT, VU, EN, CR, EW, EX (basado en IUCN)
- soundEmoji: Emoji que representa el sonido que hace (🦁 para rugido, 🐦 para canto, etc.)
- evolutionChain: Array de strings con animales relacionados (ej: ["Lobo", "Perro"])
- stats.height: Altura/longitud típica
- stats.weight: Peso típico
- stats.lifespan: Esperanza de vida
- stats.speed: Velocidad relativa 1-100 (para su tipo de animal)
- stats.strength: Fuerza relativa 1-100 (para su tipo de animal)
- stats.intelligence: Inteligencia relativa 1-100 (para su tipo de animal)

Evita markdown en los valores de texto JSON.
Si no puedes identificar un animal real, inventa datos plausibles pero indica en la descripción que es desconocido.
Idioma de salida: Español.
`;

export const identifyAnimal = async (query: string): Promise<AnimalData> => {
  const animalData = await identifyAnimalBase(query);
  animalData.discoveredAt = new Date();
  return animalData;
};

const identifyAnimalBase = async (query: string): Promise<AnimalData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identifica este animal o busca información sobre: "${query}"`,
      config: {
        systemInstruction: DATA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            category: { type: Type.STRING },
            diet: { type: Type.STRING },
            habitat: { type: Type.STRING },
            description: { type: Type.STRING, description: "Breve resumen estilo enciclopedia para ser leído." },
            funFact: { type: Type.STRING },
            type: { type: Type.STRING, description: "Bioma: Selva, Océano, Desierto, Ártico, Sabana, Bosque, Montaña, Urbano" },
            rarity: { type: Type.STRING, description: "Común, Poco Común, Raro, Épico, Legendario" },
            dangerLevel: { type: Type.NUMBER, description: "Peligro para humanos 1-10" },
            conservationStatus: { type: Type.STRING, description: "LC, NT, VU, EN, CR, EW, EX" },
            soundEmoji: { type: Type.STRING, description: "Emoji del sonido que hace" },
            evolutionChain: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Animales relacionados" },
            stats: {
              type: Type.OBJECT,
              properties: {
                height: { type: Type.STRING },
                weight: { type: Type.STRING },
                lifespan: { type: Type.STRING },
                speed: { type: Type.NUMBER, description: "Velocidad 1-100" },
                strength: { type: Type.NUMBER, description: "Fuerza 1-100" },
                intelligence: { type: Type.NUMBER, description: "Inteligencia 1-100" },
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnimalData;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error identifying animal:", error);
    throw error;
  }
};

export const generatePokedexSpeech = async (text: string): Promise<string | undefined> => {
  try {
    // We add a robotic prefix to make it sound more authentic
    const textToRead = `Entrada de datos. ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: textToRead }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              // 'Fenrir' is usually deeper/more authoritative, good for a "Pokedex"
              voiceName: 'Fenrir' 
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return undefined;
  }
};

export const transcribeUserAudio = async (base64Audio: string, mimeType: string = "audio/webm"): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType
            }
          },
          {
            text: "Escucha el audio y transcribe exactamente el nombre del animal o la pregunta mencionada en Español. Devuelve SOLAMENTE el texto transcrito, sin puntuación adicional."
          }
        ]
      }
    });
    return response.text ? response.text.trim() : undefined;
  } catch (error) {
    console.error("Transcription error:", error);
    return undefined;
  }
};

export const identifyAnimalFromImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<AnimalData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: "Analiza esta imagen e identifica el animal presente. Si hay múltiples animales, enfócate en el más prominente. Si no hay animales visibles, devuelve información sobre un animal 'desconocido' con datos ficticios apropiados."
          }
        ]
      },
      config: {
        systemInstruction: DATA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            category: { type: Type.STRING },
            diet: { type: Type.STRING },
            habitat: { type: Type.STRING },
            description: { type: Type.STRING, description: "Breve resumen estilo enciclopedia para ser leído." },
            funFact: { type: Type.STRING },
            type: { type: Type.STRING, description: "Bioma: Selva, Océano, Desierto, Ártico, Sabana, Bosque, Montaña, Urbano" },
            rarity: { type: Type.STRING, description: "Común, Poco Común, Raro, Épico, Legendario" },
            dangerLevel: { type: Type.NUMBER, description: "Peligro para humanos 1-10" },
            conservationStatus: { type: Type.STRING, description: "LC, NT, VU, EN, CR, EW, EX" },
            soundEmoji: { type: Type.STRING, description: "Emoji del sonido que hace" },
            evolutionChain: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Animales relacionados" },
            stats: {
              type: Type.OBJECT,
              properties: {
                height: { type: Type.STRING },
                weight: { type: Type.STRING },
                lifespan: { type: Type.STRING },
                speed: { type: Type.NUMBER, description: "Velocidad 1-100" },
                strength: { type: Type.NUMBER, description: "Fuerza 1-100" },
                intelligence: { type: Type.NUMBER, description: "Inteligencia 1-100" },
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const animalData = JSON.parse(response.text) as AnimalData;
      animalData.discoveredAt = new Date();
      return animalData;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error identifying animal from image:", error);
    throw error;
  }
};

const DAILY_DISCOVERIES = [
  "Ornitorrinco", "Ajolote", "Narval", "Pangolín", "Quokka", 
  "Okapi", "Dragón de Komodo", "Tardígrado", "Capibara", "Fennec",
  "Pez Borrón", "Equidna", "Aye-aye", "Dugongo", "Oso de agua",
  "Loris Perezoso", "Mantis Orquídea", "Wombat", "Casuario", "Saiga"
];

export const getDailyDiscovery = (): string => {
  // Use the date to pick a consistent animal for the day
  const today = new Date();
  const index = (today.getDate() + today.getMonth() * 31) % DAILY_DISCOVERIES.length;
  return DAILY_DISCOVERIES[index];
};
