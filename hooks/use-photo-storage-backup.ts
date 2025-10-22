import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SavedPhoto {
  id: string;
  uri: string;
  timestamp: number;
  userName: string;
  isBase64?: boolean;
}

const PHOTOS_STORAGE_KEY = 'san_clemente_photos';

// Memoria simple para la sesión actual
let memoryPhotos: SavedPhoto[] = [];
let sessionPhotos: SavedPhoto[] = [];

// Referencia al storage
const storage = AsyncStorage;

// Función auxiliar para convertir imagen a base64 (para web)
const convertToBase64 = async (uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      canvas.height = (this as HTMLImageElement).naturalHeight;
      canvas.width = (this as HTMLImageElement).naturalWidth;
      ctx.drawImage(this as HTMLImageElement, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataURL);
    };
    img.onerror = reject;
    img.src = uri;
  });
};

export const usePhotoStorage = () => {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading photos...');
      const savedPhotos = await storage.getItem(PHOTOS_STORAGE_KEY);
      
      if (savedPhotos) {
        const photosData = JSON.parse(savedPhotos);
        console.log('Loaded photos from storage:', photosData.length);
        setPhotos(photosData);
      } else {
        console.log('No photos found in storage');
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      // En caso de error, usar memoria de sesión si está disponible
      if (Platform.OS !== 'web' && sessionPhotos.length > 0) {
        console.log('Using session photos as fallback:', sessionPhotos.length);
        setPhotos(sessionPhotos);
      } else {
        setPhotos([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePhoto = async (photoUri: string, userName: string): Promise<boolean> => {
    try {
      console.log('Saving photo:', photoUri);
      
      let finalUri = photoUri;
      let isBase64Flag = false;

      // Para web, intentar convertir a base64
      if (Platform.OS === 'web') {
        try {
          finalUri = await convertToBase64(photoUri);
          isBase64Flag = finalUri.startsWith('data:');
          console.log('Web photo conversion result:', isBase64Flag ? 'base64' : 'original');
        } catch (error) {
          console.warn('Base64 conversion failed, using original URI');
        }
      } else {
        // Para móvil, usar la URI tal como está
        console.log('Mobile: Using original URI');
      }

      const newPhoto: SavedPhoto = {
        id: Date.now().toString(),
        uri: finalUri,
        timestamp: Date.now(),
        userName,
        isBase64: isBase64Flag
      };

      const updatedPhotos = [newPhoto, ...photos];
      await storage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);
      
      console.log('Photo saved successfully. Total photos:', updatedPhotos.length);
      return true;
    } catch (error) {
      console.error('Error saving photo:', error);
      
      // Fallback: al menos mantener en memoria para esta sesión
      if (Platform.OS !== 'web') {
        try {
          const newPhoto: SavedPhoto = {
            id: Date.now().toString(),
            uri: photoUri,
            timestamp: Date.now(),
            userName,
            isBase64: false
          };
          
          const updatedPhotos = [newPhoto, ...photos];
          sessionPhotos = updatedPhotos;
          setPhotos(updatedPhotos);
          
          console.log('Photo saved to session memory as fallback');
          return true;
        } catch (fallbackError) {
          console.error('Complete save failure:', fallbackError);
          return false;
        }
      }
      
      return false;
    }
  };

  const deletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      await storage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);
      
      // También actualizar memoria de sesión en móvil
      if (Platform.OS !== 'web') {
        sessionPhotos = updatedPhotos;
      }
      
      console.log('Photo deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  };

  const clearAllPhotos = async (): Promise<boolean> => {
    try {
      await storage.removeItem(PHOTOS_STORAGE_KEY);
      setPhotos([]);
      
      // También limpiar memoria de sesión
      if (Platform.OS !== 'web') {
        sessionPhotos = [];
      }
      
      console.log('All photos cleared');
      return true;
    } catch (error) {
      console.error('Error clearing photos:', error);
      return false;
    }
  };

  // Cargar fotos al montar el hook
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  return {
    photos,
    isLoading,
    savePhoto,
    deletePhoto,
    clearAllPhotos,
    loadPhotos
  };
};