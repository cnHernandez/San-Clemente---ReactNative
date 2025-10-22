import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePhotoStorage, SavedPhoto } from '@/hooks/use-photo-storage';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 columnas con espaciado

export default function PhotosGalleryScreen() {
  const { photos, isLoading, deletePhoto, loadPhotos, clearAllPhotos } = usePhotoStorage();
  const [selectedPhoto, setSelectedPhoto] = useState<SavedPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar fotos cuando se enfoque la pantalla
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Pantalla galería enfocada, cargando fotos...');
      loadPhotos();
    }, [loadPhotos])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refrescando galería manualmente...');
    await loadPhotos();
    setRefreshing(false);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePhoto(photoId);
            if (success) {
              if (selectedPhoto && selectedPhoto.id === photoId) {
                setSelectedPhoto(null);
              }
            } else {
              Alert.alert('Error', 'No se pudo eliminar la foto');
            }
          },
        },
      ]
    );
  };

  const handleClearAllPhotos = () => {
    Alert.alert(
      'Limpiar todas las fotos',
      '¿Estás seguro de que quieres eliminar TODAS las fotos de la galería? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar Todas',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllPhotos();
            if (success) {
              setSelectedPhoto(null);
              Alert.alert('Éxito', 'Todas las fotos han sido eliminadas');
            } else {
              Alert.alert('Error', 'No se pudieron eliminar las fotos');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  };

  const PhotoItem = ({ photo }: { photo: SavedPhoto }) => (
    <TouchableOpacity
      style={styles.photoContainer}
      onPress={() => setSelectedPhoto(photo)}
      onLongPress={() => handleDeletePhoto(photo.id)}
    >
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoUser}>{photo.userName}</Text>
        <Text style={styles.photoTime}>{formatTimeAgo(photo.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const PhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalContent}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />
            <View style={styles.modalInfo}>
              <Text style={styles.modalUser}>Foto de: {selectedPhoto.userName}</Text>
              <Text style={styles.modalTime}>{formatTimeAgo(selectedPhoto.timestamp)}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(selectedPhoto.id)}
              >
                <IconSymbol name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <IconSymbol name="xmark" size={20} color="#fff" />
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
      <ImageBackground
        source={require('@/assets/parqueMunicipal.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="photo.fill" size={28} color="#1976D2" />
          <Text style={styles.title}>Galería de San Clemente</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              console.log('Manual refresh triggered');
              loadPhotos();
            }}
          >
            <IconSymbol name="arrow.clockwise" size={24} color="#1976D2" />
          </TouchableOpacity>
          {photos.length > 0 && (
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: '#ffebee' }]}
              onPress={handleClearAllPhotos}
            >
              <IconSymbol name="trash" size={24} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.subtitle}>
        Fotos compartidas por nuestros huéspedes
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando fotos...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
              tintColor={'#FF6B35'}
            />
          }
        >
          {photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <PhotoItem key={photo.id} photo={photo} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="camera.fill" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay fotos aún
              </Text>
              <Text style={styles.emptySubtext}>
                Ve a la pestaña principal para subir tus primeras fotos de San Clemente
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <PhotoModal />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  photoContainer: {
    width: imageSize,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  photoImage: {
    width: '100%',
    height: imageSize,
  },
  photoInfo: {
    padding: 8,
  },
  photoUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  photoTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  emptyMessage: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalInfo: {
    padding: 15,
  },
  modalUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Overlay más transparente
  },
});