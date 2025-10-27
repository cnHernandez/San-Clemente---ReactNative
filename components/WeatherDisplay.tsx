import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { WeatherData, WeatherError } from '@/hooks/use-weather';

const { width } = Dimensions.get('window');

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: WeatherError | null;
  onClose: () => void;
  dateRange?: { startDate: string; endDate: string };
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weatherData,
  isLoading,
  error,
  onClose,
  dateRange,
}) => {
  if (!weatherData && !isLoading && !error) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getWeatherEmoji = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sol') || lowerCondition.includes('despejado')) return '☀️';
    if (lowerCondition.includes('nub')) return '☁️';
    if (lowerCondition.includes('parcial')) return '⛅';
    if (lowerCondition.includes('lluv')) return '🌧️';
    if (lowerCondition.includes('tormenta')) return '⛈️';
    if (lowerCondition.includes('viento')) return '💨';
    return '🌤️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌤️ Clima en San Clemente</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando clima...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Error al cargar el clima</Text>
        </View>
      )}

      {weatherData && !isLoading && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
          {/* Clima actual */}
          <View style={styles.currentWeather}>
            <View style={styles.currentHeader}>
              <Text style={styles.locationText}>
                📍 {weatherData.location.name}, {weatherData.location.region}
              </Text>
            </View>
            
            <View style={styles.currentMain}>
              <Text style={styles.weatherEmoji}>
                {getWeatherEmoji(weatherData.current.condition.text)}
              </Text>
              <View style={styles.tempContainer}>
                <Text style={styles.temperature}>{Math.round(weatherData.current.temp_c)}°</Text>
                <Text style={styles.condition}>{weatherData.current.condition.text}</Text>
                <Text style={styles.feelsLike}>
                  Sensación: {Math.round(weatherData.current.feelslike_c)}°
                </Text>
              </View>
            </View>

            <View style={styles.currentDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>💧 Humedad: {weatherData.current.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>💨 Viento: {Math.round(weatherData.current.wind_kph)} km/h</Text>
              </View>
            </View>
          </View>

          {/* Pronóstico por días */}
          {weatherData.forecast && dateRange && (
            <View style={styles.forecastSection}>
              <Text style={styles.forecastTitle}>
                📅 Pronóstico para tu estadía
              </Text>
              
              <View style={styles.forecastGrid}>
                {weatherData.forecast.forecastday.slice(0, 7).map((day, index) => (
                  <View key={index} style={styles.dayCard}>
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                    <Text style={styles.dayEmoji}>
                      {getWeatherEmoji(day.day.condition.text)}
                    </Text>
                    <Text style={styles.dayTemp}>
                      {Math.round(day.day.maxtemp_c)}°/{Math.round(day.day.mintemp_c)}°
                    </Text>
                    <Text style={styles.dayCondition}>{day.day.condition.text}</Text>
                    {day.day.daily_chance_of_rain > 30 && (
                      <Text style={styles.rainChance}>
                        🌧️ {day.day.daily_chance_of_rain}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tips simples */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Para tu visita</Text>
            <View style={styles.tipsList}>
              {weatherData.current.temp_c > 25 && (
                <Text style={styles.tipItem}>🏖️ Ideal para la playa</Text>
              )}
              {weatherData.current.temp_c < 15 && (
                <Text style={styles.tipItem}>🧥 Trae abrigo</Text>
              )}
              <Text style={styles.tipItem}>🌊 ¡Disfruta San Clemente!</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 450,
  },
  scrollContent: {
    maxHeight: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  currentWeather: {
    padding: 15,
  },
  currentHeader: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherEmoji: {
    fontSize: 50,
    marginRight: 15,
  },
  tempContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  condition: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 12,
    color: '#666',
  },
  currentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#333',
  },
  forecastSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    width: (width - 80) / 3, // 3 columnas
    minHeight: 100,
  },
  dayDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  dayEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  dayTemp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dayCondition: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  rainChance: {
    fontSize: 9,
    color: '#2196F3',
  },
  tipsSection: {
    backgroundColor: '#e3f2fd',
    margin: 15,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
});

export default WeatherDisplay;