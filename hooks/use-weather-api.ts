import { useState } from 'react';

// Configuración de la API
const WEATHER_API_KEY = 'acbc26aa8ed6c00f627ba6d7134c35d5'; // Tu API key de OpenWeatherMap
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Coordenadas de San Clemente del Tuyú
const SAN_CLEMENTE_COORDS = {
  lat: -36.3561,
  lon: -56.7250
};

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
    description: string;
  };
  forecast?: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    condition: string;
    description: string;
  }>;
  dates: string;
}

export const useWeatherAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener emoji del clima según el código de OpenWeatherMap
  const getWeatherEmoji = (weatherCode: string, isDay: boolean = true) => {
    const code = weatherCode.toLowerCase();
    
    if (code.includes('clear')) return isDay ? '☀️' : '🌙';
    if (code.includes('cloud')) {
      if (code.includes('few') || code.includes('scattered')) return '⛅';
      return '☁️';
    }
    if (code.includes('rain')) {
      if (code.includes('light')) return '🌦️';
      if (code.includes('heavy')) return '🌧️';
      return '🌧️';
    }
    if (code.includes('thunder')) return '⛈️';
    if (code.includes('snow')) return '❄️';
    if (code.includes('mist') || code.includes('fog')) return '🌫️';
    
    return '🌤️'; // Default
  };

  const fetchCurrentWeather = async (startDate: string, endDate: string): Promise<WeatherData> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🌤️ Obteniendo clima real para San Clemente del Tuyú...');
      
      // Obtener clima actual
      const currentResponse = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${SAN_CLEMENTE_COORDS.lat}&lon=${SAN_CLEMENTE_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
      );

      if (!currentResponse.ok) {
        throw new Error(`Error de API: ${currentResponse.status}`);
      }

      const currentData = await currentResponse.json();

      // Obtener pronóstico de 5 días
      const forecastResponse = await fetch(
        `${WEATHER_BASE_URL}/forecast?lat=${SAN_CLEMENTE_COORDS.lat}&lon=${SAN_CLEMENTE_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
      );

      let forecast = [];
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        // Procesar pronóstico (tomar uno por día)
        forecast = forecastData.list
          .filter((_: any, index: number) => index % 8 === 0) // Cada 24 horas (API da cada 3 horas)
          .slice(0, 5)
          .map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString('es-AR'),
            temp_max: Math.round(item.main.temp_max),
            temp_min: Math.round(item.main.temp_min),
            condition: getWeatherEmoji(item.weather[0].main),
            description: item.weather[0].description
          }));
      }

      const weatherData: WeatherData = {
        location: 'San Clemente del Tuyú, Buenos Aires',
        current: {
          temp: Math.round(currentData.main.temp),
          condition: getWeatherEmoji(currentData.weather[0].main),
          humidity: currentData.main.humidity,
          wind: Math.round(currentData.wind.speed * 3.6), // Convertir m/s a km/h
          description: currentData.weather[0].description
        },
        forecast,
        dates: `${startDate} al ${endDate}`
      };

      console.log('🌤️ Clima obtenido:', weatherData);
      return weatherData;

    } catch (err) {
      console.error('❌ Error obteniendo clima:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Fallback a datos simulados si falla la API
      return {
        location: 'San Clemente del Tuyú, Buenos Aires (Datos simulados)',
        current: {
          temp: Math.floor(18 + Math.random() * 8), // 18-26°C
          condition: ['☀️', '⛅', '☁️', '🌤️'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(50 + Math.random() * 30),
          wind: Math.floor(5 + Math.random() * 20),
          description: 'Datos no disponibles'
        },
        dates: `${startDate} al ${endDate}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchCurrentWeather,
    isLoading,
    error
  };
};