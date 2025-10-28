import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  ImageBackground,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePhotoStorage } from '@/hooks/use-photo-storage';
import { useWeatherAPI, ForecastDay } from '@/hooks/use-weather-api-fixed';
import Attractions from '@/components/Attractions';

const { width, height } = Dimensions.get('window');

// Imágenes del carrusel de la propiedad
const propertyImages = [
  require('@/assets/imagen1.jpeg'),
  require('@/assets/imagen2.jpeg'),
  require('@/assets/imagen3.jpeg'),
  require('@/assets/imagen4.jpeg'),
  require('@/assets/imagen5.jpeg'),
  require('@/assets/imagen6.jpeg'),
  require('@/assets/imagen7.jpeg'),
  require('@/assets/imagen8.jpeg'),
  require('@/assets/imagen9.jpeg'),
  require('@/assets/imagen10.jpeg'),
  require('@/assets/imagen11.jpeg'),
  require('@/assets/imagen12.jpeg'),
  require('@/assets/imagen13.jpeg'),
  require('@/assets/imagen14.jpeg'),
  require('@/assets/imagen15.jpeg'),
  require('@/assets/imagen16.jpeg'),
];

// Ícono de WhatsApp
const whatsappIcon = require('@/assets/whatsapp-icon.png');

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState('');
  const [inputUserName, setInputUserName] = useState('');
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { savePhoto: savePhotoToStorage } = usePhotoStorage();
  const { fetchCurrentWeather, isLoading: weatherLoading, error: weatherError } = useWeatherAPI();

  // Función para formatear fecha automáticamente DD/MM/AAAA
  const formatDateInput = (text: string) => {
    // Remover todo lo que no sean números
    const numbers = text.replace(/\D/g, '');
    
    // Formatear según la longitud
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else {
      // Limitar a 8 dígitos máximo
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Función para obtener fecha formateada para mostrar en el picker
  const parseDate = (dateString: string): Date => {
    if (!dateString || dateString.length < 10) {
      return new Date();
    }
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Función para formatear fecha del picker a string DD/MM/AAAA
  const formatDateFromPicker = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  // Handlers para los date pickers
  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate && event.type === 'set') {
      const formattedDate = formatDateFromPicker(selectedDate);
      setStartDate(formattedDate);
      console.log('📅 Fecha desde seleccionada:', formattedDate);
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate && event.type === 'set') {
      const formattedDate = formatDateFromPicker(selectedDate);
      setEndDate(formattedDate);
      console.log('📅 Fecha hasta seleccionada:', formattedDate);
    }
  };

  // Effect para mostrar el clima automáticamente cuando se ingresan fechas válidas
  useEffect(() => {
    const checkAndShowWeather = async () => {
      try {
        console.log('🔍 Verificando fechas:', { startDate, endDate });
        
        if (startDate && endDate && startDate.length >= 10 && endDate.length >= 10) {
          // Validación básica de formato DD/MM/AAAA
          const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
          
          if (dateRegex.test(startDate) && dateRegex.test(endDate)) {
            console.log('✅ Fechas válidas, obteniendo clima real...');
            
            try {
              const weather = await fetchCurrentWeather(startDate, endDate);
              setWeatherData(weather);
              setShowWeather(true);
              console.log('✅ Clima obtenido:', weather);
            } catch (error) {
              console.error('❌ Error obteniendo clima:', error);
              setShowWeather(false);
              setWeatherData(null);
            }
          } else {
            console.log('❌ Formato de fecha inválido');
            setShowWeather(false);
            setWeatherData(null);
          }
        } else {
          console.log('⏳ Fechas incompletas, ocultando clima');
          setShowWeather(false);
          setWeatherData(null);
        }
      } catch (error) {
        console.error('❌ Error en checkAndShowWeather:', error);
        setShowWeather(false);
        setWeatherData(null);
      }
    };

    // Debounce: esperar 1.5 segundos después del último cambio
    const timeoutId = setTimeout(checkAndShowWeather, 1500);

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, fetchCurrentWeather]);
  // Funciones para manejo de fotos
  const requestCameraPermissions = async () => {
    if (Platform.OS === 'web') return true;
    
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    return cameraPermission.status === 'granted';
  };

  const openCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        showPhotoActions(photoUri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        showPhotoActions(photoUri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const showPhotoActions = (photoUri: string) => {
    Alert.alert(
      '¡Foto seleccionada!',
      '¿Qué quieres hacer con tu foto?',
      [
        {
          text: 'Guardar en galería',
          onPress: () => askForUserName(photoUri),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const askForUserName = (photoUri: string) => {
    setSelectedPhotoUri(photoUri);
    setInputUserName('');
    setShowNameModal(true);
  };

  const handleSavePhoto = async () => {
    if (inputUserName && inputUserName.trim()) {
      setShowNameModal(false);
      await savePhotoWithName(selectedPhotoUri, inputUserName.trim());
    } else {
      Alert.alert('Error', 'Por favor ingresa un nombre válido');
    }
  };

  const handleCancelModal = () => {
    setShowNameModal(false);
    setSelectedPhotoUri('');
    setInputUserName('');
  };

  const savePhotoWithName = async (photoUri: string, userName: string) => {
    try {
      console.log('💾 Intentando guardar foto con nombre:', userName);
      console.log('📷 URI de la foto:', photoUri.substring(0, 100) + '...');
      
      const success = await savePhotoToStorage(photoUri, userName);
      
      if (success) {
        console.log('✅ Foto guardada exitosamente!');
        Alert.alert(
          '🎉 ¡Foto guardada exitosamente!',
          `Tu foto se ha añadido a la galería de San Clemente.\n\nFotografía de: ${userName}\n\n¡Gracias por compartir tu experiencia!`,
          [
            {
              text: 'Ver en galería',
              onPress: () => {
                console.log('🔄 Navegando a la galería...');
                // Pequeña pausa para asegurar que la foto se guardó
                setTimeout(() => {
                  router.push('/explore');
                }, 200);
              },
            },
            {
              text: 'Continuar',
              style: 'default',
            },
          ]
        );
      } else {
        console.log('❌ Error: No se pudo guardar la foto');
        Alert.alert(
          'Error al guardar',
          'No se pudo guardar tu foto en la galería. Por favor, inténtalo nuevamente.',
          [
            {
              text: 'Reintentar',
              onPress: () => askForUserName(photoUri),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error inesperado guardando foto:', error);
      Alert.alert(
        'Error inesperado',
        'Ocurrió un error al procesar tu foto. Por favor, inténtalo nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => askForUserName(photoUri),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Función para validar formato de fecha DD/MM/AAAA
  const isValidDateFormat = (dateString: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
  };

  // Función para convertir DD/MM/AAAA a formato ISO (AAAA-MM-DD)
  const convertToISODate = (dateString: string): string => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Función para validar que las fechas sean válidas y coherentes
  const validateDates = (start: string, end: string): { isValid: boolean; error?: string } => {
    if (!isValidDateFormat(start) || !isValidDateFormat(end)) {
      return { isValid: false, error: 'Formato de fecha inválido. Use DD/MM/AAAA' };
    }

    const startISO = convertToISODate(start);
    const endISO = convertToISODate(end);
    const startDateObj = new Date(startISO);
    const endDateObj = new Date(endISO);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return { isValid: false, error: 'Fechas inválidas' };
    }

    if (startDateObj < today) {
      return { isValid: false, error: 'La fecha de inicio no puede ser anterior a hoy' };
    }

    if (endDateObj <= startDateObj) {
      return { isValid: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
    }

    return { isValid: true };
  };

  const handleSendWhatsApp = () => {
    if (!name || !startDate || !endDate) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const message = `Consulta de disponibilidad de ${name} desde: ${startDate} hasta: ${endDate}`;
    const phoneNumber = '5491157229652';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado');
        }
      })
      .catch((err) => console.error('Error al abrir WhatsApp:', err));
  };

  const handleCloseWeather = () => {
    setShowWeather(false);
    setWeatherData(null);
  };

  const openWhatsApp = () => {
    const phoneNumber = '5491157229652';
    const url = `whatsapp://send?phone=${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado');
        }
      })
      .catch((err) => console.error('Error al abrir WhatsApp:', err));
  };

  const openGoogleMaps = () => {
    const latitude = -36.3566849;
    const longitude = -56.7200856;
    const label = 'San Clemente del Tuyú';
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
    
    Linking.openURL(url).catch((err) => console.error('Error al abrir Google Maps:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
      <ScrollView style={styles.scrollView}>
        {/* Header/Portada */}
        <ImageBackground
          source={{ uri: 'https://www.portaldelacosta.com.ar/images/portada.jpg' }}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <Text style={styles.headerTitle}>Alquiler en San Clemente</Text>
            <Text style={styles.headerSubtitle}>Consultá sin compromiso!</Text>
            <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
              <Image 
                source={whatsappIcon} 
                style={styles.whatsappIcon}
                resizeMode="contain"
              />
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Carrusel de Imágenes */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.carouselScrollView}
          >
            {propertyImages.map((image, index) => (
              <View style={styles.page} key={index.toString()}>
                <Image source={image} style={styles.carouselImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Atracciones */}
        <View style={styles.attractionsContainer}>
          <Attractions />
        </View>

        {/* Mapa - Botón para abrir Google Maps */}
        <View style={styles.mapContainer}>
          <ImageBackground
            source={{ uri: 'https://www.portaldelacosta.com.ar/images/portada.jpg' }}
            style={styles.mapPlaceholder}
            resizeMode="cover"
          >
            <View style={styles.mapOverlay}>
              <Text style={styles.mapTitle}>📍 Ubicación</Text>
              <Text style={styles.mapSubtitle}>San Clemente del Tuyú</Text>
              <TouchableOpacity style={styles.mapButton} onPress={openGoogleMaps}>
                <Text style={styles.mapButtonText}>Ver en Google Maps</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Sección Compartí tus fotos */}
        <View style={styles.photosSection}>
          <Text style={styles.photosSectionTitle}>📸 Compartí tus fotos</Text>
          <Text style={styles.photosSectionText}>
            ¿Visitaste San Clemente? ¡Captura y comparte tus mejores momentos!
          </Text>
          
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={openCamera}
            >
              <IconSymbol name="camera.fill" size={24} color="#fff" />
              <Text style={styles.photoActionButtonText}>Tomar foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={openGallery}
            >
              <IconSymbol name="photo.fill" size={24} color="#fff" />
              <Text style={styles.photoActionButtonText}>Elegir foto</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.viewGalleryButton} 
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.viewGalleryButtonText}>Ver galería de fotos</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario de Disponibilidad */}
        <ImageBackground
          source={{ uri: 'https://www.portaldelacosta.com.ar/images/portada.jpg' }}
          style={styles.formContainer}
          resizeMode="cover"
        >
          <View style={styles.formOverlay}>
            <Text style={styles.formTitle}>Consulta Disponibilidad</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre:</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#ccc"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Desde (ingresa la fecha y verás el clima):</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={startDate}
                  onChangeText={(text) => {
                    const formattedText = formatDateInput(text);
                    console.log('📅 Fecha desde cambiada:', formattedText);
                    setStartDate(formattedText);
                  }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <IconSymbol name="calendar" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hasta:</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={endDate}
                  onChangeText={(text) => {
                    const formattedText = formatDateInput(text);
                    console.log('📅 Fecha hasta cambiada:', formattedText);
                    setEndDate(formattedText);
                  }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <IconSymbol name="calendar" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            {weatherLoading && (
              <View style={styles.weatherStatusContainer}>
                <Text style={styles.weatherStatusText}>🌤️ Consultando clima para tus fechas...</Text>
              </View>
            )}

            {weatherData && !weatherLoading && (
              <View style={styles.weatherStatusContainer}>
                <Text style={styles.weatherStatusText}>✅ ¡Clima cargado! Revisa la información abajo.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.sendButton} onPress={handleSendWhatsApp}>
              <Text style={styles.sendButtonText}>Enviar Consulta por WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Información del Clima - Versión Simple */}
        {(showWeather || weatherLoading) && (
          <View style={styles.weatherContainer}>
            <View style={styles.weatherHeader}>
              <Text style={styles.weatherTitle}>🌤️ Clima en San Clemente</Text>
              <TouchableOpacity onPress={handleCloseWeather} style={styles.weatherCloseButton}>
                <Text style={styles.weatherCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {weatherLoading ? (
              <View style={styles.weatherLoading}>
                <Text style={styles.weatherLoadingText}>🌤️ Consultando clima...</Text>
              </View>
            ) : weatherData ? (
              <View style={styles.weatherContent}>
                <Text style={styles.weatherLocation}>📍 {weatherData.location}</Text>
                <Text style={styles.weatherDates}>📅 Pronóstico para tu estadía: {weatherData.dates}</Text>
                
                {/* Clima actual */}
                <View style={styles.currentWeatherSection}>
                  <Text style={styles.currentWeatherTitle}>🌤️ Clima actual</Text>
                  <Text style={styles.weatherMain}>{weatherData.current.condition}</Text>
                  <Text style={styles.weatherTemp}>Temperatura: {weatherData.current.temp}°C</Text>
                  <Text style={styles.weatherDetails}>
                    💧 Humedad: {weatherData.current.humidity}% | 💨 Viento: {weatherData.current.wind} km/h
                  </Text>
                </View>

                {/* Pronóstico por días */}
                {weatherData.forecast && weatherData.forecast.length > 0 && (
                  <View style={styles.forecastSection}>
                    <Text style={styles.forecastTitle}>📅 Pronóstico día a día</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                      {weatherData.forecast.map((day: ForecastDay, index: number) => (
                        <View key={index} style={styles.forecastCard}>
                          <Text style={styles.forecastDay}>{day.day}</Text>
                          <Text style={styles.forecastDate}>{day.date.split('/').slice(0, 2).join('/')}</Text>
                          <Text style={styles.forecastIcon}>{day.icon}</Text>
                          <Text style={styles.forecastCondition}>{day.condition.split(' ')[1] || day.condition}</Text>
                          <View style={styles.forecastTemps}>
                            <Text style={styles.forecastTempMax}>{day.temp_max}°</Text>
                            <Text style={styles.forecastTempMin}>{day.temp_min}°</Text>
                          </View>
                          <Text style={styles.forecastHumidity}>💧{day.humidity}%</Text>
                          <Text style={styles.forecastWind}>💨{day.wind}km/h</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <Text style={styles.weatherTip}>🏖️ ¡Perfecto para disfrutar San Clemente!</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Consultá sin compromiso!</Text>
          <TouchableOpacity onPress={openWhatsApp} style={styles.footerWhatsappButton}>
            <Image 
              source={whatsappIcon} 
              style={styles.footerWhatsappIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para ingresar nombre */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📸 Nombre para la foto</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa tu nombre para que aparezca en la galería:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Tu nombre aquí..."
              value={inputUserName}
              onChangeText={setInputUserName}
              autoFocus={true}
              maxLength={30}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSavePhoto}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={parseDate(startDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={parseDate(endDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  headerImage: {
    width: width,
    height: 400,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselContainer: {
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  carouselScrollView: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  attractionsContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  mapContainer: {
    height: 250,
    marginVertical: 0,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  mapSubtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 15,
  },
  mapButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    minHeight: 300,
  },
  formOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'transparent',
    margin: 0,
  },
  calendarButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#333',
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 16,
    marginRight: 15,
  },
  footerWhatsappButton: {
    padding: 5,
  },
  footerWhatsappIcon: {
    width: 40,
    height: 40,
  },
  footerWhatsapp: {
    color: '#25D366',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photosSection: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  photosSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
    textAlign: 'center',
  },
  photosSectionText: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  photosButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  photosButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  photoActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  photoActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  viewGalleryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  viewGalleryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para indicadores de clima
  weatherStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  weatherStatusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Estilos para componente de clima simple
  weatherContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  weatherCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCloseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  weatherLoading: {
    padding: 20,
    alignItems: 'center',
  },
  weatherLoadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  weatherContent: {
    padding: 15,
  },
  weatherLocation: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  weatherMain: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherTemp: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherDates: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  weatherTip: {
    fontSize: 14,
    color: '#4caf50',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  currentWeatherSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  currentWeatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
    textAlign: 'center',
  },
  forecastSection: {
    marginTop: 15,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
    textAlign: 'center',
  },
  forecastScrollView: {
    paddingHorizontal: 5,
  },
  forecastScroll: {
    paddingHorizontal: 5,
  },
  forecastCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 120,
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  forecastDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  forecastIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  forecastTemps: {
    alignItems: 'center',
  },
  forecastMaxTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
  },
  forecastMinTemp: {
    fontSize: 14,
    color: '#1976d2',
  },
  forecastTempMax: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
  },
  forecastTempMin: {
    fontSize: 14,
    color: '#1976d2',
  },
  forecastCondition: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  forecastHumidity: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  forecastWind: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});
