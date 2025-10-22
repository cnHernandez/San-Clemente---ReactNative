import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPhoto {
  id: string;
  uri: string;
  timestamp: number;
  userName: string;
}

const PHOTOS_STORAGE_KEY = 'san_clemente_photos';

// Memoria simple para la sesión actual (fallback)
let memoryPhotos: SavedPhoto[] = [];

export const usePhotoStorage = () => {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📸 Cargando fotos...');
      
      // Primero intentar AsyncStorage
      const savedPhotos = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
      
      if (savedPhotos) {
        const photosData = JSON.parse(savedPhotos);
        console.log('✅ Fotos cargadas desde AsyncStorage:', photosData.length);
        setPhotos(photosData);
        memoryPhotos = photosData; // Sincronizar memoria
      } else if (memoryPhotos.length > 0) {
        console.log('📦 Usando fotos de memoria:', memoryPhotos.length);
        setPhotos(memoryPhotos);
      } else {
        console.log('📭 No hay fotos guardadas');
        setPhotos([]);
      }
    } catch (error) {
      console.error('❌ Error cargando fotos:', error);
      // Usar memoria como fallback
      if (memoryPhotos.length > 0) {
        console.log('🔄 Fallback: usando fotos de memoria');
        setPhotos(memoryPhotos);
      } else {
        setPhotos([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePhoto = async (photoUri: string, userName: string): Promise<boolean> => {
    try {
      console.log('💾 Guardando foto:', photoUri.substring(0, 50) + '...');
      
      const newPhoto: SavedPhoto = {
        id: Date.now().toString(),
        uri: photoUri,
        timestamp: Date.now(),
        userName
      };

      const updatedPhotos = [newPhoto, ...photos];
      
      // Guardar en memoria primero (siempre funciona)
      memoryPhotos = updatedPhotos;
      setPhotos(updatedPhotos);
      console.log('✅ Foto guardada en memoria. Total:', updatedPhotos.length);
      
      // Intentar guardar en AsyncStorage
      try {
        await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
        console.log('✅ Foto guardada en AsyncStorage también');
      } catch (asyncError) {
        console.warn('⚠️ AsyncStorage falló, pero foto guardada en memoria:', asyncError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando foto:', error);
      return false;
    }
  };

  const deletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      
      // Actualizar memoria
      memoryPhotos = updatedPhotos;
      setPhotos(updatedPhotos);
      
      // Intentar actualizar AsyncStorage
      try {
        await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
        console.log('✅ Foto eliminada de AsyncStorage');
      } catch (asyncError) {
        console.warn('⚠️ AsyncStorage falló al eliminar, pero eliminada de memoria');
      }
      
      console.log('✅ Foto eliminada. Quedan:', updatedPhotos.length);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
      return false;
    }
  };

  const clearAllPhotos = async (): Promise<boolean> => {
    try {
      // Limpiar memoria
      memoryPhotos = [];
      setPhotos([]);
      
      // Limpiar AsyncStorage
      try {
        await AsyncStorage.removeItem(PHOTOS_STORAGE_KEY);
        console.log('✅ Todas las fotos eliminadas de AsyncStorage');
      } catch (asyncError) {
        console.warn('⚠️ AsyncStorage falló al limpiar, pero memoria limpiada');
      }
      
      console.log('🗑️ Todas las fotos eliminadas');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando fotos:', error);
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